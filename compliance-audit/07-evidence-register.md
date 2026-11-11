> Part of the Cantra Care / LCM compliance audit, 24 October 2026. Repository inspected at commit `3529908` (branch `sobin/careplan-v3`). See `00-README.md` for scope, method and limits.

# Deliverable 7 – Compliance evidence register

Evidence that must exist **outside the codebase** for the vendor and/or its tenants. "Found" means a document was located (in the repository or the three compliance workbooks); a spreadsheet cell saying "Done" is not a document. Absence here does not prove a document does not exist elsewhere in the organisation — it proves it was not provided for this audit.

| # | Evidence item | Who must hold it | Status | What was found | What is needed to close | Finding |
|---|---|---|---|---|---|---|
| 1 | Platform DPIA (and DPIA procedure / screening) | Vendor | **Missing** | Legal checklist 3.9 "In progress" with a note that a DPIA was "completed in DPO Audit report"; the referenced workbook contains a scorecard and RoPA, no DPIA | Signed DPIA; procedure; screening form | A-09 |
| 2 | Tenant DPIA template | Vendor (for providers) | Missing | — | Template document | A-09 |
| 3 | Record of processing activities | Vendor (processor + controller records); Provider | **Partially found** | RoPA tab (13 rows) in `Cantra_Care_GDPR_Compliance_Audit_Checklist.xlsx`; one inaccurate row (DOB encryption) | Full RoPA regenerated from schema with recipients, roles, retention | A-03 |
| 4 | Lawful-basis register and LIA(s) | Both | Partially found | Art 6/9 mapping in RoPA; no LIA | Counsel-reviewed register; LIA for enquiries | B-01 |
| 5 | Appropriate policy document (DPA 2018 Sch 1) for staff health / DBS data | Both | Missing | — | APD | B-02 |
| 6 | Privacy notices (platform users, website, enquirers) and resident/staff templates | Vendor; Provider | **Missing** | Legal checklist 3.12 "specification drafted"; nothing in product | Published notices | A-04 |
| 7 | Data-protection complaints procedure (DUAA s.103) | Both | Missing | — | Procedure, form, log | A-13 |
| 8 | Customer data processing agreement (Art 28) | Vendor | **Missing** | Legal checklist 3.7 "drafted"; no document, no acceptance mechanism | Executed DPA per tenant | A-02 |
| 9 | Sub-processor register and vendor DPAs/terms | Vendor | Partially found | Register of 7 in workbook; omits Resend and AWS SNS; no contracts | Complete register; contract references; assurance evidence | A-11, H-04 |
| 10 | International transfer instruments (IDTA/Addendum) and transfer risk assessments | Vendor | **Missing** | Legal checklist 3.5 "drafted" | Signed instruments; TRAs | H-02 |
| 11 | Retention schedule (per record type, Records Management Code aligned) and destruction records | Both | Missing | Retention column in RoPA only; nothing operational | Schedule; appraisal/destruction log | B-10 |
| 12 | Incident response plan, breach procedure, breach register, tabletop report | Both | **Missing** | Empty "Breach Log" template in user workbook | SOP, templates, register, exercise report | E-17 |
| 13 | Business continuity / disaster recovery plan and restore-test record; downtime procedure for care staff | Both | Unable to verify | Legal checklist 10.3 describes architecture; no test record | BC/DR plan; restore test report; downtime procedure | E-10, I-06 |
| 14 | Hosting inventory (provider, region, service) and TLS configuration | Vendor | Unable to verify | Regions asserted in workbook; no config in repo | Inventory and config in `docs/` or IaC | H-01, E-01 |
| 15 | Privileged-access register and logs (DB, SSH, cloud console) | Vendor | Unable to verify | — | Register; MFA/bastion evidence; sample logs | D-11, E-08 |
| 16 | Security policy set (acceptable use, access control, passwords, device) with acknowledgements | Both | Unable to verify | Legal checklist 9.1 "drafted" | Approved policies; acknowledgements | A-10 |
| 17 | Staff data-protection and security training records | Both | Missing | — | Completion log | A-10 |
| 18 | Supplier and sub-processor security assessments (ISO 27001 / SOC 2 evidence) | Vendor | Missing | — | Due-diligence file | A-11 |
| 19 | DSPT submission (IT Supplier) | Vendor | Missing | Legal checklist 4.4 "baseline established" | Published DSPT status | F-02 |
| 20 | DSPT submission (provider) and product evidence pack | Provider; Vendor pack | Not applicable to vendor / Missing pack | — | Evidence pack mapping product controls to assertions | F-01 |
| 21 | Penetration-test report and remediation tracker | Vendor | **Missing** | — | CREST/CHECK report | E-13 |
| 22 | Clinical safety documentation: CSO appointment, clinical risk management plan, hazard log, clinical safety case report | Vendor | **Missing** | Legal checklist 4.2 "Not started" | Full DCB0129 set | I-02 |
| 23 | Medical-device intended-purpose statements and classification memo | Vendor | Missing | Legal checklist 4.3 "Not started" | Memo | I-01 |
| 24 | Accessibility audit report and accessibility statement | Vendor | Missing | — | Audit; statement | I-04 |
| 25 | Access-review records (quarterly) and joiner/mover/leaver checklist | Both | Missing | — | Review exports; checklist | D-09 |
| 26 | Operational audit evidence (medicines audits, care-plan audits) | Provider | Not applicable to vendor | — | Provider's audit calendar (product support planned) | G-10 |
| 27 | DPO appointment letter, terms of reference, ICO notification | Vendor | Unable to verify | Legal checklist 3.4 "Done" | Letter; ICO reference | A-05 |
| 28 | ICO data protection fee registration | Vendor | Unable to verify | Legal checklist 3.2 "pending" | Registration number | A-06 |
| 29 | Contracting-entity decision; UK representative agreement or exemption note | Vendor | Unable to verify | Legal checklist 1.1 "Not started", 3.3 "In progress" | Decision memo | A-07 |
| 30 | Automated decision-making assessment | Vendor | Missing | Legal checklist 3.17 "Verified: no solely automated decisions" (assertion only) | Short written assessment | B-12 |
| 31 | Production-data handling policy (no real data in dev/test) | Vendor | Missing | — | Policy | E-15 |
| 32 | Key-management and rotation runbook | Vendor | Missing | — | Runbook; rotation log | E-02 |
| 33 | Evidence index keyed to finding IDs; risk register; internal audit schedule | Vendor | Missing | Two workbooks (one with broken progress formulas) | Index; register; schedule | A-12 |
| 34 | MODS conformance mapping | Vendor | Missing | — | Mapping | F-05 |
| 35 | Licences for clinical tools/terminologies (NEWS2, Waterlow, MUST, SNOMED/dm+d) | Vendor | Missing | Legal checklist 4.6 "Not started" | Licence register | F-06 |

**Summary:** 0 found complete · 4 partially found · 21 missing · 8 unable to verify · 2 not applicable to the vendor.
