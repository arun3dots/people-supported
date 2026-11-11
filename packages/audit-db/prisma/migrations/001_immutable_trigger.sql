-- ============================================================
-- CQC/NHS DSP Toolkit Compliance
-- Migration 001: Immutable Audit Records
--
-- Creates a database-level trigger that prevents ANY update or
-- deletion of audit records.  Even superusers and DB admins
-- cannot modify records once inserted.
--
-- Apply AFTER running: prisma migrate deploy (or db push)
-- Run with: psql -d care_home_audit -f 001_immutable_trigger.sql
-- ============================================================

-- Function: raise an error on any attempt to UPDATE or DELETE
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION
    '[CQC Compliance] Audit records are immutable. Operation: %. Table: %. '
    'All audit records are protected under CQC and NHS DSP Toolkit requirements. '
    'Contact your Caldicott Guardian if you believe a legitimate correction is needed.',
    TG_OP, TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on cqc_audit_logs
DROP TRIGGER IF EXISTS audit_log_immutable ON cqc_audit_logs;
CREATE TRIGGER audit_log_immutable
  BEFORE UPDATE OR DELETE ON cqc_audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_modification();

-- Trigger on audit_integrity_blocks (blocks are also immutable)
DROP TRIGGER IF EXISTS integrity_block_immutable ON audit_integrity_blocks;
CREATE TRIGGER integrity_block_immutable
  BEFORE UPDATE OR DELETE ON audit_integrity_blocks
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_modification();

-- ============================================================
-- Database-level roles and permissions (least privilege)
-- Run these as the PostgreSQL superuser
-- ============================================================

-- Role: audit_writer
-- The main application connects with this role.
-- INSERT only — cannot read, update, or delete.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'audit_writer') THEN
    CREATE ROLE audit_writer LOGIN PASSWORD 'CHANGE_ME_IN_PRODUCTION';
  END IF;
END $$;

GRANT CONNECT ON DATABASE care_home_audit TO audit_writer;
GRANT USAGE ON SCHEMA public TO audit_writer;
GRANT INSERT ON cqc_audit_logs TO audit_writer;
GRANT INSERT ON audit_integrity_blocks TO audit_writer;
-- Sequences needed for UUID default (Prisma uses gen_random_uuid or uuid_generate_v4)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO audit_writer;

-- Role: audit_reader
-- The admin dashboard connects with this role. SELECT only.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'audit_reader') THEN
    CREATE ROLE audit_reader LOGIN PASSWORD 'CHANGE_ME_IN_PRODUCTION';
  END IF;
END $$;

GRANT CONNECT ON DATABASE care_home_audit TO audit_reader;
GRANT USAGE ON SCHEMA public TO audit_reader;
GRANT SELECT ON cqc_audit_logs TO audit_reader;
GRANT SELECT ON audit_integrity_blocks TO audit_reader;

-- Revoke all from public to enforce explicit grants
REVOKE ALL ON cqc_audit_logs FROM PUBLIC;
REVOKE ALL ON audit_integrity_blocks FROM PUBLIC;

COMMENT ON TABLE cqc_audit_logs IS
  'Append-only CQC/NHS DSP Toolkit audit log. Protected by immutability trigger. 8-year retention required.';
