# A-12: Accountability Evidence Framework & Internal Audit Cadence

**Document Reference**: GOV-ACC-AUD-001  
**Version**: 1.0.0  
**Effective Date**: November 2026  
**Regulatory Frameworks**: UK GDPR Art. 5(2) (Accountability), NHS DSPT Standard 1 & 3, CQC Regulation 17 (Good Governance), DCB0129  
**Review Frequency**: Annual  

---

## 1. Executive Summary & Regulatory Purpose

Under UK GDPR Article 5(2), the data controller and processor are responsible for, and must be able to demonstrate compliance with, the core data protection principles. Furthermore, CQC Regulation 17 mandates that care providers operate effective governance systems and processes to assess, monitor, and improve the quality and safety of services.

This framework sets out the governance structure, scheduled audit cadence, and evidentiary artifacts maintained by the organization to substantiate ongoing regulatory compliance.

---

## 2. Governance Roles & Key Appointments

| Role | Appointed Individual | Primary Regulatory Responsibilities |
|---|---|---|
| **Senior Information Risk Owner (SIRO)** | Managing Director / Executive Board | Strategic ownership of information risk; signs off on annual NHS DSPT submission. |
| **Caldicott Guardian** | Clinical Director | Oversight of patient confidentiality, sharing protocols, and ethical use of resident health data. |
| **Data Protection Officer (DPO)** | Independent Appointee / Legal Counsel | Monitors UK GDPR compliance, advises on DPIAs, acts as point of contact for the ICO. |
| **Clinical Safety Officer (CSO)** | Registered Medical / Nursing Practitioner | DCB0129 clinical risk management, Hazard Log maintenance, clinical release safety sign-off. |
| **Registered Manager (CQC)** | Nominated Care Home Manager | Operational compliance with CQC Fundamental Standards, staffing ratios, and safeguarding. |

---

## 3. Scheduled Audit Cadence & Inspection Schedule

The platform provides dedicated modules (`apps/backend/src/cqc/audit-schedule.service.ts`) to manage, assign, track, and score internal audits against regulatory benchmarks.

| Cadence | Audit Scope | Regulatory Focus | Responsible Lead | Evidence Artifact |
|---|---|---|---|---|
| **Weekly** | MAR Chart Discrepancy & Missed Dose Review | CQC Reg 12 (Safe Care & Treatment) | Lead Nurse | Medication Round Audit Log & Exception Report |
| **Weekly** | Visitor Sign-In & Fire Evacuation Roster | CQC Reg 9A / Reg 15 (Premises & Safety) | Facilities / Reception | `VisitorLog` Active Count & Emergency Roll-Call |
| **Monthly** | Controlled Drugs Register Reconciliation | Misuse of Drugs Act / CQC Reg 12 | Registered Nurse + Witness | Controlled Drug Discrepancy Register & Witness Records |
| **Monthly** | Equipment Maintenance & LOLER Inspection | CQC Reg 15 (Premises & Equipment) | Facilities Manager | `EquipmentMaintenanceLog` (Pass/Fail/Service status) |
| **Monthly** | Emergency Break-Glass Access Review | Caldicott Principle 4 / UK GDPR Art. 32 | Registered Manager / DPO | `BreakGlassAccess` Review Queue Sign-Offs |
| **Quarterly** | Staff Supervision & Training Matrix | CQC Reg 18 (Staffing) | HR / Deputy Manager | `StaffSupervision` & Training Compliance Tracker |
| **Quarterly** | Care Plan Quality & MCA / DoLS Audit | Mental Capacity Act 2005 / CQC Reg 11 | Clinical Lead | Random 10% Care Plan Sample & Best Interest Review |
| **Quarterly** | Privileged Access & User Account Review | NHS DSPT Standard 4 & 6 | Tech Lead / DevOps | User Role Audit, Inactive User Deactivation Log |
| **Bi-Annual** | Privacy & ROPA Completeness Review | UK GDPR Art. 30 | DPO | Updated ROPA (`A-03`) & Subprocessor Register (`A-11`) |
| **Annual** | NHS Data Security and Protection Toolkit (DSPT) | National Data Guardian Standards | SIRO / DPO / Lead Tech | DSPT Published "Standards Met" Assessment |
| **Annual** | Clinical Safety Case & Hazard Review | DCB0129 / NHS England | Clinical Safety Officer | Annual Clinical Safety Case Report (`I-02`) |
| **Annual** | Disaster Recovery & Backup Restoration Test | NHS DSPT Standard 7 / ISO 27001 | DevOps Lead | DR Simulation Report & Recovery Point Verification |

---

## 4. Evidence Repository & Document Control

All audit documentation and regulatory evidence are archived in accordance with NHS Record Retention schedules:

1. **Digital Evidence Storage**: Audit records created via the platform API are permanently captured in PostgreSQL with cryptographic audit event logs retained in `@repo/audit-db`.
2. **Document Retention Period**: Clinical audit summaries and safety registers must be retained for a minimum of **8 years** following completion (or 20 years for clinical hazard logs under DCB0129).
3. **Immutability & Integrity**: Audit logs are append-only. No application role (including Tenant Admin) possesses database update or delete permissions on audit history.

---

## 5. Non-Conformity & Corrective Action Escalation (CAPA)

When an internal audit score falls below acceptable thresholds (<85% for infection control/medication audits):

```
[Audit Score < 85%] 
   └── Corrective Action Plan (CAPA) generated within 48 hours
   └── Target remediation deadline: 14 days (or 24 hours for Critical safety)
   └── Re-audit triggered automatically at 30 days
   └── Unresolved non-conformities escalated to SIRO & Registered Manager
```

---

## 6. Regulatory Reporting

Audit summaries and governance evidence are made accessible to CQC inspectors during statutory regulatory visits and to NHS England during digital health procurement evaluations.

