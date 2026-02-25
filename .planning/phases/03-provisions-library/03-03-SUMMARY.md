---
phase: 03-provisions-library
plan: 03
subsystem: ui
tags: [filtering, sorting, date-fns, cmdk, popover, checkbox, filter-chips, date-presets, company-autocomplete, remedy-type-filter]

# Dependency graph
requires:
  - phase: 03-provisions-library
    provides: ProvisionsContent with paginated provision cards, TopicSidebar, ProvisionCard, useProvisionShard hook
  - phase: 02-tab-shell-analytics
    provides: FTCTabShell with provisions tab routing, shadcn/ui components (Popover, Command, Checkbox)
provides:
  - ProvisionFilterBar with sticky layout, date preset buttons, company autocomplete, remedy type multi-select, sort control, result count
  - CompanyAutocomplete with cmdk Command + Popover pattern for company name typeahead
  - FilterChips with dismissible active filter display and Clear all button
  - Client-side filtering by date range, company name, and remedy type with sorting by date/company/type
  - DATE_PRESETS and REMEDY_TYPE_OPTIONS constants for filter controls
affects: [03-provisions-library, provisions-search]

# Tech tracking
tech-stack:
  added: []
  patterns: [date-fns isWithinInterval for date range filtering, Popover + Checkbox for multi-select filter, cmdk Command + Popover for autocomplete, sticky filter bar with filter chips]

key-files:
  created:
    - src/components/ftc/provisions/ProvisionFilterBar.tsx
    - src/components/ftc/provisions/FilterChips.tsx
    - src/components/ftc/provisions/CompanyAutocomplete.tsx
  modified:
    - src/constants/ftc.ts
    - src/components/ftc/provisions/ProvisionsContent.tsx

key-decisions:
  - "Date preset toggles deselect when clicked again (same preset click clears the date filter)"
  - "Sort defaults to date descending; switching sort key sets default direction (date=desc, company/type=asc); clicking same key flips direction"
  - "Filters reset on topic change to prevent stale state (per research Pitfall 3)"
  - "Remedy type multi-select uses Popover + Checkbox list pattern since shadcn Select is single-select only"

patterns-established:
  - "Filter state managed in ProvisionsContent with useCallback handlers passed down to ProvisionFilterBar"
  - "Active filters built as FilterChip[] array from filter state, with key-based dismiss routing to correct state setter"
  - "Page resets on any filter/sort change via filterKey string comparison in useEffect"

requirements-completed: [PROV-05, PROV-06, PROV-07, PROV-08, PROV-10]

# Metrics
duration: 3min
completed: 2026-02-24
---

# Phase 3 Plan 3: Provision Filtering and Sorting Summary

**Sticky filter bar with date range presets, company autocomplete, remedy type multi-select, sort controls, and dismissible filter chips for client-side provision filtering**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-25T01:49:33Z
- **Completed:** 2026-02-25T01:52:06Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Built complete filtering system with date range presets (Last 5 years, Obama/Trump/Biden era), company name autocomplete, and remedy type multi-select
- Implemented client-side filtering using date-fns isWithinInterval for date ranges, exact match for company, and array intersection for remedy types
- Added sort controls with date/company/type options and asc/desc direction toggle
- Created dismissible filter chips with Clear all button for active filter visibility
- Integrated filter bar between disclaimer and provision cards with sticky positioning

## Task Commits

Each task was committed atomically:

1. **Task 1: Create filter bar components** - `68559cc` (feat)
2. **Task 2: Integrate filter bar into ProvisionsContent** - `1756dc4` (feat)

**Plan metadata:** pending (docs: complete plan)

## Files Created/Modified
- `src/constants/ftc.ts` - Added DATE_PRESETS (4 era-based presets) and REMEDY_TYPE_OPTIONS (all 10 RemedyType values)
- `src/components/ftc/provisions/CompanyAutocomplete.tsx` - Company name typeahead using cmdk Command + Popover with check mark for selected item
- `src/components/ftc/provisions/FilterChips.tsx` - Active filter chip display with X dismiss buttons and conditional Clear all
- `src/components/ftc/provisions/ProvisionFilterBar.tsx` - Sticky filter bar with date presets, company autocomplete, remedy type Popover+Checkbox multi-select, sort dropdown, result count
- `src/components/ftc/provisions/ProvisionsContent.tsx` - Added filter/sort state management, useMemo filtering pipeline (date/company/remedy/sort), filter callbacks, pagination on filtered results

## Decisions Made
- Date preset buttons toggle off when clicked again (clicking active preset clears the date filter rather than requiring a separate clear action)
- Sort defaults to date descending; switching to company or type sets ascending default; clicking the same sort key flips direction
- All filters (date, company, remedy) reset when switching topics to prevent empty results from stale filters (per research Pitfall 3)
- Used Popover + Checkbox list pattern for remedy type multi-select since shadcn/ui Select component only supports single selection

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All filter and sort controls are functional -- ready for Plan 04 (MiniSearch full-text search with highlighting)
- ProvisionFilterBar has a placeholder comment slot for the search input that Plan 04 will add
- ProvisionCard already accepts optional searchQuery prop for future search highlighting integration
- Filter state architecture supports extension with additional filter types

## Self-Check: PASSED

All 5 files verified present. Commits 68559cc and 1756dc4 confirmed in git log. TypeScript and Vite build pass cleanly.

---
*Phase: 03-provisions-library*
*Completed: 2026-02-24*
