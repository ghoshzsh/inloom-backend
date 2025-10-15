import { Query } from './query.js';
import { Mutation } from './mutation.js';
import { GraphQLDateTime, GraphQLJSON } from 'graphql-scalars';

// Field resolvers
const Product = {
  averageRating: (parent: any) => {
    if (!parent.reviews || parent.reviews.length === 0) return 0;
    const sum = parent.reviews.reduce((acc: number, review: any) => acc + review.rating, 0);
    return sum / parent.reviews.length;
  },
  reviewCount: (parent: any) => {
    return parent.reviews?.length || 0;
  },
};

const Category = {
  products: async (
    parent: any,
    { limit = 20, offset = 0, status }: any,
    { prisma }: any
  ) => {
    const where: any = {
      categoryId: parent.id,
    };

    if (status) {
      where.status = status;
    } else {
      where.status = 'ACTIVE';
    }

    const products = await prisma.product.findMany({
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
    });

    const totalCount = await prisma.product.count({ where });

    return {
      edges: products.map((product: any) => ({
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
};

export const shopResolvers = {
  Query,
  Mutation,
  Product,
  Category,
  DateTime: GraphQLDateTime,
  JSON: GraphQLJSON,
};
