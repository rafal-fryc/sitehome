---
phase: 03-provisions-library
plan: 02
subsystem: ui
tags: [react-query, provisions, sidebar, pagination, provision-card, verbatim-text, url-state]

# Dependency graph
requires:
  - phase: 03-provisions-library
    provides: Provision shard files with verbatim_text, violation_type, manifest.json with topic metadata
  - phase: 02-tab-shell-analytics
    provides: FTCTabShell with provisions tab routing, FTCSectionSidebar pattern, shadcn/ui components
provides:
  - useProvisionsManifest and useProvisionShard React Query hooks for data fetching
  - TopicSidebar with 25 topics grouped by Statutory Authority, Practice Area, Remedy Type with count badges
  - ProvisionsLanding view with total provision/case counts and disclaimer
  - ProvisionCard with context header (company, year, docket, citation, violation type, FTC.gov link) and verbatim text
  - ProvisionsContent with paginated display (50 per page), sorting by date descending, disclaimer banner
  - FTCProvisionsTab with URL-driven topic selection via ?topic= search param
affects: [03-provisions-library, provisions-search, provisions-filters]

# Tech tracking
tech-stack:
  added: []
  patterns: [lazy-loaded shard fetching via manifest metadata, paginated provision card list, URL-driven topic selection]

key-files:
  created:
    - src/hooks/use-provisions.ts
    - src/components/ftc/provisions/TopicSidebar.tsx
    - src/components/ftc/provisions/ProvisionsLanding.tsx
    - src/components/ftc/provisions/ProvisionCard.tsx
    - src/components/ftc/provisions/ProvisionsContent.tsx
  modified:
    - src/components/ftc/FTCProvisionsTab.tsx

key-decisions:
  - "TopicSidebar groups topics alphabetically within each category using manifest.topics category field"
  - "ProvisionCard shows full verbatim_text with whitespace-pre-line, falls back to summary with (summary) label when verbatim_text is empty"
  - "ProvisionsContent paginates at 50 provisions per page with ellipsis-based page number display"
  - "Default sort is date descending (most recent first) as recommended by research"
  - "Page resets to 1 on topic change via useRef + useEffect pattern"

patterns-established:
  - "useProvisionShard fetches individual shard by filename from manifest metadata -- avoids hardcoded shard filename map"
  - "Provision composite key: case_id + provision_number + index for React key uniqueness"
  - "TopicSidebar desktop: sticky w-56 with ScrollArea; mobile: horizontal scrollable bar with category sub-sections"

requirements-completed: [PROV-01, PROV-02, PROV-03, PROV-04, PROV-10]

# Metrics
duration: 3min
completed: 2026-02-24
---

# Phase 3 Plan 2: Core Provisions Browsing Summary

**Topic sidebar with 25 grouped topics, provision cards with verbatim order text and context headers, paginated content with URL-driven topic selection**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-25T01:43:48Z
- **Completed:** 2026-02-25T01:46:49Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Built complete provisions browsing experience with topic sidebar, landing view, provision cards, and paginated content
- TopicSidebar displays 25 topics grouped under Statutory Authority (7), Practice Area (8), and Remedy Type (10) with count badges
- ProvisionCard renders context header (company, year, docket, Part citation, violation type, View on FTC.gov link) plus full verbatim order text
- ProvisionsContent paginates large topics (up to 1,583 provisions) at 50 per page with Previous/Next/page number navigation
- URL-driven topic selection persists selected topic in ?topic= search parameter

## Task Commits

Each task was committed atomically:

1. **Task 1: Create data hooks and topic sidebar with landing view** - `a589587` (feat)
2. **Task 2: Create ProvisionCard, ProvisionsContent, and wire FTCProvisionsTab** - `67b8094` (feat)

**Plan metadata:** pending (docs: complete plan)

## Files Created/Modified
- `src/hooks/use-provisions.ts` - React Query hooks: useProvisionsManifest (manifest.json) and useProvisionShard (individual shard by filename)
- `src/components/ftc/provisions/TopicSidebar.tsx` - Grouped topic sidebar with count badges, desktop sticky + mobile horizontal bar
- `src/components/ftc/provisions/ProvisionsLanding.tsx` - Landing view with total counts (2,783 provisions / 293 cases) and disclaimer
- `src/components/ftc/provisions/ProvisionCard.tsx` - Provision card with context header bar and full verbatim text display
- `src/components/ftc/provisions/ProvisionsContent.tsx` - Paginated provision list with disclaimer banner, date-descending sort, loading/error states
- `src/components/ftc/FTCProvisionsTab.tsx` - Replaced placeholder with sidebar + content layout using URL-driven topic selection

## Decisions Made
- TopicSidebar groups topics alphabetically within each category (statutory/practice_area/remedy_type) using the manifest category field
- ProvisionCard shows full verbatim_text with whitespace-pre-line for paragraph preservation; falls back to summary with "(summary)" label
- Pagination at 50 items per page with ellipsis-based page numbers (first, neighbors of current, last)
- Default sort: date descending (most recent provisions first) per research recommendation
- Page resets to 1 on topic change using useRef + useEffect rather than inline state mutation

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed non-standard page reset pattern in ProvisionsContent**
- **Found during:** Task 2 (ProvisionsContent implementation)
- **Issue:** Initial implementation used useMemo to create a mutable ref-like object for tracking previous topic -- non-idiomatic React pattern
- **Fix:** Replaced with proper useRef + useEffect pattern for topic change detection and page reset
- **Files modified:** src/components/ftc/provisions/ProvisionsContent.tsx
- **Verification:** TypeScript passes, page correctly resets on topic change
- **Committed in:** 67b8094 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Minor code quality fix. No scope creep.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Core provisions browsing experience is functional -- users can select topics and browse provision cards
- Ready for Plan 03 (filter bar with date range, company, remedy type filters)
- Ready for Plan 04 (MiniSearch-based full-text search with highlighting)
- ProvisionCard accepts optional searchQuery prop for future search highlighting integration

## Self-Check: PASSED

All 6 files verified present. Commits a589587 and 67b8094 confirmed in git log. Exports useProvisionsManifest and useProvisionShard confirmed. TypeScript and Vite build pass cleanly.

---
*Phase: 03-provisions-library*
*Completed: 2026-02-24*
