# LCM (Loving Care-Home Management) — Project Context

> **Authoritative project context. Load this before touching code.**
> Scope: `apps/backend`, `apps/web`, `packages/{db,schema,ui,eslint-config,typescript-config}`.
> Excluded: `apps/superadmin`, `apps/docs` (separate concerns; do not infer about them from this doc).
> Last verified against repo: 2026-05-07.

---

## 0. READ-ME-FIRST RULES (anti-hallucination)

When asked to add/change anything, follow these rules. They override any habit from training data.

1. **Stack is fixed.** Backend = NestJS + Prisma + Zod. Web = Next.js App Router + TanStack Query v5 + Tailwind + Radix (via `@repo/ui`). Do **not** introduce: Express handlers, Pages Router, Redux, Axios, SWR, Yup, Joi, Sequelize, TypeORM, Mongoose, MUI, Chakra, Bootstrap, styled-components, Emotion, Zustand. If a new lib is needed, ASK first.
2. **No `any`.** Strictly forbidden in `apps/backend/src` and `apps/web` source. Use `unknown` + narrowing, or a real type. Audit JSON columns must use `toJsonValue()` (see §13).
3. **DTOs come from `@repo/schema`.** Do not define request/response shapes inline. If a DTO is missing, add it to `packages/schema/src/<domain>.ts` and re-export from `index.ts`.
4. **Prisma client is `prisma` from `@repo/db`.** Do not `new PrismaClient()`. `rawPrisma` is exported but only for non-encrypted edge cases.
5. **Tenant isolation is mandatory.** Every tenant-scoped query MUST filter by `tenantId` extracted from the JWT. Never trust `tenantId` from the request body.
6. **Auth is cookie-based.** Fully authenticated `access_token` cookie (5h); pending-MFA access token (15m); `refresh_token` cookie (7d, path-scoped). **Never** read/write tokens in `localStorage` / `sessionStorage`.
7. **Frontend API access is via `makeAPICall(KEY, payload?, params?, substitutions?)`.** Never call `fetch` directly to the backend. Add an entry under `apps/web/lib/endpoints/<domain>/index.ts` and use the KEY constant.
8. **350-line file cap** (per AGENTS.md mandate). Split before exceeding.
9. **Verify before claiming.** Before saying "X exists", grep for it. Before claiming a route works, check the controller decorator AND the web `endpoints/<domain>/index.ts` AND the matching `lib/queries/...` hook.
10. **AGENTS.md is referenced by README/Refactor.md but the file is not present in this repo.** Do not pretend to quote it. The mandates it embodies are the rules in this document and `Refactor.md`.

### Things models commonly invent — these DO NOT EXIST:
- Any GraphQL endpoint. Backend is REST only.
- An `/api/users` CRUD controller. Users are managed via `/api/staff` (tenant scope) or `/api/super-admin/tenants` (platform).
- A `Permission` model. Permissions live as JSON on `Role.permissions`.
- WebSocket / SSE channels. There are none.
- A separate `MfaModule`. MFA endpoints live under `auth.controller.ts`.
- A `useAuth()` hook that auto-refreshes outside of `AuthContext`. The only auth surface is `AuthContext` (`useAuth` from `lib/context/AuthContext`).
- Server Actions / RSC mutations. The web app uses client components + TanStack Query.
- A central `errors.ts`. Errors are thrown via NestJS HttpExceptions on the BE; on FE they are caught from `makeAPICall` rejections.

---

## 1. PROJECT FACTS

| Field | Value |
|---|---|
| Name | LCM — Loving Care-Home Management System |
| Type | Multi-tenant SaaS (per care-home tenant via subdomain) |
| Repo type | pnpm + Turborepo monorepo |
| Node | ≥ v20 |
| Package manager | pnpm ≥ v9 |
| DB | PostgreSQL via Prisma |
| Cache/queue | Redis (BullMQ — used by audit queue) |
| Object storage | Google Cloud Storage (GCS) — resident docs/photos |
| Mail | SMTP via NestJS MailerModule |
| License | Private / Proprietary |

### Ports (dev)
| Service | Port |
|---|---|
| `apps/web` | 3000 |
| `apps/backend` | **4400** (note: README incorrectly says 3001 — code says 4400 in `main.ts:38`) |
| `apps/superadmin` (out of scope) | 3002 |
| Backend Swagger UI | `http://localhost:4400/api` |

### Default seeded credentials
- Platform admin: `admin@platform.com` / `Password123!` (from `pnpm db:seed`).

---

## 2. MONOREPO LAYOUT (in-scope only)

```
care-home/
├─ apps/
│  ├─ backend/          # NestJS API. Port 4400. Global prefix /api.
│  └─ web/              # Next.js App Router. Port 3000.
├─ packages/
│  ├─ db/               # Prisma schema, generated client, encrypted-field helpers.
│  ├─ schema/           # Zod schemas + inferred TS DTOs (shared FE/BE).
│  ├─ ui/               # shadcn/Radix primitives + Tailwind v4.
│  ├─ eslint-config/    # Shared ESLint configs (base.js, next.js, react-internal.js).
│  └─ typescript-config/# Shared tsconfig.*.json.
├─ README.md            # User-facing intro.
├─ Refactor.md          # 13-phase strict-mode/cleanup playbook.
└─ PROJECT.md           # This file.
```

### Workspace imports
- Always use `@repo/db`, `@repo/schema`, `@repo/ui`, `@repo/eslint-config`, `@repo/typescript-config`. Never use relative paths into another package.

---

## 3. ROLES & RBAC (CANONICAL)

### Role identifiers (exact strings — case-sensitive in `@Roles`, uppercased on web)
| Backend `@Roles(...)` | Web middleware (`role.toUpperCase()`) |
|---|---|
| `SuperAdmin` | `SUPERADMIN` |
| `Admin` | `ADMIN` |
| `Manager` | `MANAGER` |
| `Nurse` | `NURSE` |
| `Carer` | `CARER` |
| `Resident` | `RESIDENT` |

> Role names live as strings on `User.role.name`. The web middleware uppercases them. Backend guards compare them as-is. Mismatches are a common bug source.

### Web route → required role (enforced in `apps/web/middleware.ts`)
| Path prefix | Allowed roles | On reject → |
|---|---|---|
| `/admin/*` | `ADMIN`, `SUPERADMIN` | `/dashboard` |
| `/carer/*` | `CARER`, `ADMIN`, `SUPERADMIN` | `/dashboard` |
| `/nurse/*` | `NURSE`, `ADMIN`, `SUPERADMIN` | `/dashboard` |
| `/dashboard` | (any authed) — redirected to role-home | — |
| `/login`, `/login/mfa`, `/verify` | public | — |

`/dashboard` resolves to: `ADMIN|SUPERADMIN → /admin/dashboard`, `CARER → /carer/dashboard`, `NURSE → /nurse/dashboard`, `RESIDENT → /resident/dashboard`.

### Backend RBAC primitives
- **Role-based** (existing modules — staff, residents, facility, etc.):
  - Decorator: `@Roles('Admin', 'Manager')` from `apps/backend/src/common/decorators/roles.decorator.ts`.
  - Guard: `RolesGuard` (`apps/backend/src/common/guards/roles.guard.ts`). Used as `@UseGuards(JwtAuthGuard, RolesGuard)`.
  - Role check is a single-string membership against `req.user.roleName`.
- **Permission-based** (new — Risk module, future migrations):
  - Decorator: `@Permissions('riskAssessments.write')` from `apps/backend/src/common/decorators/permissions.decorator.ts`.
  - Guard: `PermissionsGuard` (`apps/backend/src/common/guards/permissions.guard.ts`). Used as `@UseGuards(JwtAuthGuard, PermissionsGuard)`.
  - Resolves dotted strings like `module.action` against `req.user.permissions` (set by JwtStrategy from the JWT payload).
  - Admins manage which roles have which permissions via `/admin/settings/roles`.
- JWT guard: `JwtAuthGuard` (`apps/backend/src/common/guards/jwt-auth.guard.ts`). Required by both above.

### Permission modules (resolved on `req.user.permissions`)
| Module | Actions |
|---|---|
| `dashboard`, `residents`, `staff`, `facilities`, `payments`, `settings` | `read`, `write`, `delete` |
| `riskAssessments` | `read`, `write`, `delete`, `approve`, `manageTemplates` |

> ⚠️ MFA is currently **not enforced**. The web middleware MFA block is commented out (`apps/web/middleware.ts:35-40, 59-66`). `MfaGuard` returns `true`. Treat MFA as opt-in until this changes.

---

## 4. AUTH FLOW (CANONICAL)

```
LOGIN (POST /api/auth/login)
  → if user.mfaEnabled:  return { requiresMfa:true } (15m access token; no refresh token)
  → else:                set access_token + refresh_token cookies, return user.

MFA VERIFY (POST /api/auth/mfa/verify)
  → set access_token (mfaVerified:true) + refresh_token cookies.

REFRESH (POST /api/auth/refresh, called silently every 4h 55m from web)
  → reads refresh_token cookie, rotates it (family-based), sets new access_token cookie.

LOGOUT (POST /api/auth/logout)
  → revokes refresh-token family, clears both cookies.
```

| Token | Storage | TTL | Cookie path | Notes |
|---|---|---|---|---|
| `access_token` | HttpOnly cookie | 5 hours (15 min pending MFA) | `/` | JWT, signed with `JWT_SECRET`. Read by `JwtStrategy` and by web `middleware.ts` via `jose`. |
| `refresh_token` | HttpOnly cookie | 7 days | `/api/auth` | Stored in DB (`RefreshToken` model). Family-based rotation: rotated on use, family revoked on reuse. |

### JWT payload shape (single source of truth)
```ts
{
  sub: string; email: string; fullName: string; roleName: string;
  tenantId: string; mfaVerified: boolean;
  permissions: RolePermissions;   // module-level booleans (see §3 Permissions)
}
```
Mirror this in `AuthenticatedUser` (`apps/backend/src/common/interfaces/request.interface.ts`) and `AuthContext` user (`apps/web/lib/context/AuthContext.tsx`).

### MFA reset flow
1. `POST /api/auth/mfa/reset-request` → emails 6-digit code, persists `MfaResetRequest`.
2. `POST /api/auth/mfa/reset-verify` with code → disables MFA on the user, deletes the request.

---

## 5. MULTI-TENANT MODEL

- Tenant = one care home. Identified by `Tenant.subdomain` (lowercase, hyphens only — see `createTenantSchema`).
- `tenantId` source of truth = JWT payload claim. Always read via `req.user.tenantId`. Helper: `getTenantId(req)` throws `ForbiddenException` if missing.
- Tenant-scoped models (every query MUST filter by `tenantId`):
  `User` (when scoped), `Resident`, `Unit`, `Wing`, `Room`, `Bed`, `Document`, `RiskAssessment`, `CarePlanTask`, `DailyTask`, `Shift`, `ShiftType`, `ShiftAssignment`, `ShiftRequest`, `Role` (when not `isSystem`), `CouncilPO`, `Invoice`, `Observation` (via Resident), `MedicationRound` (via Resident).
- Platform-level models (no `tenantId`): `SubscriptionPackage`, `RefreshToken`, `MfaResetRequest`, `Tenant`, system Roles.

### Tenant lifecycle
`Tenant.status ∈ { Pending, Active, Suspended, Inactive }`. Set by SuperAdmin via `PATCH /api/super-admin/tenants/:id/status`.

---

## 6. BACKEND (NestJS) — STRUCTURE

### Module → Controller → Endpoint table

> Format: `[METHOD] path` — `service.method` — `roles` (omitted = `JwtAuthGuard` only).

#### `auth/` — `auth.controller.ts` (prefix `/api/auth`)
| Endpoint | Service method | Guards |
|---|---|---|
| `POST /login` | `AuthService.login` | (public) |
| `POST /refresh` | `AuthService.refreshAccessToken` | (public, reads cookie) |
| `POST /logout` | `AuthService.logout` | JwtAuthGuard |
| `POST /me` | (returns req.user) | JwtAuthGuard |
| `GET  /security-state` | `AuthService.getSecurityState` | JwtAuthGuard |
| `POST /change-password` | `AuthService.changePassword` | JwtAuthGuard |
| `POST /mfa/generate` | `AuthService.generateMfaSecret` | JwtAuthGuard |
| `POST /mfa/verify` | `AuthService.verifyMfa` | JwtAuthGuard |
| `POST /mfa/disable` | `AuthService.disableMfa` | JwtAuthGuard |
| `POST /mfa/reset-request` | `AuthService.requestMfaReset` | JwtAuthGuard |
| `POST /mfa/reset-verify` | `AuthService.verifyMfaReset` | JwtAuthGuard |

Other auth files: `auth.service.ts`, `refresh-token.service.ts`, `strategies/jwt.strategy.ts`, `auth.module.ts`.

#### `tenants/` — prefix `/api/super-admin/tenants` and public `/api/tenants/verify`
| Endpoint | Service | Roles |
|---|---|---|
| `POST /super-admin/tenants` | `TenantsService.create` | SuperAdmin |
| `GET  /super-admin/tenants` | `TenantsService.findAll` | SuperAdmin |
| `GET  /super-admin/tenants/:id` | `TenantsService.findOne` | SuperAdmin |
| `PATCH /super-admin/tenants/:id` | `TenantsService.update` | SuperAdmin |
| `PATCH /super-admin/tenants/:id/status` | `TenantsService.setStatus` | SuperAdmin |
| `GET  /tenants/verify` | `TenantsService.verifyTenant` | (public) |

Plus `organization.controller.ts` for tenant self-service (own profile read/update).

#### `staff/` — prefix `/api/staff`
| Endpoint | Service | Roles |
|---|---|---|
| `POST /` | `StaffService.create` | Admin |
| `GET  /` | `StaffService.findAll` | Admin, Manager |
| `GET  /:id` | `StaffService.findOne` | Admin, Manager |
| `PATCH /:id/assignments` | `StaffService.updateAssignments` | Admin |

#### `facility/` — prefix `/api/facility` (Units/Wings/Rooms/Beds — same CRUD shape for each)
| Endpoint pattern | Roles |
|---|---|
| `POST /{units,wings,rooms,beds}` | Admin |
| `GET  /{units,wings,rooms,beds}` | Admin, Manager, Carer, Nurse |
| `PATCH /{units,wings,rooms,beds}/:id` | Admin |
| `DELETE /{units,wings,rooms,beds}/:id` | Admin |

> `facility.service.ts` is currently **584 lines** — over the 350 cap (Refactor.md Phase 12). Plan to split into `unit.service.ts`, `wing.service.ts`, `room.service.ts`, `bed.service.ts`.

#### `residents/` — prefix `/api/residents`
| Endpoint | Roles |
|---|---|
| `POST /` (`admitResident`) | Admin, Manager |
| `PATCH /:id/discharge` | Admin, Manager |
| `GET  /`, `GET /:id`, `GET /:id/timeline` | Admin, Manager, Carer, Nurse |
| `GET  /:id/medication-rounds` | Admin, Manager, Carer, Nurse |
| `POST /:id/medication-rounds`, `POST /:id/medication-rounds/bulk` | Admin, Manager, Nurse |
| `PATCH/DELETE /medication-rounds/:id` | Admin, Manager, Nurse |
| `POST /medication/administer` | Admin, Manager, Carer, Nurse |
| `GET  /:id/risk-assessments`, `POST /:id/risk-assessments` | (read all four; write Admin/Manager/Nurse) |
| `GET  /:id/documents` | Admin, Manager, Carer, Nurse |
| `GET  /:id/documents/upload-url`, `POST /:id/documents`, `POST /:id/documents/upload`, `DELETE /documents/:id`, `GET /documents/:id/download` | Admin, Manager, Nurse |
| `POST /:id/photo` (FileInterceptor) | Admin, Manager, Nurse |

#### `care-plan/` — prefix `/api/care-plan`
| Endpoint | Service |
|---|---|
| `POST /residents/:residentId/tasks` | `CarePlanService.createCarePlanTask` |
| `GET  /residents/:residentId/tasks` | `getResidentCarePlanTasks` |
| `GET  /daily-tasks` | `getDailyTasks` |
| `PATCH /daily-tasks/:taskId/status` | `updateDailyTaskStatus` |
| `POST /generate-daily` | `generateAllDailyTasks` |

#### `observations/` — prefix `/api/observations`
| Endpoint | Roles |
|---|---|
| `POST /` | Admin, Nurse, Carer |
| `GET  /resident/:residentId` | Admin, Nurse, Carer |
| `GET  /:id` | Admin, Nurse, Carer |

NEWS2 score is computed via `calculateNEWS2Score()` exported from `@repo/schema`.

#### `shifts/` — prefix `/api/shifts` and `/api/shift-requests`
| Endpoint | Notes |
|---|---|
| `POST/GET /shifts/types` | Shift type templates (Early/Late/Night) |
| `POST/GET /shifts` | Shift CRUD |
| `PATCH/DELETE /shifts/:id` | |
| `POST /shifts/:id/assignments` | Assign staff to a shift |
| `GET/POST /shift-requests`, `PATCH /shift-requests/:id` | Leave/Change/Cover requests + approve/reject |

#### `roles/` — prefix `/api/roles`
| Endpoint | Roles |
|---|---|
| `POST /` | Admin |
| `GET  /`, `GET /:id` | Admin, Manager |
| `PATCH /:id`, `DELETE /:id` | Admin |

#### `audit/` — prefix `/api/audit-logs`
| Endpoint | Roles |
|---|---|
| `GET  /` | JwtAuthGuard (any authed; tenant-scoped server-side) |
| `POST /page-view` | JwtAuthGuard |
| `GET  /integrity/verify` | Admin |
| `GET  /reports/{medication-errors,care-plan-changes,resident-access,safeguarding,security-events}` | Admin (security-events: Admin only; others: Admin, Manager) |
| `GET  /export/{excel,pdf}` | Admin, Manager |

Audit pipeline:
- `AuditService.emit()` is fire-and-forget (BullMQ). NEVER `await` it in a way that blocks the response.
- `AuditDbService` performs synchronous reads.
- Records are hash-chained (`recordHash`) for tamper detection (`/integrity/verify`).
- Audit JSON columns (`oldValue`, `newValue`) MUST be written via `toJsonValue()` (Refactor.md Phase 3). Do not `as any` them.

#### `risk/` — prefix `/api/risk` (permission-gated, NOT role-gated)
| Endpoint | Permission |
|---|---|
| `GET    /assessments` (filters: residentId, status, category, level, dueWithinDays) | `riskAssessments.read` |
| `GET    /assessments/:id` | `riskAssessments.read` |
| `POST   /assessments` | `riskAssessments.write` |
| `PATCH  /assessments/:id` | `riskAssessments.write` |
| `POST   /assessments/:id/transition` (Draft↔PendingReview↔Active↔Archived) | `riskAssessments.write` (+ `approve` to land Active) |
| `DELETE /assessments/:id` | `riskAssessments.delete` |
| `POST   /assessments/:id/controls`, `PATCH /controls/:id`, `POST /controls/:id/complete`, `DELETE /controls/:id` | `riskAssessments.write` |
| `GET    /templates` | `riskAssessments.read` |
| `POST   /templates`, `PATCH /templates/:id`, `DELETE /templates/:id` | `riskAssessments.manageTemplates` |
| `GET    /alerts/unread`, `POST /alerts/:id/read` | `riskAssessments.read` |
| `GET    /reports/overview` | `riskAssessments.read` |

Module = `apps/backend/src/risk/`. Files: `risk.module.ts`, `risk.controller.ts`, `risk.service.ts`, `risk-templates.service.ts`, `risk-controls.service.ts`, `risk-alerts.service.ts`, `risk-reminder.service.ts`, `risk.types.ts`.

Notifications: `RiskAlertsService.dispatch(...)` emails recipients **and** writes a `RiskAlert` row consumed by FE polling (`useGetRiskAlertsUnreadQuery`, 30s interval). Triggered immediately on high-risk creation, status transitions, and control assignment. The cron `RiskReminderService` runs daily at 08:00 (gated by `RUN_CRON=true`) for `nextReviewDate` reminders and overdue-control marking.

#### `dashboard/` — prefix `/api/dashboard`
| Endpoint | Roles |
|---|---|
| `GET /admin-stats` | Admin, Manager |

#### `storage/`
- `GcsService` — no controller; injected into other services for GCS uploads/signed URLs.

#### `users/`
- `UsersService.findByEmail/findById/setMfaSecret`. Used internally; not directly exposed via routes.

#### `common/` (cross-cutting infrastructure)
| File | Purpose |
|---|---|
| `decorators/roles.decorator.ts` | `@Roles(...names)` metadata |
| `guards/jwt-auth.guard.ts` | Passport JWT (cookie or `Authorization: Bearer`) |
| `guards/roles.guard.ts` | Reads `@Roles` metadata, checks `req.user.roleName` |
| `interfaces/request.interface.ts` | `AuthenticatedUser`, `AuthenticatedRequest` |
| `pipes/zod.pipe.ts` | `new ZodValidationPipe(schema)` — wrap `@Body()` |
| `mail/mail.service.ts` | OTP, security, welcome emails |
| `mail/mail.module.ts` | MailerModule config |
| `utils/json.util.ts` | `toJsonValue<T>(value): Prisma.InputJsonValue` (audit JSON serializer) |
| `encryption.ts` | ⚠ duplicates `packages/db/src/crypto.ts` — Refactor.md Phase 12c. Prefer the package version. |

### Backend bootstrap (`main.ts`)
- Global prefix `/api`.
- `cookie-parser` enabled.
- CORS origins: `http://localhost:{3000,3001,3002}` with `credentials: true`.
- Swagger at `/api`. Bearer auth declared in spec.
- **No global validation pipe.** Validation is per-route via `new ZodValidationPipe(schema)`.

---

## 7. WEB (Next.js App Router) — STRUCTURE

### Page routes (under `apps/web/app/`)
| Route | Group | Purpose |
|---|---|---|
| `/login` | public | Email + password |
| `/login/mfa` | public | 6-digit MFA entry |
| `/verify` | public | Email verification |
| `/dashboard` | (protected) | Redirect target → role-specific home |
| `/admin/dashboard` | (protected)/admin | Admin stats / alerts / activity |
| `/admin/audit-log` | | Audit log viewer |
| `/admin/residents` | | Resident directory |
| `/admin/residents/admit` | | Admission wizard |
| `/admin/residents/[id]` | | Resident profile (timeline, care-plan, observations, risk, medication, documents tabs) |
| `/admin/staff` | | Staff list |
| `/admin/staff/[id]` | | Staff profile |
| `/admin/staff/rota` | | Rota grid |
| `/admin/staff/requests` | | Shift/leave requests queue |
| `/admin/staff/assignments` | | Staff ↔ wing/room/bed assignments |
| `/admin/configuration/facility` | | Unit→Wing→Room→Bed admin |
| `/admin/settings/organization` | | Org profile |
| `/admin/settings/roles` | | Role CRUD |
| `/admin/settings/security` | | Password / MFA settings |
| `/admin/reports` | | Reports (stub) |
| `/carer/dashboard`, `/carer/profile`, `/carer/residents`, `/carer/residents/[id]`, `/carer/rota`, `/carer/shifts`, `/carer/requests` | (protected)/carer | |
| `/nurse/dashboard`, `/nurse/rota`, `/nurse/requests` | (protected)/nurse | |
| `/resident/dashboard` | (protected)/resident | |
| `/packages`, `/subscriptions` | (protected) | Subscription pricing/management |
| `/ui-components` | sandbox | UI primitive showcase |

### `app/(protected)/layout.tsx` wraps protected pages with: `AppSidebar`, `PageHeader` (with `NextTopLoader`), `ActiveShiftIndicator`, `PageViewTracker` (audit), `Suspense` spinner, toast region.

### `apps/web/middleware.ts` — see §3 for the full route-gating table.

### `lib/` layout
```
lib/
├─ Providers.tsx        # QueryClientProvider → AuthProvider → TooltipProvider → ToastProvider
├─ api.ts               # makeAPICall<T>(name, payload?, params?, substitutions?)
├─ query-client.ts      # staleTime: 60s, dehydrate includes pending queries
├─ context/AuthContext.tsx
├─ endpoints/           # Domain folders + index.ts barrel + types.ts
├─ queries/             # TanStack Query hooks per domain
├─ types/               # FE-only types — to be migrated into @repo/schema (Refactor Phase 9)
└─ components/          # AppSidebar.tsx (>350 LoC, split planned), PageHeader, UserMenu,
                        # ActiveShiftIndicator, PageViewTracker, admin/, shared/, staff/
```

### `lib/api.ts` contract (CANONICAL)
```ts
makeAPICall<T>(
  apiName: string,                                  // KEY in endpoints index
  payload?: Record<string, unknown> | FormData,     // body (JSON or multipart)
  params?: Record<string, string|number|boolean>,   // querystring
  substitutions?: Record<string, string>,           // [id] -> value in URL
): Promise<T>
```
- Sends with `credentials: 'include'` (cookies).
- Base URL: `process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4400/api'`.
- Path tokens like `[id]` are replaced from `substitutions`.
- On non-2xx: rejects with the parsed error JSON (or `{ message: statusText }` if not JSON).
- ⚠ Currently uses `apiName: string` (untyped key). Refactor.md Phase 10 narrows this to `keyof typeof endpointInfo`.

### Endpoint KEY constants (use these EXACT strings via `makeAPICall`)
| Domain | Keys |
|---|---|
| auth | `GET_SECURITY_STATE`, `GENERATE_MFA`, `VERIFY_MFA`, `DISABLE_MFA`, `CHANGE_PASSWORD` |
| staff | `GET_STAFF`, `GET_STAFF_MEMBER`, `CREATE_STAFF`, `UPDATE_STAFF_ROLE`, `UPDATE_STAFF_STATUS`, `DELETE_STAFF`, `UPDATE_STAFF_ASSIGNMENTS` |
| residents | `GET_RESIDENTS`, `GET_RESIDENT`, `DISCHARGE_RESIDENT`, `GET_RESIDENT_TIMELINE`, `GET_RESIDENT_MEDICATION_ROUNDS`, `ADMINISTER_MEDICATION`, `CREATE_MEDICATION_ROUND`, `UPDATE_MEDICATION_ROUND`, `DELETE_MEDICATION_ROUND`, `CREATE_MEDICATION_ROUND_BULK`, `GET_RESIDENT_RISK_ASSESSMENTS`, `CREATE_RESIDENT_RISK_ASSESSMENT`, `GET_RESIDENT_DOCUMENTS`, `GET_DOCUMENT_UPLOAD_URL`, `UPLOAD_RESIDENT_DOCUMENT`, `SAVE_RESIDENT_DOCUMENT`, `DELETE_RESIDENT_DOCUMENT`, `UPLOAD_RESIDENT_PHOTO`, `ADMIT_CONFIRM` |
| shifts | `GET_SHIFT_TYPES`, `CREATE_SHIFT_TYPE`, `GET_SHIFTS`, `CREATE_SHIFT`, `UPDATE_SHIFT`, `DELETE_SHIFT`, `ASSIGN_STAFF`, `UNASSIGN_STAFF`, `GET_MY_SHIFTS`, `GET_ACTIVE_SHIFT`, `GET_SHIFT_REQUESTS`, `CREATE_SHIFT_REQUEST`, `UPDATE_SHIFT_REQUEST_STATUS` |
| facilities | `GET_UNITS`, `CREATE_UNIT`, `UPDATE_UNIT`, `DELETE_UNIT`, `GET_WINGS`, `CREATE_WING`, `UPDATE_WING`, `DELETE_WING`, `GET_ROOMS`, `CREATE_ROOM`, `UPDATE_ROOM`, `DELETE_ROOM`, `GET_BEDS`, `CREATE_BED`, `UPDATE_BED`, `DELETE_BED` |
| audit | `getAuditLogs`, `logPageView` |
| dashboard | `GET_ADMIN_STATS` |
| care-plan | `CREATE_CARE_PLAN_TASK`, `GET_RESIDENT_CARE_PLAN_TASKS`, `GET_DAILY_TASKS`, `UPDATE_DAILY_TASK_STATUS`, `GENERATE_DAILY_TASKS` |
| roles | `GET_ROLES_LIST`, `CREATE_ROLE`, `UPDATE_ROLE`, `DELETE_ROLE` |
| organization | `GET_ORGANIZATION_PROFILE`, `UPDATE_ORGANIZATION_PROFILE` |
| observations | `CREATE_OBSERVATION`, `GET_RESIDENT_OBSERVATIONS`, `GET_OBSERVATION` |

> Casing inconsistency: most keys are SCREAMING_SNAKE; the audit ones are camelCase. Match the existing style in the file you're editing — do not rename across the codebase.

### TanStack Query hooks (in `lib/queries/<domain>/`)
| Domain | Hook (representative names — see file for full set) |
|---|---|
| residents | `useGetResidentsQuery`, `useGetResidentQuery`, `useDischargeResidentMutation`, `useGetResidentTimelineQuery`, `useGetResidentObservationsQuery`, `useCreateObservationMutation`, `useCreateCarePlanTaskMutation`, `useGetResidentCarePlanTasksQuery`, `useGetDailyTasksQuery`, `useUpdateDailyTaskStatusMutation`, `useGetResidentMedicationRoundsQuery`, `useAdministerMedicationMutation`, `useMedicationRoundMutations`, `useRiskAssessmentQuery`, `useDocumentsQuery`, `useUploadResidentPhotoMutation` |
| staff | `useGetStaffQuery`, `useCreateStaffMutationQuery`, `useDeleteStaffMutationQuery`, `useUpdateStaffAssignmentsMutationQuery`, `useUpdateStaffRoleMutationQuery`, `useUpdateStaffStatusMutationQuery` |
| shifts | `useGetShiftsQuery`, `useGetShiftTypesQuery`, `useCreateShiftMutation`, `useCreateShiftTypeMutation`, `useAssignStaffMutation`, `useUpdateShiftMutation`, `useGetActiveShiftQuery`, `useGetMyShiftsQuery`, `useGetShiftRequestsQuery`, `useCreateShiftRequestMutation`, `useUpdateShiftRequestStatusMutation` |
| facility | `useGet{Units,Wings,Rooms,Beds}Query`, `useCreate{Unit,Wing,Room,Bed}MutationQuery`, `useUpdate{...}MutationQuery`, `useDelete{...}MutationQuery` |
| dashboard | `useGetAdminStatsQuery` |
| audit | `useGetAuditLogsQuery` |
| auth | `authMutations` (login, logout, MFA verify, MFA reset request/verify) |
| organization | `organizationMutations`, `useGetOrganizationProfileQuery` |
| role | `roleMutations`, `useGetRolesListQuery` |

> Naming inconsistency: some files use `useXxxMutation`, others `useXxxMutationQuery`. Don't standardize unless the user asks — match the surrounding file.

### `AuthContext` (`lib/context/AuthContext.tsx`) — provided values
```ts
{
  user: { userId, email, fullName, roleName, tenantId, mfaVerified } | null,
  loading: boolean,
  login(email, password): Promise<{ requiresMfa?, mfaSetupRequired? }>,
  verifyMfa(token: string): Promise<void>,
  logout(): Promise<void>,
  refreshUser(): Promise<void>,
  requestMfaReset(): Promise<void>,
  verifyMfaReset(code: string): Promise<void>,
}
```
- Silent refresh: every 4 hours 55 minutes via `silentRefresh()` → `POST /api/auth/refresh`, five minutes before the access token expires.
- Inactivity timeout: 5 hours without browser activity.
- Use via `useAuth()` from this file; no other auth surface exists.

### Web config notes
- `next.config.js`: `transpilePackages: ['@repo/ui']`. Image domains: `storage.googleapis.com`, `process.fs.teachablecdn.com`. Rewrites `/api/:path*` to `NEXT_PUBLIC_API_URL`.
- `tailwind.config.ts`: extends `@repo/ui` config; content scans `app`, `lib`, `../../packages/ui/src`.
- `eslint.config.js`: extends `@repo/eslint-config/next-js`. ⚠ Currently disables `no-explicit-any`, `no-unused-vars`, `@next/next/no-img-element`, `react/no-unescaped-entities`, `react-hooks/exhaustive-deps`, `prefer-const`. Refactor.md Phase 2c will re-enable these.

---

## 8. DATABASE — Prisma model index

> Source: `packages/db/prisma/schema.prisma`. Re-exported types from `@repo/db`.

### Auth & Users
| Model | Key fields | Notes |
|---|---|---|
| `User` | `id`, `email` (unique), `roleId`, `tenantId?`, `passwordHash`, `mfaSecret?`, `mfaEnabled` | `tenantId` null = platform user (e.g., SuperAdmin). |
| `UserProfile` | `userId` (unique), `profilePhotoUrl`, `phoneNumber 🔒`, `addressLine1 🔒`, `city`, `postcode`, `startDate`, `department`, `qualifications` | Encrypted fields marked 🔒. |
| `RefreshToken` | `userId`, `token` (unique), `family`, `isRevoked`, `expiresAt` | Family-based rotation. |
| `MfaResetRequest` | `userId`, `token`, `code`, `expiresAt` | Short-lived. |

### Tenant & Org
| Model | Key fields |
|---|---|
| `Tenant` | `subdomain` (unique), `cqcNumber?` (unique), `status`, `packageId?`, `trialExpiresAt?` |
| `SubscriptionPackage` | `name`, `priceMonthly`, `residentLimit`, `staffLimit`, `featureFlags` (JSON), `isActive` |
| `Role` | `tenantId?`, `name`, `permissions` (JSON), `isSystem` | `tenantId=null && isSystem=true` → platform role. |

### Facility
| Model | Parent | Notes |
|---|---|---|
| `Unit` | tenant | top of hierarchy |
| `Wing` | unit | |
| `Room` | wing | `roomNumber`, `type` (Single/Double/Ensuite) |
| `Bed` | room | `status` (Available/Occupied/Maintenance), `residentId?` (unique) |

### Resident & Care
| Model | Notes |
|---|---|
| `Resident` | `nhsNumber 🔒`, `status`, `fundingType`, `keyworkerId?`, `dnarStatus`, `councilDetails` (JSON), `gpDetails` (JSON), `nextOfKin` (JSON), `photoUrl?`, `preferredCarerIds[]` (max 3), `doNotAssignIds[]` (max 2) |
| `CarePlan` | versioned by `sectionName` |
| `CarePlanTask` | recurring template (`frequency`: Daily/Weekly/Twice Daily/Custom, `timeOfDay[]`) |
| `DailyTask` | per-day instance of CarePlanTask, `status` (Pending/Completed/Skipped) |
| `CareTimeline` | event log per resident |
| `Document` | resident docs (GCS-backed) |
| `RiskAssessment` | `category`, `title`, `hazardDescription`, `tool?`, `likelihood`+`severity` (1-5)→`inherentScore`+`inherentLevel`, optional `residual{Likelihood,Severity,Score,Level}`, `status` (Draft/PendingReview/Active/Archived), `reviewFrequency`, `nextReviewDate`, `templateId?`, approver/reviewer FKs |
| `RiskTemplate` | system + tenant-level catalog. `category`, `defaultLikelihood`, `defaultSeverity`, `defaultControls` (JSON string[]), `tool?`, `isSystem` |
| `RiskControl` | per-assessment mitigation. `description`, `assignedToId?`, `dueDate?`, `status` (Pending/InProgress/Completed/Overdue), `carePlanTaskId?` (link to spawned daily-task — Phase B) |
| `RiskAlert` | in-app notification ledger. `recipientId`, `riskAssessmentId?`, `type` (HighRiskCreated/PendingReview/Activated/ControlAssigned/ReviewDue/ControlOverdue), `isRead` |

### Observations / Vitals / Incidents
| Model | Notes |
|---|---|
| `Observation` | NEWS2 fields + score, `consciousness`, `notifyGP`, `increaseMonitoring` |
| `FoodFluidLog` | intake tracking |
| `Incident` | `category`, `harmLevel` |

### Medication
| Model | Notes |
|---|---|
| `MedicationRound` | `drugName`, `dose`, `form`, `scheduledTime`, `allowLateAdministration` |
| `MedAdministration` | `status` (Given/Refused/Omitted/NPO), `carerId`, `administeredAt` |

### Staffing & Shifts
| Model | Notes |
|---|---|
| `StaffTraining` | `type`, `expiryDate`, `certificateUrl` |
| `StaffExpense` | `amount`, `type`, `status` |
| `ShiftType` | tenant template (Early/Late/Night) |
| `Shift` | `typeId`, `wingId`, `unitId`, `status` (Draft/Published) |
| `ShiftAssignment` | `shiftId`, `userId`, `role` |
| `ShiftRequest` | `type` (Leave/Change/Cover), `status` (Pending/Approved/Rejected) |
| `Handover` | `shiftId` (unique), `comment`, `missedTasks`, `incidentCount`, `lockedAt` |

### Billing
| Model | Notes |
|---|---|
| `CouncilPO` | `poNumber` (unique), `councilName`, `amountWeek`, dates |
| `Invoice` | `invoiceNumber` (unique), `amount`, `status`, `dueDate`, `councilPoId?` |
| `PaymentHistory` | per-invoice payment records |

### Audit
| Model | Notes |
|---|---|
| `TenantAuditLog` | tenant-scoped events |
| `PlatformAuditLog` | platform events (cross-tenant SuperAdmin actions) |

### Field-level encryption (AES-256-GCM)
- `Resident.nhsNumber`
- `UserProfile.phoneNumber`
- `UserProfile.addressLine1`
- Helpers: `encrypt()` / `decrypt()` in `packages/db/src/crypto.ts`. Read/write transparently via the **extended** `prisma` client; raw access via `rawPrisma`.

### Critical enums (do not invent values)
- `RiskAssessment.status`: `Draft | PendingReview | Active | Archived`
- `RiskAssessment.category` / `RiskTemplate.category`: `Clinical | Environmental | Behavioral | Building | Individual`
- `RiskAssessment.inherentLevel` / `residualLevel`: `Low | Moderate | High | Extreme` (computed from score: ≥20 Extreme, ≥12 High, ≥6 Moderate, else Low)
- `RiskAssessment.reviewFrequency`: `Weekly | Monthly | Quarterly | SixMonthly | Annual | AfterIncident`
- `RiskControl.status`: `Pending | InProgress | Completed | Overdue`
- `Resident.status`: `Active | Discharged | Deceased | Hospitalized | Transferred`
- `Bed.status`: `Available | Occupied | Maintenance`
- `Tenant.status`: `Pending | Active | Suspended | Inactive`
- `Shift.status`: `Draft | Published`
- `ShiftRequest.type`: `Leave | Change | Cover`
- `ShiftRequest.status`: `Pending | Approved | Rejected`
- `MedAdministration.status`: `Given | Refused | Omitted | NPO`
- `Observation.consciousness`: `Alert | Confusion | V | P | U` (ACVPU)
- `DailyTask.status`: `Pending | Completed | Skipped`
- `CarePlanTask.frequency`: `Daily | Weekly | Twice Daily | Custom`

### `@repo/db` exports
- `prisma` — extended client with encryption hooks (PREFER THIS).
- `rawPrisma` — un-extended client (only for non-encrypted edge cases).
- `Prisma`, all model types (`User`, `Resident`, etc.), `PrismaTransactionClient`, `RawPrismaTransactionClient`.

---

## 9. SHARED Zod SCHEMAS — `@repo/schema`

> Files: `auth.ts, tenant.ts, staff.ts, facility.ts, role.ts, resident.ts, care-plan.ts, medication.ts, observation.ts, shifts.ts, index.ts`.
> Pattern: each file exports a `xxxSchema` (Zod) and a `XxxDTO` (z.infer). Always import the DTO type alongside the schema.

| Domain | Schemas (→ DTOs) |
|---|---|
| auth | `loginSchema → LoginDTO`, `mfaVerifySchema → MfaVerifyDTO`, `changePasswordSchema → ChangePasswordDTO`, `mfaResetVerifySchema → MfaResetVerifyDTO` |
| tenant | `createTenantSchema → CreateTenantDTO`, `updateTenantSchema → UpdateTenantDTO`, `tenantStatusSchema → TenantStatus` |
| staff | `createStaffSchema → CreateStaffDTO`, `updateStaffSchema → UpdateStaffDTO`, `updateStaffRoleSchema → UpdateStaffRoleDTO`, `staffStatusSchema → StaffStatus`, `updateStaffStatusSchema → UpdateStaffStatusDTO`, `updateStaffAssignmentsSchema → UpdateStaffAssignmentsDTO` |
| facility | `createUnitSchema → CreateUnitDTO`, `updateUnitSchema`, `createWingSchema`, `updateWingSchema`, `createRoomSchema → CreateRoomDTO`, `updateRoomSchema`, `bedStatusSchema → BedStatus`, `createBedSchema → CreateBedDTO` (with `quantity` 1–10), `updateBedSchema` |
| role | `modulePermissionSchema`, `rolePermissionsSchema → RolePermissions` (modules: `dashboard, residents, staff, facilities, payments, settings`), `createRoleSchema → CreateRoleDTO`, `updateRoleSchema` |
| resident | `DischargeResidentSchema → DischargeResidentDTO`, `AdmitConfirmSchema → AdmitConfirmDTO`, `UpdateResidentFundingSchema → UpdateResidentFundingDTO`, `CarePlanSchema → CarePlanDTO`; admission drafts use the pre-admission schemas and endpoints |
| care-plan | `CarePlanTaskSchema → CarePlanTaskDTO`, `CreateCarePlanTaskSchema`, `DailyTaskSchema → DailyTaskDTO`, `UpdateDailyTaskStatusSchema → UpdateDailyTaskStatusDTO` |
| medication | `CreateMedicationRoundSchema`, `CreateMedicationRoundBulkSchema` (times[] HH:mm regex), `AdministerMedicationSchema → AdministerMedicationDTO` |
| observation | `ObservationSchema → ObservationDTO`, helper fn `calculateNEWS2Score()` |
| shifts | `ShiftTypeSchema`, `CreateShiftTypeSchema`, `ShiftSchema`, `CreateShiftSchema`, `ShiftAssignmentSchema`, `CreateShiftAssignmentSchema`, `ShiftRequestSchema`, `CreateShiftRequestSchema`, `UpdateShiftRequestStatusSchema → UpdateShiftRequestStatusDTO` |

> Validation rules to remember (commonly missed):
> - `subdomain`: lowercase letters/digits/hyphens only.
> - `password`: ≥8 chars, ≥1 uppercase, ≥1 digit (in `changePasswordSchema`).
> - `niNumber`: UK National Insurance regex.
> - `Resident`: if `dnarStatus = true`, `consentNote` is required.
> - `Resident.preferredCarerIds`: max 3. `doNotAssignIds`: max 2.

> Response types are NOT yet in `@repo/schema`. Refactor.md Phase 9 will move FE types (`apps/web/lib/types/*.ts`) into `packages/schema/src/responses/`. Until then, treat FE types as the source of truth on the FE and the inferred Prisma return as truth on the BE.

---

## 10. UI PRIMITIVES — `@repo/ui`

> Style: shadcn (default) + Radix headless + Tailwind v4. CSS variables for theming. Slate base color. No prefix.
> Path alias: `@repo/ui/components/<name>`, `@repo/ui/hooks/<name>`, `@repo/ui/lib/utils` (for `cn()`).

Components (40 in `src/components/ui/`): Alert, AlertDialog, Avatar, Badge, Breadcrumb, Button, Calendar, Card, Carousel, CheckBox, Collapsible, Command, DateSelector, Dialog, DropdownMenu, FlyoutSheet, Input, Label, MenuBar, MultiSelect, NavigationMenu, Pagination, Popover, RadioGroup, Select, Separator, Sheet, Sidebar, Skeleton, Slider, Spinner, Switch, Table, Tabs, Text, Textarea, Toast, Toaster, Toggle, Tooltip.

Hooks: `useMobile`, `useToast`, `usePagination`. Util: `cn()` (clsx + tailwind-merge).

Always prefer `@repo/ui` primitives over hand-rolled HTML/CSS. Do NOT pull in `shadcn add` directly into `apps/web` — add to `packages/ui/src/components/` so it's shared.

---

## 11. CONVENTIONS

### Naming
- BE files: `<domain>.<role>.ts` → `staff.controller.ts`, `staff.service.ts`, `staff.module.ts`, `staff.dto.ts`.
- FE endpoint folders: lowercase domain name (e.g. `lib/endpoints/residents/index.ts`).
- FE hook files: `useXxx{Query|Mutation}.ts`.
- FE pages: lowercase route segments; dynamic segments in `[brackets]`.

### Imports
- Workspace: `import { ... } from '@repo/db'` etc. Never reach into `dist/`.
- Backend: relative imports inside a module are fine; cross-module use full path from `apps/backend/src/...`.

### Error handling
- BE: throw NestJS `HttpException` subclasses (`BadRequestException`, `NotFoundException`, `ForbiddenException`, `UnauthorizedException`, `ConflictException`).
- BE catch: `catch (error: unknown)` with narrowing (`instanceof Error`, `instanceof z.ZodError`). Never `catch (error: any)`.
- FE: `makeAPICall` rejects with the parsed error JSON. Mutations should expose `error.message`. UI surfaces use `useToast()`.

### Logging
- BE: `private readonly logger = new Logger(<ClassName>.name)`; `logger.log/warn/error/debug`. Never `console.log`. Never log full user objects, tokens, passwords.
- FE: `console.warn`/`console.error` is allowed; no `console.log`.

### Audit logging
- For tenant-scoped writes (create/update/delete), call `AuditService.logTenantAction(...)` (ref: `apps/backend/src/common/services/audit.service.ts` per Refactor Phase 3b — adopt as it lands; until then, use `prisma.tenantAuditLog.create` + `toJsonValue(...)`).
- For platform writes (SuperAdmin), use `logPlatformAction`.
- Async: never `await` blocking — use `emit()` queue path.

### TanStack Query patterns
- `staleTime: 60s` (set in `query-client.ts`). Don't override per-query unless reason given.
- Use `queryKey: ['<domain>', '<entity>', tenantId, filters?]`. Keep tenantId in the key when relevant.
- Mutations should `invalidateQueries({ queryKey: [...] })` on success.
- SSR pages may dehydrate/hydrate via `<HydrationBoundary>` — preserve this pattern (Refactor.md mentions hydration/dehydration as standard).

### File size: hard cap 350 lines
Currently violating: `facility.service.ts` (584), `AppSidebar.tsx` (417). Don't add to them; refactor when touching.

### TypeScript strictness
- Backend `tsconfig.json`: currently `strictNullChecks: true` only (NOT full strict). Refactor Phase 1 will flip to `strict: true` + `noUncheckedIndexedAccess: true`.
- Web: also not fully strict. Same plan.
- Treat code as if strict mode were on. Add explicit return types on all public methods (Refactor Phase 4).

### ESLint
- Backend: `@typescript-eslint/no-explicit-any: off` currently — Refactor Phase 2a flips to `error`. Write code as if it were already `error`.
- Web: same — Phase 2c.
- Shared base: uses `eslint-plugin-only-warn` (downgrades errors to warnings) — Phase 2b removes it.

---

## 12. CANONICAL TASK RECIPES

### Add a new tenant-scoped entity (full slice)
1. **Schema (`packages/schema/src/<entity>.ts`)**: define `createXxxSchema`, `updateXxxSchema`, infer DTOs. Re-export from `index.ts`.
2. **DB (`packages/db/prisma/schema.prisma`)**: add model with `tenantId`, FKs, audit fields. `pnpm db:generate && pnpm db:push`.
3. **Backend module (`apps/backend/src/<entity>/`)**:
   - `<entity>.module.ts` (in `app.module.ts` imports).
   - `<entity>.controller.ts` with `@Controller('<plural>')`, `@UseGuards(JwtAuthGuard, RolesGuard)`, `@Roles(...)` per endpoint, `@Body(new ZodValidationPipe(createXxxSchema))`.
   - `<entity>.service.ts` — methods accept `tenantId` and `userId`; filter Prisma WHERE by `tenantId`; emit audit via `AuditService` (or `prisma.tenantAuditLog.create` + `toJsonValue`).
   - Explicit return types on all public methods.
4. **Web endpoints (`apps/web/lib/endpoints/<plural>/index.ts`)**: define keys (`GET_XXXS`, `CREATE_XXX`, etc.) → endpoint+method.
5. **Web queries (`apps/web/lib/queries/<entity>/`)**: query/mutation hooks calling `makeAPICall`.
6. **Web page(s)**: under `app/(protected)/<role>/<entity>/page.tsx`. Wrap mutations in `useMutation` + `invalidateQueries` on success. Use `@repo/ui` primitives.
7. **Add to `AppSidebar.tsx`** if it needs nav entries (role-aware).

### Add a new endpoint to an existing entity
1. Add Zod schema to `@repo/schema` (or extend existing).
2. Add controller method + service method (BE).
3. Add KEY constant to `apps/web/lib/endpoints/<domain>/index.ts`.
4. Add hook in `apps/web/lib/queries/<domain>/`.
5. Wire into the page that needs it.

### Modify an entity field
1. Update `packages/db/prisma/schema.prisma`.
2. Run `pnpm db:generate && pnpm db:push`.
3. Update Zod schema in `@repo/schema`.
4. Update BE service mappings + audit `oldValue`/`newValue` (auto-handled via `toJsonValue`).
5. Update FE types in `apps/web/lib/types/<entity>.ts` (until Phase 9 moves to `@repo/schema`).
6. Update affected forms/views.

### Add a new role
- Roles are seeded; do NOT change role names without coordinating with `apps/web/middleware.ts` (uppercased switches) AND every `@Roles(...)` call site.
- Roles can be created at runtime via `POST /api/roles` (tenant-scoped, custom roles). New custom roles need permission JSON shape from `rolePermissionsSchema`.

---

## 13. KNOWN DEBT (from `Refactor.md`)

Treat these as the ground truth of what's NOT yet clean. Do not claim "the codebase is strict-typed" — it isn't yet.

| Area | State |
|---|---|
| `as any` casts in BE src | 45+ remaining (mostly audit log writes — fix via `toJsonValue()`). |
| `catch (error: any)` | 6 occurrences (BE pipe + several FE pages). |
| `console.log` in BE | 7 occurrences (incl. `RolesGuard` logging full user — security risk). |
| Untyped `@Body() dto: any` | `auth.controller.changePassword` and `verifyMfaReset` (typed-DTO migration in Phase 6). |
| Implicit return types | ~20 BE methods (Phase 4). |
| `Promise<any>` returns | 2 in `facility.service.ts`. |
| BE `tsconfig.strict` | Currently off; flip is Phase 1 (last). |
| ESLint `no-explicit-any` | `off` in BE; missing in FE; only-warn plugin downgrades errors monorepo-wide. Phase 2. |
| `(db: any)` workaround | `auth.service.ts:17` `getMfaResetRequest`. Phase 5: regenerate Prisma client and remove. |
| FE-duplicated types | `apps/web/lib/types/{facility,resident,role,shifts,staff}.ts` — to be moved into `@repo/schema/src/responses/`. Phase 9. |
| FE `makeAPICall` key typing | `apiName: string` → `keyof typeof endpointInfo`. Phase 10. |
| Web `lib/api.ts` ↔ superadmin `lib/api.ts` | Near-duplicates; Phase 11 extracts to `@repo/schema` `createApiCall`. |
| Files >350 LoC | `facility.service.ts` (584), `AppSidebar.tsx` (417). Phase 12. |
| `apps/backend/src/common/encryption.ts` ↔ `packages/db/src/crypto.ts` | Duplicate logic — consolidate. Phase 12c. |
| `residents.service.ts` `as unknown as Resident` | Lines 102, 181, 197, 218 — proper response types needed. |
| MFA enforcement | Disabled in middleware (commented). MFA setup endpoints work but middleware does not gate. |

---

## 14. COMMANDS

| Goal | Command (run from monorepo root unless noted) |
|---|---|
| Install | `pnpm install` |
| Dev all | `pnpm dev` |
| Dev only web | `pnpm dev --filter web` |
| Dev only backend | `pnpm dev --filter backend` |
| Build all | `pnpm build` |
| Type-check all | `pnpm check-types` |
| Lint all | `pnpm lint` |
| Prisma generate | `pnpm db:generate` |
| Prisma push schema | `pnpm db:push` |
| Seed DB | `pnpm db:seed` |
| Tests (BE) | `cd apps/backend && pnpm test` |

### Verification grep (Refactor Phase 13)
```
grep -r "as any" apps/backend/src/ --include="*.ts"            # target: 0
grep -r "console.log" apps/backend/src/ --include="*.ts"        # target: 0
grep -r "catch (error: any)" apps/ --include="*.ts" --include="*.tsx"  # target: 0
```

---

## 15. ENV VARS (essential)

| Var | Where | Purpose |
|---|---|---|
| `DATABASE_URL` | `apps/backend/.env`, `packages/db/.env` | Postgres URL |
| `JWT_SECRET` | `apps/backend/.env`, `apps/web/.env` | Must match — web middleware verifies BE-issued tokens |
| `NEXT_PUBLIC_API_URL` | `apps/web/.env` | Defaults to `http://localhost:4400/api` |
| Redis host/port | `apps/backend/.env` | BullMQ audit queue |
| GCS credentials | `apps/backend/.env` | Document/photo storage |
| SMTP creds | `apps/backend/.env` | Email (OTP, MFA reset) |
| Field-encryption key | `packages/db/.env` | AES-256-GCM key for `crypto.ts` |

> Verify the actual `.env` keys in code — variable names above are conceptual. Do not hardcode secrets. `JWT_SECRET` defaults to `'secretKey'` in code (`auth.service.ts`, `middleware.ts`) — never ship that in production.

---

## 16. WHEN MAKING SUGGESTIONS

- ALWAYS reference the file by path (e.g. `apps/backend/src/staff/staff.service.ts`).
- ALWAYS prefer extending existing patterns over inventing new ones.
- ALWAYS validate role gating both BE (`@Roles`) and FE (middleware path + UI conditional).
- NEVER introduce a new utility/helper without checking `apps/backend/src/common/` and `packages/ui/src/lib`.
- NEVER add a feature flag, fallback, or backwards-compat shim — change the code directly.
- IF a requirement contradicts this doc (e.g., "store the JWT in localStorage"), STOP and ask before proceeding.

---

*End of PROJECT.md. If anything here disagrees with the code, the code wins — but flag the discrepancy so this doc can be corrected.*
