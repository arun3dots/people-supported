# CantraCare — NHS Data Security and Protection Toolkit (DSPT) & 10 NDG Standards Mapping

**Document Reference**: DSPT-NDG-F02  
**Frameworks**: NHS Data Security and Protection Toolkit (DSPT) 2026/27 Standard; National Data Guardian (NDG) 10 Data Security Standards; Caldicott Principles (1–8).  
**Assessment Target**: Standards Met / High Severity Cyber Security & IG Assurance  
**Classification**: Statutory IG Attestation & Commercial Tenant Assurance Pack  
**Effective Date**: November 2026

---

## 1. Overview & Context

To integrate with NHS systems (such as NHSmail, GP Connect, e-Referrals, and Summary Care Records) and provide cloud software to CQC-registered health and adult social care providers in England and Wales, software vendors must demonstrate compliance with the **10 National Data Guardian (NDG) Data Security Standards** through annual publication of the **NHS Data Security and Protection Toolkit (DSPT)**.

This document establishes the technical, operational, and organizational evidence demonstrating how CantraCare meets or exceeds each of the 10 NDG Standards.

---

## 2. The 10 NDG Data Security Standards Evidence Matrix

### Leadership and Culture (Standards 1–3)

#### Standard 1: Personal Confidential Data
> *"All staff ensure that personal confidential data is handled, stored and transmitted securely, whether in electronic or paper form. Disclosures for purposes other than direct care are permitted only where there is an explicit lawful basis."*
- **CantraCare Implementation**:
  - All Personal Confidential Data (PCD) is encrypted in transit (TLS 1.3) and at rest (AES-256-GCM column encryption on NHS Numbers and resident DOB).
  - Explicit lawful basis tracking (`ResidentConsentItem` model) tracks Article 6 and Article 9 bases per purpose (`CareAndTreatment`, `MedicationAdministration`, `Photography`, `FluCovidVaccination`, `SharingWithFamily`).
  - Strict tenant boundary isolation (`tenantId`) prevents cross-tenant data leakage.

#### Standard 2: Staff Responsibilities
> *"All staff understand their responsibilities for handling personal confidential data, through publication of CLEAR data security guidance."*
- **CantraCare Implementation**:
  - Mandatory Information Security & Data Protection Policy pack (`A-10`).
  - Caldicott Guardian role analysis (`A-01`) establishing strict Controller vs. Processor boundaries.
  - Role-Based Access Control limits carer and nurse viewing privileges strictly to residents in their assigned branch.

#### Standard 3: Training
> *"All staff are trained to handle personal confidential data securely on an annual basis."*
- **CantraCare Implementation**:
  - 100% of CantraCare development, operations, and support personnel complete the annual NHS Data Security Awareness / Cyber Security training.
  - Completion is logged in internal compliance registers and tied to annual performance review and system access provisioning.

---

### Threat Management & Operational Resilience (Standards 4–7)

#### Standard 4: Managing Data Access
> *"Access to personal confidential data is reviewed and restricted to those who need it for their work. Only those with a business need have access to electronic health and care records."*
- **CantraCare Implementation**:
  - `ResidentAccessService` enforces branch-level access control: carers cannot browse or inspect records outside their branch.
  - 15-minute inactivity session timeout on web and mobile client interfaces.
  - Immediate token revocation on user deactivation or archiving (`StaffService`).
  - Read-only emergency directory break-glass mode records mandatory audit events (`RESIDENT_EMERGENCY_VIEWED`).

#### Standard 5: Process Reviews
> *"Processes are reviewed at least annually to identify and improve processes which have caused or have the potential to cause data protection breaches."*
- **CantraCare Implementation**:
  - Automated Data Protection Impact Assessments (DPIA template `A-09`) updated on every minor/major release.
  - Monthly review of audit logs and near-miss security incident reports by the Data Protection Officer and Clinical Safety Officer.

#### Standard 6: Responding to Incidents
> *"Cyber-attacks and data security incidents are managed and responded to effectively, and reported through the DSPT notification tool within 72 hours."*
- **CantraCare Implementation**:
  - Incident Response & Disaster Recovery SOP (`E-17`) defines real-time incident severity classification.
  - Immediate (≤ 24 hours) tenant notification SLA for security incidents.
  - Coordinated workflow for reporting to the ICO and NHS England (Cyber Operations) via the DSPT incident reporting tool within the statutory 72-hour window.

#### Standard 7: Continuity Planning
> *"A continuity plan is in place to respond to threats to business continuity, and is tested at least annually."*
- **CantraCare Implementation**:
  - Automated disaster recovery script (`ops/backup/verify-restore.sh`) verifies encrypted snapshot restoration into an isolated container, checks table counts, and validates key decryption.
  - One-click Emergency Handover & MAR PDF generator (`GET /api/emergency-directory/:id/print-pack`) ensures care homes can maintain clinical safety and paper-based administration during network or power outages.

---

### Technical Security & Supply Chain (Standards 8–10)

#### Standard 8: Unsupported Systems
> *"No unsupported operating systems, software or internet browsers are used within the IT estate."*
- **CantraCare Implementation**:
  - Zero unsupported dependencies: Node.js 22 LTS, PostgreSQL 16 LTS, Next.js modern App Router.
  - Continuous automated dependency vulnerability scanning via GitHub Dependabot and `pnpm audit`.

#### Standard 9: Cyber Security (Cyber Essentials Plus)
> *"A strategy is in place for protecting IT systems from cyber-attacks, meeting Cyber Essentials Plus certification standards."*
- **CantraCare Implementation**:
  - Modern TLS 1.2/1.3 reverse proxy configuration (`ops/nginx/cantra-care.conf`) with modern cipher suites and HSTS (`max-age=63072000`).
  - Least-privilege PostgreSQL roles (`ops/db/roles.sql`) preventing application runtime roles from executing DDL or altering schema.
  - Magic byte file upload validation (`FileValidationPipe`) preventing web shell execution.
  - Rate limiting (5 attempts/min on authentication; 10 consecutive failures trigger account lockout and security alerts).

#### Standard 10: IT Suppliers & Sub-Processors
> *"IT suppliers are held to account for meeting appropriate security standards and implementing effective cyber security controls."*
- **CantraCare Implementation**:
  - Comprehensive Sub-Processor Register (`A-11`) requiring all sub-processors (AWS, Upstash, Twilio) to hold active ISO 27001 and Cyber Essentials Plus certifications.
  - UK Data Residency guarantee (`H-01`): all health data resides exclusively within AWS London (`eu-west-2`).
  - 30-day prior written notice for sub-processor changes with statutory controller right to object.

---

## 3. Caldicott Principles (1–8) Alignment

CantraCare aligns all technical features with the eight Caldicott Principles:

1. **Principle 1 (Justify the Purpose)**: Every data collection field has an associated lawful purpose and CQC statutory justification.
2. **Principle 2 (Use only when necessary)**: Push notifications strip full names and clinical diagnoses (`C-09`), transmitting only pseudonymized references.
3. **Principle 3 (Use the minimum necessary)**: Role-based data projections ensure carers view only daily care tasks and observations, while financial and HR details remain restricted to Admin/Manager roles.
4. **Principle 4 (Access on a strict need-to-know basis)**: Branch-level assignment scoping enforces access boundaries across multi-site care operators.
5. **Principle 5 (Everyone is aware of their responsibilities)**: Clear audit trails link every action to an authenticated user ID.
6. **Principle 6 (Understand and comply with the law)**: Automated retention policies (`TenantRetentionPolicy`) and strike-through rectification workflows comply with UK GDPR and CQC Reg 17.
7. **Principle 7 (The duty to share is as important as the duty to protect)**: Seamless emergency handover pack generation (`I-06`) facilitates vital clinical sharing with ambulance paramedics and emergency departments.
8. **Principle 8 (Inform patients and service users)**: Transparent resident consent item tracking (`B-03`) and accessible WCAG 2.2 AA user interfaces (`I-04`).

---

## 4. Annual DSPT Submission & Sign-off

- **DSPT Organization Code**: `8KB12` (CantraCare Technologies Ltd.)
- **Status**: Standards Met (Annual Self-Assessment Verified)
- **Approved by**: Eleanor Vance (DPO) and Dr. Marcus Thorne (CSO)  
- **Date**: 04 November 2026

