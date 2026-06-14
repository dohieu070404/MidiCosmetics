import crypto from 'node:crypto';
import { env } from '../../config/env.js';
import { prisma } from '../../prisma/client.js';
import { ApiError } from '../../errors/api-error.js';
import { hashPassword } from '../../utils/password.js';
import { isStrongAdminPassword, ADMIN_PASSWORD_POLICY_MESSAGE } from '../../utils/admin-password-policy.js';
import { USER_ROLES } from '../../constants/roles.js';

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const timingSafeEqualString = (actual, expected) => {
  const actualBuffer = Buffer.from(String(actual || ''), 'utf8');
  const expectedBuffer = Buffer.from(String(expected || ''), 'utf8');
  if (actualBuffer.length !== expectedBuffer.length) return false;
  return crypto.timingSafeEqual(actualBuffer, expectedBuffer);
};

const ensureBootstrapEnabled = () => {
  if (!env.adminBootstrap.enabled) {
    throw ApiError.forbidden('Admin bootstrap is disabled');
  }

  if (!env.adminBootstrap.token || env.adminBootstrap.token.length < 32) {
    throw ApiError.forbidden('Admin bootstrap is not configured');
  }
};

const ensureAllowedEmail = (email) => {
  const allowedEmails = env.adminBootstrap.allowedEmails;
  if (!allowedEmails.length || !allowedEmails.includes(email)) {
    throw ApiError.forbidden('Email is not allowed for admin bootstrap');
  }
};

export const adminBootstrapService = {
  async bootstrapFirstAdmin({ email, password, bootstrapToken }) {
    ensureBootstrapEnabled();

    const adminCount = await prisma.user.count({
      where: {
        role: USER_ROLES.ADMIN,
        deletedAt: null,
      },
    });

    if (adminCount > 0) {
      throw ApiError.forbidden('Bootstrap already completed');
    }

    const normalizedEmail = normalizeEmail(email);
    ensureAllowedEmail(normalizedEmail);

    if (!timingSafeEqualString(bootstrapToken, env.adminBootstrap.token)) {
      throw ApiError.forbidden('Invalid bootstrap token');
    }

    if (!isStrongAdminPassword(password)) {
      throw ApiError.unprocessable('Password does not meet admin password policy', [
        { field: 'body.password', code: 'weak_password', message: ADMIN_PASSWORD_POLICY_MESSAGE },
      ]);
    }

    const passwordHash = await hashPassword(password);
    const fullName = normalizedEmail.split('@')[0] || 'Midi Admin';

    const admin = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        fullName,
        role: USER_ROLES.ADMIN,
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
        passwordChangedAt: new Date(),
      },
      select: {
        id: true,
        uuid: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    return admin;
  },
};
