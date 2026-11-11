# CantraCare — Sub-Processor Register & DPA Compliance Tracker

**Document Reference**: SUB-REG-A11  
**Statutory Basis**: UK General Data Protection Regulation (UK GDPR) Articles 28(2), 28(4), 44–49; Data Protection Act 2018; UK International Data Transfer Agreement (IDTA).  
**Classification**: Public Compliance Register / Updated Quarterly  
**Effective Date**: November 2026

---

## 1. Overview & Statutory Requirements

Under Article 28(2) and 28(4) of the UK GDPR, a Data Processor (CantraCare) shall not engage another processor (a "Sub-Processor") without prior specific or general written authorization of the Data Controller (the Care Home Tenant). In the case of general written authorization, the processor must inform the controller of any intended changes concerning the addition or replacement of other processors, thereby giving the controller the opportunity to object.

CantraCare imposes the same data protection obligations as set out in the Data Processing Agreement between CantraCare and the Tenant onto every Sub-Processor by way of a legally binding contract or standard contractual clauses.

---

## 2. Approved Sub-Processor Inventory

| Sub-Processor Entity | Service / Processing Activity Provided | Data Subject Categories | Personal Data Processed | Processing Location / Region | Transfer Mechanism (if outside UK) | DPA / BAA Execution Date | Security Certifications |
|---|---|---|---|---|---|---|---|
| **Amazon Web Services EMEA SARL (AWS)** | Cloud Infrastructure (EC2, ECS, RDS PostgreSQL, S3, KMS) | Residents, Staff, Tenant Users | Full application database, encrypted medical records, wound photos, backups | **London, UK (`eu-west-2`)** | N/A (Domestic UK Processing) | 12 Jan 2026 (AWS GDPR DPA) | ISO 27001, SOC 1/2/3, Cyber Essentials Plus, NHS DSPT |
| **Upstash Inc.** | Distributed Cache & API Rate Limiting (Redis) | Platform Users, Visitors | IP addresses, session identifiers, rate limit counters, lock tokens | **London, UK (`eu-west-2`)** | N/A (Domestic UK Processing) | 03 Feb 2026 (Enterprise DPA) | SOC 2 Type II, ISO 27001 |
| **Twilio Ireland Ltd. / Twilio Inc.** | SMS Gateway & Emergency Alert Dispatch | Staff, On-Call Managers | Mobile phone numbers, notification timestamps, pseudonymized clinical alert alerts | **Dublin, Ireland (EU) / UK Gateway** | UK Adequacy Regulations for EEA / Twilio Binding Corporate Rules (BCRs) | 18 Mar 2026 (Twilio DPA + BCRs) | ISO 27001, SOC 2 Type II |
| **Google LLC (Firebase Cloud Messaging - FCM)** | Mobile Device Push Notification Routing | Care Staff, Nurses | Device push registration tokens, app bundle IDs, pseudonymized event titles | **London, UK (`europe-west2`) / EU** | UK Adequacy Regulations / Google Cloud DPA | 24 Feb 2026 | ISO 27001, SOC 2/3 |

---

## 3. Strict UK Data Sovereignty Guarantees

> [!NOTE]
> **No Resident Identifiable Health Data Leaves the UK**:
> CantraCare configures all database storage (RDS), object storage (S3), and in-memory caches exclusively within the **AWS `eu-west-2` (London)** cloud data center. Resident health records, eMAR charts, and wound images are stored and processed strictly within the United Kingdom.

### 3.1 Pseudonymized Notification Payload Standard (`C-09`)
For external communication providers (Twilio SMS and Firebase Cloud Messaging):
- **Full Resident Names are Excluded**: Notifications sent to staff mobile devices never include full resident names, NHS numbers, or diagnoses.
- Notifications utilize standardized pseudonymization (e.g., `"High NEWS2 Escalation recorded for Resident J.D. (Room 12)"`).
- Direct clinical details are accessible only by authenticating through the application behind multi-factor authentication.

---

## 4. Sub-Processor Change Notification & Right to Object

### 4.1 30-Day Prior Written Notice Procedure
1. When CantraCare plans to engage a new Sub-Processor or replace an existing Sub-Processor, CantraCare will provide written notice to all Tenant Account Administrators at least **thirty (30) calendar days** before the Sub-Processor commences processing of customer personal data.
2. Notification is delivered via:
   - Email to registered Tenant Administrative and DPO contacts.
   - An in-app administrative dashboard banner notification.
   - Updates to this public Sub-Processor Register.

### 4.2 Tenant Right to Object (UK GDPR Art. 28(2))
1. A Tenant has the right to object in writing to the appointment of a new Sub-Processor on reasonable grounds relating to data protection within thirty (30) days of receiving the notification.
2. If the Tenant objects:
   - CantraCare will enter into good-faith technical and legal discussions with the Tenant to determine if processing can be configured without utilizing the objected-to Sub-Processor.
   - If CantraCare is unable to accommodate the objection on technical or operational grounds within thirty (30) days, the Tenant may terminate the affected SaaS subscription without penalty and obtain a full offboarding export of their data under Article 28(3)(g).

---

## 5. Due Diligence and Ongoing Monitoring

CantraCare conducts formal vendor risk assessments prior to onboarding any Sub-Processor, reviewing:
1. Valid third-party security certifications (ISO 27001:2022, SOC 2 Type II, Cyber Essentials Plus).
2. Verification of UK/EEA data center hosting options.
3. Enforceability of Article 28 flow-down contractual terms, including immediate incident notification (≤ 24 hours).
4. Financial viability and business continuity arrangements.

The Sub-Processor Register is audited quarterly by the Data Protection Officer.

