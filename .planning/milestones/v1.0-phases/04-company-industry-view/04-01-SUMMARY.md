---
phase: 04-company-industry-view
plan: 01
subsystem: ui
tags: [react, shadcn, collapsible, card, industry-taxonomy, url-routing]

# Dependency graph
requires:
  - phase: 01-data-pipeline
    provides: "EnhancedFTCCaseSummary with industry_sectors field in ftc-cases.json"
  - phase: 02-tab-shell-analytics
    provides: "FTCTabShell tab navigation and data loading pattern"
provides:
  - "Industries tab in FTCTabShell navigation"
  - "FTCIndustryTab with URL-driven view routing (grid/detail/compare)"
  - "SECTOR_TAXONOMY constant with 8 sectors and subsector definitions"
  - "Sector utility functions: getSectorBySlug, getSectorSlug, getSectorLabel, classifySubsector, getTopTopics"
  - "SectorGrid responsive card layout with compare selection"
  - "SectorCard with case counts, topic badges, and collapsible subsectors"
affects: [04-02-sector-detail, 04-03-sector-compare, 04-04-company-profile]

# Tech tracking
tech-stack:
  added: []
  patterns: ["sector taxonomy constant for industry classification", "URL-driven view routing within a tab", "Collapsible subsector expansion pattern"]

key-files:
  created:
    - src/components/ftc/FTCIndustryTab.tsx
    - src/components/ftc/industry/industry-utils.ts
    - src/components/ftc/industry/SectorGrid.tsx
    - src/components/ftc/industry/SectorCard.tsx
  modified:
    - src/components/ftc/FTCTabShell.tsx

key-decisions:
  - "classifySubsector uses company_name and categories fields (not business_description which is unavailable at runtime)"
  - "Subsector display shows General for most cases -- acceptable per research, future pipeline enhancement can add business_description"
  - "Compare functionality wired with checkbox selection and sticky bottom bar; compare view itself is a placeholder for Plan 03"
  - "SectorGrid passes compare navigation to parent FTCIndustryTab via onCompare callback"

patterns-established:
  - "Industry tab URL routing: no params = grid, ?sector=slug = detail, ?compare=a,b = compare"
  - "SECTOR_TAXONOMY as single source of truth for sector/subsector definitions"
  - "SectorStats aggregation pattern: iterate cases by industry_sectors, collect topic/remedy counts"

requirements-completed: [INDY-01]

# Metrics
duration: 4min
completed: 2026-02-25
---

# Phase 4 Plan 01: Industries Tab & Sector Grid Summary

**Industries tab with 8-sector card grid featuring case counts, top enforcement topic badges, and collapsible subsector breakdowns using SECTOR_TAXONOMY**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-25T15:46:16Z
- **Completed:** 2026-02-25T15:50:22Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Industries tab added to FTCTabShell navigation between Provisions Library and Patterns
- FTCIndustryTab with URL-driven routing between sector grid, sector detail placeholder, and compare placeholder
- Sector taxonomy with 8 sectors, subsector keyword maps, and utility functions centralized in industry-utils.ts
- Responsive 3-column sector card grid with case counts, top 3 enforcement topic badges, and expandable subsector breakdown
- Checkbox-based sector selection with sticky compare bar (appears when 2+ sectors selected)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Industries tab to FTCTabShell and create FTCIndustryTab** - `a3c299c` (feat)
2. **Task 2: Create sector taxonomy, subsector classification, and sector card grid** - `cfa3a28` (feat)

## Files Created/Modified
- `src/components/ftc/FTCTabShell.tsx` - Added "industries" to tab union, VALID_TABS, TabsTrigger, and TabsContent
- `src/components/ftc/FTCIndustryTab.tsx` - Top-level industry tab with sectorStats aggregation and URL-driven view routing
- `src/components/ftc/industry/industry-utils.ts` - SECTOR_TAXONOMY (8 sectors), subsector classification, topic counting utilities
- `src/components/ftc/industry/SectorGrid.tsx` - Responsive card grid layout with sticky compare bar
- `src/components/ftc/industry/SectorCard.tsx` - Individual card with Badge, Checkbox, Collapsible subsector expansion

## Decisions Made
- classifySubsector uses company_name and categories as keyword sources since business_description is not in ftc-cases.json at runtime -- most cases classify as "General [Sector]" which is acceptable per research
- Compare functionality is wired at the UI level (checkboxes, sticky bar, URL routing) but compare view is a placeholder for Plan 03
- SectorCard uses Collapsible from radix-ui for subsector expansion, only showing the trigger when there are 2+ non-zero subsectors
- Sector stats are aggregated in FTCIndustryTab (parent) and passed down to SectorGrid/SectorCard to avoid recomputation

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- SECTOR_TAXONOMY and utility functions ready for Plan 02 (Sector Detail) and Plan 03 (Sector Compare)
- FTCIndustryTab already routes to placeholder views for detail and compare based on URL params
- SectorStats type exported from FTCIndustryTab for reuse by child components

## Self-Check: PASSED

- All 5 created/modified files exist on disk
- Commit a3c299c (Task 1) found in git log
- Commit cfa3a28 (Task 2) found in git log
- TypeScript compilation: zero errors
- Vite build: success

---
*Phase: 04-company-industry-view*
*Completed: 2026-02-25*
