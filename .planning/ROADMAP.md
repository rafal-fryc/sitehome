# Roadmap: FTC Enforcement Provisions Library

## Milestones

- ✅ **v1.0 MVP** -- Phases 1-5 (shipped 2026-02-25) -- [archive](milestones/v1.0-ROADMAP.md)
- ✅ **v1.1 Data Quality & Case Insights** -- Phases 6-9 (shipped 2026-03-02) -- [archive](milestones/v1.1-ROADMAP.md)
- **v1.2 Library & Patterns Overhaul** -- Phases 10-12

## Phases

<details>
<summary>v1.0 MVP (Phases 1-5) -- SHIPPED 2026-02-25</summary>

- [x] Phase 1: Data Pipeline (4 plans) -- completed 2026-02-24
- [x] Phase 2: Tab Shell + Analytics (5 plans) -- completed 2026-02-24
- [x] Phase 3: Provisions Library (5 plans) -- completed 2026-02-25
- [x] Phase 4: Company & Industry View (4 plans) -- completed 2026-02-25
- [x] Phase 5: Cross-Case Patterns (3 plans) -- completed 2026-02-25

</details>

<details>
<summary>v1.1 Data Quality & Case Insights (Phases 6-9) -- SHIPPED 2026-03-02</summary>

- [x] Phase 6: Remedy Reclassification (2 plans) -- completed 2026-02-26
- [x] Phase 7: Pattern Condensing (2 plans) -- completed 2026-02-27
- [x] Phase 8: Case Provisions Panel (2 plans) -- completed 2026-03-01
- [x] Phase 9: Key Takeaways (2 plans) -- completed 2026-03-02

</details>

### v1.2 Library & Patterns Overhaul

- [ ] **Phase 10: Analytics Cleanup** - Collapsible tables and Order Administration removal from UI
- [ ] **Phase 11: Library Restructure** - Split provisions library into provision search and case search with unified case access
- [ ] **Phase 12: Patterns Overhaul** - Behavioral summary patterns from takeaways and remedy category consolidation

## Phase Details

### Phase 10: Analytics Cleanup
**Goal**: Analytics dashboard presents clean, focused data with collapsible detail tables and no Order Administration clutter
**Depends on**: Nothing (independent of other v1.2 work)
**Requirements**: ANLZ-01, ANLZ-02
**Success Criteria** (what must be TRUE):
  1. Bar charts on the analytics tab display without tables beneath them by default; user can expand tables on demand
  2. Order Administration does not appear in any remedy type filter option, chart segment, or table row across the entire application
  3. Underlying data files still contain Order Administration classifications (UI-only hiding, no data loss)
**Plans**: 1 plan
- [ ] 10-01-PLAN.md — Collapsible analytics tables + Order Administration UI hiding

### Phase 11: Library Restructure
**Goal**: Provisions library offers distinct workflows for searching provisions by topic and browsing enforcement actions by case, with case-level provision access from the library
**Depends on**: Phase 10 (Order Administration hiding should be in place before library restructure)
**Requirements**: LIB-01, LIB-02, LIB-03, LIB-04
**Success Criteria** (what must be TRUE):
  1. Practice area sections no longer appear in the provisions library sidebar or navigation
  2. Provisions library has two visually distinct sections: one for searching provisions by topic/text, one for browsing enforcement actions/cases
  3. User can search for a specific company or case title in the actions/cases section and find matching enforcement actions
  4. User can open a case provisions panel (Sheet modal) for any case from within the library, without navigating to the industry tab
**Plans**: TBD

### Phase 12: Patterns Overhaul
**Goal**: Patterns section includes behavioral summary patterns derived from takeaway data alongside restructured remedy patterns with consolidated categories
**Depends on**: Nothing (patterns tab is independent of analytics and library)
**Requirements**: PATN-01, PATN-02, PATN-03
**Success Criteria** (what must be TRUE):
  1. Remedy provision patterns appear as their own clearly labeled category within the patterns section, distinct from other pattern types
  2. A new behavioral summary pattern category exists showing common "what the business did wrong" patterns extracted from takeaway data across cases
  3. Remedy pattern categories have been consolidated per user-directed merge decisions, reducing redundant or overlapping category groupings
  4. Behavioral summary patterns display case counts, timeline data, and are browsable in the same manner as existing pattern types
**Plans**: TBD

## Progress

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
| 9. Key Takeaways | v1.1 | 2/2 | Complete | 2026-03-02 |
| 10. Analytics Cleanup | v1.2 | 0/1 | Planned | - |
| 11. Library Restructure | v1.2 | 0/? | Not started | - |
| 12. Patterns Overhaul | v1.2 | 0/? | Not started | - |
