# CantraCare — Information Security & Data Protection Comprehensive Policy Pack

**Document Reference**: SEC-POL-A10  
**Standards Alignment**: ISO/IEC 27001:2022, NHS Data Security and Protection Toolkit (DSPT) 10 NDG Standards, Cyber Essentials Plus, CQC Regulation 17 (Good Governance).  
**Classification**: Controlled Corporate Policy Pack / Mandatory for all Staff  
**Effective Date**: November 2026  
**Review Cycle**: Annual

---

## 1. Information Security Policy (ISP) Framework

### 1.1 Purpose & Policy Statement
CantraCare Technologies Ltd. is committed to protecting the confidentiality, integrity, and availability (CIA) of all personal confidential data (PCD), special category health records, and clinical application infrastructure entrusted to us by care home operators and vulnerable individuals.

Information security is an executive responsibility overseen by the Board of Directors, the Data Protection Officer (DPO), and the Clinical Safety Officer (CSO).

---

## 2. Core Security Controls & Technical Standards

### 2.1 Access Control Policy (ISO 27001 Control A.9 / DSPT Standard 4)
1. **Principle of Least Privilege**: Staff and system accounts are granted the minimum level of access necessary to execute their defined duties.
2. **Role-Based Access Control (RBAC)**: All user sessions are strictly scoped to one of the authorized roles (`SuperAdmin`, `Admin`, `Manager`, `Nurse`, `Carer`, `Resident`).
3. **Caldicott Need-to-Know Scoping**: Non-managerial staff (`Carer`, `Nurse`) are restricted to viewing residents in their assigned care branch (`ResidentAccessService`). Break-glass access to the emergency directory is strictly audited (`RESIDENT_EMERGENCY_VIEWED`).
4. **Session Lifetime & Inactivity Timeout**:
   - Access tokens (`access_token`) are valid for 15 minutes max and delivered via secure `HttpOnly`, `SameSite=Lax`, `Secure` cookies.
   - Client web and mobile applications enforce automated 15-minute inactivity screen locks with session termination.

### 2.2 Password & Multi-Factor Authentication (MFA) Standard
1. **Password Complexity**: Minimum 12 characters, requiring uppercase, lowercase, numeric digits, and special symbols.
2. **Breached Password Checking**: Passwords are checked against known compromised dictionaries and the NCSC top-list before acceptance.
3. **MFA Requirements**: Multi-Factor Authentication (Time-based One-Time Password - TOTP RFC 6238) is mandatory for all administrative and managerial accounts (`SuperAdmin`, `Admin`, `Manager`).
4. **Rate Limiting & Account Lockout**:
   - Authentication endpoints are throttled to 5 attempts per minute per IP.
   - 10 consecutive failed logins trigger immediate account lockouts (`lockedUntil = now + 15m`) and real-time security alerts to platform administrators.

### 2.3 Cryptographic Standards (ISO 27001 Control A.10 / DSPT Standard 9)
1. **Data at Rest**:
   - AWS EBS volumes, RDS PostgreSQL databases, and S3 object storage buckets are encrypted using AES-256 with AWS Key Management Service (KMS).
   - High-sensitivity data columns (`nhsNumber`, `dob`, `phoneNumber`, `dbsNumber`, `mfaSecret`) are encrypted at the application tier using AES-256-GCM authenticated encryption before touching disk.
2. **Data in Transit**:
   - All network traffic is encrypted using Transport Layer Security (TLS 1.3 preferred; TLS 1.2 minimum).
   - Insecure legacy protocols (TLS 1.0, 1.1, SSLv3) are permanently blocked.
   - HTTP Strict Transport Security (HSTS) is enforced with `max-age=63072000; includeSubDomains; preload`.

### 2.4 Cloud Storage & File Upload Security Standard
1. **S3 Object Storage Only**: Local disk uploads (`uploads/` directories) are strictly prohibited. All documents, wound photos, and clinical PDFs must be stored directly in AWS S3 (`@aws-sdk/client-s3`).
2. **Magic Byte Verification**: `FileValidationPipe` validates the first 8–16 bytes of uploaded files to prevent MIME spoofing. Only approved types (`application/pdf`, `image/jpeg`, `image/png`, `image/webp`) are accepted.
3. **Header Sanitization**: File streaming endpoints inject `X-Content-Type-Options: nosniff` and enforce strict access authentication.

---

## 3. Vulnerability, Patch Management & DevOps Security

### 3.1 Patch Management (ISO 27001 Control A.12.6)
- **Critical Security Patches**: Deployed within 48 hours of public advisory release.
- **High Severity Patches**: Deployed within 7 calendar days.
- **Routine Maintenance**: Deployed on a bi-weekly sprint schedule following automated regression and end-to-end integration testing.

### 3.2 Secure Development Lifecycle (SDLC)
1. **Static Analysis & Secret Detection**: Every Git commit and pull request is scanned by automated CI pipelines with Gitleaks and ESLint security rules.
2. **Dependency Auditing**: Automated tools (`pnpm audit`, Dependabot) scan node packages daily. Any high or critical CVE immediately blocks CI build pipelines.
3. **Immutable Audit Trails**: Changes to clinical data, care plans, and medication records are permanently captured in an append-only audit database with SHA-256 integrity verification.

---

## 4. Physical, Removable Media & Environmental Security

1. **Removable Media Prohibition**: Staff and contractors are strictly prohibited from copying resident data, clinical notes, or platform backups to USB drives, external portable hard drives, or personal devices.
2. **Data Center Physical Security**: CantraCare utilizes Tier 3/4 AWS data centers in London (`eu-west-2`) equipped with biometric access controls, 24/7 armed physical security, and N+1 redundant power and cooling.
3. **Hardware Disposal & Sanitization**: Decommissioned physical media in AWS facilities is destroyed pursuant to NIST SP 800-88 Rev. 1 (Guidelines for Media Sanitization).

---

## 5. Employee Vetting & Acceptable Use Policy

1. **Pre-Employment Screening**: All engineering, support, and administrative personnel undergo pre-employment screening, including identity verification, right to work checks, and Standard/Enhanced DBS checks.
2. **Confidentiality Agreements**: Every employee signs an enforceable non-disclosure and confidentiality agreement covering all health and social care records in perpetuity.
3. **Annual Mandatory Training**: All employees must successfully pass the annual NHS Data Security Awareness / Cyber Security training course prior to system access provisioning.

---

## 6. Policy Breaches & Sanctions

Failure to comply with this Information Security & Data Protection Policy constitutes serious misconduct. Violations may result in disciplinary action up to and including immediate dismissal, civil litigation, and referral to the police or professional regulatory bodies (NMC, GMC) where statutory offences have occurred.

