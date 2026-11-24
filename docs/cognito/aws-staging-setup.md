# AWS Cognito Staging Pilot Setup (Supported Living)

> **Scope:** Amazon Cognito Managed Login for **Supported Living** staging (`demo.cantracare.com` + `admin-demo.cantracare.com`). Use one isolated User Pool per environment; do **not** auto-link users by email and do **not** modify the separate Care Home application.

---

## 1. AWS Region & Environment Alignment

- **Default Staging Region:** `eu-north-1` (**Stockholm**), aligning with the existing EC2 backend, PostgreSQL database, KMS keys, S3 bucket (`cantra-files`), and SES infrastructure (`getCognitoRegion()` in [`aws-config.util.ts`](../../apps/backend/src/common/utils/aws-config.util.ts) also defaults to `eu-north-1`).
- **Configurability:** `COGNITO_REGION` remains configurable (e.g., `eu-west-2` if a future workload strictly mandates UK residency per [H-01-hosting-and-residency.md](../compliance/H-01-hosting-and-residency.md)). Backend startup and `verify:cognito:staging-config` enforce that `COGNITO_REGION` matches the `COGNITO_USER_POOL_ID` prefix (`eu-north-1_*`).
- **User Pool Topology & Tier:**
  - Provision **one dedicated staging User Pool** (separate from production).
  - Select the **Essentials** or **Plus** feature plan (**required** for Cognito Managed Login and **refresh token rotation**; Cognito Lite does not support refresh token rotation).

---

## 2. User Pool Security & Provisioning Policies

1. **Admin-Only User Creation:** Disable self-service sign-up (`AdminCreateUser` / Admin console only). Never link identities automatically by email; explicitly bind `User.cognitoSub` by `User.id` (see [staging-test-plan.md](./staging-test-plan.md)).
2. **Required TOTP MFA (`COGNITO_MFA_POLICY=required`):**
   - Set User Pool MFA to **Required** with **Authenticator app (TOTP)** enabled (optionally WebAuthn/passkeys; do **not** rely on SMS MFA — backend MFA assurance checks require `amr` multi-factor TOTP/WebAuthn evidence such as `["pwd", "otp", "mfa"]` or qualifying `acr` assurance such as `urn:cognito:loa:3`).
   - Backend defaults `COGNITO_REQUIRE_AMR_MFA=true` (fail closed) and always enforces explicit Cognito MFA assurance for **SuperAdmin**. Optionally set `COGNITO_REQUIRED_ACR_VALUES` (e.g. `urn:cognito:loa:3`) if your Managed Login client requests target ACR levels via `acr_values`.
3. **Custom Domain & ACM Certificate (`us-east-1`):**
   - Custom domain: `https://auth-demo.cantracare.com` (`COGNITO_MANAGED_LOGIN_URL`).
   - Cognito custom domains require an **ACM TLS certificate issued in `us-east-1` (N. Virginia)** for `auth-demo.cantracare.com`, plus its DNS CNAME/ALIAS target configured in Route53/DNS, even though the User Pool resides in `eu-north-1`.
4. **SES Email Integration (`eu-north-1`):**
   - Cognito User Pools in `eu-north-1` support **In-Region Amazon SES only** (`eu-north-1`).
   - Point Cognito email delivery to a verified **`eu-north-1` SES domain/sender identity** matching your application email policy (`SES_FROM_EMAIL`, optional `SES_CONFIGURATION_SET` in `eu-north-1`), and ensure the `eu-north-1` SES account is out of sandbox (or pilot recipient addresses are verified) before testing.

---

## 3. Confidential App Clients

Create **separate confidential App Clients** with **client secrets**, **Authorization code grant**, **PKCE (`S256`)**, **`openid` scope only**, **refresh token rotation enabled**, and **prevent user existence errors enabled**:

| App Client | Client ID Env Var | Secret Env Var | Exact Callback URL | Exact Sign-Out URL |
|---|---|---|---|---|
| Supported Living Web (`demo.cantracare.com`) | `COGNITO_CLIENT_ID` | `COGNITO_CLIENT_SECRET` | `https://demo.cantracare.com/api/auth/cognito/callback` | `https://demo.cantracare.com/login` |
| Supported Living SuperAdmin (`admin-demo.cantracare.com`) | `COGNITO_SUPERADMIN_CLIENT_ID` | `COGNITO_SUPERADMIN_CLIENT_SECRET` | `https://admin-demo.cantracare.com/api/auth/cognito/callback` | `https://admin-demo.cantracare.com/login` |
| Future Care Home Service *(reserved)* | Dedicated Care Home client ID | Dedicated secret | Care Home origin `/api/auth/cognito/callback` | Care Home origin `/login` |

> [!CAUTION]
> - Never register `https://api-demo.cantracare.com/api/auth/cognito/callback`. Host-only cookies set on `api-demo` cannot authenticate `demo` or `admin-demo`, and backend config/routing rejects `api-demo.*` hosts.
> - SuperAdmin requires its own distinct `COGNITO_SUPERADMIN_CLIENT_ID` and `COGNITO_SUPERADMIN_CLIENT_SECRET`; sharing Web client credentials fails backend startup and `verify:cognito:staging-config`.

---

## 4. Exact Staging Routes & Nginx Proxy Assumptions

Both `demo.cantracare.com` (`web` on `:3000`) and `admin-demo.cantracare.com` (`superadmin` on `:3001`) in [`ops/nginx/cantra-care.conf`](../../ops/nginx/cantra-care.conf) proxy `/api/` to `127.0.0.1:4400` with `Host $host` and `X-Forwarded-Proto $scheme`:

| Step | Web (`https://demo.cantracare.com`) | SuperAdmin (`https://admin-demo.cantracare.com`) |
|---|---|---|
| Login start | `GET /api/auth/cognito/start` | `GET /api/auth/cognito/start?app=superadmin` |
| OAuth callback | `GET /api/auth/cognito/callback` | `GET /api/auth/cognito/callback` |
| Session completion | `GET /login?cognito=complete` | `GET /login?cognito=complete` |
| Refresh / Logout | `POST /api/auth/refresh`, `POST /api/auth/logout` | `POST /api/auth/refresh`, `POST /api/auth/logout` |
| Middleware live verify | `POST $INTERNAL_API_URL/auth/me` | `POST $INTERNAL_API_URL/auth/me` |
| Provider sign-out | `https://auth-demo.cantracare.com/logout?...&logout_uri=https://demo.cantracare.com/login` | `https://auth-demo.cantracare.com/logout?...&logout_uri=https://admin-demo.cantracare.com/login` |

**Ops hardening recommendations (not modified in repo here):** Set `NEXT_PUBLIC_API_URL=/api`, `INTERNAL_API_URL=http://127.0.0.1:4400/api`, `COOKIE_HOST_ONLY=true`, `LEGACY_COOKIE_DOMAIN=.cantracare.com`; extend staging Nginx `auth_limit` and CSP (`form-action`, `connect-src`) for `https://auth-demo.cantracare.com`.
