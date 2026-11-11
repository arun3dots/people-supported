import { PrismaClient } from "./generated/client";

const globalForAuditPrisma = globalThis as unknown as {
  auditPrisma: PrismaClient | undefined;
};

/**
 * Dedicated Prisma client for the CQC Audit Database.
 * Points to AUDIT_DATABASE_URL — completely isolated from the main DB.
 * INSERT-only in production (enforced by DB-level roles and trigger).
 */
export const auditPrisma =
  globalForAuditPrisma.auditPrisma ??
  new PrismaClient({
    datasources: {
      db: { url: process.env.AUDIT_DATABASE_URL },
    },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForAuditPrisma.auditPrisma = auditPrisma;
}

export * from "./generated/client";
