/* Read-only introspection of the audit DB schema. No writes. */
const { PrismaClient } = require("../packages/audit-db/src/generated/client");

(async () => {
  const url = process.env.AUDIT_DATABASE_URL;
  if (!url) {
    console.error("AUDIT_DATABASE_URL missing");
    process.exit(2);
  }
  const client = new PrismaClient({ datasources: { db: { url } } });
  try {
    const cols = await client.$queryRawUnsafe(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'cqc_audit_logs' ORDER BY ordinal_position`
    );
    console.log("cqc_audit_logs columns:", cols.map((c) => c.column_name).join(", "));
    const hasLat = cols.some((c) => c.column_name === "latitude");
    const hasLng = cols.some((c) => c.column_name === "longitude");
    const hasLoc = cols.some((c) => c.column_name === "locationName");
    console.log("latitude:", hasLat, "| longitude:", hasLng, "| locationName:", hasLoc);
  } catch (e) {
    console.error("Query failed:", e.message);
    process.exit(1);
  } finally {
    await client.$disconnect();
  }
})();
