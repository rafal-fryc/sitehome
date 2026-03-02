---
phase: 08-case-provisions-panel
plan: 01
subsystem: ui
tags: [react, sheet, collapsible, react-query, radix, provisions]

# Dependency graph
requires:
  - phase: 01-data-pipeline
    provides: "Case JSON files at /data/ftc-files/{id}.json with order.provisions[] structure"
provides:
  - "useCaseFile React Query hook for lazy case file fetching"
  - "ProvisionRow collapsible component for provision display"
  - "CaseProvisionsSheet panel component with grouped provisions"
affects: [08-02 integration, industry tab]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Lazy Sheet data fetching with React Query enabled flag", "Provision grouping by statutory topic with Map"]

key-files:
  created:
    - src/hooks/use-case-file.ts
    - src/components/ftc/industry/ProvisionRow.tsx
    - src/components/ftc/industry/CaseProvisionsSheet.tsx
  modified: []

key-decisions:
  - "Used data-state CSS selector on CollapsibleTrigger for chevron rotation, matching accordion pattern"
  - "Provisions with no statutory_topics grouped under 'Other' heading at natural insertion order"
  - "Sheet width set to 50vw desktop / full-width mobile for readable provision text"

patterns-established:
  - "Lazy Sheet fetch: useCaseFile with enabled=open flag prevents stale queries"
  - "Verbatim text assembly: requirements[].quoted_text concatenated with double newline"
  - "Topic grouping: Map-based grouping preserving original provision order within groups"

requirements-completed: [CPNL-02]

# Metrics
duration: 2min
completed: 2026-03-01
---

# Phase 8 Plan 1: Case Provisions Sheet Components Summary

**Sheet panel with lazy-loaded case provisions grouped by statutory topic, collapsible rows with verbatim text from requirements[].quoted_text**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-01T21:52:49Z
- **Completed:** 2026-03-01T21:54:27Z
- **Tasks:** 2
- **Files created:** 3

## Accomplishments
- Created useCaseFile hook following existing React Query pattern with staleTime: Infinity and enabled flag
- Built ProvisionRow collapsible component with title, part number, remedy type badges (max 2 + overflow count), and verbatim text expansion
- Built CaseProvisionsSheet with case header, loading skeleton, error state, and provisions grouped by statutory topic with count badges
- Sheet width overrides default to 50vw on desktop for readable provision text

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useCaseFile hook and ProvisionRow component** - `6b8873d` (feat)
2. **Task 2: Create CaseProvisionsSheet component** - `28f90da` (feat)

## Files Created/Modified
- `src/hooks/use-case-file.ts` - React Query hook for lazy case JSON file fetching
- `src/components/ftc/industry/ProvisionRow.tsx` - Collapsible provision row with chevron, title, part number, remedy badges, and verbatim text
- `src/components/ftc/industry/CaseProvisionsSheet.tsx` - Sheet panel with header, topic-grouped provisions, loading skeleton, error state

## Decisions Made
- Used `[&[data-state=open]>svg]:rotate-180` CSS selector for chevron rotation, matching existing accordion pattern in the codebase
- Provisions with no statutory_topics are grouped under "Other" heading, consistent with build-provisions.ts handling
- Sheet width set to `sm:w-[50vw] sm:max-w-2xl` for readable provision text while avoiding full-screen takeover
- Remedy type badges limited to 2 visible with "+N" overflow to prevent trigger line wrapping

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All three component files ready for integration in Plan 08-02
- CaseProvisionsSheet accepts `caseData`, `open`, `onOpenChange` props matching the integration contract
- Plan 08-02 will wire CaseProvisionsSheet into FTCIndustryTab by replacing tab-navigation handler with Sheet state

## Self-Check: PASSED

- All 3 created files exist at expected paths
- Both task commits verified (6b8873d, 28f90da)
- TypeScript compilation passes without errors

---
*Phase: 08-case-provisions-panel*
*Completed: 2026-03-01*
