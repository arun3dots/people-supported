import {
  decrypt,
  inspectCiphertext,
  isEncrypted,
  reencryptWithKms,
} from "./crypto";
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

interface ReadableDb {
  $queryRaw<T>(
    query: TemplateStringsArray | Prisma.Sql,
    ...values: unknown[]
  ): Promise<T>;
}
interface BackfillDb extends ReadableDb {
  $executeRaw(
    query: TemplateStringsArray | Prisma.Sql,
    ...values: unknown[]
  ): Promise<number>;
}
type Row = Record<string, unknown> & { id: string };
type FieldTable = (typeof tables)[number];
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
  if (typeof value === "string" && isEncrypted(value)) {
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

async function* scanRows(
  db: ReadableDb,
  table: FieldTable,
  batchSize: number,
): AsyncGenerator<Row> {
  const fields = [
    ...table.text,
    ...("partA" in table ? [table.partA, ...table.wholeParts] : []),
  ];
  const columns = Prisma.join(fields.map(identifier));
  let cursor: string | undefined;
  for (;;) {
    const after =
      cursor === undefined ? Prisma.empty : Prisma.sql`WHERE "id" > ${cursor}`;
    const rows = await db.$queryRaw<Row[]>`
      SELECT "id", ${columns} FROM ${identifier(table.name)} ${after}
      ORDER BY "id" LIMIT ${batchSize}
    `;
    yield* rows;
    if (rows.length < batchSize) return;
    cursor = rows.at(-1)?.id;
  }
}

function inventoryValues(
  table: FieldTable,
  row: Row,
): Array<{ value: string; json?: boolean }> {
  const values: Array<{ value: string; json?: boolean }> = [];
  for (const field of table.text) {
    const value = row[field];
    if (typeof value === "string" && value) values.push({ value });
  }
  if ("partA" in table) {
    const partA = row[table.partA];
    if (partA && typeof partA === "object" && !Array.isArray(partA)) {
      for (const field of PRE_ADMISSION_SENSITIVE_KEYS.partA) {
        const value = (partA as Record<string, unknown>)[field];
        if (typeof value === "string" && value) values.push({ value });
      }
    }
    for (const field of table.wholeParts) {
      const value = row[field];
      if (value == null) continue;
      values.push({
        value:
          typeof value === "string" && isEncrypted(value)
            ? value
            : JSON.stringify(value),
        json: true,
      });
    }
  }
  return values;
}

export async function inventoryKmsFields(db: ReadableDb, batchSize = 100) {
  validateBatchSize(batchSize);
  const results = [];
  for (const table of tables) {
    const result = {
      table: table.name,
      scanned: 0,
      candidates: 0,
      conflicts: 0,
      unreadable: 0,
      legacy: 0,
      plaintext: 0,
      kms: 0,
      kmsVersions: {} as Record<number, number>,
    };
    for await (const row of scanRows(db, table, batchSize)) {
      result.scanned++;
      let candidate = false;
      let unreadable = false;
      for (const { value, json } of inventoryValues(table, row)) {
        try {
          const status = inspectCiphertext(value, json);
          result[status.format]++;
          if (status.version !== undefined) {
            result.kmsVersions[status.version] =
              (result.kmsVersions[status.version] ?? 0) + 1;
          }
          candidate ||= status.candidate;
        } catch {
          unreadable = true;
        }
      }
      if (unreadable) result.unreadable++;
      else if (candidate) result.candidates++;
    }
    results.push(result);
  }
  return results;
}

function validateBatchSize(batchSize: number): void {
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 1000) {
    throw new Error("Batch size must be an integer from 1 to 1000.");
  }
}

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
  validateBatchSize(batchSize);

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
    for await (const row of scanRows(db, table, batchSize)) {
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
    results.push(result);
  }
  return results;
}
