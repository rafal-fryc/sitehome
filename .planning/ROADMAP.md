# Roadmap: FTC Enforcement Provisions Library

## Overview

Four categories of work build this tool in dependency order: first, the offline data pipeline produces the classified JSON artifacts that every UI surface depends on; second, the page architecture is established and analytics are extended using the new provision data; third, the core provisions library — the product's primary value proposition — is built on top of that foundation; fourth, the industry sector view and cross-case language patterns are added as the final differentiated surfaces. The result is a legal practitioner tool that delivers topic-first browsing of FTC consent order provisions with exact paragraph-level citations.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Data Pipeline** - Extend the offline build script to classify all provisions and emit the static JSON artifacts the entire UI depends on (completed 2026-02-24)
- [ ] **Phase 2: Tab Shell + Analytics** - Establish tabbed page architecture and extend analytics with topic-over-time and provision-level charts
- [ ] **Phase 3: Provisions Library** - Build the core topic-first browsing experience with exact citations, filter bar, and text search
- [ ] **Phase 4: Company & Industry View** - Add industry sector browsing showing how enforcement patterns vary across sectors
- [ ] **Phase 5: Cross-Case Patterns** - Surface recurring provision language and its evolution across enforcement eras

## Phase Details

### Phase 1: Data Pipeline
**Goal**: The offline build pipeline produces correctly classified, validated static JSON that every UI surface can depend on
**Depends on**: Nothing (first phase)
**Requirements**: PIPE-01, PIPE-02, PIPE-03, PIPE-04, PIPE-05, PIPE-06, PIPE-07, PIPE-08, PIPE-09
**Plans**: 4 plans
**Success Criteria** (what must be TRUE):
  1. Running `npm run build:data` (or equivalent) produces ftc-provisions.json (or topic-sharded equivalents), ftc-patterns.json, and an extended ftc-cases.json with no errors
  2. Each provision in ftc-provisions.json carries at least one statutory topic tag (or "Unclassified") and at least one remedy type tag, derived from legal_authority and provision fields — not from free-text keyword matching
  3. Per-topic provision counts are inspectable and plausible: COPPA provisions exist, Data Security provisions exist, no single topic accounts for more than 60% of all provisions
  4. TypeScript interfaces for all new data shapes are defined in src/types/ and the build script compiles without errors against them
  5. No classification logic or provision data transformation runs in the browser — the app loads pre-computed JSON

Plans:
- [x] 01-01-PLAN.md — TypeScript interfaces for all classification data shapes
- [ ] 01-02-PLAN.md — classify-provisions.ts script (rule-based classification agent)
- [ ] 01-03-PLAN.md — build-provisions.ts script, enhanced build-ftc-data.ts, npm scripts
- [ ] 01-04-PLAN.md — Run classification, build pipeline, verify distribution and spot-check

### Phase 2: Tab Shell + Analytics
**Goal**: Legal practitioners can navigate between three view areas of the FTC tool, and the analytics section shows topic-level enforcement trends alongside the existing grouping views
**Depends on**: Phase 1
**Requirements**: ANLY-01, ANLY-02, ANLY-03, ANLY-04, ANLY-05, ANLY-06, ANLY-07, ANLY-08, NAVX-01, NAVX-02, NAVX-03, NAVX-04, NAVX-05
**Plans**: TBD
**Success Criteria** (what must be TRUE):
  1. The FTC page has three tabs — Analytics, Provisions Library, Patterns — and switching tabs updates the URL search param without a full page reload
  2. The Analytics tab displays enforcement trend charts by year and presidential administration, plus topic-over-time trend lines showing how enforcement focus has shifted across statutory topics
  3. Each chart has an accompanying reference table with case counts and breakdowns; the user can read exact numbers without relying on chart hover states
  4. The page renders without visible lag when loaded fresh with 293 cases and thousands of provisions in-browser
  5. The law-library aesthetic (EB Garamond, cream/gold/dark-green palette) is consistent across all new and modified components

### Phase 3: Provisions Library
**Goal**: A legal practitioner can select a topic, see every relevant provision across all consent orders, read verbatim order language with exact paragraph-level citations, and filter/search the results to find specific provisions in under 30 seconds
**Depends on**: Phase 2
**Requirements**: PROV-01, PROV-02, PROV-03, PROV-04, PROV-05, PROV-06, PROV-07, PROV-08, PROV-09, PROV-10
**Plans**: TBD
**Success Criteria** (what must be TRUE):
  1. The user can select a substantive topic (statutory authority or remedy type) and immediately see a list of provision cards — each showing verbatim quoted order language as the primary content
  2. Each provision card shows a paragraph-level citation (e.g., "Part II.A.3") and a working link to the FTC.gov source document, with a visible disclosure that the extracted text should be verified against the source
  3. Each provision card shows case context: company name, year issued, docket number, and violation type — enough information to cite the provision without leaving the page
  4. The user can filter provisions within a topic by date range, company name, and remedy type, and sort by date, company, or provision type; the display updates immediately with each filter change
  5. The user can type a search query and see matching provisions across all topics; the provisions view displays a total count of matching provisions and cases

### Phase 4: Company & Industry View
**Goal**: A legal practitioner can browse enforcement actions by industry sector and understand how enforcement patterns — topics, remedy types, enforcement intensity — differ across sectors
**Depends on**: Phase 3
**Requirements**: INDY-01, INDY-02, INDY-03
**Plans**: TBD
**Success Criteria** (what must be TRUE):
  1. The user can select an industry sector (tech, health, retail, financial services, etc.) and see all enforcement actions classified to that sector
  2. The industry view shows a breakdown of enforcement patterns — which topics and remedy types are most common — for the selected sector, enabling comparison across sectors
  3. Each case card within the industry view shows company details, a summary of provision types, and a link to the full provisions for that case

### Phase 5: Cross-Case Patterns
**Goal**: A legal practitioner can see how specific recurring provision language (e.g., "comprehensive security program") has evolved across enforcement eras, with a chronological timeline of variants
**Depends on**: Phase 4
**Requirements**: PATN-01, PATN-02, PATN-03, PATN-04
**Plans**: TBD
**Success Criteria** (what must be TRUE):
  1. The Patterns tab shows a list of named recurring provision patterns (e.g., "Comprehensive Security Program," "Algorithmic Destruction") with a count of cases where each pattern appears
  2. Selecting a pattern shows a chronological timeline of how that provision language appears across different consent orders, with variant cards showing the quoted text and case context for each instance
  3. Structural/boilerplate provisions (compliance reporting, recordkeeping, acknowledgment) are either excluded from pattern results or clearly labeled as structural, so they do not drown out substantively significant patterns

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Data Pipeline | 3/4 | Complete    | 2026-02-24 |
| 2. Tab Shell + Analytics | 0/TBD | Not started | - |
| 3. Provisions Library | 0/TBD | Not started | - |
| 4. Company & Industry View | 0/TBD | Not started | - |
| 5. Cross-Case Patterns | 0/TBD | Not started | - |
