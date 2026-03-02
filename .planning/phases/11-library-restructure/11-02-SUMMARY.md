---
phase: 11-library-restructure
plan: 02
subsystem: ui
tags: [react, case-browser, search, accordion, provisions, filter-as-you-type]

# Dependency graph
requires:
  - phase: 11-library-restructure/01
    provides: Sub-tab layout with "By Case" placeholder in FTCProvisionsTab
provides:
  - CaseBrowser component with filter-as-you-type search, sort controls, pagination
  - CaseProvisionAccordion for inline provision expansion grouped by topic
  - Complete dual-workflow provisions library (By Topic + By Case)
affects: [12-patterns-overhaul]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Filter-as-you-type search with useMemo across multiple fields (company, docket, year)
    - Single-expansion accordion pattern (one case open at a time)
    - Cross-directory component reuse (CaseCard, ProvisionRow from industry/ in provisions/)

key-files:
  created:
    - src/components/ftc/provisions/CaseBrowser.tsx
    - src/components/ftc/provisions/CaseProvisionAccordion.tsx
  modified:
    - src/components/ftc/FTCProvisionsTab.tsx

key-decisions:
  - "Reused CaseCard and ProvisionRow components from industry/ directory via cross-directory imports"
  - "Copied groupByTopic helper into CaseProvisionAccordion rather than extracting to shared module"
  - "Cases with zero classified provisions filtered out of case browser list"

patterns-established:
  - "Filter-as-you-type: useMemo filtering across multiple fields with OR logic and substring matching"
  - "Single-expansion: expandedCaseId state with toggle logic for exclusive accordion behavior"

requirements-completed: [LIB-03, LIB-04]

# Metrics
duration: 3min
completed: 2026-03-01
---

# Phase 11 Plan 02: Case Browser Summary

**Case browser with filter-as-you-type search, sort controls, and inline provision accordion for the "By Case" sub-tab**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-01T01:57:00Z
- **Completed:** 2026-03-01T02:00:00Z
- **Tasks:** 3 (2 auto + 1 checkpoint)
- **Files modified:** 3

## Accomplishments
- CaseBrowser provides real-time search filtering across company name, docket number, and year
- CaseProvisionAccordion shows provisions inline grouped by statutory topic with loading states
- Single-expansion behavior ensures only one case is open at a time
- Cases without classified provisions are excluded from the browser
- Sort controls for date, company, and provision count with direction toggle
- Complete dual-workflow provisions library is now functional (By Topic + By Case)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create CaseBrowser and CaseProvisionAccordion components** - `4c74f24` (feat)
2. **Task 2: Wire CaseBrowser into FTCProvisionsTab "By Case" sub-tab** - `f44a344` (feat)
3. **Task 3: Visual verification checkpoint** - approved by user (no commit, checkpoint only)

**Plan metadata:** pending

## Files Created/Modified
- `src/components/ftc/provisions/CaseBrowser.tsx` - Case browser with search bar, sort controls, CaseCard list, pagination, and expansion management (293 lines)
- `src/components/ftc/provisions/CaseProvisionAccordion.tsx` - Inline provision expansion panel using useCaseFile hook and ProvisionRow components, grouped by topic (127 lines)
- `src/components/ftc/FTCProvisionsTab.tsx` - CaseBrowser wired into "By Case" sub-tab with loading state handling

## Decisions Made
- Reused CaseCard and ProvisionRow from industry/ directory via cross-directory imports (avoids duplication)
- Copied groupByTopic helper function locally into CaseProvisionAccordion (small function, not worth shared module)
- Cases with zero classified provisions filtered out per user decision "Only show cases that have classified provisions"

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 11 (Library Restructure) is fully complete with both plans delivered
- All four LIB requirements satisfied (LIB-01 through LIB-04)
- Phase 12 (Patterns Overhaul) can proceed independently -- patterns tab is separate from library and analytics
- No blockers for next phase

## Self-Check: PASSED

- [x] src/components/ftc/provisions/CaseBrowser.tsx exists
- [x] src/components/ftc/provisions/CaseProvisionAccordion.tsx exists
- [x] src/components/ftc/FTCProvisionsTab.tsx exists
- [x] .planning/phases/11-library-restructure/11-02-SUMMARY.md exists
- [x] Commit 4c74f24 exists
- [x] Commit f44a344 exists

---
*Phase: 11-library-restructure*
*Completed: 2026-03-01*
