# CantraCare — UK Medical Devices Regulations (UK MDR 2002) Classification Analysis

**Document Reference**: CLIN-MDR-I01  
**Statutory Basis**: Medical Devices Regulations 2002 (SI 2002 No 618, as amended); MHRA Guidance on Medical Device Stand-Alone Software (including apps); EU MDR 2017/745 Annex VIII Rule 11 (referenced for international harmonisation).  
**Classification**: Clinical Safety & Regulatory Assurance Document  
**Effective Date**: November 2026  
**Clinical Reviewer**: Clinical Safety Officer (GMC/NMC Registered)

---

## 1. Executive Summary & Purpose

Software applications used in healthcare and social care may fall within the statutory definition of a **Medical Device** under the UK Medical Devices Regulations 2002 (as amended) if their manufacturer intends them to be used for diagnostic, monitoring, or therapeutic clinical purposes.

This analysis evaluates the modular capabilities of the CantraCare multi-tenant platform—specifically:
1. The **National Early Warning Score 2 (NEWS2)** physiological score calculator.
2. The **Electronic Medication Administration Records (eMAR)** administration scheduling.
3. The **Body Map & Wound Tracking** measurement and staging module.
4. The **Fluid & Nutrition Balance** intake aggregations.

The objective is to establish whether CantraCare qualifies as **Software as a Medical Device (SaMD)**, determine its statutory classification (Class I vs Class IIa), and define the clinical safety governance requirements.

---

## 2. Statutory Legal Framework (UK MDR 2002 & MHRA Guidance)

### 2.1 Definition of a Medical Device (Regulation 2)
Under Regulation 2 of the UK MDR 2002, a medical device is defined as:
> *"Any instrument, apparatus, appliance, software, material or other article... intended by the manufacturer to be used for human beings for the purpose of:*
> *(a) diagnosis, prevention, monitoring, treatment or alleviation of disease,*
> *(b) diagnosis, monitoring, treatment, alleviation of or compensation for an injury or handicap,*
> *(c) investigation, replacement or modification of the anatomy or of a physiological process..."*

### 2.2 MHRA Step-by-Step SaMD Determination Flowchart

```mermaid
flowchart TD
    Q1["Does the software process, analyze, or calculate clinical patient data?"]
    Q1 -->|No| R_NOT["NOT A MEDICAL DEVICE\n(Administrative/Scheduling only)"]
    Q1 -->|Yes| Q2["Does the software merely store, transmit, or retrieve patient data without altering it?"]
    Q2 -->|Yes (EHR only)| R_NOT
    Q2 -->|No (Calculates/Alters)| Q3["Does the calculation provide diagnostic or physiological scoring intended to influence clinical management?"]
    Q3 -->|No (Simple arithmetic)| R_NOT
    Q3 -->|Yes (NEWS2 Scoring)| R_DEVICE["MEDICAL DEVICE / SaMD\nRequires Classification & UKCA Conformity"]
```

---

## 3. Modular Functional Evaluation

### 3.1 Module 1: NEWS2 Physiological Vitals Scoring (`/api/observations`)
- **Functionality**: Accepts 6 physiological parameters (Respiration rate, SpO2 %, Supplemental Oxygen, Systolic Blood Pressure, Pulse rate, Consciousness ACVPU, Temperature °C). Computes an aggregated score (0–20) based on the Royal College of Physicians (RCP) clinical standard, automatically assigning a Clinical Risk Band (Low, Low-Medium, Medium, High) and triggering clinical escalation alerts.
- **Regulatory Analysis**:
  - The software is not merely storing raw numbers; it interprets multiple physiological inputs against a standardized clinical algorithm to generate a risk stratification score intended to alert clinicians to acute clinical deterioration.
  - Under MHRA guidance and Rule 11 of EU MDR 2017/745, software that calculates physiological scores intended to monitor a physiological process and guide patient management qualifies as a **Medical Device**.
- **Classification**:
  - Under UK MDR 2002 Part II: **Class I Medical Device**.
  - Under transitional UKCA / post-market surveillance: Subject to UKCA Self-Declaration of Conformity for Class I devices, accompanied by clinical evaluation and DCB0129 clinical safety management.

### 3.2 Module 2: eMAR Medication Administration & Controlled Drugs (`/api/medications`)
- **Functionality**: Displays prescribed medication rounds, records administration timestamps, records carer signatures and second witness signatures for Schedule 2/3 controlled drugs, and logs refusal/omission reasons.
- **Regulatory Analysis**:
  - Does the software calculate complex individualized drug dosages (e.g., insulin bolus or oncology infusion rates)? **No**. Dosages are recorded as static text or simple fractional pill counts entered by a registered prescriber.
  - The eMAR functions as an electronic recording and verification log (EHR) supporting nurses and carers in administrative adherence to prescriptions.
- **Classification**: **Not a Medical Device** (General Healthcare Software / EHR).

### 3.3 Module 3: Body Map Wound & Pressure Ulcer Staging (`/api/residents/:id/body-map`)
- **Functionality**: Carers record wound locations on a 3D avatar, record length/width/depth in millimeters, select pressure ulcer stages (Category 1–4, Unstageable, DTI), and log exudate levels.
- **Regulatory Analysis**:
  - The software does NOT utilize computer vision or artificial intelligence to automatically diagnose wound infection or stage ulcers from camera images. The carer manually selects the staging based on their own clinical assessment.
- **Classification**: **Not a Medical Device** (Clinical Documentation Tool).

### 3.4 Module 4: Fluid & Nutrition Aggregator (`/api/residents/:id/food-fluid`)
- **Functionality**: Aggregates carer inputs of milliliters consumed and meal percentages against daily fluid targets.
- **Regulatory Analysis**: Basic arithmetic aggregation without diagnostic inference.
- **Classification**: **Not a Medical Device**.

---

## 4. Overall Device Classification & Intended Purpose Statement

### 4.1 Intended Purpose (Statutory Labeling)
> **CantraCare NEWS2 Physiological Monitoring Module** is intended for use by trained healthcare and care professionals in adult residential care settings as a secondary clinical decision support tool to calculate the Royal College of Physicians National Early Warning Score (NEWS2) from manually entered vital signs observations. The system provides risk categorization (Low, Medium, High) and unacknowledged escalation alerts to assist duty managers in identifying residents exhibiting signs of clinical deterioration.

### 4.2 Explicit Contraindications & Limitations
- **NOT an Intensive Care or Life-Critical Monitor**: CantraCare is not connected to real-time telemetry sensors, defibrillators, or life-support equipment.
- **Not for Paediatric Patients**: The NEWS2 algorithm is validated strictly for adults aged 16 and over.
- **Clinical Judgement Precedence**: The calculated score must never override the clinical assessment and professional judgement of a registered nurse, GP, or paramedic.

---

## 5. Regulatory Roadmap & UKCA Marking Requirements

To maintain full statutory compliance with MHRA regulations:
1. **UKCA Class I Self-Declaration**: Maintain Technical Documentation under UK MDR 2002 Part II, Regulation 14.
2. **Clinical Safety Officer (CSO) Sign-off**: Formal adherence to NHS England clinical risk standards **DCB0129** (Manufacturer) and **DCB0160** (Deploying Care Home).
3. **MHRA Registration**: Register the device with the MHRA under GMDN code `62224` (*Clinical decision support software*).
4. **Post-Market Clinical Follow-up (PMCF)**: Implement real-time software error tracking and 6-monthly reviews of clinical calculation accuracy against RCP test vectors.

