-- ==============================================================================
-- CantraCare PostgreSQL Least-Privilege Database Roles Script
-- Reference: SEC-OPS-E08 (Principle of Least Privilege & Hardening)
-- Compliance: NHS DSPT Standard 4 & 9, Cyber Essentials Plus, CIS Benchmark
-- ==============================================================================

-- 1. Database Level Configuration & Security Hardening
-- Revoke all default permissions from PUBLIC on the care_home database
REVOKE ALL ON DATABASE care_home FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM PUBLIC;

-- Enforce SSL connections for all non-local connections
-- (Assumes pg_hba.conf enforces 'hostssl ... cert' or 'hostssl ... scram-sha-256')

-- ==============================================================================
-- 2. Role Definitions
-- ==============================================================================

-- Role 1: Application Runtime Role (Used by NestJS backend service)
-- DML permissions ONLY (SELECT, INSERT, UPDATE, DELETE).
-- Strictly CANNOT execute DDL (CREATE TABLE, DROP TABLE, ALTER TABLE).
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'cantra_app') THEN
        CREATE ROLE cantra_app WITH
            LOGIN
            NOSUPERUSER
            NOCREATEDB
            NOCREATEROLE
            NOINHERIT
            NOREPLICATION
            CONNECTION LIMIT 200
            PASSWORD 'CHANGE_ME_SECURE_VAULT_PASSWORD_APP';
    END IF;
END $$;

-- Role 2: Schema Migration Role (Used strictly during CI/CD Prisma db push/migrate)
-- Possesses DDL permissions to create, alter, and index tables.
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'cantra_migration') THEN
        CREATE ROLE cantra_migration WITH
            LOGIN
            NOSUPERUSER
            NOCREATEDB
            NOCREATEROLE
            NOINHERIT
            NOREPLICATION
            CONNECTION LIMIT 5
            PASSWORD 'CHANGE_ME_SECURE_VAULT_PASSWORD_MIGRATE';
    END IF;
END $$;

-- Role 3: Read-Only Audit & Reporting Role (Used for statutory reports, BI, & ICO audits)
-- Strictly SELECT only. Cannot write or modify any records.
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'cantra_read_only') THEN
        CREATE ROLE cantra_read_only WITH
            LOGIN
            NOSUPERUSER
            NOCREATEDB
            NOCREATEROLE
            NOINHERIT
            NOREPLICATION
            CONNECTION LIMIT 20
            PASSWORD 'CHANGE_ME_SECURE_VAULT_PASSWORD_READONLY';
    END IF;
END $$;

-- ==============================================================================
-- 3. Schema & Object Privilege Allocations
-- ==============================================================================

-- Grant schema usage to all authenticated roles
GRANT USAGE ON SCHEMA public TO cantra_app;
GRANT USAGE ON SCHEMA public TO cantra_migration;
GRANT USAGE ON SCHEMA public TO cantra_read_only;

-- Grant Schema DDL privilege ONLY to migration role
GRANT CREATE ON SCHEMA public TO cantra_migration;

-- Grant DML privileges on all existing tables to cantra_app
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO cantra_app;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO cantra_app;

-- Grant DML + DDL ownership to migration role
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO cantra_migration;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO cantra_migration;

-- Grant Read-Only privileges to cantra_read_only
GRANT SELECT ON ALL TABLES IN SCHEMA public TO cantra_read_only;

-- ==============================================================================
-- 4. Default Privileges for Future Tables
-- Ensure that tables created during future migrations inherit correct permissions
-- ==============================================================================

ALTER DEFAULT PRIVILEGES FOR ROLE cantra_migration IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO cantra_app;

ALTER DEFAULT PRIVILEGES FOR ROLE cantra_migration IN SCHEMA public
    GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO cantra_app;

ALTER DEFAULT PRIVILEGES FOR ROLE cantra_migration IN SCHEMA public
    GRANT SELECT ON TABLES TO cantra_read_only;

-- Revoke default execute on all new functions from PUBLIC
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Verification Query: Check role memberships and privileges
SELECT rolname, rolsuper, rolinherit, rolcreaterole, rolcreatedb, rolcanlogin, rolconnlimit
FROM pg_roles
WHERE rolname IN ('cantra_app', 'cantra_migration', 'cantra_read_only');

