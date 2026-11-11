# I-03: DCB0160 Deployment Clinical Safety Guidance for Care Homes

**Document Reference**: DCB0160-DEPLOY-GUIDE-001  
**Version**: 1.0.0  
**Effective Date**: November 2026  
**Regulatory Framework**: NHS England DCB0160 (Clinical Risk Management: Its Application in the Deployment and Use of Health IT Systems)  
**Target Audience**: Care Home Providers, Registered Managers, Clinical Leads, IT Administrators  

---

## 1. Executive Summary & Regulatory Context

While the software manufacturer complies with **DCB0129** (system design and manufacturing safety), health and social care provider organizations deploying the software have a statutory obligation under **DCB0160** to ensure safe deployment, configuration, and day-to-day clinical usage.

This guidance provides care home operators with the mandatory governance frameworks, local risk assessment templates, and operational safety protocols required to achieve DCB0160 compliance.

---

## 2. Deploying Organisation Governance Responsibilities

Under DCB0160, every care home provider deploying this digital care platform must establish:

```
[Registered Provider / Board]
   │
   └── Appoints Local Clinical Safety Officer (CSO)
          │  (Registered Nurse, GP, or Nominated Clinical Lead)
          │
          ├── 1. Author Local Clinical Risk Management Plan (CRMP)
          ├── 2. Maintain Local Deployment Hazard Log
          ├── 3. Approve Local Downtime & Business Continuity Plan
          └── 4. Sign-off Pre-Go-Live Safety Case
```

---

## 3. High-Priority Local Deployment Hazards & Mitigations

The deploying organisation must incorporate the following specific care home operational hazards into its local DCB0160 Hazard Log:

### Hazard 1: Network Connectivity Loss in Resident Bedrooms
* **Clinical Hazard**: Carer or Nurse unable to access digital MAR or complete contemporaneous observations due to WiFi "dead zones" in reinforced care home wings.
* **Potential Harm**: Delayed medication administration, duplicate dose administration, or unrecorded critical vital signs deterioration.
* **Mandatory Deployer Controls**:
  1. Conduct a comprehensive RF WiFi site survey prior to rollout; install commercial-grade Mesh Access Points ensuring 100% bedroom coverage.
  2. Implement paper emergency backup MAR charts stored securely in the clinical treatment room for catastrophic network outages.
  3. Enforce device inspection to ensure automatic network reconnection.

### Hazard 2: Device Battery Failure During Medication Rounds
* **Clinical Hazard**: Mobile tablet shuts down mid-round while administering controlled drugs.
* **Potential Harm**: Interrupted verification, unrecorded administrations, or medication round delays.
* **Mandatory Deployer Controls**:
  1. Mandate that clinical tablets are docked in charging cradles whenever not in active use.
  2. Procure medical-grade tablets with a minimum 10-hour battery operating life.
  3. Equip medication trolleys with integrated high-capacity battery power banks.

### Hazard 3: Password Sharing & Unattended Logged-in Terminals
* **Clinical Hazard**: Staff share login PINs or leave unlocked stations in common resident areas.
* **Potential Harm**: Unauthorized modification of care notes, breach of resident dignity, untraceable medication sign-offs.
* **Mandatory Deployer Controls**:
  1. Enforce the platform's automatic session timeout (15-minute inactivity lock).
  2. Strict disciplinary policy prohibiting credential or smartcard sharing.
  3. Individual user accounts for all staff; generic "staff" or "floor" accounts are strictly prohibited.

---

## 4. Local Safe Onboarding & Training Gate

Before any care staff member is granted access to the live production platform:

1. **Role-Based Training Completion**: Staff must complete mandatory role-specific digital system training:
   - *Carers*: Daily care notes, vital signs logging, fluid balance, and emergency PEEP viewing.
   - *Nurses*: eMAR administration, clinical risk assessments, and break-glass procedures.
   - *Managers*: Audit reviews, CQC statutory notifications, and user access lifecycle.
2. **Competency Assessment**: Registered Nurse or Deputy Manager must sign off on staff digital documentation competency.
3. **Prompt Revocation**: Staff departures must trigger immediate account deactivation within 4 hours of shift conclusion.

---

## 5. Clinical Safety Incident Reporting (Local to Manufacturer)

Deploying organizations must maintain a feedback loop with the manufacturer for any software-related clinical safety incidents:

1. **Immediate Escalation**: If software behaviour threatens resident safety (e.g. allergy banner fails to render, dosage calculation glitch):
   - Immediately switch to manual paper protocols for the affected resident.
   - Log an urgent Clinical Safety Incident with the platform 24/7 support line (`emergency-safety@careplatform.com`).
2. **Root Cause Analysis (RCA)**: The local CSO and manufacturer CSO collaborate to review audit logs, isolate root causes, and deploy emergency hotfixes under DCB0129 safety governance.

---

## 6. Pre-Go-Live Sign-Off Checklist

Before transitioning a care home from paper to the digital platform:
- [ ] Local CSO formally appointed.
- [ ] Local DCB0160 Hazard Log approved.
- [ ] 100% WiFi coverage verified across all resident rooms and communal areas.
- [ ] All staff issued individual unique credentials with role-based permissions.
- [ ] Paper downtime pack printed and verified in clinical office.
- [ ] Registered Manager and CSO formal deployment sign-off recorded.

