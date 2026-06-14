import { prisma } from '../../prisma/client.js';
import { publicUserSelect } from '../../utils/prisma-format.js';

export const userRepository = {
  findByEmailWithPassword(email) {
    return prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        deletedAt: null,
      },
      select: {
        ...publicUserSelect,
        passwordHash: true,
      },
    });
  },

  findPublicByUuid(uuid) {
    return prisma.user.findFirst({
      where: {
        uuid,
        deletedAt: null,
      },
      select: publicUserSelect,
    });
  },

  updateLastLogin(id) {
    return prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
      select: publicUserSelect,
    });
  },
};
