> Part of the Cantra Care / LCM compliance audit, 24 October 2026. Repository inspected at commit `3529908` (branch `sobin/careplan-v3`). See `00-README.md` for scope, method and limits.

# Deliverable 8 – Release-readiness checklist

Each gate is objective and testable. **Gate A** must be fully green before any real resident data is processed (including pilots). **Gate B** must be green before a paid or public launch. Items reference finding IDs in `03-master-checklist.md`. Production use is not recommended while any Gate A item is open.

## Gate A – Required before any real resident data

### Legal and governance
- [ ] No personal data in the repository: `audit-dead-letter.jsonl` removed from all branches (and history, if purged); breach assessment recorded (E-18)
- [ ] Executed Article 28 DPA with every active tenant; acceptance version and timestamp stored on the tenant record (A-02)
- [ ] Platform DPIA signed off with residual-risk acceptance; DPIA screening in feature intake (A-09)
- [ ] Privacy notice, cookie notice and data-protection complaints route published and linked from login/signup (A-04, A-13)
- [ ] International transfer instruments (IDTA/Addendum) and TRAs executed for India-based access and Razorpay; production access list reviewed (H-02)
- [ ] Incident response / breach SOP approved; breach owner named; tenant notification template; register in use (E-17)
- [ ] Decision recorded: contracting entity and whether a UK representative is required (A-07)

### Data protection and resident rights
- [ ] Subject access export produces a complete bundle for a seeded resident and staff member; automated completeness check passes (B-05)
- [ ] Record states (Archived/Restricted/LegalHold) enforced; erasure request log live (B-07)
- [ ] Retention configuration with Records Management Code defaults; appraisal job and token purge running (B-10)
- [ ] Push notification payloads contain no resident names; no `console.log` of user/PII objects; page-view geolocation disabled by default or covered by the DPIA (C-09)

### Authentication and authorisation
- [ ] Application refuses to start without `JWT_SECRET` (≥32 bytes), `ENCRYPTION_KEY` and `AUDIT_SIGNING_KEY`; production secrets rotated (D-04, E-02, C-03)
- [ ] MFA re-implemented and enforced server-side; mandatory for Admin/Manager/SuperAdmin (D-02)
- [ ] Throttling on auth and public routes; lockout/backoff after 5–10 failures with `FAILED_LOGIN` audit events (D-01, E-05)
- [ ] Cross-tenant e2e tests pass for observations and every resident-scoped module; no bare-id lookups on tenant models (D-07)
- [ ] `canAccessResident()` enforced on observations, eMAR, care plans, documents (D-08)
- [ ] `RolesGuard` applied to `AuditController`; every audit route returns 403 for Carer; `?token=` extractor removed (D-06, D-03)
- [ ] Deactivated users lose API access within seconds (D-09)

### Application and infrastructure security
- [ ] CORS allow-list active; helmet headers present; securityheaders.com grade A (E-04)
- [ ] Upload MIME allow-list, size limits, forced download, malware scanning (E-07)
- [ ] No untyped `@Body()` in `apps/backend/src` (E-06)
- [ ] Swagger disabled in production (E-16)
- [ ] TLS configuration committed; SSL Labs A (E-01)
- [ ] Hosting inventory with regions committed; GCS bucket location constrained to UK/EEA (H-01)
- [ ] DB not internet-exposed; least-privilege DB roles documented (E-08)
- [ ] CI runs tests (unit + tenant/RBAC e2e) and dependency audit; production deploy only from approved release after green CI (E-12, E-14, E-11)
- [ ] Independent penetration test completed with no open high/critical findings (E-13)

### Clinical records and operational safety
- [ ] Clinical Safety Officer appointed; hazard log and clinical safety case report signed (I-02)
- [ ] Medical-device intended-purpose statements and classification memo signed (I-01)
- [ ] Critical alerts require acknowledgement and escalate on timeout; delivery results logged (I-05)
- [ ] No hard delete of medication rounds with administrations; correction workflow preserves originals (C-07, B-06)
- [ ] Read-audit covers all resident-scoped GETs and both document stream routes; nightly integrity verification alerting (C-04, C-03)
- [ ] Downtime procedure and printable MAR/handover pack available to tenants (I-06)
- [ ] Safeguarding record and complaints workflow available (G-06, G-09)

### Monitoring, incident response, backup and recovery
- [ ] Structured logs shipped to a UK-region store; alerts on failed-login bursts, bulk resident reads and 5xx spikes (E-09, D-12)
- [ ] Backup configuration documented; restore test performed and recorded with RTO/RPO met (E-10)

### Customer onboarding and contractual readiness
- [ ] Onboarding flow captures DPA acceptance, tenant IG lead contact and MFA policy (A-02, B-13)
- [ ] Tenant evidence pack: privacy notice templates, DPIA template, downtime procedure, sub-processor list (A-04, F-01)
- [ ] Marketing and sales material contain no claims of NHS assurance, DSCR assurance or CQC compliance (F-04, G-*)

## Gate B – Required before paid / public launch

### Legal and governance
- [ ] RoPA regenerated from schema and legally reviewed; LIA for enquiries (A-03, B-01)
- [ ] Appropriate policy document for staff health and DBS data (B-02)
- [ ] DPO appointment, ICO notification and data protection fee evidenced (A-05, A-06)
- [ ] Policy set approved; training log complete for all staff with production access (A-10)
- [ ] Sub-processor register complete (incl. Resend, AWS SNS) with contract references and assurance evidence (A-11, H-04)
- [ ] Evidence index keyed to finding IDs; risk register; internal audit scheduled (A-12)

### Data protection and resident rights
- [ ] Granular consent model with withdrawal and history (B-03)
- [ ] Representative entity used to gate rights requests (B-04)
- [ ] Tenant export and purge with destruction certificate (H-05)
- [ ] Marketing opt-out and objection handling (B-09)

### Authentication and authorisation
- [ ] Break-glass access with review queue (D-10)
- [ ] Tenant-consented, logged support sessions; privileged-access register (H-06, D-11)

### Application and infrastructure security
- [ ] Secrets in a secrets manager/KMS; rotation runbook tested; gitleaks in CI (E-02, E-03)
- [ ] Field encryption extended to DBS, health clearance, DOB, NOK (E-02, G-12)
- [ ] Production/non-production data policy and masking script (E-15)

### Clinical records and operational safety
- [ ] Late-entry flags and record history visible beside entries (C-01, C-02)
- [ ] Wound/body map; medicines stock and CD register; visitor log; equipment/PEEP registers (G-04, G-05, G-02, G-08)
- [ ] Death and DoLS-outcome CQC notification prompts (G-14)

### DSPT and external assurance
- [ ] Vendor DSPT (IT Supplier) published at Standards Met (F-02)
- [ ] DTAC or successor pack assembled (F-09)
- [ ] Accessibility audit complete; statement published (I-04)
- [ ] MODS mapping documented; decision on Assured Solutions List recorded (F-05, F-04)

### Monitoring, incident response, backup and recovery
- [ ] Tabletop breach exercise completed and lessons recorded (E-17)
- [ ] Quarterly access-review export in use (D-09)

### Customer onboarding and contractual readiness
- [ ] DCB0160 deployment safety pack and release notes with safety impact (I-03)
- [ ] DSPT evidence pack for tenants (F-01)

## Gate definitions

| Gate | Pass condition |
|---|---|
| A | Every Gate A box ticked with linked evidence (test output, document, or screenshot) in the evidence index; pen-test report shows no open high/critical; CSO and DPO sign-off recorded. |
| B | Gate A maintained plus every Gate B box ticked; DSPT published; counsel sign-off on DPA/notices/transfer instruments. |

Operating with real resident data while Gate A is open would mean knowingly running with confirmed cross-tenant exposure, bypassable MFA, default-able secrets and no lawful processing contract. That is not a risk decision this report can recommend be delegated below board level.
