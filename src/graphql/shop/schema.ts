export const shopTypeDefs = `#graphql
  # Scalars
  scalar DateTime
  scalar JSON

  # Enums
  enum ProductStatus {
    DRAFT
    ACTIVE
    INACTIVE
    OUT_OF_STOCK
  }

  enum OrderStatus {
    PENDING
    CONFIRMED
    PROCESSING
    SHIPPED
    DELIVERED
    CANCELLED
  }

  # Types
  type User {
    id: ID!
    email: String!
    firstName: String!
    lastName: String!
    phone: String
    createdAt: DateTime!
  }

  type Category {
    id: ID!
    name: String!
    slug: String!
    description: String
    image: String
    products(
      limit: Int
      offset: Int
      status: ProductStatus
    ): ProductConnection!
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
    stockQuantity: Int!
    images: [ProductImage!]!
    variants: [ProductVariant!]!
    attributes: [ProductAttribute!]!
    category: Category!
    seller: SellerProfile!
    reviews: [Review!]!
    averageRating: Float
    reviewCount: Int!
    createdAt: DateTime!
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

  type ProductAttribute {
    id: ID!
    name: String!
    value: String!
  }

  type ProductConnection {
    edges: [ProductEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type ProductEdge {
    node: Product!
    cursor: String!
  }

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  type SellerProfile {
    id: ID!
    businessName: String!
    description: String
    logo: String
    isVerified: Boolean!
  }

  type Review {
    id: ID!
    rating: Int!
    title: String
    comment: String
    isVerified: Boolean!
    user: User!
    createdAt: DateTime!
  }

  type CartItem {
    id: ID!
    product: Product!
    variant: ProductVariant
    quantity: Int!
    createdAt: DateTime!
  }

  type Cart {
    items: [CartItem!]!
    itemCount: Int!
    subtotal: Float!
  }

  type Address {
    id: ID!
    type: String!
    firstName: String!
    lastName: String!
    company: String
    addressLine1: String!
    addressLine2: String
    city: String!
    state: String!
    postalCode: String!
    country: String!
    isDefault: Boolean!
  }

  type Order {
    id: ID!
    orderNumber: String!
    status: OrderStatus!
    items: [OrderItem!]!
    subtotal: Float!
    taxAmount: Float!
    shippingAmount: Float!
    discountAmount: Float!
    totalAmount: Float!
    shippingAddress: Address!
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

  type WishlistItem {
    id: ID!
    product: Product!
    createdAt: DateTime!
  }

  # Input Types
  input ProductFilterInput {
    categoryId: ID
    minPrice: Float
    maxPrice: Float
    status: ProductStatus
    search: String
  }

  input AddToCartInput {
    productId: ID!
    variantId: ID
    quantity: Int!
  }

  input UpdateCartItemInput {
    cartItemId: ID!
    quantity: Int!
  }

  input RegisterInput {
    email: String!
    password: String!
    firstName: String!
    lastName: String!
    phone: String
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input CreateAddressInput {
    type: String!
    firstName: String!
    lastName: String!
    company: String
    addressLine1: String!
    addressLine2: String
    city: String!
    state: String!
    postalCode: String!
    country: String!
    isDefault: Boolean
  }

  input CreateReviewInput {
    productId: ID!
    rating: Int!
    title: String
    comment: String
  }

  # Response Types
  type AuthPayload {
    token: String!
    user: User!
  }

  # Queries
  type Query {
    # Products
    products(
      filter: ProductFilterInput
      limit: Int = 20
      offset: Int = 0
    ): ProductConnection!
    
    product(id: ID, slug: String): Product
    
    # Categories
    categories: [Category!]!
    category(id: ID, slug: String): Category
    
    # User & Auth
    me: User
    
    # Cart
    myCart: Cart!
    
    # Orders
    myOrders(
      limit: Int = 10
      offset: Int = 0
    ): [Order!]!
    
    order(id: ID!): Order
    
    # Wishlist
    myWishlist: [WishlistItem!]!
    
    # Addresses
    myAddresses: [Address!]!
  }

  # Mutations
  type Mutation {
    # Auth
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    
    # Cart
    addToCart(input: AddToCartInput!): CartItem!
    updateCartItem(input: UpdateCartItemInput!): CartItem!
    removeFromCart(cartItemId: ID!): Boolean!
    clearCart: Boolean!
    
    # Wishlist
    addToWishlist(productId: ID!): WishlistItem!
    removeFromWishlist(productId: ID!): Boolean!
    
    # Address
    createAddress(input: CreateAddressInput!): Address!
    updateAddress(id: ID!, input: CreateAddressInput!): Address!
    deleteAddress(id: ID!): Boolean!
    
    # Review
    createReview(input: CreateReviewInput!): Review!
  }
`;
