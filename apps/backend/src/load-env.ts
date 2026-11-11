import { config as loadEnv } from 'dotenv';
import { join } from 'path';

// Load .env relative to this file (apps/backend/.env) so env vars are available
// regardless of the process working directory — e.g. when PM2 launches the app
// from the repo root rather than from apps/backend.
//
// This module is imported for its side effect as the very first import in
// main.ts, so the env is populated before any other module is evaluated
// (some modules read process.env at import time).
loadEnv(); // cwd/.env if present (local dev convenience)
loadEnv({ path: join(__dirname, '..', '.env') }); // apps/backend/.env (built: dist/ -> ../.env)

// Default runtime timezone to Europe/London for UK care home compliance
process.env.TZ = process.env.TZ || 'Europe/London';
