import { Request } from 'express';
import { BaseContext } from '../../types/context';
import { prisma } from '../../config/database';
import { extractToken, verifyToken } from '../../middleware/auth';
import { GraphQLError } from 'graphql';

export interface SellerContext extends BaseContext {
  sellerId?: string;
  sellerProfileId?: string;
}

export async function createSellerContext({ req }: { req: Request }): Promise<SellerContext> {
  const token = extractToken(req);
  
  if (!token) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }

  const payload = verifyToken(token);
  
  if (!payload) {
    throw new GraphQLError('Invalid or expired token', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }

  // Check if user is a seller
  if (payload.role !== 'SELLER') {
    throw new GraphQLError('Seller access required', {
      extensions: { code: 'FORBIDDEN' },
    });
  }

  // Get seller profile
  const sellerProfile = await prisma.sellerProfile.findUnique({
    where: { userId: payload.userId },
  });

  if (!sellerProfile) {
    throw new GraphQLError('Seller profile not found', {
      extensions: { code: 'FORBIDDEN' },
    });
  }

  return {
    prisma,
    user: {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
    },
    sellerId: payload.userId,
    sellerProfileId: sellerProfile.id,
  };
}
