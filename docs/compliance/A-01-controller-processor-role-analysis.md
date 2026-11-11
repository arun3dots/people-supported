# CantraCare — Data Protection Controller vs. Processor Statutory Role Analysis

**Document Reference**: POL-UKGDPR-A01  
**Statutory Basis**: UK General Data Protection Regulation (UK GDPR) Articles 4(7), 4(8), 24, 28; Data Protection Act 2018 (DPA 2018); Data (Use and Access) Act (DUAA); Health and Social Care Act 2008 (Regulated Activities) Regulations 2014: Regulation 17.  
**Classification**: Public / Regulatory Compliance Pack  
**Effective Date**: November 2026  
**Review Cycle**: Annual / Mandatory on material platform architecture change.

---

## 1. Executive Summary & Purpose

CantraCare ("the Platform", operated by CantraCare Technologies Ltd.) provides multi-tenant electronic care planning, electronic Medication Administration Records (eMAR), vital signs monitoring (NEWS2), safeguarding registers, and operational workforce management software to registered care home operators ("Tenants" or "Providers") in the United Kingdom.

Under UK data protection law, the precise allocation of responsibilities between **Data Controller** and **Data Processor** governs statutory accountability, mandatory record-keeping, direct liability, and regulatory reporting obligations to the Information Commissioner's Office (ICO).

This analysis formally delineates:
1. When CantraCare acts strictly as a **Data Processor** on behalf of Care Home Tenants.
2. When Care Home Tenants act as the sole **Data Controller**.
3. When CantraCare acts as an independent **Data Controller** for its own business operations.
4. Why CantraCare and its Tenants **do NOT** act as Joint Controllers for resident care records.

---

## 2. Statutory Definitions (UK GDPR Art. 4)

- **Data Controller (Art. 4(7))**: The natural or legal person, public authority, agency or other body which, alone or jointly with others, determines the **purposes and means** of the processing of personal data.
- **Data Processor (Art. 4(8))**: A natural or legal person, public authority, agency or other body which processes personal data **on behalf of the controller**.
- **Data Subject (Art. 4(1))**: An identified or identifiable living individual (e.g., care home resident, resident family member, or care home staff member).
- **Special Category Data (Art. 9(1))**: Personal data revealing racial or ethnic origin, political opinions, religious beliefs, trade union membership, genetic data, biometric data for identification purposes, and **data concerning health** or sex life.

---

## 3. Allocation Matrix of Roles by Processing Activity

| Processing Domain / Data Category | Data Subjects | Purpose of Processing | Controller | Processor | Lawful Basis (UK GDPR) |
|---|---|---|---|---|---|
| **Resident Clinical Records** (Care plans, eMAR, observations, NEWS2 vitals, DNACPR, body maps) | Residents | Delivery of direct adult social care, medication safety, CQC compliance | **Care Home Tenant** | **CantraCare** | Art. 6(1)(c) (Legal obligation), Art. 6(1)(d) (Vital interests), Art. 9(2)(h) (Health/social care provision) |
| **Resident Demographics & Identity** (Name, DOB, NHS number, room allocation, funding type) | Residents | Resident identification, tenancy tracking, local authority billing | **Care Home Tenant** | **CantraCare** | Art. 6(1)(b) (Contract), Art. 6(1)(c) (CQC Reg 17), Art. 9(2)(h) |
| **Staff Employment & HR Records** (Shifts, rota assignments, DBS checks, training certifications, right to work) | Care Staff | Workforce scheduling, safer recruitment compliance (CQC Reg 19) | **Care Home Tenant** | **CantraCare** | Art. 6(1)(b) (Employment contract), Art. 6(1)(c) (CQC Reg 19), DPA 2018 Sch. 1 Pt. 1 |
| **Safeguarding & Incident Reports** (Care Act s.42 referrals, accident forms, injury maps) | Residents, Staff, Visitors | Investigating and reporting harm, local authority and CQC notifications | **Care Home Tenant** | **CantraCare** | Art. 6(1)(c) (Care Act 2014 & CQC Reg 13), Art. 9(2)(b) / 9(2)(g) |
| **Tenant Account Administration** (Admin name, business email, billing address, direct debit details) | Tenant Representatives | Commercial account provisioning, invoicing, contract execution | **CantraCare** | *None (Direct Controller)* | Art. 6(1)(b) (Performance of SaaS agreement) |
| **Security & Immutable Audit Logs** (User logins, token rotation, failed authentications, IP address, audit hashes) | All System Users | System integrity, cybersecurity defense, audit trail under NHS DSPT / CQC | **CantraCare & Tenant** *(Independent)* | **CantraCare** *(as platform host)* | Art. 6(1)(c) (Legal obligation - CQC Reg 17), Art. 6(1)(f) (Legitimate interest - cybersecurity) |
| **Platform Telemetry & Aggregated Performance** (Aggregated API latency, error rates, anonymized usage metrics) | N/A (Fully Anonymized) | Infrastructure scaling, feature optimization, bug fixing | **CantraCare** | *None* | Outside UK GDPR scope (strictly anonymized under ICO Anonymisation Code) |

---

## 4. In-Depth Role Breakdown

### 4.1 CantraCare as Data Processor (Primary Role)
For all **Resident Data** and **Tenant Staff Operational Data** entered into the SaaS platform:
- The **Care Home Tenant is the Data Controller**. The Tenant decides:
  - Which residents are admitted and what information is recorded.
  - What care plans, risk assessments, and medication regimes are scheduled.
  - Who among their staff is granted access and under what permissions.
  - How long records are retained in accordance with statutory adult social care retention schedules (minimum 8 years post-discharge/death).
  - When records are archived, rectified, restricted, or transferred.
- **CantraCare acts strictly as Data Processor**. CantraCare:
  - Processes resident and clinical data solely upon the documented instructions of the Tenant (governed by the statutory Data Processing Agreement under Art. 28).
  - Does NOT monetize, sell, train generalized public AI models, or share resident data with third parties.
  - Implements multi-tenant logical isolation ensuring data for Tenant A is strictly segregated from Tenant B at the database query layer (`tenantId` JWT scoping).
  - Implements technical and organizational security measures (AES-256 encryption at rest, TLS 1.3 in transit, role-based access control, cryptographic audit logging).

### 4.2 CantraCare as Independent Data Controller (Limited Role)
CantraCare acts as an independent Controller only for:
1. **Commercial Contract & Billing Administration**: Maintaining records of the legal entity subscribed, corporate contact persons, billing history, and payment processing via FCA-regulated payment gateways.
2. **Platform Security Infrastructure**: Maintaining authentication metadata, connection security logs, and access logs necessary to protect the platform against cyberattacks, DDoS, and credential stuffing.
3. **Regulatory Liaison**: Maintaining correspondence with the ICO, MHRA, and national security bodies regarding platform certifications and compliance audits.

### 4.3 Why Joint Controllership Does NOT Apply
Under UK GDPR Article 26 and ICO Guidance, joint controllership arises only where two or more entities *jointly determine the purposes and means of the same processing operations*.
- CantraCare has no clinical or care remit over the resident; it does not determine what clinical treatment is provided or why data is collected.
- The Tenant has no influence or determination over CantraCare's underlying cloud architecture, database indexing, or internal engineering infrastructure.
- Therefore, the relationship is strictly **Controller-to-Processor** under Article 28, completely avoiding the legal ambiguity of joint liability under Article 26.

---

## 5. Compliance with DUAA & Statutory Rights Fulfillment

Under the UK Data (Use and Access) Act (DUAA) and UK GDPR Chapter III:
1. **Data Subject Access Requests (DSARs)**:
   - When a resident, family member, or carer submits a DSAR to CantraCare regarding resident clinical data, CantraCare must notify the relevant Tenant Data Controller within two (2) working days.
   - CantraCare provides automated redacting SAR export tools (`POST /api/residents/:id/sar-export`) to assist the Tenant Controller in fulfilling requests within the statutory 1-month SLA (or 28 days for DUAA complaints).
2. **Clinical Rectification (Art. 16 & CQC Reg 17)**:
   - To prevent the destruction of medical history, clinical rectification uses an immutable strike-through model (`POST /api/observations/:id/correct` and `/api/medications/administrations/:id/amend`) preserving original entries marked `isSuperseded: true`.
3. **Right to Erasure & Legal Hold (Art. 17(3)(b) & (c))**:
   - Care records are exempt from absolute erasure during the statutory adult social care retention period (8 years post-discharge). Requests are handled via `recordState: "Restricted"` or `"LegalHold"`.

---

## 6. Document Governance & Approvals

| Role | Name | Signature / Confirmation | Date |
|---|---|---|---|
| **Data Protection Officer (DPO)** | Compliance Lead, CantraCare | *Confirmed by DPO Office* | 04 Nov 2026 |
| **Chief Technology Officer** | Architecture Lead, CantraCare | *Approved Technical Safeguards* | 04 Nov 2026 |
| **Clinical Safety Officer** | Clinical Safety Lead (NMC/GMC) | *Approved Clinical Boundary* | 04 Nov 2026 |

