import crypto from 'node:crypto';

import { env } from '../../config/env.js';
import { ApiError } from '../../errors/api-error.js';
import { prisma } from '../../prisma/client.js';
import { hashToken } from '../../utils/token-hash.js';
import { decryptQuoteToken, encryptQuoteToken } from '../../utils/token-vault.js';

const productImage = (product) => product.images?.[0]?.mediaAsset?.secureUrl || null;
const tokenForPublic = () => crypto.randomBytes(32).toString('base64url');
const quoteCode = () => `MD-${new Date().toISOString().slice(2, 10).replaceAll('-', '')}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
const serializeNumber = (value) => Number(value?.toString?.() ?? value ?? 0);
const DAILY_QUOTE_LIMIT = 10;

const sessionHashForRequest = (req) => hashToken(`${req?.ip || 'unknown'}\0${String(req?.headers?.['user-agent'] || '').slice(0, 240)}`);
const verifyRecaptcha = async (token, req) => {
  if (!env.quoteCaptchaEnabled) return;
  if (!env.recaptcha.secretKey) throw new ApiError(503, 'Google reCAPTCHA chưa được cấu hình trên máy chủ.');
  if (!token) throw ApiError.unprocessable('Vui lòng hoàn thành Google reCAPTCHA trước khi tạo phiếu.');
  const body = new URLSearchParams({ secret: env.recaptcha.secretKey, response: token });
  if (req?.ip) body.set('remoteip', req.ip);
  let result;
  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body, signal: AbortSignal.timeout(7000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    result = await response.json();
  } catch {
    throw new ApiError(503, 'Không kết nối được Google reCAPTCHA. Vui lòng thử lại sau.');
  }
  const hostname = String(result?.hostname || '').toLowerCase();
  if (!result?.success || (env.recaptcha.allowedHostnames.length && !env.recaptcha.allowedHostnames.includes(hostname))) {
    throw ApiError.unprocessable('Google reCAPTCHA không hợp lệ hoặc đã hết hạn. Vui lòng xác nhận lại.');
  }
};
const quoteResponse = (quote, publicToken) => ({
  quote: serializeQuote(quote),
  publicToken,
  publicPath: `/quote/${publicToken}`,
  publicUrl: env.frontendUrl ? `${env.frontendUrl.replace(/\/$/, '')}/quote/${publicToken}` : null,
});
const serializeQuote = (quote) => ({
  uuid: quote.uuid,
  code: quote.code,
  status: quote.status,
  note: quote.note,
  snapshotTotal: serializeNumber(quote.snapshotTotal),
  subtotal: serializeNumber(quote.snapshotTotal),
  currency: quote.currency,
  messengerOpenedAt: quote.messengerOpenedAt,
  processedAt: quote.processedAt,
  expiresAt: quote.expiresAt,
  createdAt: quote.createdAt,
  items: (quote.items || []).map((item) => ({ uuid: String(item.id), productUuid: item.productUuid, name: item.name, sku: item.sku, unit: item.unit, imageUrl: item.imageUrl, unitPrice: serializeNumber(item.unitPrice), quantity: item.quantity, lineTotal: serializeNumber(item.lineTotal) })),
});

const logEvent = (data) => prisma.interestEvent.create({ data }).catch(() => null);

export const quoteService = {
  async create({ items, note, intent, requestId, recaptchaToken }, req) {
    if (intent !== 'MESSENGER') throw ApiError.unprocessable('Phiếu chỉ được ghi nhận khi khách gửi qua Messenger.');
    await verifyRecaptcha(recaptchaToken, req);

    const existing = await prisma.quote.findUnique({ where: { requestKey: requestId }, include: { items: true } });
    if (existing) {
      if (existing.archivedAt) throw ApiError.conflict('Phiếu này đã được lưu trữ. Vui lòng tạo lại từ giỏ hàng.');
      const existingToken = decryptQuoteToken(existing.publicTokenCiphertext);
      if (!existingToken) throw ApiError.conflict('Không thể khôi phục link phiếu đã tạo.');
      return quoteResponse(existing, existingToken);
    }

    const sessionHash = sessionHashForRequest(req);
    const recentCount = await prisma.interestEvent.count({ where: { eventType: 'QUOTE_CREATED', sessionHash, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } });
    if (recentCount >= DAILY_QUOTE_LIMIT) throw new ApiError(429, 'Bạn đã gửi quá nhiều phiếu trong hôm nay. Vui lòng liên hệ trực tiếp qua Messenger.');

    const uniqueIds = [...new Set(items.map((item) => item.productUuid))];
    if (uniqueIds.length !== items.length) throw ApiError.unprocessable('Mỗi sản phẩm chỉ được xuất hiện một lần trong phiếu');
    const products = await prisma.product.findMany({
      where: { uuid: { in: uniqueIds }, status: 'ACTIVE', deletedAt: null },
      include: { images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }], take: 1, include: { mediaAsset: true } } },
    });
    if (products.length !== uniqueIds.length) throw ApiError.unprocessable('Một hoặc nhiều sản phẩm không còn khả dụng');
    const productByUuid = new Map(products.map((product) => [product.uuid, product]));
    const normalized = items.map((item) => {
      const product = productByUuid.get(item.productUuid);
      if (product.stock <= 0 || item.quantity > product.stock) throw ApiError.unprocessable(`${product.name} không đủ tồn kho`);
      const price = serializeNumber(product.price);
      return { product, quantity: item.quantity, unitPrice: price, lineTotal: price * item.quantity };
    });
    const total = normalized.reduce((sum, item) => sum + item.lineTotal, 0);
    const publicToken = tokenForPublic();
    const expiresAt = new Date(Date.now() + env.quoteExpiryDays * 24 * 60 * 60 * 1000);
    let quote;
    try {
      quote = await prisma.$transaction(async (tx) => {
        const openedAt = new Date();
        const created = await tx.quote.create({ data: { code: quoteCode(), publicTokenHash: hashToken(publicToken), publicTokenCiphertext: encryptQuoteToken(publicToken), requestKey: requestId, status: 'MESSENGER_OPENED', messengerOpenedAt: openedAt, note: note || null, snapshotTotal: total, currency: 'VND', expiresAt } });
        await tx.quoteItem.createMany({ data: normalized.map(({ product, quantity, unitPrice, lineTotal }) => ({ quoteId: created.id, productId: product.id, productUuid: product.uuid, name: product.name, sku: product.sku, unit: product.unit, imageUrl: productImage(product), unitPrice, quantity, lineTotal })) });
        await tx.interestEvent.createMany({ data: [...normalized.map(({ product }) => ({ eventType: 'INCLUDED_IN_QUOTE', productId: product.id, quoteId: created.id, sessionHash })), { eventType: 'QUOTE_CREATED', quoteId: created.id, sessionHash, metadata: { itemCount: normalized.length, intent: 'MESSENGER' } }, { eventType: 'MESSENGER_CLICKED', quoteId: created.id, sessionHash, metadata: { source: 'QUOTE_CREATE' } }] });
        return tx.quote.findUnique({ where: { id: created.id }, include: { items: true } });
      });
    } catch (error) {
      if (error?.code !== 'P2002') throw error;
      const duplicate = await prisma.quote.findUnique({ where: { requestKey: requestId }, include: { items: true } });
      const duplicateToken = duplicate ? decryptQuoteToken(duplicate.publicTokenCiphertext) : null;
      if (!duplicate || !duplicateToken) throw error;
      return quoteResponse(duplicate, duplicateToken);
    }
    return quoteResponse(quote, publicToken);
  },

  async getPublic(token) {
    const quote = await prisma.quote.findUnique({ where: { publicTokenHash: hashToken(token) }, include: { items: true } });
    if (!quote || quote.archivedAt) throw ApiError.notFound('Phiếu không tồn tại');
    if (quote.expiresAt <= new Date() && quote.status !== 'EXPIRED') {
      const expired = await prisma.quote.update({ where: { id: quote.id }, data: { status: 'EXPIRED' }, include: { items: true } });
      return serializeQuote(expired);
    }
    return serializeQuote(quote);
  },

  async messengerOpened(token, req) {
    const current = await prisma.quote.findUnique({ where: { publicTokenHash: hashToken(token) } });
    if (!current || current.archivedAt) throw ApiError.notFound('Phiếu không tồn tại');
    if (current.status === 'EXPIRED' || current.expiresAt <= new Date()) throw ApiError.unprocessable('Phiếu đã hết hiệu lực');
    const quote = await prisma.quote.update({ where: { id: current.id }, data: { status: current.status === 'CREATED' ? 'MESSENGER_OPENED' : current.status, messengerOpenedAt: current.messengerOpenedAt || new Date() }, include: { items: true } });
    await logEvent({ eventType: 'MESSENGER_CLICKED', quoteId: current.id, sessionHash: sessionHashForRequest(req) });
    return serializeQuote(quote);
  },

  async track({ eventType, productUuid, metadata }, req) {
    const product = await prisma.product.findFirst({ where: { uuid: productUuid, deletedAt: null }, select: { id: true } });
    if (!product) return true;
    await logEvent({ eventType, productId: product.id, sessionHash: req?.ip ? hashToken(req.ip) : null, metadata: metadata || undefined });
    return true;
  },
};
