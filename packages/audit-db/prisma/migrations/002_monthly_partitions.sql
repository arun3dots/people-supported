-- ============================================================
-- CQC/NHS DSP Toolkit Compliance
-- Migration 002: Monthly Range Partitioning & 8-Year Retention
--
-- PostgreSQL table partitioning by month ensures:
--   1. Fast queries filtered by date range (CQC inspection queries)
--   2. Efficient archival of old data (detach partition, archive to cold storage)
--   3. Never DELETE — partitions older than 8 years are ARCHIVED, not dropped
--
-- IMPORTANT: This script converts the cqc_audit_logs table to a partitioned
-- table. Run ONCE, after initial data migration.
--
-- Run with: psql -d care_home_audit -f 002_monthly_partitions.sql
-- ============================================================

-- Create the partitioned table (replaces the Prisma-generated plain table)
-- NOTE: If already using the plain table, run the migration script first
-- (scripts/migrate-audit-logs.ts) to move data, then run this SQL.

-- Step 1: Rename existing table if present (Prisma created it)
ALTER TABLE IF EXISTS cqc_audit_logs RENAME TO cqc_audit_logs_old;

-- Step 2: Create partitioned parent table
CREATE TABLE IF NOT EXISTS cqc_audit_logs (
  id             TEXT         NOT NULL DEFAULT gen_random_uuid()::text,
  "tenantId"     TEXT,
  "userId"       TEXT,
  "userEmail"    TEXT,
  "userFullName" TEXT,
  "userRoleName" TEXT,
  "categoryType" TEXT         NOT NULL,
  "actionType"   TEXT         NOT NULL,
  "entityType"   TEXT,
  "entityId"     TEXT,
  "entityLabel"  TEXT,
  "oldValue"     JSONB,
  "newValue"     JSONB,
  metadata       JSONB,
  "ipAddress"    TEXT,
  "userAgent"    TEXT,
  "recordHash"   TEXT         NOT NULL,
  "previousHash" TEXT,
  timestamp      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (timestamp);

-- Indexes on the parent (inherited by all partitions)
CREATE INDEX IF NOT EXISTS idx_audit_tenant_ts   ON cqc_audit_logs ("tenantId", timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_category_ts ON cqc_audit_logs ("categoryType", timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_entity_ts   ON cqc_audit_logs ("entityId", timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_user_ts      ON cqc_audit_logs ("userId", timestamp);

-- Step 3: Create monthly partitions for the current year and the next 2 years.
-- (Run a maintenance job annually to add new partitions)
DO $$
DECLARE
  start_date DATE := DATE_TRUNC('month', NOW() - INTERVAL '1 year');
  end_date   DATE := DATE_TRUNC('month', NOW() + INTERVAL '2 years');
  cur_month  DATE;
  part_name  TEXT;
BEGIN
  cur_month := start_date;
  WHILE cur_month <= end_date LOOP
    part_name := 'cqc_audit_logs_' || TO_CHAR(cur_month, 'YYYY_MM');
    EXECUTE FORMAT(
      'CREATE TABLE IF NOT EXISTS %I PARTITION OF cqc_audit_logs '
      'FOR VALUES FROM (%L) TO (%L)',
      part_name,
      cur_month,
      cur_month + INTERVAL '1 month'
    );
    cur_month := cur_month + INTERVAL '1 month';
  END LOOP;
END $$;

-- Step 4: Migrate data from old table into new partitioned table
INSERT INTO cqc_audit_logs SELECT * FROM cqc_audit_logs_old;

-- Step 5: Drop the old unpartitioned table
DROP TABLE IF EXISTS cqc_audit_logs_old;

-- Re-apply immutability trigger on the new partitioned table
-- (Triggers must be applied to partitions individually in older PG versions;
--  in PG 13+ triggers on the parent are inherited automatically)
DROP TRIGGER IF EXISTS audit_log_immutable ON cqc_audit_logs;
CREATE TRIGGER audit_log_immutable
  BEFORE UPDATE OR DELETE ON cqc_audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_modification();

-- ============================================================
-- Archive function: moves old partitions to cold storage table
-- (called by a pg_cron job annually — never deletes records)
-- ============================================================
CREATE TABLE IF NOT EXISTS cqc_audit_logs_archive (LIKE cqc_audit_logs);

CREATE OR REPLACE FUNCTION archive_old_audit_partitions()
RETURNS void AS $$
DECLARE
  cutoff_year INT := EXTRACT(YEAR FROM NOW()) - 8;
  cutoff_month INT;
  part_name TEXT;
BEGIN
  -- Archive partitions older than 8 years (CQC minimum retention)
  FOR cutoff_month IN 1..12 LOOP
    part_name := 'cqc_audit_logs_' || LPAD(cutoff_year::TEXT, 4, '0') || '_' || LPAD(cutoff_month::TEXT, 2, '0');
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_name = part_name AND table_schema = 'public'
    ) THEN
      -- Copy to archive table
      EXECUTE FORMAT('INSERT INTO cqc_audit_logs_archive SELECT * FROM %I', part_name);
      -- Detach partition (data moves to archive, partition is removed from live view)
      EXECUTE FORMAT('ALTER TABLE cqc_audit_logs DETACH PARTITION %I', part_name);
      -- Optional: drop the detached table (data is safely in archive)
      -- EXECUTE FORMAT('DROP TABLE %I', part_name);
      RAISE NOTICE 'Archived partition: %', part_name;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION archive_old_audit_partitions() IS
  'Archives audit partitions older than 8 years into cqc_audit_logs_archive. '
  'Schedule with pg_cron: SELECT cron.schedule(''archive-audit'', ''0 2 1 1 *'', ''SELECT archive_old_audit_partitions()'');';
