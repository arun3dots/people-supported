> Part of the Cantra Care / LCM compliance audit. **Re-audited 4 November 2026, 23:20 IST** at `sobin/compliances-V0` `b3caf619`; last audit 4 Nov 21:50 (`develop` `6f33c164`); earlier passes 24 Oct, 29 Oct AM and PM. See `00-README.md` for scope, method and limits.


# Deliverable 4 – Detailed findings

Every WEAK, MISSING and UNABLE TO VERIFY item, in priority order, with the full evidence record required by the brief. ADEQUATE items are listed at the end with the reason they did not reach STRONG. No item reached STRONG (see `02-dashboard.md`).

Fields: requirement · reference and source · applicability and reasoning · status / confidence · repository evidence (paths and lines) · what was inspected · gap or risk · remediation · acceptance criteria · owner · priority and rationale · dependencies · independent review needed.


### A-02 — Article 28 processor contract (customer DPA)

- **Domain:** A. Governance and accountability
- **Requirement:** A written contract with each tenant containing all Art 28(3)(a)-(h) terms, sub-processor authorisation (28(2)) and flow-down (28(4)).
- **Reference:** UK GDPR Art 28(2)-(4) — Binding law. Source: [UK GDPR Article 28 – Processor](https://www.legislation.gov.uk/eur/2016/679/article/28) (legislation.gov.uk; Revised text; page modified 2026-10-05; checked 2026-10-24).
- **Applicability:** Applicable — responsible: Vendor. Vendor processes special-category data for tenants.
- **Status / confidence:** **WEAK** / High
- **Change since last audit (4 Nov 21:50):** WEAK → WEAK; Unchanged
- **Repository evidence:** apps/web/app/dpa/page.tsx (Art 28(3) terms; controller field '[Care Home Legal Name] (CQC Provider ID: [1-XXXXXXX])' is a template placeholder) — still lists GCS as storage. POST /api/organization/accept-dpa stores version/time/email and emits DPA_ACCEPTED; ACCEPT_DPA endpoint key exists but no web component calls it; onboarding does not require acceptance.
- **Inspected:** grep for 'dpa', 'processing agreement', 'acceptTerms' across apps/web and schema.
- **Gap / risk:** No tenant can currently accept the DPA through the product; placeholder in contract text; no counsel review.
- **Remediation:** Wire DPA acceptance into onboarding and block use until accepted; fill placeholder; counsel review; migration.
- **Acceptance criteria:** New tenant cannot proceed without accepting; acceptance visible in audit log.
- **Owner:** Compliance
- **Priority:** P0 Critical
- **Dependencies:** E-19,H-01
- **Independent review required:** Legal

### A-09 — DPIA procedure and platform DPIA

- **Domain:** A. Governance and accountability
- **Requirement:** A DPIA is mandatory for large-scale processing of special-category data and processing of vulnerable individuals' data (Art 35(3)(b); ICO Art 35(4) list). Keep a screening procedure for new features.
- **Reference:** UK GDPR Art 35-36; ICO DPIA list — Regulatory guidance. Source: [When do we need to do a DPIA?](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/data-protection-impact-assessments-dpias/when-do-we-need-to-do-a-dpia/) (ICO; 13 Oct 2025; under review for DUAA; checked 2026-10-24).
- **Applicability:** Applicable — responsible: Both. Large-scale health data of vulnerable residents, plus staff geolocation tracking (an ICO listed trigger).
- **Status / confidence:** **WEAK** / High
- **Change since last audit (4 Nov 21:50):** WEAK → WEAK; Unchanged
- **Repository evidence:** docs/compliance/A-09-platform-dpia-and-tenant-template.md (74 lines): screening, processing description, necessity, risk register, sign-off, tenant annex. §5 states 'DPO Sign-Off: Approved for Phase 0 Production Release (Residual Risk: Low)' with no signatory or date, and says review is 'enforced via .github/PULL_REQUEST_TEMPLATE.md', which contains no privacy items.
- **Inspected:** Both workbooks read in full; repo search for 'dpia'.
- **Gap / risk:** Not a signed DPIA; residual-risk conclusion contradicts open P0 findings; claims a PR-template control that does not exist.
- **Remediation:** Complete with named DPO sign-off and date after Phase 0; correct the PR-template claim or add the checklist.
- **Acceptance criteria:** Signed and dated DPIA whose risk register matches the open findings.
- **Owner:** Compliance
- **Priority:** P0 Critical
- **Dependencies:** None
- **Independent review required:** Legal

### A-14 — Accuracy and attribution of compliance records

- **Domain:** A. Governance and accountability
- **Requirement:** Compliance records (DPIA, breach register, registrations, clinical safety sign-offs, transfer instruments) must be accurate and attributable to real, accountable people and entities (UK GDPR Art 5(2), 24, 30, 33(5)).
- **Reference:** UK GDPR Art 5(2), 24, 30, 33(5); DCB0129 §2 (CSO) — Binding law. Source: [Regulation (EU) 2016/679 (UK GDPR) – latest available (revised)](https://www.legislation.gov.uk/eur/2016/679) (legislation.gov.uk; Revised text; page modified 2026-10-05; checked 2026-10-24).
- **Applicability:** Applicable — responsible: Vendor. These records are what the ICO, CQC, NHS buyers and care homes will rely on.
- **Status / confidence:** **WEAK** / High
- **Change since last audit (4 Nov 21:50):** — → WEAK; New — New finding: several compliance documents state names, numbers and signatures that are not evidenced.
- **Repository evidence:** docs/compliance: I-02 signed endorsement by 'Dr. Marcus Thorne (GMC #6129845)' with no appointment record; A-05 ICO registration ZB894102 and 'CantraCare Technologies Ltd, 100 Bishopsgate' not found in public search and contradicting the legal checklist (entity not incorporated, ICO fee pending) and earlier docs ('CantraCare UK Ltd'); H-01 certifies eu-west-2 while code defaults to eu-north-1; E-17 breach record understates E-18 (7 synthetic entries vs 473 events since 29 Apr); A-09 DPIA 'DPO approved' without name or date; H-02 'executed' IDTA without the instrument.
- **Inspected:** All docs/compliance files; public web search for the ICO number and company name.
- **Gap / risk:** If any of these names, numbers or signatures are not real, sharing these documents with a care home, the ICO or CQC would misrepresent the organisation's compliance position.
- **Remediation:** Confirm each named person, number and signature with evidence, or replace with placeholders and mark the document DRAFT; correct E-17 and H-01; keep a document-control table (owner, approver, date, version).
- **Acceptance criteria:** Every signature, registration and entity in docs/compliance links to evidence in the evidence folder, or the document is marked DRAFT.
- **Owner:** Compliance
- **Priority:** P0 Critical
- **Dependencies:** None
- **Independent review required:** Legal

### E-05 — Rate limiting and abuse protection

- **Domain:** E. Data security and infrastructure
- **Requirement:** Throttle authentication, OTP, password reset, public endpoints and webhooks.
- **Reference:** UK GDPR Art 32 — Binding law. Source: [Regulation (EU) 2016/679 (UK GDPR) – latest available (revised)](https://www.legislation.gov.uk/eur/2016/679) (legislation.gov.uk; Revised text; page modified 2026-10-05; checked 2026-10-24).
- **Applicability:** Applicable — responsible: Vendor.
- **Status / confidence:** **WEAK** / High
- **Change since last audit (4 Nov 21:50):** WEAK → WEAK; Changed — nginx config confirms the backend runs behind a proxy, so the missing `trust proxy` setting is now a confirmed defect. P1→P0.
- **Repository evidence:** ops/nginx/cantra-care.conf proxies to the backend and sets X-Forwarded-For; the app never calls app.set('trust proxy'). ThrottlerGuard therefore sees the proxy address for every user: the 5/min limit on POST login, MFA verify, forgot-password and verify-otp applies to the whole site, and audit logs record the proxy IP.
- **Inspected:** Dependencies; controllers.
- **Gap / risk:** After 5 logins in a minute across the whole home, every further login is refused; at shift change staff cannot reach eMAR.
- **Remediation:** app.set('trust proxy', 1) (or the exact hop count) in main.ts; test that two clients behind nginx are throttled separately.
- **Acceptance criteria:** Integration test behind nginx shows per-client limits and real client IPs in audit.
- **Owner:** Backend
- **Priority:** P0 Critical
- **Dependencies:** None
- **Independent review required:** Security

### E-17 — Incident response and disaster recovery plan

- **Domain:** E. Data security and infrastructure
- **Requirement:** Written IR plan with roles, 72-hour breach assessment, processor→controller notification, DR runbook.
- **Reference:** UK GDPR Art 33-34; DSPT (NDG standard 6/7) — Regulatory guidance. Source: [Personal data breaches: a guide](https://ico.org.uk/for-organisations/report-a-breach/personal-data-breach/personal-data-breaches-a-guide/) (ICO; 20 Aug 2025; checked 2026-10-24).
- **Applicability:** Applicable — responsible: Both.
- **Status / confidence:** **WEAK** / High
- **Change since last audit (4 Nov 21:50):** WEAK → WEAK; Unchanged
- **Repository evidence:** docs/compliance/E-17-incident-response-and-disaster-recovery-sop.md (66 lines): 72-hour workflow, detection triggers, DR/RPO/RTO, breach register. §4 (INC-2026-10-29-E18) records 7 synthetic PAGE_VIEW entries tracked in 6d25c2ea and concludes ICO notification not required; the committed file actually holds 473 events (471 with emails, 165 with GPS), first committed 2026-04-29 (f8297658), still on origin/master. Committed unchanged in 3b4ad6b3.
- **Inspected:** Repo; workbooks (Breach Log template empty).
- **Gap / risk:** The first real use of the process produced an inaccurate record and a decision based on it; no owner named; no tabletop.
- **Remediation:** Correct the E-18 entry and re-take the notification decision; name the breach owner; run a tabletop.
- **Acceptance criteria:** Register entry matches the repository facts; decision signed by the accountable person.
- **Owner:** Security
- **Priority:** P0 Critical
- **Dependencies:** None
- **Independent review required:** Legal

### E-18 — No personal data in source control

- **Domain:** E. Data security and infrastructure
- **Requirement:** Personal data must not be stored in repositories or developer tooling outside approved, secured stores; repository access is a disclosure.
- **Reference:** UK GDPR Art 5(1)(f), 32, 33 — Regulatory guidance. Source: [Personal data breaches: a guide](https://ico.org.uk/for-organisations/report-a-breach/personal-data-breach/personal-data-breaches-a-guide/) (ICO; 20 Aug 2025; checked 2026-10-24).
- **Applicability:** Applicable — responsible: Vendor. Vendor controls the repository.
- **Status / confidence:** **WEAK** / High
- **Change since last audit (4 Nov 21:50):** WEAK → WEAK; Unchanged
- **Repository evidence:** apps/backend/audit-dead-letter.jsonl and cookies.txt absent at HEAD 6f33c164 and on origin/develop and origin/feature; STILL PRESENT on origin/master (git cat-file) and in history since f8297658 (2026-04-29). .gitignore covers *dead-letter*.jsonl. E-17 breach record unchanged (see E-17).
- **Inspected:** git ls-files, git branch -r --contains, field/count analysis of the file without printing values.
- **Gap / risk:** Personal data remains readable on origin/master and in history; the breach decision still rests on inaccurate facts.
- **Remediation:** Merge the removal to master; decide on history purge; correct the breach record and re-take the notification decision.
- **Acceptance criteria:** File absent from every remote branch; corrected record signed by the accountable person.
- **Owner:** Security
- **Priority:** P0 Critical
- **Dependencies:** E-17
- **Independent review required:** Legal, Security

### E-19 — Database migrations for schema changes

- **Domain:** E. Data security and infrastructure
- **Requirement:** Every schema change must ship with a migration so production matches the code that runs against it.
- **Reference:** UK GDPR Art 32(1)(b)-(c) (availability, integrity); NCSC secure development — Recommended practice. Source: [The cloud security principles](https://www.ncsc.gov.uk/collection/cloud/the-cloud-security-principles) (NCSC; Reviewed 7 Jun 2023 (v2.1); checked 2026-10-24).
- **Applicability:** Applicable — responsible: Vendor. deploy.sh runs prisma migrate deploy, which applies only committed migration files.
- **Status / confidence:** **MISSING** / High
- **Change since last audit (4 Nov 21:50):** ADEQUATE → MISSING; Regressed — Commit 0288535b adds 8 new models/fields to schema.prisma with no migration. ADEQUATE→MISSING.
- **Repository evidence:** schema.prisma (b3caf619) adds ResidentConsentItem, ControlledDrugRegister, MedicationStockLedger, SafeguardingReferral, Complaint, TenantRetentionPolicy, Resident.recordState and BodyMapFinding.pressureUlcerCategory/measurements; newest migration is still 20261103090000_add_care_journey_assessment_plans_tasks. No CI step checks schema/migration drift.
- **Inspected:** schema diff vs HEAD; migrations folder; guard query.
- **Gap / risk:** Deployed as-is, every feature added in 0288535b fails at runtime, and any query that selects Resident.recordState (observations, body map, controlled drugs) breaks.
- **Remediation:** Generate and commit the migration; add `prisma migrate diff --exit-code` to CI.
- **Acceptance criteria:** Migration present; CI fails on schema drift.
- **Owner:** Backend
- **Priority:** P0 Critical
- **Dependencies:** None
- **Independent review required:** None

### H-02 — International transfers and remote access from India

- **Domain:** H. Third parties, hosting and transfers
- **Requirement:** Remote access to UK data from India is a restricted transfer; needs IDTA/Addendum + TRA (or adequacy – India has none). Razorpay (India) and Expo/Firebase (US) likewise.
- **Reference:** UK GDPR Art 44-46; DUAA s.85 (data protection test); ICO brief guide 15 Jan 2026 — Regulatory guidance. Source: [A brief guide to international transfers](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/international-transfers/international-transfers-a-guide/) (ICO; 15 Jan 2026; checked 2026-10-24).
- **Applicability:** Applicable — responsible: Vendor. Developers/support based in India; India-based payment processor.
- **Status / confidence:** **UNABLE TO VERIFY** / Low
- **Change since last audit (4 Nov 21:50):** UNABLE TO VERIFY → UNABLE TO VERIFY; Unchanged
- **Repository evidence:** docs/compliance/H-02-international-transfers-idta-and-tra.md (44 lines): residency, transfer inventory, TRA. States the IDTA is 'executed between CantraCare UK Ltd and 3Dots India entity' and that engineers cannot decrypt because the key is in a UK Secret Manager. Cantra_UK_Launch_Legal_Checklist-01.xlsx item 1.1 (UK entity) is 'Not started'. No signed instrument found.
- **Inspected:** Workbooks; deps.
- **Gap / risk:** Claims of execution and key custody are unsupported.
- **Remediation:** Attach the signed IDTA/Addendum and TRA, or mark the document as draft.
- **Acceptance criteria:** Signed instruments in the evidence folder.
- **Owner:** Compliance
- **Priority:** P0 Critical
- **Dependencies:** A-02
- **Independent review required:** Legal

### A-03 — Record of processing activities (RoPA)

- **Domain:** A. Governance and accountability
- **Requirement:** Maintain Art 30 records as processor (categories per controller, transfers, security measures) and as controller for own processing.
- **Reference:** UK GDPR Art 30(1)-(2) — Binding law. Source: [Regulation (EU) 2016/679 (UK GDPR) – latest available (revised)](https://www.legislation.gov.uk/eur/2016/679) (legislation.gov.uk; Revised text; page modified 2026-10-05; checked 2026-10-24).
- **Applicability:** Applicable — responsible: Both. Large-scale special-category processing; the small-enterprise exemption in Art 30(5) does not apply.
- **Status / confidence:** **WEAK** / High
- **Change since last audit (4 Nov 21:50):** WEAK → WEAK; Changed — Statutory RoPA document added; it names an unverified controller entity.
- **Repository evidence:** docs/compliance/A-03-record-of-processing-activities-ropa.md (116 lines) covers Art 30(1) and 30(2); names 'CantraCare Technologies Ltd'; coverage of all 70+ Prisma models not verified. Document claims are not evidenced (see A-14).
- **Inspected:** schema model list vs RoPA rows; encryption extension in packages/db/src/index.ts lines 30-65.
- **Gap / risk:** Incomplete inventory (e.g. StaffTraining, Handover, Enquiry assessmentData, CqcAuditLog geolocation not covered) and one inaccurate security claim.
- **Remediation:** Regenerate RoPA from the Prisma schema; add recipients, roles with access, retention, and correct encryption column; keep as a versioned doc.
- **Acceptance criteria:** Every Prisma model that holds personal data appears in the RoPA with a lawful basis, Art 9 condition, retention and security measure; DOB row corrected.
- **Owner:** Compliance
- **Priority:** P1 High
- **Dependencies:** None
- **Independent review required:** Legal

### A-04 — Privacy notices (platform and template for tenants)

- **Domain:** A. Governance and accountability
- **Requirement:** Provide Art 13/14 information at collection to staff users, tenant admins, enquirers and (via the provider) residents and representatives.
- **Reference:** UK GDPR Art 12-14 — Binding law. Source: [Regulation (EU) 2016/679 (UK GDPR) – latest available (revised)](https://www.legislation.gov.uk/eur/2016/679) (legislation.gov.uk; Revised text; page modified 2026-10-05; checked 2026-10-24).
- **Applicability:** Applicable — responsible: Both. Vendor collects staff-user and tenant-contact data directly; provider needs resident/staff notices the product can help deliver.
- **Status / confidence:** **WEAK** / High
- **Change since last audit (4 Nov 21:50):** WEAK → WEAK; Unchanged — Privacy notice still names Google Cloud as the file store.
- **Repository evidence:** apps/web/app/privacy-policy/page.tsx still lists Google Cloud / europe-west2 (London) as the storage sub-processor and location (3 mentions each) and does not mention AWS S3. Since commit 0c88d3e7 all file storage uses S3StorageService (GcsService is now an alias), with region from AWS_REGION defaulting to eu-north-1 (Stockholm) (common/utils/aws-config.util.ts:22). Notice is otherwise substantive and linked from login; no cookie notice.
- **Inspected:** find for *privacy*, *terms*, *cookie* under apps/web/app and apps/mobile-v1; grep 'privacy' in page components.
- **Gap / risk:** Data subjects and tenants are told the wrong storage provider and location.
- **Remediation:** Update the notice, DPA sub-processor schedule and H-02 document to AWS S3 and the actual region; add a step to the release checklist that sub-processor changes update the notices.
- **Acceptance criteria:** Notice, DPA and register name AWS S3 and the configured region.
- **Owner:** Product
- **Priority:** P1 High
- **Dependencies:** A-02,H-01
- **Independent review required:** Legal

### A-05 — Data Protection Officer

- **Domain:** A. Governance and accountability
- **Requirement:** Designate a DPO where core activities consist of large-scale processing of special-category data (Art 37(1)(c)); publish contact details; notify ICO.
- **Reference:** UK GDPR Art 37-39 — Binding law. Source: [Regulation (EU) 2016/679 (UK GDPR) – latest available (revised)](https://www.legislation.gov.uk/eur/2016/679) (legislation.gov.uk; Revised text; page modified 2026-10-05; checked 2026-10-24).
- **Applicability:** Applicable — responsible: Both. Core activity is processing health data at scale for multiple care homes.
- **Status / confidence:** **UNABLE TO VERIFY** / Low
- **Change since last audit (4 Nov 21:50):** UNABLE TO VERIFY → UNABLE TO VERIFY; Changed — DPO designation document added for 'CantraCare Technologies Ltd, 100 Bishopsgate'; no appointment evidence.
- **Repository evidence:** docs/compliance/A-05-dpo-ico-registration-and-uk-representative.md: DPO designation, postal address 100 Bishopsgate, London. Company name differs from earlier documents ('CantraCare UK Ltd'); legal checklist 1.1 (UK entity) 'Not started'. Document claims are not evidenced (see A-14).
- **Inspected:** Both workbooks; grep 'dpo' in apps/web.
- **Gap / risk:** Appointment is asserted but not evidenced; no published contact.
- **Remediation:** File the appointment record; publish DPO contact in /privacy; record ICO notification.
- **Acceptance criteria:** Appointment letter and ICO notification reference held in evidence folder; contact visible in privacy notice.
- **Owner:** Compliance
- **Priority:** P1 High
- **Dependencies:** A-04
- **Independent review required:** None

### A-06 — ICO data protection fee / registration

- **Domain:** A. Governance and accountability
- **Requirement:** Pay the ICO data protection fee for controller processing (Data Protection (Charges and Information) Regulations 2018).
- **Reference:** DP (Charges and Information) Regs 2018 — Binding law. Source: [Data Protection Act 2018](https://www.legislation.gov.uk/ukpga/2018/12/contents) (legislation.gov.uk; As amended; checked 2026-10-24).
- **Applicability:** Applicable — responsible: Both. Vendor is a controller for its own platform-account and billing data.
- **Status / confidence:** **UNABLE TO VERIFY** / Low
- **Change since last audit (4 Nov 21:50):** UNABLE TO VERIFY → UNABLE TO VERIFY; Changed — Document states ICO registration ZB894102 for 'CantraCare Technologies Ltd'; not found in public search; legal checklist says registration pending.
- **Repository evidence:** docs/compliance/A-05-dpo-ico-registration-and-uk-representative.md §2.1: registration ZB894102, Tier 3 fee (turnover > £25.9M or > 250 staff), auto-renewal. A web search found no such entry; Cantra_UK_Launch_Legal_Checklist-01.xlsx 3.2 'pending'. Document claims are not evidenced (see A-14).
- **Inspected:** Workbook only.
- **Gap / risk:** No registration number found.
- **Remediation:** Pay the fee; record the registration number in the privacy notice.
- **Acceptance criteria:** ICO registration number present in /privacy and evidence folder.
- **Owner:** Compliance
- **Priority:** P1 High
- **Dependencies:** None
- **Independent review required:** None

### A-07 — UK representative (Art 27) / contracting entity

- **Domain:** A. Governance and accountability
- **Requirement:** If the contracting entity has no UK establishment and offers services to UK data subjects, appoint a UK representative.
- **Reference:** UK GDPR Art 27 — Binding law. Source: [Regulation (EU) 2016/679 (UK GDPR) – latest available (revised)](https://www.legislation.gov.uk/eur/2016/679) (legislation.gov.uk; Revised text; page modified 2026-10-05; checked 2026-10-24).
- **Applicability:** Conditionally applicable — responsible: Vendor. Depends on whether a UK Ltd is incorporated (legal checklist 1.1 not started).
- **Status / confidence:** **UNABLE TO VERIFY** / Low
- **Change since last audit (4 Nov 21:50):** UNABLE TO VERIFY → UNABLE TO VERIFY; Unchanged
- **Repository evidence:** Legal checklist items 1.1 (Not started) and 3.3 (In progress).
- **Inspected:** Workbook only.
- **Gap / risk:** Contracting entity undecided; obligation cannot be closed.
- **Remediation:** Decide the contracting entity; appoint a representative if required and name them in the privacy notice.
- **Acceptance criteria:** Decision memo on file; representative agreement or exemption note.
- **Owner:** Compliance
- **Priority:** P1 High
- **Dependencies:** None
- **Independent review required:** Legal

### A-10 — Data protection and security policy set, staff training

- **Domain:** A. Governance and accountability
- **Requirement:** Documented policies (data protection, access control, retention, breach, acceptable use) and training for vendor staff with access to tenant data (Art 32(4), 39(1)(b)).
- **Reference:** UK GDPR Art 24, 32(4), 39 — Binding law. Source: [Regulation (EU) 2016/679 (UK GDPR) – latest available (revised)](https://www.legislation.gov.uk/eur/2016/679) (legislation.gov.uk; Revised text; page modified 2026-10-05; checked 2026-10-24).
- **Applicability:** Applicable — responsible: Both. Vendor personnel (incl. India-based developers/support) can access production data.
- **Status / confidence:** **WEAK** / Low
- **Change since last audit (4 Nov 21:50):** UNABLE TO VERIFY → WEAK; Changed — Information security and data protection policy pack added; approval and training evidence absent. UNABLE TO VERIFY→WEAK.
- **Repository evidence:** docs/compliance/A-10-information-security-and-data-protection-policy.md (86 lines) references ISO 27001 controls and Cyber Essentials Plus; no approval record, acknowledgements or training log. Document claims are not evidenced (see A-14).
- **Inspected:** Repo and workbooks.
- **Gap / risk:** No approved policies or training records evidenced.
- **Remediation:** Approve the policy set; run and log data-protection training for all staff with production access.
- **Acceptance criteria:** Policy set with owners and review dates; training completion log for 100% of staff with production access.
- **Owner:** Compliance
- **Priority:** P1 High
- **Dependencies:** None
- **Independent review required:** None

### A-11 — Sub-processor governance

- **Domain:** A. Governance and accountability
- **Requirement:** Maintain a sub-processor list, obtain tenant authorisation (general with notice), flow down Art 28 terms, and do due diligence.
- **Reference:** UK GDPR Art 28(2),(4) — Binding law. Source: [UK GDPR Article 28 – Processor](https://www.legislation.gov.uk/eur/2016/679/article/28) (legislation.gov.uk; Revised text; page modified 2026-10-05; checked 2026-10-24).
- **Applicability:** Applicable — responsible: Vendor. Vendor uses GCS, AWS SES/SNS, Resend, Razorpay, Firebase, Expo, Redis.
- **Status / confidence:** **WEAK** / High
- **Change since last audit (4 Nov 21:50):** WEAK → WEAK; Changed — Sub-processor register document added; privacy notice and DPA still name Google Cloud.
- **Repository evidence:** docs/compliance/A-11-subprocessor-register-and-dpa-tracker.md (68 lines) with 30-day notice mechanism; lists AWS eu-west-2; privacy-policy and DPA pages still name Google Cloud (3 and 2 mentions). No signed DPAs on file.
- **Inspected:** package.json deps, mail.service.ts, aws-sns.provider.ts, workbook.
- **Gap / risk:** Register incomplete; no contracts or security assurance collected; no tenant notification mechanism.
- **Remediation:** Complete the register (add Resend, AWS SNS); collect each vendor's DPA/terms and security attestations; publish the list in /privacy and the DPA; define a change-notice process.
- **Acceptance criteria:** Register covers every outbound integration in code; each row has a contract reference and assurance evidence.
- **Owner:** Compliance
- **Priority:** P1 High
- **Dependencies:** A-02
- **Independent review required:** Legal

### B-07 — Erasure, restriction and legal hold

- **Domain:** B. Lawful processing and resident rights
- **Requirement:** Support erasure requests with the health-record exemption (Art 17(3)(c)), restriction of processing (Art 18) and legal hold during disputes/inquests.
- **Reference:** UK GDPR Art 17, 18, 19 — Binding law. Source: [Regulation (EU) 2016/679 (UK GDPR) – latest available (revised)](https://www.legislation.gov.uk/eur/2016/679) (legislation.gov.uk; Revised text; page modified 2026-10-05; checked 2026-10-24).
- **Applicability:** Applicable — responsible: Both.
- **Status / confidence:** **WEAK** / High
- **Change since last audit (4 Nov 21:50):** MISSING → WEAK; Improved — Resident recordState (Active/Archived/Restricted/LegalHold) blocks new writes to observations, body maps and controlled drugs. MISSING→WEAK. Depends on a migration that does not exist yet (E-19).
- **Repository evidence:** Resident.recordState; enforced on writes in observations.service.ts:41-44,133-137, body-map.service.ts:54, controlled-drug.service.ts:38. Not enforced on reads, eMAR, care plans, documents or incidents; no erasure-request log with exemption reasons.
- **Inspected:** Schema enums; grep 'restrict', 'legalHold'.
- **Gap / risk:** Restricted and legal-hold records stay readable by all roles and editable in most modules.
- **Remediation:** Add recordState (Active, Archived, Restricted, LegalHold) with reason and actor; enforce in query layer; add an erasure request log with exemption reason.
- **Acceptance criteria:** Restricted/hold records are read-only except for Admin/DPO; request log holds decisions.
- **Owner:** Backend
- **Priority:** P1 High
- **Dependencies:** E-19
- **Independent review required:** Legal

### B-10 — Retention schedule and disposal

- **Domain:** B. Lawful processing and resident rights
- **Requirement:** Retain no longer than necessary (Art 5(1)(e)); apply Records Management Code minimums (adult social care records 8 years then review; records never auto-destroyed without documented appraisal; destruction evidence).
- **Reference:** UK GDPR Art 5(1)(e); Records Management Code of Practice 2021/2023 — Code of practice (recommended; contractual for NHS-funded care). Source: [Records Management Code of Practice for Health and Social Care](https://transform.england.nhs.uk/information-governance/guidance/records-management-code/records-management-code-of-practice/) (NHS England Transformation Directorate; Published 4 Aug 2021; updated 7 Aug 2023; checked 2026-10-24).
- **Applicability:** Applicable — responsible: Both. Code applies to adult social care; retention is a controller decision the product must enable.
- **Status / confidence:** **WEAK** / High
- **Change since last audit (4 Nov 21:50):** MISSING → WEAK; Improved — Nightly retention job purges expired tokens and reset requests; TenantRetentionPolicy model added. MISSING→WEAK. Depends on a migration that does not exist yet (E-19).
- **Repository evidence:** jobs/retention-purge.worker.ts @Cron 03:00 deletes expired RefreshToken, PasswordReset, MfaResetRequest rows and updates TenantRetentionPolicy; no appraisal of care records, enquiries or discharged residents past their retention period.
- **Inspected:** All @Cron decorators listed; schema.
- **Gap / risk:** Care records, enquiries and audit data are still kept indefinitely with no appraisal queue.
- **Remediation:** Add per-record-type retention config per tenant with Code defaults; nightly job flags records past retention for appraisal; destruction only after approval, with a destruction certificate event; purge expired tokens and reset records automatically.
- **Acceptance criteria:** Retention config visible to tenant admin; appraisal queue works on seeded data; expired RefreshToken rows purged nightly.
- **Owner:** Backend
- **Priority:** P1 High
- **Dependencies:** E-19
- **Independent review required:** Legal

### B-13 — Common-law duty of confidentiality and Caldicott principles

- **Domain:** B. Lawful processing and resident rights
- **Requirement:** Confidential patient information must be used only for direct care or with a lawful basis; access on a need-to-know basis.
- **Reference:** Common law of confidence; Caldicott Principles (NDG) — Information standard (HSCA 2012 s.250); contractual via NHS Standard Contract. Source: [Data Security and Protection Toolkit – NHS Standards Directory (DAPB0086 Amd 21/2025, v8.0.0)](https://standards.nhs.uk/published-standards/data-security-and-protection-toolkit) (NHS England; Effective 1 Aug 2025; page updated 13 May 2026; checked 2026-10-24).
- **Applicability:** Applicable — responsible: Both. Health records of identifiable residents.
- **Status / confidence:** **WEAK** / Medium
- **Change since last audit (4 Nov 21:50):** WEAK → WEAK; Unchanged
- **Repository evidence:** Carer scoping to assigned residents exists for resident lists (apps/backend/src/residents/services/resident-query.service.ts:68-110) but observations module ignores it (observations.service.ts queries by bare residentId). No Caldicott Guardian concept for tenants.
- **Inspected:** Query services.
- **Gap / risk:** Need-to-know not enforced consistently; see D-07.
- **Remediation:** Enforce assignment-based access in all clinical modules; add a tenant 'IG lead / Caldicott Guardian' role attribute.
- **Acceptance criteria:** Carer cannot read observations of unassigned residents (test).
- **Owner:** Backend
- **Priority:** P1 High
- **Dependencies:** D-07
- **Independent review required:** None

### C-04 — Audit coverage of reads, exports and document views

- **Domain:** C. Resident health and care records
- **Requirement:** Log who viewed which resident record and when (NDG standard 1; DSPT 'access to records').
- **Reference:** DSPT v8; UK GDPR Art 5(2) — Information standard. Source: [Outcomes, Assertions and Evidence items for the DSPT 2025-26 version 8](https://www.dsptoolkit.nhs.uk/News/161) (NHS England (dsptoolkit.nhs.uk); Published 18 Sep 2025; deadline 30 Jun 2026; checked 2026-10-24).
- **Applicability:** Applicable — responsible: Vendor.
- **Status / confidence:** **WEAK** / High
- **Change since last audit (4 Nov 21:50):** WEAK → WEAK; Unchanged
- **Repository evidence:** emitDataAccess now also in observations.controller.ts; still absent from documents.controller.ts streamDocumentByPath and body-map.controller.ts streamPhoto; eMAR, incidents and care-plan reads unlogged.
- **Inspected:** grep emitDataAccess; controller read.
- **Gap / risk:** Most clinical reads are not attributable; a 'who looked at this resident' report would be incomplete.
- **Remediation:** Add a read-audit interceptor for all resident-scoped GET routes and both document stream routes; include export events.
- **Acceptance criteria:** Resident-access report lists every GET of that resident's data in a test session.
- **Owner:** Backend
- **Priority:** P1 High
- **Dependencies:** None
- **Independent review required:** None

### C-09 — Data minimisation in dashboards, notifications, exports and logs

- **Domain:** C. Resident health and care records
- **Requirement:** Show and send only what the recipient needs; avoid identifiers in push/email/logs.
- **Reference:** UK GDPR Art 5(1)(c), 25 — Binding law. Source: [Regulation (EU) 2016/679 (UK GDPR) – latest available (revised)](https://www.legislation.gov.uk/eur/2016/679) (legislation.gov.uk; Revised text; page modified 2026-10-05; checked 2026-10-24).
- **Applicability:** Applicable — responsible: Vendor.
- **Status / confidence:** **WEAK** / Medium
- **Change since last audit (4 Nov 21:50):** WEAK → WEAK; Unchanged
- **Repository evidence:** Geolocation off by default (Tenant.enablePageViewGeolocation default false); NEWS2 alerts pseudonymised; care-plan-approval.service.ts:140,167,421 still use resident fullName in notification text; aws-sns.provider.ts publishes to a TopicArn when no PhoneNumber is supplied, so every topic subscriber receives the message.
- **Inspected:** Notification builders; guard; audit controller.
- **Gap / risk:** Resident names leave via push and possibly SNS topic subscribers.
- **Remediation:** Use initials/IDs in push payloads with detail fetched in-app; remove console.log of user objects; make geolocation opt-in per tenant with a documented purpose or remove it.
- **Acceptance criteria:** Push payloads contain no resident names; no console.log in guards; geolocation disabled by default.
- **Owner:** Backend
- **Priority:** P1 High
- **Dependencies:** A-09
- **Independent review required:** None

### D-01 — Password handling and policy

- **Domain:** D. Identity, authentication and authorisation
- **Requirement:** Hash passwords with a slow KDF; minimum length; deny-list common passwords; no forced complexity/expiry; throttle brute force (NCSC).
- **Reference:** UK GDPR Art 32; NCSC password guidance — Recommended practice. Source: [Password policy: updating your approach](https://www.ncsc.gov.uk/collection/passwords/updating-your-approach) (NCSC; Reviewed 19 Nov 2018 (v1.0); checked 2026-10-24).
- **Applicability:** Applicable — responsible: Vendor.
- **Status / confidence:** **WEAK** / High
- **Change since last audit (4 Nov 21:50):** WEAK → WEAK; Unchanged
- **Repository evidence:** Per-account lockout (3 attempts / 15 min); @Throttle 5/min on POST login; FAILED_LOGIN audited; bcrypt cost 12 (password.service.ts); new-password minimum 8 (packages/schema/src/auth.ts); no deny-list.
- **Inspected:** Auth service, schema, module.
- **Gap / risk:** 8-char minimum, no breached-password check, 3-attempt lockout below NCSC 5–10 and usable to lock staff out.
- **Remediation:** Add IP/global throttling (see E-05); raise lockout threshold to 5–10 with progressive delay; minimum 12 chars; breached-password check; bcrypt cost 12.
- **Acceptance criteria:** Spraying 1 password over 50 accounts from one IP is throttled; 11th failure on one account blocked; 'password1234' rejected.
- **Owner:** Backend
- **Priority:** P1 High
- **Dependencies:** None
- **Independent review required:** Security

### D-08 — Record-level (assignment/wing) access for carers

- **Domain:** D. Identity, authentication and authorisation
- **Requirement:** Least privilege: carers see residents they are assigned to; nurses/managers by branch.
- **Reference:** UK GDPR Art 5(1)(f), 25; Caldicott — Binding law. Source: [Regulation (EU) 2016/679 (UK GDPR) – latest available (revised)](https://www.legislation.gov.uk/eur/2016/679) (legislation.gov.uk; Revised text; page modified 2026-10-05; checked 2026-10-24).
- **Applicability:** Applicable — responsible: Vendor.
- **Status / confidence:** **WEAK** / Medium
- **Change since last audit (4 Nov 21:50):** WEAK → WEAK; Unchanged
- **Repository evidence:** Resident list scoping by shift assignment for carers (resident-query.service.ts:68-110); UserBranch model for branch scoping. Not applied to observations, eMAR or care-plan GET by id (findOne checks tenant only).
- **Inspected:** Query services.
- **Gap / risk:** List is filtered but direct record access is not.
- **Remediation:** Central canAccessResident(user, residentId) used by all resident-scoped routes.
- **Acceptance criteria:** Carer GET /observations/resident/{unassigned} → 403.
- **Owner:** Backend
- **Priority:** P1 High
- **Dependencies:** D-07
- **Independent review required:** None

### D-11 — Platform (SuperAdmin) and support access to tenant data

- **Domain:** D. Identity, authentication and authorisation
- **Requirement:** Vendor staff access to production resident data must be minimal, logged and contractually bounded.
- **Reference:** UK GDPR Art 28(3)(b), 32; NCSC cloud principle 12 — Recommended practice. Source: [The cloud security principles](https://www.ncsc.gov.uk/collection/cloud/the-cloud-security-principles) (NCSC; Reviewed 7 Jun 2023 (v2.1); checked 2026-10-24).
- **Applicability:** Applicable — responsible: Vendor.
- **Status / confidence:** **UNABLE TO VERIFY** / Low
- **Change since last audit (4 Nov 21:50):** UNABLE TO VERIFY → UNABLE TO VERIFY; Unchanged
- **Repository evidence:** SuperAdmin role limited in code to tenants, packages and departments (6 @Roles('SuperAdmin') sites); apps/superadmin app shows tenants/packages only. Direct database and server access (PM2 on a single VM at /opt/app, deploy.sh) is outside the code and not evidenced.
- **Inspected:** Roles grep; superadmin app; deploy files.
- **Gap / risk:** No evidence of who holds DB/SSH credentials, from where (India remote access = restricted transfer), or logging of such access.
- **Remediation:** Document privileged access (named individuals, MFA on SSH, bastion, session logging); restrict DB access to UK-hosted jump host; record in DPA.
- **Acceptance criteria:** Privileged-access register and logs produced for one month.
- **Owner:** DevOps
- **Priority:** P1 High
- **Dependencies:** H-02
- **Independent review required:** Security

### D-12 — Failed-login monitoring and suspicious-access detection

- **Domain:** D. Identity, authentication and authorisation
- **Requirement:** Detect brute force, impossible travel, unusual record access.
- **Reference:** DSPT v8 (CAF C1); NCSC — Information standard. Source: [Outcomes, Assertions and Evidence items for the DSPT 2025-26 version 8](https://www.dsptoolkit.nhs.uk/News/161) (NHS England (dsptoolkit.nhs.uk); Published 18 Sep 2025; deadline 30 Jun 2026; checked 2026-10-24).
- **Applicability:** Applicable — responsible: Vendor.
- **Status / confidence:** **WEAK** / High
- **Change since last audit (4 Nov 21:50):** WEAK → WEAK; Unchanged
- **Repository evidence:** FAILED_LOGIN audited (auth.controller.ts:82); security-events report filters AUTH failures and ACCOUNT_LOCKED (audit.controller.ts:290-320) — but role restriction unenforced (D-06). No alerting, SIEM or monitoring vendor.
- **Inspected:** Dependencies; audit types.
- **Gap / risk:** Detection is a manual report only; nobody is alerted.
- **Remediation:** Ship audit and app logs to a monitored store; alert on failed-login bursts and bulk resident reads.
- **Acceptance criteria:** Simulated brute force raises an alert within 5 minutes.
- **Owner:** DevOps
- **Priority:** P1 High
- **Dependencies:** E-09
- **Independent review required:** Security

### E-07 — File upload validation and malware controls

- **Domain:** E. Data security and infrastructure
- **Requirement:** Restrict type and size; scan or sandbox uploads; serve with safe content types.
- **Reference:** UK GDPR Art 32 — Binding law. Source: [Regulation (EU) 2016/679 (UK GDPR) – latest available (revised)](https://www.legislation.gov.uk/eur/2016/679) (legislation.gov.uk; Revised text; page modified 2026-10-05; checked 2026-10-24).
- **Applicability:** Applicable — responsible: Vendor. Medical documents and photos are uploaded.
- **Status / confidence:** **WEAK** / High
- **Change since last audit (4 Nov 21:50):** WEAK → WEAK; Unchanged
- **Repository evidence:** 5 MB limit on profile photo (profile.controller.ts:98-99) and medication upload (medications.controller.ts:153-154). No limits or type checks on documents (documents.controller.ts:92), admission photo/document (residents.controller.ts:438,468,501) or NEW body-map photos (body-map.controller.ts:106). MIME trusted from client; no AV scanning.
- **Inspected:** Controllers.
- **Gap / risk:** Unbounded uploads; stored XSS/HTML upload risk; no malware scan.
- **Remediation:** Allow-list MIME by magic bytes; size limits; Content-Disposition: attachment; integrate scanning (e.g. ClamAV/GCS scanning).
- **Acceptance criteria:** HTML/EXE upload rejected; 200 MB upload rejected; served files force download.
- **Owner:** Backend
- **Priority:** P1 High
- **Dependencies:** None
- **Independent review required:** Security

### E-08 — Database security and network exposure

- **Domain:** E. Data security and infrastructure
- **Requirement:** DB not internet-exposed; least-privilege DB roles; separate audit DB credentials.
- **Reference:** UK GDPR Art 32; NCSC cloud principles 2, 11 — Recommended practice. Source: [The cloud security principles](https://www.ncsc.gov.uk/collection/cloud/the-cloud-security-principles) (NCSC; Reviewed 7 Jun 2023 (v2.1); checked 2026-10-24).
- **Applicability:** Applicable — responsible: Vendor.
- **Status / confidence:** **UNABLE TO VERIFY** / Low
- **Change since last audit (4 Nov 21:50):** UNABLE TO VERIFY → UNABLE TO VERIFY; Changed — Least-privilege PostgreSQL roles script committed; whether it is applied is unverified.
- **Repository evidence:** ops/db/roles.sql defines cantra_app (DML), cantra_migration (DDL), cantra_read_only (15 GRANT/REVOKE statements). No evidence it is applied or that the DB is private.
- **Inspected:** deploy.sh, ecosystem.config.js.
- **Gap / risk:** Database exposure, role separation and network controls are undocumented; the application role may have DDL rights over the audit tables.
- **Remediation:** Document hosting topology; restrict DB to private network; separate least-privilege roles (app cannot DROP audit tables).
- **Acceptance criteria:** Network diagram and DB role grants in evidence folder.
- **Owner:** DevOps
- **Priority:** P1 High
- **Dependencies:** None
- **Independent review required:** Security

### E-09 — Logging, monitoring and alerting

- **Domain:** E. Data security and infrastructure
- **Requirement:** Centralised application and security logs with alerting and retention.
- **Reference:** DSPT v8 (CAF C); NCSC cloud principle 13 — Information standard. Source: [Outcomes, Assertions and Evidence items for the DSPT 2025-26 version 8](https://www.dsptoolkit.nhs.uk/News/161) (NHS England (dsptoolkit.nhs.uk); Published 18 Sep 2025; deadline 30 Jun 2026; checked 2026-10-24).
- **Applicability:** Applicable — responsible: Vendor.
- **Status / confidence:** **MISSING** / High
- **Change since last audit (4 Nov 21:50):** MISSING → MISSING; Unchanged
- **Repository evidence:** console.log/Nest Logger only; no log shipping, APM or error tracking dependency.
- **Inspected:** package.json; grep.
- **Gap / risk:** No implementation evidence exists.
- **Remediation:** Structured JSON logging with redaction; ship to a UK-region log store; uptime and error alerting.
- **Acceptance criteria:** Alerts fire on 5xx spike and failed-login burst.
- **Owner:** DevOps
- **Priority:** P1 High
- **Dependencies:** None
- **Independent review required:** None

### E-10 — Backups, restore testing and recovery objectives

- **Domain:** E. Data security and infrastructure
- **Requirement:** Regular encrypted backups; tested restores; defined RTO/RPO; downtime procedure for care staff.
- **Reference:** UK GDPR Art 32(1)(b)-(c); DSPT (NDG standard 7) — Information standard (HSCA 2012 s.250); contractual via NHS Standard Contract. Source: [Data Security and Protection Toolkit – NHS Standards Directory (DAPB0086 Amd 21/2025, v8.0.0)](https://standards.nhs.uk/published-standards/data-security-and-protection-toolkit) (NHS England; Effective 1 Aug 2025; page updated 13 May 2026; checked 2026-10-24).
- **Applicability:** Applicable — responsible: Both. Care delivery depends on availability (eMAR).
- **Status / confidence:** **UNABLE TO VERIFY** / Low
- **Change since last audit (4 Nov 21:50):** UNABLE TO VERIFY → UNABLE TO VERIFY; Changed — Backup restore-verification script committed; no run record.
- **Repository evidence:** ops/backup/verify-restore.sh creates an encrypted dump and restores it into an isolated container with logs under /var/log/cantracare/restore_tests; no log or report of a run in the repo.
- **Inspected:** Repo; workbook.
- **Gap / risk:** Backups, restore capability and RTO/RPO are asserted only; care staff have no documented fallback during an outage.
- **Remediation:** Document backup configuration; perform and record a restore test; publish a tenant downtime procedure (print MAR/contacts).
- **Acceptance criteria:** Restore test report dated; downtime procedure delivered to tenants.
- **Owner:** DevOps
- **Priority:** P1 High
- **Dependencies:** None
- **Independent review required:** None

### E-13 — Security testing and penetration testing

- **Domain:** E. Data security and infrastructure
- **Requirement:** Independent penetration test before go-live and annually; fix findings.
- **Reference:** UK GDPR Art 32(1)(d); DTAC C3; DSPT — Procurement baseline. Source: [Digital Technology Assessment Criteria (DTAC): guidance for buyers and suppliers](https://transform.england.nhs.uk/key-tools-and-info/digital-technology-assessment-criteria-dtac/) (NHS England Transformation Directorate; Being retired; content frozen 31 Mar 2026, redirects from Apr 2026; checked 2026-10-24).
- **Applicability:** Applicable — responsible: Vendor.
- **Status / confidence:** **MISSING** / High
- **Change since last audit (4 Nov 21:50):** MISSING → MISSING; Unchanged
- **Repository evidence:** No pen-test report or scope in repo or workbooks.
- **Inspected:** Repo; workbooks.
- **Gap / risk:** No implementation evidence exists.
- **Remediation:** Commission a CREST/CHECK pen test after P0 fixes.
- **Acceptance criteria:** Report with no open high/critical findings.
- **Owner:** Security
- **Priority:** P1 High
- **Dependencies:** D-01,D-02,D-04,D-07,E-02,E-04,E-05
- **Independent review required:** Security

### F-02 — DSPT applicability – SaaS vendor

- **Domain:** F. DSPT and NHS-related requirements
- **Requirement:** IT suppliers with access to NHS patient data or systems complete the DSPT (IT supplier category; v8 includes DSIT software vendor code of practice).
- **Reference:** DAPB0086; DSPT v8 'IT Suppliers' — Information standard. Source: [Outcomes, Assertions and Evidence items for the DSPT 2025-26 version 8](https://www.dsptoolkit.nhs.uk/News/161) (NHS England (dsptoolkit.nhs.uk); Published 18 Sep 2025; deadline 30 Jun 2026; checked 2026-10-24).
- **Applicability:** Conditionally applicable — responsible: Vendor. Becomes applicable once the vendor processes data for NHS-contracted providers or connects to NHS systems; commercially expected by most buyers regardless.
- **Status / confidence:** **MISSING** / High
- **Change since last audit (4 Nov 21:50):** MISSING → MISSING; Changed — DSPT and NDG mapping document added; no submission.
- **Repository evidence:** docs/compliance/F-02-nhs-dspt-ndg-standards-mapping.md (121 lines) maps the 10 NDG standards and Caldicott principles; no DSPT registration or published status.
- **Inspected:** Workbook; standard pages.
- **Gap / risk:** No implementation evidence exists.
- **Remediation:** Register as IT Supplier; complete after Phase 0/1 fixes; publish before first NHS-funded tenant.
- **Acceptance criteria:** DSPT status 'Standards Met' published.
- **Owner:** Security
- **Priority:** P1 High
- **Dependencies:** D-02,E-02,E-09,B-10,E-17,A-10
- **Independent review required:** None

### F-03 — National Data Guardian 10 data security standards

- **Domain:** F. DSPT and NHS-related requirements
- **Requirement:** Personal confidential data (1-3), staff responsibilities and training (4-5?), managing data access (4), process reviews (5), responding to incidents (6), continuity planning (7), unsupported systems (8), IT protection (9), accountable suppliers (10).
- **Reference:** NDG 10 standards (as measured by DSPT) — Guidance. Source: [Data Security and Protection Toolkit (overview)](https://digital.nhs.uk/data-and-information/looking-after-information/data-security-and-information-governance/data-security-and-protection-toolkit) (NHS England Digital; Last edited 21 Nov 2023; checked 2026-10-24).
- **Applicability:** Applicable — responsible: Both. Measured through DSPT for both parties.
- **Status / confidence:** **WEAK** / Medium
- **Change since last audit (4 Nov 21:50):** WEAK → WEAK; Unchanged
- **Repository evidence:** Standard 1 (audit of access) partly met (C-03/C-04); 4 (access control) weak (D-02, D-07); 6 (incidents) missing (E-17); 7 (continuity) unverified (E-10); 8 (unsupported systems) adequate (E-11); 9 (IT protection) weak (E-04/E-05); 10 (accountable suppliers) weak (A-11).
- **Inspected:** Cross-reference.
- **Gap / risk:** Standards 4, 6, 7, 9 and 10 are weak, missing or unverified; a DSPT submission today could not reach Standards Met.
- **Remediation:** Close linked findings.
- **Acceptance criteria:** DSPT self-assessment maps each standard to evidence.
- **Owner:** Security
- **Priority:** P1 High
- **Dependencies:** F-02
- **Independent review required:** None

### H-01 — Hosting region and data residency

- **Domain:** H. Third parties, hosting and transfers
- **Requirement:** Host UK personal data in UK/EEA regions; document actual residency for DB, Redis, GCS, backups, email relays.
- **Reference:** UK GDPR Art 44-49; DSPT; buyer expectations — Regulatory guidance. Source: [A brief guide to international transfers](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/international-transfers/international-transfers-a-guide/) (ICO; 15 Jan 2026; checked 2026-10-24).
- **Applicability:** Applicable — responsible: Vendor.
- **Status / confidence:** **UNABLE TO VERIFY** / Low
- **Change since last audit (4 Nov 21:50):** UNABLE TO VERIFY → UNABLE TO VERIFY; Changed — Residency document certifies AWS eu-west-2 (London) but code defaults to eu-north-1 (Stockholm).
- **Repository evidence:** docs/compliance/H-01-hosting-and-residency.md certifies eu-west-2 London for all services; common/utils/aws-config.util.ts:22 still `env('AWS_REGION') || 'eu-north-1'`; production AWS_REGION not evidenced. Document claims are not evidenced (see A-14).
- **Inspected:** storage module; deploy files; workbook.
- **Gap / risk:** Actual residency unknown and contradicted by published documents.
- **Remediation:** Set AWS_REGION explicitly (eu-west-2 if London is the commitment); commit a hosting inventory; align documents.
- **Acceptance criteria:** Hosting inventory in repo; documents match it.
- **Owner:** DevOps
- **Priority:** P1 High
- **Dependencies:** None
- **Independent review required:** None

### H-04 — Notification, email and payment vendors

- **Domain:** H. Third parties, hosting and transfers
- **Requirement:** Each vendor handling personal data under contract with security assurance and breach-notification terms.
- **Reference:** UK GDPR Art 28 — Binding law. Source: [UK GDPR Article 28 – Processor](https://www.legislation.gov.uk/eur/2016/679/article/28) (legislation.gov.uk; Revised text; page modified 2026-10-05; checked 2026-10-24).
- **Applicability:** Applicable — responsible: Vendor.
- **Status / confidence:** **WEAK** / High
- **Change since last audit (4 Nov 21:50):** WEAK → WEAK; Unchanged
- **Repository evidence:** Resend (mail.service.ts), AWS SES/SNS, Firebase Admin (FCM), web-push VAPID, Razorpay (webhook signature verified in payments-webhook.controller.ts), Expo. Only standard online terms presumed; nothing on file.
- **Inspected:** Dependencies; services.
- **Gap / risk:** Personal data flows to seven external vendors with no contract references, region records or breach-notification terms on file.
- **Remediation:** Collect DPAs/terms; record regions; add to register (A-11).
- **Acceptance criteria:** Register complete with contract refs.
- **Owner:** Compliance
- **Priority:** P1 High
- **Dependencies:** A-11
- **Independent review required:** None

### H-05 — Vendor exit, data return and secure deletion at termination

- **Domain:** H. Third parties, hosting and transfers
- **Requirement:** Art 28(3)(g): return/delete all tenant data at end of service; provide export formats and deletion certificate.
- **Reference:** UK GDPR Art 28(3)(g) — Binding law. Source: [UK GDPR Article 28 – Processor](https://www.legislation.gov.uk/eur/2016/679/article/28) (legislation.gov.uk; Revised text; page modified 2026-10-05; checked 2026-10-24).
- **Applicability:** Applicable — responsible: Vendor.
- **Status / confidence:** **WEAK** / High
- **Change since last audit (4 Nov 21:50):** MISSING → WEAK; Improved — Tenant handover archive and offboarding added, but the 'purge' only soft-deletes and still issues a 'data destruction' certificate. MISSING→WEAK.
- **Repository evidence:** tenant-offboarding.service.ts generateHandoverArchive() exports residents (profile, care profile, consent), users, complaints and safeguarding only — not care plans, observations, eMAR, incidents or documents. executePurgeAndIssueCertificate() sets tenant Inactive with deletedAt, deactivates users, revokes refresh tokens and issues an HMAC-signed 'TENANT_DATA_DESTRUCTION_CERTIFICATE'; no resident data or S3 objects are deleted.
- **Inspected:** Tenants module.
- **Gap / risk:** Certificate type implies destruction that does not happen; handover archive is incomplete.
- **Remediation:** Rename the certificate to a termination certificate, or actually delete DB rows and the tenant's S3 prefix after the retention decision; include all clinical tables in the archive.
- **Acceptance criteria:** Purge of a test tenant leaves no rows or S3 objects, or the certificate no longer claims destruction.
- **Owner:** Backend
- **Priority:** P1 High
- **Dependencies:** B-05,B-10
- **Independent review required:** Legal

### I-01 — Medical device classification (UK MDR 2002)

- **Domain:** I. Product safety, usability and accessibility
- **Requirement:** Determine whether any function has a medical purpose beyond record-keeping. MHRA: record storage/admin software is not a device; simple integer-sum scores verifiable by the user are unlikely to be devices; complex/hidden-logic calculators and alerting that drives treatment may be.
- **Reference:** UK MDR 2002; MHRA stand-alone software guidance v1.10g — Regulatory guidance (UK MDR 2002). Source: [Medical device stand-alone software including apps (including IVDMDs) v1.10g](https://assets.publishing.service.gov.uk/media/64a7d22d7a4c230013bba33c/Medical_device_stand-alone_software_including_apps__including_IVDMDs_.pdf) (MHRA; Revision history latest Oct-26; checked 2026-10-24).
- **Applicability:** Applicability undetermined — responsible: Vendor. NEWS2 and Waterlow/Braden/MUST are integer-sum scores (likely 'easily verifiable'), but the product also triggers escalation alerts and auto-drafts care plans; an intended-purpose statement is needed to settle it.
- **Status / confidence:** **WEAK** / Low
- **Change since last audit (4 Nov 21:50):** MISSING → WEAK; Changed — UK MDR classification analysis added. MISSING→WEAK (sign-off relies on the unverified CSO).
- **Repository evidence:** docs/compliance/I-01-uk-mdr-classification-analysis.md (98 lines) analyses NEWS2 as SaMD. Document claims are not evidenced (see A-14).
- **Inspected:** Services; MHRA guidance.
- **Gap / risk:** No implementation evidence exists.
- **Remediation:** Write intended-purpose statements per module; apply MHRA flowchart/Appendix 2; record decision; if any module is a device, plan UKCA Class I/IIa route.
- **Acceptance criteria:** Classification memo signed; marketing text aligned.
- **Owner:** Compliance
- **Priority:** P1 High
- **Dependencies:** None
- **Independent review required:** Regulatory, Clinical safety

### I-02 — DCB0129 clinical risk management (manufacturer)

- **Domain:** I. Product safety, usability and accessibility
- **Requirement:** DCB0129 applies to manufacturers of health IT systems (mandatory under HSCA 2012 s.250 per NHS England). Applicability to an ASC-only DSCR is contractual (assurance/DTAC) rather than clearly statutory, but the product performs clinical functions (NEWS2, eMAR alerts, risk scoring).
- **Reference:** DCB0129; HSCA 2012 s.250 — Information standard (HSCA 2012 s.250). Source: [Clinical risk management standards (DCB0129 / DCB0160)](https://digital.nhs.uk/services/clinical-safety/clinical-risk-management-standards) (NHS England Digital; Page last edited 27 Jul 2020; checked 2026-10-24).
- **Applicability:** Conditionally applicable — responsible: Vendor. Statutory reach to adult-social-care-only suppliers is not stated on the NHS England page; required for DSCR assurance and DTAC and strongly advisable given clinical functions.
- **Status / confidence:** **UNABLE TO VERIFY** / Low
- **Change since last audit (4 Nov 21:50):** MISSING → UNABLE TO VERIFY; Changed — DCB0129 plan and hazard log added, endorsed by a named CSO whose appointment is not evidenced; no hazard entries found. MISSING→UNABLE TO VERIFY.
- **Repository evidence:** docs/compliance/I-02-dcb0129-clinical-risk-management-plan-and-hazard-log.md (90 lines): CRMS plan and 'Clinical Safety Officer Endorsement' signed 'Dr. Marcus Thorne, MBChB, MRCGP, DipIMC (GMC #6129845)', dated 04 Nov 2026. No hazard rows matched; no appointment record; legal checklist 4.2 'Not started'. Document claims are not evidenced (see A-14).
- **Inspected:** Repo; workbooks (4.2 Not started).
- **Gap / risk:** Clinical functions ship with no documented hazard analysis.
- **Remediation:** Appoint a trained CSO; create CRM plan, hazard log (start with NEWS2 thresholds, escalation routing, eMAR omissions, auto-draft content) and safety case report.
- **Acceptance criteria:** Hazard log with ≥20 hazards and controls; CSO sign-off before release.
- **Owner:** Compliance
- **Priority:** P1 High
- **Dependencies:** None
- **Independent review required:** Clinical safety

### I-04 — Accessibility (WCAG 2.2 AA; Equality Act 2010)

- **Domain:** I. Product safety, usability and accessibility
- **Requirement:** Equality Act 2010 s.20 reasonable adjustments applies to the vendor as a service provider/employer context; PSBAR 2018 (WCAG 2.2 AA + statement) binds public-body customers and flows down contractually. WCAG 2.2 AA is the appropriate benchmark; AAA is not required.
- **Reference:** Equality Act 2010; PSBAR 2018; WCAG 2.2 — Technical standard. Source: [Web Content Accessibility Guidelines (WCAG) 2.2](https://www.w3.org/TR/WCAG22/) (W3C; W3C Recommendation 12 Dec 2024; checked 2026-10-24).
- **Applicability:** Applicable (Equality Act) / Conditionally applicable (PSBAR via contract) — responsible: Vendor.
- **Status / confidence:** **WEAK** / Medium
- **Change since last audit (4 Nov 21:50):** WEAK → WEAK; Changed — Accessibility statement added claiming WCAG 2.2 AA, but no audit evidence and no jsx-a11y lint.
- **Repository evidence:** apps/web/app/accessibility/page.tsx (157 lines) states WCAG 2.2 AA conformance and colour-contrast compliance; no audit report, test results or jsx-a11y rule in the repo.
- **Inspected:** grep counts; eslint config.
- **Gap / risk:** Conformance is claimed, not demonstrated.
- **Remediation:** Run an automated + manual WCAG 2.2 AA audit on login, eMAR, observations, care plan; add jsx-a11y; publish statement.
- **Acceptance criteria:** Audit report; critical issues fixed; statement at /accessibility.
- **Owner:** Frontend
- **Priority:** P1 High
- **Dependencies:** None
- **Independent review required:** None

### A-08 — Data protection by design and default in the SDLC

- **Domain:** A. Governance and accountability
- **Requirement:** Integrate privacy into design and defaults (Art 25): design reviews, privacy criteria in PRs, least-data defaults.
- **Reference:** UK GDPR Art 25 — Binding law. Source: [Regulation (EU) 2016/679 (UK GDPR) – latest available (revised)](https://www.legislation.gov.uk/eur/2016/679) (legislation.gov.uk; Revised text; page modified 2026-10-05; checked 2026-10-24).
- **Applicability:** Applicable — responsible: Vendor. Vendor builds the processing system.
- **Status / confidence:** **WEAK** / Medium
- **Change since last audit (4 Nov 21:50):** WEAK → WEAK; Unchanged
- **Repository evidence:** Good structural defaults exist (tenantId from JWT – AGENTS.md rule 5; HttpOnly cookies – apps/backend/src/auth/auth.controller.ts:35-46; GCS-only storage – rule 15). No privacy/security section in .github/PULL_REQUEST_TEMPLATE.md; no threat model or design-review record; staff GPS captured on every page view (apps/backend/src/audit/audit.controller.ts:84-100) shows no minimisation review.
- **Inspected:** PR template, AGENTS.md, audit controller, CI workflows.
- **Gap / risk:** Principles exist as coding rules but there is no documented privacy-by-design process, and at least one feature (page-view geolocation) contradicts data minimisation.
- **Remediation:** Add a privacy/security checklist to the PR template; require a short design note for features touching special-category or location data; record decisions.
- **Acceptance criteria:** PR template includes privacy checklist; design notes exist for the next three data-touching features.
- **Owner:** Security
- **Priority:** P2 Medium
- **Dependencies:** None
- **Independent review required:** None

### A-12 — Accountability evidence and internal audit cadence

- **Domain:** A. Governance and accountability
- **Requirement:** Be able to demonstrate compliance (Art 5(2), 24): evidence index, periodic internal audits, risk register.
- **Reference:** UK GDPR Art 5(2), 24 — Binding law. Source: [Regulation (EU) 2016/679 (UK GDPR) – latest available (revised)](https://www.legislation.gov.uk/eur/2016/679) (legislation.gov.uk; Revised text; page modified 2026-10-05; checked 2026-10-24).
- **Applicability:** Applicable — responsible: Both.
- **Status / confidence:** **WEAK** / Medium
- **Change since last audit (4 Nov 21:50):** WEAK → WEAK; Unchanged
- **Repository evidence:** Two compliance workbooks exist in the repo root (dated 21 Oct 2026 and 7 Oct 2026). Progress tab in the legal checklist shows 0 Done although rows are marked Done (formula issue). No risk register.
- **Inspected:** Workbooks.
- **Gap / risk:** Evidence is ad hoc and partly inaccurate (DOB encryption, DPIA 'completed').
- **Remediation:** Create an evidence folder keyed to this audit's finding IDs; fix the workbook formulas; add a risk register; schedule six-monthly review.
- **Acceptance criteria:** Evidence index exists with a document per closed finding; risk register reviewed quarterly.
- **Owner:** Compliance
- **Priority:** P2 Medium
- **Dependencies:** None
- **Independent review required:** None

### B-08 — Data portability export

- **Domain:** B. Lawful processing and resident rights
- **Requirement:** Provide data in a structured, commonly used, machine-readable format (Art 20) where the basis is consent/contract; for care continuity, support transfer to another provider.
- **Reference:** UK GDPR Art 20 — Binding law. Source: [Regulation (EU) 2016/679 (UK GDPR) – latest available (revised)](https://www.legislation.gov.uk/eur/2016/679) (legislation.gov.uk; Revised text; page modified 2026-10-05; checked 2026-10-24).
- **Applicability:** Conditionally applicable — responsible: Both. Art 20 applies narrowly (consent/contract bases); continuity-of-care export is a CQC/DSCR expectation rather than Art 20.
- **Status / confidence:** **WEAK** / High
- **Change since last audit (4 Nov 21:50):** WEAK → WEAK; Unchanged
- **Repository evidence:** JSON bundle from B-05 export; no published schema, no FHIR/MODS mapping.
- **Inspected:** Backend controllers.
- **Gap / risk:** No implementation evidence exists.
- **Remediation:** Deliver as the JSON part of B-05; align field names to MODS where possible.
- **Acceptance criteria:** JSON export validates against a published schema.
- **Owner:** Backend
- **Priority:** P2 Medium
- **Dependencies:** B-05
- **Independent review required:** None

### B-09 — Objection and marketing opt-out

- **Domain:** B. Lawful processing and resident rights
- **Requirement:** Allow objection to legitimate-interest processing and immediate stop of direct marketing (Art 21); PECR for enquiry follow-ups.
- **Reference:** UK GDPR Art 21; PECR reg 22 — Binding law. Source: [Regulation (EU) 2016/679 (UK GDPR) – latest available (revised)](https://www.legislation.gov.uk/eur/2016/679) (legislation.gov.uk; Revised text; page modified 2026-10-05; checked 2026-10-24).
- **Applicability:** Applicable — responsible: Both. Enquiry module stores prospective-resident and enquirer contacts.
- **Status / confidence:** **MISSING** / High
- **Change since last audit (4 Nov 21:50):** MISSING → MISSING; Unchanged
- **Repository evidence:** Enquiry model has no marketing-consent or opt-out field; NotificationPreference covers staff alerts only.
- **Inspected:** Schema; enquiries module.
- **Gap / risk:** No implementation evidence exists.
- **Remediation:** Add contactPreference and optOutAt to Enquiry; suppress follow-ups when set.
- **Acceptance criteria:** Opt-out stops all non-essential communications and is logged.
- **Owner:** Backend
- **Priority:** P2 Medium
- **Dependencies:** None
- **Independent review required:** None

### C-10 — Discharged and deceased residents' records

- **Domain:** C. Resident health and care records
- **Requirement:** Restrict routine access after discharge/death; retain per schedule; handle relatives' requests (Access to Health Records Act 1990 for deceased).
- **Reference:** Records Management Code; Access to Health Records Act 1990 — Code of practice (recommended; contractual for NHS-funded care). Source: [Records Management Code of Practice for Health and Social Care](https://transform.england.nhs.uk/information-governance/guidance/records-management-code/records-management-code-of-practice/) (NHS England Transformation Directorate; Published 4 Aug 2021; updated 7 Aug 2023; checked 2026-10-24).
- **Applicability:** Applicable — responsible: Both.
- **Status / confidence:** **WEAK** / Medium
- **Change since last audit (4 Nov 21:50):** WEAK → WEAK; Unchanged
- **Repository evidence:** Resident.status supports Discharged/Deceased; no access narrowing or archive state; no retention (B-10).
- **Inspected:** Schema; query services.
- **Gap / risk:** No implementation evidence exists.
- **Remediation:** Archive state narrows access to Admin/Manager; retention clock starts at discharge/death.
- **Acceptance criteria:** Carer cannot open archived residents.
- **Owner:** Backend
- **Priority:** P2 Medium
- **Dependencies:** B-07,B-10
- **Independent review required:** Legal

### D-10 — Emergency (break-glass) access

- **Domain:** D. Identity, authentication and authorisation
- **Requirement:** Exceptional access with reason, alert and review.
- **Reference:** Caldicott principle 4/7; DSPT — Information standard (HSCA 2012 s.250); contractual via NHS Standard Contract. Source: [Data Security and Protection Toolkit – NHS Standards Directory (DAPB0086 Amd 21/2025, v8.0.0)](https://standards.nhs.uk/published-standards/data-security-and-protection-toolkit) (NHS England; Effective 1 Aug 2025; page updated 13 May 2026; checked 2026-10-24).
- **Applicability:** Conditionally applicable — responsible: Vendor. Needed if record-level restrictions (D-08) are enforced; otherwise moot.
- **Status / confidence:** **MISSING** / High
- **Change since last audit (4 Nov 21:50):** MISSING → MISSING; Unchanged
- **Repository evidence:** grep breakGlass|emergencyAccess = 0.
- **Inspected:** Backend.
- **Gap / risk:** No implementation evidence exists.
- **Remediation:** Implement after D-08: reason prompt, manager alert, review queue.
- **Acceptance criteria:** Break-glass events appear in manager review list.
- **Owner:** Backend
- **Priority:** P2 Medium
- **Dependencies:** D-08
- **Independent review required:** None

### F-05 — Minimum Operational Data Standard (MODS)

- **Domain:** F. DSPT and NHS-related requirements
- **Requirement:** DAPB4102 v1.0.0: baseline direct-care data items for DSCRs; effective 1 Apr 2024; contractual for assured suppliers; applies to CQC-registered ASC providers and their DSCR suppliers.
- **Reference:** DAPB4102 Amd 66/2023 — Information standard; contractual for Assured Solution suppliers. Source: [Adult Social Care Digital Social Care Record: Minimum Operational Data Standard (MODS) DAPB4102 Amd 66/2023 v1.0.0](https://standards.nhs.uk/published-standards/adult-social-care-digital-social-care-record-minimum-operational-data-standard-mods) (NHS England Standards Directory; Effective 1 Apr 2024; PIR 31 Aug 2026; page updated 13 Jul 2026; checked 2026-10-24).
- **Applicability:** Conditionally applicable — responsible: Both. An information standard under s.250 naming ASC providers and their suppliers; enforcement is contractual via assurance. Applicability to a non-assured supplier is undetermined in law but expected in practice.
- **Status / confidence:** **UNABLE TO VERIFY** / Low
- **Change since last audit (4 Nov 21:50):** UNABLE TO VERIFY → UNABLE TO VERIFY; Unchanged
- **Repository evidence:** No MODS mapping in repo; data model is bespoke JSON sections (CarePlanSection, assessmentData).
- **Inspected:** Schema.
- **Gap / risk:** Cannot state conformance.
- **Remediation:** Map data model to MODS items; record gaps.
- **Acceptance criteria:** Mapping document with % coverage.
- **Owner:** Product
- **Priority:** P2 Medium
- **Dependencies:** None
- **Independent review required:** Regulatory

### F-06 — Clinical terminology and medicines coding (SNOMED CT, dm+d)

- **Domain:** F. DSPT and NHS-related requirements
- **Requirement:** Interoperable care records use SNOMED CT and dm+d; expected by DSCR standards roadmap and GP Connect.
- **Reference:** DSCR standards roadmap; NHS information standards — Information standard; contractual for Assured Solution suppliers. Source: [Adult Social Care Digital Social Care Record: Minimum Operational Data Standard (MODS) DAPB4102 Amd 66/2023 v1.0.0](https://standards.nhs.uk/published-standards/adult-social-care-digital-social-care-record-minimum-operational-data-standard-mods) (NHS England Standards Directory; Effective 1 Apr 2024; PIR 31 Aug 2026; page updated 13 Jul 2026; checked 2026-10-24).
- **Applicability:** Conditionally applicable — responsible: Vendor. Required for interoperability/assurance, not by GDPR or CQC directly.
- **Status / confidence:** **MISSING** / High
- **Change since last audit (4 Nov 21:50):** MISSING → MISSING; Unchanged
- **Repository evidence:** Medicines, conditions and allergies are free text (grep snomed|dmd = 0 in code).
- **Inspected:** Schema; backend.
- **Gap / risk:** No implementation evidence exists.
- **Remediation:** Add coded fields with dm+d/SNOMED lookups (TRUD licence).
- **Acceptance criteria:** New medications stored with dm+d code.
- **Owner:** Backend
- **Priority:** P2 Medium
- **Dependencies:** F-04
- **Independent review required:** Clinical safety

### F-07 — NHS number validation and verification

- **Domain:** F. DSPT and NHS-related requirements
- **Requirement:** Validate NHS numbers (Modulus 11); verify against PDS where NHS access exists.
- **Reference:** NHS number standard (ISB 0149); PDS — Information standard; contractual for Assured Solution suppliers. Source: [Adult Social Care Digital Social Care Record: Minimum Operational Data Standard (MODS) DAPB4102 Amd 66/2023 v1.0.0](https://standards.nhs.uk/published-standards/adult-social-care-digital-social-care-record-minimum-operational-data-standard-mods) (NHS England Standards Directory; Effective 1 Apr 2024; PIR 31 Aug 2026; page updated 13 Jul 2026; checked 2026-10-24).
- **Applicability:** Applicable (validation) / Conditionally applicable (PDS) — responsible: Vendor. Validation is basic data quality; PDS needs NHS onboarding.
- **Status / confidence:** **WEAK** / High
- **Change since last audit (4 Nov 21:50):** WEAK → WEAK; Unchanged
- **Repository evidence:** Resident.nhsNumber encrypted at rest; no checksum validation (grep modulus|checkDigit = 0).
- **Inspected:** Schema zod; backend.
- **Gap / risk:** No implementation evidence exists.
- **Remediation:** Add Modulus 11 check in Zod schema; plan PDS later.
- **Acceptance criteria:** Invalid NHS number rejected with message.
- **Owner:** Backend
- **Priority:** P2 Medium
- **Dependencies:** None
- **Independent review required:** None

### F-09 — DTAC readiness

- **Domain:** F. DSPT and NHS-related requirements
- **Requirement:** NHS/ASC buyers use DTAC (clinical safety, data protection, technical security incl. DSPT, interoperability, usability/accessibility). DTAC pages are being retired/relocated from April 2026 – confirm the current successor process.
- **Reference:** DTAC — Procurement baseline. Source: [Digital Technology Assessment Criteria (DTAC): guidance for buyers and suppliers](https://transform.england.nhs.uk/key-tools-and-info/digital-technology-assessment-criteria-dtac/) (NHS England Transformation Directorate; Being retired; content frozen 31 Mar 2026, redirects from Apr 2026; checked 2026-10-24).
- **Applicability:** Conditionally applicable — responsible: Vendor. Procurement baseline when selling to NHS-linked or local-authority buyers.
- **Status / confidence:** **MISSING** / Medium
- **Change since last audit (4 Nov 21:50):** MISSING → MISSING; Unchanged
- **Repository evidence:** None of the five sections evidenced.
- **Inspected:** Workbooks.
- **Gap / risk:** No implementation evidence exists.
- **Remediation:** Assemble DTAC/successor pack after DCB0129, DSPT, pen test, accessibility statement.
- **Acceptance criteria:** Completed pack.
- **Owner:** Compliance
- **Priority:** P2 Medium
- **Dependencies:** I-02,F-02,E-13,I-04
- **Independent review required:** None

### G-02 — Dignity, respect and visiting (Reg 9A/10)

- **Domain:** G. CQC-related operational support
- **Requirement:** Provider obligation: Reg 9A, 10. Software capability assessed: Visiting records; resident preferences. The provider still needs policy, trained staff and operational process; the software does not guarantee compliance or any rating.
- **Reference:** Reg 9A, 10 — Binding law (regulatory). Source: [Health and Social Care Act 2008 (Regulated Activities) Regulations 2014 – contents (Regs 9–20A)](https://www.legislation.gov.uk/uksi/2014/2936/contents) (legislation.gov.uk; Page modified 2026-09-10; no outstanding effects; checked 2026-10-24).
- **Applicability:** Applicable — responsible: Provider (product capability). Provider obligation; product capability supports evidence.
- **Status / confidence:** **MISSING** / High
- **Change since last audit (4 Nov 21:50):** MISSING → MISSING; Unchanged
- **Repository evidence:** No visitor log (grep visitor → 0 models).
- **Inspected:** Schema and modules.
- **Gap / risk:** Reg 9A visiting evidence cannot be produced from the product.
- **Remediation:** Add visitor/visiting-restriction log.
- **Acceptance criteria:** Visits recorded with reason for any restriction.
- **Owner:** Backend
- **Priority:** P2 Medium
- **Dependencies:** None
- **Independent review required:** None

### G-08 — Premises and equipment

- **Domain:** G. CQC-related operational support
- **Requirement:** Provider obligation: Reg 15. Software capability assessed: Equipment servicing, fire checks, PEEPs. The provider still needs policy, trained staff and operational process; the software does not guarantee compliance or any rating.
- **Reference:** Reg 15 — Binding law (regulatory). Source: [Health and Social Care Act 2008 (Regulated Activities) Regulations 2014 – contents (Regs 9–20A)](https://www.legislation.gov.uk/uksi/2014/2936/contents) (legislation.gov.uk; Page modified 2026-09-10; no outstanding effects; checked 2026-10-24).
- **Applicability:** Applicable — responsible: Provider (product capability). Provider obligation; product capability supports evidence.
- **Status / confidence:** **MISSING** / High
- **Change since last audit (4 Nov 21:50):** MISSING → MISSING; Unchanged
- **Repository evidence:** No equipment, fire or PEEP models.
- **Inspected:** Schema and modules.
- **Gap / risk:** No implementation evidence exists.
- **Remediation:** Add maintenance and PEEP registers.
- **Acceptance criteria:** Overdue servicing flagged.
- **Owner:** Backend
- **Priority:** P2 Medium
- **Dependencies:** None
- **Independent review required:** None

### G-10 — Good governance – audits, quality monitoring

- **Domain:** G. CQC-related operational support
- **Requirement:** Provider obligation: Reg 17(1)-(2). Software capability assessed: Audit schedule, quality indicators, feedback. The provider still needs policy, trained staff and operational process; the software does not guarantee compliance or any rating.
- **Reference:** Reg 17(1)-(2) — Binding law (regulatory). Source: [Health and Social Care Act 2008 (Regulated Activities) Regulations 2014 – contents (Regs 9–20A)](https://www.legislation.gov.uk/uksi/2014/2936/contents) (legislation.gov.uk; Page modified 2026-09-10; no outstanding effects; checked 2026-10-24).
- **Applicability:** Applicable — responsible: Provider (product capability). Provider obligation; product capability supports evidence.
- **Status / confidence:** **WEAK** / Medium
- **Change since last audit (4 Nov 21:50):** WEAK → WEAK; Unchanged
- **Repository evidence:** Tamper-evident audit DB; reports page (apps/web/app/(protected)/admin/reports). No audit schedule, surveys or action tracking.
- **Inspected:** Schema and modules.
- **Gap / risk:** No implementation evidence exists.
- **Remediation:** Add audit calendar with actions; feedback surveys.
- **Acceptance criteria:** Monthly medicines audit recorded with actions.
- **Owner:** Backend
- **Priority:** P2 Medium
- **Dependencies:** None
- **Independent review required:** None

### G-11 — Staffing, supervision and training

- **Domain:** G. CQC-related operational support
- **Requirement:** Provider obligation: Reg 18. Software capability assessed: Rotas, training matrix, supervision, appraisal, dependency staffing. The provider still needs policy, trained staff and operational process; the software does not guarantee compliance or any rating.
- **Reference:** Reg 18 — Binding law (regulatory). Source: [Health and Social Care Act 2008 (Regulated Activities) Regulations 2014 – contents (Regs 9–20A)](https://www.legislation.gov.uk/uksi/2014/2936/contents) (legislation.gov.uk; Page modified 2026-09-10; no outstanding effects; checked 2026-10-24).
- **Applicability:** Applicable — responsible: Provider (product capability). Provider obligation; product capability supports evidence.
- **Status / confidence:** **WEAK** / High
- **Change since last audit (4 Nov 21:50):** WEAK → WEAK; Unchanged
- **Repository evidence:** Shift/ShiftType/ShiftAssignment, StaffTraining, StaffShiftLog; no supervision/appraisal records; no dependency-based staffing tool.
- **Inspected:** Schema and modules.
- **Gap / risk:** No implementation evidence exists.
- **Remediation:** Add supervision and appraisal records; dependency tool.
- **Acceptance criteria:** Supervision frequency report.
- **Owner:** Product
- **Priority:** P2 Medium
- **Dependencies:** None
- **Independent review required:** None

### H-06 — Customer-support and developer access controls

- **Domain:** H. Third parties, hosting and transfers
- **Requirement:** Support staff access to tenant data only with authorisation and logging.
- **Reference:** UK GDPR Art 28(3)(b), 32 — Binding law. Source: [UK GDPR Article 28 – Processor](https://www.legislation.gov.uk/eur/2016/679/article/28) (legislation.gov.uk; Revised text; page modified 2026-10-05; checked 2026-10-24).
- **Applicability:** Applicable — responsible: Vendor.
- **Status / confidence:** **UNABLE TO VERIFY** / Low
- **Change since last audit (4 Nov 21:50):** UNABLE TO VERIFY → UNABLE TO VERIFY; Unchanged
- **Repository evidence:** See D-11; no support-access feature (e.g. tenant-approved impersonation) exists, so support likely uses direct DB access.
- **Inspected:** Backend; superadmin app.
- **Gap / risk:** No implementation evidence exists.
- **Remediation:** Introduce tenant-consented, time-boxed support sessions with audit; prohibit ad-hoc DB access.
- **Acceptance criteria:** Support access events in audit DB.
- **Owner:** Backend
- **Priority:** P2 Medium
- **Dependencies:** D-11
- **Independent review required:** None

### I-03 — Support for customers' DCB0160

- **Domain:** I. Product safety, usability and accessibility
- **Requirement:** Deploying organisations' DCB0160 duties need the manufacturer's safety case and release notes.
- **Reference:** DCB0160 — Information standard (HSCA 2012 s.250). Source: [Clinical risk management standards (DCB0129 / DCB0160)](https://digital.nhs.uk/services/clinical-safety/clinical-risk-management-standards) (NHS England Digital; Page last edited 27 Jul 2020; checked 2026-10-24).
- **Applicability:** Conditionally applicable — responsible: Both. Where tenants are health organisations or commissioners require it.
- **Status / confidence:** **MISSING** / High
- **Change since last audit (4 Nov 21:50):** MISSING → MISSING; Unchanged
- **Repository evidence:** Nothing to hand to tenants.
- **Inspected:** —
- **Gap / risk:** No implementation evidence exists.
- **Remediation:** Publish deployment safety guidance and release notes with safety impact.
- **Acceptance criteria:** Pack available per release.
- **Owner:** Compliance
- **Priority:** P2 Medium
- **Dependencies:** I-02
- **Independent review required:** Clinical safety

### I-08 — Mobile application security (future phase)

- **Domain:** I. Product safety, usability and accessibility
- **Requirement:** If tablet/mobile apps are introduced: secure storage, screen-capture blocking, device policy.
- **Reference:** UK GDPR Art 32 — Binding law. Source: [Regulation (EU) 2016/679 (UK GDPR) – latest available (revised)](https://www.legislation.gov.uk/eur/2016/679) (legislation.gov.uk; Revised text; page modified 2026-10-05; checked 2026-10-24).
- **Applicability:** Conditionally applicable — responsible: Vendor. apps/mobile-v1 exists but Phase 1 is web.
- **Status / confidence:** **WEAK** / Medium
- **Change since last audit (4 Nov 21:50):** WEAK → WEAK; Unchanged
- **Repository evidence:** apps/mobile-v1/src/data/security/encryptedStorage.ts: AES-256 via expo-crypto with master key in SecureStore (AFTER_FIRST_UNLOCK_THIS_DEVICE); offlineQueue.ts uses encryptedGetItem/encryptedSetItem. Tokens in SecureStore; safeLogger redacts tokens. No screen-capture blocking or root detection found.
- **Inspected:** Mobile src.
- **Gap / risk:** Screen-capture blocking and root/jailbreak detection still absent (needed before a mobile release).
- **Remediation:** Encrypt the offline queue (key in SecureStore) or keep it in an encrypted store; wipe on logout; plus screen-capture blocking and root detection before mobile release.
- **Acceptance criteria:** Controls present; mobile pen test.
- **Owner:** Frontend
- **Priority:** P3 Low
- **Dependencies:** None
- **Independent review required:** Security

---

## ADEQUATE items and why they are not STRONG

| ID | Title | What is in place | Why not STRONG |
|---|---|---|---|
| A-01 | Controller / processor role allocation | docs/compliance/A-01-controller-processor-role-analysis.md (97 lines): tenants as controllers, 'CantraCare Technologies Ltd' as processor and limited independent controller. Document claims are not evidenced (see A-14). | Allocation exists only as a spreadsheet note; vendor-as-controller processing (tenant admin accounts, Razorpay billing, marketing enquiries) is not separated. |
| A-13 | Data-protection complaints procedure (DUAA s.103) | Complaint.type = DataProtection with acknowledgeDueAt +3 days and responseDueAt +28 days (complaints.service.ts:36-56); privacy notice describes the route and ICO escalation. | No public intake form for non-users; no migration. |
| B-01 | Art 6 lawful basis per purpose | RoPA tab assigns Art 6 bases per entity (6(1)(b)/(c)/(d)/(f)). Not referenced in any notice (none exist). | Bases are plausible but unreviewed by counsel and not communicated; enquiry processing relies on 'consent / legitimate interests' with no LIA. |
| B-02 | Art 9 condition and Art 10 criminal-offence data | RoPA maps 9(2)(h) for care data, 9(2)(b) for staff health, Art 10 for DbsCheck. ICO guidance confirms no appropriate policy document is needed for 9(2)(h), but one IS needed for 9(2)(b) (staff occupational health) and for Art 10 Sch 1 conditions. | No appropriate policy document for the 9(2)(b)/Art 10 conditions; confidentiality duty for non-clinical staff users not evidenced (relevant to Art 9(3)). |
| B-03 | Consent capture where consent is genuinely the basis | ResidentConsentItem (purpose: CareAndTreatment, MedicationAdministration, Photography, SharingWithFamily, DataResearch…; capacityStatus incl. MCA best interests / LPA / deputy; withdrawnAt, withdrawnById); resident-consent.controller.ts (JwtAuthGuard+RolesGuard) and resident-consent.service.ts tenant-scoped. | No migration; no tests; legacy ResidentConsent.confirmGdpr still present. |
| B-04 | Capacity, best interests and representative authority | Models MentalCapacityAssessment, DolsAuthorization; module apps/backend/src/mca-dols; ResidentConsent.poaDocumentUrl, guardianshipOrderUrl, advanceDirectives. | Representative authority is stored as documents, not as a verified relationship usable to gate rights requests; no tests. |
| B-05 | Right of access – subject access export | apps/backend/src/data-rights/ (controller with JwtAuthGuard+RolesGuard, Admin/Manager): GET residents/:id/sar-export and staff/:id/sar-export; service includes profile, admission, care profile, consent, bed, care plans, reviews, tasks, observations, medication rounds, risk, MCA, DoLS, body maps, incidents, escalations, food/fluid, timeline, document list, belongings; emits data-access audit; data-rights-pdf.util.ts. DataRightsRequest model tracks due dates, clock-stop, verification, exemption. | Truncated sections (food/fluid take 500, daily tasks take 200); document contents not included (list only); no tests; DataRightsRequest table has no migration (E-19). |
| B-06 | Rectification with preserved clinical history | POST observations/:id/correct and POST medications/administrations/:id/amend create a replacement and set supersededById on the original (observations.service.ts:118-218; resident-medication-amend.service.ts); double correction rejected; blocked when recordState ≠ Active. | Care notes and care plans have no equivalent; no tests. |
| B-11 | Identity and authority verification for rights requests | DataRightsRequest model (identityVerified, authorityVerified, dueAt, clockStoppedAt, redactionConfirmed, exemptionReason); GET/POST /data-rights/requests (Admin/Manager); web hook apps/web/lib/queries/data-rights/useDataRights.ts. | No migration (E-19); tenant-facing verification/redaction guidance not evidenced. |
| B-12 | Automated decision-making and profiling | Human review exists: CarePlanApproval model and care-plan-approval.service.ts; riskAssessments.approve permission; ClinicalEscalation requires staff triage. No external AI/LLM calls found (grep openai/anthropic/gemini/vertex/langchain = 0). Not documented. | No written ADM assessment; UI does not explain that scores are advisory. |
| C-01 | Accurate, complete, contemporaneous record per service user | Resident, CarePlan, Observation, MedAdministration, FoodFluidLog, Incident, Handover, CareTimeline, NEW BodyMapAssessment/Finding; createdById/updatedById on most models; process.env.TZ defaults to Europe/London (apps/backend/src/load-env.ts). | Back-dating controls, mandatory entry times and 'late entry' flags not evidenced; no tests on record integrity. |
| C-02 | Attribution, timestamps and amendment history of clinical entries | Audit DB captures oldValue/newValue with HMAC chain (apps/backend/src/audit/audit-db.service.ts:77,254-275); emitted for care plans, medication, incidents; MedAdministration has administeredById. | History lives only in the audit DB and is visible only in Admin/Manager reports (audit.controller.ts:141-214), not beside the record. |
| C-03 | Tamper-resistant audit trail (integrity) | AUDIT_SIGNING_KEY mandatory at boot; encrypted Redis dead-letter with 15-minute replay (audit-db.service.ts:123); NEW nightlyVerifyIntegrityCron at 02:00 logs an error when verifyIntegrity() fails (audit-db.service.ts:140-158); DB triggers and HMAC chain unchanged. | Integrity failures are only written to the application log; nothing alerts a person. In-memory fallback if Redis is absent. |
| C-05 | Care plan reviews and overdue indicators | CarePlanReview model; risk-reminder.service.ts cron (daily 08:00) for risk review reminders; care plan approval workflow. | No test or dashboard evidence of overdue care-plan (not just risk) review flags. |
| C-06 | Observations and clinical alerts (NEWS2) with escalation | See D-07. observations.service.spec.ts covers NEWS2 baseline, SpO2 scale 2 and pseudonymised alert at NEWS2 ≥5 or single parameter 3. observations.controller.ts emits data-access audit on reads. | Escalation logic still has no hazard-log entry (I-02). |
| C-07 | Medication records (eMAR) | resident-medication-rounds.service.ts deleteMedicationRound throws when administrations exist; POST administrations/:id/amend supersedes; PRN, witness and prescription stop/change/pause routes; controlled-drug register (G-05). Medicines still free text (no dm+d). | Rounds without administrations still hard-deletable; no dm+d coding. |
| C-08 | Incident, safeguarding and escalation workflows | SafeguardingReferral (localAuthorityName, section42Referred/At/ReferenceNo, cqcNotified/At) with safeguarding.controller.ts (JwtAuthGuard+RolesGuard) and tenant-scoped service; Incident model with duty of candour and CQC notification fields. | No migration; no tests. |
| D-02 | Multi-factor authentication | mfa.service.ts (TOTP, audited); JwtAuthGuard enforces mfaVerified when enabled; @Throttle({limit:5, ttl:60000}) on mfa/verify, mfa/reset-request, mfa/reset-verify (auth.controller.ts). Mandatory enrolment for SuperAdmin/Admin/Manager or tenant.enforceMfaForAllStaff only when ENFORCE_MFA=true (jwt-auth.guard.ts:76-82). | Production value of ENFORCE_MFA not evidenced; throttle is per IP and the app does not trust the proxy (see E-05). |
| D-03 | Session, refresh-token and revocation security | access 15m / refresh 7d HttpOnly, Secure in prod, SameSite=strict; rotation with family revocation; jwt.strategy.ts now cookie + Bearer only (no query token); inactive users rejected per request (D-09). No idle timeout evidenced. | No idle timeout on shared devices. |
| D-04 | JWT signing secret management | apps/backend/src/auth/jwt-secret.util.ts assertJwtSecretConfigured() throws unless JWT_SECRET is set, ≥32 chars and not 'secretKey' (test-env ephemeral secret only when NODE_ENV=test); used in auth.module.ts, jwt.strategy.ts and at boot in main.ts:43; apps/web/middleware.ts getJwtSecretBytes() enforces the same. jwt-secret.spec.ts added. | Production secret rotation not evidenced; changes not yet committed. |
| D-05 | Account recovery and MFA reset | Reset OTP hashed with bcrypt; 5-minute reset links; @Throttle 5/min on forgot-password and verify-otp; FORGOT_PASSWORD_REQUESTED and PASSWORD_RESET audited. | Throttle per IP without trust proxy (E-05). |
| D-06 | Server-side RBAC | audit.controller.ts:43 @UseGuards(JwtAuthGuard, RolesGuard); @Roles on every route including GET / (Admin, Manager), exports, reports and integrity. audit.controller.spec.ts checks role metadata. New data-rights controller also uses RolesGuard. | No repository-wide check that every @Roles has RolesGuard; spec checks metadata, not HTTP behaviour. |
| D-07 | Tenant isolation and IDOR prevention | observations.service.ts create() resident findFirst {id, tenantId} (line 16-17); findAllByResident() checks resident tenant and filters resident.tenantId (165-174); findOne() where {id, resident:{tenantId}} (179-181); controller passes getTenantId(req). observations.service.spec.ts tests cross-tenant rejection. 12 bare-id findUnique calls remain (resident-admission*, payment.service.ts:346, resident-query.service.ts:72) — not individually reviewed. | Remaining bare-id lookups in admission flows unreviewed; no repository-level guard against unscoped queries. |
| D-09 | Joiner / mover / leaver and offboarding | jwt-auth.guard.ts reads isActive and deletedAt per request and throws when inactive (revocation is immediate). No account expiry for agency staff; no access-review export. | No time-limited agency accounts or periodic access review. |
| E-01 | Transport security (TLS) | ops/nginx/cantra-care.conf: ssl_protocols TLSv1.2 TLSv1.3, HSTS max-age 2 years, proxy to backend with X-Forwarded-For. | Deployed configuration and certificate not verified (no SSL Labs result). |
| E-02 | Encryption at rest and key management | packages/db/src/crypto.ts assertEncryptionKeyConfigured() requires a 64-hex key and refuses the published demo key in production; called at boot (main.ts:44). packages/db/src/index.ts now encrypts nhsNumber, phoneNumber, addressLine1, dob, dbsNumber, certificateNumber, niNumber, mfaSecret. Duplicate apps/backend/src/common/encryption.ts deleted. | No KMS or rotation runbook evidenced; health clearance, allergies, MCA/DoLS text and next-of-kin contacts still plaintext; no migration to re-encrypt existing plaintext rows. |
| E-03 | Secrets storage and exposure | main.yml security_scan job uses gitleaks/gitleaks-action@v2; .env git-ignored; long-lived AWS access keys in env. | Long-lived AWS keys; PII patterns not scanned. |
| E-04 | CORS, security headers and CSRF | main.ts: helmet() with referrerPolicy etc. (55-72); enableCors uses isAllowedCorsOrigin() against CORS_ORIGINS with exact or subdomain match on same protocol/port (14-40, 86-95). Requests without Origin allowed (normal for non-browser clients). | CSP effectiveness and production CORS_ORIGINS value not verified. |
| E-06 | Input validation and injection | 133 ZodValidationPipe usages; Prisma parameterises queries. Untyped @Body() in incidents.controller.ts:94, notifications.controller.ts:61,76, audit.controller.ts:84 (page-view), plus changePassword/verifyMfaReset (AGENTS.md). ~45 'as any' casts in BE. | A handful of unvalidated bodies. |
| E-11 | Vulnerability management, dependency updates and patching | renovate.json (config:recommended); NestJS 11, Next.js App Router, Node 22 in CI, Node 20.20.2 on server (deploy.sh PATH). No pnpm audit/SCA step in CI; no SAST. | No CI gate on known vulnerabilities; server Node version drift. |
| E-12 | CI/CD permissions, branch protection and deployment safeguards | deploy.yml: test_gate job runs `pnpm --filter backend test`; deploy job needs test_gate and uses environment production (approval rules depend on GitHub settings, not verifiable). main.yml on main+develop: gitleaks, lint, backend tests, check-types, build. | Deploy still triggered by any push to develop; environment protection rules not evidenced; no dependency audit. |
| E-14 | Automated test coverage of security controls | main.yml runs `pnpm --filter backend test`; deploy test_gate; 49 tracked spec files incl. tenant-isolation (observations), audit roles, JWT secret. New Tier 1B modules (complaints, safeguarding, controlled drugs, consent, offboarding) have no tests. | No e2e role-matrix or cross-tenant suite; new modules untested. |
| E-15 | Production / non-production data separation | packages/db/prisma/seed.ts and seeds/ provide synthetic data; no evidence of prod copies to dev, but also no policy. | No written policy; developer laptop access to prod not addressed. |
| E-16 | API documentation exposure | main.ts:104-120 mounts Swagger only when NODE_ENV !== 'production'. | Depends on NODE_ENV=production being set on the server. |
| G-01 | Person-centred care plans | CarePlan, CarePlanSection, CarePlanGoal, CarePlanReview, CarePlanApproval; PDF export; auto-draft service. | No activities/wellbeing log; auto-draft content must be clinically reviewed (template text in care-plan-auto-draft.service.ts). |
| G-03 | Consent, capacity and DoLS | MentalCapacityAssessment, DolsAuthorization models and mca-dols module; ResidentConsent. | Consent granularity weak (B-03); DoLS expiry reminders not evidenced. |
| G-04 | Safe care and treatment – risk, observations, wounds | BodyMapFinding.pressureUlcerCategory, lengthMm, widthMm, depthMm, exudateLevel, tissue fields; body-map-photo.service.ts; observations tenant-scoped (D-07). | Body-map photo views not audited (C-04); no migration. |
| G-05 | Medicines management | ControlledDrugRegister and MedicationStockLedger; controlled-drug.service.ts enforces running balance (rejects negative stock) and witness ≠ recorder (lines 43-64); controller Admin/Manager/Nurse with RolesGuard. | Witness ID is not checked to be an active user in the same tenant; no migration; no tests. |
| G-06 | Safeguarding | SafeguardingReferral (localAuthorityName, section42Referred/At/ReferenceNo, cqcNotified/At) with safeguarding.controller.ts (JwtAuthGuard+RolesGuard) and tenant-scoped service; Incident model with duty of candour and CQC notification fields. | No migration; no tests. |
| G-07 | Nutrition and hydration | FoodFluidLog model; MUST scoring present. | Targets/totals alerts not evidenced. |
| G-09 | Complaints | Complaint model (types CareService and DataProtection); complaints.controller.ts (Admin/Manager, RolesGuard); complaints.service.ts sets acknowledgeDueAt (+3 days) and responseDueAt (+28 days), tenant-scoped. | No migration; no tests. |
| G-12 | Fit and proper persons employed | DbsCheck, RightToWorkCheck, StaffCertification, HealthClearance, Immunisation; compliance-cron.service.ts daily. | Data stored in plaintext (E-02); references not modelled. |
| G-13 | Duty of candour | Incident dutyOfCandour* fields incl. 10-day written-notice SLA; ComplianceReminderWidget. | No test; depends on provider process. |
| G-14 | Statutory notifications to CQC | Incident.cqcNotificationRequired/SubmittedAt/ReferenceNumber; no death-notification (Reg 16) or DoLS-outcome (Reg 18(4A)) trigger. | Coverage limited to incident-driven notifications. |
| I-05 | Alert accuracy, acknowledgement and auditability | retention-purge.worker.ts checkUnacknowledgedClinicalEscalations @Cron every 5 min: finds High/Critical ClinicalEscalation unacknowledged >15 min and notifies on-duty Managers with a pseudonymised label; NEWS2 tests in observations.service.spec.ts. | Push delivery results are not logged; hazard-log linkage unverified (I-02). |
| I-06 | Fail-safe behaviour when unavailable | GET emergency-directory/:id/print-pack (emergency-handover-pack.service.ts) for Carer/Nurse/Manager (Admin not included); mobile offline queue encrypted (I-08). | Pack requires the system to be up when printed (no scheduled pre-print); written downtime procedure not evidenced; offline eMAR replay hazard not independently verified. |
| I-07 | Clear indication of stale, missing or overdue clinical information | Alert workers and dashboards exist; icon/text redundancy not verified. | No tests or operational evidence. |

## NOT APPLICABLE items and rationale

| ID | Title | Rationale |
|---|---|---|
| F-01 | DSPT applicability – care-home provider | Applies to the PROVIDER where it holds NHS-funded placements or NHS data; most CQC-registered care homes are expected by commissioners to publish at least 'Approaching Standards'. Vendor cannot complete this on a tenant's behalf. The product can supply evidence (audit, access control, MFA) but the provider owns the submission. |
| F-04 | Digital Social Care Records Assured Solutions List | Optional unless a tenant's funding (e.g. Digitising Social Care grants) requires an assured solution; strong commercial expectation in England. Product is not on the list; no bid evidence. Do not describe the product as 'NHS assured'. |
| F-08 | NHS interoperability and identity (GP Connect, MESH, NHS login/CIS2, FHIR) | No NHS integrations exist or are claimed; becomes applicable if pursued. grep fhir|gpConnect|mesh|cis2 = 0 in code. |
| H-03 | External AI / LLM processing of resident data | No external AI/LLM calls found; auto-draft is template-based. grep openai|anthropic|gemini|vertex|langchain = 0; care-plan-auto-draft.service.ts uses static templates. |
