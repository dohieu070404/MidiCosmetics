import crypto from 'node:crypto';

import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
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
const recaptchaError = (statusCode, message, code) => new ApiError(
  statusCode,
  message,
  [{ field: 'recaptchaToken', code, message }],
  { code },
);
const expectedRecaptchaHostnames = () => {
  const hostnames = new Set(env.recaptcha.allowedHostnames);
  try {
    if (env.frontendUrl) hostnames.add(new URL(env.frontendUrl).hostname.toLowerCase().replace(/\.$/, ''));
  } catch {
    // FRONTEND_URL is already schema-validated; this is only defensive.
  }
  return hostnames;
};
const verifyRecaptcha = async (token, req) => {
  if (!env.quoteCaptchaEnabled) return;
  if (!env.recaptcha.secretKey) throw recaptchaError(503, 'Google reCAPTCHA chÆ°a Ä‘Æ°á»£c cáº¥u hĂ¬nh trĂªn mĂ¡y chá»§.', 'RECAPTCHA_NOT_CONFIGURED');
  if (!token) throw recaptchaError(422, 'Vui lĂ²ng hoĂ n thĂ nh Google reCAPTCHA trÆ°á»›c khi táº¡o phiáº¿u.', 'RECAPTCHA_TOKEN_REQUIRED');
  const body = new URLSearchParams({ secret: env.recaptcha.secretKey, response: token });
  let result;
  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body, signal: AbortSignal.timeout(7000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    result = await response.json();
  } catch {
    throw recaptchaError(503, 'KhĂ´ng káº¿t ná»‘i Ä‘Æ°á»£c Google reCAPTCHA. Vui lĂ²ng thá»­ láº¡i sau.', 'RECAPTCHA_PROVIDER_UNAVAILABLE');
  }

  const providerCodes = Array.isArray(result?.['error-codes']) ? result['error-codes'].map(String) : [];
  const hostname = String(result?.hostname || '').toLowerCase().replace(/\.$/, '');
  const allowedHostnames = expectedRecaptchaHostnames();

  if (!result?.success) {
    logger.warn({ requestId: req?.id, providerCodes }, 'Google reCAPTCHA rejected quote verification');
    if (providerCodes.some((code) => ['missing-input-secret', 'invalid-input-secret'].includes(code))) {
      throw recaptchaError(503, 'Secret key Google reCAPTCHA phĂ­a mĂ¡y chá»§ khĂ´ng há»£p lá»‡ hoáº·c khĂ´ng cĂ¹ng cáº·p vá»›i Site key.', 'RECAPTCHA_SERVER_CONFIG_INVALID');
    }
    if (providerCodes.includes('timeout-or-duplicate')) {
      throw recaptchaError(422, 'Google reCAPTCHA Ä‘Ă£ háº¿t háº¡n hoáº·c Ä‘Ă£ Ä‘Æ°á»£c sá»­ dá»¥ng. Vui lĂ²ng xĂ¡c nháº­n láº¡i.', 'RECAPTCHA_TOKEN_EXPIRED');
    }
    throw recaptchaError(422, 'Google reCAPTCHA khĂ´ng há»£p lá»‡. Vui lĂ²ng xĂ¡c nháº­n láº¡i.', 'RECAPTCHA_TOKEN_INVALID');
  }

  if (allowedHostnames.size && !allowedHostnames.has(hostname)) {
    logger.warn({ requestId: req?.id, hostname, allowedHostnames: [...allowedHostnames] }, 'Google reCAPTCHA hostname mismatch');
    throw recaptchaError(422, `TĂªn miá»n reCAPTCHA khĂ´ng khá»›p (${hostname || 'khĂ´ng xĂ¡c Ä‘á»‹nh'}). Kiá»ƒm tra RECAPTCHA_ALLOWED_HOSTNAMES trĂªn backend.`, 'RECAPTCHA_HOSTNAME_MISMATCH');
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
    if (intent !== 'MESSENGER') throw ApiError.unprocessable('Phiáº¿u chá»‰ Ä‘Æ°á»£c ghi nháº­n khi khĂ¡ch gá»­i qua Messenger.');
    await verifyRecaptcha(recaptchaToken, req);

    const existing = await prisma.quote.findUnique({ where: { requestKey: requestId }, include: { items: true } });
    if (existing) {
      if (existing.archivedAt) throw ApiError.conflict('Phiáº¿u nĂ y Ä‘Ă£ Ä‘Æ°á»£c lÆ°u trá»¯. Vui lĂ²ng táº¡o láº¡i tá»« giá» hĂ ng.');
      const existingToken = decryptQuoteToken(existing.publicTokenCiphertext);
      if (!existingToken) throw ApiError.conflict('KhĂ´ng thá»ƒ khĂ´i phá»¥c link phiáº¿u Ä‘Ă£ táº¡o.');
      return quoteResponse(existing, existingToken);
    }

    const sessionHash = sessionHashForRequest(req);
    const recentCount = await prisma.interestEvent.count({ where: { eventType: 'QUOTE_CREATED', sessionHash, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } });
    if (recentCount >= DAILY_QUOTE_LIMIT) throw new ApiError(429, 'Báº¡n Ä‘Ă£ gá»­i quĂ¡ nhiá»u phiáº¿u trong hĂ´m nay. Vui lĂ²ng liĂªn há»‡ trá»±c tiáº¿p qua Messenger.');

    const uniqueIds = [...new Set(items.map((item) => item.productUuid))];
    if (uniqueIds.length !== items.length) throw ApiError.unprocessable('Má»—i sáº£n pháº©m chá»‰ Ä‘Æ°á»£c xuáº¥t hiá»‡n má»™t láº§n trong phiáº¿u');
    const products = await prisma.product.findMany({
      where: { uuid: { in: uniqueIds }, status: 'ACTIVE', deletedAt: null },
      include: { images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }], take: 1, include: { mediaAsset: true } } },
    });
    if (products.length !== uniqueIds.length) throw ApiError.unprocessable('Má»™t hoáº·c nhiá»u sáº£n pháº©m khĂ´ng cĂ²n kháº£ dá»¥ng');
    const productByUuid = new Map(products.map((product) => [product.uuid, product]));
    const normalized = items.map((item) => {
      const product = productByUuid.get(item.productUuid);
      if (product.stock <= 0 || item.quantity > product.stock) throw ApiError.unprocessable(`${product.name} khĂ´ng Ä‘á»§ tá»“n kho`);
      const price = serializeNumber(product.price);
      return { product, quantity: item.quantity, unitPrice: price, lineTotal: price * item.quantity };
    });
    const total = normalized.reduce((sum, item) => sum + item.lineTotal, 0);
    const publicToken = tokenForPublic();
    const expiresAt = new Date(Date.now() + env.quoteExpiryDays * 24 * 60 * 60 * 1000);
    let quote;
    try {
      quote = await prisma.$transaction(async (tx) => {
        // Persist first. The client marks MESSENGER_OPENED only after the
        // server has returned the public token and navigation can begin.
        const created = await tx.quote.create({ data: { code: quoteCode(), publicTokenHash: hashToken(publicToken), publicTokenCiphertext: encryptQuoteToken(publicToken), requestKey: requestId, status: 'CREATED', note: note || null, snapshotTotal: total, currency: 'VND', expiresAt } });
        await tx.quoteItem.createMany({ data: normalized.map(({ product, quantity, unitPrice, lineTotal }) => ({ quoteId: created.id, productId: product.id, productUuid: product.uuid, name: product.name, sku: product.sku, unit: product.unit, imageUrl: productImage(product), unitPrice, quantity, lineTotal })) });
        await tx.interestEvent.createMany({ data: [...normalized.map(({ product }) => ({ eventType: 'INCLUDED_IN_QUOTE', productId: product.id, quoteId: created.id, sessionHash })), { eventType: 'QUOTE_CREATED', quoteId: created.id, sessionHash, metadata: { itemCount: normalized.length, intent: 'MESSENGER' } }] });
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
    if (!quote || quote.archivedAt) throw ApiError.notFound('Phiáº¿u khĂ´ng tá»“n táº¡i');
    if (quote.expiresAt <= new Date() && quote.status !== 'EXPIRED') {
      const expired = await prisma.quote.update({ where: { id: quote.id }, data: { status: 'EXPIRED' }, include: { items: true } });
      return serializeQuote(expired);
    }
    return serializeQuote(quote);
  },

  async messengerOpened(token, req) {
    const current = await prisma.quote.findUnique({ where: { publicTokenHash: hashToken(token) } });
    if (!current || current.archivedAt) throw ApiError.notFound('Phiáº¿u khĂ´ng tá»“n táº¡i');
    if (current.status === 'EXPIRED' || current.expiresAt <= new Date()) throw ApiError.unprocessable('Phiáº¿u Ä‘Ă£ háº¿t hiá»‡u lá»±c');
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