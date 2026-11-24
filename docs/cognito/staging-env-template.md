# Staging Cognito Environment Template (Supported Living)

> Populate placeholders (`<...>`) in staging environment files or your secrets manager only. **Never commit secrets or private keys.**

---

## 1. Generate the App-Session RS256 Keypair

NestJS signs internal RS256 app-session tokens (`COGNITO_APP_PRIVATE_KEY_B64`), and Next.js Edge middleware verifies them with `COGNITO_APP_PUBLIC_KEY_B64`:

```bash
node -e "
const { generateKeyPairSync } = require('node:crypto');
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
console.log('COGNITO_APP_PRIVATE_KEY_B64=' + Buffer.from(privateKey.export({ format: 'pem', type: 'pkcs8' })).toString('base64'));
console.log('COGNITO_APP_PUBLIC_KEY_B64=' + Buffer.from(publicKey.export({ format: 'pem', type: 'spki' })).toString('base64'));
"
```

---

## 2. Backend (`apps/backend/.env`)

```dotenv
# Core runtime
NODE_ENV=production
PORT=4400
CORS_ORIGINS=https://demo.cantracare.com,https://admin-demo.cantracare.com
COOKIE_HOST_ONLY=true
LEGACY_COOKIE_DOMAIN=.cantracare.com

# Phase 1 Pilot: Cognito enabled alongside password fallback for non-pilot users
COGNITO_AUTH_ENABLED=true
LEGACY_AUTH_ENABLED=true
COGNITO_MFA_POLICY=required
COGNITO_REQUIRE_AMR_MFA=true
# Optional step-up ACR allowlist passed via authorize acr_values (e.g. urn:cognito:loa:3)
# COGNITO_REQUIRED_ACR_VALUES=urn:cognito:loa:3

# AWS Cognito Pool & Custom Domain (eu-north-1 Stockholm; configurable via COGNITO_REGION)
AWS_REGION=eu-north-1
COGNITO_REGION=eu-north-1
COGNITO_USER_POOL_ID=eu-north-1_<USER_POOL_SUFFIX>
COGNITO_MANAGED_LOGIN_URL=https://auth-demo.cantracare.com

# Confidential Web App Client (demo.cantracare.com)
COGNITO_CLIENT_ID=<WEB_APP_CLIENT_ID>
COGNITO_CLIENT_SECRET=<WEB_APP_CLIENT_SECRET>
COGNITO_CALLBACK_URL=https://demo.cantracare.com/api/auth/cognito/callback
COGNITO_SIGN_OUT_URL=https://demo.cantracare.com/login

# Dedicated Confidential SuperAdmin App Client (admin-demo.cantracare.com — must differ from Web)
COGNITO_SUPERADMIN_AUTH_ENABLED=true
COGNITO_SUPERADMIN_CLIENT_ID=<SUPERADMIN_APP_CLIENT_ID>
COGNITO_SUPERADMIN_CLIENT_SECRET=<SUPERADMIN_APP_CLIENT_SECRET>
COGNITO_SUPERADMIN_CALLBACK_URL=https://admin-demo.cantracare.com/api/auth/cognito/callback
COGNITO_SUPERADMIN_SIGN_OUT_URL=https://admin-demo.cantracare.com/login

# Comma-separated DB User.id UUIDs allowed into Cognito pilot
COGNITO_PILOT_USER_IDS=<PILOT_USER_UUID_1>,<PILOT_USER_UUID_2>,<PILOT_SUPERADMIN_UUID>

# Internal RS256 app-session key (must match COGNITO_APP_PUBLIC_KEY_B64)
COGNITO_APP_PRIVATE_KEY_B64=<BASE64_PKCS8_RSA2048_PRIVATE_KEY>

# Existing SES / KMS / Auth secrets (SES in eu-north-1 must match Cognito in-region policy)
MAIL_PROVIDER=ses
SES_FROM_EMAIL=<VERIFIED_EU_NORTH_1_SENDER_EMAIL>
# SES_CONFIGURATION_SET=<OPTIONAL_SES_CONFIG_SET>
JWT_SECRET=<STRONG_64_CHAR_HEX_SECRET>
ENCRYPTION_KEY=<EXISTING_64_CHAR_HEX_AES_KEY>
AUDIT_SIGNING_KEY=<EXISTING_64_CHAR_HEX_HMAC_KEY>
ENFORCE_MFA=true
```

---

## 3. Web Frontend (`apps/web/.env.production`)

```dotenv
NODE_ENV=production
NEXT_PUBLIC_API_URL=/api
INTERNAL_API_URL=http://127.0.0.1:4400/api

COGNITO_AUTH_ENABLED=true
LEGACY_AUTH_ENABLED=true
COGNITO_APP_PUBLIC_KEY_B64=<BASE64_SPKI_RSA2048_PUBLIC_KEY>
JWT_SECRET=<SAME_JWT_SECRET_AS_BACKEND>
```

---

## 4. SuperAdmin Frontend (`apps/superadmin/.env.production`)

```dotenv
NODE_ENV=production
NEXT_PUBLIC_API_URL=/api
INTERNAL_API_URL=http://127.0.0.1:4400/api

COGNITO_AUTH_ENABLED=true
COGNITO_SUPERADMIN_AUTH_ENABLED=true
COGNITO_SUPERADMIN_CALLBACK_URL=https://admin-demo.cantracare.com/api/auth/cognito/callback
LEGACY_AUTH_ENABLED=true
COGNITO_APP_PUBLIC_KEY_B64=<BASE64_SPKI_RSA2048_PUBLIC_KEY>
JWT_SECRET=<SAME_JWT_SECRET_AS_BACKEND>
```

---

## 5. Strict Validation, Cutover & Rollback

1. **Strict pre-flight validation (read-only, including live AWS OIDC/JWKS fetch):**
   ```bash
   pnpm verify:cognito:staging-config -- --strict --check-oidc --env-file=apps/backend/.env --web-env-file=apps/web/.env.production --superadmin-env-file=apps/superadmin/.env.production
   ```
2. **Phase 1 Pilot -> Phase 2 Cutover:** Start with `LEGACY_AUTH_ENABLED=true`; once staging test plan passes, set `LEGACY_AUTH_ENABLED=false` across backend/web/superadmin and redeploy.
3. **Instant Rollback:** Set `COGNITO_AUTH_ENABLED=false` and `LEGACY_AUTH_ENABLED=true`, restart PM2 (`backend`, `web`, `superadmin`). No database schema rollback is required.
