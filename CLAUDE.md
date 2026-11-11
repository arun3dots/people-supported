# CLAUDE.md

> Project rules and context for the LCM (Loving Care-Home Management) monorepo.
> This file is auto-loaded by Claude Code. Keep it terse — pull detail on demand.

**Before any task, read [`AGENTS.md`](./AGENTS.md).** It contains the non-negotiable rules, the "do not invent" list, hardcoded facts (ports, roles, enums), and current known gaps.

For exhaustive lookup tables (every endpoint, every Prisma model, every Zod schema, every TanStack Query hook, every web route, RBAC matrix, auth flow), open [`PROJECT.md`](./PROJECT.md) — load only the section you need so token usage stays bounded.

For the strict-mode / no-`any` / file-split cleanup playbook, open [`Refactor.md`](./Refactor.md).

## Quick anchors
- Stack: NestJS + Prisma + Zod (BE) · Next.js App Router + TanStack Query v5 + Tailwind + Radix (FE).
- Backend port **4400**, web port **3000**, global API prefix `/api`.
- Roles (case-sensitive in BE): `SuperAdmin`, `Admin`, `Manager`, `Nurse`, `Carer`, `Resident`.
- Auth: HttpOnly cookies (`access_token` 15m, `refresh_token` 7d at `/api/auth`). Never localStorage.
- Frontend API: `makeAPICall(KEY, payload?, params?, substitutions?)` — KEY must exist in `apps/web/lib/endpoints/<domain>/index.ts`.
- DTOs: `@repo/schema`. Prisma client: `prisma` from `@repo/db`. UI: `@repo/ui`.
- Out of scope for current work: `apps/superadmin`, `apps/docs`.

## Hard rules (full list in AGENTS.md)
- No `any`. Use `unknown` + narrowing.
- Tenant filter every tenant-scoped query by `req.user.tenantId` (from JWT, never from body).
- 350-line file cap.
- Verify before claiming — grep before asserting that something exists.
- Match existing style — don't standardize naming inconsistencies without an explicit ask.

If a requirement conflicts with these rules, stop and ask the user.
