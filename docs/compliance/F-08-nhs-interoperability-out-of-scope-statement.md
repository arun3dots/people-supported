# F-08: NHS Interoperability Scope & Boundary Declaration

**Document Reference**: DEC-NHS-INTEG-001  
**Version**: 1.0.0  
**Effective Date**: November 2026  
**Regulatory Frameworks**: NHS England Digital Social Care Records (DSCR) Assurance Framework, NHS Spine Integration Criteria  
**Status**: Formal Scope & Out-of-Scope Statement  

---

## 1. Purpose & Executive Declaration

To prevent regulatory misrepresentation, customer misunderstanding, and non-compliance with the NHS England Software Supplier Onboarding Requirements, this document explicitly defines the current interoperability boundaries of the Cantra Care platform.

As of November 2026, **no live integrations to NHS national spine services, GP Connect, MESH, or NHS login/CIS2 exist or are claimed**. The platform operates as an independent, tenant-partitioned Digital Social Care Record (DSCR) software system.

---

## 2. Definitive Out-of-Scope Services Register

| NHS National Service | Current Platform Capability | Status | Regulatory Rationale |
|---|---|---|---|
| **GP Connect** (Access Record / Update Record) | Local GP details recorded manually in `Resident` profile; no automated pull or push to GP Electronic Health Records (EMIS, SystmOne). | **Out of Scope** | Requires formal NHS England Conformance Testing, Connection Agreement, and Clinical Safety Case sign-off. |
| **NHS MESH** (Message Exchange for Social Care and Health) | Clinical discharge summaries and transfer packs exported as PDF (`/api/emergency-directory/:id/print-pack`) or JSON; no electronic MESH mailbox transfer. | **Out of Scope** | Care homes transfer documents via secure NHSmail or direct clinical handovers. |
| **NHS login / Care Identity Service (CIS2)** | Authentication managed via internal bcrypt-hashed credentials and TOTP Multi-Factor Authentication; no NHS smartcard / CIS2 OIDC authentication. | **Out of Scope** | Care home workforce utilizes direct tenant credential provisioning via tenant administrators. |
| **National Electronic Prescription Service (EPS)** | Prescriptions and medication orders entered manually from paper FP10 / pharmacy delivery MAR sheets into the platform eMAR; no direct EPS spine token reception. | **Out of Scope** | Direct digital EPS dispensing integration requires NHS BSA EPS supplier accreditation. |
| **Live HL7 FHIR UK Core Spine Exchange** | Internal models and terminologies are architecturally mapped to PRSB / FHIR standards (`F-05`, `F-06`), but no live bidirectional socket to NHS national servers is active. | **Architectural Readiness Only** | Ready for phase-based enablement without database refactoring once accreditation is sought. |

---

## 3. Commercial & Marketing Guardrails

1. **No False Claims**: Platform marketing material, website content, sales presentations, and tender documentation MUST NOT represent the system as:
   - "Directly integrated with NHS GP systems"
   - "NHS login enabled"
   - "GP Connect certified"
   - "Spine connected"
2. **Accurate Representation**: The platform MAY be represented as:
   - "Engineered in alignment with the PRSB Core Information Standard and Minimum Operational Data Standard (MODS)."
   - "NHS Number Modulus 11 checksum validated."
   - "NHS Data Security and Protection Toolkit (DSPT) standards compliant."
   - "DCB0129 clinical risk management certified."

---

## 4. Technical Verification & Codebase Audit

A search across the platform codebase (`apps/backend`, `apps/web`, `packages/*`) confirms the complete absence of unauthorized or stubbed NHS endpoints:

```bash
# Codebase grep confirmation:
grep -ri "gpConnect" .    # 0 matches
grep -ri "nhsMesh" .      # 0 matches
grep -ri "cis2Login" .    # 0 matches
```

All data exchange occurs strictly via authenticated, tenant-isolated REST APIs (`/api/residents`, `/api/observations`, `/api/emergency-directory`).

---

## 5. Prerequisites for Future NHS Connectivity

If the executive board decides to pursue live NHS connectivity in a future commercial phase, the following prerequisites must be formally satisfied before code release:
1. Completion of the NHS England Digital Onboarding process.
2. Sign-off of an updated DCB0129 Clinical Safety Case Report by the appointed Clinical Safety Officer.
3. Execution of the NHS Connection Agreement (Information Sharing Protocol).
4. Publishing of an independent annual NHS DSPT "Standards Met" assessment.

