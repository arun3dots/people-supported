import { PrismaClient, Prisma } from "./generated/client";
import {
  encrypt,
  decrypt,
  isEncrypted,
  assertEncryptionKeyConfigured,
} from "./crypto";
import { decryptPartA, decryptWholePart } from "./pre-admission-crypto";
import { encryptPrismaWrite } from "./encrypted-prisma-writes";
import { createDatabaseClient } from "./prisma-client";

export {
  PrismaClient,
  Prisma,
  encrypt,
  decrypt,
  isEncrypted,
  assertEncryptionKeyConfigured,
};
export * from "./crypto";
export * from "./encrypted-prisma-writes";
export * from "./aws-client-config";
export * from "./kms-keyring";
export { inventoryKmsFields } from "./kms-backfill";
export * from "./kms-verification";
export * from "./pre-admission-crypto";
export * from "./generated/client";

const globalForPrisma = globalThis as unknown as {
  rawPrisma: PrismaClient | undefined;
};

/**
 * Raw PrismaClient instance — no extensions applied.
 * Use this for models that don't need the encryption layer (e.g. RefreshToken, Role).
 */
export const rawPrisma =
  globalForPrisma.rawPrisma ??
  createDatabaseClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production")
  globalForPrisma.rawPrisma = rawPrisma;

function createExtendedClient() {
  // Adding the NHS Compliance Extension for Data at Rest Encryption (E-02)
  return rawPrisma.$extends({
    query: {
      $allModels: {
        $allOperations({ model, operation, args, query }) {
          encryptPrismaWrite(model, operation, args);
          return query(args);
        },
      },
    },
    result: {
      residentPreAdmission: {
        partA: {
          needs: { partA: true },
          compute: (data) => decryptPartA(data.partA),
        },
        partB: {
          needs: { partB: true },
          compute: (data) => decryptWholePart(data.partB),
        },
        partE: {
          needs: { partE: true },
          compute: (data) => decryptWholePart(data.partE),
        },
        partF: {
          needs: { partF: true },
          compute: (data) => decryptWholePart(data.partF),
        },
      },
      resident: {
        nhsNumber: {
          needs: { nhsNumber: true },
          compute(data) {
            return decrypt(data.nhsNumber) ?? null;
          },
        },
        dob: {
          needs: { dob: true },
          compute(data) {
            return decrypt(data.dob) ?? null;
          },
        },
      },
      userProfile: {
        phoneNumber: {
          needs: { phoneNumber: true },
          compute(data) {
            return decrypt(data.phoneNumber);
          },
        },
        addressLine1: {
          needs: { addressLine1: true },
          compute(data) {
            return decrypt(data.addressLine1);
          },
        },
      },
      dbsCheck: {
        certificateNumber: {
          needs: { certificateNumber: true },
          compute(data) {
            return decrypt(data.certificateNumber) ?? null;
          },
        },
      },
      user: {
        dbsNumber: {
          needs: { dbsNumber: true },
          compute(data) {
            return decrypt(data.dbsNumber) ?? null;
          },
        },
        niNumber: {
          needs: { niNumber: true },
          compute(data) {
            return decrypt(data.niNumber) ?? null;
          },
        },
        mfaSecret: {
          needs: { mfaSecret: true },
          compute(data) {
            return decrypt(data.mfaSecret) ?? null;
          },
        },
      },
    },
  });
}

const globalForExtended = globalThis as unknown as {
  prisma: ReturnType<typeof createExtendedClient> | undefined;
};

/** Extended PrismaClient with NHS encryption for Resident, UserProfile, DbsCheck, and User models */
export const prisma = globalForExtended.prisma ?? createExtendedClient();

if (process.env.NODE_ENV !== "production") globalForExtended.prisma = prisma;

/** Type helper for transaction clients */
export type PrismaTransactionClient = Parameters<
  Parameters<typeof prisma.$transaction>[0]
>[0];

export type RawPrismaTransactionClient = Parameters<
  Parameters<typeof rawPrisma.$transaction>[0]
>[0];
