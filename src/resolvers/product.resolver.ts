import { Context } from "../context";

export const productResolvers = {
  Query: {
    products: async (_: any, _args: any, ctx: Context) => {
      return ctx.prisma.product.findMany();
    },
  },
};
