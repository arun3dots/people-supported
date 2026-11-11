# H-02 — International Data Transfers: UK IDTA & Transfer Risk Assessment (TRA)

**Document ID:** `CC-TRA-2026-01`  
**Version:** `1.0`  
**Effective Date:** `29 October 2026`  
**Regulatory Scope:** UK GDPR Chapter V (Articles 44–49), Data (Use and Access) Act 2025 (DUAA) s.85, ICO International Data Transfer Agreement (IDTA) & TRA Guidance.

---

## 1. Data Residency Architecture (`H-01`)

All primary production data stores containing Care Home resident clinical records and staff HR records are hosted strictly within the **United Kingdom**:
- **Primary Database (PostgreSQL):** Google Cloud Platform `europe-west2` (London, UK).
- **Clinical Document & Media Storage:** Google Cloud Storage `europe-west2` (London, UK).
- **SMS Gateway:** AWS SNS `eu-west-2` (London, UK).

---

## 2. Inventory of Restricted International Transfers & Safeguards (`H-02`)

Where limited personal data is accessed from or transmitted outside the UK, CantraCare applies the following UK GDPR Article 46 transfer mechanisms and technical supplementary measures:

| Transfer Scenario | Recipient & Country | Categories of Personal Data | UK GDPR Art 46 Mechanism | Technical Supplementary Measures |
|---|---|---|---|---|
| **1. Engineering & Tier-3 Support Access (3Dots Engineering)** | Authorised DevOps / Support Engineers in **India** | Encrypted database maintenance / production troubleshooting telemetry | **UK ICO International Data Transfer Agreement (IDTA)** executed between CantraCare UK Ltd and 3Dots India entity | • Field-level AES-256-GCM encryption on `nhsNumber`, `dob`, `niNumber`, `dbsNumber`, `certificateNumber`, `mfaSecret`, `phoneNumber`, `addressLine1` (`@repo/db`)<br>• Production `ENCRYPTION_KEY` held in UK Secret Manager (engineers cannot decrypt special-category fields locally)<br>• Mandatory MFA + RBAC + immutable `AuditLog` tracking |
| **2. Commercial SaaS Billing (`RazorpayService`)** | Razorpay Software Pvt. Ltd. (**India**) | Tenant Care Home business contact name, email, phone, and B2B subscription invoice amount (**Zero resident health data**) | **UK IDTA / Standard Contractual Clauses** + UK GDPR Art 49(1)(b) contract necessity for B2B billing | • Strict architectural separation: `RazorpayService` only receives `Tenant` commercial billing metadata; no `Resident` or clinical models are ever queried or transmitted |
| **3. Transactional Email (`EmailService` via Resend)** | Resend Inc. (**United States / EU**) | Staff work email, invitation links, MFA/password reset OTPs (**Zero resident clinical payload**) | **UK International Data Transfer Addendum** to the EU Commission SCCs | • TLS 1.3 in transit; no clinical care notes or NHS numbers are included in email bodies |
| **4. Mobile Push Alerts (`PushNotificationService` via FCM)** | Google LLC (**United States / Global**) | Device push token + pseudonymised clinical alert (`C-09`) | **UK Addendum to EU SCCs** (Google Cloud / Firebase Data Processing and Security Terms) | • **Pseudonymisation (`C-09`)**: Resident full names are stripped and replaced with initials + 4-char short ID (e.g., `J.S. (#a1b2)`) before payload leaves the UK backend |

---

## 3. Transfer Risk Assessment (TRA) — DUAA 2025 s.85 Data Protection Test

In accordance with the ICO's 6-step Transfer Risk Assessment tool and the Data (Use and Access) Act 2025 s.85 standard (*whether the standard of protection provided for data subjects is not materially lower than under UK law*):

1. **Assessment of India Transfers (3Dots Support & Razorpay):**
   - **Legal Framework:** India enacted the Digital Personal Data Protection Act (DPDPA) 2023 establishing statutory data security obligations and a Data Protection Board.
   - **Supplementary Technical Controls:** Because special-category resident identifiers are encrypted at the application layer with AES-256-GCM (`@repo/db`) and B2B billing via Razorpay is strictly segregated from resident clinical tables, third-party or public-authority access in the destination jurisdiction cannot reconstruct identifiable resident health records.
   - **Conclusion:** Residual risk to data subjects' fundamental rights and freedoms is **Low**. The standard of protection is **not materially lower** than under UK GDPR.

2. **Assessment of US Transfers (Resend & Google FCM):**
   - **Legal Framework & Safeguards:** Governed by the UK Extension to the EU-US Data Privacy Framework / UK Addendum to SCCs, reinforced by payload pseudonymisation (`C-09`) so no identifiable special-category health data transits FCM or Resend.
   - **Conclusion:** Residual risk is **Low**.

