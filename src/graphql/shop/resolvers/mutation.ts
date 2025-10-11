import { ShopContext } from '../../../types/context';
import { GraphQLError } from 'graphql';
import * as argon2 from 'argon2';
import { generateToken } from '../../../middleware/auth';

export const Mutation = {
  // Auth
  register: async (_: any, { input }: any, { prisma }: ShopContext) => {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new GraphQLError('Email already in use', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    // Hash password
    const hashedPassword = await argon2.hash(input.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: input.email,
        password: hashedPassword,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        role: 'CUSTOMER',
      },
    });

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { token, user };
  },

  login: async (_: any, { input }: any, { prisma }: ShopContext) => {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw new GraphQLError('Invalid credentials', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    // Verify password
    const valid = await argon2.verify(user.password, input.password);

    if (!valid) {
      throw new GraphQLError('Invalid credentials', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { token, user };
  },

  // Cart
  addToCart: async (_: any, { input }: any, { prisma, user }: ShopContext) => {
    if (!user) {
      throw new GraphQLError('Not authenticated', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    // Check if item already in cart
    const existing = await prisma.cartItem.findUnique({
      where: {
        userId_productId_variantId: {
          userId: user.id,
          productId: input.productId,
          variantId: input.variantId || null,
        },
      },
    });

    if (existing) {
      // Update quantity
      return await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + input.quantity },
        include: {
          product: {
            include: { images: true },
          },
          variant: true,
        },
      });
    }

    // Create new cart item
    return await prisma.cartItem.create({
      data: {
        userId: user.id,
        productId: input.productId,
        variantId: input.variantId,
        quantity: input.quantity,
      },
      include: {
        product: {
          include: { images: true },
        },
        variant: true,
      },
    });
  },

  updateCartItem: async (_: any, { input }: any, { prisma, user }: ShopContext) => {
    if (!user) {
      throw new GraphQLError('Not authenticated', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    return await prisma.cartItem.update({
      where: {
        id: input.cartItemId,
        userId: user.id,
      },
      data: { quantity: input.quantity },
      include: {
        product: {
          include: { images: true },
        },
        variant: true,
      },
    });
  },

  removeFromCart: async (_: any, { cartItemId }: any, { prisma, user }: ShopContext) => {
    if (!user) {
      throw new GraphQLError('Not authenticated', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    await prisma.cartItem.delete({
      where: {
        id: cartItemId,
        userId: user.id,
      },
    });

    return true;
  },

  clearCart: async (_: any, __: any, { prisma, user }: ShopContext) => {
    if (!user) {
      throw new GraphQLError('Not authenticated', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    await prisma.cartItem.deleteMany({
      where: { userId: user.id },
    });

    return true;
  },

  // Wishlist
  addToWishlist: async (_: any, { productId }: any, { prisma, user }: ShopContext) => {
    if (!user) {
      throw new GraphQLError('Not authenticated', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    return await prisma.wishlistItem.create({
      data: {
        userId: user.id,
        productId,
      },
      include: {
        product: {
          include: { images: true, category: true },
        },
      },
    });
  },

  removeFromWishlist: async (_: any, { productId }: any, { prisma, user }: ShopContext) => {
    if (!user) {
      throw new GraphQLError('Not authenticated', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    await prisma.wishlistItem.delete({
      where: {
        userId_productId: {
          userId: user.id,
          productId,
        },
      },
    });

    return true;
  },

  // Address
  createAddress: async (_: any, { input }: any, { prisma, user }: ShopContext) => {
    if (!user) {
      throw new GraphQLError('Not authenticated', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    // If this is default, unset others
    if (input.isDefault) {
      await prisma.address.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    return await prisma.address.create({
      data: {
        ...input,
        userId: user.id,
      },
    });
  },

  updateAddress: async (_: any, { id, input }: any, { prisma, user }: ShopContext) => {
    if (!user) {
      throw new GraphQLError('Not authenticated', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    // If this is default, unset others
    if (input.isDefault) {
      await prisma.address.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    return await prisma.address.update({
      where: { id, userId: user.id },
      data: input,
    });
  },

  deleteAddress: async (_: any, { id }: any, { prisma, user }: ShopContext) => {
    if (!user) {
      throw new GraphQLError('Not authenticated', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    await prisma.address.delete({
      where: { id, userId: user.id },
    });

    return true;
  },

  // Review
  createReview: async (_: any, { input }: any, { prisma, user }: ShopContext) => {
    if (!user) {
      throw new GraphQLError('Not authenticated', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    // Validate rating
    if (input.rating < 1 || input.rating > 5) {
      throw new GraphQLError('Rating must be between 1 and 5', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    // Check if user has purchased this product
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId: input.productId,
        order: {
          userId: user.id,
          status: 'DELIVERED',
        },
      },
    });

    return await prisma.review.create({
      data: {
        userId: user.id,
        productId: input.productId,
        rating: input.rating,
        title: input.title,
        comment: input.comment,
        isVerified: !!hasPurchased,
      },
      include: {
        user: true,
        product: true,
      },
    });
  },
};
