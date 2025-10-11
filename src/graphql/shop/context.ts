import { Request } from 'express';
import { ShopContext } from '../../types/context';
import { prisma } from '../../config/database';
import { extractToken, verifyToken } from '../../middleware/auth';

export async function createShopContext({ req }: { req: Request }): Promise<ShopContext> {
  const token = extractToken(req);
  
  let user;
  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      user = {
        id: payload.userId,
        email: payload.email,
        role: payload.role,
      };
    }
  }

  return {
    prisma,
    user,
    customerId: user?.id,
  };
}
