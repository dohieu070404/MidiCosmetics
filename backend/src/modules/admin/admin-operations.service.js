import { prisma } from '../../prisma/client.js';
import { ApiError } from '../../errors/api-error.js';
import { buildPagination, getPaginationArgs } from '../../utils/pagination.js';
import { buildSearchWhere } from '../../utils/prisma-format.js';
import { decryptQuoteToken } from '../../utils/token-vault.js';
import { env } from '../../config/env.js';

const numberValue = (value) => Number(value?.toString?.() ?? value ?? 0);

const dateWhere = ({ from, to } = {}, defaultDays = null) => {
  const end = to ? new Date(to) : new Date();
  const start = from
    ? new Date(from)
    : defaultDays
      ? new Date(end.getTime() - defaultDays * 86_400_000)
      : null;
  if (start && start > end) throw ApiError.badRequest('Ngày bắt đầu phải nhỏ hơn ngày kết thúc.');
  return start ? { gte: start, lte: end } : to ? { lte: end } : undefined;
};

const quoteSelect = {
  uuid: true,
  code: true,
  publicTokenCiphertext: true,
  status: true,
  note: true,
  snapshotTotal: true,
  currency: true,
  messengerOpenedAt: true,
  processedAt: true,
  expiresAt: true,
  createdAt: true,
  updatedAt: true,
  archivedAt: true,
  _count: { select: { items: true } },
};

const serializeQuote = (quote) => {
  const publicToken = decryptQuoteToken(quote.publicTokenCiphertext);
  const publicPath = publicToken ? `/quote/${publicToken}` : null;
  const publicUrl =
    publicPath && env.frontendUrl ? `${env.frontendUrl.replace(/\/$/, '')}${publicPath}` : null;
  const safeQuote = { ...quote };
  delete safeQuote.publicTokenCiphertext;
  delete safeQuote._count;
  return {
    ...safeQuote,
    snapshotTotal: numberValue(quote.snapshotTotal),
    itemCount: quote._count?.items ?? quote.items?.length ?? 0,
    publicPath,
    publicUrl,
    items: quote.items?.map((item) => ({
      ...item,
      unitPrice: numberValue(item.unitPrice),
      lineTotal: numberValue(item.lineTotal),
    })),
  };
};

export const adminOperationsService = {
  async listQuotes(query) {
    const { page, limit, search, status, archived = 'active' } = query;
    const createdAt = dateWhere(query);
    const where = {
      ...(status ? { status } : {}),
      ...(createdAt ? { createdAt } : {}),
      ...(search
        ? {
            OR: [
              { code: { contains: search, mode: 'insensitive' } },
              { note: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(archived === 'all' ? {} : { archivedAt: archived === 'archived' ? { not: null } : null }),
    };
    const [items, total] = await Promise.all([
      prisma.quote.findMany({
        where,
        select: quoteSelect,
        orderBy: { createdAt: 'desc' },
        ...getPaginationArgs({ page, limit }),
      }),
      prisma.quote.count({ where }),
    ]);
    return {
      items: items.map(serializeQuote),
      pagination: buildPagination({ page, limit, total }),
    };
  },

  async getQuote(uuid) {
    const quote = await prisma.quote.findUnique({
      where: { uuid },
      select: {
        ...quoteSelect,
        items: {
          orderBy: { createdAt: 'asc' },
          select: {
            productUuid: true,
            name: true,
            sku: true,
            unit: true,
            imageUrl: true,
            unitPrice: true,
            quantity: true,
            lineTotal: true,
            product: { select: { uuid: true, slug: true, status: true, stock: true } },
          },
        },
      },
    });
    if (!quote) throw ApiError.notFound('Không tìm thấy báo giá.');
    return serializeQuote(quote);
  },

  async updateQuoteStatus(uuid, status) {
    const current = await prisma.quote.findUnique({
      where: { uuid },
      select: { id: true, archivedAt: true },
    });
    if (!current) throw ApiError.notFound('Không tìm thấy báo giá.');
    if (current.archivedAt)
      throw ApiError.conflict('Hãy khôi phục phiếu trước khi cập nhật trạng thái.');
    const quote = await prisma.quote.update({
      where: { id: current.id },
      data: {
        status,
        processedAt: status === 'PROCESSED' ? new Date() : null,
        messengerOpenedAt: status === 'MESSENGER_OPENED' ? new Date() : undefined,
      },
      select: quoteSelect,
    });
    return serializeQuote(quote);
  },

  async archiveQuotes({ mode, uuids = [] }) {
    const baseWhere = { archivedAt: null, status: { not: 'PROCESSED' } };
    const where =
      mode === 'UNOPENED'
        ? { ...baseWhere, messengerOpenedAt: null, status: { in: ['CREATED', 'EXPIRED'] } }
        : { ...baseWhere, uuid: { in: uuids } };
    const result = await prisma.quote.updateMany({ where, data: { archivedAt: new Date() } });
    return {
      archivedCount: result.count,
      protectedProcessed:
        mode === 'SELECTED'
          ? await prisma.quote.count({ where: { uuid: { in: uuids }, status: 'PROCESSED' } })
          : 0,
    };
  },

  async restoreQuotes({ uuids }) {
    const result = await prisma.quote.updateMany({
      where: { uuid: { in: uuids }, archivedAt: { not: null } },
      data: { archivedAt: null },
    });
    return { restoredCount: result.count };
  },

  async interestAnalytics(query = {}) {
    const createdAt = dateWhere(query, 30);
    const where = { createdAt };
    const [eventGroups, productGroups, quoteGroups, rawTrend] = await Promise.all([
      prisma.interestEvent.groupBy({ by: ['eventType'], where, _count: { _all: true } }),
      prisma.interestEvent.groupBy({
        by: ['eventType', 'productId'],
        where: { ...where, productId: { not: null } },
        _count: { _all: true },
      }),
      prisma.quote.groupBy({
        by: ['status'],
        where: { createdAt, archivedAt: null },
        _count: { _all: true },
        _sum: { snapshotTotal: true },
      }),
      prisma.interestEvent.findMany({
        where,
        select: { eventType: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const counts = Object.fromEntries(eventGroups.map((row) => [row.eventType, row._count._all]));
    const productIds = productGroups.map((row) => row.productId).filter(Boolean);
    const products = productIds.length
      ? await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: {
            id: true,
            uuid: true,
            name: true,
            slug: true,
            sku: true,
            category: { select: { uuid: true, name: true } },
            brand: { select: { uuid: true, name: true } },
          },
        })
      : [];
    const productById = new Map(products.map((product) => [String(product.id), product]));
    const topFor = (eventType) =>
      productGroups
        .filter((row) => row.eventType === eventType)
        .map((row) => ({ ...productById.get(String(row.productId)), events: row._count._all }))
        .filter((row) => row.uuid)
        .sort((a, b) => b.events - a.events)
        .slice(0, 12)
        .map(({ id, ...row }) => row);

    const aggregateDimension = (key) => {
      const totals = new Map();
      for (const row of productGroups) {
        const product = productById.get(String(row.productId));
        const dimension = product?.[key];
        if (!dimension?.uuid) continue;
        const current = totals.get(dimension.uuid) || {
          uuid: dimension.uuid,
          name: dimension.name,
          events: 0,
          viewed: 0,
          addedToCart: 0,
          includedInQuote: 0,
        };
        current.events += row._count._all;
        if (row.eventType === 'PRODUCT_VIEWED') current.viewed += row._count._all;
        if (row.eventType === 'ADDED_TO_CART') current.addedToCart += row._count._all;
        if (row.eventType === 'INCLUDED_IN_QUOTE') current.includedInQuote += row._count._all;
        totals.set(dimension.uuid, current);
      }
      return [...totals.values()].sort((a, b) => b.events - a.events).slice(0, 12);
    };

    const trendMap = new Map();
    for (const event of rawTrend) {
      const date = event.createdAt.toISOString().slice(0, 10);
      const entry = trendMap.get(date) || { date, total: 0 };
      entry.total += 1;
      entry[event.eventType] = (entry[event.eventType] || 0) + 1;
      trendMap.set(date, entry);
    }

    const views = counts.PRODUCT_VIEWED || 0;
    const adds = counts.ADDED_TO_CART || 0;
    const quotes = counts.QUOTE_CREATED || 0;
    const messages = counts.MESSENGER_CLICKED || 0;
    const rate = (value, base) => (base ? Math.round((value / base) * 1000) / 10 : 0);

    return {
      range: { from: createdAt.gte, to: createdAt.lte },
      counters: counts,
      funnel: [
        { key: 'PRODUCT_VIEWED', label: 'Xem sản phẩm', value: views, rate: 100 },
        { key: 'ADDED_TO_CART', label: 'Thêm vào giỏ', value: adds, rate: rate(adds, views) },
        { key: 'QUOTE_CREATED', label: 'Tạo báo giá', value: quotes, rate: rate(quotes, adds) },
        {
          key: 'MESSENGER_CLICKED',
          label: 'Mở Messenger',
          value: messages,
          rate: rate(messages, quotes),
        },
      ],
      quoteSummary: quoteGroups.map((row) => ({
        status: row.status,
        count: row._count._all,
        total: numberValue(row._sum.snapshotTotal),
      })),
      topViewed: topFor('PRODUCT_VIEWED'),
      topAddedToCart: topFor('ADDED_TO_CART'),
      topInQuotes: topFor('INCLUDED_IN_QUOTE'),
      topProducts: topFor('PRODUCT_VIEWED'),
      categories: aggregateDimension('category'),
      brands: aggregateDimension('brand'),
      trend: [...trendMap.values()],
    };
  },

  async listEmailLogs(query) {
    const { page, limit, search, status, type } = query;
    const createdAt = dateWhere(query);
    const where = {
      ...(status ? { status } : {}),
      ...(type ? { type } : {}),
      ...(createdAt ? { createdAt } : {}),
      ...buildSearchWhere(['to', 'subject', 'errorMessage'], search),
    };
    const [items, total] = await Promise.all([
      prisma.emailLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        select: {
          uuid: true,
          type: true,
          to: true,
          subject: true,
          status: true,
          errorMessage: true,
          createdAt: true,
        },
        ...getPaginationArgs({ page, limit }),
      }),
      prisma.emailLog.count({ where }),
    ]);
    return { items, pagination: buildPagination({ page, limit, total }) };
  },

  async listAuditLogs(query) {
    const { page, limit, search, type, action, actor } = query;
    const createdAt = dateWhere(query);
    const where = {
      ...(type ? { entityType: type } : {}),
      ...(action ? { action: { contains: action, mode: 'insensitive' } } : {}),
      ...(actor ? { actorEmail: { contains: actor, mode: 'insensitive' } } : {}),
      ...(createdAt ? { createdAt } : {}),
      ...(search
        ? {
            OR: ['actorEmail', 'action', 'entityType', 'entityId'].map((field) => ({
              [field]: { contains: search, mode: 'insensitive' },
            })),
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        select: {
          uuid: true,
          actorEmail: true,
          action: true,
          entityType: true,
          entityId: true,
          beforeData: true,
          afterData: true,
          metadata: true,
          ipAddress: true,
          userAgent: true,
          createdAt: true,
        },
        ...getPaginationArgs({ page, limit }),
      }),
      prisma.auditLog.count({ where }),
    ]);
    return { items, pagination: buildPagination({ page, limit, total }) };
  },
};
