---
phase: 11-library-restructure
plan: 01
subsystem: ui
tags: [react, radix-tabs, provisions, sidebar, sub-tabs]

# Dependency graph
requires:
  - phase: 10-analytics-cleanup
    provides: HIDDEN_REMEDY_TYPES constant used by TopicSidebar
provides:
  - Sub-tab layout in FTCProvisionsTab with "By Topic" and "By Case" views
  - TopicSidebar without practice area navigation
  - Placeholder for case browser (Plan 02)
affects: [11-02-PLAN]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Sub-tab routing via URL view param within parent tab
    - Default sub-tab by omitting param (case view = no view param)

key-files:
  created: []
  modified:
    - src/components/ftc/FTCProvisionsTab.tsx
    - src/components/ftc/provisions/TopicSidebar.tsx

key-decisions:
  - "Default sub-tab is By Case with no URL param; By Topic uses view=topic"
  - "ProvisionsLanding replaced with inline instruction text, file left for cleanup"
  - "Practice area sidebar links removed but URLs remain functional"

patterns-established:
  - "Sub-tab state via URL search params: view param for provisions sub-tab selection"

requirements-completed: [LIB-01, LIB-02]

# Metrics
duration: 2min
completed: 2026-03-02
---

# Phase 11 Plan 01: Library Restructure Summary

**Sub-tab layout with "By Topic" and "By Case" switching in provisions library, sidebar trimmed to Statutory Authority and Remedy Type only**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-02T01:53:33Z
- **Completed:** 2026-03-02T01:55:41Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- TopicSidebar now renders only Statutory Authority and Remedy Type categories (practice area removed from navigation)
- FTCProvisionsTab restructured with Radix sub-tabs: "By Case" (default) and "By Topic"
- ProvisionsLanding removed from rendering flow; replaced with inline instruction text when no topic selected
- Practice area URLs remain functional via direct access (backward compatibility preserved)

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove practice area from TopicSidebar** - `f8628c7` (feat)
2. **Task 2: Add sub-tab layout to FTCProvisionsTab** - `c11e2a0` (feat)

**Plan metadata:** pending (docs: complete plan)

## Files Created/Modified
- `src/components/ftc/provisions/TopicSidebar.tsx` - Removed practice_area from CATEGORY_ORDER and groups initialization
- `src/components/ftc/FTCProvisionsTab.tsx` - Added sub-tab layout with Radix Tabs, URL-based view switching, inline topic instruction

## Decisions Made
- Default sub-tab is "By Case" — achieved by treating absence of `view` param as "case" view
- ProvisionsLanding component removed from import/usage but file not deleted (may be referenced elsewhere, cleanup deferred)
- Practice area topics still accessible via direct URL (e.g., ?topic=pa-deception) per user decision; only sidebar links removed

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Sub-tab layout is in place with "By Case" placeholder ready for Plan 02 to implement the CaseBrowser component
- All existing topic-based provision browsing continues to work unchanged
- TypeScript compilation and Vite build pass cleanly

## Self-Check: PASSED

- [x] src/components/ftc/provisions/TopicSidebar.tsx exists
- [x] src/components/ftc/FTCProvisionsTab.tsx exists
- [x] .planning/phases/11-library-restructure/11-01-SUMMARY.md exists
- [x] Commit f8628c7 exists
- [x] Commit c11e2a0 exists

---
*Phase: 11-library-restructure*
*Completed: 2026-03-02*
