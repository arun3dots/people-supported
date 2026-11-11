# H-06: Customer Support Access Controls & Data Handling SOP

**Document Reference**: SOP-SEC-SUP-001  
**Version**: 1.0.0  
**Effective Date**: November 2026  
**Regulatory Frameworks**: UK GDPR Art. 28 & 32, Data Protection Act 2018, Caldicott Principles 1, 2, 4 & 7, NHS DSPT Standard 4  
**Target Audience**: Customer Support Engineers, Technical Operations, Site Reliability Engineers, Care Home Administrators  

---

## 1. Executive Summary & Regulatory Purpose

Under UK GDPR Article 28 (Processor obligations) and Caldicott Principle 2 ("Do not use personal confidential data unless it is absolutely necessary"), platform vendor support and technical staff must never have unrestricted or unmonitored access to resident records, health notes, or care home confidential data.

This standard operating procedure (SOP) defines the technical controls, access boundaries, time-boxed authorization protocols, and sanitization rules governing customer support interactions.

---

## 2. Principle of Zero Standing Privilege (ZSP)

1. **No Default Support Access**: Support engineers and application developers possess **zero permanent access** to tenant production environments.
2. **Platform vs Tenant Separation**: Platform administration (`SuperAdmin`) is restricted to tenant provisioning, subscription billing, and system health telemetry. It provides no read/write access to resident clinical notes, observations, or medication logs.
3. **Database Direct Access Forbidden**: Direct SSH tunneling or write access to production PostgreSQL databases is strictly prohibited for customer support agents. All interactions must proceed via sanctioned, audit-logged backend APIs.

---

## 3. Just-in-Time (JIT) Tenant-Approved Support Access

When troubleshooting a customer-reported issue requires viewing tenant application state:

```
[Customer Reports Issue via Support Ticket]
   │
   └── Tier 2/3 Support requests temporary diagnostic access
          │
          └── Tenant Admin receives in-app authorization prompt
                 │
                 ├── [DENIED]: Support proceeds using synthetic replication
                 │
                 └── [APPROVED]: Time-boxed access granted
                        │
                        ├── Maximum duration: 2 hours (auto-expires)
                        ├── Scoped to specific module/resident
                        ├── Mandatory Support Ticket ID reference
                        └── 100% audit-logged in Tenant Audit Register
```

### Technical Controls:
- **Time-Boxed Tokens**: Support session tokens are cryptographically bounded with a maximum TTL of 120 minutes.
- **Immediate Revocation**: The tenant Admin may revoke support access instantly via the settings dashboard.
- **Audit Logging**: Every single endpoint accessed during a support session emits a `DATA_ACCESS` audit event recording the support engineer's identity, the tenant ID, and the explicit ticket number.

---

## 4. Diagnostic Logging, Telemetry & PII Sanitization

1. **Log Redaction**: Centralized application logging (CloudWatch, Datadog, Sentry) enforces automated redaction of sensitive identifiers:
   - NHS Numbers (Modulus 11 strings)
   - Resident full names and dates of birth
   - Medical notes, diagnoses, and free-text care observations
   - Passwords, JWT tokens, and MFA secrets
2. **Log Levels**: Production log levels are strictly set to `INFO` or `WARN`. Verbose payload tracing (`DEBUG` / `TRACE`) is forbidden in production environments.
3. **Crash Reports**: Error stack traces must contain only code references and error codes, never raw request bodies containing personal health data.

---

## 5. Screen Sharing & Remote Diagnostics SOP

During live screen-sharing sessions with care home staff:

1. **Host-Controlled Viewing**: The care home staff member must initiate and host the screen-sharing session. The support engineer must never take unattended remote control of a clinical terminal.
2. **Patient Privacy Protection**:
   - The care home staff member must ensure that non-relevant resident files and physical paper charts are not visible.
   - Screen recordings of remote sessions containing identifiable resident data are strictly prohibited.
3. **Session Closure**: Once troubleshooting is concluded, the support session must be terminated, and any temporary browser cache or diagnostic files locally generated must be immediately shredded.

---

## 6. Access Violation & Incident Escalation

Any attempt by vendor personnel to access tenant records without valid ticket justification or tenant consent constitutes a **Level 1 Information Security Breach**:

1. **Immediate Revocation**: User account suspended within 15 minutes of anomaly detection.
2. **Investigation**: DPO and Security Lead launch formal forensic review of immutable audit logs.
3. **Notification**: If unauthorized access to patient data is confirmed, the affected tenant and the ICO will be notified within 72 hours under UK GDPR Article 33.

