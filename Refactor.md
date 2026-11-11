# Refactor.md — LCM Cleanup Playbook

> **Authoritative cleanup backlog.** Goal: zero `any`, zero lint warnings, strict TS, ≤350 LoC per file.
> Scope: `apps/backend`, `apps/web`, `apps/superadmin`, `packages/*`.
> Read [`AGENTS.md`](./AGENTS.md) before executing. Lookups in [`PROJECT.md`](./PROJECT.md).

---

## STATE OF PLAY

| Metric | Now | Target |
|---|---:|---:|
| `as any` in `apps/backend/src/` | 45+ | 0 |
| `catch (error: any)` (full repo) | 6 | 0 |
| `console.log` in BE | 7 | 0 |
| Untyped `@Body() dto` | 2 | 0 |
| Implicit return types (BE public methods) | ~20 | 0 |
| `Promise<any>` returns | 2 | 0 |
| `Files > 350 LoC` | 2 (`facility.service.ts` 584, `AppSidebar.tsx` 417) | 0 |
| Duplicated `api.ts` (web ↔ superadmin) | 2 | 1 (shared) |
| Duplicated FE entity types | ~8 files | 0 (use `@repo/schema`) |
| BE `tsconfig` | `strictNullChecks` only | `strict: true` + `noUncheckedIndexedAccess` |
| BE ESLint `no-explicit-any` | `off` | `error` |
| `eslint-plugin-only-warn` | active (downgrades all errors) | removed |

---

## EXECUTION ORDER (do not flip this)

| # | Phase | Effort | Blocks | Why this slot |
|---|---|---|---|---|
| 1 | Audit-log helper (`toJsonValue` + `AuditService`) | M | unblocks 40+ `any` removals | start here — biggest win |
| 2 | MFA Prisma fix (`getMfaResetRequest`) | S | — | targeted, isolated |
| 3 | Typed `@Body()` DTOs | S | — | small, safe |
| 4 | Error handling (`catch (error: unknown)`) | S | needed before `strict` | small |
| 5 | `console.log` → `Logger` | S | — | small |
| 6 | Explicit return types | M | needed before `strict` | medium |
| 7 | Split files >350 LoC | M | — | medium |
| 8 | Shared response types in `@repo/schema` | M | unblocks FE typing | medium |
| 9 | FE `makeAPICall` typed keys | M | — | medium |
| 10 | Dedup web ↔ superadmin shared code | M | — | medium |
| 11 | ESLint hardening (flip the switch) | S | requires 1-10 done | flip after code is clean |
| 12 | TS `strict: true` (flip the switch) | S | requires 1-11 done | LAST — surfaces 50-100 hidden errors |
| 13 | Final verification | S | — | grep + build + tests |

> Phase numbers below are NOT execution order — they are the original Refactor.md sections (kept stable for cross-reference). Use the table above for sequencing.

---

## PHASE 1 — TS strict mode (BE) **[do LAST]**

**File:** `apps/backend/tsconfig.json`

Replace the cherry-picked flags with:
- `"strict": true`
- `"noFallthroughCasesInSwitch": true`
- `"noUncheckedIndexedAccess": true`
- Remove: `"strictNullChecks"`, `"noImplicitAny"`, `"strictBindCallApply"`, the explicit `false`s.

Expect 50-100 new errors. Do NOT do this in isolation. Phases 3-7 must land first.

---

## PHASE 2 — ESLint hardening **[do AFTER 1-10]**

### 2a. `apps/backend/eslint.config.mjs`
Flip these from `off`/`warn` → `error`:
- `@typescript-eslint/no-explicit-any`
- `@typescript-eslint/no-floating-promises`
- `@typescript-eslint/no-unsafe-argument`
- Add `error`: `no-unsafe-assignment`, `no-unsafe-member-access`, `no-unsafe-return`, `no-unsafe-call`
- Add `explicit-function-return-type` `error` (allow expressions + typed function expressions)
- `@typescript-eslint/no-unused-vars` `error` (`argsIgnorePattern: '^_'`)
- `no-console` `warn` (allow `warn`, `error`)

### 2b. `packages/eslint-config/base.js`
- **Remove** `eslint-plugin-only-warn` import + plugin block (this is what downgrades errors to warnings monorepo-wide).
- Add to recommended rules: `@typescript-eslint/no-explicit-any: 'error'`, `@typescript-eslint/no-unused-vars: ['error', { argsIgnorePattern: '^_' }]`.

### 2c. `packages/eslint-config/next.js`
Add to React rules: `@typescript-eslint/no-explicit-any: 'error'`, `@typescript-eslint/no-unused-vars: 'error'`, `no-console: 'warn'` (allow `warn`/`error`).

### Test-file exception (acceptable)
```js
{ files: ['**/*.spec.ts', '**/*.test.ts'], rules: { '@typescript-eslint/no-explicit-any': 'off' } }
```

---

## PHASE 3 — Eliminate `as any` in audit logging **[start here]**

40+ of the 45 `as any` casts are `tenantAuditLog.create({ ..., newValue: x as any })`. Fix once, apply everywhere.

### 3a. Create `apps/backend/src/common/utils/json.util.ts`
```ts
import type { Prisma } from '@repo/db';
export function toJsonValue<T>(value: T): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
```
If `Prisma.InputJsonValue` isn't accessible from `@repo/db`, ensure `packages/db/src/index.ts` re-exports `Prisma` from `@prisma/client`.

### 3b. Create `apps/backend/src/common/services/audit.service.ts`
Inject and call `AuditService.logTenantAction({ tenantId, userId, actionType, entityType, entityId?, oldValue?, newValue? })` and `logPlatformAction({ userId, action, tenantId?, oldValue?, newValue? })`. Internally pass JSON fields through `toJsonValue()` so callers never touch the cast.

### 3c. Replace every call site

| File | `as any` count | Fix |
|---|---:|---|
| `staff/staff.service.ts` | 4 | `toJsonValue()` |
| `tenants/tenants.service.ts` | 4 | `toJsonValue()` |
| `tenants/organization.controller.ts` | 5 | `toJsonValue()` + move logic to `TenantsService` |
| `facility/facility.service.ts` | 20 | `toJsonValue()` |
| `roles/roles.service.ts` | 5 | `toJsonValue()` |
| `residents/residents.service.ts` | 2 | `toJsonValue()` |
| `auth/auth.service.ts` | 1 | covered in Phase 5 |

End state: zero `as any` in audit log writes.

---

## PHASE 4 — Explicit return types

Annotate every public service/controller method. No implicit inference of complex return types.

### Hot-spot table

| Service | Method | Now | Should be |
|---|---|---|---|
| `FacilityService` | `createUnit` | `Promise<any>` | `Promise<Unit>` |
| `FacilityService` | `findAllUnits` | `Promise<any[]>` | `Promise<UnitWithCounts[]>` |
| `FacilityService` | `updateUnit` | implicit | `Promise<Unit>` |
| `FacilityService` | `findAllWings` | `Promise<any[]>` | `Promise<WingWithCounts[]>` |
| `FacilityService` | `findAllRooms` | `Promise<any[]>` | `Promise<RoomWithCounts[]>` |
| `FacilityService` | `createBed` | `Promise<any>` | `Promise<Prisma.BatchPayload>` |
| `FacilityService` | `findAllBeds` | `Promise<any[]>` | `Promise<BedWithDetails[]>` |
| `AuthService` | `login`, `verifyMfa`, `verifyMfaReset`, `refreshAccessToken` | implicit | `Promise<TokenPair>` / `Promise<LoginResult>` |
| `AuthService` | `buildJwtPayload` | implicit | `JwtPayload` |
| `AuthService` | `generateMfaSecret` | implicit | `Promise<MfaSetup>` |
| `AuthController` | `login` / `refresh` / `getSecurityState` | implicit | `Promise<LoginResponse>` / `Promise<{success:boolean}>` / `Promise<SecurityState>` |
| `AuthController` | `changePassword` | `dto:any` | `ChangePasswordDTO` (Phase 6) |
| `TenantsService` | `verifyTenant` | implicit | `Promise<{success:boolean; email:string}>` |
| `ResidentsService` | (multiple) | `as unknown as Resident` | proper response type |

### New type files to create
- `apps/backend/src/facility/facility.types.ts` — `UnitWithCounts`, `WingWithCounts`, `RoomWithCounts`, `BedWithDetails` (extend Prisma models with computed counts).
- `apps/backend/src/auth/auth.types.ts` — `LoginResult`, `TokenPair`, `MfaSetup`, `JwtPayload`, `SecurityState`, `LoginResponse`.
- `apps/backend/src/residents/residents.types.ts` — `ResidentWithRelations` matching the actual `include` shape.

---

## PHASE 5 — Remove `(db: any)` workaround

**File:** `apps/backend/src/auth/auth.service.ts:17`
```ts
const getMfaResetRequest = (db: any) => db.mfaResetRequest;  // DELETE
```

### Option A (preferred)
Regenerate Prisma client so `MfaResetRequest` model is typed:
```bash
cd packages/db && pnpm db:generate && pnpm build
```
Then replace every `getMfaResetRequest(rawPrisma).X(...)` with `rawPrisma.mfaResetRequest.X(...)` directly.

### Option B (only if generation still misses the model)
Create a typed accessor: `function getMfaResetModel(db: PrismaClient) { return db.mfaResetRequest; }`. Note: typed `PrismaClient`, not `any`.

---

## PHASE 6 — Typed `@Body()` DTOs

### 6a. `auth.controller.ts:188` — `changePassword`
- Import `ChangePasswordDTO`, `changePasswordSchema` from `@repo/schema` (add the schema if missing).
- Replace `@Body() dto: any` with `@Body(new ZodValidationPipe(changePasswordSchema)) dto: ChangePasswordDTO`.
- Annotate return: `Promise<{ success: boolean }>`.

### 6b. `auth.controller.ts:219` — `verifyMfaReset`
- Import `MfaResetVerifyDTO`, `mfaResetVerifySchema`.
- Replace `@Body() dto: { code: string }` with `@Body(new ZodValidationPipe(mfaResetVerifySchema)) dto: MfaResetVerifyDTO`.
- Annotate return: `Promise<{ success: boolean }>`.

### 6c. `tenants/organization.controller.ts:29`
- Stop calling `prisma.tenant.update({ data: updateDto as any })` from the controller.
- Move logic to `TenantsService.updateOwnProfile(tenantId, updateDto, userId): Promise<Tenant>`.
- Strip non-tenant fields (`password`) before passing to Prisma.
- Audit at both tenant and platform level via `AuditService`.

End state: zero untyped `@Body()` in any controller, zero `as any` on Prisma update payloads.

---

## PHASE 7 — Error handling (`catch (error: unknown)`)

| File | Line(s) | Narrowing |
|---|---|---|
| `apps/backend/src/common/pipes/zod.pipe.ts` | 11 | `if (error instanceof z.ZodError) throw new BadRequestException({ message: 'Validation failed', errors: error.errors }); throw error;` |
| `apps/web/middleware.ts` | 78 (already done in current code — verify) | `error instanceof Error && 'code' in error` then check `error.code === 'ERR_JWT_EXPIRED'` |
| `apps/web/app/login/mfa/page.tsx` | 50, 63, 75 | `error instanceof Error ? error.message : 'Unknown'` |
| `apps/web/app/login/components/LoginForm.tsx` | 45 | same pattern |

Rule: never `catch (error: any)`. Always `catch (error: unknown)` then narrow.

---

## PHASE 8 — `console.log` → NestJS `Logger`

For every `Injectable`: `private readonly logger = new Logger(<ClassName>.name)`.

| File | Line(s) | Replace with |
|---|---|---|
| `apps/backend/src/common/guards/roles.guard.ts` | 20-21 | `logger.debug(\`Checking roles for user ${user?.userId}: required=${requiredRoles.join(',')}\`)` — **never log the full user object** |
| `apps/backend/src/auth/auth.service.ts` | 241 | `logger.warn` (MFA failure) |
| `apps/backend/src/tenants/tenants.service.ts` | 228 | `logger.warn` (session invalidation) |
| `apps/backend/src/tenants/tenants.service.ts` | 104, 110 | `logger.error` |
| `apps/backend/src/main.ts` | 39 | NestJS bootstrap `Logger.log` |
| `apps/backend/src/common/mail/mail.service.ts` | 35, 76 | `logger.log` |
| `apps/backend/src/auth/refresh-token.service.ts` | 55-56 | `logger.warn` (already `console.warn`) |

> SECURITY: never log full users, tokens, passwords, OTPs, or NHS numbers. IDs and non-sensitive metadata only.

---

## PHASE 9 — Shared response types in `@repo/schema`

Today FE re-declares entity shapes that diverge silently from BE. Move them.

### Create
- `packages/schema/src/responses/staff.response.ts` → `StaffMemberResponse`
- `packages/schema/src/responses/facility.response.ts` → `UnitResponse`, `WingResponse`, `RoomResponse`, `BedResponse`
- `packages/schema/src/responses/tenant.response.ts` → `TenantResponse`
- `packages/schema/src/responses/auth.response.ts` → `LoginResponse`, `SecurityStateResponse`
- `packages/schema/src/responses/resident.response.ts` → `ResidentResponse`
- `packages/schema/src/responses/index.ts` → barrel
- Add `export * from './responses';` to `packages/schema/src/index.ts`.

### Delete (after callers migrate)
| Delete | Replace with |
|---|---|
| `apps/web/lib/types/facility.ts` | `import { UnitResponse, ... } from '@repo/schema'` |
| `apps/web/lib/types/staff.ts` | `import { StaffMemberResponse } from '@repo/schema'` |
| `apps/web/lib/types/resident.ts` | `import { ResidentResponse } from '@repo/schema'` |
| `apps/web/lib/types/role.ts` | `import { RoleResponse } from '@repo/schema'` |

Same pattern for `apps/superadmin/lib/types/`. (Out-of-scope for this monorepo's main work, but list it in the migration PR.)

End state: one source of truth per response shape, shared BE+FE+SuperAdmin.

---

## PHASE 10 — Frontend type-safety (`makeAPICall`)

### 10a. Type-safe endpoint key
`apps/web/lib/api.ts`: change signature
```
makeAPICall<T>(apiName: string, ...) → makeAPICall<T>(apiName: keyof typeof endpointInfo, ...)
```
Same change in `apps/superadmin/lib/api.ts`.

### 10b. Per-endpoint response type map
Create `apps/web/lib/endpoints/types.ts`:
```ts
export interface ApiResponseMap {
  GET_STAFF: StaffMemberResponse[];
  CREATE_STAFF: StaffMemberResponse;
  GET_UNITS: UnitResponse[];
  // ...one entry per endpoint key
}
```
Refit `makeAPICall` so `K extends keyof ApiResponseMap` and return type is `Promise<ApiResponseMap[K]>`.

### 10c. (Optional) Zod runtime validation of responses
At the boundary, `responseSchema.safeParse(data)` and `console.error` on failure. Skip in hot-path queries.

End state: typo'd endpoint name → compile error. Wrong consumer type → compile error.

---

## PHASE 11 — Dedup web ↔ superadmin shared code

`apps/web/lib/api.ts` and `apps/superadmin/lib/api.ts` are near-duplicates (56 vs 61 lines). The `Method` type, `NullableString`, and endpoint-config types are also duplicated.

### Path A (preferred — fewer packages)
Add to `packages/schema/src/api-client.ts`:
```ts
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export interface EndpointConfig { requestType: HttpMethod; endpoint: string; }
export type EndpointMap = Record<string, EndpointConfig>;
export async function createApiCall<T>(endpointMap: EndpointMap, apiName: string, options?: {...}): Promise<T> { ... }
```
Both apps' `api.ts` become thin wrappers around `createApiCall(localEndpoints, name, opts)`.

### Path B
Create new `packages/api-client` if logic grows. Don't bother yet.

### Delete
| Delete | Replace with |
|---|---|
| `apps/web/lib/types.ts` | `@repo/schema` imports |
| `apps/superadmin/lib/types.ts` | `@repo/schema` imports |
| Both `api.ts` bodies | thin wrappers |

---

## PHASE 12 — File size & code organization

### 12a. Split `apps/backend/src/facility/facility.service.ts` (584 → 4× ~100)
```
apps/backend/src/facility/
├── services/
│   ├── unit.service.ts    (~80)
│   ├── wing.service.ts    (~100)
│   ├── room.service.ts    (~110)
│   └── bed.service.ts     (~110)
├── facility.module.ts     (registers all 4)
├── facility.controller.ts (delegates)
├── facility.types.ts      (shared interfaces)
└── dto/facility.dto.ts
```

### 12b. Split `apps/web/lib/components/AppSidebar.tsx` (417)
```
apps/web/lib/components/sidebar/
├── AppSidebar.tsx          (~80, layout shell)
├── SidebarNavGroups.tsx    (~80, expanded nav)
├── MiniSidebar.tsx         (~100, icon strip + popovers)
├── navigation-data.ts      (~100, roleNavigation config)
└── types.ts                (~20, NavItem, NavGroup)
```

### 12c. Other organizational fixes
- `residents.service.ts` lines 102, 181, 197, 218: replace `as unknown as Resident` with `ResidentWithRelations` type that mirrors the `include`-enriched return.
- `tenants/organization.controller.ts`: move raw Prisma + audit logic into `TenantsService` (Clean Architecture: Controller → Service → Repository).
- Delete `apps/backend/src/common/encryption.ts`. Use `packages/db/src/crypto.ts` exclusively. Update imports.

End state: every file ≤ 350 lines. Single-responsibility services. No duplicated encryption logic.

---

## PHASE 13 — Final verification

Run **from the monorepo root**. All must be clean.

### 1. Rebuild shared packages
```
cd packages/db && pnpm db:generate && pnpm build
cd ../schema && pnpm build
cd ../ui && pnpm build
```

### 2. Type-check
```
pnpm check-types          # → 0 errors
```

### 3. Lint
```
pnpm lint                 # → 0 errors, 0 warnings (no more only-warn downgrade)
```

### 4. Build
```
pnpm build                # → clean for backend, web, superadmin
```

### 5. Grep verification (target: 0 in each)
```
grep -r "as any" apps/backend/src/ --include="*.ts" | wc -l
grep -r ": any" apps/backend/src/ --include="*.ts" | wc -l
grep -r "console.log" apps/backend/src/ --include="*.ts" | wc -l
grep -r "catch (error: any)" apps/ --include="*.ts" --include="*.tsx" | wc -l
```

### 6. Tests
```
cd apps/backend && pnpm test
```
> Test files (`*.spec.ts`, `*.test.ts`) may keep `as any` for mocks via the ESLint override added in Phase 2.

---

## DO / DON'T

| Do | Don't |
|---|---|
| Run Phases 3-7 first (small, targeted, unblock the rest) | Flip `strict: true` early — surfaces 50-100 errors before the cleanup is in |
| Land each phase as its own PR | Bundle Phases 1-12 into one mega-PR |
| Keep test-file `any` exception narrow | Apply the test override to non-test files |
| Use `toJsonValue()` for every JSON column write | Reach for `as any` "just this once" |
| Create `<domain>.types.ts` next to the service | Re-declare shapes in the FE again |
| Use `Logger` with class name | `console.log` "for debugging" |

---

## DOC PROVENANCE

This file replaces the verbose Refactor.md (~1000 lines) with a token-optimized version (~280 lines) for low-model execution. Original prose-heavy diff blocks were removed because the actual code is in the repo — `grep` and `Read` are cheaper than re-quoting. Counts and hot-spot tables are preserved verbatim.
