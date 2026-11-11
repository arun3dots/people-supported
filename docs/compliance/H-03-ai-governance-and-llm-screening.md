# H-03: AI Governance, LLM Screening & Artificial Intelligence Policy

**Document Reference**: POL-AI-GOV-001  
**Version**: 1.0.0  
**Effective Date**: November 2026  
**Regulatory Frameworks**: UK GDPR Art. 5, 22, 28, 35; ICO Guidance on AI and Data Protection; EU Artificial Intelligence Act (High-Risk AI Systems benchmark); DCB0129  
**Status**: Active Policy & Zero-External-LLM Verification  

---

## 1. Executive Summary & Zero-External-AI Declaration

Due to the acute sensitivities surrounding special category health and social care records, and the established clinical risks of hallucinations and uncontrolled data transfers associated with public Large Language Models (LLMs), the Cantra Care platform enforces a **strict Zero-External-LLM policy**.

As of November 2026, **no resident data, care notes, observations, or confidential tenant records are transmitted to or processed by third-party artificial intelligence or large language model services**.

---

## 2. Codebase Verification & Static Feature Analysis

An audit of the platform dependency tree and backend source code (`apps/backend`, `apps/web`) confirms zero integration with commercial AI SDKs:

```bash
# Codebase grep confirmation:
grep -ri "openai" .          # 0 matches
grep -ri "anthropic" .       # 0 matches
grep -ri "langchain" .       # 0 matches
grep -ri "gemini" .          # 0 matches
```

### Clarification: Care Plan "Auto-Draft" Capability
The platform includes an automated drafting aid in `care-plan-auto-draft.service.ts`. An architectural review confirms:
1. **Deterministic Static Templates**: Auto-drafting is generated entirely using local, static, pre-authored clinical rule templates based on standard care home best practices.
2. **No Generative AI**: No machine learning inference, statistical text generation, or external API calls are involved.
3. **Mandatory Human Oversight**: Auto-drafted sections require active clinical review, customization, and explicit sign-off by a registered nurse before activation.

---

## 3. Risks of Uncontrolled AI in Residential Care

The platform's exclusion of external generative AI is founded on three regulatory and safety pillars:

### 3.1 Clinical Safety & Hallucination Risks (DCB0129)
Public LLMs are susceptible to plausibly sounding but medically hazardous hallucinations. In a care home context, hallucinated drug dosages, fabricated care instructions, or inaccurate allergy reconciliations represent catastrophic safety hazards.

### 3.2 Data Sovereignty & International Transfers (UK GDPR Art. 44–49)
Many commercial LLM APIs route prompts to multi-region cloud infrastructures located in the United States or other non-adequate jurisdictions, constituting unlawful international transfers of UK health data without Standard Contractual Clauses or IDTAs.

### 3.3 Automated Decision-Making & Transparency (UK GDPR Art. 22)
Residents and their families possess the statutory right not to be subjected to decisions based solely on automated processing. Transparent human agency and clinical accountability must remain paramount in care planning.

---

## 4. Mandatory Pre-Implementation AI Gate (Future Roadmap)

Should product management propose the integration of machine learning or AI models in future releases, the feature MUST pass the following binding phase gates before any code is committed:

```
[Feature Proposal Involves AI / Machine Learning]
   │
   ├── 1. DPIA Art. 35 Screening
   │      └── Mandatory ICO AI Guidance Compliance Assessment
   │      └── Explicit DPO approval recorded
   │
   ├── 2. Clinical Safety Case Review (DCB0129)
   │      └── Hazard Log entry for algorithmic bias and inaccuracy
   │      └── Clinical Safety Officer (CSO) sign-off
   │
   ├── 3. Data Processing Agreement (DPA) Verification
   │      └── UK Data Residency guaranteed (e.g. AWS Bedrock London eu-west-2)
   │      └── Zero-Data-Retention commitment (Vendor does NOT train on customer data)
   │
   └── 4. Resident / Guardian Consent Framework
          └── Opt-out mechanism for residents objecting to AI-assisted processing
```

---

## 5. Ongoing Monitoring & Pull Request Screening

In accordance with `A-08` (Privacy-by-Design SDLC), the GitHub pull request checklist (`.github/PULL_REQUEST_TEMPLATE.md`) enforces explicit developer screening:
- *"Does this PR introduce external AI, LLM APIs, or automated decision algorithms? (If YES, verify DPO DPIA sign-off and zero data training terms)."*

