import { AdminContext } from '../context';
import { GraphQLError } from 'graphql';
import * as argon2 from 'argon2';

export const Mutation = {
  // User Management
  createUser: async (_: any, { input }: any, { prisma }: AdminContext) => {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new GraphQLError('Email already in use', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    const hashedPassword = await argon2.hash(input.password);

    const user = await prisma.user.create({
      data: {
        ...input,
        password: hashedPassword,
      },
      include: {
        sellerProfile: true,
      },
    });

    // Create seller profile if role is SELLER
    if (input.role === 'SELLER') {
      await prisma.sellerProfile.create({
        data: {
          userId: user.id,
          businessName: `${input.firstName} ${input.lastName}'s Store`,
          isVerified: false,
        },
      });
    }

    return user;
  },

  updateUser: async (_: any, { id, input }: any, { prisma }: AdminContext) => {
    if (input.email) {
      const existing = await prisma.user.findUnique({
        where: { email: input.email },
      });

      if (existing && existing.id !== id) {
        throw new GraphQLError('Email already in use', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
    }

    return await prisma.user.update({
      where: { id },
      data: input,
      include: {
        sellerProfile: true,
      },
    });
  },

  deleteUser: async (_: any, { id }: any, { prisma }: AdminContext) => {
    // Check if user has orders
    const orderCount = await prisma.order.count({
      where: { userId: id },
    });

    if (orderCount > 0) {
      throw new GraphQLError('Cannot delete user with existing orders. Deactivate instead.', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    await prisma.user.delete({ where: { id } });
    return true;
  },

  toggleUserStatus: async (_: any, { id }: any, { prisma }: AdminContext) => {
    const user = await prisma.user.findUnique({ where: { id } });
    
    if (!user) {
      throw new GraphQLError('User not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    return await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      include: {
        sellerProfile: true,
      },
    });
  },

  // Seller Management
  approveSeller: async (_: any, { id }: any, { prisma }: AdminContext) => {
    return await prisma.sellerProfile.update({
      where: { id },
      data: { isVerified: true, isActive: true },
      include: {
        user: true,
      },
    });
  },

  rejectSeller: async (_: any, { id }: any, { prisma }: AdminContext) => {
    await prisma.sellerProfile.delete({ where: { id } });
    return true;
  },

  updateSellerProfile: async (_: any, { id, input }: any, { prisma }: AdminContext) => {
    return await prisma.sellerProfile.update({
      where: { id },
      data: input,
      include: {
        user: true,
      },
    });
  },

  toggleSellerStatus: async (_: any, { id }: any, { prisma }: AdminContext) => {
    const seller = await prisma.sellerProfile.findUnique({ where: { id } });
    
    if (!seller) {
      throw new GraphQLError('Seller not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    return await prisma.sellerProfile.update({
      where: { id },
      data: { isActive: !seller.isActive },
      include: {
        user: true,
      },
    });
  },

  // Category Management
  createCategory: async (_: any, { input }: any, { prisma }: AdminContext) => {
    const existingSlug = await prisma.category.findUnique({
      where: { slug: input.slug },
    });

    if (existingSlug) {
      throw new GraphQLError('Slug already exists', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    return await prisma.category.create({
      data: {
        ...input,
        sortOrder: input.sortOrder || 0,
      },
    });
  },

  updateCategory: async (_: any, { id, input }: any, { prisma }: AdminContext) => {
    if (input.slug) {
      const existing = await prisma.category.findUnique({
        where: { slug: input.slug },
      });

      if (existing && existing.id !== id) {
        throw new GraphQLError('Slug already exists', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
    }

    return await prisma.category.update({
      where: { id },
      data: input,
    });
  },

  deleteCategory: async (_: any, { id }: any, { prisma }: AdminContext) => {
    // Check if category has products
    const productCount = await prisma.product.count({
      where: { categoryId: id },
    });

    if (productCount > 0) {
      throw new GraphQLError('Cannot delete category with products. Set to inactive instead.', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    await prisma.category.delete({ where: { id } });
    return true;
  },

  // Product Management
  updateProduct: async (_: any, { id, input }: any, { prisma }: AdminContext) => {
    return await prisma.product.update({
      where: { id },
      data: input,
      include: {
        images: true,
        variants: true,
        category: true,
        seller: {
          include: { user: true },
        },
        reviews: true,
      },
    });
  },

  deleteProduct: async (_: any, { id }: any, { prisma }: AdminContext) => {
    // Check if product has orders
    const orderItems = await prisma.orderItem.count({
      where: { productId: id },
    });

    if (orderItems > 0) {
      throw new GraphQLError('Cannot delete product with existing orders. Set to inactive instead.', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    await prisma.product.delete({ where: { id } });
    return true;
  },

  approveProduct: async (_: any, { id }: any, { prisma }: AdminContext) => {
    return await prisma.product.update({
      where: { id },
      data: { status: 'ACTIVE' },
      include: {
        images: true,
        variants: true,
        category: true,
        seller: {
          include: { user: true },
        },
        reviews: true,
      },
    });
  },

  rejectProduct: async (_: any, { id }: any, { prisma }: AdminContext) => {
    return await prisma.product.update({
      where: { id },
      data: { status: 'INACTIVE' },
      include: {
        images: true,
        variants: true,
        category: true,
        seller: {
          include: { user: true },
        },
        reviews: true,
      },
    });
  },

  // Order Management
  updateOrderStatus: async (_: any, { orderId, status }: any, { prisma }: AdminContext) => {
    return await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        user: true,
        seller: {
          include: { user: true },
        },
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
        address: true,
        shipping: true,
        payments: true,
      },
    });
  },

  refundOrder: async (_: any, { orderId }: any, { prisma }: AdminContext) => {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true },
    });

    if (!order) {
      throw new GraphQLError('Order not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    // Update order and payment status
    await prisma.payment.updateMany({
      where: { orderId },
      data: { status: 'REFUNDED' },
    });

    return await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'REFUNDED',
        paymentStatus: 'REFUNDED',
      },
      include: {
        user: true,
        seller: {
          include: { user: true },
        },
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
        address: true,
        shipping: true,
        payments: true,
      },
    });
  },

  // Review Moderation
  deleteReview: async (_: any, { id }: any, { prisma }: AdminContext) => {
    await prisma.review.delete({ where: { id } });
    return true;
  },
};
