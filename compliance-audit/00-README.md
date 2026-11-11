# Cantra Care (LCM) – UK compliance gap assessment

**Date of assessment:** 24 October 2026; **re-audited 29 October 2026**
**Repository state:** `D:\workspace\3Dots\care-home`, branch `sobin/careplan-v3`. First audit at commit `3529908`; re-audit at commit `6d25c2ea` (29 Oct 2026 10:46 IST) plus uncommitted working-tree changes. Every finding carries a 'Change since 24 Oct' value.
**Prepared by:** Claude (automated code inspection + live source research), for the Cantra engineering and compliance team
**Nature of this document:** an evidence-based gap assessment. It is **not** a legal opinion, a certification, or a statement that the product is GDPR-, NHS- or CQC-compliant. Independent legal, clinical-safety and security review is flagged per finding.

## Files in this folder

| File | Deliverable |
|---|---|
| `00-README.md` | Scope, method, coverage inventory, status definitions, limits (this file) |
| `01-executive-summary.md` | Deliverable 1 – Executive summary |
| `02-dashboard.md` | Deliverable 2 – Compliance status dashboard (generated from the findings dataset) |
| `03-master-checklist.md` | Deliverable 3 – Master compliance checklist, 103 items (generated) |
| `Compliance_Audit_Summary_and_Checklist.xlsx` | Workbook: Dashboard, Checklist (with change since 24 Oct), executive summary tables |
| `04-detailed-findings.md` | Deliverable 4 – Detailed findings for every WEAK / MISSING / UNABLE TO VERIFY item (generated) |
| `05-threat-assessment.md` | Deliverable 5 – Security and privacy threat assessment |
| `06-remediation-plan.md` | Deliverable 6 – Prioritised remediation plan (Phases 0–3) |
| `07-evidence-register.md` | Deliverable 7 – Compliance evidence register (non-code evidence) |
| `08-release-readiness.md` | Deliverable 8 – Release-readiness checklist and gates |
| `09-sources.md` | Sources register: every page opened, with dates, and what could not be verified |

Files 02, 03, 04 and 09 are generated from one dataset so that counts, statuses and references cannot drift apart. The source data is not in this folder; it can be regenerated on request.

## Scope

- **Product:** multi-tenant care-home management SaaS (web Phase 1; a mobile app `apps/mobile-v1` exists and was inspected for security posture only).
- **Frameworks assessed:** UK GDPR and DPA 2018 as amended; Data (Use and Access) Act 2025 (commenced provisions); CQC fundamental standards (SI 2014/2936 Regs 9–20A) and notification duties (SI 2009/3112); NHS DSPT v8 (2025-26); Digital Social Care Records assurance and MODS; DCB0129/DCB0160; NCSC guidance; Equality Act 2010 / PSBAR 2018 / WCAG 2.2; MHRA software-as-medical-device guidance; Records Management Code of Practice.
- **Roles:** The care-home provider (controller, CQC-registered) and the SaaS vendor (processor; controller for its own platform data) are assessed separately. Each finding carries a *who* field.

## Method

1. Repository inventory and coverage plan (below).
2. Verification of controls by reading source, configuration, migrations, guards, services and workflows on the user's machine. Features were not assumed from names, comments or READMEs: for example, "MFA endpoints exist" was traced to the web middleware (gate commented out) and the backend JWT strategy (no `mfaVerified` check).
3. Live research of primary sources (legislation.gov.uk, ICO, NHS England, dsptoolkit.nhs.uk, NCSC, W3C, MHRA). Each is logged in `09-sources.md` with date checked. Where a primary page could not be fetched, that is recorded and a secondary source is marked as such.
4. Applicability analysis per requirement (Applicable / Conditionally applicable / Not applicable / Applicability undetermined) with reasoning.
5. Status assignment under the rules in the brief. **STRONG** required code evidence *and* enforcement *and* tests or operational evidence. Nothing met that bar: the backend has 32 unit-spec files that are not run in CI and no authorisation or tenant-isolation tests, and no operational evidence (policies, pen test, restore test) exists in the repository. **ADEQUATE** is therefore the best status awarded.
6. Threat assessment, remediation plan and release gates derived from the findings.
7. Consistency pass: duplicate IDs, dangling dependencies, unsupported statuses, and uninspected areas.

## Coverage inventory

| Area | Files (tracked) | Inspected | Notes |
|---|---:|---|---|
| `apps/backend/src` | 215 | Full read of: `main.ts`, `load-env.ts`, `auth/*` (controller, service, module, jwt.strategy, refresh-token.service), `common/guards/*`, `audit/*`, `observations/*`, `documents/documents.controller.ts`, `medications/medications.controller.ts`, `profile/profile.controller.ts`. Grep-based inspection of all 36 controllers (guards, body validation, uploads), all `@Cron` jobs, all `emitDataAccess` call sites, all `findUnique` bare-id patterns, all `process.env` reads. | Service-layer business logic of residents, care-plan, risk, shifts, finance, enquiries was sampled, not fully read. |
| `packages/db` | schema (1,889 lines, 66 models), `src/index.ts`, `src/crypto.ts`, 7 migrations, seeds | Schema fully listed; encryption extension and crypto read in full. | Migration SQL not individually reviewed. |
| `packages/audit-db` | schema, 5 migrations | Schema and immutable-trigger migration read; service `audit-db.service.ts` read. | Partitioning migration not reviewed. |
| `packages/schema` | 32 | `auth.ts` password rules; others by grep. | |
| `apps/web` | 772 (`app` 562, `lib` 210) | `middleware.ts`; route inventory; grep for privacy/terms/cookie pages, accessibility attributes, offline handling, fetch usage. | No component-level UI review; no rendered-page accessibility test. |
| `apps/mobile-v1/src` | 67 | Security storage, API client, logger; grep for screenshot/root controls. | Out of Phase 1 scope; included for forward-looking findings only. |
| `apps/superadmin` | 63 | Route list only. | Declared out of scope by `AGENTS.md`; noted for privileged-access findings. |
| CI/CD and deployment | `.github/workflows/main.yml`, `deploy.yml`, `deploy.sh`, `ecosystem.config.js`, `renovate.json`, `.gitignore` | Read in full. | No IaC exists to review; hosting topology is therefore unverified. |
| Compliance documents | `Cantra_Care_GDPR_Compliance_Audit_Checklist.xlsx`, `Cantra_UK_Launch_Legal_Checklist-01.xlsx`, user-supplied `Care_Home_GDPR_Compliance_Checklist.xlsx` | Read in full. | Several claims in these workbooks are contradicted by the code; see A-03, A-09, E-01, E-10. |
| Tests | 32 spec files + 1 e2e spec | Listed; `auth.service.spec.ts` sampled. | Tests are not executed by CI. |

**Not inspected / cannot be inspected from the repository:** production server configuration (TLS termination, firewall, DB roles, backups), cloud console settings (GCS bucket region/constraints), secrets held in `.env` files on the server, GitHub branch-protection settings, any contracts, policies, training or registrations held outside the repo. Each of these appears as UNABLE TO VERIFY with the evidence that would close it.

## Status definitions (as applied)

| Status | Meaning here |
|---|---|
| STRONG | Evidenced in code, enforced server-side, tested or operationally assured. *None awarded.* |
| ADEQUATE | Substantially implemented in code; minor gaps or missing assurance (typically no tests). |
| WEAK | Exists but with a significant defect, bypass or inconsistency. |
| MISSING | No implementation or document found. |
| NOT APPLICABLE | Does not apply to this product/organisation today; rationale recorded; revisit on scope change. |
| UNABLE TO VERIFY | Evidence not available from the repository; treated as *not met* in all metrics. |

Priority follows the brief: P0 = credible severe risk or release-blocking; P1 = must fix before the affected functionality is used in production; P2 = planned cycle; P3 = maturity.

## Headline numbers

Re-audit 4 Nov 23:20 (`sobin/compliances-V0` `b3caf619`): 105 items · 47 ADEQUATE · 32 WEAK · 11 MISSING · 11 UNABLE TO VERIFY · 4 NOT APPLICABLE. Control effectiveness **46%**; 8 P0 items (E-19, E-05, A-14, E-18, E-17, A-09, A-02, H-02). Since 4 Nov 21:50: 1 good → missing (E-19), 13 weak/missing → good.

Re-audit 4 Nov (`develop` `6f33c164`): 104 items · 0 STRONG · 35 ADEQUATE · 36 WEAK · 17 MISSING · 12 UNABLE TO VERIFY · 4 NOT APPLICABLE. Control effectiveness **35%**; 5 P0 items (E-18, E-17, A-09, A-02, H-02). Since 29 Oct PM: 1 item went from good to weak (A-04), 2 went from weak/missing to good (D-02, E-19).

Re-audit 29 Oct PM (HEAD `6d25c2ea` + uncommitted fixes): 104 items · 0 STRONG · 34 ADEQUATE · 36 WEAK · 18 MISSING · 12 UNABLE TO VERIFY · 4 NOT APPLICABLE. Control effectiveness **34%**; 6 P0 items (E-19, E-18, E-17, A-09, A-02, H-02). Credit for today's fixes assumes the working tree is committed as-is.

Re-audit 29 Oct AM: 103 items · 0 STRONG · 22 ADEQUATE · 37 WEAK · 29 MISSING · 11 UNABLE TO VERIFY · 4 NOT APPLICABLE. Control effectiveness (STRONG+ADEQUATE over 99 applicable items, UNABLE TO VERIFY counted as not met): **22%** (24% on 24 Oct). 14 P0 items.

**Corrections to the 24 Oct report:** MFA does not exist (removed 3 Jun 2026, commit `dd031a5a`); per-account login lockout did exist (migration `20261022072919`). Both are fixed in D-01, D-02, D-05 and E-05. `audit-dead-letter.jsonl` (E-18) was in the repository at the first audit but was missed. Details in `02-dashboard.md`.

## Redaction note

No secret values, tokens or resident data are reproduced. Where a default or dummy credential is relevant to a finding (e.g. hard-coded fallback keys) the file and line are cited and the literal is quoted only where it is already a published placeholder in CI configuration.
