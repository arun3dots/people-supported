-- ============================================================
-- CQC/NHS DSP Toolkit Compliance
-- Migration 003: Add geolocation (latitude/longitude) columns
--
-- Best-effort client-reported GPS coordinates attached to audit
-- events (primarily PAGE_VIEW). Nullable — most events are
-- server-side and carry no coordinates. locationName is the
-- reverse-geocoded place name (also best-effort, nullable).
--
-- Run with: psql -d care_home_audit -f 003_add_geolocation.sql
-- ============================================================

-- Partitioned parent: PG 12+ propagates ADD COLUMN to all existing
-- partitions; future partitions created via PARTITION OF inherit it.
ALTER TABLE cqc_audit_logs
  ADD COLUMN IF NOT EXISTS "latitude"     DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "longitude"    DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "locationName" TEXT;

-- The archive table was created with (LIKE cqc_audit_logs) in migration 002,
-- so it predates these columns. It must stay column-compatible or the annual
-- archive job (INSERT INTO cqc_audit_logs_archive SELECT * …) will fail.
ALTER TABLE cqc_audit_logs_archive
  ADD COLUMN IF NOT EXISTS "latitude"     DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "longitude"    DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "locationName" TEXT;

COMMENT ON COLUMN cqc_audit_logs."latitude"     IS 'Client-reported GPS latitude (best-effort, PAGE_VIEW events)';
COMMENT ON COLUMN cqc_audit_logs."longitude"    IS 'Client-reported GPS longitude (best-effort, PAGE_VIEW events)';
COMMENT ON COLUMN cqc_audit_logs."locationName" IS 'Reverse-geocoded place name (best-effort, PAGE_VIEW events)';
