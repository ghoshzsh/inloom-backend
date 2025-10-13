import { AdminContext } from '../context';

export const Query = {
  // Dashboard Analytics
  platformAnalytics: async (
    _: any,
    { startDate, endDate }: any,
    { prisma }: AdminContext
  ) => {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Get previous period for comparison
    const periodLength = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - periodLength);
    const prevEnd = start;

    // Current period data
    const [
      orders,
      prevOrders,
      totalCustomers,
      totalSellers,
      totalProducts,
      activeProducts,
      pendingSellers,
    ] = await Promise.all([
      prisma.order.findMany({
        where: {
          createdAt: { gte: start, lte: end },
          status: { not: 'CANCELLED' },
        },
        include: { items: true },
      }),
      prisma.order.findMany({
        where: {
          createdAt: { gte: prevStart, lte: prevEnd },
          status: { not: 'CANCELLED' },
        },
      }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.user.count({ where: { role: 'SELLER' } }),
      prisma.product.count(),
      prisma.product.count({ where: { status: 'ACTIVE' } }),
      prisma.sellerProfile.count({ where: { isVerified: false } }),
    ]);

    // Calculate metrics
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const prevRevenue = prevOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Growth calculations
    const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
    const orderGrowth = prevOrders.length > 0 
      ? ((totalOrders - prevOrders.length) / prevOrders.length) * 100 
      : 0;

    // Conversion rate (simplified)
    const totalUsers = await prisma.user.count({ where: { role: 'CUSTOMER' } });
    const conversionRate = totalUsers > 0 ? (totalOrders / totalUsers) * 100 : 0;

    // Top selling products
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          createdAt: { gte: start, lte: end },
          status: { not: 'CANCELLED' },
        },
      },
      include: {
        product: {
          include: {
            images: true,
            category: true,
            seller: true,
          },
        },
      },
    });

    const productStats = new Map();
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

    const topSellingProducts = Array.from(productStats.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);

    // Top performing sellers
    const sellerStats = new Map();
    orders.forEach((order) => {
      const existing = sellerStats.get(order.sellerId) || {
        totalRevenue: 0,
        totalOrders: 0,
      };
      sellerStats.set(order.sellerId, {
        totalRevenue: existing.totalRevenue + order.totalAmount,
        totalOrders: existing.totalOrders + 1,
      });
    });

    const topSellerIds = Array.from(sellerStats.entries())
      .sort((a, b) => b[1].totalRevenue - a[1].totalRevenue)
      .slice(0, 10)
      .map(([id]) => id);

    const topSellers = await prisma.sellerProfile.findMany({
      where: { id: { in: topSellerIds } },
      include: { user: true },
    });

    const topPerformingSellers = topSellers.map((seller) => ({
      seller,
      totalRevenue: sellerStats.get(seller.id)?.totalRevenue || 0,
      totalOrders: sellerStats.get(seller.id)?.totalOrders || 0,
      totalProducts: 0, // Will be populated by field resolver
    }));

    // Recent orders
    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        seller: true,
        items: {
          include: { product: true },
        },
        address: true,
      },
    });

    // Sales by day
    const salesByDay = new Map<string, { revenue: number; orders: number; customers: Set<string> }>();
    orders.forEach((order) => {
      const date = order.createdAt.toISOString().split('T')[0];
      const existing = salesByDay.get(date) || { revenue: 0, orders: 0, customers: new Set() };
      salesByDay.set(date, {
        revenue: existing.revenue + order.totalAmount,
        orders: existing.orders + 1,
        customers: existing.customers.add(order.userId),
      });
    });

    const salesByDayArray = Array.from(salesByDay.entries())
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        orders: data.orders,
        customers: data.customers.size,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Sales by category
    const categoryStats = new Map();
    orderItems.forEach((item) => {
      const categoryId = item.product.categoryId;
      const existing = categoryStats.get(categoryId) || {
        revenue: 0,
        orders: new Set(),
        products: new Set(),
      };
      existing.revenue += item.totalPrice;
      existing.orders.add(item.orderId);
      existing.products.add(item.productId);
      categoryStats.set(categoryId, existing);
    });

    const categories = await prisma.category.findMany({
      where: { id: { in: Array.from(categoryStats.keys()) } },
    });

    const salesByCategory = categories.map((category) => {
      const stats = categoryStats.get(category.id);
      return {
        category,
        revenue: stats.revenue,
        orders: stats.orders.size,
        products: stats.products.size,
      };
    });

    // Orders by status
    const ordersByStatus = await prisma.order.groupBy({
      by: ['status'],
      _count: { status: true },
      where: {
        createdAt: { gte: start, lte: end },
      },
    });

    const orderStatusCounts = ordersByStatus.map((item) => ({
      status: item.status,
      count: item._count.status,
    }));

    return {
      totalRevenue,
      totalOrders,
      totalCustomers,
      totalSellers,
      totalProducts,
      activeProducts,
      pendingSellers,
      averageOrderValue,
      conversionRate,
      revenueGrowth,
      orderGrowth,
      topSellingProducts,
      topPerformingSellers,
      recentOrders,
      salesByDay: salesByDayArray,
      salesByCategory,
      ordersByStatus: orderStatusCounts,
    };
  },

  userAnalytics: async (_: any, { startDate, endDate }: any, { prisma }: AdminContext) => {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      activeCustomers,
      activeSellers,
      usersByRole,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: today } } }),
      prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: monthAgo } } }),
      prisma.user.count({ where: { role: 'CUSTOMER', isActive: true } }),
      prisma.user.count({ where: { role: 'SELLER', isActive: true } }),
      prisma.user.groupBy({
        by: ['role'],
        _count: { role: true },
      }),
    ]);

    // User growth data
    const users = await prisma.user.findMany({
      where: {
        createdAt: { gte: start, lte: end },
      },
      select: {
        createdAt: true,
        role: true,
      },
    });

    const growthByDay = new Map<string, { customers: number; sellers: number }>();
    users.forEach((user) => {
      const date = user.createdAt.toISOString().split('T')[0];
      const existing = growthByDay.get(date) || { customers: 0, sellers: 0 };
      if (user.role === 'CUSTOMER') existing.customers++;
      if (user.role === 'SELLER') existing.sellers++;
      growthByDay.set(date, existing);
    });

    const userGrowth = Array.from(growthByDay.entries())
      .map(([date, data]) => ({
        date,
        customers: data.customers,
        sellers: data.sellers,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalUsers,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      activeCustomers,
      activeSellers,
      usersByRole: usersByRole.map((item) => ({
        role: item.role,
        count: item._count.role,
      })),
      userGrowth,
    };
  },

  // User Management
  users: async (_: any, { filter, limit = 20, offset = 0 }: any, { prisma }: AdminContext) => {
    const where: any = {};

    if (filter?.role) where.role = filter.role;
    if (filter?.isActive !== undefined) where.isActive = filter.isActive;
    if (filter?.search) {
      where.OR = [
        { email: { contains: filter.search, mode: 'insensitive' } },
        { firstName: { contains: filter.search, mode: 'insensitive' } },
        { lastName: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        take: limit,
        skip: offset,
        include: {
          sellerProfile: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      edges: users.map((user) => ({
        node: user,
        cursor: user.id,
      })),
      pageInfo: {
        hasNextPage: offset + limit < totalCount,
        hasPreviousPage: offset > 0,
        startCursor: users[0]?.id,
        endCursor: users[users.length - 1]?.id,
      },
      totalCount,
    };
  },

  user: async (_: any, { id }: any, { prisma }: AdminContext) => {
    return await prisma.user.findUnique({
      where: { id },
      include: {
        sellerProfile: true,
      },
    });
  },

  // Seller Management
  sellers: async (_: any, { filter, limit = 20, offset = 0 }: any, { prisma }: AdminContext) => {
    const where: any = {};

    if (filter?.isActive !== undefined) where.isActive = filter.isActive;
    if (filter?.search) {
      where.OR = [
        { businessName: { contains: filter.search, mode: 'insensitive' } },
        { user: {
          OR: [
            { email: { contains: filter.search, mode: 'insensitive' } },
            { firstName: { contains: filter.search, mode: 'insensitive' } },
            { lastName: { contains: filter.search, mode: 'insensitive' } },
          ],
        }},
      ];
    }

    const [sellers, totalCount] = await Promise.all([
      prisma.sellerProfile.findMany({
        where,
        take: limit,
        skip: offset,
        include: {
          user: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.sellerProfile.count({ where }),
    ]);

    return {
      edges: sellers.map((seller) => ({
        node: seller,
        cursor: seller.id,
      })),
      pageInfo: {
        hasNextPage: offset + limit < totalCount,
        hasPreviousPage: offset > 0,
        startCursor: sellers[0]?.id,
        endCursor: sellers[sellers.length - 1]?.id,
      },
      totalCount,
    };
  },

  seller: async (_: any, { id }: any, { prisma }: AdminContext) => {
    return await prisma.sellerProfile.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });
  },

  pendingSellers: async (_: any, __: any, { prisma }: AdminContext) => {
    return await prisma.sellerProfile.findMany({
      where: { isVerified: false },
      include: {
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  // Product Management
  allProducts: async (_: any, { filter, limit = 20, offset = 0 }: any, { prisma }: AdminContext) => {
    const where: any = {};

    if (filter?.status) where.status = filter.status;
    if (filter?.categoryId) where.categoryId = filter.categoryId;
    if (filter?.sellerId) where.sellerId = filter.sellerId;
    if (filter?.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { sku: { contains: filter.search, mode: 'insensitive' } },
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
          category: true,
          seller: {
            include: { user: true },
          },
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

  product: async (_: any, { id }: any, { prisma }: AdminContext) => {
    return await prisma.product.findUnique({
      where: { id },
      include: {
        images: true,
        variants: true,
        category: true,
        seller: {
          include: { user: true },
        },
        reviews: {
          include: { user: true },
        },
      },
    });
  },

  // Category Management
  categories: async (_: any, __: any, { prisma }: AdminContext) => {
    return await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  },

  category: async (_: any, { id }: any, { prisma }: AdminContext) => {
    return await prisma.category.findUnique({
      where: { id },
    });
  },

  // Order Management
  allOrders: async (_: any, { filter, limit = 20, offset = 0 }: any, { prisma }: AdminContext) => {
    const where: any = {};

    if (filter?.status) where.status = filter.status;
    if (filter?.paymentStatus) where.paymentStatus = filter.paymentStatus;
    if (filter?.sellerId) where.sellerId = filter.sellerId;
    if (filter?.userId) where.userId = filter.userId;
    if (filter?.startDate || filter?.endDate) {
      where.createdAt = {};
      if (filter.startDate) where.createdAt.gte = new Date(filter.startDate);
      if (filter.endDate) where.createdAt.lte = new Date(filter.endDate);
    }

    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        take: limit,
        skip: offset,
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
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ]);

    return {
      edges: orders.map((order) => ({
        node: order,
        cursor: order.id,
      })),
      pageInfo: {
        hasNextPage: offset + limit < totalCount,
        hasPreviousPage: offset > 0,
        startCursor: orders[0]?.id,
        endCursor: orders[orders.length - 1]?.id,
      },
      totalCount,
    };
  },

  order: async (_: any, { id }: any, { prisma }: AdminContext) => {
    return await prisma.order.findUnique({
      where: { id },
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

  // Review Management
  allReviews: async (_: any, { productId, limit = 20, offset = 0 }: any, { prisma }: AdminContext) => {
    const where: any = {};
    if (productId) where.productId = productId;

    return await prisma.review.findMany({
      where,
      take: limit,
      skip: offset,
      include: {
        user: true,
        product: {
          include: {
            seller: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },
};
