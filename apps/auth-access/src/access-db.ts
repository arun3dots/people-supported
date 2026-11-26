import { PrismaClient } from "./generated";

export { Prisma as AccessPrisma } from "./generated";

export function createAccessDatabase(url: string) {
  return new PrismaClient({ datasourceUrl: url });
}

export function requireDatabaseUrl(env: NodeJS.ProcessEnv) {
  const value = env.AUTH_ACCESS_DATABASE_URL;
  const url = parseDatabaseUrl(value);
  if (
    !value ||
    !url ||
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    !url.hostname ||
    url.pathname.length < 2
  ) {
    throw new Error(
      "AUTH_ACCESS_DATABASE_URL must reference a dedicated PostgreSQL database.",
    );
  }
  for (const other of [env.DATABASE_URL, env.AUDIT_DATABASE_URL]) {
    const candidate = parseDatabaseUrl(other);
    if (
      candidate &&
      url.pathname === candidate.pathname &&
      url.hostname === candidate.hostname &&
      (url.port || "5432") === (candidate.port || "5432")
    ) {
      throw new Error("Auth & Access requires a separate database.");
    }
  }
  return value;
}

function parseDatabaseUrl(value?: string) {
  try {
    return value ? new URL(value) : null;
  } catch {
    return null;
  }
}
