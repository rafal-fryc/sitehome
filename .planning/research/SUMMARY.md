# Project Research Summary

**Project:** FTC Enforcement Provisions Library (Milestone 2)
**Domain:** Legal enforcement database / regulatory provisions library
**Researched:** 2026-02-24
**Confidence:** HIGH

## Executive Summary

The FTC Enforcement Provisions Library is a specialized legal research tool built on top of an existing React/Vite/TypeScript/Tailwind SPA. The defining characteristic of this product type is that all heavy computation must happen at build time: topic classification, provision indexing, and cross-case pattern detection are all offline pipeline work. The browser receives pre-computed, denormalized JSON and performs only filtering, sorting, and rendering. This is the established pattern for static-site legal reference tools and is the correct approach given the project's no-backend constraint.

The recommended implementation path is additive, not a rewrite. Two production libraries are needed: MiniSearch for client-side full-text search and TanStack Table for headless sortable/filterable tables. Both integrate cleanly with the existing TanStack Query, shadcn/ui, and Recharts infrastructure. The build pipeline (scripts/build-ftc-data.ts) is extended with three new functions — provision classification, provision index generation, and pattern detection — that emit two new static JSON artifacts consumed by two new React Query hooks. The page architecture uses a single tabbed route (/FTCAnalytics?tab=...) rather than new routes, which is the correct call given the shared data fetching.

The primary risk in this project is not implementation complexity but classification correctness and data quality. Two pitfalls dominate: first, keyword matching that over-tags provisions as "Privacy" and collapses the taxonomy into noise; second, presenting extracted quoted text as authoritative legal citations when the OCR pipeline introduced transcription errors. Both risks must be mitigated before any UI surface is built — classification accuracy is the critical path dependency for the entire provisions library, and citation data quality is the trust dependency for the entire product.

---

## Key Findings

### Recommended Stack

The existing stack (React 18.3, Vite 5.4, TypeScript 5.8, Tailwind 3.4, shadcn/ui, Recharts 2.15, TanStack Query 5.83, React Router 6.30) is fixed and requires no re-evaluation. Only two new production dependencies are warranted: **MiniSearch** (~7KB gzipped) for client-side full-text search over the provisions corpus, and **TanStack Table v8** (~15KB gzipped) for column filtering, pagination, and multi-sort on provision tables. Total new bundle impact is ~22KB.

No NLP library is needed for topic classification — the FTC's legal_authority strings are highly specific ("Children's Online Privacy Protection Act, 15 U.S.C. § 6502"), making keyword matching against structured fields more accurate than statistical NLP for this closed taxonomy. No new charting library is needed (Recharts 2.x includes all LineChart, AreaChart, and ComposedChart types required). No state management library is needed (TanStack Query + React Router useSearchParams covers all state needs). Cross-case similarity computation is feasible in ~20 lines of TypeScript at build time.

**Core new technologies:**
- **MiniSearch ^7.x** — client-side full-text search with inverted index; handles ~5,000 provisions at sub-200ms index time
- **TanStack Table ^8.x** — headless sortable/filterable/paginated tables; composable with existing shadcn/ui primitives
- **Extended build-ftc-data.ts** — three new functions in the existing TypeScript pipeline; no new build tooling

See `.planning/research/STACK.md` for full rationale and rejected alternatives.

### Expected Features

The provisions library inverts the existing analytics-first mental model into a topic-first browsing experience. Legal practitioners research by legal issue, not by company. The critical insight from FEATURES.md: citation is king. Every provision card must include case name, paragraph reference, and a working FTC.gov link — missing any of these makes the tool unusable for professional work.

**Must have (table stakes):**
- Topic-first browsing — primary mental model for legal research; the whole product depends on this
- Exact paragraph-level citations — practitioners cannot cite uncited sources; paragraph refs already exist in the JSON
- Verbatim quoted order language — paraphrases introduce error; practitioners quote consent orders in briefs
- Working FTC.gov source links per provision — verification requirement for any legal use
- Case metadata visible on each provision card (company, year, administration, legal authority)
- Filtering within topic views — date range, company, remedy type
- Date sort within topic views — newest-first default (current practice), oldest-first available (historical trend)
- Provision count per topic on topic selector — tells practitioners how settled or sparse the enforcement record is

**Should have (differentiators):**
- Three-axis taxonomy (statutory + remedy type at minimum) — no public FTC tool offers provision-level tagging; NOTE: Pitfalls research recommends reducing to two orthogonal axes (statutory + remedy type) rather than three
- Remedy type as a first-class filter — practitioners building compliance programs need "what does a security program provision look like across cases"
- Administration-era context on provisions — policy context for enforcement era
- Enforcement trend charts by topic — how FTC focus has shifted within a topic over time
- Language evolution tracking — how boilerplate provision language has changed across enforcement eras

**Defer to v2+:**
- Full-text search across all order language — topic tagging covers the primary use case for v1
- Side-by-side order comparison tool — separate product surface; high UI investment
- Industry sector drill-down — requires additional classification work not currently in the data
- Penalty/monetary remedy tracking — requires data enrichment

See `.planning/research/FEATURES.md` for full feature landscape, anti-features, and feature dependencies.

### Architecture Approach

The architecture is a four-layer system: a build-time pipeline that pre-computes all data artifacts, React Query hooks that fetch and cache those artifacts, a single FTCAnalytics page component that manages URL state and orchestrates data fetching, and feature component groups (EnforcementAnalytics, ProvisionsLibrary, CrossCasePatterns) that receive typed props and render without side effects. The page replaces the current FTCAnalytics.tsx with a tabbed version (/FTCAnalytics?tab=analytics|library|patterns). This avoids adding new routes and preserves backward-compatible URLs. All three feature areas share the same React Query cache.

**Major components:**
1. **scripts/build-ftc-data.ts (extended)** — classifyTopics(), buildProvisionsIndex(), detectPatterns(); emits ftc-provisions.json and ftc-patterns.json as new static artifacts
2. **useProvisionsIndex() + usePatternIndex() hooks** — fetch/cache new JSON artifacts with staleTime: Infinity; never filter, never transform
3. **FTCAnalytics.tsx (tabbed)** — owns URL state, orchestrates data fetching, passes typed props down; feature components are pure rendering units
4. **ProvisionCard + ProvisionTopicView** — the core new UI; quoted text, citation link, case metadata, filter bar
5. **PatternDetail + PatternVariantCard** — language evolution timeline; most technically novel surface area

**Key patterns to follow:**
- Single fetch, client-side filter: fetch entire JSON artifact once (staleTime: Infinity), filter in useMemo in rendering components
- URL-driven navigational state: active tab, selected topic, selected provision live in search params; ephemeral state (sort direction, hover) lives in useState
- Page orchestrates, feature components render: feature components in src/components/ftc/ never call hooks or access useSearchParams directly

See `.planning/research/ARCHITECTURE.md` for full component boundaries, data flow diagrams, and anti-patterns.

### Critical Pitfalls

1. **Keyword classification that over-tags as "Privacy" collapses the taxonomy** — Provision text contains "privacy" in boilerplate across nearly every data order. Prevention: classify against structured fields first (legal_authority field for statutory topic, provision.category for remedy type), treat "Privacy" as a residual/fallback only. Validate per-topic counts before any UI work begins.

2. **Flat provisions JSON grows to 12-18 MB, breaking page load** — 9,224 quoted_text fields across 292 source files; the largest cases have 80-120 instances. Prevention: topic-shard the output (emit ftc-provisions-data-security.json, ftc-provisions-coppa.json, etc.) OR separate an index file (titles, citations, tags) from detail files (full quoted text). Design the file split before building any fetch calls.

3. **Extracted quoted text contains OCR/LLM extraction errors** — confirmed in Assail sample file ("Defendat," "Masterard," etc.). Prevention: label all extracted text as "Extracted language — verify against source order"; make FTC.gov source link the primary citation CTA, not a footnote. Surface the confidence field on provision cards.

4. **Three-axis taxonomy with overlapping axes confuses practitioners** — Statutory and Practice Area axes heavily overlap (COPPA case is always a Privacy/Children's Privacy case). Prevention: reduce to two orthogonal axes (Statutory Authority + Remedy Type). Validate axes answer distinct practitioner questions before writing classification rules.

5. **Boilerplate structural provisions dominate pattern detection** — compliance reporting, recordkeeping, and acknowledgment provisions are near-identical across all orders by design. Prevention: exclude structural provision categories (compliance_reporting, recordkeeping, monitoring) from pattern detection; define 5-10 named patterns statically rather than discovering them dynamically.

See `.planning/research/PITFALLS.md` for full pitfall detail including moderate pitfalls (filter performance, URL special characters, sparse topic trend charts, broken FTC.gov URLs for old cases).

---

## Implications for Roadmap

Based on research, the critical path dependency is classification. The data pipeline must be built and validated before any UI surface. Architecture research explicitly states: "No UI work should begin until this phase is complete. The data shape drives component props."

### Phase 1: Data Pipeline Extension

**Rationale:** Everything in the provisions library — topic views, filter bars, trend charts, pattern library — is blocked until the build pipeline produces correctly classified provision data. This is the absolute prerequisite. Two pitfalls (taxonomy design, keyword over-classification) must be solved here before they can propagate to UI. Getting this wrong means reclassifying all 293 cases twice.

**Delivers:** Three new static JSON artifacts — ftc-provisions.json (or topic-sharded variants), ftc-patterns.json, and extended ftc-cases.json. Verified per-topic provision counts. New TypeScript types in src/types/ftc-provisions.ts.

**Addresses:** Critical path dependency (FEATURES.md), all four "data pipeline" phase rows in the pitfalls phase table

**Avoids:** Pitfall 1 (over-classification), Pitfall 2 (oversized flat file), Pitfall 4 (overlapping taxonomy axes), Pitfall 6 (boilerplate dominating pattern detection), Pitfall 8 (broken FTC.gov URLs)

**Requires deeper research during planning:** Taxonomy design (Statutory + Remedy axes — validate against actual legal_authority field values in source data), file splitting strategy (determine topic-sharded vs index+detail approach based on actual measured file sizes)

### Phase 2: Analytics Enhancement

**Rationale:** Extends existing infrastructure with minimum new surface area. Builds on the tab navigation mechanism needed by all three feature areas. Higher confidence because it extends proven components (FTCGroupChart, FTCCaseTable) with the new provision data. Validating topic trend charts here — before building the full provisions library — de-risks Pitfall 7 (sparse topic charts) in a lower-stakes context.

**Delivers:** Tabbed FTCAnalytics page (analytics/library/patterns tabs), TopicTrendChart, TopicBreakdownTable, upgraded FTCHeader. URL state for tab navigation.

**Uses:** Recharts (existing LineChart/AreaChart), useProvisionsIndex hook (new), URL search params pattern (existing)

**Implements:** Layer 3 (page component tab architecture) and the analytics feature group extension

**Standard patterns — skip research-phase:** Tab navigation with useSearchParams and conditional rendering is a well-documented React pattern. Chart type selection based on data count (Pitfall 7 prevention) is straightforward conditional logic.

### Phase 3: Provisions Library (Core New Feature)

**Rationale:** The product's core value proposition. Builds on the data pipeline output from Phase 1 and the tab navigation shell from Phase 2. This is the longest phase because it introduces the most new component surface area (5 new components, filter logic, citation display). Citation data quality (Pitfall 3) must be handled in ProvisionCard design.

**Delivers:** ProvisionTopicNav, ProvisionTopicView, ProvisionCard with proper citation labeling, ProvisionFilterBar with debounced inputs, ProvisionCitationLink with paragraph references and FTC.gov links.

**Uses:** TanStack Table v8 (new), MiniSearch (new, if full-text search is included in this phase), useProvisionsIndex hook

**Implements:** Layer 4 Provisions Library feature group; all table-stakes features from FEATURES.md

**Requires deeper research during planning:** ProvisionCard citation UX — how to surface extraction confidence and distinguish "extracted" from "verified" text without undermining the tool's utility; MiniSearch index architecture (index once in hook vs module-level cache)

**Avoids:** Pitfall 3 (garbled extracted text), Pitfall 5 (filter lag — use debounce + useMemo from day one), Pitfall 9 (per-case fetch waterfall — all provision data from pre-aggregated file), Pitfall 10 (URL special characters — define slugs in taxonomy constants), Pitfall 12 (dense layout — use cards not tables)

### Phase 4: Cross-Case Patterns (Language Evolution)

**Rationale:** The most technically novel surface area and the most uncertain in terms of implementation (pattern detection quality is unknown until the pipeline runs). Should come last so that pattern quality can be assessed against real data before investing in the UI. If pattern detection produces poor signal, the UI investment can be scoped down or deferred.

**Delivers:** PatternList, PatternDetail timeline view, PatternVariantCard. Shows how provision language evolves across enforcement eras for 5-10 statically-defined pattern names.

**Implements:** Layer 4 Cross-Case Patterns feature group; language evolution differentiator from FEATURES.md

**Requires deeper research during planning:** Pattern detection quality assessment — run the pipeline, inspect output, validate that named patterns (comprehensive security program, algorithmic destruction, data deletion) return meaningful variant counts (3-40 provisions per pattern) before committing to the UI design

**Avoids:** Pitfall 6 (boilerplate dominating patterns — exclude structural provision categories), Pitfall 7 (sparse data misleading — label variant counts prominently)

### Phase Ordering Rationale

- **Data first, UI second:** Architecture research is unambiguous — component props are derived from the data shape. Building UI against mock data that differs from the real pipeline output causes rework.
- **Taxonomy must be settled before classification:** The three-vs-two axis decision (Pitfall 4) cannot be changed after classification runs across 293 cases without redoing all the pipeline work. This decision belongs at the start of Phase 1.
- **File split strategy must be decided before the first hook is written:** Whether the provisions browsing hook fetches one flat file or multiple topic-sharded files determines the hook API and all dependent component interfaces. Change it after the fact means updating every fetch call.
- **Pattern detection is the riskiest unknown:** No research can predict output quality until the algorithm runs against real data. Phase 4 placement gives the most information before committing to that UI.

### Research Flags

Phases needing deeper research during planning:
- **Phase 1 — Taxonomy Design:** Inspect all unique legal_authority strings across the 293 source files to derive the actual statutory topic list from data, not from assumptions. The ARCHITECTURE.md STATUTORY_TOPICS list is an estimate; the actual distribution may have fewer categories than planned or unexpected values.
- **Phase 1 — File Split Strategy:** Measure actual uncompressed size of a candidate flat ftc-provisions.json before committing to topic-sharded output. If gzipped size is under 2 MB, the flat file is acceptable and simplifies the hook API significantly.
- **Phase 3 — Citation UX Pattern:** Research legal tech citation disclosure patterns (CourtListener, Casetext) to determine the right balance between surfacing extraction uncertainty and maintaining tool credibility.
- **Phase 4 — Pattern Detection Quality:** No research-phase needed; instead, run the pipeline and inspect output before designing PatternDetail UI.

Phases with standard patterns (no additional research needed):
- **Phase 2 — Tab navigation and chart extension:** Established React + Recharts patterns; TanStack Query hook extension is straightforward.
- **Phase 3 — Filter/sort mechanics:** Debounce + useMemo pattern is well-documented; TanStack Table v8 shadcn/ui integration has official guide.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Two new dependencies (MiniSearch, TanStack Table) — rationale grounded in direct codebase inspection and confirmed ecosystem compatibility. MiniSearch version number needs npm verification before install. |
| Features | HIGH | Grounded in direct data model inspection and established legal research tool conventions. Feature dependency chain is explicit and validated against actual JSON fields. |
| Architecture | HIGH | All component boundaries and data flows derived from direct inspection of existing code (build script, hooks, components, types). No inferences made without codebase evidence. |
| Pitfalls | HIGH | Two critical pitfalls (OCR extraction errors, keyword over-classification) confirmed against actual data files. File size risk assessed against actual grep count of 9,224 quoted_text fields. Pattern boilerplate pitfall derived from structural understanding of FTC order conventions. |

**Overall confidence: HIGH**

### Gaps to Address

- **Taxonomy axis count (2 vs 3):** Pitfalls research recommends reducing Statutory + Practice Area + Remedy Type to Statutory + Remedy Type only. This is a strong recommendation but requires validation against the actual legal_authority field distribution before the classification rules are written. If the legal_authority values cleanly map to non-overlapping categories, the two-axis model is correct. Resolve in Phase 1 planning.

- **MiniSearch current major version:** STACK.md notes the version may have advanced from 6.x to 7.x since training cutoff. Check npm before installing.

- **ftc-provisions.json actual size:** The 7.5-18 MB range is wide because it depends on how much case metadata is denormalized per provision. Measure actual size after the first pipeline run; this determines whether file splitting is required.

- **Pattern detection quality:** Cannot be assessed from research alone. Run the detectPatterns() function, inspect output JSON, validate named pattern variant counts before Phase 4 UI design begins.

- **FTC.gov URL validity for pre-2005 cases:** Pitfalls research flags that early case URLs may have broken path structures. A URL validation pipeline step is recommended before launch but was not executed during research.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection: `scripts/build-ftc-data.ts`, `src/types/ftc.ts`, `src/hooks/use-ftc-data.ts`, `src/pages/FTCAnalytics.tsx`, `src/components/ftc/*` — architecture and patterns
- Direct data inspection: `public/data/ftc-files/01.05_assail.json` — confirmed provision data structure, OCR artifacts, quoted_text fields
- Direct data inspection: grep count across 292 source files — confirmed 9,224 quoted_text instances (corpus scale)
- Project requirements: `.planning/PROJECT.md` — constraints, requirements, Milestone 2 scope
- `.planning/codebase/ARCH.md` — existing architecture baseline

### Secondary (MEDIUM confidence)
- MiniSearch project documentation: https://lucaong.github.io/minisearch/ — API design and indexing approach; version not verified against current npm release
- TanStack Table v8: https://tanstack.com/table/v8 — headless table API; HIGH confidence for stable v8 API
- Recharts 2.x component list: https://recharts.org/en-US/api — chart type availability

### Tertiary (informed by training data)
- Legal research tool conventions (Westlaw, LexisNexis, Bloomberg Law, CourtListener) — UX patterns for citation standards, topic-first browsing, chronological defaults
- FTC.gov enforcement database UI conventions — confidence HIGH for core patterns, MEDIUM for post-August 2025 UI changes

---
*Research completed: 2026-02-24*
*Ready for roadmap: yes*
