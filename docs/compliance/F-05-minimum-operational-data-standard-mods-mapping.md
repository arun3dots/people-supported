# F-05: Minimum Operational Data Standard (MODS) & PRSB Data Mapping

**Document Reference**: INT-MODS-PRSB-001  
**Version**: 1.0.0  
**Effective Date**: November 2026  
**Regulatory Frameworks**: NHS England Digital Social Care Records (DSCR), PRSB Core Information Standard (v2.0), UK FHIR Release 4  
**Scope**: Platform database models (`packages/db`), schema contracts (`packages/schema`), and interoperability export interfaces  

---

## 1. Executive Summary & Purpose

The UK Department of Health and Social Care (DHSC) and NHS England mandate that Digital Social Care Record (DSCR) software solutions align with the Professional Record Standards Body (PRSB) Core Information Standard and the Minimum Operational Data Standard (MODS).

This document establishes the bidirectional mapping between the platform's relational models and the national interoperability standards, ensuring structured data exchange between care homes, NHS hospitals, GP practices (GP Connect), and ambulance services.

---

## 2. MODS & PRSB Core Data Structure Mapping

### 2.1 Section 1: Demographics & Core Identity

| PRSB / MODS Data Field | National Requirement | Platform Model & Field | Validation & Security Rules |
|---|---|---|---|
| **NHS Number** | 10-digit mandatory unique identifier | `Resident.nhsNumber` | Recorded as supplied during onboarding (format not enforced), AES-256 encrypted at rest. |
| **Given / Family Name** | Official full name | `Resident.fullName`, `Resident.preferredName` | Plain string; trimmed, max 100 characters. |
| **Date of Birth** | ISO 8601 Date (`YYYY-MM-DD`) | `Resident.dateOfBirth` | Required; age validated in pre-admission screening. |
| **Gender / Sex** | Administrative gender | `Resident.gender` | Standard enum: `Male`, `Female`, `Other`. |
| **Primary Language** | Preferred language & interpreter need | `Resident.primaryLanguage`, `interpreterNeeded` | ISO language code + boolean flag. |
| **Communication Needs** | Accessible Information Standard (AIS) | `PeepRecord.hearingImpairment`, `visualImpairment`, `cognitiveImpairment` | Captured in PEEP and Pre-Admission Part A/B. |

### 2.2 Section 2: Legal Status, Consent & Decision Making

| PRSB / MODS Data Field | National Requirement | Platform Model & Field | Validation & Security Rules |
|---|---|---|---|
| **Mental Capacity Assessment** | MCA 2005 2-stage functional test | `McaDolsAssessment.assessmentType` | Structured questionnaire, capacity determination (`hasCapacity`). |
| **Deprivation of Liberty (DoLS)** | DoLS / LPS authorization status | `McaDolsAssessment.dolsStatus`, `dolsExpiryDate` | Tracked with automated renewal alerts 30 days prior to expiry. |
| **Lasting Power of Attorney (LPA)** | Registered LPA Health & Welfare / Finance | `ResidentPoa.poaType`, `ResidentPoa.registeredCourt` | Requires certified document upload to AWS S3. |
| **Resuscitation Status (DNACPR)** | ReSPECT / DNACPR order | `Resident.dnacprStatus`, `Resident.dnacprDate` | Highlighted as critical emergency flag on resident summary. |

### 2.3 Section 3: Clinical Health & Emergency Summary

| PRSB / MODS Data Field | National Requirement | Platform Model & Field | Validation & Security Rules |
|---|---|---|---|
| **Allergies & Adverse Reactions** | Medication & environmental allergies | `Resident.allergies`, `AllergyRecord` | Emphasised with red alert banner on Medication Administration Round. |
| **Current Medications** | Prescribed medications, dose, route | `MedicationPrescription` | Links to dose, frequency, PRN flag, and eMAR tracking. |
| **Personal Emergency Evacuation** | PEEP evacuation mobility & equipment | `PeepRecord` | Mobility levels (`Independent`, `AssistedWalking`, `AssistedWheelchair`, `EvacuationChair`, `BedBound`). |
| **Vital Signs & Observations** | NEWS2 / ACVPU / blood pressure | `Observation` | Includes `occurredAt`, `recordedAt`, and automated `isLateEntry` detection. |

### 2.4 Section 4: Care & Support Needs Assessments

| PRSB / MODS Data Field | National Requirement | Platform Model & Field | Validation & Security Rules |
|---|---|---|---|
| **Falls Risk** | Stratified risk score & history | `RiskAssessment` (`FALLS_RISK` type) | Categorised as Low / Medium / High with tailored control measures. |
| **Nutrition & Hydration** | MUST score, dietary requirements | `RiskAssessment` (`NUTRITION` type) | Height, weight, BMI, unplanned weight loss scoring. |
| **Tissue Viability (Skin Integrity)** | Waterlow pressure ulcer risk score | `BodyMapEntry`, `RiskAssessment` (`WATERLOW`) | Interactive visual body map coordinate mapping + wound staging (Grade 1-4). |

---

## 3. Data Validation & Conformance Engine

The platform enforces strict schema boundary validation before data can enter the operational database:

1. **Zod Schema Serialization**: Every ingress API endpoint utilizes `@repo/schema` contracts implementing MODS field definitions.
2. **Timestamp Integrity (C-01 & C-02)**: Clinical observations require dual timestamps (`occurredAt` vs server-generated `recordedAt`). Observations submitted >2 hours post-event are automatically flagged as late entries (`isLateEntry = true`).
3. **NHS Number Checksum (F-07)**: The Modulus 11 helper (`isValidNhsNumber`) remains available, but pre-admission onboarding records the number as supplied and does not block on a checksum failure.

---

## 4. Interoperability & Export Readiness

The platform's schema architecture supports direct mapping to HL7 FHIR UK Core profiles:
- `Resident` → `FHIR Patient`
- `MedicationPrescription` → `FHIR MedicationRequest`
- `MedAdministration` → `FHIR MedicationAdministration`
- `Observation` → `FHIR Observation`
- `RiskAssessment` → `FHIR RiskAssessment`

This architecture guarantees ready compatibility with incoming NHS transfer of care specifications and local Integrated Care Board (ICB) data-sharing initiatives.

