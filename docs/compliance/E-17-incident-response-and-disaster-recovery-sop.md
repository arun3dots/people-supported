# E-17 & E-18 — Personal Data Breach Notification, Incident Response & Disaster Recovery SOP

**Document ID:** `CC-SOP-IR-2026-01`  
**Version:** `1.0`  
**Effective Date:** `29 October 2026`  
**Regulatory Scope:** UK GDPR Articles 33 & 34, NHS Data Security and Protection Toolkit (DSPT) National Data Guardian Standard 6 & 7, CQC Regulation 18/20.

---

## 1. 72-Hour Personal Data Breach Notification Workflow (UK GDPR Art 33 & 34)

Because CantraCare operates as a **Data Processor** for Care Home resident/staff records and a **Data Controller** for platform telemetry, the following strict SLA applies upon detection of any suspected or confirmed Personal Data Breach:

| Phase | Target SLA | Responsible Owner | Actions Required |
|---|---|---|---|
| **1. Detection & Containment** | **0 – 2 Hours** | On-Call Security Engineer | Isolate affected container/credentials, revoke compromised JWT refresh token families, snapshot forensic logs (`AuditLog` HMAC chain). |
| **2. Triage & Impact Assessment** | **2 – 12 Hours** | DPO + Clinical Safety Officer | Determine affected `tenantId`(s), categories of special-category health data (`nhsNumber`, eMAR, observations), number of data subjects, and whether encryption at rest (`AES-256-GCM`) rendered data unintelligible. |
| **3. Controller Notification (Art 33(2))** | **Within 24 Hours** | DPO (`dpo@cantracare.co.uk`) | Notify affected Care Home Data Controller(s) via registered Primary Contact Email with full Article 33(3) breach particulars so the Controller can assess ICO/DSPT reporting. |
| **4. ICO / DSPT Reporting (Art 33(1))** | **Within 72 Hours** | Care Home Controller (or CantraCare for Controller breaches) | Submit breach report via the NHS DSPT Incident Reporting Tool / ICO portal (`https://ico.org.uk/for-organisations/report-a-breach/`) if the breach is likely to result in a risk to rights and freedoms. |
| **5. Data Subject Notification & Duty of Candour (Art 34 & CQC Reg 20)** | **Without Undue Delay** | Care Home Registered Manager | Where high risk exists (or clinical harm occurred), notify affected residents/LPAs in plain language and comply with CQC Regulation 20 Statutory Duty of Candour. |

---

## 2. Automated Detection Triggers in CantraCare

1. **Nightly Audit Chain Integrity Cron (`AuditDbService.verifyChainsNightly`)**: Runs daily at `02:00 AM` and logs a `CRITICAL COMPLIANCE ALERT (C-03)` if any tenant's HMAC-SHA256 audit chain fails verification.
2. **Refresh Token Reuse Detection (`AuthService.refreshTokens`)**: Immediately revokes all active sessions for a user if a rotated refresh token is replayed.
3. **Dead-Letter Queue Threshold Alert (`AuditDeadLetterUtil`)**: Alerts operations if Redis/memory encrypted audit dead-letter queue cannot be drained by the 15-minute replay cron.

---

## 3. Disaster Recovery (DR), Backup Encryption & RPO/RTO Targets

| Metric / Control | Production Target | Verification Cadence |
|---|---|---|
| **Recovery Point Objective (RPO)** | **<= 15 minutes** (Point-in-Time Recovery via PostgreSQL WAL archiving in GCP `europe-west2`) | Monthly automated check |
| **Recovery Time Objective (RTO)** | **<= 2 hours** (Multi-zone failover in `europe-west2` London) | Quarterly DR tabletop & restore drill |
| **Backup Encryption** | AES-256 customer-managed/Google-managed KMS encryption + application-layer AES-256-GCM field encryption | Verified on every restore |

---

## 4. UK GDPR Article 33(5) Internal Breach Register Entry — Finding `E-18`

In accordance with UK GDPR Article 33(5), the following historical finding from the 29 October 2026 compliance audit is formally recorded in the Breach & Security Incident Register:

- **Incident Reference:** `INC-2026-10-29-E18`
- **Description of Incident:** During development/testing prior to production release, two files (`apps/backend/audit-dead-letter.jsonl` containing 7 test `PAGE_VIEW` audit entries and `cookies.txt` containing local localhost session cookies) were tracked in git commit `6d25c2ea`.
- **Personal Data & Risk Assessment:**
  - The 7 entries in `audit-dead-letter.jsonl` were synthetic test `PAGE_VIEW` events generated in a local development environment (`tenantId: cmm26ebac0001x8272255250z`) and contained no real resident health records.
  - `cookies.txt` contained expired local development JWTs (`localhost`).
- **Remediation Taken (29 October 2026):**
  1. Removed both files from the repository index (`git rm --cached apps/backend/audit-dead-letter.jsonl cookies.txt`) and added permanent ignore rules in `.gitignore`.
  2. Refactored `apps/backend/src/audit/audit-dead-letter.util.ts` to eliminate local disk `.jsonl` dead-letter files altogether, replacing them with AES-256-GCM encrypted Redis (`cqc:audit:dead-letter:v1`) and automatic 15-minute HMAC chain replay.
  3. Rotated development/staging secrets and enforced startup secret validation (`assertJwtSecretConfigured()`, `assertEncryptionKeyConfigured()`, `assertAuditSigningKeyConfigured()`).
- **ICO Notification Determination:** **Not Required** under UK GDPR Art 33(1) as the files contained only synthetic development artifacts and posed no risk to the rights and freedoms of real data subjects.

### Git History Purge Procedure (For Repository Administrators)
To permanently purge historical blobs of `audit-dead-letter.jsonl` and `cookies.txt` from all prior git commits before sharing the repository externally, run:
```bash
git filter-repo --invert-paths \
  --path apps/backend/audit-dead-letter.jsonl \
  --path cookies.txt \
  --force
git push origin --force --all
```

