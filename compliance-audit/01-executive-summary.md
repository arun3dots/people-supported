> Part of the Cantra Care / LCM compliance audit. **Re-audited 4 November 2026, 23:20 IST** at `sobin/compliances-V0` `b3caf619` (2 commits since the last audit); last audit 4 Nov 21:50 at `develop` `6f33c164`. See `00-README.md` for scope, method and limits.

# Deliverable 1 – Executive summary

## Overall assessment

**A big step forward in features, but two new blockers and a records-integrity problem.** Commit `0288535b` adds most of the missing CQC and data-rights capabilities: complaints, safeguarding referrals, a controlled-drug register, per-purpose consent, record states, corrections that keep the original, pressure-ulcer staging, escalation timeouts and an emergency print pack. CI now runs tests and secret scanning before deploys. However:

- **None of the new database models has a migration** (E-19 regressed to MISSING). Deployed as-is, these features fail.
- **The committed nginx config proves the app is behind a proxy**, so the missing `trust proxy` setting means the 5-per-minute login limit applies to the whole site (E-05, now P0).
- **Several new compliance documents name people, numbers and companies that aren't evidenced anywhere** (new finding A-14, P0).

Of 105 items, 47 are ADEQUATE, 32 WEAK, 11 MISSING, 11 UNABLE TO VERIFY and 4 NOT APPLICABLE. Control effectiveness is **46%** (35% at the last audit). **P0 items rose from 5 to 8.** This is not a legal compliance determination.

## Count: good last time vs now

Compared with the last audit (4 Nov 21:50). "Good" = STRONG or ADEQUATE; "bad" = WEAK or MISSING.

| Movement since last audit | Count | Items |
|---|---:|---|
| **Good last time → now Weak or Missing** | **1** | E-19 Database migrations (ADEQUATE → MISSING) |
| Weak, Missing or Unverified last time → now good | 13 | A-13, B-03, B-06, C-08, E-01, E-12, E-14, G-04, G-05, G-06, G-09, I-05, I-06 |
| Missing → Weak (partly built) | 4 | B-07, B-10, H-05, I-01 |
| Other moves | 2 | A-10 (Unable to verify → Weak), I-02 (Missing → Unable to verify) |
| New item | 1 | A-14 Accuracy of compliance records (WEAK, P0) |
| Good both times | 34 | |
| Weak or Missing both times | 40 | |
| Unable to verify or not applicable both times | 10 | |
| **Total** | **105** | |

| Status | Last audit | Now | Change |
|---|---:|---:|---:|
| STRONG | 0 | 0 | 0 |
| ADEQUATE | 35 | 47 | +12 |
| WEAK | 36 | 32 | −4 |
| MISSING | 17 | 11 | −6 |
| UNABLE TO VERIFY | 12 | 11 | −1 |
| NOT APPLICABLE | 4 | 4 | 0 |
| New item | — | 1 | +1 |
| P0 items | 5 | 8 | +3 |

**Caveat:** 8 of the 13 items that became good (A-13, B-03, B-06, C-08, G-04, G-05, G-06, G-09), plus the partly built B-07 and B-10, depend on tables or columns that don't exist until the migration is added. They're credited as code, not as working features.

## What changed since the last audit

| Change | Items | Summary |
|---|---|---|
| **Regressed** | E-19 | 8 new models and fields (consent items, controlled-drug register, stock ledger, safeguarding, complaints, retention policy, record state, pressure-ulcer fields) with no migration. ADEQUATE → MISSING, **P0**. |
| **New** | A-14 | The I-02 hazard log carries a signed endorsement by "Dr. Marcus Thorne (GMC #6129845)" with no appointment record. A-05 states ICO registration `ZB894102` for "CantraCare Technologies Ltd, 100 Bishopsgate", which public search didn't find and which contradicts your legal checklist. H-01 certifies London while the code defaults to Stockholm. The E-17 breach record is still uncorrected. **P0.** |
| **Raised to P0** | E-05 | The nginx config forwards client IPs but the app doesn't trust them, so all users share one throttle bucket. At shift change, staff could be unable to log in. |
| **Improved → good** | 13 items | Complaints (3-day acknowledgement, 28-day response), safeguarding with s.42 and CQC fields, CD register with running balance and dual witness, stock ledger, per-purpose consent with capacity basis, corrections that keep the original, pressure-ulcer staging and measurements, 15-minute escalation re-alerts, emergency print pack, tests in CI, deploy test gate, reference TLS config. |
| **Partly built** | B-07, B-10, H-05, I-01 | Record state blocks writes in 3 modules only, and reads aren't restricted. Retention purges tokens only. Tenant "purge" soft-deletes but issues a "data destruction" certificate. Device classification is written up, but its sign-off relies on the unverified CSO. |
| **Changed, status unchanged** | A-01, A-03, A-05, A-06, A-11, H-01, F-02, E-08, E-10, I-04 | Documents and scripts added (role analysis, RoPA, DPO/ICO, sub-processors, residency, DSPT mapping, DB roles, backup check, accessibility statement). Each still needs evidence that it's real or applied. |
| **Still wrong** | A-04 | The privacy notice and DPA still name Google Cloud as the file store. |

## Documents that need evidence

| Document | Claim | Why it isn't accepted | What closes it |
|---|---|---|---|
| I-02 hazard log | CSO "Dr. Marcus Thorne", GMC #6129845, signed 04 Nov 2026 | No appointment record; no hazard rows; legal checklist says CSO not started | Appointment letter and real signature, or replace with a placeholder |
| A-05 DPO/ICO | ICO registration ZB894102; "CantraCare Technologies Ltd, 100 Bishopsgate"; Tier 3 fee | Not found in public search; contradicts legal checklist (entity not incorporated, fee pending) and earlier docs ("CantraCare UK Ltd") | ICO certificate and Companies House number, or placeholders |
| H-01 residency | All services in AWS eu-west-2 (London) | Code defaults to eu-north-1 (Stockholm) | Set `AWS_REGION=eu-west-2` in code and production; evidence the bucket region |
| E-17 breach record | "7 synthetic entries", ICO notification not required | File had 473 events with emails and GPS, public since 29 Apr | Correct and re-decide |
| A-09 DPIA | "DPO approved, residual risk Low" | No name or date | Named, dated sign-off |
| H-02 transfers | IDTA "executed" | No instrument; entity not incorporated | Signed IDTA/TRA or DRAFT label |

## Remaining release-blocking findings (P0)

| ID | Finding | Status | What closes it |
|---|---|---|---|
| E-19 | Migrations for new schema | MISSING | Generate and commit the migration; CI drift check |
| E-05 | Rate limiting behind proxy | WEAK | `app.set('trust proxy', 1)`; test per-client limits behind nginx |
| A-14 | Accuracy of compliance records | WEAK | Evidence or placeholders for every name, number and signature |
| E-18 | Personal data in Git | WEAK | Remove from `origin/master`; decide on history purge |
| E-17 | Breach record | WEAK | Correct the E-18 entry and re-take the decision |
| A-09 | DPIA | WEAK | Named, dated sign-off |
| A-02 | Customer DPA | WEAK | Call accept-DPA from onboarding; fix the storage sub-processor |
| H-02 | International transfers | UNABLE TO VERIFY | Signed instruments or DRAFT label |

## The ten most important risks

| # | Risk | Finding | Why it matters |
|---|---|---|---|
| 1 | **Compliance documents may contain fictitious signatories and registration numbers.** | A-14 | Sharing them would misrepresent the organisation to care homes, the ICO or CQC. |
| 2 | **Deploying without migrations breaks every new feature.** | E-19 | Complaints, safeguarding, CD register, consent and record state all query missing tables or columns. |
| 3 | **Site-wide login lockout behind nginx.** | E-05 | 5 logins per minute for the whole home; eMAR becomes unreachable at shift change. |
| 4 | **Personal data still on `origin/master`; breach record still wrong.** | E-18, E-17 | Ongoing exposure; decision rests on wrong facts. |
| 5 | **Notices name the wrong storage provider and location.** | A-04, H-01, A-11 | Transparency failure; possible Stockholm hosting. |
| 6 | **"Data destruction" certificate issued without destroying data.** | H-05 | Misleading certificate for a departing care home. |
| 7 | **No DPA can be accepted in the product.** | A-02 | No Art 28 contract. |
| 8 | **Uploads unvalidated** on most routes. | E-07 | Stored XSS and unbounded storage. |
| 9 | **Restricted and legal-hold records remain readable and mostly editable.** | B-07 | Restriction isn't really enforced. |
| 10 | **New CQC modules have no tests.** | E-14 | Complaints, safeguarding and CD register logic is unverified. |

## Major evidence limitations

- Code was read, not run. New modules were checked for guards, tenant filters and key logic, not read line by line.
- Public web search can't prove that a registration or a person doesn't exist. It only shows that nothing supports the claims.
- Infrastructure (TLS in production, region, backups, DB roles applied, environment protection rules) remains unverifiable from the repository.
