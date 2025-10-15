import { Request } from 'express';
import { ShopContext } from '../../types/context.js';
import { prisma } from '../../config/database.js';
import { extractToken, verifyToken } from '../../middleware/auth.js';

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
