# Roadmap: FTC Enforcement Provisions Library

## Milestones

- ✅ **v1.0 MVP** -- Phases 1-5 (shipped 2026-02-25) -- [archive](milestones/v1.0-ROADMAP.md)
- **v1.1 Data Quality & Case Insights** -- Phases 6-9 (in progress)

## Phases

<details>
<summary>v1.0 MVP (Phases 1-5) -- SHIPPED 2026-02-25</summary>

- [x] Phase 1: Data Pipeline (4 plans) -- completed 2026-02-24
- [x] Phase 2: Tab Shell + Analytics (5 plans) -- completed 2026-02-24
- [x] Phase 3: Provisions Library (5 plans) -- completed 2026-02-25
- [x] Phase 4: Company & Industry View (4 plans) -- completed 2026-02-25
- [x] Phase 5: Cross-Case Patterns (3 plans) -- completed 2026-02-25

</details>

### v1.1 Data Quality & Case Insights

**Milestone Goal:** Improve data quality (remedy categories, pattern grouping) and add case-level insights (key takeaways, case provisions panel).

- [x] **Phase 6: Remedy Reclassification** - Reclassify 885 "other" provisions into meaningful remedy categories via build pipeline
- [x] **Phase 7: Pattern Condensing** - Merge similar patterns, prune low-value, sort by most recent example
- [x] **Phase 8: Case Provisions Panel** - Inline provisions modal in the industry tab for case-specific browsing
- [ ] **Phase 9: Key Takeaways** - Claude-generated "what the business did wrong" summaries on case cards and provisions panel

## Phase Details

### Phase 6: Remedy Reclassification
**Goal**: Practitioners can browse provisions by meaningful remedy categories instead of seeing most provisions bucketed as "Other"
**Depends on**: Nothing (first phase of v1.1; builds on v1.0 pipeline)
**Requirements**: RMED-01, RMED-02, RMED-03, RMED-04, RMED-05, RMED-06
**Success Criteria** (what must be TRUE):
  1. Remedy type filter in Provisions tab shows new named categories (e.g., Data Retention/Deletion, Consumer Notification) instead of a single overloaded "Other" bucket
  2. Filtering by any new remedy category returns relevant provisions with correct verbatim text and citations
  3. The "Other" category still exists but contains only structural/administrative provisions (~585), not substantive enforcement provisions
  4. A human-reviewed dry-run proposal was generated and approved before any reclassification was applied to source data
**Plans**: TBD

Plans:
- [x] 06-01: Enum Foundation + Proposal Script (RMED-01, RMED-02, RMED-03) -- completed 2026-02-26
- [x] 06-02: Apply Reclassification + Rebuild Pipeline (RMED-04, RMED-05, RMED-06) -- completed 2026-02-26

### Phase 7: Pattern Condensing
**Goal**: Pattern browser shows a curated, navigable set of enforcement patterns instead of redundant variants and structural noise
**Depends on**: Nothing (independent of Phase 6; benefits from better remedy data but does not require it)
**Requirements**: PTRN-01, PTRN-02, PTRN-03, PTRN-04, PTRN-05
**Success Criteria** (what must be TRUE):
  1. Assessment-pattern variants are merged from 12 separate rows into 3-4 meaningful groups, and acknowledgment variants are merged into 1 group
  2. Low-value structural patterns (below composite threshold) are pruned from the pattern browser
  3. Patterns are sorted by most recent example, so practitioners see current enforcement trends first
  4. Original ftc-patterns.json is checkpointed in git before any changes, and merge decisions are recorded in a config file
**Plans**: 2 plans

Plans:
- [x] 07-01: Checkpoint + Merge/Prune Proposal Script (PTRN-04, PTRN-05) -- completed 2026-02-27
- [x] 07-02: Apply Merge Config + Rebuild + UI Polish (PTRN-01, PTRN-02, PTRN-03) -- completed 2026-02-27

### Phase 8: Case Provisions Panel
**Goal**: Practitioners can drill into a specific case's provisions from the industry tab without losing sector context
**Depends on**: Nothing (independent of Phases 6-7; case id maps directly to /data/ftc-files/{id}.json -- no build artifact needed)
**Requirements**: CPNL-01, CPNL-02, CPNL-03
**Success Criteria** (what must be TRUE):
  1. Clicking "View provisions" on a case card in the industry tab opens an inline modal/Sheet showing that case's provisions
  2. The modal displays verbatim provision text with citations for every provision in that case, including provisions spanning multiple statutory topics
  3. The user remains on the industry tab after closing the modal (no navigation to the Provisions tab)
**Plans**: 2 plans

Plans:
- [x] 08-01: Hook + Sheet Component + ProvisionRow (CPNL-02) -- completed 2026-03-01
- [x] 08-02: Wire into FTCIndustryTab + Update CaseCard (CPNL-01, CPNL-03) -- completed 2026-03-01

### Phase 9: Key Takeaways
**Goal**: Practitioners can quickly understand what each business did wrong and what the FTC required, without reading the full consent order
**Depends on**: Phase 8 (provisions panel hosts full takeaway display)
**Requirements**: TAKE-01, TAKE-02, TAKE-03, TAKE-04, TAKE-05
**Success Criteria** (what must be TRUE):
  1. Every case card across all relevant tabs shows a brief takeaway summarizing what the business did wrong
  2. Opening the case provisions panel displays the full takeaway text in the modal header
  3. All takeaway text is labeled as "AI-generated summary" in the UI
  4. Takeaways contain only factual claims derivable from structured case data (legal authority, violation type, provision titles) -- no hallucinated dollar amounts, statute names, or dates
  5. A dry-run validation on 10 representative sample cases was completed before full batch generation
**Plans**: TBD

Plans:
- [ ] 09-01: TBD
- [ ] 09-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 6 -> 7 -> 8 -> 9
(Phases 6 and 7 have no dependency between them and could execute concurrently, but sequential is the default.)

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Data Pipeline | v1.0 | 4/4 | Complete | 2026-02-24 |
| 2. Tab Shell + Analytics | v1.0 | 5/5 | Complete | 2026-02-24 |
| 3. Provisions Library | v1.0 | 5/5 | Complete | 2026-02-25 |
| 4. Company & Industry View | v1.0 | 4/4 | Complete | 2026-02-25 |
| 5. Cross-Case Patterns | v1.0 | 3/3 | Complete | 2026-02-25 |
| 6. Remedy Reclassification | v1.1 | 2/2 | Complete | 2026-02-26 |
| 7. Pattern Condensing | v1.1 | 2/2 | Complete | 2026-02-27 |
| 8. Case Provisions Panel | v1.1 | 2/2 | Complete | 2026-03-01 |
| 9. Key Takeaways | v1.1 | 0/0 | Not started | - |
