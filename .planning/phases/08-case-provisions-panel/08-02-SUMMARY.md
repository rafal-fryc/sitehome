---
phase: 08-case-provisions-panel
plan: 02
subsystem: ui
tags: [react, sheet, state-management, case-provisions, industry-tab]

# Dependency graph
requires:
  - phase: 08-case-provisions-panel
    plan: 01
    provides: "CaseProvisionsSheet component, useCaseFile hook, ProvisionRow component"
provides:
  - "Complete case provisions panel wired into FTCIndustryTab via Sheet state"
  - "CaseCard updated to remove ExternalLink icon for inline panel UX"
affects: [09-takeaway-display]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Sheet state management via useState at tab level, shared across view paths"]

key-files:
  created: []
  modified:
    - src/components/ftc/FTCIndustryTab.tsx
    - src/components/ftc/industry/CaseCard.tsx

key-decisions:
  - "Sheet rendered at tab level (not inside SectorDetail) so it persists across view transitions"
  - "handleViewProvisions sets local state instead of navigating to Provisions tab via URL params"

patterns-established:
  - "Tab-level Sheet state: useState<T | null> pattern where non-null triggers Sheet open"
  - "Single return with view variable: replace multiple returns with let view + conditional assignment + fragment wrapper"

requirements-completed: [CPNL-01, CPNL-03]

# Metrics
duration: 2min
completed: 2026-03-01
---

# Phase 8 Plan 2: Wire CaseProvisionsSheet into Industry Tab Summary

**CaseProvisionsSheet wired into FTCIndustryTab via local state replacing tab navigation, with CaseCard ExternalLink icon removed for inline panel UX**

## Performance

- **Duration:** 2 min (Task 1 from prior agent + checkpoint verification)
- **Started:** 2026-03-01T22:50:00Z
- **Completed:** 2026-03-01T23:35:40Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Replaced tab-navigation handler in FTCIndustryTab with Sheet state management (setSheetCase instead of setSearchParams)
- Restructured FTCIndustryTab's three return paths into a single return with Fragment wrapping CaseProvisionsSheet alongside all views
- Removed ExternalLink icon from CaseCard "View provisions" button for inline panel UX
- Full end-to-end flow verified by user: CaseCard click opens Sheet, provisions grouped by topic, rows expand/collapse, close returns to industry tab

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire CaseProvisionsSheet into FTCIndustryTab and update CaseCard** - `dd6d102` (feat)
2. **Task 2: Verify complete case provisions panel flow** - human-verify checkpoint (approved, no code changes)

## Files Created/Modified
- `src/components/ftc/FTCIndustryTab.tsx` - Added CaseProvisionsSheet import, sheetCase state, replaced handleViewProvisions to use local state, restructured returns into single Fragment
- `src/components/ftc/industry/CaseCard.tsx` - Removed ExternalLink import and icon from "View provisions" button

## Decisions Made
- Sheet rendered at tab level (outside SectorDetail) so it works across all view states and survives view transitions
- handleViewProvisions sets local state (setSheetCase) instead of navigating via URL params -- Sheet is purely UI state, no URL change needed

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Case provisions panel feature is complete end-to-end
- Phase 9 (takeaway display) can build on this Sheet infrastructure for expanded provision detail views
- All CPNL requirements (01, 02, 03) are now complete across plans 08-01 and 08-02

## Self-Check: PASSED

- Both modified files exist at expected paths
- Task 1 commit verified (dd6d102)
- Task 2 was human-verify checkpoint, approved by user

---
*Phase: 08-case-provisions-panel*
*Completed: 2026-03-01*
