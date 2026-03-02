---
phase: 07-pattern-condensing
plan: 02
subsystem: data-pipeline
tags: [patterns, merge, prune, sort, ftc-patterns, build-pipeline, condensing]

# Dependency graph
requires:
  - phase: 07-pattern-condensing
    plan: 01
    provides: "pattern-merge-config.json with 15 approved merge groups and 4 prune candidates"
  - phase: 05-cross-case-patterns
    provides: "ftc-patterns.json with 126 pattern groups"
provides:
  - "build-patterns.ts with Pass 3 merge/prune/sort reading pattern-merge-config.json"
  - "Condensed ftc-patterns.json with 52 patterns (down from 126)"
  - "PatternGroup.most_recent_date field for date-level sort precision"
  - "PatternList recency sort using most_recent_date"
affects: [08-provisions-panel, 09-takeaway-display]

# Tech tracking
tech-stack:
  added: []
  patterns: [config-driven merge/prune pipeline, deferred-add merge pattern to avoid self-referential ID conflicts]

key-files:
  modified:
    - scripts/build-patterns.ts
    - src/types/ftc.ts
    - src/components/ftc/patterns/PatternList.tsx
    - public/data/ftc-patterns.json

key-decisions:
  - "Deferred merged pattern insertion until after source removal to handle self-referential target_id overlap"
  - "52 final patterns from 126 (59% reduction, matching projection exactly)"
  - "most_recent_date computed from max(variants.date_issued) for date-level sort precision"

patterns-established:
  - "Deferred-add merge: build merged patterns separately, filter originals first, then append merged -- prevents ID conflicts when target_id overlaps with source_patterns"

requirements-completed: [PTRN-01, PTRN-02, PTRN-03]

# Metrics
duration: 9min
completed: 2026-02-27
---

# Phase 7 Plan 2: Apply Merge/Prune Config + Rebuild Condensed Patterns Summary

**Config-driven Pass 3 in build-patterns.ts merging 85 source patterns into 15 groups, pruning 4, and sorting by date-level precision -- 126 patterns condensed to 52**

## Performance

- **Duration:** 9 min
- **Started:** 2026-02-27T22:15:57Z
- **Completed:** 2026-02-27T22:25:43Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Added Pass 3 to build-patterns.ts that reads pattern-merge-config.json and applies 15 merge groups + 4 prune entries, producing 52 condensed patterns from 126
- Added most_recent_date field to PatternGroup type for date-level sort precision (both inline in build script and exported from src/types/ftc.ts)
- Upgraded sort from year-level to date-level (most_recent_date descending, case_count tiebreak)
- Updated PatternList.tsx recency sort to use most_recent_date when available
- Full build:data pipeline passes end-to-end with condensed output

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Pass 3 merge/prune/sort to build-patterns.ts + Add most_recent_date to PatternGroup type** - `91279c1` (feat)
2. **Task 2: Minor UI polish for condensed pattern browser** - `e2cb27e` (feat)

## Files Created/Modified
- `scripts/build-patterns.ts` - Added merge config types, config loading with passthrough fallback, Pass 3 merge/prune logic, date-level sort; reads pattern-merge-config.json
- `src/types/ftc.ts` - Added optional most_recent_date field to PatternGroup interface
- `src/components/ftc/patterns/PatternList.tsx` - Updated recency sort case to use most_recent_date with year fallback
- `public/data/ftc-patterns.json` - Rebuilt with 52 condensed patterns (down from 126), 2180 variants, date-level sorting

## Decisions Made
- **Deferred-add merge pattern:** Merged patterns are collected in a separate array and appended AFTER source patterns are removed, preventing self-referential target_id conflicts where a merge group's target_id matches one of its own source_patterns (10 of 15 groups had this overlap)
- **52 final patterns:** Matches the 07-01 projection exactly (126 - 85 sources - 4 prunes + 15 merged = 52)
- **Passthrough mode:** If pattern-merge-config.json doesn't exist, the script runs exactly as before with no merges or prunes

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed self-referential target_id causing merged patterns to be removed**
- **Found during:** Task 1 (Pass 3 merge/prune logic)
- **Issue:** 10 of 15 merge groups have a target_id that also appears in their own source_patterns list (e.g., "recordkeeping" is both the target and a source). The plan's approach of pushing merged patterns into patternGroups then filtering by toRemove would remove the newly merged patterns too, producing 42 patterns instead of 52.
- **Fix:** Collect merged patterns in a separate `mergedPatterns` array, filter originals first, then append merged patterns after filtering. This ensures merged patterns are never subject to the source-removal filter.
- **Files modified:** scripts/build-patterns.ts
- **Verification:** Build produces exactly 52 patterns with all 15 merge groups present
- **Committed in:** 91279c1 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential correctness fix for the merge logic. No scope creep.

## Issues Encountered

None beyond the auto-fixed bug above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Pattern condensing complete: 52 navigable patterns in the browser (down from 126)
- All merge groups verified present with deduplicated case counts
- Date-level sort working in both build pipeline and UI
- Full build:data pipeline passes end-to-end
- Phase 7 is complete; phases 8 (provisions panel) and 9 (takeaway display) can proceed

## Self-Check: PASSED

- [x] scripts/build-patterns.ts exists
- [x] src/types/ftc.ts exists
- [x] src/components/ftc/patterns/PatternList.tsx exists
- [x] public/data/ftc-patterns.json exists (52 patterns, 2180 variants)
- [x] 07-02-SUMMARY.md exists
- [x] Commit 91279c1 found in git log
- [x] Commit e2cb27e found in git log

---
*Phase: 07-pattern-condensing*
*Completed: 2026-02-27*
