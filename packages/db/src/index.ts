import { PrismaClient, Prisma } from "./generated/client";
import {
  encrypt,
  decrypt,
  isEncrypted,
  assertEncryptionKeyConfigured,
} from "./crypto";
import {
  encryptPreAdmissionData,
  decryptPartA,
  decryptWholePart,
} from "./pre-admission-crypto";

type PreAdmissionWriteData = Record<string, unknown>;
const encryptPreAdmission = <T extends object>(data: T): T =>
  encryptPreAdmissionData(data as PreAdmissionWriteData) as T;

export {
  PrismaClient,
  Prisma,
  encrypt,
  decrypt,
  isEncrypted,
  assertEncryptionKeyConfigured,
};
export * from "./crypto";
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
  new PrismaClient({
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
      resident: {
        async create({ args, query }) {
          if (args.data.nhsNumber)
            args.data.nhsNumber = encrypt(args.data.nhsNumber) as string;
          if (args.data.dob)
            args.data.dob = encrypt(args.data.dob) as string;
          return query(args);
        },
        async update({ args, query }) {
          if (args.data.nhsNumber && typeof args.data.nhsNumber === "string") {
            args.data.nhsNumber = encrypt(args.data.nhsNumber) as string;
          }
          if (args.data.dob && typeof args.data.dob === "string") {
            args.data.dob = encrypt(args.data.dob) as string;
          }
          return query(args);
        },
      },
      residentPreAdmission: {
        async create({ args, query }) {
          args.data = encryptPreAdmission(args.data);
          return query(args);
        },
        async createMany({ args, query }) {
          args.data = Array.isArray(args.data)
            ? args.data.map((d) => encryptPreAdmission(d))
            : encryptPreAdmission(args.data);
          return query(args);
        },
        async update({ args, query }) {
          args.data = encryptPreAdmission(args.data);
          return query(args);
        },
        async updateMany({ args, query }) {
          args.data = encryptPreAdmission(args.data);
          return query(args);
        },
        async upsert({ args, query }) {
          args.create = encryptPreAdmission(args.create);
          args.update = encryptPreAdmission(args.update);
          return query(args);
        },
      },
      userProfile: {
        async create({ args, query }) {
          if (args.data.phoneNumber)
            args.data.phoneNumber = encrypt(args.data.phoneNumber) as string;
          if (args.data.addressLine1)
            args.data.addressLine1 = encrypt(args.data.addressLine1) as string;
          return query(args);
        },
        async update({ args, query }) {
          if (
            args.data.phoneNumber &&
            typeof args.data.phoneNumber === "string"
          ) {
            args.data.phoneNumber = encrypt(args.data.phoneNumber) as string;
          }
          if (
            args.data.addressLine1 &&
            typeof args.data.addressLine1 === "string"
          ) {
            args.data.addressLine1 = encrypt(args.data.addressLine1) as string;
          }
          return query(args);
        },
      },
      dbsCheck: {
        async create({ args, query }) {
          if (args.data.certificateNumber) {
            args.data.certificateNumber = encrypt(
              args.data.certificateNumber,
            ) as string;
          }
          return query(args);
        },
        async update({ args, query }) {
          if (
            args.data.certificateNumber &&
            typeof args.data.certificateNumber === "string"
          ) {
            args.data.certificateNumber = encrypt(
              args.data.certificateNumber,
            ) as string;
          }
          return query(args);
        },
        async upsert({ args, query }) {
          if (args.create.certificateNumber) {
            args.create.certificateNumber = encrypt(
              args.create.certificateNumber,
            ) as string;
          }
          if (
            args.update.certificateNumber &&
            typeof args.update.certificateNumber === "string"
          ) {
            args.update.certificateNumber = encrypt(
              args.update.certificateNumber,
            ) as string;
          }
          return query(args);
        },
      },
      user: {
        async create({ args, query }) {
          if (args.data.dbsNumber) {
            args.data.dbsNumber = encrypt(args.data.dbsNumber) as string;
          }
          if (args.data.niNumber) {
            args.data.niNumber = encrypt(args.data.niNumber) as string;
          }
          if (args.data.mfaSecret) {
            args.data.mfaSecret = encrypt(args.data.mfaSecret) as string;
          }
          return query(args);
        },
        async update({ args, query }) {
          if (args.data.dbsNumber && typeof args.data.dbsNumber === "string") {
            args.data.dbsNumber = encrypt(args.data.dbsNumber) as string;
          }
          if (args.data.niNumber && typeof args.data.niNumber === "string") {
            args.data.niNumber = encrypt(args.data.niNumber) as string;
          }
          if (args.data.mfaSecret && typeof args.data.mfaSecret === "string") {
            args.data.mfaSecret = encrypt(args.data.mfaSecret) as string;
          }
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
