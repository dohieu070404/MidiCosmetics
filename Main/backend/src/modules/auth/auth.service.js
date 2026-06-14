import crypto from 'node:crypto';
import { env } from '../../config/env.js';
import { prisma } from '../../prisma/client.js';
import { ApiError } from '../../errors/api-error.js';
import { comparePassword } from '../../utils/password.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt.js';
import { hashToken } from '../../utils/token-hash.js';
import { userRepository } from '../users/user.repository.js';
import { getPermissionsForRole, USER_ROLES } from '../../constants/roles.js';

const JWT_TIME_UNITS_IN_MS = Object.freeze({
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
});

const parseJwtDurationToDate = (duration) => {
  const match = /^(\d+)([smhd])$/.exec(duration);
  if (!match) {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }

  const [, amount, unit] = match;
  return new Date(Date.now() + Number(amount) * JWT_TIME_UNITS_IN_MS[unit]);
};

const buildTokenPayload = (user) => ({
  sub: user.uuid,
  role: user.role,
  email: user.email,
});

const sanitizeUser = (user) => {
  if (!user) return user;
  // eslint-disable-next-line no-unused-vars
  const { passwordHash, ...safeUser } = user;
  return {
    ...safeUser,
    permissions: getPermissionsForRole(safeUser.role),
  };
};

export const authService = {
  async login({ email, password, userAgent, ipAddress }) {
    const user = await userRepository.findByEmailWithPassword(email);

    const invalidCredentialsError = () => ApiError.unauthorized('Invalid email or password');

    if (!user || user.status !== 'ACTIVE' || user.role !== USER_ROLES.ADMIN) {
      throw invalidCredentialsError();
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      throw invalidCredentialsError();
    }

    const refreshedUser = await userRepository.updateLastLogin(user.id);
    const accessToken = signAccessToken(buildTokenPayload(refreshedUser));
    const refreshTokenId = crypto.randomUUID();
    const refreshToken = signRefreshToken({
      ...buildTokenPayload(refreshedUser),
      jti: refreshTokenId,
    });

    await prisma.refreshToken.create({
      data: {
        uuid: refreshTokenId,
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        userAgent,
        ipAddress,
        expiresAt: parseJwtDurationToDate(env.auth.refreshExpiresIn),
      },
    });

    return {
      user: sanitizeUser(refreshedUser),
      tokens: {
        accessToken,
        refreshToken,
        tokenType: 'Bearer',
      },
    };
  },

  async refresh({ refreshToken, userAgent, ipAddress }) {
    if (!refreshToken) {
      throw ApiError.unauthorized('Refresh token is required');
    }
    const payload = verifyRefreshToken(refreshToken);
    const tokenHash = hashToken(refreshToken);

    const storedRefreshToken = await prisma.refreshToken.findFirst({
      where: {
        uuid: payload.jti,
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: true,
      },
    });

    if (!storedRefreshToken || storedRefreshToken.user.deletedAt || storedRefreshToken.user.status !== 'ACTIVE') {
      throw ApiError.unauthorized('Invalid refresh token');
    }

    if (storedRefreshToken.user.role !== USER_ROLES.ADMIN) {
      throw ApiError.unauthorized('Invalid refresh token');
    }

    await prisma.refreshToken.update({
      where: { id: storedRefreshToken.id },
      data: { revokedAt: new Date() },
    });

    const safeUser = sanitizeUser(storedRefreshToken.user);
    const accessToken = signAccessToken(buildTokenPayload(safeUser));
    const refreshTokenId = crypto.randomUUID();
    const nextRefreshToken = signRefreshToken({
      ...buildTokenPayload(safeUser),
      jti: refreshTokenId,
    });

    await prisma.refreshToken.create({
      data: {
        uuid: refreshTokenId,
        userId: storedRefreshToken.userId,
        tokenHash: hashToken(nextRefreshToken),
        userAgent,
        ipAddress,
        expiresAt: parseJwtDurationToDate(env.auth.refreshExpiresIn),
      },
    });

    return {
      user: safeUser,
      tokens: {
        accessToken,
        refreshToken: nextRefreshToken,
        tokenType: 'Bearer',
      },
    };
  },

  async logout({ refreshToken }) {
    const tokenHash = hashToken(refreshToken);

    await prisma.refreshToken.updateMany({
      where: {
        tokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return true;
  },
};
