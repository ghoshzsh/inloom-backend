import { PrismaClient } from '@prisma/client';

export interface BaseContext {
  prisma: PrismaClient;
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export interface ShopContext extends BaseContext {
  customerId?: string;
}
