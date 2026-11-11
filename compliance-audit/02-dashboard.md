> Part of the Cantra Care / LCM compliance audit. **Re-audited 4 November 2026, 23:20 IST** at `sobin/compliances-V0` `b3caf619`; last audit 4 Nov 21:50 (`develop` `6f33c164`); earlier passes 24 Oct, 29 Oct AM and PM. See `00-README.md` for scope, method and limits.


# Deliverable 2 – Compliance status dashboard

Total checklist items: **105**. Applicable-control denominator (excludes NOT APPLICABLE): **101**.

## How the numbers are built

- **Coverage metric** = share of applicable items where a verdict could be reached (everything except UNABLE TO VERIFY). It says how much of the picture is known, not how good it is.
- **Control-effectiveness metric** = (STRONG + ADEQUATE) ÷ applicable items. UNABLE TO VERIFY items stay in the denominator and count as *not* effective, so they cannot inflate the score. WEAK counts as not effective.
- Neither number is a legal compliance score. STRONG was reserved for controls with code evidence *and* enforcement *and* some assurance; the repository has no test or operational evidence that meets that bar for any item, which is why there are no STRONG items. ADEQUATE is the highest status awarded.

- Coverage: **89%** (90 of 101 applicable items verifiable).
- Control effectiveness: **47%** (47 of 101).

## Overall by status

| Status | Count | % of all items | % of applicable |
|---|---:|---:|---:|
| STRONG | 0 | 0% | 0% |
| ADEQUATE | 47 | 45% | 47% |
| WEAK | 32 | 30% | 32% |
| MISSING | 11 | 10% | 11% |
| NOT APPLICABLE | 4 | 4% | — |
| UNABLE TO VERIFY | 11 | 10% | 11% |

| **Total** | **105** | 100% | |

## By domain

| Domain | Items | STRONG | ADEQUATE | WEAK | MISSING | NOT APPLICABLE | UNABLE TO VERIFY | Effective % |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| A. Governance and accountability | 14 | 0 | 2 | 9 | 0 | 0 | 3 | 14% |
| B. Lawful processing and resident rights | 13 | 0 | 8 | 4 | 1 | 0 | 0 | 62% |
| C. Resident health and care records | 10 | 0 | 7 | 3 | 0 | 0 | 0 | 70% |
| D. Identity, authentication and authorisation | 12 | 0 | 7 | 3 | 1 | 0 | 1 | 58% |
| E. Data security and infrastructure | 19 | 0 | 10 | 4 | 3 | 0 | 2 | 53% |
| F. DSPT and NHS-related requirements | 9 | 0 | 0 | 2 | 3 | 3 | 1 | 0% |
| G. CQC-related operational support | 14 | 0 | 10 | 2 | 2 | 0 | 0 | 71% |
| H. Third parties, hosting and transfers | 6 | 0 | 0 | 2 | 0 | 1 | 3 | 0% |
| I. Product safety, usability and accessibility | 8 | 0 | 3 | 3 | 1 | 0 | 1 | 38% |

## By priority

| Priority | Items | STRONG | ADEQUATE | WEAK | MISSING | NOT APPLICABLE | UNABLE TO VERIFY |
|---|---:|---:|---:|---:|---:|---:|---:|
| P0 Critical | 8 | 0 | 0 | 6 | 1 | 0 | 1 |
| P1 High | 39 | 0 | 10 | 18 | 3 | 0 | 8 |
| P2 Medium | 52 | 0 | 34 | 7 | 7 | 2 | 2 |
| P3 Low | 6 | 0 | 3 | 1 | 0 | 2 | 0 |

## By responsible party

| Party | Items | Not STRONG/ADEQUATE |
|---|---:|---:|
| Vendor | 54 | 32 |
| Provider (product capability) | 25 | 4 |
| Both | 26 | 18 |

## Release-blocking (P0) items

| ID | Title | Status |
|---|---|---|
| A-02 | Article 28 processor contract (customer DPA) | WEAK |
| A-09 | DPIA procedure and platform DPIA | WEAK |
| E-05 | Rate limiting and abuse protection | WEAK |
| E-17 | Incident response and disaster recovery plan | WEAK |
| H-02 | International transfers and remote access from India | UNABLE TO VERIFY |
| E-18 | No personal data in source control | WEAK |
| E-19 | Database migrations for schema changes | MISSING |
| A-14 | Accuracy and attribution of compliance records | WEAK |

## Changes since last audit (4 Nov 21:50)

| Change | Count | Items |
|---|---:|---|
| New | 1 | A-14 |
| Improved | 18 | A-13, B-03, B-06, B-07, B-10, C-07, C-08, E-01, E-03, E-12, E-14, G-04, G-05, G-06, G-09, H-05, I-05, I-06 |
| Changed | 14 | A-01, A-03, A-05, A-06, A-10, A-11, E-05, E-08, E-10, F-02, H-01, I-01, I-02, I-04 |
| Regressed | 1 | E-19 |
| Corrected | 0 | — |
| Unchanged | 71 | |

## Evidence confidence

| Confidence | Count |
|---|---:|
| High | 59 |
| Medium | 32 |
| Low | 14 |
