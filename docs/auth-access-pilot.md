# CantraCare Auth & Access pilot

Auth & Access is a standalone NestJS workspace in `apps/auth-access` with its own build, server, and PostgreSQL migrations. The Supported Living web console is at `/admin/settings/access`. It manages the selected tenant's central roles, detailed risk-assessment permissions, and existing memberships through the product backend's private HTTP connection to Auth & Access.

## Identity and session ownership

- Cognito Managed Login owns passwords, mandatory TOTP, and recovery. The Auth directory links accounts by Cognito issuer and `sub`. Supported Living continues resolving its existing local user and branch assignments.
- Supported Living owns its RS256 access tokens, revocable sessions, and rotating refresh credentials. Its Cognito refresh credential remains encrypted in the product session store. The central service receives only identity, tenant, and original authentication-time assertions from a trusted backend. No browser cookies or Cognito or product tokens cross that service boundary.
- A product service credential authenticates the source of those assertions. Configure a unique, random credential for each product and environment. Protect the endpoint with HTTPS and restrict private network ingress to the product backends. Compromise of a product credential permits assertions within that product's scope. Rotate it and investigate that product immediately.
- The enrolled backend checks current central membership on Cognito login, session authentication, branch switching, and refresh. Enrolled tenants require Cognito for protected requests. The risk controller enforces the five registered `riskAssessments.*` permissions alongside its existing tenant and branch checks. A central outage fails closed for enrolled Cognito sessions.
- Tenant administrators can change roles and memberships within their delegation. The operator controls which accounts may administer access. Each change and its audit event commit in a single transaction. Disable and re-enable retains the membership revocation cutoff. After access is restored, users can choose **Sign in again with MFA** if their browser still has an older Cognito sign-in session.

## Configuration

| Process         | Variable                                  | Value                                                                                                      |
| --------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Auth & Access   | `AUTH_ACCESS_DATABASE_URL`                | Dedicated PostgreSQL database using a restricted runtime role.                                             |
| Auth & Access   | `AUTH_ACCESS_SERVICE_TOKENS_JSON`         | JSON object mapping each product key to a unique base64url secret generated from at least 32 random bytes. |
| Auth & Access   | `AUTH_ACCESS_PORT`                        | Loopback listener, default `4410`. Route through a private TLS proxy for a deployed setup.                 |
| Product backend | `AUTH_ACCESS_URL`                         | Origin of that private proxy. In local development, loopback HTTP is supported.                            |
| Product backend | `AUTH_ACCESS_PRODUCT`                     | Defaults to `supported-living`.                                                                            |
| Product backend | `AUTH_ACCESS_SERVICE_TOKEN`               | Secret corresponding to that product's key in the Auth & Access service.                                   |
| Product backend | `AUTH_ACCESS_TENANT_IDS`                  | Comma-separated tenant UUIDs for the pilot. Empty disables the integration.                                |
| Web             | `NEXT_PUBLIC_AUTH_ACCESS_CONSOLE_ENABLED` | Set to `true` at build time to expose the console link and page.                                           |

Run the Auth & Access process with its own environment. Keep database URLs and service secrets in deployment secret storage. Use a KMS-encrypted database and backups for the Auth database wherever it is hosted on AWS. The Auth database stores identity references and optional display names. Existing product KMS and audit signing keys are independent of this database.

## Prepare a pilot

1. Pick an isolated tenant whose participants can already use Cognito. Verify each participant's issuer and `sub` against their existing product identity. Start with at least one local web Admin as the central access administrator.
2. Provision a separate database and confirm its name and target before applying the Auth schema. Use a migration owner for migration deployment and a distinct runtime role for the process. Restrict the runtime role to the tables and operations it needs, including append-only audit access.

   ```powershell
   pnpm.cmd --filter auth-access db:migrate:deploy
   pnpm.cmd --filter auth-access... build
   ```

3. Run the enrollment command using a protected JSON file. Supply the product key, exact Cognito issuer, tenant UUID, all five catalog permission keys, role definitions, and verified users with their role keys. Use `canManage: true` only for the initial authorized administrators. Keep this file outside source control. The script refuses to overwrite an enrolled tenant.

   ```powershell
   pnpm.cmd --filter auth-access run bootstrap D:/private/access-enrollment.json
   pnpm.cmd --filter auth-access start
   ```

   The enrollment file uses `{ product, issuer, tenantId, permissions, roles, users }`. Each role uses `{ key, name, permissions }`. Each user uses `{ subject, roleKey, canManage?, name? }`. For Supported Living use the permission catalog in `packages/schema/src/auth-access.ts`. Give the administrator role all pilot permissions it needs to delegate.

4. Configure the product backend connection. Set the tenant allowlist only after verifying the membership records. Then enable the console on the web build. Confirm an administrator can remove a permission and that the next protected request with the same access cookie is denied. Test refresh, membership suspension, and another tenant before expanding enrollment.

## Verify locally

```powershell
pnpm.cmd verify:auth-access
```

The runner builds the standalone app, applies its checked-in migrations to a dedicated database in an isolated loopback PostgreSQL cluster, and launches it as a separate process. The product backend connects to it over HTTP using the mock Cognito fixture. The runner clears inherited database, Auth, and AWS configuration.

## Create staff with Cognito access

For a fresh Supported Living staging setup, configure the product backend's `COGNITO_USER_POOL_ID=eu-north-1_z22y1N1nO` and `COGNITO_REGION=eu-north-1` for the existing `cantra-sl-staging-users` pool. Enable `COGNITO_AUTH_ENABLED`, `COGNITO_MANAGED_USERS_ENABLED`, and `COGNITO_PROVISIONING_ENABLED` on that backend. Build Web with `NEXT_PUBLIC_COGNITO_PROVISIONING_ENABLED=true`, and enroll the tenant through `AUTH_ACCESS_TENANT_IDS`. The existing [managed provisioning guide](cognito-managed-provisioning.md) covers the Cognito IAM role, username mode, immutable provisioning attribute, email template, and mandatory TOTP.

Register the environment's exact Cognito issuer in Auth & Access. Enroll the initial tenant administrator by verified Cognito subject and grant `canManage` to that administrator. Create the central staff roles using the keys `manager`, `nurse`, and `carer` for the Supported Living roles you intend to provision. Their permissions must be within the administrator's delegated permissions. Staff memberships start without permission to administer Auth & Access.

1. Open Supported Living **Staff → Add Staff**. Submit the managed account form with the staff member's work email, role, and branch. This creates the pending local staff record and an `AccessStaffEnrollment` in the dedicated Auth database, then sends a verification link.
2. Open the link and confirm the email address. The Supported Living provisioner creates or recovers the matching account in the configured Cognito pool. Auth & Access links the returned `sub` and creates its product membership before Supported Living activates the local staff account and sends the Cognito Managed Login invitation.
3. Check **Amazon Cognito → User pools → cantra-sl-staging-users → Users** for the account. In Auth & Access, check the tenant's **Application memberships** for the staff member and their role. The `AccessUser.subject` is the Cognito `sub`. The enrollment stores the corresponding Supported Living user ID.
4. If verification mail fails, use **Resend**. If the Cognito account was created but the Auth database link failed, use **Retry** in Managed staff accounts after resolving the problem. The retry uses the same local ID and Cognito provisioning marker. The application issues the invitation only after the Auth membership and local link are in place.

The Auth database migration adds the enrollment table and uses the existing `AccessUser` and `AccessMembership` tables for successful links. Deploy it using the standalone app's migration command in the pilot setup. The AWS SDK calls run in the Supported Living backend using its scoped AWS role. Auth & Access receives the verified identity over its private service API.

## Roll back

Treat removing an enrolled tenant from the allowlist as an authorization cutover. Reconcile central removals and suspensions with product-local policy, revoke affected sessions, and verify denials before restoring local enforcement. If the Auth service is unavailable and reconciliation is impossible, keep the pilot closed until the service can be restored. The console flag can be turned off independently. Retain the dedicated database and its audit history.

## Pilot boundary

Auth & Access enrollment is connected to the Supported Living Web managed staff flow for enrolled tenants. Tenant creation stays in the product backend. Additional products, mobile integration, and centralizing Cognito invitation delivery remain follow-on work. Product actions outside the registered risk-assessment routes continue under their current role and resource checks.
