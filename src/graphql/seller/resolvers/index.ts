import { Query } from './query.js';
import { Mutation } from './mutation.js';
import { GraphQLDateTime, GraphQLJSON } from 'graphql-scalars';

// Field resolvers
const Product = {
  averageRating: (parent: any) => {
    if (!parent.reviews || parent.reviews.length === 0) return 0;
    const sum = parent.reviews.reduce((acc: number, review: any) => acc + review.rating, 0);
    return sum / parent.reviews.length;
  },
  reviewCount: (parent: any) => {
    return parent.reviews?.length || 0;
  },
  totalSold: async (parent: any, _: any, { prisma }: any) => {
    const orderItems = await prisma.orderItem.aggregate({
      where: {
        productId: parent.id,
        order: {
          status: { not: 'CANCELLED' },
        },
      },
      _sum: {
        quantity: true,
      },
    });
    return orderItems._sum.quantity || 0;
  },
};

const Order = {
  payment: async (parent: any, _: any, { prisma }: any) => {
    return await prisma.payment.findFirst({
      where: { orderId: parent.id },
      orderBy: { createdAt: 'desc' },
    });
  },
};

export const sellerResolvers = {
  Query,
  Mutation,
  Product,
  Order,
  DateTime: GraphQLDateTime,
  JSON: GraphQLJSON,
};
