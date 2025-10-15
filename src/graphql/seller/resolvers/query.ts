import { SellerContext } from '../context.js';
import { GraphQLError } from 'graphql';

export const Query = {
  // Seller Profile
  myProfile: async (_: any, __: any, { prisma, sellerProfileId }: SellerContext) => {
    return await prisma.sellerProfile.findUnique({
      where: { id: sellerProfileId },
    });
  },

  // Products
  myProducts: async (
    _: any,
    { filter, limit = 20, offset = 0 }: any,
    { prisma, sellerProfileId }: SellerContext
  ) => {
    const where: any = {
      sellerId: sellerProfileId,
    };

    if (filter?.status) {
      where.status = filter.status;
    }

    if (filter?.categoryId) {
      where.categoryId = filter.categoryId;
    }

    if (filter?.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } },
        { sku: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    if (filter?.lowStock) {
      where.AND = [
        { trackInventory: true },
        { stockQuantity: { lte: prisma.product.fields.lowStockThreshold } },
      ];
    }

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        take: limit,
        skip: offset,
        include: {
          images: { orderBy: { sortOrder: 'asc' } },
          variants: true,
          attributes: true,
          category: true,
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

  myProduct: async (_: any, { id }: any, { prisma, sellerProfileId }: SellerContext) => {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        variants: true,
        attributes: true,
        category: true,
        reviews: {
          include: { user: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product || product.sellerId !== sellerProfileId) {
      throw new GraphQLError('Product not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    return product;
  },

  // Categories
  categories: async (_: any, __: any, { prisma }: SellerContext) => {
    return await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  },

  // Orders
  myOrders: async (
    _: any,
    { status, limit = 20, offset = 0 }: any,
    { prisma, sellerProfileId }: SellerContext
  ) => {
    const where: any = {
      sellerId: sellerProfileId,
    };

    if (status) {
      where.status = status;
    }

    return await prisma.order.findMany({
      where,
      take: limit,
      skip: offset,
      include: {
        user: true,
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
      orderBy: { createdAt: 'desc' },
    });
  },

  myOrder: async (_: any, { id }: any, { prisma, sellerProfileId }: SellerContext) => {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: true,
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

    if (!order || order.sellerId !== sellerProfileId) {
      throw new GraphQLError('Order not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    return order;
  },

  // Analytics
  salesAnalytics: async (
    _: any,
    { startDate, endDate }: any,
    { prisma, sellerProfileId }: SellerContext
  ) => {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Get orders in date range
    const orders = await prisma.order.findMany({
      where: {
        sellerId: sellerProfileId,
        createdAt: {
          gte: start,
          lte: end,
        },
        status: { not: 'CANCELLED' },
      },
      include: {
        items: true,
      },
    });

    // Calculate metrics
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Get product counts
    const totalProducts = await prisma.product.count({
      where: { sellerId: sellerProfileId },
    });

    const lowStockProducts = await prisma.product.count({
      where: {
        sellerId: sellerProfileId,
        trackInventory: true,
        stockQuantity: { lte: prisma.product.fields.lowStockThreshold },
      },
    });

    const pendingOrders = await prisma.order.count({
      where: {
        sellerId: sellerProfileId,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    });

    // Group sales by day
    const salesByDay = new Map<string, { revenue: number; orders: number }>();
    
    orders.forEach((order) => {
      const date = order.createdAt.toISOString().split('T')[0];
      const existing = salesByDay.get(date) || { revenue: 0, orders: 0 };
      salesByDay.set(date, {
        revenue: existing.revenue + order.totalAmount,
        orders: existing.orders + 1,
      });
    });

    const recentSales = Array.from(salesByDay.entries())
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        orders: data.orders,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      totalProducts,
      lowStockProducts,
      pendingOrders,
      recentSales,
    };
  },

  topProducts: async (_: any, { limit = 10 }: any, { prisma, sellerProfileId }: SellerContext) => {
    const orderItems = await prisma.orderItem.findMany({
      where: {
        product: {
          sellerId: sellerProfileId,
        },
        order: {
          status: { not: 'CANCELLED' },
        },
      },
      include: {
        product: {
          include: {
            images: true,
            category: true,
          },
        },
      },
    });

    // Aggregate by product
    const productStats = new Map<string, { product: any; totalSold: number; totalRevenue: number }>();

    orderItems.forEach((item) => {
      const existing = productStats.get(item.productId) || {
        product: item.product,
        totalSold: 0,
        totalRevenue: 0,
      };

      productStats.set(item.productId, {
        product: item.product,
        totalSold: existing.totalSold + item.quantity,
        totalRevenue: existing.totalRevenue + item.totalPrice,
      });
    });

    return Array.from(productStats.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);
  },

  // Reviews
  myProductReviews: async (
    _: any,
    { productId, limit = 20, offset = 0 }: any,
    { prisma, sellerProfileId }: SellerContext
  ) => {
    const where: any = {
      product: {
        sellerId: sellerProfileId,
      },
    };

    if (productId) {
      where.productId = productId;
    }

    return await prisma.review.findMany({
      where,
      take: limit,
      skip: offset,
      include: {
        user: true,
        product: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  },
};
