# Requirements: FTC Enforcement Provisions Library

**Defined:** 2026-02-24
**Core Value:** A legal practitioner can find every FTC consent order provision relevant to a specific topic, with exact paragraph-level citations and source links, in under 30 seconds.

## v1 Requirements

### Data Classification Pipeline

- [x] **PIPE-01**: Build pipeline classifies each provision by statutory topic (COPPA, FCRA, GLBA, Health Breach Notification, CAN-SPAM, TCPA) using legal_authority and complaint fields
- [x] **PIPE-02**: Build pipeline classifies each provision by practice area (Privacy, Data Security, Deceptive Design / Dark Patterns, AI / Automated Decision-Making, Surveillance)
- [x] **PIPE-03**: Build pipeline tags each provision by remedy type (Monetary Penalty, Data Deletion, Comprehensive Security Program, Third-Party Assessment, Algorithmic Destruction, Biometric Ban, Compliance Monitoring, Recordkeeping, Prohibition, Other)
- [x] **PIPE-04**: Build pipeline classifies each case by industry sector inferred from company business_description field
- [x] **PIPE-05**: Build pipeline produces denormalized `ftc-provisions.json` flat file with all provisions, topic tags, case context, and citations
- [x] **PIPE-06**: Build pipeline produces `ftc-patterns.json` with cross-case language pattern groups
- [x] **PIPE-07**: Enhanced `ftc-cases.json` includes provision-level topic aggregations and industry sector per case
- [x] **PIPE-08**: Classification runs entirely at build time — no classification logic ships to the browser
- [x] **PIPE-09**: TypeScript interfaces defined for all new data shapes before pipeline implementation

### Provisions Library

- [x] **PROV-01**: User can browse provisions by selecting a substantive topic (statutory, practice area, or remedy type)
- [x] **PROV-02**: Each provision displays verbatim quoted order language as the primary content
- [x] **PROV-03**: Each provision shows exact paragraph-level citation (e.g., "Part II.A.3") plus working link to FTC.gov source document
- [x] **PROV-04**: Each provision card shows case context: company name, date issued, docket number, violation type
- [x] **PROV-05**: User can filter provisions within a topic by date range
- [x] **PROV-06**: User can filter provisions within a topic by company name
- [x] **PROV-07**: User can filter provisions within a topic by remedy type
- [x] **PROV-08**: User can sort provisions by date, company, or provision type
- [x] **PROV-09**: User can search across all provisions using text search (MiniSearch)
- [x] **PROV-10**: Provisions library displays total count of matching provisions and cases

### Cross-Case Patterns

- [x] **PATN-01**: Build pipeline detects provisions with identical or near-identical titles across different consent orders
- [x] **PATN-02**: User can view pattern groups showing how specific provision language (e.g., "comprehensive security program") appears across multiple cases
- [x] **PATN-03**: Pattern timeline shows chronological evolution of recurring provision language
- [x] **PATN-04**: Structural/boilerplate provisions (monitoring, recordkeeping, acknowledgment) are excluded from pattern analysis or clearly labeled

### Analytics & Trends

- [x] **ANLY-01**: Interactive bar/line charts showing enforcement action count by year
- [x] **ANLY-02**: Interactive charts showing enforcement trends by presidential administration
- [x] **ANLY-03**: Topic-over-time trend lines showing how enforcement focus shifts across statutory topics and practice areas
- [x] **ANLY-04**: Administration comparison view showing enforcement patterns side-by-side between administrations
- [x] **ANLY-05**: Detailed reference tables with case counts, provision counts, and breakdowns accompanying each chart
- [x] **ANLY-06**: Combined chart + table views — charts for visual overview, tables for drill-down
- [x] **ANLY-07**: Violation type breakdown (deceptive vs unfair vs both) maintained from existing analytics
- [x] **ANLY-08**: Provision-level analytics showing counts by remedy type, topic, and category

### Company & Industry View

- [x] **INDY-01**: User can browse enforcement actions by industry sector (tech, health, retail, financial services, etc.)
- [x] **INDY-02**: Industry view shows how enforcement patterns (topics, remedy types) vary across sectors
- [x] **INDY-03**: Individual case cards within industry view show company details, provision summaries, and links to full provisions

### Navigation & UX

- [x] **NAVX-01**: Tab navigation between Analytics, Provisions Library, and Patterns views under single FTC route
- [x] **NAVX-02**: URL-driven state via search params for active tab, selected topic, active filters
- [x] **NAVX-03**: Maintains law-library aesthetic (EB Garamond, cream/gold/dark-green palette)
- [x] **NAVX-04**: Performs smoothly with 293 cases and thousands of provisions in-browser
- [x] **NAVX-05**: OCR extraction quality disclosure where applicable — sourced text presented with appropriate caveat

## v2 Requirements

### Search & Discovery

- **SRCH-01**: Full-text search across consent order documents (not just provisions)
- **SRCH-02**: Saved searches and bookmarked provisions
- **SRCH-03**: Side-by-side consent order comparison tool

### Advanced Patterns

- **PATN-05**: Fuzzy text similarity matching for provision language evolution (beyond exact title matching)
- **PATN-06**: Automatic detection of novel provision language not seen in prior orders

### Commissioner Analysis

- **COMM-01**: Commissioner voting records and dissent tracking per case
- **COMM-02**: Commissioner-level enforcement trend analysis

## Out of Scope

| Feature | Reason |
|---------|--------|
| User accounts / saved searches | Public reference tool, not SaaS product |
| Real-time FTC data sync | Data pipeline runs offline, manual updates acceptable |
| Mobile native app | Web-first, responsive design sufficient |
| Backend database for FTC data | Static JSON pattern is proven and sufficient for 293 cases |
| Server-side rendering | Existing SPA architecture is adequate for this dataset size |
| PDF generation / export | Adds significant complexity; users can print/copy citations |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PIPE-01 | Phase 1 | Complete |
| PIPE-02 | Phase 1 | Complete |
| PIPE-03 | Phase 1 | Complete |
| PIPE-04 | Phase 1 | Complete |
| PIPE-05 | Phase 1 | Complete |
| PIPE-06 | Phase 5 | Complete |
| PIPE-07 | Phase 1 | Complete |
| PIPE-08 | Phase 1 | Complete |
| PIPE-09 | Phase 1 | Complete |
| PROV-01 | Phase 3 | Complete |
| PROV-02 | Phase 3 | Complete |
| PROV-03 | Phase 3 | Complete |
| PROV-04 | Phase 3 | Complete |
| PROV-05 | Phase 3 | Complete |
| PROV-06 | Phase 3 | Complete |
| PROV-07 | Phase 3 | Complete |
| PROV-08 | Phase 3 | Complete |
| PROV-09 | Phase 3 | Complete |
| PROV-10 | Phase 3 | Complete |
| PATN-01 | Phase 5 | Complete |
| PATN-02 | Phase 5 | Complete |
| PATN-03 | Phase 5 | Complete |
| PATN-04 | Phase 5 | Complete |
| ANLY-01 | Phase 2 | Complete |
| ANLY-02 | Phase 2 | Complete |
| ANLY-03 | Phase 2 | Complete |
| ANLY-04 | Phase 2 | Complete |
| ANLY-05 | Phase 2 | Complete |
| ANLY-06 | Phase 2 | Complete |
| ANLY-07 | Phase 2 | Complete |
| ANLY-08 | Phase 2 | Complete |
| INDY-01 | Phase 4 | Complete |
| INDY-02 | Phase 4 | Complete |
| INDY-03 | Phase 4 | Complete |
| NAVX-01 | Phase 2 | Complete |
| NAVX-02 | Phase 2 | Complete |
| NAVX-03 | Phase 2 | Complete |
| NAVX-04 | Phase 2 | Complete |
| NAVX-05 | Phase 2 | Complete |

**Coverage:**
- v1 requirements: 39 total
- Mapped to phases: 39
- Unmapped: 0

---
*Requirements defined: 2026-02-24*
*Last updated: 2026-02-24 after roadmap creation — all 39 v1 requirements mapped*
