import { sharedTypeDefs } from "../shared/schema";

export const adminTypeDefs = `#graphql

  ${sharedTypeDefs}

  # Types
  type User {
    id: ID!
    email: String!
    firstName: String!
    lastName: String!
    phone: String!
    role: UserRole!
    isActive: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
    lastLogin: DateTime
    sellerProfile: SellerProfile
    orderCount: Int!
    totalSpent: Float!
  }

  type SellerProfile {
    id: ID!
    user: User!
    businessName: String!
    businessType: String
    taxId: String
    description: String
    logo: String
    banner: String
    phone: String
    website: String
    isVerified: Boolean!
    isActive: Boolean!
    commissionRate: Float!
    totalProducts: Int!
    totalRevenue: Float!
    totalOrders: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Category {
    id: ID!
    name: String!
    slug: String!
    description: String
    image: String
    parentId: ID
    isActive: Boolean!
    sortOrder: Int!
    productCount: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Product {
    id: ID!
    name: String!
    slug: String!
    description: String
    sku: String!
    status: ProductStatus!
    basePrice: Float!
    salePrice: Float
    stockQuantity: Int!
    seller: SellerProfile!
    category: Category!
    images: [ProductImage!]!
    variants: [ProductVariant!]!
    reviews: [Review!]!
    averageRating: Float
    reviewCount: Int!
    totalSold: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type ProductImage {
    id: ID!
    url: String!
    altText: String
    isMain: Boolean!
  }

  type ProductVariant {
    id: ID!
    sku: String!
    name: String!
    price: Float
    stockQuantity: Int!
    isActive: Boolean!
    attributes: JSON!
  }

  type Review {
    id: ID!
    rating: Int!
    title: String
    comment: String
    isVerified: Boolean!
    user: User!
    product: Product!
    createdAt: DateTime!
  }

  type Order {
    id: ID!
    orderNumber: String!
    user: User!
    seller: SellerProfile!
    status: OrderStatus!
    paymentStatus: PaymentStatus!
    shippingStatus: ShippingStatus!
    items: [OrderItem!]!
    subtotal: Float!
    taxAmount: Float!
    shippingAmount: Float!
    discountAmount: Float!
    totalAmount: Float!
    shippingAddress: Address!
    shipping: Shipping
    payment: Payment
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type OrderItem {
    id: ID!
    product: Product!
    variant: ProductVariant
    quantity: Int!
    unitPrice: Float!
    totalPrice: Float!
    productName: String!
  }

  type Address {
    id: ID!
    firstName: String!
    lastName: String!
    phone: String!
    addressLine1: String!
    addressLine2: String
    city: String!
    state: String!
    postalCode: String!
    country: String!
  }

  type Shipping {
    id: ID!
    method: String!
    carrier: String
    trackingNumber: String
    status: ShippingStatus!
    shippedAt: DateTime
    deliveredAt: DateTime
  }

  type Payment {
    id: ID!
    amount: Float!
    currency: String!
    status: PaymentStatus!
    paymentMethod: String!
    transactionId: String
    createdAt: DateTime!
  }

  # Dashboard Analytics Types
  type PlatformAnalytics {
    totalRevenue: Float!
    totalOrders: Int!
    totalCustomers: Int!
    totalSellers: Int!
    totalProducts: Int!
    activeProducts: Int!
    pendingSellers: Int!
    averageOrderValue: Float!
    conversionRate: Float!
    revenueGrowth: Float!
    orderGrowth: Float!
    topSellingProducts: [TopProduct!]!
    topPerformingSellers: [TopSeller!]!
    recentOrders: [Order!]!
    salesByDay: [DailySales!]!
    salesByCategory: [CategorySales!]!
    ordersByStatus: [OrderStatusCount!]!
  }

  type TopProduct {
    product: Product!
    totalSold: Int!
    totalRevenue: Float!
  }

  type TopSeller {
    seller: SellerProfile!
    totalRevenue: Float!
    totalOrders: Int!
    totalProducts: Int!
  }

  type DailySales {
    date: String!
    revenue: Float!
    orders: Int!
    customers: Int!
  }

  type CategorySales {
    category: Category!
    revenue: Float!
    orders: Int!
    products: Int!
  }

  type OrderStatusCount {
    status: OrderStatus!
    count: Int!
  }

  type UserAnalytics {
    totalUsers: Int!
    newUsersToday: Int!
    newUsersThisWeek: Int!
    newUsersThisMonth: Int!
    activeCustomers: Int!
    activeSellers: Int!
    usersByRole: [UserRoleCount!]!
    userGrowth: [UserGrowthData!]!
  }

  type UserRoleCount {
    role: UserRole!
    count: Int!
  }

  type UserGrowthData {
    date: String!
    customers: Int!
    sellers: Int!
  }

  # Pagination Types
  type UserConnection {
    edges: [UserEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type UserEdge {
    node: User!
    cursor: String!
  }

  type OrderConnection {
    edges: [OrderEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type OrderEdge {
    node: Order!
    cursor: String!
  }

  type SellerConnection {
    edges: [SellerEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type SellerEdge {
    node: SellerProfile!
    cursor: String!
  }

  # Input Types
  input CreateUserInput {
    email: String!
    password: String!
    firstName: String!
    lastName: String!
    phone: String!
    role: UserRole!
  }

  input UpdateUserInput {
    email: String
    firstName: String
    lastName: String
    phone: String
    role: UserRole
    isActive: Boolean
  }

  input CreateCategoryInput {
    name: String!
    slug: String!
    description: String
    image: String
    parentId: ID
    sortOrder: Int
  }

  input UpdateCategoryInput {
    name: String
    slug: String
    description: String
    image: String
    parentId: ID
    isActive: Boolean
    sortOrder: Int
  }

  input UpdateSellerProfileInput {
    businessName: String
    businessType: String
    description: String
    logo: String
    banner: String
    phone: String
    website: String
    isVerified: Boolean
    isActive: Boolean
    commissionRate: Float
  }

  input UpdateProductInput {
    name: String
    status: ProductStatus
    basePrice: Float
    salePrice: Float
    stockQuantity: Int
  }

  input UserFilterInput {
    role: UserRole
    isActive: Boolean
    search: String
  }

  input ProductFilterInput {
    status: ProductStatus
    categoryId: ID
    sellerId: ID
    search: String
  }

  input OrderFilterInput {
    status: OrderStatus
    paymentStatus: PaymentStatus
    sellerId: ID
    userId: ID
    startDate: DateTime
    endDate: DateTime
  }

  # Queries
  type Query {
    # Dashboard Analytics
    platformAnalytics(
      startDate: DateTime
      endDate: DateTime
    ): PlatformAnalytics!
    
    userAnalytics(
      startDate: DateTime
      endDate: DateTime
    ): UserAnalytics!

    # User Management
    users(
      filter: UserFilterInput
      limit: Int = 20
      offset: Int = 0
    ): UserConnection!
    
    user(id: ID!): User
    
    # Seller Management
    sellers(
      filter: UserFilterInput
      limit: Int = 20
      offset: Int = 0
    ): SellerConnection!
    
    seller(id: ID!): SellerProfile
    
    pendingSellers: [SellerProfile!]!
    
    # Product Management
    allProducts(
      filter: ProductFilterInput
      limit: Int = 20
      offset: Int = 0
    ): ProductConnection!
    
    product(id: ID!): Product
    
    # Category Management
    categories: [Category!]!
    category(id: ID!): Category
    
    # Order Management
    allOrders(
      filter: OrderFilterInput
      limit: Int = 20
      offset: Int = 0
    ): OrderConnection!
    
    order(id: ID!): Order
    
    # Review Management
    allReviews(
      productId: ID
      limit: Int = 20
      offset: Int = 0
    ): [Review!]!
  }

  # Mutations
  type Mutation {
    # User Management
    createUser(input: CreateUserInput!): User!
    updateUser(id: ID!, input: UpdateUserInput!): User!
    deleteUser(id: ID!): Boolean!
    toggleUserStatus(id: ID!): User!
    
    # Seller Management
    approveSeller(id: ID!): SellerProfile!
    rejectSeller(id: ID!): Boolean!
    updateSellerProfile(id: ID!, input: UpdateSellerProfileInput!): SellerProfile!
    toggleSellerStatus(id: ID!): SellerProfile!
    
    # Category Management
    createCategory(input: CreateCategoryInput!): Category!
    updateCategory(id: ID!, input: UpdateCategoryInput!): Category!
    deleteCategory(id: ID!): Boolean!
    
    # Product Management
    updateProduct(id: ID!, input: UpdateProductInput!): Product!
    deleteProduct(id: ID!): Boolean!
    approveProduct(id: ID!): Product!
    rejectProduct(id: ID!): Product!
    
    # Order Management
    updateOrderStatus(orderId: ID!, status: OrderStatus!): Order!
    refundOrder(orderId: ID!): Order!
    
    # Review Moderation
    deleteReview(id: ID!): Boolean!
  }
`;
