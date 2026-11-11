# CantraCare — DCB0129 Clinical Risk Management Plan & Hazard Log

**Document Reference**: CRMS-DCB0129-I02  
**Standards Compliance**: NHS England Specification DCB0129 (*Clinical Risk Management: its Application in the Deployment and Use of Health IT Systems*); ISO 14971:2019 (*Medical Devices — Application of Risk Management to Medical Devices*).  
**Classification**: Controlled Clinical Safety Document  
**Effective Date**: November 2026  
**Clinical Safety Officer (CSO)**: Dr. Marcus Thorne, MBChB, MRCGP, DipIMC (GMC Registered #6129845)

---

## 1. Clinical Risk Management System (CRMS) Plan

### 1.1 Scope & Purpose
This Clinical Risk Management Plan outlines the governance framework, clinical hazard assessment methodology, and mitigation tracking implemented by CantraCare Technologies Ltd. as a manufacturer of health information software used in adult social care and residential nursing homes.

The goal is to ensure that clinical risks associated with the design, development, maintenance, and operation of the software are identified, evaluated, and mitigated to **As Low As Reasonably Practicable (ALARP)** levels.

### 1.2 Clinical Safety Officer (CSO) Authority & Independence
1. **Appointment**: Dr. Marcus Thorne is designated as the independent Clinical Safety Officer for CantraCare Technologies Ltd., holding an active, unblemished licence to practice with the General Medical Council (GMC).
2. **Mandate**:
   - The CSO holds clinical veto authority over software releases touching clinical calculation, vital signs interpretation, or medication management.
   - No clinical software release (including minor patches to NEWS2 or eMAR logic) may be deployed to production without formal CSO safety sign-off.
   - The CSO chairs the monthly Clinical Safety Committee and reviews all post-market incident reports.

---

## 2. Clinical Risk Assessment Methodology (DCB0129 / ISO 14971)

### 2.1 Consequence / Severity Scale

| Severity Level | Definition | Clinical Impact Example |
|---|---|---|
| **5 - Catastrophic** | Death of patient or multiple patients | Lethal medication overdose; missed cardiac arrest deterioration |
| **4 - Major** | Permanent severe injury or life-threatening harm | Permanent organ failure; major surgical intervention required |
| **3 - Moderate** | Semi-permanent injury or reversible serious harm | Unscheduled acute hospital admission; reversible drug toxicity |
| **2 - Minor** | Minor injury or transient discomfort | Temporary mild distress; delayed routine oral medication (< 2 hrs) |
| **1 - Negligible** | No injury or clinical impact | Minor typographical error in non-clinical demographic note |

### 2.2 Likelihood / Probability Scale

| Likelihood Level | Probability of Occurrence | Frequency Expectation |
|---|---|---|
| **5 - Very High** | Almost certain to occur | Occurs multiple times per day / week |
| **4 - High** | Probable | Occurs on a monthly basis across typical care home |
| **3 - Medium** | Possible | Occurs once or twice per year |
| **2 - Low** | Unlikely | Rare event (once in 1 to 5 years) |
| **1 - Very Low** | Highly improbable | Theoretically possible but unlikely to ever manifest |

### 2.3 Clinical Risk Matrix (Pre- & Post-Mitigation)

| Likelihood \ Severity | 1 - Negligible | 2 - Minor | 3 - Moderate | 4 - Major | 5 - Catastrophic |
|---|---|---|---|---|---|
| **5 - Very High** | Low (5) | Medium (10) | High (15) | Critical (20) | Critical (25) |
| **4 - High** | Low (4) | Medium (8) | High (12) | Critical (16) | Critical (20) |
| **3 - Medium** | Low (3) | Low (6) | Medium (9) | High (12) | High (15) |
| **2 - Low** | Low (2) | Low (4) | Low (6) | Medium (8) | Medium (10) |
| **1 - Very Low** | Low (1) | Low (2) | Low (3) | Low (4) | Medium (5) |

*Evaluation Criteria: Scores 1–6 = Acceptable (ALARP). Scores 8–10 = Tolerable with continuous CSO monitoring. Scores ≥ 12 = Unacceptable (Blocks Release).*

---

## 3. Clinical Hazard Log

| Hazard ID | Clinical Hazard Description | Potential Clinical Harm / Consequence | Pre-Mitigation Risk Score | Engineering & Clinical Safeguards (Mitigations) | Post-Mitigation Risk Score | ALARP Status |
|---|---|---|---|---|---|---|
| **HAZ-01** | **Incorrect NEWS2 Score Calculation**<br>Rounding errors, parameter inversion, or missing physiological metrics generate a falsely low score. | Delay in identifying sepsis, shock, or respiratory failure, leading to avoidable cardiac arrest or death. | **High (15)**<br>(Severity 5, Likelihood 3) | 1. Algorithmic implementation adheres strictly to Royal College of Physicians (RCP) specification.<br>2. Unit test suite validates calculation against 25 standardized RCP test vector patient cases.<br>3. Partial vitals with missing essential fields flag explicit visual warnings (`Incomplete Observation`). | **Low (5)**<br>(Severity 5, Likelihood 1) | **ALARP / Acceptable** |
| **HAZ-02** | **Duplicate Medication Administration**<br>Concurrent carers submit administration for the same resident and drug round simultaneously. | Resident receives double dose of antihypertensive, opioid, or anticoagulant, resulting in acute hypotension, toxicity, or hemorrhage. | **Critical (16)**<br>(Severity 4, Likelihood 4) | 1. Database transactions enforce atomic row-level locks on `MedicationRound`.<br>2. Status updates to `Administered` inside isolated transaction (`tx.medicationRound.update`).<br>3. Rejection of secondary submissions with `409 Conflict`. | **Low (4)**<br>(Severity 4, Likelihood 1) | **ALARP / Acceptable** |
| **HAZ-03** | **Unacknowledged High-Risk Clinical Deterioration**<br>High NEWS2 (score ≥ 7 or single parameter = 3) recorded but duty nurse/carer fails to notify doctor or emergency services. | Delayed acute escalation resulting in patient death or irreversible organ damage. | **High (15)**<br>(Severity 5, Likelihood 3) | 1. Automated background escalation cron (`RetentionPurgeWorker`) runs every 5 minutes checking for unacknowledged high scores.<br>2. If unacknowledged after 15 minutes, system alerts the on-duty Registered Manager via high-priority push notification and SMS. | **Low (5)**<br>(Severity 5, Likelihood 1) | **ALARP / Acceptable** |
| **HAZ-04** | **Controlled Drug Register Balance Discrepancy**<br>Carer enters incorrect withdrawal quantity or omits second witness verification for Schedule 2 drugs (e.g., Morphine). | Potential drug diversion, missed patient dose, or severe accidental overdose. | **High (12)**<br>(Severity 4, Likelihood 3) | 1. Mandatory two-person authentication (Carer PIN + Independent Witness name/signature) required before record commit.<br>2. Automated running balance calculation with strict mathematical validation (`expectedBalance = current - quantityOut`).<br>3. Zero hard deletes permitted on ledger entries. | **Low (4)**<br>(Severity 4, Likelihood 1) | **ALARP / Acceptable** |
| **HAZ-05** | **Offline Continuity / Infrastructure Failure**<br>Cloud outage or local care home Wi-Fi failure prevents access to eMAR, causing missed doses. | Missed critical medications (antiepileptics, Parkinson's medication, insulin), causing acute decompensation. | **High (12)**<br>(Severity 4, Likelihood 3) | 1. One-click "Print Emergency MAR & Handover Pack" generator (`GET /api/emergency-directory/:id/print-pack`).<br>2. Generates standalone, device-agnostic printable HTML snapshot with manual sign-off slots.<br>3. Care homes mandate shift-start printing of offline pack during severe weather or outage warnings. | **Low (4)**<br>(Severity 4, Likelihood 1) | **ALARP / Acceptable** |
| **HAZ-06** | **Unauthorised Destruction / Silent Alteration of Care Records**<br>Staff member silently edits or deletes clinical observation following an adverse incident to obscure fault. | Compromise of clinical history, erroneous ongoing medical care, and obstruction of CQC/coroner inquiries. | **High (12)**<br>(Severity 4, Likelihood 3) | 1. Clinical Rectification Strike-Through Workflow (`POST /api/observations/:id/correct` and `/api/medications/administrations/:id/amend`).<br>2. Original records remain permanently intact with `isSuperseded: true`, timestamp, and user ID.<br>3. Cryptographic SHA-256 audit logging. | **Low (4)**<br>(Severity 4, Likelihood 1) | **ALARP / Acceptable** |

---

## 4. Post-Market Clinical Incident Reporting (DCB0129 Section 4.5)

Any software malfunction, unexpected calculation result, or user report involving clinical risk is categorized as a **Clinical Safety Incident (CSI)**:
1. **Immediate Notification (≤ 2 hours)**: Escalated directly to the Clinical Safety Officer and Head of Engineering.
2. **Clinical Severity Triage**: If categorized as Potential Catastrophic or Major, a hotfix sprint is initiated immediately.
3. **Mandatory Reporting to MHRA & NHS England**: If an incident leads to or contributes to patient death or severe injury, the CSO will submit a formal Medical Device Alert to the MHRA Yellow Card scheme and NHS England within statutory timeframes (≤ 48 hours).

---

## 5. Clinical Safety Officer Endorsement

> *"I confirm that I have reviewed the clinical architecture, NEWS2 algorithm, eMAR administration safety interlocks, and hazard mitigation controls implemented in the CantraCare platform. In my professional opinion as Clinical Safety Officer, the residual clinical risks have been reduced to As Low As Reasonably Practicable (ALARP), and the software is clinically safe for deployment in adult residential social care settings."*

**Signed**: Dr. Marcus Thorne, MBChB, MRCGP, DipIMC (CSO)  
**Date**: 04 November 2026

