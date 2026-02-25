---
phase: 04-company-industry-view
plan: 02
subsystem: ui
tags: [react, recharts, shadcn, breadcrumb, pagination, horizontal-bar-charts, case-cards]

# Dependency graph
requires:
  - phase: 04-company-industry-view
    provides: "FTCIndustryTab with URL-driven routing, SECTOR_TAXONOMY, SectorGrid, industry-utils"
  - phase: 02-tab-shell-analytics
    provides: "ProvisionAnalytics Recharts patterns, ReferenceTable component"
  - phase: 03-provisions-library
    provides: "Pagination pattern with getPageNumbers, Popover+Checkbox filter pattern"
provides:
  - "SectorDetail page with breadcrumb navigation (Industries > Sector Label)"
  - "SectorPatternCharts with horizontal bar charts for topic and remedy distribution plus ReferenceTable"
  - "CaseCard compact enforcement action card with company, year, violation type, provision count, and View provisions link"
  - "CaseCardList with sort (date/company/provisions), topic filter, and pagination at 20 per page"
  - "Cross-tab navigation from case cards to Provisions Library tab"
affects: [04-03-sector-compare, 04-04-company-profile]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Sector detail breadcrumb navigation pattern", "CaseCard compact card layout for enforcement actions", "CaseCardList paginated list with sort and topic filter"]

key-files:
  created:
    - src/components/ftc/industry/SectorPatternCharts.tsx
    - src/components/ftc/industry/CaseCard.tsx
    - src/components/ftc/industry/CaseCardList.tsx
    - src/components/ftc/industry/SectorDetail.tsx
  modified:
    - src/components/ftc/FTCIndustryTab.tsx

key-decisions:
  - "handleViewProvisions navigates to ?tab=provisions landing page -- per research, no case-level filter exists in Provisions Library"
  - "Topic filter uses multi-select Popover+Checkbox pattern matching ProvisionFilterBar remedy type filter"
  - "CaseCardList duplicates getPageNumbers helper from ProvisionsContent rather than extracting shared utility -- keeps components self-contained"

patterns-established:
  - "Sector detail breadcrumb: ArrowLeft button + Breadcrumb (Industries > Sector) with onBack callback"
  - "CaseCard compact layout: article element with flex items-center, left section for metadata, right for action button"
  - "CaseCardList sort/filter/paginate: sort popover, topic filter popover, pagination at 20 per page"

requirements-completed: [INDY-01, INDY-02, INDY-03]

# Metrics
duration: 3min
completed: 2026-02-25
---

# Phase 4 Plan 02: Sector Detail View Summary

**Sector detail view with enforcement topic and remedy type horizontal bar charts, ReferenceTable drill-down, and paginated case card list with sort/filter and cross-tab provision navigation**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-25T15:53:35Z
- **Completed:** 2026-02-25T15:56:57Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- SectorPatternCharts renders horizontal bar charts for statutory topic and remedy type distribution per sector, with ReferenceTable for exact counts
- CaseCard displays compact enforcement action info (company, year, violation type, provision count) with View provisions cross-tab link
- CaseCardList provides sort by date/company/provision count, multi-select topic filter, and pagination at 20 cases per page
- SectorDetail assembles breadcrumb navigation, pattern charts, and case card list into a complete sector analysis page
- FTCIndustryTab wired to render SectorDetail when sector URL param is present, replacing placeholder

## Task Commits

Each task was committed atomically:

1. **Task 1: Create SectorPatternCharts and CaseCard components** - `dd9f5bd` (feat)
2. **Task 2: Create CaseCardList, SectorDetail, and wire into FTCIndustryTab** - `14573ac` (feat)

## Files Created/Modified
- `src/components/ftc/industry/SectorPatternCharts.tsx` - Horizontal bar charts for topic and remedy distribution with ReferenceTable
- `src/components/ftc/industry/CaseCard.tsx` - Compact enforcement action card with provision link
- `src/components/ftc/industry/CaseCardList.tsx` - Paginated, sortable, filterable case card list
- `src/components/ftc/industry/SectorDetail.tsx` - Sector detail view with breadcrumb, charts, and case list
- `src/components/ftc/FTCIndustryTab.tsx` - Wired SectorDetail for sector URL param routing

## Decisions Made
- handleViewProvisions navigates to the Provisions Library landing page (?tab=provisions) since per research there is no case-level filter in the Provisions Library -- user can filter by company from there
- Topic filter in CaseCardList uses multi-select Popover + Checkbox pattern matching the remedy type filter in ProvisionFilterBar
- getPageNumbers helper duplicated in CaseCardList rather than extracting to shared utility -- keeps components self-contained and follows existing pattern in ProvisionsContent

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed handleViewProvisions type signature**
- **Found during:** Task 2
- **Issue:** handleViewProvisions was typed as `() => void` but SectorDetail.onViewProvisions expects `(caseData: EnhancedFTCCaseSummary) => void`
- **Fix:** Added `_caseData` parameter to match expected callback signature
- **Files modified:** src/components/ftc/FTCIndustryTab.tsx
- **Verification:** TypeScript compilation passes with zero errors
- **Committed in:** 14573ac (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Type signature alignment necessary for correctness. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Sector detail view is fully functional for Plans 03 (Sector Compare) and 04 (Company Profile)
- SectorPatternCharts can be reused in compare view for side-by-side chart rendering
- CaseCard component available for reuse in company profile view
- All 4 created files export default components following established patterns

## Self-Check: PASSED

- All 4 created files exist on disk
- 1 modified file (FTCIndustryTab.tsx) verified
- Commit dd9f5bd (Task 1) found in git log
- Commit 14573ac (Task 2) found in git log
- TypeScript compilation: zero errors
- Vite build: success

---
*Phase: 04-company-industry-view*
*Completed: 2026-02-25*
