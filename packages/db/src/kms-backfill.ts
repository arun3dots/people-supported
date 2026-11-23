import { decrypt, isEncrypted, reencryptWithKms } from "./crypto";
import { Prisma } from "./generated/client";
import {
  PRE_ADMISSION_ENCRYPTED_PARTS,
  PRE_ADMISSION_SENSITIVE_KEYS,
} from "./pre-admission-crypto";

const tables = [
  { name: "Resident", text: ["dob", "nhsNumber"] },
  { name: "User", text: ["dbsNumber", "niNumber", "mfaSecret"] },
  { name: "UserProfile", text: ["phoneNumber", "addressLine1"] },
  { name: "DbsCheck", text: ["certificateNumber"] },
  {
    name: "ResidentPreAdmission",
    text: [],
    partA: "partA",
    wholeParts: PRE_ADMISSION_ENCRYPTED_PARTS,
  },
] as const;

interface BackfillDb {
  $queryRaw<T>(
    query: TemplateStringsArray | Prisma.Sql,
    ...values: unknown[]
  ): Promise<T>;
  $executeRaw(
    query: TemplateStringsArray | Prisma.Sql,
    ...values: unknown[]
  ): Promise<number>;
}
type Row = Record<string, unknown> & { id: string };
type Change = {
  column: string;
  original: string;
  replacement: string;
  json: boolean;
};

interface TableResult {
  table: string;
  scanned: number;
  candidates: number;
  updated: number;
  conflicts: number;
  unreadable: number;
}

function migratePartA(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const part = { ...value } as Record<string, unknown>;
  for (const field of PRE_ADMISSION_SENSITIVE_KEYS.partA) {
    const entry = part[field];
    if (typeof entry === "string" && entry) {
      part[field] = reencryptWithKms(entry);
    }
  }
  return part;
}

function migrateWholePart(value: unknown): unknown {
  if (value === null) return value;
  if (
    typeof value === "string" &&
    (isEncrypted(value) || value.startsWith("kms:v1:"))
  ) {
    const plaintext = decrypt(value);
    if (typeof plaintext !== "string")
      throw new Error("[E-02] Invalid encrypted JSON.");
    JSON.parse(plaintext);
    return reencryptWithKms(value);
  }
  return reencryptWithKms(JSON.stringify(value));
}

function planChanges(table: (typeof tables)[number], row: Row): Change[] {
  const changes: Change[] = [];
  for (const column of table.text) {
    const original = row[column];
    if (typeof original !== "string" || !original) continue;
    const replacement = reencryptWithKms(original);
    if (replacement !== original)
      changes.push({ column, original, replacement, json: false });
  }

  if ("partA" in table) {
    for (const column of [table.partA, ...table.wholeParts]) {
      const value = row[column];
      const original = JSON.stringify(value);
      const replacement = JSON.stringify(
        column === table.partA ? migratePartA(value) : migrateWholePart(value),
      );
      if (replacement !== original)
        changes.push({ column, original, replacement, json: true });
    }
  }
  return changes;
}

// Identifiers are sourced exclusively from the table definitions above.
const identifier = (value: string): Prisma.Sql => Prisma.raw(`"${value}"`);

function applyChanges(
  db: BackfillDb,
  table: Prisma.Sql,
  id: string,
  changes: Change[],
): Promise<number> {
  const assignments = changes.map(
    ({ column, replacement, json }) =>
      Prisma.sql`${identifier(column)} = ${json ? Prisma.sql`${replacement}::jsonb` : replacement}`,
  );
  const guards = changes.map(
    ({ column, original, json }) =>
      Prisma.sql`${identifier(column)} IS NOT DISTINCT FROM ${json ? Prisma.sql`${original}::jsonb` : original}`,
  );
  return db.$executeRaw`
    UPDATE ${table} SET ${Prisma.join(assignments)}
    WHERE "id" = ${id} AND ${Prisma.join(guards, " AND ")}
  `;
}

export async function backfillKmsFields(
  db: BackfillDb,
  { apply, batchSize }: { apply: boolean; batchSize: number },
): Promise<TableResult[]> {
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 1000) {
    throw new Error("Batch size must be an integer from 1 to 1000.");
  }

  const results: TableResult[] = [];
  for (const table of tables) {
    const result: TableResult = {
      table: table.name,
      scanned: 0,
      candidates: 0,
      updated: 0,
      conflicts: 0,
      unreadable: 0,
    };
    const name = identifier(table.name);
    const columns = [
      ...table.text,
      ...("partA" in table ? [table.partA, ...table.wholeParts] : []),
    ];
    const selection = Prisma.join(columns.map(identifier));
    let cursor: string | undefined;

    for (;;) {
      const afterCursor =
        cursor === undefined
          ? Prisma.empty
          : Prisma.sql`WHERE "id" > ${cursor}`;
      const rows = await db.$queryRaw<Row[]>`
        SELECT "id", ${selection} FROM ${name} ${afterCursor}
        ORDER BY "id" LIMIT ${batchSize}
      `;
      for (const row of rows) {
        result.scanned++;
        let changes: Change[];
        try {
          changes = planChanges(table, row);
        } catch {
          result.unreadable++;
          continue;
        }
        if (changes.length === 0) continue;
        result.candidates++;
        if (apply) {
          const updated = await applyChanges(db, name, row.id, changes);
          result.updated += updated;
          result.conflicts += 1 - updated;
        }
      }
      if (rows.length < batchSize) break;
      cursor = rows.at(-1)?.id;
    }
    results.push(result);
  }
  return results;
}
