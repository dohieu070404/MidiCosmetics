import nodemailer from 'nodemailer';
import { prisma } from '../prisma/client.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { getIpAddress, getUserAgent } from '../utils/request-context.js';
import { EMAIL_TEMPLATE_TYPES, emailTemplateService, formatEmailDateTime } from './email/index.js';

let transporter = null;
let disabledWarningLogged = false;

const formatPrice = (value) => {
  if (value === null || value === undefined || value === '') return 'Không có';
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value);
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(number);
};

const safeError = (error) => ({
  name: error?.name,
  code: error?.code,
  command: error?.command,
  responseCode: error?.responseCode,
  message: error?.message,
});

const getTransporter = () => {
  if (!env.email.enabled) {
    if (!disabledWarningLogged) {
      logger.warn('Email notification disabled');
      disabledWarningLogged = true;
    }
    return null;
  }

  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: env.email.smtpHost,
    port: env.email.smtpPort,
    secure: env.email.smtpSecure,
    auth: env.email.smtpUser && env.email.smtpPass
      ? { user: env.email.smtpUser, pass: env.email.smtpPass }
      : undefined,
  });
  return transporter;
};

const createEmailLog = async ({ type, to, subject, status, errorMessage = null }) => {
  try {
    await prisma.emailLog.create({
      data: {
        type,
        to,
        subject,
        status,
        errorMessage: errorMessage ? String(errorMessage).slice(0, 500) : null,
      },
    });
  } catch (error) {
    logger.warn({ err: safeError(error), type, to, status }, 'Unable to write email log');
  }
};

const resolveVerifiedNotificationRecipients = async () => {
  const recipients = await prisma.notificationRecipient.findMany({
    where: {
      isVerified: true,
      isActive: true,
      deletedAt: null,
    },
    select: { email: true },
    orderBy: { createdAt: 'asc' },
  });

  const emails = recipients.map((item) => item.email).filter(Boolean);

  // Backward-compatible fallback for installations that configured ADMIN_ALERT_EMAIL in Phase 15
  // but have not added verified notification recipients yet.
  if (emails.length === 0 && env.email.adminAlertEmail) return [env.email.adminAlertEmail];

  return emails;
};

const uniqueEmails = (emails = []) => [...new Set(emails.map((email) => String(email || '').trim().toLowerCase()).filter(Boolean))];

const sendTemplateToEmail = async ({ to, type, rows, title }) => {
  const mailer = getTransporter();
  const { subject, text, html } = emailTemplateService.build({ type, rows, title });

  if (!mailer) {
    await createEmailLog({ type, to, subject, status: 'SKIPPED', errorMessage: 'SMTP is not configured' });
    return { ok: false, skipped: true, reason: 'SMTP_NOT_CONFIGURED' };
  }

  if (!to) {
    await createEmailLog({ type, to: 'unknown', subject, status: 'SKIPPED', errorMessage: 'Recipient is missing' });
    return { ok: false, skipped: true, reason: 'RECIPIENT_MISSING' };
  }

  try {
    await mailer.sendMail({ from: env.email.mailFrom, to, subject, text, html });
    await createEmailLog({ type, to, subject, status: 'SENT' });
    return { ok: true };
  } catch (error) {
    logger.warn({ subject, to, error: safeError(error) }, 'Unable to send email notification');
    await createEmailLog({ type, to, subject, status: 'FAILED', errorMessage: error?.message || 'Unknown SMTP error' });
    return { ok: false, reason: 'SMTP_SEND_FAILED', error };
  }
};

const sendTemplateAsync = ({ to, type, rows, title }) => {
  setImmediate(() => {
    sendTemplateToEmail({ to, type, rows, title }).catch((error) => {
      logger.warn({ to, type, error: safeError(error) }, 'Unable to send async email notification');
    });
  });
};

const sendTemplateToManyAsync = ({ to, type, rows, title }) => {
  uniqueEmails(to).forEach((email) => sendTemplateAsync({ to: email, type, rows, title }));
};

const sendNotificationAlert = async ({ type, rows, title }) => {
  const recipients = await resolveVerifiedNotificationRecipients();
  sendTemplateToManyAsync({ to: recipients, type, rows, title });
};

const sendNotificationAlertAsync = ({ type, rows, title }) => {
  setImmediate(() => {
    sendNotificationAlert({ type, rows, title }).catch((error) => {
      logger.warn({ type, error: safeError(error) }, 'Unable to dispatch notification recipients');
    });
  });
};

const requestRows = (req) => [
  { label: 'Người thực hiện', value: req?.user?.email || req?.user?.fullName || 'Không rõ' },
  { label: 'IP', value: req ? getIpAddress(req) : null },
  { label: 'User-agent', value: req ? getUserAgent(req) : null },
];

const getProductName = (product) => product?.name || 'Không rõ tên sản phẩm';
const getProductSku = (product) => product?.sku || 'Không có SKU';
const getAdminProductLink = () => env.frontendUrl ? `${env.frontendUrl.replace(/\/+$/, '')}/admin/products` : null;

const productRows = ({ req, action, product, beforeProduct = null, afterProduct = null }) => [
  ...requestRows(req),
  { label: 'Hành động', value: action },
  { label: 'Đối tượng', value: getProductName(afterProduct || product || beforeProduct) },
  { label: 'SKU', value: getProductSku(afterProduct || product || beforeProduct) },
  { label: 'Giá cũ', value: beforeProduct ? formatPrice(beforeProduct.price) : null },
  { label: 'Giá mới', value: afterProduct ? formatPrice(afterProduct.price) : product ? formatPrice(product.price) : null },
  { label: 'Trạng thái cũ', value: beforeProduct?.status || null },
  { label: 'Trạng thái mới', value: afterProduct?.status || product?.status || null },
  { label: 'Link admin', value: getAdminProductLink() },
];

export const emailNotificationService = {
  async sendToEmail({ to, type, rows, title }) {
    return sendTemplateToEmail({ to, type, rows, title });
  },

  sendNotificationEmailVerification(req, recipient, verificationToken, expiresAt) {
    sendTemplateAsync({
      to: recipient?.email,
      type: EMAIL_TEMPLATE_TYPES.NOTIFICATION_EMAIL_VERIFY,
      rows: [
        ...requestRows(req),
        { label: 'Hành động', value: 'Xác minh email nhận thông báo' },
        { label: 'Email nhận thông báo', value: recipient?.email },
        { label: 'Mã xác minh', value: verificationToken },
        { label: 'Hiệu lực đến', value: formatEmailDateTime(expiresAt) },
        { label: 'Cảnh báo', value: 'Chỉ nhập mã này trong trang quản trị Midi Cosmetics nếu bạn muốn kích hoạt email nhận thông báo.' },
      ],
    });
  },

  async sendNotificationTest(req, recipients) {
    const emails = uniqueEmails((recipients || []).map((item) => item.email));
    const results = [];
    for (const email of emails) {
      // eslint-disable-next-line no-await-in-loop
      const result = await sendTemplateToEmail({
        to: email,
        type: EMAIL_TEMPLATE_TYPES.NOTIFICATION_EMAIL_TEST,
        rows: [
          ...requestRows(req),
          { label: 'Hành động', value: 'Gửi email test' },
          { label: 'Đối tượng', value: email },
          { label: 'Chi tiết', value: 'Nếu bạn nhận được email này, cấu hình SMTP và email thông báo đang hoạt động.' },
        ],
      });
      results.push({ email, ...result });
    }
    return results;
  },

  sendProductCreated(req, product) {
    sendNotificationAlertAsync({
      type: EMAIL_TEMPLATE_TYPES.PRODUCT_CREATED,
      rows: productRows({ req, action: 'Thêm sản phẩm', product }),
    });
  },

  sendProductUpdated(req, beforeProduct, afterProduct) {
    const oldPrice = beforeProduct?.price === null || beforeProduct?.price === undefined ? null : Number(beforeProduct.price);
    const newPrice = afterProduct?.price === null || afterProduct?.price === undefined ? null : Number(afterProduct.price);
    const priceChanged = Number.isFinite(oldPrice) && Number.isFinite(newPrice) && oldPrice !== newPrice;
    sendNotificationAlertAsync({
      type: priceChanged ? EMAIL_TEMPLATE_TYPES.PRODUCT_PRICE_CHANGED : EMAIL_TEMPLATE_TYPES.PRODUCT_UPDATED,
      rows: productRows({ req, action: priceChanged ? 'Sửa giá sản phẩm' : 'Sửa sản phẩm', beforeProduct, afterProduct }),
    });
  },

  sendProductDeleted(req, beforeProduct) {
    sendNotificationAlertAsync({
      type: EMAIL_TEMPLATE_TYPES.PRODUCT_DELETED,
      rows: productRows({ req, action: 'Xóa sản phẩm', beforeProduct, afterProduct: { ...beforeProduct, status: 'ARCHIVED' } }),
    });
  },

  sendProductStatusChanged(req, beforeProduct, afterProduct) {
    const nextStatus = afterProduct?.status;
    sendNotificationAlertAsync({
      type: ['INACTIVE', 'ARCHIVED'].includes(nextStatus) ? EMAIL_TEMPLATE_TYPES.PRODUCT_DELETED : EMAIL_TEMPLATE_TYPES.PRODUCT_STATUS_CHANGED,
      rows: productRows({ req, action: 'Đổi trạng thái sản phẩm', beforeProduct, afterProduct }),
    });
  },

  sendAdminBootstrapped(req, admin) {
    sendNotificationAlertAsync({
      type: EMAIL_TEMPLATE_TYPES.ADMIN_BOOTSTRAPPED,
      rows: [
        { label: 'Hành động', value: 'Tạo admin production đầu tiên' },
        { label: 'Email admin', value: admin?.email || 'Không rõ' },
        { label: 'Role', value: admin?.role || 'ADMIN' },
        { label: 'Trạng thái', value: admin?.status || 'ACTIVE' },
        { label: 'IP', value: req ? getIpAddress(req) : null },
        { label: 'User-agent', value: req ? getUserAgent(req) : null },
      ],
    });
  },

  sendAdminPasswordChangeVerification(req, admin, verificationToken, expiresAt) {
    sendTemplateAsync({
      to: admin?.email,
      type: EMAIL_TEMPLATE_TYPES.ADMIN_PASSWORD_CHANGE_VERIFY,
      rows: [
        { label: 'Email admin', value: admin?.email || 'Không rõ' },
        { label: 'Mã xác minh', value: verificationToken },
        { label: 'Hiệu lực đến', value: formatEmailDateTime(expiresAt) },
        { label: 'IP', value: req ? getIpAddress(req) : null },
        { label: 'User-agent', value: req ? getUserAgent(req) : null },
        { label: 'Cảnh báo', value: 'Nếu bạn không yêu cầu đổi mật khẩu, hãy bỏ qua email này và kiểm tra bảo mật tài khoản.' },
      ],
    });
  },

  sendAdminPasswordChanged(req, admin) {
    const rows = [
      { label: 'Email admin', value: admin?.email || 'Không rõ' },
      { label: 'IP', value: req ? getIpAddress(req) : null },
      { label: 'User-agent', value: req ? getUserAgent(req) : null },
      { label: 'Cảnh báo', value: 'Nếu bạn không thực hiện thay đổi này, hãy kiểm tra bảo mật tài khoản ngay.' },
    ];

    const directRecipients = [admin?.email];
    sendTemplateToManyAsync({ to: directRecipients, type: EMAIL_TEMPLATE_TYPES.ADMIN_PASSWORD_CHANGED, rows });
    sendNotificationAlertAsync({ type: EMAIL_TEMPLATE_TYPES.ADMIN_PASSWORD_CHANGED, rows });
  },

  sendProductImportCompleted(req, job) {
    const summary = job?.summary || job?._summary || {};
    sendNotificationAlertAsync({
      type: EMAIL_TEMPLATE_TYPES.IMPORT_COMPLETED,
      rows: [
        ...requestRows(req),
        { label: 'Hành động', value: 'Import Excel hoàn tất' },
        { label: 'Filename', value: job?.originalName || 'Không rõ' },
        { label: 'Total rows', value: job?.totalRows ?? 0 },
        { label: 'Success rows', value: job?.successRows ?? 0 },
        { label: 'Failed rows', value: job?.failedRows ?? 0 },
        { label: 'Sản phẩm tạo mới', value: summary.createdProducts ?? 0 },
        { label: 'Sản phẩm cập nhật', value: summary.updatedProducts ?? 0 },
      ],
    });
  },
};
