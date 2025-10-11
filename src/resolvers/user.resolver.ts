import { Context } from "../context";
import bcrypt from "bcrypt";

export const userResolvers = {
  Query: {
    users: async (_parent: any, _args: any, ctx: Context) => {
      return ctx.prisma.user.findMany();
    },
  },
  Mutation: {
    signup: async (_: any, args: { email: string; password: string }, ctx: Context) => {
      const hashed = await bcrypt.hash(args.password, 10);
      return ctx.prisma.user.create({
        data: { email: args.email, password: hashed },
      });
    },
  },
};
