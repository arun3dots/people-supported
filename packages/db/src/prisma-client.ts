import { PrismaClient, type Prisma } from "./generated/client";

export function createDatabaseClient(
  options: Prisma.PrismaClientOptions,
): PrismaClient {
  return new PrismaClient(options);
}
