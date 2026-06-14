import crypto from 'node:crypto';
import { prisma } from '../../prisma/client.js';
import { ApiError } from '../../errors/api-error.js';
import { hashToken } from '../../utils/token-hash.js';
import { emailNotificationService } from '../../services/email-notification.service.js';
import { ADMIN_VERIFICATION_TYPES } from './admin-profile.service.js';

const NOTIFICATION_TOKEN_TTL_MINUTES = 15;
const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const generateVerificationToken = () => crypto.randomBytes(32).toString('base64url');
const buildExpiresAt = () => new Date(Date.now() + NOTIFICATION_TOKEN_TTL_MINUTES * 60 * 1000);

const selectRecipient = {
  uuid: true,
  email: true,
  isVerified: true,
  verifiedAt: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

const ensureAdminId = (currentUser) => {
  if (!currentUser?.id) throw ApiError.unauthorized('Admin authentication required');
  return currentUser.id;
};

export const adminNotificationRecipientService = {
  async listRecipients() {
    return prisma.notificationRecipient.findMany({
      where: { deletedAt: null },
      select: selectRecipient,
      orderBy: [{ isVerified: 'desc' }, { createdAt: 'desc' }],
    });
  },

  async createRecipient(req, currentUser, { email }) {
    const adminId = ensureAdminId(currentUser);
    const normalizedEmail = normalizeEmail(email);

    const existing = await prisma.notificationRecipient.findUnique({ where: { email: normalizedEmail } });
    if (existing && !existing.deletedAt) {
      throw ApiError.conflict('Email nhận thông báo đã tồn tại');
    }

    const rawToken = generateVerificationToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = buildExpiresAt();

    const recipient = await prisma.$transaction(async (tx) => {
      const savedRecipient = existing
        ? await tx.notificationRecipient.update({
          where: { id: existing.id },
          data: {
            isVerified: false,
            verifiedAt: null,
            isActive: true,
            deletedAt: null,
          },
          select: selectRecipient,
        })
        : await tx.notificationRecipient.create({
          data: { email: normalizedEmail, isVerified: false, isActive: true },
          select: selectRecipient,
        });

      await tx.adminVerificationToken.updateMany({
        where: {
          adminId,
          type: ADMIN_VERIFICATION_TYPES.VERIFY_NOTIFICATION_EMAIL,
          targetEmail: normalizedEmail,
          usedAt: null,
        },
        data: { usedAt: new Date() },
      });

      await tx.adminVerificationToken.create({
        data: {
          adminId,
          type: ADMIN_VERIFICATION_TYPES.VERIFY_NOTIFICATION_EMAIL,
          tokenHash,
          targetEmail: normalizedEmail,
          expiresAt,
        },
      });

      return savedRecipient;
    });

    emailNotificationService.sendNotificationEmailVerification(req, recipient, rawToken, expiresAt);

    return { recipient, expiresAt, ttlMinutes: NOTIFICATION_TOKEN_TTL_MINUTES };
  },

  async verifyRecipient(currentUser, { token }) {
    const adminId = ensureAdminId(currentUser);
    const tokenHash = hashToken(token);

    const verification = await prisma.adminVerificationToken.findFirst({
      where: {
        tokenHash,
        type: ADMIN_VERIFICATION_TYPES.VERIFY_NOTIFICATION_EMAIL,
        adminId,
        usedAt: null,
      },
    });

    if (!verification || !verification.targetEmail) {
      throw ApiError.badRequest('Mã xác minh email không hợp lệ');
    }

    if (verification.expiresAt <= new Date()) {
      throw ApiError.badRequest('Mã xác minh email đã hết hạn');
    }

    const recipient = await prisma.$transaction(async (tx) => {
      await tx.adminVerificationToken.update({
        where: { id: verification.id },
        data: { usedAt: new Date() },
      });

      return tx.notificationRecipient.update({
        where: { email: verification.targetEmail },
        data: { isVerified: true, verifiedAt: new Date(), isActive: true },
        select: selectRecipient,
      });
    });

    return recipient;
  },

  async toggleRecipient(uuid) {
    const existing = await prisma.notificationRecipient.findFirst({ where: { uuid, deletedAt: null } });
    if (!existing) throw ApiError.notFound('Không tìm thấy email nhận thông báo');

    return prisma.notificationRecipient.update({
      where: { id: existing.id },
      data: { isActive: !existing.isActive },
      select: selectRecipient,
    });
  },

  async deleteRecipient(uuid) {
    const existing = await prisma.notificationRecipient.findFirst({ where: { uuid, deletedAt: null } });
    if (!existing) throw ApiError.notFound('Không tìm thấy email nhận thông báo');

    await prisma.notificationRecipient.update({
      where: { id: existing.id },
      data: { deletedAt: new Date(), isActive: false },
    });

    return existing;
  },

  async getActiveVerifiedRecipients() {
    return prisma.notificationRecipient.findMany({
      where: { isVerified: true, isActive: true, deletedAt: null },
      select: selectRecipient,
      orderBy: { createdAt: 'asc' },
    });
  },

  async sendTest(req) {
    const recipients = await this.getActiveVerifiedRecipients();
    if (recipients.length === 0) {
      throw ApiError.badRequest('Chưa có email nhận thông báo nào đã xác minh và đang bật');
    }

    const results = await emailNotificationService.sendNotificationTest(req, recipients);
    const failed = results.filter((item) => !item.ok);
    if (failed.length > 0) {
      const smtpMissing = failed.every((item) => item.reason === 'SMTP_NOT_CONFIGURED');
      throw ApiError.badRequest(smtpMissing ? 'SMTP chưa được cấu hình nên không thể gửi email test' : 'Không gửi được email test. Vui lòng kiểm tra cấu hình SMTP');
    }

    return { sent: results.length, recipients };
  },
};
