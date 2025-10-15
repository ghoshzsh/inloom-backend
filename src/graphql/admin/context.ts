import { Request } from 'express';
import { BaseContext } from '../../types/context.js';
import { prisma } from '../../config/database.js';
import { extractToken, verifyToken } from '../../middleware/auth.js';
import { GraphQLError } from 'graphql';

export interface AdminContext extends BaseContext {
  adminId: string;
}

export async function createAdminContext({ req }: { req: Request }): Promise<AdminContext> {
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

  // Check if user is an admin
  if (payload.role !== 'ADMIN') {
    throw new GraphQLError('Admin access required', {
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
    adminId: payload.userId,
  };
}
