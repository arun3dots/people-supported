# Staging Pilot Readiness & Synthetic User Test Plan

> **Important:** User provisioning is **strictly explicit**. Never implement or trigger automatic email-to-`cognitoSub` linking.

---

## 1. Synthetic Pilot User Setup (`eu-north-1`) & Explicit DB Binding

Create **four synthetic test identities** in the `eu-north-1` staging User Pool (do **not** use production staff accounts):

| Synthetic Account | Portal | Intended DB State | Purpose |
|---|---|---|---|
| `pilot-admin@cantracare.invalid` | `https://demo.cantracare.com` | Active tenant, Admin role, active branch, `emailVerified=true`, `isActive=true` | Web Admin TOTP MFA login, refresh rotation, branch switch, logout |
| `pilot-carer@cantracare.invalid` | `https://demo.cantracare.com` | Active tenant, Carer role, active branch | Web RBAC boundary & SuperAdmin denial |
| `pilot-superadmin@cantracare.invalid` | `https://admin-demo.cantracare.com` | `tenantId IS NULL`, active `SuperAdmin` role | Dedicated SuperAdmin client login, MFA assurance, cross-portal rejection |
| `pilot-disabled@cantracare.invalid` | Negative test | `isActive=false` (or suspended tenant) | Disabled identity denial (`reason=account_disabled`) |

1. Create each user via Admin-only Cognito creation (`COGNITO_DEFAULT` or verified `eu-north-1` SES sender) with TOTP MFA required on first Managed Login sign-in.
2. Read each user's Cognito `sub` UUID (`aws cognito-idp admin-get-user`).
3. Explicitly bind `cognitoSub` **by local `User.id`** in staging Postgres:
   ```sql
   UPDATE "User" SET "cognitoSub" = '<COGNITO_SUB_UUID>' WHERE id = '<LOCAL_USER_UUID>' AND "deletedAt" IS NULL;
   ```
4. Add only approved pilot `User.id` UUIDs to `COGNITO_PILOT_USER_IDS`.

---

## 2. Requires Real AWS Cognito Verification (Cannot Be Proven Locally)

Local mock-OIDC tests verify enforcement against fixture tokens; the following **must** be observed directly against the live `eu-north-1` Cognito staging pool before cutover:

- **Exact `amr` / `acr` token claims emitted by Cognito Managed Login:** Confirm `id_token` / `access_token` include `amr` (e.g. `["pwd", "otp", "mfa"]` or `["pwd", "swk", "mfa"]`) and/or qualifying `acr` (`urn:cognito:loa:3`) across **initial TOTP MFA login**, **refresh token rotation** (`refresh_token` grant), and **silent SSO reauthentication**. If Cognito omits `amr` unless `acr_values` is requested, configure `COGNITO_REQUIRED_ACR_VALUES=urn:cognito:loa:3` (or update allowlisted Cognito ACR values) and re-run `verify:cognito:staging-config`.
- **Custom domain ACM cert (`us-east-1`) & live OIDC endpoints:** Run `pnpm verify:cognito:staging-config -- --strict --check-oidc ...` on the staging environment to verify `https://cognito-idp.eu-north-1.amazonaws.com/<pool>/.well-known/openid-configuration` and `jwks.json`, plus `https://auth-demo.cantracare.com` Managed Login redirect/logout handling.
- **SES `eu-north-1` deliverability & Nginx headers:** Confirm password-reset/MFA emails deliver outside SES sandbox and staging Nginx allows `auth-demo.cantracare.com` cleanly under CSP/rate-limit rules.

---

## 3. Staging Smoke Checklist

| # | Check | Expected Outcome |
|---|---|---|
| 1 | `verify:cognito:staging-config --strict --check-oidc` | Passes with `live_aws=VERIFIED`, matching RSA keypair, and zero secrets printed |
| 2 | Direct `api-demo` start (`GET https://api-demo.cantracare.com/api/auth/cognito/start`) | Rejected (`403`); login pages link only to `/api/auth/cognito/start` (`?app=superadmin` on admin) |
| 3 | Web happy path (`pilot-admin`) | Redirects to `auth-demo.cantracare.com`, completes TOTP MFA, sets host-only `HttpOnly; Secure; SameSite` cookies, clears `.cantracare.com`, lands on `/admin/dashboard` |
| 4 | Refresh rotation & logout | `POST /api/auth/refresh` rotates `slc1.` token; `POST /api/auth/logout` clears cookies and calls `auth-demo.cantracare.com/logout` |
| 5 | SuperAdmin client isolation | `pilot-superadmin` signs in via `COGNITO_SUPERADMIN_CLIENT_ID`; refreshing its token on `demo.cantracare.com` or replaying a Web token on `admin-demo.cantracare.com` returns `403` |
| 6 | Disabled, unlinked & non-pilot users | Denied (`account_disabled` or `failed`) with zero cookies and no auto-created DB bindings |
| 7 | Rollback drill | Setting `COGNITO_AUTH_ENABLED=false` disables `/api/auth/cognito/*` (`404`) and restores password login |
