import { prisma } from '../prisma/client.js';
import { ApiError } from '../errors/api-error.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { getPermissionsForRole } from '../constants/roles.js';

const extractBearerToken = (authorizationHeader) => {
  if (!authorizationHeader || typeof authorizationHeader !== 'string') return null;
  const [scheme, token] = authorizationHeader.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
};

export const authenticate = async (req, res, next) => {
  try {
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      throw ApiError.unauthorized('Missing bearer token');
    }

    const payload = verifyAccessToken(token);

    const user = await prisma.user.findFirst({
      where: {
        uuid: payload.sub,
        deletedAt: null,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        uuid: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw ApiError.unauthorized('User is not active or no longer exists');
    }

    req.user = { ...user, permissions: getPermissionsForRole(user.role) };
    return next();
  } catch (error) {
    return next(error);
  }
};
