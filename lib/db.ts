import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __ztnPrisma: PrismaClient | undefined;
}

export const db = global.__ztnPrisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') global.__ztnPrisma = db;
