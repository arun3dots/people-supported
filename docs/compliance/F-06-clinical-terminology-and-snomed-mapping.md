# F-06: Clinical Terminology & SNOMED CT / dm+d Mapping Strategy

**Document Reference**: INT-SNOMED-DMD-001  
**Version**: 1.0.0  
**Effective Date**: November 2026  
**Regulatory Frameworks**: NHS England Clinical Terminology Standards, NHS Digital dm+d, SNOMED CT UK Edition  
**Scope**: Clinical models, observations, allergies, vital signs, and medication administration records  

---

## 1. Executive Summary & Regulatory Purpose

NHS England standards mandate that digital clinical record systems deployed across health and social care utilize standard international terminologies to eliminate ambiguity, ensure patient safety during care transfers, and facilitate automated clinical decision support.

This strategy document defines the reference mappings from the platform's internal clinical domain enums to **SNOMED CT (UK Edition)** concept identifiers and the **NHS Dictionary of Medicines and Devices (dm+d)**.

---

## 2. Vital Signs & Observation Terminology Mapping

The platform captures vital signs through `apps/backend/src/observations/` and stores records in the `Observation` model. Each clinical parameter maps to a canonical SNOMED CT concept:

| Clinical Parameter | Platform Field | Unit / Format | SNOMED CT Concept ID | Fully Specified Name (FSN) |
|---|---|---|---|---|
| **Consciousness (ACVPU)** | `Observation.consciousness` | ACVPU Scale | `1104441000000107` | ACVPU (alert, confusion, voice, pain, unresponsive) scale score |
| • *Alert* | `"Alert"` | Enum value | `248234008` | Mentally alert (finding) |
| • *New Confusion* | `"Confusion"` | Enum value | `40917007` | Acute confusion (finding) |
| • *Voice Responsive* | `"V"` | Enum value | `300202002` | Response to voice (finding) |
| • *Pain Responsive* | `"P"` | Enum value | `285579008` | Response to pain (finding) |
| • *Unresponsive* | `"U"` | Enum value | `422768005` | Unresponsive (finding) |
| **Systolic Blood Pressure** | `Observation.bloodPressureSystolic` | mmHg | `271649006` | Systolic blood pressure (observable entity) |
| **Diastolic Blood Pressure** | `Observation.bloodPressureDiastolic` | mmHg | `271650006` | Diastolic blood pressure (observable entity) |
| **Heart Rate / Pulse** | `Observation.heartRate` | bpm | `364075005` | Heart rate (observable entity) |
| **Body Temperature** | `Observation.temperature` | °C | `386725007` | Body temperature (observable entity) |
| **Respiratory Rate** | `Observation.respiratoryRate` | breaths/min | `86290005` | Respiratory rate (observable entity) |
| **Oxygen Saturation** | `Observation.oxygenSaturation` | % SpO2 | `431314004` | Peripheral oxygen saturation (observable entity) |
| **Blood Glucose** | `Observation.bloodGlucose` | mmol/L | `434912009` | Blood glucose concentration (observable entity) |

---

## 3. Allergies & Adverse Reactions Mapping

Adverse drug reactions and anaphylaxis represent high-severity hazards in residential care. The platform structures allergies with SNOMED CT hierarchy mapping:

| Allergy Category | Sample Concept | SNOMED CT Concept ID | Fully Specified Name (FSN) |
|---|---|---|---|
| **Drug Allergy** | Allergy to penicillin | `294532003` | Allergy to penicillin (finding) |
| **Drug Allergy** | Allergy to sulfonamides | `91936005` | Allergy to sulfonamide (finding) |
| **Drug Allergy** | Allergy to NSAIDs | `293584003` | Allergy to non-steroidal anti-inflammatory drug |
| **Food Allergy** | Peanut allergy | `91935009` | Allergy to peanut (finding) |
| **Food Allergy** | Gluten intolerance / Coeliac | `235595009` | Gastrointestinal allergy to gluten (finding) |
| **Environmental** | Latex allergy | `300916003` | Allergy to latex (finding) |

---

## 4. Medication Administration (NHS dm+d Integration)

The platform's eMAR module tracks prescriptions and administrations against the NHS Dictionary of Medicines and Devices (dm+d) hierarchy:

```
[VTM: Virtual Therapeutic Moiety] 
   └── e.g. Paracetamol (90332006)
      [VMP: Virtual Medicinal Product] 
         └── e.g. Paracetamol 500mg tablets (322244002)
            [AMP: Actual Medicinal Product] 
               └── e.g. Panadol 500mg tablets (GlaxoSmithKline) (1875111000001108)
```

1. **Prescription Storage**: `MedicationPrescription` stores both human-readable drug names and standard dm+d VMP codes to support interoperable transfer.
2. **Administration Verification**: `MedAdministration` records status codes mapped to standard SNOMED CT administration findings:
   - `Given`: `182836005` (Medication given)
   - `Refused`: `182896008` (Drug refused by patient)
   - `Omitted`: `182895007` (Drug omitted)
   - `NPO`: `182897004` (Drug not given - nil by mouth)

---

## 5. Clinical Safety Assessments & Care Domains

| Clinical Assessment | Platform Risk Category | SNOMED CT Concept ID | Standard Clinical Scale |
|---|---|---|---|
| **Falls Risk** | `FALLS_RISK` | `129839007` | Stratified Falls Risk Scale |
| **Pressure Ulcer Risk** | `WATERLOW` | `704443003` | Waterlow Pressure Sore Risk Score |
| **Malnutrition Risk** | `NUTRITION` | `704439002` | Malnutrition Universal Screening Tool (MUST) score |
| **Personal Evacuation** | `PeepRecord` | `710824005` | Assessment of ability to evacuate premises (procedure) |

---

## 6. Implementation & Roadmap

Phase 2 embeds these standard terminology codes within data export formats and validation schemas. Full automated lookup against the NHS Terminology Server (FHIR Ontoserver) is slated for the advanced interoperability release.

