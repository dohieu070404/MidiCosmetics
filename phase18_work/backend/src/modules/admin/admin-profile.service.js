import crypto from 'node:crypto';
import { prisma } from '../../prisma/client.js';
import { ApiError } from '../../errors/api-error.js';
import { comparePassword, hashPassword } from '../../utils/password.js';
import { hashToken } from '../../utils/token-hash.js';
import { isStrongAdminPassword, ADMIN_PASSWORD_POLICY_MESSAGE } from '../../utils/admin-password-policy.js';
import { getPermissionsForRole, USER_ROLES } from '../../constants/roles.js';

export const ADMIN_VERIFICATION_TYPES = Object.freeze({
  CHANGE_PASSWORD: 'CHANGE_PASSWORD',
  VERIFY_NOTIFICATION_EMAIL: 'VERIFY_NOTIFICATION_EMAIL',
});

const PASSWORD_CHANGE_TOKEN_TTL_MINUTES = 15;

const adminProfileSelect = {
  id: true,
  uuid: true,
  email: true,
  fullName: true,
  avatarUrl: true,
  role: true,
  status: true,
  emailVerifiedAt: true,
  passwordChangedAt: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
};

const adminWithPasswordSelect = {
  ...adminProfileSelect,
  passwordHash: true,
};

const sanitizeAdminProfile = (admin) => {
  if (!admin) return admin;
  // eslint-disable-next-line no-unused-vars
  const { id, passwordHash, ...safeAdmin } = admin;
  return {
    ...safeAdmin,
    permissions: getPermissionsForRole(safeAdmin.role),
  };
};

const generateVerificationToken = () => crypto.randomBytes(32).toString('base64url');
const buildExpiresAt = () => new Date(Date.now() + PASSWORD_CHANGE_TOKEN_TTL_MINUTES * 60 * 1000);

const requireActiveAdminWithPassword = async (adminId) => {
  const admin = await prisma.user.findFirst({
    where: {
      id: adminId,
      role: USER_ROLES.ADMIN,
      status: 'ACTIVE',
      deletedAt: null,
    },
    select: adminWithPasswordSelect,
  });

  if (!admin) throw ApiError.unauthorized('Admin account is not active');
  return admin;
};

export const adminProfileService = {
  async getProfile(currentUser) {
    const admin = await prisma.user.findFirst({
      where: {
        id: currentUser.id,
        role: USER_ROLES.ADMIN,
        deletedAt: null,
      },
      select: adminProfileSelect,
    });

    if (!admin) throw ApiError.notFound('Admin profile not found');
    return sanitizeAdminProfile(admin);
  },

  async requestPasswordChange(currentUser, { currentPassword, newPassword }) {
    const admin = await requireActiveAdminWithPassword(currentUser.id);

    const currentPasswordOk = await comparePassword(currentPassword, admin.passwordHash);
    if (!currentPasswordOk) {
      throw ApiError.badRequest('Mật khẩu hiện tại không đúng');
    }

    if (!isStrongAdminPassword(newPassword)) {
      throw ApiError.badRequest(ADMIN_PASSWORD_POLICY_MESSAGE);
    }

    const reusedPassword = await comparePassword(newPassword, admin.passwordHash);
    if (reusedPassword) {
      throw ApiError.badRequest('Mật khẩu mới không được trùng với mật khẩu hiện tại');
    }

    const rawToken = generateVerificationToken();
    const tokenHash = hashToken(rawToken);
    const pendingPasswordHash = await hashPassword(newPassword);
    const expiresAt = buildExpiresAt();

    await prisma.$transaction(async (tx) => {
      await tx.adminVerificationToken.updateMany({
        where: {
          adminId: admin.id,
          type: ADMIN_VERIFICATION_TYPES.CHANGE_PASSWORD,
          usedAt: null,
        },
        data: { usedAt: new Date() },
      });

      await tx.adminVerificationToken.create({
        data: {
          adminId: admin.id,
          type: ADMIN_VERIFICATION_TYPES.CHANGE_PASSWORD,
          tokenHash,
          pendingPasswordHash,
          expiresAt,
        },
      });
    });

    return {
      admin: sanitizeAdminProfile(admin),
      verificationToken: rawToken,
      expiresAt,
      ttlMinutes: PASSWORD_CHANGE_TOKEN_TTL_MINUTES,
    };
  },

  async verifyPasswordChange(currentUser, { token }) {
    const tokenHash = hashToken(token);
    const verification = await prisma.adminVerificationToken.findFirst({
      where: {
        tokenHash,
        type: ADMIN_VERIFICATION_TYPES.CHANGE_PASSWORD,
        usedAt: null,
      },
      include: { admin: true },
    });

    if (!verification || verification.adminId !== currentUser.id) {
      throw ApiError.badRequest('Mã xác minh không hợp lệ');
    }

    if (verification.expiresAt <= new Date()) {
      throw ApiError.badRequest('Mã xác minh đã hết hạn');
    }

    if (!verification.pendingPasswordHash) {
      throw ApiError.badRequest('Yêu cầu đổi mật khẩu không hợp lệ');
    }

    const updatedAdmin = await prisma.$transaction(async (tx) => {
      await tx.adminVerificationToken.update({
        where: { id: verification.id },
        data: { usedAt: new Date() },
      });

      const admin = await tx.user.update({
        where: { id: verification.adminId },
        data: {
          passwordHash: verification.pendingPasswordHash,
          passwordChangedAt: new Date(),
        },
        select: adminProfileSelect,
      });

      await tx.refreshToken.updateMany({
        where: {
          userId: verification.adminId,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });

      return admin;
    });

    return sanitizeAdminProfile(updatedAdmin);
  },
};
