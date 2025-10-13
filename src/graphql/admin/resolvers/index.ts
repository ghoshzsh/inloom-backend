import { Query } from './query';
import { Mutation } from './mutation';
import { GraphQLDateTime, GraphQLJSON } from 'graphql-scalars';

// Field resolvers
const User = {
  orderCount: async (parent: any, _: any, { prisma }: any) => {
    return await prisma.order.count({
      where: { userId: parent.id },
    });
  },
  totalSpent: async (parent: any, _: any, { prisma }: any) => {
    const orders = await prisma.order.aggregate({
      where: {
        userId: parent.id,
        status: { not: 'CANCELLED' },
      },
      _sum: {
        totalAmount: true,
      },
    });
    return orders._sum.totalAmount || 0;
  },
};

const SellerProfile = {
  totalProducts: async (parent: any, _: any, { prisma }: any) => {
    return await prisma.product.count({
      where: { sellerId: parent.id },
    });
  },
  totalRevenue: async (parent: any, _: any, { prisma }: any) => {
    const orders = await prisma.order.aggregate({
      where: {
        sellerId: parent.id,
        status: { not: 'CANCELLED' },
      },
      _sum: {
        totalAmount: true,
      },
    });
    return orders._sum.totalAmount || 0;
  },
  totalOrders: async (parent: any, _: any, { prisma }: any) => {
    return await prisma.order.count({
      where: {
        sellerId: parent.id,
        status: { not: 'CANCELLED' },
      },
    });
  },
};

const Category = {
  productCount: async (parent: any, _: any, { prisma }: any) => {
    return await prisma.product.count({
      where: { categoryId: parent.id },
    });
  },
};

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

const TopSeller = {
  totalProducts: async (parent: any, _: any, { prisma }: any) => {
    return await prisma.product.count({
      where: { sellerId: parent.seller.id },
    });
  },
};

export const adminResolvers = {
  Query,
  Mutation,
  User,
  SellerProfile,
  Category,
  Product,
  Order,
  TopSeller,
  DateTime: GraphQLDateTime,
  JSON: GraphQLJSON,
};
