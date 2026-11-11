# A-08: Privacy-by-Design & Clinical Safety in the Software Development Life Cycle (SDLC)

**Document Reference**: POL-SDLC-PBD-001  
**Version**: 1.0.0  
**Effective Date**: November 2026  
**Regulatory Frameworks**: UK GDPR Art. 25, Data Protection Act 2018, NHS DSPT Standard 6, NHS DTAC (Clinical Safety & Data Protection), DCB0129  
**Target Audience**: Engineering, Product Management, DevOps, Clinical Safety Officer (CSO), Data Protection Officer (DPO)

---

## 1. Executive Summary & Purpose

Under UK GDPR Article 25 ("Data protection by design and by default") and NHS England standards, data protection and clinical safety must not be retrospective considerations. They must be systematically engineered into every stage of the software development lifecycle.

This document establishes the binding engineering controls, architecture rules, and pull request gating procedures enforced across the platform monorepo (`apps/backend`, `apps/web`, `packages/*`).

---

## 2. Core Privacy-by-Design Architectural Principles

### 2.1 Multi-Tenant Isolation & Zero Trust Partitioning
1. **Mandatory Tenant Scoping**: Every database read, update, and delete query operating on care home records MUST explicitly filter by `tenantId` extracted directly from the verified JWT payload (`req.user.tenantId`).
2. **Never Trust Client Body**: The `tenantId` parameter MUST NEVER be accepted from the HTTP request body or URL path for tenant operations.
3. **Cross-Tenant Prevention**: Integration tests must assert that requests under Tenant A fail with `NotFoundException` or `ForbiddenException` when attempting to access IDs belonging to Tenant B.

### 2.2 Data Minimisation (UK GDPR Art. 5(1)(c))
1. **Prisma Field Selection**: Endpoints returning resident, user, or staff lists MUST use explicit Prisma `select` projections. Sensitive fields (e.g. `passwordHash`, `mfaSecret`, `niNumber`, `dbsNumber`, `dob`) MUST NEVER be returned in generic list queries.
2. **Pre-Admission Scoping**: Enquiries and initial prospective assessments must capture only triage information. Full medical histories and NHS numbers are restricted to Part A/B formal admission workflows.

### 2.3 Field-Level Encryption at Rest (UK GDPR Art. 32)
1. Sensitive identifiers (`Resident.nhsNumber`, `UserProfile.phoneNumber`, `UserProfile.addressLine1`) are transparently encrypted with AES-256-GCM via the `@repo/db` cryptographic client extension before database persistence.
2. Direct raw SQL / `rawPrisma` bypasses that skip encryption layers are forbidden for patient health data.

### 2.4 Immutable Audit Logging (UK GDPR Art. 5(2) & Caldicott Principle 7)
1. All read/write operations touching sensitive patient health data (`Resident`, `Observation`, `CarePlan`, `MedAdministration`, `VisitorLog`, `StaffSupervision`) MUST emit structured audit events through `AuditService.emit(...)`.
2. Asynchronous queuing via BullMQ (`audit` queue) ensures audit durability without degrading real-time clinical API performance.

---

## 3. SDLC Phase Gates & Workflow Integration

```
[1. Feature Ideation] 
   └── DPIA Threshold Screening (DPO Review if High Risk)
[2. Architecture & Schema Design] 
   └── Strict Zod Validation Schemas in @repo/schema
   └── Prisma Model Relations with Tenant Isolation
[3. Engineering & Local Verification] 
   └── Monorepo Rule 8 (<350 lines per file)
   └── Strict TypeScript (No 'any' in source)
   └── Unit & Integration Testing (Jest)
[4. Pull Request Review & Safety Gate] 
   └── GitHub PR Template Checklist Verification
   └── Clinical Safety Officer (CSO) Sign-off for Hazard Paths
[5. Continuous Integration (CI)] 
   └── Automated Typecheck (tsc)
   └── Automated Unit Tests
   └── Automated Linting & Security Vulnerability Audit
[6. Deployment & Post-Release Monitoring] 
   └── Migration Verification
   └── Audit & Error Monitoring (Sentry/CloudWatch)
```

---

## 4. Pull Request (PR) Quality & Safety Gate

Every GitHub pull request requires completion of the standardized safety checklist defined in `.github/PULL_REQUEST_TEMPLATE.md`:

1. **Tenant Isolation Verification**: Confirms all new database queries are strictly scoped by `tenantId`.
2. **Special Category Data Audit**: Verifies that any new personal data fields meet encryption and retention requirements.
3. **Clinical Safety Review**: Mandatory CSO review if modifying medication administration, allergy alerts, vital signs observations, or emergency evacuation workflows.
4. **Monorepo Code Quality**: Hard 350-line file cap, no `any` casts, typed Zod schemas.

---

## 5. Roles & Responsibilities

| Role | Responsibility |
|---|---|
| **Software Engineers** | Implement code adhering to privacy-by-design rules, maintain unit test coverage, and complete PR checklists. |
| **Tech Lead / Reviewer** | Review code for tenant leakage, file length caps, absence of `any`, and secure API contracts. |
| **Data Protection Officer (DPO)** | Conduct periodic audits of ROPA, approve DPIAs for new modules, and review data retention policies. |
| **Clinical Safety Officer (CSO)** | Sign off on clinical hazard log entries, approve clinical UI modifications, and monitor safety incident reports. |

---

## 6. Audit & Compliance Verification

Compliance with this policy is reviewed semi-annually and during all external NHS DSPT and DTAC re-assessment cycles.

