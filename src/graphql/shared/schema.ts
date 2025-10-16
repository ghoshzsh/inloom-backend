export const sharedTypeDefs = `#graphql
  # Scalars
  scalar DateTime
  scalar JSON

  # Enums
  enum UserRole {
    CUSTOMER
    SELLER
    ADMIN
  }

  enum OrderStatus {
    PENDING
    CONFIRMED
    PROCESSING
    SHIPPED
    DELIVERED
    CANCELLED
    REFUNDED
  }

  enum PaymentStatus {
    PENDING
    PAID
    FAILED
    REFUNDED
  }

  enum ProductStatus {
    DRAFT
    ACTIVE
    INACTIVE
    OUT_OF_STOCK
  }

  enum ShippingStatus {
    PENDING
    PICKED_UP
    IN_TRANSIT
    OUT_FOR_DELIVERY
    DELIVERED
  }

  enum AddressType {
    SHIPPING
    BILLING
  }

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
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
`;
