const { createPrivateKey, createPublicKey } = require("node:crypto");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");

const UUID_RE = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const POOL_RE = /^[a-z]{2}(?:-[a-z0-9]+)+-\d_[a-zA-Z0-9]+$/;
const CLIENT_ID_RE = /^[a-zA-Z0-9_-]{1,128}$/;

function parseEnvFile(filePath) {
  const out = {};
  for (const line of readFileSync(resolve(filePath), "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function parseArgs(argv) {
  const args = { checkOidc: false, strict: false };
  for (const arg of argv) {
    if (arg === "--") continue;
    if (arg === "--check-oidc") args.checkOidc = true;
    else if (arg === "--strict") args.strict = true;
    else if (arg.startsWith("--env-file=")) args.envFile = arg.slice(11);
    else if (arg.startsWith("--web-env-file=")) args.webEnvFile = arg.slice(15);
    else if (arg.startsWith("--superadmin-env-file=")) args.superadminEnvFile = arg.slice(22);
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function parseEndpoint(raw, label, expectedPath, allowLocal) {
  if (!raw) throw new Error(`Missing required setting: ${label}`);
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`Invalid URL for ${label}`);
  }
  const host = url.hostname.toLowerCase();
  const isLocal =
    allowLocal &&
    url.protocol === "http:" &&
    (["localhost", "127.0.0.1", "[::1]"].includes(host) ||
      host.endsWith(".cantracare.test") ||
      host.endsWith(".localhost"));
  if (
    (url.protocol !== "https:" && !isLocal) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== expectedPath
  ) {
    throw new Error(`Invalid endpoint protocol, credentials, or path for ${label}`);
  }
  if (!allowLocal && /^api[.-]/i.test(host)) {
    throw new Error(`${label} must not target separate API host (${host})`);
  }
  return url;
}

function checkPublicKey(label, b64, backendPubPem, errors) {
  try {
    const spkiPem = Buffer.from(b64, "base64").toString("utf8");
    const pub = createPublicKey(spkiPem);
    if (pub.asymmetricKeyType !== "rsa" || (pub.asymmetricKeyDetails?.modulusLength ?? 0) < 2048) {
      errors.push(`${label}: COGNITO_APP_PUBLIC_KEY_B64 must be RSA >= 2048 bits`);
      return false;
    }
    if (backendPubPem && pub.export({ type: "spki", format: "pem" }).toString() !== backendPubPem) {
      errors.push(`${label}: COGNITO_APP_PUBLIC_KEY_B64 does not match backend private key`);
      return false;
    }
    return true;
  } catch {
    errors.push(`${label}: invalid COGNITO_APP_PUBLIC_KEY_B64 SPKI encoding`);
    return false;
  }
}

function validateFrontendEnv(label, env, backendEnv, errors, warnings, backendPubPem, strict) {
  if (!env) return false;
  if (env.COGNITO_AUTH_ENABLED !== "true") errors.push(`${label}: COGNITO_AUTH_ENABLED must be 'true'`);
  if (env.NEXT_PUBLIC_API_URL !== "/api") errors.push(`${label}: NEXT_PUBLIC_API_URL must be '/api'`);
  if (!env.INTERNAL_API_URL || !/^https?:\/\/.+\/api\/?$/i.test(env.INTERNAL_API_URL)) {
    errors.push(`${label}: INTERNAL_API_URL must end with /api`);
  }
  if (label === "superadmin" && env.COGNITO_SUPERADMIN_AUTH_ENABLED !== "true") {
    errors.push("superadmin: COGNITO_SUPERADMIN_AUTH_ENABLED must be 'true'");
  }
  if (label === "superadmin" && backendEnv.COGNITO_SUPERADMIN_CALLBACK_URL && env.COGNITO_SUPERADMIN_CALLBACK_URL !== backendEnv.COGNITO_SUPERADMIN_CALLBACK_URL) {
    errors.push("superadmin: COGNITO_SUPERADMIN_CALLBACK_URL must match backend");
  }
  let matchedKey = false;
  if (!env.COGNITO_APP_PUBLIC_KEY_B64) {
    errors.push(`${label}: missing COGNITO_APP_PUBLIC_KEY_B64`);
  } else {
    matchedKey = checkPublicKey(label, env.COGNITO_APP_PUBLIC_KEY_B64, backendPubPem, errors);
  }
  const legacyActive = env.LEGACY_AUTH_ENABLED !== "false" || backendEnv.LEGACY_AUTH_ENABLED !== "false";
  if (legacyActive) {
    if (!env.JWT_SECRET || env.JWT_SECRET.length < 32) {
      (strict ? errors : warnings).push(`${label}: JWT_SECRET must be >= 32 chars when legacy auth is enabled`);
    } else if (backendEnv.JWT_SECRET && env.JWT_SECRET !== backendEnv.JWT_SECRET) {
      errors.push(`${label}: JWT_SECRET does not match backend JWT_SECRET`);
    }
  }
  return matchedKey;
}

async function checkOidc(issuer, errors) {
  const res = await fetch(`${issuer.replace(/\/+$/, "")}/.well-known/openid-configuration`, {
    redirect: "error",
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`OIDC discovery HTTP ${res.status}`);
  const disc = await res.json();
  if (disc.issuer !== issuer) errors.push(`OIDC discovery issuer mismatch (${disc.issuer})`);
  const jwksUri = typeof disc.jwks_uri === "string" ? disc.jwks_uri : `${issuer}/.well-known/jwks.json`;
  const jwksRes = await fetch(jwksUri, { redirect: "error", signal: AbortSignal.timeout(5000) });
  if (!jwksRes.ok) throw new Error(`OIDC JWKS HTTP ${jwksRes.status}`);
  const jwks = await jwksRes.json();
  const keys = Array.isArray(jwks.keys) ? jwks.keys : [];
  if (keys.length === 0) errors.push("OIDC JWKS returned no signing keys");
  for (const jwk of keys) {
    const key = createPublicKey({ format: "jwk", key: jwk });
    if (key.asymmetricKeyType !== "rsa" || (key.asymmetricKeyDetails?.modulusLength ?? 0) < 2048) {
      errors.push("OIDC JWKS key must be RSA >= 2048 bits");
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const backendEnv = args.envFile ? parseEnvFile(args.envFile) : { ...process.env };
  const webEnv = args.webEnvFile ? parseEnvFile(args.webEnvFile) : null;
  const adminEnv = args.superadminEnvFile ? parseEnvFile(args.superadminEnvFile) : null;

  if (backendEnv.COGNITO_AUTH_ENABLED !== "true" && !args.strict && !args.envFile) {
    console.log("COGNITO_STAGE_CONFIG_OK (mode=disabled-safe, live_aws=NOT VERIFIED; pass --strict or --env-file to validate active staging config)");
    return;
  }

  const errors = [];
  const warnings = [];
  const allowLocal = backendEnv.NODE_ENV !== "production" && Boolean(backendEnv.COGNITO_TEST_ISSUER);

  if (backendEnv.COGNITO_AUTH_ENABLED !== "true") errors.push("COGNITO_AUTH_ENABLED must be 'true'");
  if (backendEnv.COGNITO_MFA_POLICY !== "required") errors.push("COGNITO_MFA_POLICY must be 'required'");
  if (args.strict && backendEnv.COGNITO_REQUIRE_AMR_MFA === "false") {
    errors.push("COGNITO_REQUIRE_AMR_MFA must not be 'false' in --strict mode");
  }
  if (backendEnv.COGNITO_REQUIRED_ACR_VALUES !== undefined) {
    const acrs = backendEnv.COGNITO_REQUIRED_ACR_VALUES.split(",").map((s) => s.trim()).filter(Boolean);
    if (acrs.length === 0 || acrs.some((v) => /\s/.test(v))) {
      errors.push("COGNITO_REQUIRED_ACR_VALUES must be a non-empty comma-separated list without whitespace");
    }
  }
  if (args.strict ? backendEnv.COOKIE_HOST_ONLY !== "true" : backendEnv.COOKIE_HOST_ONLY === "false") {
    errors.push("COOKIE_HOST_ONLY must be 'true' for host-only staging cookies");
  }
  if (backendEnv.LEGACY_AUTH_ENABLED !== undefined && !["true", "false"].includes(backendEnv.LEGACY_AUTH_ENABLED)) {
    errors.push("LEGACY_AUTH_ENABLED must be 'true' or 'false' when set");
  }

  if (!backendEnv.COGNITO_USER_POOL_ID || !POOL_RE.test(backendEnv.COGNITO_USER_POOL_ID)) {
    errors.push("COGNITO_USER_POOL_ID is missing or malformed");
  }
  const poolRegion = backendEnv.COGNITO_USER_POOL_ID?.split("_")[0];
  if (!backendEnv.COGNITO_REGION) {
    (args.strict ? errors : warnings).push("COGNITO_REGION must be set explicitly (default staging region is eu-north-1)");
  } else if (poolRegion && backendEnv.COGNITO_REGION !== poolRegion) {
    errors.push("COGNITO_REGION must match COGNITO_USER_POOL_ID prefix");
  }
  if (backendEnv.AWS_REGION && backendEnv.COGNITO_REGION && backendEnv.AWS_REGION !== backendEnv.COGNITO_REGION) {
    warnings.push(`AWS_REGION (${backendEnv.AWS_REGION}) differs from COGNITO_REGION (${backendEnv.COGNITO_REGION})`);
  }

  const expectedAwsIssuer = poolRegion && backendEnv.COGNITO_USER_POOL_ID
    ? `https://cognito-idp.${poolRegion}.amazonaws.com/${backendEnv.COGNITO_USER_POOL_ID}`
    : null;
  if (backendEnv.COGNITO_ISSUER && expectedAwsIssuer && backendEnv.COGNITO_ISSUER !== expectedAwsIssuer) {
    errors.push("COGNITO_ISSUER must match AWS User Pool issuer URL");
  }

  let managed;
  let webCb;
  let webOut;
  try { managed = parseEndpoint(backendEnv.COGNITO_MANAGED_LOGIN_URL, "COGNITO_MANAGED_LOGIN_URL", "/", allowLocal); } catch (e) { errors.push(e.message); }
  try { webCb = parseEndpoint(backendEnv.COGNITO_CALLBACK_URL, "COGNITO_CALLBACK_URL", "/api/auth/cognito/callback", allowLocal); } catch (e) { errors.push(e.message); }
  try { webOut = parseEndpoint(backendEnv.COGNITO_SIGN_OUT_URL, "COGNITO_SIGN_OUT_URL", "/login", allowLocal); } catch (e) { errors.push(e.message); }
  if (webCb && webOut && webCb.origin !== webOut.origin) {
    errors.push("COGNITO_CALLBACK_URL and COGNITO_SIGN_OUT_URL must share exact web origin");
  }

  if (!backendEnv.COGNITO_CLIENT_ID || !CLIENT_ID_RE.test(backendEnv.COGNITO_CLIENT_ID)) {
    errors.push("COGNITO_CLIENT_ID is missing or malformed");
  }
  if (!backendEnv.COGNITO_CLIENT_SECRET || backendEnv.COGNITO_CLIENT_SECRET.length < 16) {
    errors.push("COGNITO_CLIENT_SECRET is missing or too short");
  }

  const hasSuperAdmin = Boolean(
    adminEnv ||
      backendEnv.COGNITO_SUPERADMIN_AUTH_ENABLED === "true" ||
      backendEnv.COGNITO_SUPERADMIN_CALLBACK_URL ||
      backendEnv.COGNITO_SUPERADMIN_SIGN_OUT_URL ||
      backendEnv.COGNITO_SUPERADMIN_CLIENT_ID ||
      backendEnv.COGNITO_SUPERADMIN_CLIENT_SECRET,
  );
  let adminCb;
  let adminOut;
  if (hasSuperAdmin) {
    try { adminCb = parseEndpoint(backendEnv.COGNITO_SUPERADMIN_CALLBACK_URL, "COGNITO_SUPERADMIN_CALLBACK_URL", "/api/auth/cognito/callback", allowLocal); } catch (e) { errors.push(e.message); }
    try { adminOut = parseEndpoint(backendEnv.COGNITO_SUPERADMIN_SIGN_OUT_URL, "COGNITO_SUPERADMIN_SIGN_OUT_URL", "/login", allowLocal); } catch (e) { errors.push(e.message); }
    if (adminCb && adminOut && adminCb.origin !== adminOut.origin) {
      errors.push("COGNITO_SUPERADMIN_CALLBACK_URL and COGNITO_SUPERADMIN_SIGN_OUT_URL must share exact superadmin origin");
    }
    if (adminOut && webOut && adminOut.origin === webOut.origin) {
      errors.push("SuperAdmin and Web origins must be distinct");
    }
    if (!backendEnv.COGNITO_SUPERADMIN_CLIENT_ID || !CLIENT_ID_RE.test(backendEnv.COGNITO_SUPERADMIN_CLIENT_ID)) {
      errors.push("COGNITO_SUPERADMIN_CLIENT_ID is missing or malformed");
    } else if (backendEnv.COGNITO_SUPERADMIN_CLIENT_ID === backendEnv.COGNITO_CLIENT_ID) {
      errors.push("COGNITO_SUPERADMIN_CLIENT_ID must differ from COGNITO_CLIENT_ID");
    }
    if (!backendEnv.COGNITO_SUPERADMIN_CLIENT_SECRET || backendEnv.COGNITO_SUPERADMIN_CLIENT_SECRET.length < 16) {
      errors.push("COGNITO_SUPERADMIN_CLIENT_SECRET is missing or too short");
    } else if (backendEnv.COGNITO_SUPERADMIN_CLIENT_SECRET === backendEnv.COGNITO_CLIENT_SECRET) {
      errors.push("COGNITO_SUPERADMIN_CLIENT_SECRET must differ from COGNITO_CLIENT_SECRET");
    }
  }

  if (backendEnv.COGNITO_ALLOWED_SIGN_OUT_URLS) {
    const allowedSignOuts = new Set();
    for (const rawUrl of backendEnv.COGNITO_ALLOWED_SIGN_OUT_URLS.split(",").map((s) => s.trim()).filter(Boolean)) {
      try { allowedSignOuts.add(parseEndpoint(rawUrl, "COGNITO_ALLOWED_SIGN_OUT_URLS", "/login", allowLocal).href); } catch (e) { errors.push(e.message); }
    }
    if (webOut && !allowedSignOuts.has(webOut.href)) errors.push("COGNITO_ALLOWED_SIGN_OUT_URLS must include COGNITO_SIGN_OUT_URL");
    if (adminOut && !allowedSignOuts.has(adminOut.href)) errors.push("COGNITO_ALLOWED_SIGN_OUT_URLS must include COGNITO_SUPERADMIN_SIGN_OUT_URL");
  }

  const pilotIds = (backendEnv.COGNITO_PILOT_USER_IDS || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (pilotIds.length === 0 || pilotIds.some((id) => !UUID_RE.test(id))) {
    errors.push("COGNITO_PILOT_USER_IDS must contain one or more valid UUIDs");
  }

  let backendPubPem = null;
  if (!backendEnv.COGNITO_APP_PRIVATE_KEY_B64) {
    errors.push("Missing COGNITO_APP_PRIVATE_KEY_B64");
  } else {
    try {
      const priv = createPrivateKey(Buffer.from(backendEnv.COGNITO_APP_PRIVATE_KEY_B64, "base64"));
      if (priv.asymmetricKeyType !== "rsa" || (priv.asymmetricKeyDetails?.modulusLength ?? 0) < 2048) {
        errors.push("COGNITO_APP_PRIVATE_KEY_B64 must be RSA >= 2048 bits");
      } else {
        backendPubPem = createPublicKey(priv).export({ type: "spki", format: "pem" }).toString();
      }
    } catch {
      errors.push("Invalid COGNITO_APP_PRIVATE_KEY_B64");
    }
  }

  const cors = new Set((backendEnv.CORS_ORIGINS || "").split(",").map((v) => v.trim().replace(/\/+$/, "")).filter(Boolean));
  if (webOut && !cors.has(webOut.origin)) errors.push("CORS_ORIGINS must include web origin");
  if (adminOut && !cors.has(adminOut.origin)) errors.push("CORS_ORIGINS must include superadmin origin");
  if (!backendEnv.JWT_SECRET || backendEnv.JWT_SECRET === "secretKey" || backendEnv.JWT_SECRET.length < 32) {
    errors.push("JWT_SECRET must be >= 32 characters and not 'secretKey'");
  }

  let verifiedPubKey = backendEnv.COGNITO_APP_PUBLIC_KEY_B64
    ? checkPublicKey("env", backendEnv.COGNITO_APP_PUBLIC_KEY_B64, backendPubPem, errors)
    : false;
  verifiedPubKey = validateFrontendEnv("web", webEnv, backendEnv, errors, warnings, backendPubPem, args.strict) || verifiedPubKey;
  verifiedPubKey = validateFrontendEnv("superadmin", adminEnv, backendEnv, errors, warnings, backendPubPem, args.strict) || verifiedPubKey;
  if (args.strict && !verifiedPubKey) {
    errors.push("No verified COGNITO_APP_PUBLIC_KEY_B64 matched backend signing key");
  }

  const isMockIssuer = Boolean(backendEnv.COGNITO_TEST_ISSUER);
  const issuer = backendEnv.COGNITO_TEST_ISSUER || expectedAwsIssuer;
  let liveAwsStatus = "NOT VERIFIED";
  if (args.checkOidc) {
    if (!issuer) errors.push("Cannot check OIDC without valid pool ID or COGNITO_TEST_ISSUER");
    else {
      const preErrors = errors.length;
      try {
        await checkOidc(issuer, errors);
        if (!isMockIssuer && errors.length === preErrors) liveAwsStatus = "VERIFIED";
      } catch (e) {
        errors.push(isMockIssuer ? e.message : `LIVE_AWS_STATUS=NOT VERIFIED (${e.message})`);
      }
    }
  }

  if (warnings.length > 0) console.warn(`WARNINGS:\n- ${warnings.join("\n- ")}`);
  if (errors.length > 0) {
    console.error(`COGNITO_STAGE_CONFIG_FAILED (live_aws=${liveAwsStatus}):\n- ${errors.join("\n- ")}`);
    process.exitCode = 1;
    return;
  }
  const oidcNote = args.checkOidc ? (isMockIssuer ? "verified-mock" : "verified-aws") : "not-checked";
  console.log(
    `COGNITO_STAGE_CONFIG_OK (region=${backendEnv.COGNITO_REGION || poolRegion}, managed=${managed?.origin}, pilotCount=${pilotIds.length}, superAdmin=${Boolean(adminOut)}, oidc=${oidcNote}, live_aws=${liveAwsStatus})`,
  );
}

void main().catch((err) => {
  console.error(`COGNITO_STAGE_CONFIG_FAILED (live_aws=NOT VERIFIED): ${err.message}`);
  process.exitCode = 1;
});
