# AGENTS.md — LCM Monorepo Rules of Engagement

> **Auto-loaded by AI coding agents. READ BEFORE EVERY TASK.**
> Authoritative facts (endpoints, models, routes, hooks) live in [`PROJECT.md`](./PROJECT.md). Load it on demand.
> Cleanup backlog (strict mode, no-`any`, file size) lives in [`Refactor.md`](./Refactor.md).

Scope: `apps/backend`, `apps/web`, `packages/{db,schema,ui,eslint-config,typescript-config}`. Out of scope: `apps/superadmin`, `apps/docs`.

---

## NON-NEGOTIABLE RULES

1. **Stack is fixed.** BE = NestJS + Prisma + Zod. Web = Next.js App Router + TanStack Query v5 + Tailwind + Radix (via `@repo/ui`). Do NOT introduce: Express handlers, Pages Router, Redux, Axios, SWR, Yup, Joi, Sequelize, TypeORM, Mongoose, MUI, Chakra, Bootstrap, styled-components, Emotion, Zustand. Ask before adding any new dependency.
2. **No `any`.** Forbidden in `apps/backend/src` and `apps/web` source. Use `unknown` + narrowing or a real type. Audit JSON columns use `toJsonValue()` from `apps/backend/src/common/utils/json.util.ts`.
3. **DTOs only from `@repo/schema`.** Don't define request/response shapes inline. Missing DTO → add to `packages/schema/src/<domain>.ts` and barrel-export.
4. **Prisma client is `prisma` from `@repo/db`.** Never `new PrismaClient()`. `rawPrisma` is for non-encrypted edge cases only.
5. **Tenant isolation is mandatory.** Every tenant-scoped query MUST filter by `tenantId` from the JWT (`req.user.tenantId`), NEVER from the request body.
6. **Auth = cookie-based.** Fully authenticated `access_token` (5h, path `/`); pending-MFA access token (15m); `refresh_token` (7d, path `/api/auth`). Never `localStorage` / `sessionStorage`.
7. **Frontend never calls `fetch` directly.** Use `makeAPICall(KEY, payload?, params?, substitutions?)` from `apps/web/lib/api.ts`. KEY must exist in `apps/web/lib/endpoints/<domain>/index.ts`.
8. **350-line file cap** (hard). Split before exceeding.
9. **Roles are case-sensitive in BE, uppercased on web.** Exact strings: `SuperAdmin`, `Admin`, `Manager`, `Nurse`, `Carer`, `Resident`. Web middleware compares `role.toUpperCase()`.
10. **Verify before claiming.** Before saying "X exists", grep for it. Before changing a route, check controller decorator AND web `endpoints/<domain>/index.ts` AND the matching `lib/queries/<domain>/` hook.
11. **Match existing style.** Some endpoint keys are SCREAMING_SNAKE, some camelCase (audit). Some hooks end in `Mutation`, others `MutationQuery`. Don't standardize without an explicit ask.
12. **Risky actions need confirmation.** Migrations, deletes, force-pushes, dependency removals, CI/permission changes, anything visible to others — pause and confirm.
13. **Use Standard Tailwind Design Tokens & Readable Typography.** Avoid arbitrary inline CSS or hardcoded hex/pixel classes (e.g. `bg-[#F7F7F7]`, `w-[162.08px]`, `text-[9px]`). Always use standard Tailwind color palettes (`slate`, `emerald`, `amber`), fluid layout utilities (`flex-1`, `w-full`, `rounded-xl`, `gap-3`), and accessible text scales (`text-xs`, `text-sm`, `text-base`).
14. **Centralized Mobile UI Components.** In `apps/mobile`, all UI primitives (`Button`, `Input`, `Text`, `Card`, `Badge`, `Avatar`, `ScreenWrapper`) MUST be imported from `src/presentation/components/common` (barrel exported via `src/presentation/components/common/index.ts`). Never write ad-hoc styled buttons, custom text inputs, or raw screen scroll wrappers inside screen routes or view components.
15. **Always upload files to cloud object storage (AWS S3) — NEVER to local disk.** All file, image, and document uploads (profile photos, admission attachments, medical records, compliance docs, POA/court orders) MUST be saved directly to AWS S3 via storage service (`@aws-sdk/client-s3`). Never create or write to local `uploads/` directories or local disk storage. Files must be served back via authenticated backend streaming routes (e.g. `/api/documents/stream?path=...` or `/api/residents/:id/photo`).
16. **Web Form Layout & Typography Standards.**
    - Multi-column form grids MUST use `gap-x-4 gap-y-1` (or `gap-y-1.5`) rather than `gap-4` or `gap-y-4` to account for `@repo/ui` `Input`'s reserved error slot (`min-h-[18px] mt-1`).
    - Field groups must use compact vertical rhythm (`space-y-1` or `space-y-1.5`).
    - Form labels must use legible typography: `text-md font-bold text-slate-800` (or `text-md font-medium text-slate-700`).
    - Page primary form action/submit buttons must use `size="lg"`.
    - Avoid nesting full-page forms in redundant `@repo/ui` `Card` wrappers with double padding; use standard surface containers (`bg-white rounded-2xl p-6 sm:p-10 shadow-xl border border-slate-100/80`).

---

## DO NOT INVENT — these don't exist

- Local file storage / `uploads/` disk folders. All file storage is AWS S3.
- GraphQL endpoints. Backend is REST only.
- `/api/users` CRUD. Users are managed via `/api/staff` (tenant) or `/api/super-admin/tenants` (platform).
- A `Permission` model. Permissions are JSON on `Role.permissions`.
- WebSocket / SSE channels.
- A separate `MfaModule`. MFA endpoints are on `auth.controller.ts`.
- A `useAuth()` hook outside `apps/web/lib/context/AuthContext.tsx`.
- Server Actions / RSC mutations. The web app is client components + TanStack Query.
- A central `errors.ts`. BE throws `HttpException` subclasses; FE catches `makeAPICall` rejections.

---

## HARDCODED FACTS (memorize these — do not paraphrase)

| Fact | Value |
|---|---|
| Backend port | **4400** (NOT 3001 as the older README said). Global prefix `/api`. |
| Web port | 3000 |
| Swagger UI | `http://localhost:4400/api` |
| Default platform admin | `admin@platform.com` / `Password123!` |
| Backend dev | `pnpm dev --filter backend` |
| Web dev | `pnpm dev --filter web` |
| All dev | `pnpm dev` |
| Type-check | `pnpm check-types` |
| Prisma | `pnpm db:generate`, `pnpm db:push`, `pnpm db:seed` |

### JWT payload (mirror exactly in `AuthenticatedUser` and `AuthContext`)
```ts
{
  sub: string; email: string; fullName: string; roleName: string;
  tenantId: string; mfaVerified: boolean;
  permissions: RolePermissions;   // see Permission modules below
}
```

### Permission modules (resolved on `req.user.permissions`)
- `dashboard | residents | staff | facilities | payments | settings`: each has `read`, `write`, `delete`.
- `riskAssessments`: `read`, `write`, `delete`, `approve`, `manageTemplates`.
- New endpoints touching risk MUST use `@UseGuards(JwtAuthGuard, PermissionsGuard)` with `@Permissions('riskAssessments.<action>')`. Existing modules continue with `@Roles(...)` until migrated.

### Frozen enums (do not invent values)
- `Resident.status`: `Active | Discharged | Deceased | Hospitalized | Transferred`
- `Bed.status`: `Available | Occupied | Maintenance`
- `Tenant.status`: `Pending | Active | Suspended | Inactive`
- `Shift.status`: `Draft | Published`
- `ShiftRequest.type`: `Leave | Change | Cover`
- `ShiftRequest.status` / `DailyTask.status` (subset): `Pending | Approved | Rejected` / `Pending | Completed | Skipped`
- `MedAdministration.status`: `Given | Refused | Omitted | NPO`
- `Observation.consciousness` (ACVPU): `Alert | Confusion | V | P | U`
- `CarePlanTask.frequency`: `Daily | Weekly | Twice Daily | Custom`

### Encrypted fields (handled transparently by `prisma`, NOT by `rawPrisma`)
- `Resident.nhsNumber`, `UserProfile.phoneNumber`, `UserProfile.addressLine1`.

---

## CURRENT STATE — KNOWN GAPS (do not claim "clean")

These are real today. Don't pretend the codebase is already strict.

- BE `tsconfig` is **not** in `strict: true` mode (only `strictNullChecks`). Refactor.md Phase 1 will flip it.
- BE ESLint has `@typescript-eslint/no-explicit-any: "off"`. Web disables several lint rules. Refactor.md Phase 2.
- ~45 `as any` casts remain in BE (audit JSON writes). Phase 3.
- 6 `catch (error: any)` instances. Phase 7.
- 7 `console.log` calls in BE (incl. RolesGuard logging full user). Phase 8.
- `auth.controller.changePassword` and `verifyMfaReset` use untyped `@Body()`. Phase 6.
- `apps/backend/src/auth/auth.service.ts:17` has `getMfaResetRequest = (db: any) => db.mfaResetRequest`. Phase 5.
- `facility.service.ts` is 584 lines (over 350 cap). `AppSidebar.tsx` is 417. Phase 12.
- FE-side types in `apps/web/lib/types/*.ts` duplicate BE shapes. Phase 9 will move them to `@repo/schema/src/responses/`.
- `makeAPICall(apiName: string, ...)` is currently **untyped** — typos compile. Phase 10 narrows the key type.
- **MFA enforcement is OFF in `apps/web/middleware.ts`** (lines 35-40, 59-66 commented). MFA endpoints work but middleware does not gate. Treat MFA as opt-in.
- `apps/backend/src/common/encryption.ts` duplicates `packages/db/src/crypto.ts`. Phase 12c.

When fixing any of these, follow the recipe in `Refactor.md`. Don't invent your own approach.

---

## CANONICAL FILE LOCATIONS

| Need | File |
|---|---|
| Add a Zod schema/DTO | `packages/schema/src/<domain>.ts` (then export from `index.ts`) |
| Add a Prisma model | `packages/db/prisma/schema.prisma` (then `pnpm db:generate && pnpm db:push`) |
| Add an API endpoint | `apps/backend/src/<module>/<domain>.controller.ts` |
| Add server logic | `apps/backend/src/<module>/<domain>.service.ts` |
| Wire up a guard | `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles('Admin', ...)` |
| Validate body | `@Body(new ZodValidationPipe(<schema>))` from `apps/backend/src/common/pipes/zod.pipe.ts` |
| Add a frontend endpoint key | `apps/web/lib/endpoints/<domain>/index.ts` |
| Add a frontend hook | `apps/web/lib/queries/<domain>/<useXxx>.ts` |
| Add a route page | `apps/web/app/(protected)/<role>/<path>/page.tsx` |
| Use a UI primitive | `import { ... } from '@repo/ui/components/<name>'` |
| Use `cn()` | `import { cn } from '@repo/ui/lib/utils'` |

---

## TASK RECIPE — add a new tenant-scoped entity

1. `packages/schema/src/<entity>.ts` → Zod schemas + `XxxDTO` exports + barrel.
2. `packages/db/prisma/schema.prisma` → model with `tenantId`, FKs, audit fields. Run `pnpm db:generate && pnpm db:push`.
3. `apps/backend/src/<entity>/`: `<entity>.module.ts` (register in `app.module.ts`), `<entity>.controller.ts` (guards + roles + Zod pipe + explicit return types), `<entity>.service.ts` (filter by `tenantId`, emit audit via `AuditService`).
4. `apps/web/lib/endpoints/<plural>/index.ts` → KEY constants.
5. `apps/web/lib/queries/<entity>/` → `useGetXxxQuery`, `useCreateXxxMutation`, etc.
6. `apps/web/app/(protected)/<role>/<entity>/page.tsx` → page using hooks + `@repo/ui`.
7. Update `apps/web/lib/components/AppSidebar.tsx` if a nav entry is needed.

---

## ESCALATION

If a requirement contradicts the rules above (e.g., "store JWT in localStorage", "add a new ORM", "use `any` because Prisma typing is awkward"), STOP and ask the user before proceeding. Do not silently work around constraints.

For deeper detail (full endpoint/route/model/hook tables), open [`PROJECT.md`](./PROJECT.md) — load only the section you need.
