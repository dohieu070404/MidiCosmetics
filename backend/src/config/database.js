import { prisma } from '../prisma/client.js';
import { logger } from './logger.js';

export const connectDatabase = async () => {
  await prisma.$connect();
  logger.info('Database connected');
};

export const disconnectDatabase = async () => {
  await prisma.$disconnect();
  logger.info('Database disconnected');
};
