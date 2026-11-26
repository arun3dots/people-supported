# Supported Living managed Cognito accounts

Provisioning and managed sign-in default off. Use the staff directory or user settings in Web and the tenant actions in SuperAdmin to manage accounts after configuration. These flows are for active tenants. Existing public tenant onboarding and existing legacy or manually linked accounts retain their current flows.

## Account and invitation workflow

1. Authorize against the actor's current local role and branch membership. Reserve the normalized email and client-generated request UUID in PostgreSQL. A retry with the same inputs returns the same reservation. A different account cannot acquire an existing email or request ID.
2. Deliver a Cantra Care verification link. Only the token hash and expiry are stored. The browser submits the token after the recipient confirms. A failed delivery remains visible and an authorized resend issues a fresh token.
3. After mailbox proof, create the Cognito account with suppressed delivery and an immutable `custom:cantra_provisioning_id` equal to the local user ID. Use `ForceAliasCreation=false`. A retry may recover only an account carrying the matching marker and the verified email in the configured pool. Store the provider's immutable `sub` and actual username. Treat any conflicting `sub`, email, or marker as an operator-visible conflict.
4. Request Cognito invitation delivery after the link is stored. An uncertain delivery requires an explicit resend because Cognito can issue a new temporary credential. An invite accepted by the provider does not establish delivery to the inbox. First sign-in uses the existing Managed Login and mandatory TOTP checks.
5. Disabling an account must revoke local sessions and block access even when the provider fails. Enabling should grant local access only after Cognito confirms enablement. Reset hands off to Cognito recovery and revokes existing local sessions. The app never generates a legacy password for a managed account.

## Configuration and IAM

- Keep `COGNITO_AUTH_ENABLED` and the existing Web and SuperAdmin app-client settings. `COGNITO_MANAGED_USERS_ENABLED` defaults to `false` and gates managed sign-ins separately from manually linked pilots.
- `COGNITO_PROVISIONING_ENABLED=true` enables provisioning and its management routes and switches new staff accounts to this workflow. Build both frontends with `NEXT_PUBLIC_COGNITO_PROVISIONING_ENABLED=true` in the same rollout. Use the existing `COGNITO_USER_POOL_ID` in `eu-north-1`. Set `COGNITO_PROVISIONING_USERNAME_MODE=email` for an email sign-in pool or `alias` for a pool that accepts usernames and has an email sign-in alias.
- In production the SDK uses the EC2 role. The backend requires `AWS_CONFIG_FILE=/dev/null` and `AWS_SHARED_CREDENTIALS_FILE=/dev/null`, instance metadata access, and absence of static AWS keys, profile settings, and alternate metadata endpoints. Prepare the scoped role and verify existing AWS dependencies before changing the service's credential source.
- Add the marker as an immutable custom attribute and exclude it from both app clients' writable attributes. Confirm the existing Cognito invitation template includes the username and temporary credential placeholders. Verify mail delivery and email-based recovery in the target environment with a dedicated pilot account. Keep self-registration disabled and TOTP required.
- Give the backend role only these actions on the specific user pool. The application must never send IAM credentials or confidential client configuration to either frontend.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cognito-idp:AdminCreateUser",
        "cognito-idp:AdminGetUser",
        "cognito-idp:AdminDisableUser",
        "cognito-idp:AdminEnableUser",
        "cognito-idp:AdminResetUserPassword"
      ],
      "Resource": "arn:aws:cognito-idp:eu-north-1:ACCOUNT_ID:userpool/USER_POOL_ID"
    }
  ]
}
```

## Deployment and rollback

1. Rehearse `prisma migrate deploy` on a disposable database. Take the normal deployment backup before applying the validated migration in an authorized environment. The migration leaves existing passwords in place and enforces a password hash only for legacy accounts.
2. Run the application with provisioning and managed sign-in disabled. Verify existing password login and both Cognito app clients. Verify platform and tenant authorization before using a real invitation.
3. Enable managed sign-in, then enable provisioning for an approved pilot environment. Create a test account and check verification, invitation, TOTP, reset, disablement, and local session revocation. Check that duplicate mailboxes never link to existing Cognito users.
4. Disable provisioning to close its creation and management routes. Separately disable managed sign-in if accounts must be blocked during rollback. Leave the migration and existing Cognito-only rows in place. A database or binary rollback that assumes all users have legacy passwords requires a separate recovery plan after any Cognito-only user is created.

## Test plan

Use `pnpm verify:cognito:backend` with the local OIDC fixture and disposable PostgreSQL. The tests exercise concurrent reservations and mailbox confirmation, duplicate email and subject handling, tenant and role scope, AWS and invitation failures, recovery, local rollback, first sign-in, and revocation. Run `managed-cognito-directory.spec.ts` for the offline SDK command and ownership checks. A manual smoke test in an authorized environment still needs to prove the target pool, role, SES delivery and Managed Login TOTP end to end.
