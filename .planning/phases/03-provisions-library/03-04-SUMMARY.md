---
phase: 03-provisions-library
plan: 04
subsystem: ui
tags: [minisearch, full-text-search, highlighting, cross-topic-search, scope-toggle, debounce, url-params, react-query-useQueries]

# Dependency graph
requires:
  - phase: 03-provisions-library
    provides: ProvisionFilterBar with filter controls, ProvisionsContent with filtering pipeline, ProvisionCard with optional searchQuery prop
  - phase: 02-tab-shell-analytics
    provides: FTCTabShell with provisions tab routing, shadcn/ui components
provides:
  - useProvisionSearch hook with MiniSearch index building and scoped search function
  - useAllProvisionsForSearch hook for parallel shard loading with deduplication
  - HighlightText component for safe search term highlighting without dangerouslySetInnerHTML
  - SearchResults component for cross-topic search grouped by topic with counts
  - Search input with debounce in ProvisionFilterBar with scope toggle (This topic / All topics)
  - URL-persisted search query and scope via q and scope params
affects: [03-provisions-library, provisions-export]

# Tech tracking
tech-stack:
  added: [minisearch]
  patterns: [MiniSearch index in useMemo for reactive search, useQueries for parallel shard fetching, debounced input with local state + useEffect, composite IDs for provision deduplication, URL search params for search state persistence]

key-files:
  created:
    - src/hooks/use-provision-search.ts
    - src/components/ftc/provisions/HighlightText.tsx
    - src/components/ftc/provisions/SearchResults.tsx
  modified:
    - src/components/ftc/provisions/ProvisionFilterBar.tsx
    - src/components/ftc/provisions/ProvisionCard.tsx
    - src/components/ftc/provisions/ProvisionsContent.tsx
    - src/components/ftc/FTCProvisionsTab.tsx

key-decisions:
  - "MiniSearch indexes title (boosted 2x), summary, and verbatim_text fields with prefix and fuzzy matching"
  - "Composite ID case_id__provision_number used for deduplication across shards and search result matching"
  - "Search applied before other filters (date, company, remedy) so filters narrow search results"
  - "Cross-topic search uses useQueries to load all shards in parallel with per-topic progress indicator"
  - "Search query persisted in URL via q param for shareability; scope via scope param"

patterns-established:
  - "MiniSearch index built inside useMemo with provisions array as dependency -- rebuilds only when data changes"
  - "Debounced search input: local state for immediate feedback, 300ms debounce before triggering parent callback"
  - "Cross-topic search replaces main content area while sidebar deselects topic"
  - "HighlightText splits on escaped regex pattern per word, uses mark element for highlighting"

requirements-completed: [PROV-09, PROV-10]

# Metrics
duration: 4min
completed: 2026-02-24
---

# Phase 3 Plan 4: Full-Text Search with MiniSearch Summary

**MiniSearch full-text search with in-topic/cross-topic scope toggle, debounced input, search term highlighting, and grouped cross-topic results view**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-25T01:55:50Z
- **Completed:** 2026-02-25T01:59:22Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Integrated MiniSearch for full-text search across provision titles, summaries, and verbatim text with prefix matching and fuzzy tolerance
- Built scope toggle allowing users to search within the current topic or across all 25 topics simultaneously
- Created cross-topic SearchResults view that loads all shards in parallel, groups results by topic with counts, and shows top 5 per group
- Added search term highlighting in provision title and text using safe regex-based splitting (no dangerouslySetInnerHTML)
- Persisted search query and scope in URL parameters for shareability

## Task Commits

Each task was committed atomically:

1. **Task 1: Install MiniSearch, create search hook and highlight component** - `69c9e45` (feat)
2. **Task 2: Integrate search into filter bar, add scope toggle, wire cross-topic results** - `a5946c1` (feat)

**Plan metadata:** pending (docs: complete plan)

## Files Created/Modified
- `src/hooks/use-provision-search.ts` - MiniSearch index hook with composite IDs and scoped search; parallel shard loader with deduplication
- `src/components/ftc/provisions/HighlightText.tsx` - Safe text highlighting component splitting on escaped regex per query word
- `src/components/ftc/provisions/SearchResults.tsx` - Cross-topic search results grouped by topic with counts and top-5 preview per group
- `src/components/ftc/provisions/ProvisionFilterBar.tsx` - Added search input with debounce, scope toggle buttons, clear button
- `src/components/ftc/provisions/ProvisionCard.tsx` - Wired HighlightText for title and verbatim text when searchQuery provided
- `src/components/ftc/provisions/ProvisionsContent.tsx` - Integrated useProvisionSearch for in-topic filtering, added search chip, lifted search state
- `src/components/ftc/FTCProvisionsTab.tsx` - Added search/scope URL state management, conditional SearchResults rendering for cross-topic mode

## Decisions Made
- MiniSearch indexes title (boosted 2x), summary, and verbatim_text with prefix: true and fuzzy: 0.2 for tolerant matching
- Composite ID `case_id__provision_number` used for deduplication across shards (provisions appear in multiple topic shards)
- Search applied before date/company/remedy filters so filters further narrow search results (not the other way around)
- Cross-topic search uses React Query `useQueries` to fetch all 25 shard files in parallel with loading progress indicator
- HighlightText splits query into individual words so multi-word queries highlight each term independently
- URL persists search via `q` param and scope via `scope` param (scope defaults to "topic" so omitted from URL when topic-scoped)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Full-text search and highlighting complete -- ready for Plan 05 (provision detail view and comparison)
- Search state is URL-persisted, enabling bookmarkable and shareable search results
- Cross-topic search can be extended with additional grouping or sorting options in future
- All existing filters (date, company, remedy type, sort) work in combination with search

## Self-Check: PASSED

All 7 files verified present. Commits 69c9e45 and a5946c1 confirmed in git log. TypeScript and Vite build pass cleanly.

---
*Phase: 03-provisions-library*
*Completed: 2026-02-24*
