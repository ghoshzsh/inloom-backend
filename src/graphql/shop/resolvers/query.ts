import { ShopContext } from '../../../types/context';
import { GraphQLError } from 'graphql';

export const Query = {
  // Products
  products: async (
    _: any,
    { filter, limit = 20, offset = 0 }: any,
    { prisma }: ShopContext
  ) => {
    const where: any = {
      status: 'ACTIVE',
    };

    if (filter?.categoryId) {
      where.categoryId = filter.categoryId;
    }

    if (filter?.minPrice || filter?.maxPrice) {
      where.basePrice = {};
      if (filter.minPrice) where.basePrice.gte = filter.minPrice;
      if (filter.maxPrice) where.basePrice.lte = filter.maxPrice;
    }

    if (filter?.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        take: limit,
        skip: offset,
        include: {
          images: true,
          variants: true,
          attributes: true,
          category: true,
          seller: true,
          reviews: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      edges: products.map((product) => ({
        node: product,
        cursor: product.id,
      })),
      pageInfo: {
        hasNextPage: offset + limit < totalCount,
        hasPreviousPage: offset > 0,
        startCursor: products[0]?.id,
        endCursor: products[products.length - 1]?.id,
      },
      totalCount,
    };
  },

  product: async (_: any, { id, slug }: any, { prisma }: ShopContext) => {
    const where = id ? { id } : { slug };

    return await prisma.product.findUnique({
      where,
      include: {
        images: true,
        variants: true,
        attributes: true,
        category: true,
        seller: true,
        reviews: {
          include: {
            user: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  },

  // Categories
  categories: async (_: any, __: any, { prisma }: ShopContext) => {
    return await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  },

  category: async (_: any, { id, slug }: any, { prisma }: ShopContext) => {
    const where = id ? { id } : { slug };
    return await prisma.category.findUnique({ where });
  },

  // User
  me: async (_: any, __: any, { prisma, user }: ShopContext) => {
    if (!user) {
      throw new GraphQLError('Not authenticated', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    return await prisma.user.findUnique({
      where: { id: user.id },
    });
  },

  // Cart
  myCart: async (_: any, __: any, { prisma, user }: ShopContext) => {
    if (!user) {
      return { items: [], itemCount: 0, subtotal: 0 };
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: user.id },
      include: {
        product: {
          include: {
            images: true,
          },
        },
        variant: true,
      },
    });

    const subtotal = cartItems.reduce((sum, item) => {
      const price = item.variant?.price || item.product.salePrice || item.product.basePrice;
      return sum + price * item.quantity;
    }, 0);

    return {
      items: cartItems,
      itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
    };
  },

  // Orders
  myOrders: async (_: any, { limit = 10, offset = 0 }: any, { prisma, user }: ShopContext) => {
    if (!user) {
      throw new GraphQLError('Not authenticated', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    return await prisma.order.findMany({
      where: { userId: user.id },
      take: limit,
      skip: offset,
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
        address: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  order: async (_: any, { id }: any, { prisma, user }: ShopContext) => {
    if (!user) {
      throw new GraphQLError('Not authenticated', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
        address: true,
      },
    });

    if (!order || order.userId !== user.id) {
      throw new GraphQLError('Order not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    return order;
  },

  // Wishlist
  myWishlist: async (_: any, __: any, { prisma, user }: ShopContext) => {
    if (!user) {
      return [];
    }

    return await prisma.wishlistItem.findMany({
      where: { userId: user.id },
      include: {
        product: {
          include: {
            images: true,
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  // Addresses
  myAddresses: async (_: any, __: any, { prisma, user }: ShopContext) => {
    if (!user) {
      throw new GraphQLError('Not authenticated', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    return await prisma.address.findMany({
      where: { userId: user.id },
      orderBy: { isDefault: 'desc' },
    });
  },
};
