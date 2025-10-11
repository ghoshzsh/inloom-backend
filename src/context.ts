import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export type Context = {
  prisma: PrismaClient;
  userId?: string;
};

export const createContext = ({ req }: any): Context => {
  const token = req.headers.authorization || "";
  let userId;
  // TODO: decode JWT token to extract user ID
  return { prisma, userId };
};
