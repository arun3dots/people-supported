# A-09 — UK GDPR Article 35 Data Protection Impact Assessment (DPIA) & Tenant DPIA Template

**Document ID:** `CC-DPIA-2026-01`  
**Version:** `1.0`  
**Effective Date:** `29 October 2026`  
**Regulatory Scope:** UK GDPR Articles 35 & 36, Data Protection Act 2018 (DPA 2018), Data (Use and Access) Act 2025 (DUAA), NHS DSPT, CQC Regulation 17.

---

## 1. Executive Summary & Screening Triggers (UK GDPR Art 35(1) & ICO High-Risk Criteria)

Under UK GDPR Article 35(3)(b) and the Information Commissioner's Office (ICO) mandatory DPIA list, a Data Protection Impact Assessment is **legally mandatory** for the CantraCare platform because it involves:
1. **Large-scale processing of Special Category Data (Art 9(1))**: Resident clinical diagnoses, allergies, DNACPR status, eMAR medication administration records, NEWS2 physiological observations, clinical body maps, and care plans.
2. **Vulnerable Data Subjects**: Elderly care home residents, individuals with dementia or cognitive impairment lacking mental capacity (Mental Capacity Act 2005 / DoLS / LPS), and care staff undergoing statutory DBS vetting.
3. **Innovative / Mobile Clinical Technology & Automated Clinical Scoring**: Mobile carer apps, automated NEWS2 physiological early warning scoring (DCB0129), and multi-tenant cloud SaaS architecture.
4. **Workplace Monitoring Controls**: Tamper-evident clinical audit trails and optional tenant-configurable geolocation verification.

---

## 2. Systematic Description of Processing (Art 35(7)(a))

| Attribute | Description |
|---|---|
| **Nature of Processing** | Collection, AES-256-GCM field-level encryption, cloud storage (GCP UK `europe-west2`), role-based clinical display, NEWS2 threshold scoring, and statutory CQC/SAR export. |
| **Scope of Data** | Resident identity, NHS Number, DOB, NOK/LPA details, care plans, risk assessments, eMAR, NEWS2 observations, body maps, incidents, and staff HR/DBS records. |
| **Context** | Multi-tenant SaaS platform where each CQC-registered Care Home is the **Data Controller** and CantraCare Ltd is the **Article 28 Data Processor**. |
| **Purposes** | Safe delivery of regulated adult social care and nursing care, medication safety, clinical deterioration escalation, and CQC statutory compliance. |

---

## 3. Assessment of Necessity, Proportionality & Data Minimisation (Art 35(7)(b))

- **Lawful Basis (Controller)**: UK GDPR Art 6(1)(c) (Legal obligation under Health and Social Care Act 2008 Regulated Activities Regulations 2014 Regs 9, 12, 17, 18, 19) and Art 6(1)(e) (Public task / social care); Special Category condition Art 9(2)(h) + DPA 2018 Schedule 1 Part 1 para 2 (Health or social care under professional confidentiality) and Art 9(2)(b) (Employment/DBS obligations).
- **Data Minimisation (`A-08` / `C-09`)**:
  - Continuous browser/mobile GPS tracking on page views is **disabled by default** (`Tenant.enablePageViewGeolocation = false`) and stripped server-side unless a Care Home Controller explicitly enables location verification.
  - Push notifications via FCM pseudonymise resident identities to initials + short ID (`C-09`).
  - Raw DBS certificate scans are not required to be retained indefinitely; encrypted summary fields (`certificateNumber`, status, issue date) satisfy CQC Regulation 19 (`I-01`).

---

## 4. Risk Register & Technical/Organisational Mitigations (Art 35(7)(c)–(d))

| Risk ID | Threat / Privacy Risk | Inherent Severity | Technical & Organisational Mitigation Implemented | Residual Risk |
|---|---|---|---|---|
| **R-01** | Cross-tenant disclosure of resident clinical observations (`D-07`) | Critical | `ObservationsService` enforces mandatory `tenantId` filtering from verified JWT across `create`, `findAllByResident`, and `findOne`, backed by unit tests. | **Low** |
| **R-02** | Compromise of database backups or plaintext special-category identifiers (`E-02`) | Critical | AES-256-GCM field-level encryption enforced via `@repo/db` Prisma hooks on `nhsNumber`, `dob`, `niNumber`, `dbsNumber`, `certificateNumber`, `mfaSecret`, `phoneNumber`, `addressLine1`. Startup fails closed if `ENCRYPTION_KEY` is missing. | **Low** |
| **R-03** | Unauthorised staff access to tenant-wide audit logs (`D-06`) | High | `GET /api/audit-logs` and `GET /api/audit-logs/verify` restricted via `@Roles('Admin', 'Manager')`. | **Low** |
| **R-04** | Credential stuffing or stolen session cookies (`D-02`, `D-04`, `E-04`) | Critical | Mandatory TOTP MFA for `SuperAdmin`, `Admin`, and `Manager` (enforced in both `JwtAuthGuard` and Next.js `middleware.ts`); `@nestjs/throttler` rate limiting; strong `JWT_SECRET` assertion. | **Low** |
| **R-05** | Unnoticed clinical deterioration due to incomplete NEWS2 parameter scoring (`C-06`) | Critical | Complete Royal College of Physicians (RCP) NEWS2 7-parameter scoring + SpO2 Scale 2 + single-parameter red score (`>= 3`) escalation in `ObservationsService`. | **Low** |
| **R-06** | Audit log tampering or unencrypted disk dead-letter exposure (`C-03`, `E-18`) | Critical | HMAC-SHA256 hash chaining with `assertAuditSigningKeyConfigured()`, encrypted Redis dead-letter queue (`cqc:audit:dead-letter:v1`), 15-min replay cron, and 02:00 AM nightly chain verification cron. | **Low** |
| **R-07** | Inability to fulfil Subject Access Requests within 1 month (`B-05`) | High | Self-service SAR JSON & PDF dossier export endpoints (`/api/data-rights/residents/:id/export`, `/api/data-rights/staff/:id/export`) with audit trail logging. | **Low** |

---

## 5. Sign-Off & Review Schedule

- **DPO Sign-Off:** Approved for Phase 0 Production Release (Residual Risk: **Low**; ICO Art 36 prior consultation not required).
- **Mandatory Review Triggers:** Annually, or prior to introducing any new AI/clinical decision support feature, biometric authentication, new international sub-processor, or change to special-category data fields (enforced via `.github/PULL_REQUEST_TEMPLATE.md`).

---

## Annex A: Care Home Controller DPIA Adoption Template

Care Home Registered Managers and Data Protection Leads may complete the table below to adopt this DPIA for their CQC location:

| Care Home Field | Controller Entry |
|---|---|
| **Care Home Legal Entity & CQC Provider ID** | `[Insert Name / 1-XXXXXXXX]` |
| **CQC Location ID & Registered Manager** | `[Insert Location ID / Manager Name]` |
| **Information Governance Lead / Caldicott Guardian** | `[Insert Name & Email]` |
| **Optional Geolocation on Page Views Enabled?** | `[ ] No (Default Recommended)   [ ] Yes (Document justification below)` |
| **MFA Enforced for All Nurses & Carers?** | `[ ] Yes (Recommended)          [ ] Admin & Manager Only` |
| **Date Adopted & Next Annual Review Date** | `[DD/MM/YYYY] — Review by [DD/MM/YYYY]` |

