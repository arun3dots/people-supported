> Part of the Cantra Care / LCM compliance audit, 24 October 2026. Repository inspected at commit `3529908` (branch `sobin/careplan-v3`). See `00-README.md` for scope, method and limits.

# Deliverable 6 – Prioritised remediation plan

Effort figures are **estimates** in engineer- or specialist-days, assuming one person familiar with the codebase, excluding review and external lead times. Owners: Backend, Frontend, DevOps, Security, Product, Compliance, Care Operations (tenant). Finishing the software items does **not** make either organisation compliant; the governance and operational items are equally necessary.

## Phase 0 – Immediate critical-risk containment (target: this week)

**Added 29 Oct (do first):**

| # | Action | Findings | Owner | Est. effort | Dependencies | Acceptance criteria |
|---|---|---|---|---|---|---|
| 0.A | Remove `apps/backend/audit-dead-letter.jsonl` from the index (`git rm --cached`), git-ignore it, decide on history purge (`git filter-repo` + coordinated force-push), review repository access, record a breach assessment. Move the dead-letter store to an encrypted queue with replay. | E-18, C-03 | Security, Backend | 1 d + team decision | None | File absent from all branches; breach assessment recorded |
| 0.B | Add `RolesGuard` to `AuditController`; add an automated check that every controller using `@Roles` includes `RolesGuard`. | D-06 | Backend | 0.5 d | None | Carer → 403 on every audit route except page-view |


| # | Action | Findings | Owner | Est. effort | Dependencies | Acceptance criteria |
|---|---|---|---|---|---|---|
| 0.1 | Fail closed on missing secrets: throw at startup if `JWT_SECRET` (<32 bytes), `ENCRYPTION_KEY`, `AUDIT_SIGNING_KEY` are unset in non-test environments; remove fallbacks in `packages/db/src/crypto.ts`, `auth.module.ts`, `jwt.strategy.ts`, `apps/web/middleware.ts`, `audit-db.service.ts`; rotate production secrets. | D-04, E-02, C-03 | Backend | 1 d | None | App refuses to boot without each key; secrets rotated and recorded |
| 0.2 | Tenant-scope the observations module: pass `req.user.tenantId` from controller; filter `resident`, `observation` queries; review the 13 bare-id `findUnique` calls listed in D-07. | D-07, C-06 | Backend | 2 d | None | Cross-tenant e2e tests fail before, pass after |
| 0.3 | Use the CORS allow-list already built in `main.ts`; add `helmet`; remove `fromUrlQueryParameter('token')`. | E-04, D-03 | Backend | 0.5 d | None | Unknown origin preflight rejected; securityheaders.com A |
| 0.4 | Add `@nestjs/throttler` globally with stricter limits on `/api/auth/*`, OTP verification, `/api/tenants-public`, `/api/packages-public`; raise the existing per-account lockout from 3 to 5–10 attempts with progressive delay (FAILED_LOGIN is already audited). | D-01, E-05, D-05 | Backend | 1 d | None | Spray test returns 429; lockout threshold 5–10 |
| 0.5 | **Re-implement** MFA (removed 3 Jun 2026): TOTP or WebAuthn enrolment, verification and recovery; enforce in `JwtAuthGuard` (already reads the user per request); mandatory for Admin/Manager/SuperAdmin; update `AGENTS.md`. | D-02 | Backend, Frontend | 5 d (estimate revised from 2 d) | 0.1 | API call without MFA → 403; admin login flow requires a second factor |
| 0.6 | Restrict `GET /api/audit-logs` to Admin/Manager; disable Swagger in production. | D-06, E-16 | Backend | 0.5 d | None | Carer → 403; `/api` 404 in prod |
| 0.7 | Freeze onboarding of any real tenant; keep seeded/synthetic data only until Phase 1 gates pass. | — | Product | 0 | None | Written hold recorded |
| 0.8 | Appoint breach owner and publish an interim incident SOP (who decides, 24 h internal clock, tenant notification template). | E-17 | Security, Compliance | 1 d | None | SOP circulated; contact tree tested |

Phase 0 total: ~8.5 engineer-days + 1 compliance-day.

## Phase 1 – Production-blocking security, privacy and safety gaps (target: before first pilot with real data)

| # | Action | Findings | Owner | Est. effort | Dependencies | Acceptance criteria |
|---|---|---|---|---|---|---|
| 1.1 | Customer DPA (Art 28(3) terms, sub-processor schedule, transfer annex) with acceptance captured at tenant onboarding (version, timestamp, acceptor). | A-02, A-11, H-04 | Compliance, Backend | 3 d + counsel | A-01 | Every Active tenant has `dpaAcceptedAt`/version |
| 1.2 | Privacy notice (/privacy), cookie notice (/cookies), DP complaints route (DUAA s.103) and resident/staff notice templates; links from login, signup, footer, mobile. | A-04, A-13 | Compliance, Frontend | 3 d + counsel | 1.1 | Pages live; Art 13 checklist signed |
| 1.3 | Platform DPIA (incl. geolocation, cross-tenant, retention, transfers) and DPIA screening in feature intake; tenant DPIA template. | A-09 | Compliance | 4 d | 0.1–0.6 | Signed DPIA with residual-risk acceptance |
| 1.4 | Transfer instruments: IDTA/Addendum + TRA for India-based access and Razorpay; minimise India-side production access. | H-02, D-11 | Compliance, DevOps | 3 d + counsel | 1.1 | Signed instruments; access list |
| 1.5 | Subject access export (resident, staff): JSON + PDF across all tables holding the subject's ID plus document list; `DATA_EXPORTED` audit event; rights-request log in admin. | B-05, B-08, B-11 | Backend, Frontend | 6 d | None | Seeded-resident export covers every table (automated check) |
| 1.6 | Record states (Active/Archived/Restricted/LegalHold) with enforcement; erasure request log with exemption reasons; retention configuration per record type with Code defaults; nightly appraisal job; automatic purge of expired tokens/resets; destruction certificate events. | B-07, B-10, C-10 | Backend | 7 d | 1.5 | Appraisal queue, hold behaviour and token purge demonstrated |
| 1.7 | Read-audit interceptor for resident-scoped GETs and both document stream routes; export events; nightly integrity verification with alert. | C-04, C-03 | Backend | 3 d | 0.1 | Resident-access report complete for a test session |
| 1.8 | Central `canAccessResident()` applied to observations, eMAR, care-plan, documents; deactivation kills sessions (deny cache + refresh revoke); agency account expiry. | D-08, D-09, B-13 | Backend | 4 d | 0.2 | Carer blocked from unassigned resident; deactivated user fails within seconds |
| 1.9 | Upload hardening: MIME allow-list by magic bytes, size limits, `Content-Disposition: attachment`, malware scanning. | E-07 | Backend | 2 d | None | HTML/EXE rejected; forced download |
| 1.10 | Validation clean-up: Zod on remaining `@Body()`s (incidents, notifications, page-view, changePassword, verifyMfaReset); lint rule. | E-06, C-08 | Backend | 1.5 d | None | 0 untyped bodies |
| 1.11 | Data minimisation: no resident names in push payloads; remove `console.log` of user objects; geolocation off by default / opt-in with purpose or removed. | C-09 | Backend | 1.5 d | 1.3 | Payload inspection; grep |
| 1.12 | Clinical safety: appoint CSO; clinical risk management plan; hazard log seeded with NEWS2 thresholds, escalation routing, medication alert timing, auto-draft content, alert delivery failure; safety case report; alert acknowledgement with timeout escalation and delivery logging. | I-02, I-05, C-06 | Compliance (CSO), Backend | 5 d + CSO | None | Hazard log ≥20 entries; CSO sign-off; unacknowledged critical alert escalates |
| 1.13 | Medical-device intended-purpose statements and classification memo. | I-01 | Compliance | 2 d | 1.12 | Memo signed |
| 1.14 | eMAR integrity: no hard delete of rounds with administrations; correction workflow (reason, original retained) for observations/eMAR/notes. | B-06, C-07 | Backend | 3 d | None | DELETE blocked; corrections visible |
| 1.15 | Safeguarding entity and complaints workflow. | C-08, G-06, G-09 | Backend, Frontend | 5 d | None | Records created end-to-end |
| 1.16 | CI/CD: run tests in CI; add cross-tenant and role-matrix e2e suites; deploy from tagged release after green CI with approval; `pnpm audit` and SAST gates. | E-12, E-14, E-11 | DevOps, Backend | 4 d | 0.2 | Production deploy blocked without approval and green tests |
| 1.17 | Operations evidence: commit reverse-proxy/TLS config; hosting inventory (regions); DB network and role grants; backup configuration and a recorded restore test; downtime (paper MAR) procedure; structured logging shipped to a UK log store with failed-login and bulk-read alerts. | E-01, E-08, E-09, E-10, H-01, D-12, I-06 | DevOps | 6 d | None | Documents in repo `docs/`; restore test report; alerts demonstrated |
| 1.18 | Accessibility: WCAG 2.2 AA audit of login, eMAR, observations, care plan; fix critical; `jsx-a11y` lint; publish statement. | I-04, I-07 | Frontend | 5 d | None | Audit report; /accessibility live |
| 1.19 | Policies and training: approve security/data-protection policy set; appropriate policy document (Sch 1) for staff health and DBS data; DP training log; privileged-access register. | A-10, B-02, D-11 | Compliance, Security | 4 d | None | Signed policies; training log 100% |
| 1.20 | Independent penetration test after 1.1–1.11; remediate highs. | E-13 | Security | external | 0.x, 1.7–1.10 | Report with no open high/critical |
| 1.21 | Tenant export and two-step purge with certificate (vendor exit). | H-05 | Backend | 3 d | 1.5, 1.6 | Demonstrated on test tenant |

Phase 1 total: ~70 engineer-days + ~20 compliance/CSO days + external pen test and counsel.

## Phase 2 – Required governance, operational evidence and assurance (target: before first paid customer / public launch)

| # | Action | Findings | Owner | Est. effort | Dependencies |
|---|---|---|---|---|---|
| 2.1 | Regenerate RoPA from schema; correct DOB claim; add recipients/roles/retention; legal review of lawful-basis register; LIA for enquiries. | A-03, B-01 | Compliance | 3 d | 1.3 |
| 2.2 | DPO appointment record and ICO notification; ICO fee; contracting-entity decision and UK representative if needed. | A-05, A-06, A-07 | Compliance | 2 d + external | — |
| 2.3 | Granular consent model with withdrawal and history; representative entity used in SAR workflow. | B-03, B-04 | Backend | 4 d | 1.5 |
| 2.4 | DSPT: register as IT Supplier; complete v8 assertions mapped to this audit's evidence; publish; provide tenant evidence pack. | F-02, F-03, F-01 | Security, Compliance | 6 d | Phase 1 |
| 2.5 | DTAC / successor pack (clinical safety, DPIA, DSPT, pen test, accessibility). | F-09 | Compliance | 2 d | 1.12, 1.18, 1.20, 2.4 |
| 2.6 | Break-glass access with review queue; tenant-consented support sessions. | D-10, H-06 | Backend | 4 d | 1.8 |
| 2.7 | Privacy-by-design process: PR template checklist, design notes for data-touching features; risk register; six-monthly internal audit; evidence index keyed to finding IDs; fix workbook formulas. | A-08, A-12 | Security, Compliance | 2 d | — |
| 2.8 | Secrets manager/KMS; key rotation runbook; gitleaks in CI; remove `cookies.txt` and `~$*.xlsx` from git. | E-02, E-03 | DevOps | 3 d | 0.1 |
| 2.9 | CQC capability gaps: wound/body map; medicines stock and CD register; visitor log; equipment/PEEP registers; supervision/appraisal; audit calendar and feedback; death and DoLS-outcome notification prompts; DoLS expiry alerts; activities log. | G-02, G-03, G-04, G-05, G-08, G-10, G-11, G-14, G-01 | Backend, Product | 20 d | — |
| 2.10 | Late-entry flags and record-history view beside clinical entries. | C-01, C-02, C-05 | Backend, Frontend | 4 d | 1.14 |
| 2.11 | Extend field encryption to DBS, health clearance, DOB, NOK; document DB volume encryption. | E-02, G-12 | Backend, DevOps | 3 d | 2.8 |
| 2.12 | Production/non-production data policy and masked-export script. | E-15 | Security | 1 d | — |
| 2.13 | Marketing opt-out on enquiries; objection handling. | B-09 | Backend | 1 d | — |

## Phase 3 – Further maturity improvements

| # | Action | Findings | Owner | Est. effort |
|---|---|---|---|---|
| 3.1 | MODS mapping; dm+d and SNOMED CT coding (TRUD licence); NHS number Modulus 11 check. | F-05, F-06, F-07 | Product, Backend | 10 d |
| 3.2 | Decide on DSCR Assured Solutions List bid; if yes, plan interoperability (GP Connect, FHIR) and NHS onboarding. | F-04, F-08 | Product | decision |
| 3.3 | DCB0160 deployment pack for tenants and release notes with safety impact. | I-03 | Compliance | 2 d |
| 3.4 | Nutrition targets alerts; duty-of-candour reminder tests. | G-07, G-13 | Backend | 2 d |
| 3.5 | Mobile hardening before any mobile release: screen-capture blocking, root detection, MDM guidance, mobile pen test. | I-08 | Frontend, Security | 4 d + external |
| 3.6 | Caldicott Guardian / IG lead attribute per tenant; access-review export. | B-13, D-09 | Backend | 2 d |

## Sequencing notes

- 0.1 and 0.2 are independent and can start immediately; both must land before any environment handles real data.
- 1.20 (pen test) should be scheduled now for the end of Phase 1; lead times are typically 3–6 weeks.
- Counsel review is on the critical path for 1.1, 1.2, 1.4; start drafting in parallel with Phase 0.
- CSO appointment (1.12) has the longest lead time of the non-engineering items; begin recruitment or contracting immediately.
