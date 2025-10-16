import { sharedTypeDefs } from "../shared/schema.js";

export const sellerTypeDefs = `#graphql

  ${sharedTypeDefs}

  # Types
  type SellerProfile {
    id: ID!
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
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Category {
    id: ID!
    name: String!
    slug: String!
    description: String
    image: String
  }

  type Product {
    id: ID!
    name: String!
    slug: String!
    description: String
    shortDescription: String
    sku: String!
    status: ProductStatus!
    basePrice: Float!
    salePrice: Float
    costPrice: Float
    stockQuantity: Int!
    lowStockThreshold: Int!
    trackInventory: Boolean!
    metaTitle: String
    metaDescription: String
    category: Category!
    images: [ProductImage!]!
    variants: [ProductVariant!]!
    attributes: [ProductAttribute!]!
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
    sortOrder: Int!
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
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type ProductAttribute {
    id: ID!
    name: String!
    value: String!
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

  type User {
    id: ID!
    email: String!
    firstName: String!
    lastName: String!
  }

  type Order {
    id: ID!
    orderNumber: String!
    user: User!
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
    notes: String
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
    productImage: String
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
  }

  # Analytics Types
  type SalesAnalytics {
    totalRevenue: Float!
    totalOrders: Int!
    averageOrderValue: Float!
    totalProducts: Int!
    lowStockProducts: Int!
    pendingOrders: Int!
    recentSales: [DailySales!]!
  }

  type DailySales {
    date: String!
    revenue: Float!
    orders: Int!
  }

  type TopProduct {
    product: Product!
    totalSold: Int!
    totalRevenue: Float!
  }

  # Input Types
  input CreateProductInput {
    name: String!
    slug: String!
    description: String
    shortDescription: String
    sku: String!
    categoryId: ID!
    status: ProductStatus
    basePrice: Float!
    salePrice: Float
    costPrice: Float
    stockQuantity: Int!
    lowStockThreshold: Int
    trackInventory: Boolean
    metaTitle: String
    metaDescription: String
  }

  input UpdateProductInput {
    name: String
    slug: String
    description: String
    shortDescription: String
    sku: String
    categoryId: ID
    status: ProductStatus
    basePrice: Float
    salePrice: Float
    costPrice: Float
    stockQuantity: Int
    lowStockThreshold: Int
    trackInventory: Boolean
    metaTitle: String
    metaDescription: String
  }

  input CreateProductImageInput {
    url: String!
    altText: String
    sortOrder: Int
    isMain: Boolean
  }

  input CreateProductVariantInput {
    sku: String!
    name: String!
    price: Float
    stockQuantity: Int!
    attributes: JSON!
  }

  input UpdateProductVariantInput {
    sku: String
    name: String
    price: Float
    stockQuantity: Int
    isActive: Boolean
    attributes: JSON
  }

  input CreateProductAttributeInput {
    name: String!
    value: String!
  }

  input UpdateSellerProfileInput {
    businessName: String
    businessType: String
    description: String
    logo: String
    banner: String
    phone: String
    website: String
  }

  input UpdateOrderStatusInput {
    orderId: ID!
    status: OrderStatus!
  }

  input UpdateShippingInput {
    orderId: ID!
    method: String
    carrier: String
    trackingNumber: String
    status: ShippingStatus
  }

  input ProductFilterInput {
    status: ProductStatus
    categoryId: ID
    search: String
    lowStock: Boolean
  }

  # Queries
  type Query {
    # Seller Profile
    myProfile: SellerProfile!
    
    # Products
    myProducts(
      filter: ProductFilterInput
      limit: Int = 20
      offset: Int = 0
    ): ProductConnection!
    
    myProduct(id: ID!): Product
    
    # Categories (read-only for sellers)
    categories: [Category!]!
    
    # Orders
    myOrders(
      status: OrderStatus
      limit: Int = 20
      offset: Int = 0
    ): [Order!]!
    
    myOrder(id: ID!): Order
    
    # Analytics
    salesAnalytics(
      startDate: DateTime
      endDate: DateTime
    ): SalesAnalytics!
    
    topProducts(limit: Int = 10): [TopProduct!]!
    
    # Reviews
    myProductReviews(
      productId: ID
      limit: Int = 20
      offset: Int = 0
    ): [Review!]!
  }

  # Mutations
  type Mutation {
    # Seller Profile
    updateMyProfile(input: UpdateSellerProfileInput!): SellerProfile!
    
    # Product Management
    createProduct(input: CreateProductInput!): Product!
    updateProduct(id: ID!, input: UpdateProductInput!): Product!
    deleteProduct(id: ID!): Boolean!
    
    # Product Images
    addProductImage(productId: ID!, input: CreateProductImageInput!): ProductImage!
    updateProductImage(id: ID!, input: CreateProductImageInput!): ProductImage!
    deleteProductImage(id: ID!): Boolean!
    
    # Product Variants
    createProductVariant(productId: ID!, input: CreateProductVariantInput!): ProductVariant!
    updateProductVariant(id: ID!, input: UpdateProductVariantInput!): ProductVariant!
    deleteProductVariant(id: ID!): Boolean!
    
    # Product Attributes
    addProductAttribute(productId: ID!, input: CreateProductAttributeInput!): ProductAttribute!
    updateProductAttribute(id: ID!, name: String!, value: String!): ProductAttribute!
    deleteProductAttribute(id: ID!): Boolean!
    
    # Inventory Management
    updateStock(productId: ID!, variantId: ID, quantity: Int!): Product!
    bulkUpdateStock(updates: [StockUpdateInput!]!): [Product!]!
    
    # Order Management
    updateOrderStatus(input: UpdateOrderStatusInput!): Order!
    updateShipping(input: UpdateShippingInput!): Shipping!
  }

  input StockUpdateInput {
    productId: ID!
    variantId: ID
    quantity: Int!
  }
`;
