## Overview

Briefly describe what this PR does, and why it's needed.

## Ticket ID

Link to the ticket from JIRA/BUG_SHEET (if applicable).

## Type of Change
- [ ] Bug fix 
- [ ] New feature 
- [ ] Breaking change 
- [ ] Code Refactoring
- [ ] UI fix 
- [ ] Documentation update 
- [ ] Compliance / Clinical Safety / Security

## Changes

List the changes that have been made in this PR.

- Change 1
- Change 2
- Change 3

## Privacy-by-Design & Clinical Safety Gate (A-08 / DCB0129)
- [ ] **Data Minimisation & Tenant Isolation**: All tenant queries explicitly enforce `tenantId` from JWT. No tenant data leaked in response bodies.
- [ ] **Special Category Data Check**: Does this PR add/modify personal health or care data? (If YES, verify field encryption at rest + audit logging).
- [ ] **No `any` & Monorepo Conformance**: No `any` introduced; DTOs imported from `@repo/schema`; all files strictly under 350 lines.
- [ ] **Clinical Safety Assessment**: Does this change affect medication rounds, allergy alerts, observations, or clinical scoring? (If YES, ensure Clinical Safety Officer sign-off).
- [ ] **AI & LLM Screening (H-03)**: Does this change introduce any external AI/LLM API calls or automated profiling? (If YES, verify DPO DPIA sign-off and vendor DPA zero-training terms).
- [ ] **DPIA / Audit Logging**: Any new endpoint accessing resident records emits structured audit events (`DATA_ACCESS` / `CLINICAL_DOC`).

## Screenshots / Screen Recordings

Include any relevant screenshots or recordings to demonstrate the changes (if applicable).

## Checklist

- [ ] I have performed a self-review of my own code.
- [ ] I have added/updated necessary unit tests.
- [ ] All automated tests pass successfully (`pnpm test`).
- [ ] Build succeeds with zero TypeScript errors (`pnpm build`).
- [ ] Hard 350-line file cap verified on all created/edited files.
- [ ] UI verified against standard Tailwind design tokens.

## Reviewers

Tag your teammates that should review this PR.
