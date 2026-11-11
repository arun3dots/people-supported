# E-16: API Documentation & Attack Surface Governance Policy

**Document Reference**: POL-SEC-SWAGGER-001  
**Version**: 1.0.0  
**Effective Date**: November 2026  
**Regulatory Frameworks**: UK GDPR Art. 32 (Security of Processing), NCSC Cloud Security Principles, NHS DSPT Standard 4 & 6, OWASP API Security Top 10  
**Target Audience**: DevOps, Backend Engineering, Security Lead  

---

## 1. Executive Summary & Security Objectives

Interactive API explorers (such as Swagger UI / OpenAPI schemas) provide valuable utility for developers during local engineering and integration phases. However, in production healthcare environments handling special category patient data, exposed API documentation significantly broadens the attack surface:
- Discloses route signatures, parameter models, enumeration values, and data structures.
- Assists malicious actors in mapping API boundaries, crafting injection attacks, and probing for unauthenticated edge endpoints.

This policy defines the technical controls, environment gating, and architectural measures implemented to restrict API documentation exposure across production systems.

---

## 2. Technical Control & Gating Architecture

In `apps/backend/src/main.ts`, the Swagger UI explorer and OpenAPI JSON generation are strictly decoupled from production runtime initialization:

```typescript
// E-16: Attack surface reduction (UK GDPR Art 32). Expose Swagger ONLY in development/staging
// or when explicitly enabled via ENABLE_SWAGGER=true in a non-production environment.
const isSwaggerEnabled =
  process.env.ENABLE_SWAGGER === 'true' ||
  (process.env.NODE_ENV !== 'production' && process.env.ENABLE_SWAGGER !== 'false');

if (isSwaggerEnabled) {
  const config = new DocumentBuilder()
    .setTitle('Cantra Care API')
    .setDescription('The Cantra Care platform API documentation.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
}
```

### Environment Enforcement Matrix

| Environment | Default Gating Behavior | Endpoint Availability (`/api`) | Access Conditions |
|---|---|---|---|
| **Local Development** (`development`) | **Enabled** | `http://localhost:4400/api` | Accessible to local engineer; no production data. |
| **Staging / QA** (`staging`) | **Conditional** | `https://staging-api.cantracare.com/api` | Restricted via internal IP allow-list / VPN. |
| **Production** (`production`) | **Disabled (Hard Gate)** | Unmounted (Returns `404 Not Found`) | Cannot be mounted unless explicit staging override. |

---

## 3. Defense-in-Depth Layering

1. **Reverse Proxy Gating**: Even if application environment variables are misconfigured, production Nginx configurations (`ops/nginx/cantra-care.conf`) route traffic directly to the backend application entry point without exposing raw `/api-json` or `/api-yaml` endpoints.
2. **Zero Default Endpoints**: All operational controllers require `@UseGuards(JwtAuthGuard, RolesGuard)` by default. No sensitive data can be queried without an authenticated, active JWT session belonging to the verified tenant.
3. **Helmet Security Headers**: Strict HTTP headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`) prevent MIME-sniffing, clickjacking, and session tampering across all API responses.

---

## 4. Verification & Audit Procedures

1. **Automated CI Validation**: Pre-deployment automated tests assert that production environment configurations set `NODE_ENV=production`.
2. **Penetration Testing**: Annual independent penetration testing (CREST accredited) verifies that `/api`, `/swagger`, `/v3/api-docs`, and `/openapi.json` return `404 Not Found` against production domains.
3. **Audit Log Verification**: Any unexpected probes against `/api` or documentation endpoints trigger web application firewall (WAF) rate-limiting blocks and are captured in security telemetry.

