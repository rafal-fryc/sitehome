---
phase: 12-patterns-overhaul
plan: 01
subsystem: data-pipeline
tags: [patterns, merge-config, json, build-patterns, remedy-consolidation]

# Dependency graph
requires:
  - phase: 09-pattern-detection
    provides: "build-patterns.ts pipeline with Pass 3 merge config support, pattern-merge-config.json with 15 original merge groups"
provides:
  - "7 user-directed remedy pattern merge groups applied (52 -> 36 patterns)"
  - "Consolidated categories: data-protection-program, financial-remedies, data-lifecycle-requirements, annual-certification, notice-and-affirmative-express-consent, tracking-surveillance-restrictions, biometric-data-protections"
  - "Rebuilt ftc-patterns.json with consolidated pattern data"
affects: [12-02, 12-03, patterns-ui, remedy-patterns-tab]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Super-merge pattern: expanding sub-merge source patterns into consolidated super-groups to avoid dependency ordering issues in single-pass merge processing"]

key-files:
  created: []
  modified:
    - "scripts/pattern-merge-config.json"
    - "public/data/ftc-patterns.json"

key-decisions:
  - "Replaced sub-merge groups with expanded super-merges rather than adding layered merges, avoiding dependency ordering issues in single-pass processing"
  - "Included all original sub-sources in super-merge source_patterns instead of referencing intermediate target IDs"

patterns-established:
  - "Super-merge consolidation: when merging already-merged groups, flatten all original sources into the new group rather than creating hierarchical merge dependencies"

requirements-completed: [PATN-01, PATN-03]

# Metrics
duration: 3min
completed: 2026-03-02
---

# Phase 12 Plan 01: Remedy Pattern Consolidation Summary

**7 user-directed merge groups reduce 52 remedy patterns to 36 via config-only changes to pattern-merge-config.json and rebuild of ftc-patterns.json**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-02T19:42:04Z
- **Completed:** 2026-03-02T19:45:27Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Consolidated 52 remedy patterns to 36 by applying 7 user-directed merge groups
- 3 super-merges created by expanding existing sub-merge groups (data-protection-program absorbs privacy-program + information-security-program; financial-remedies absorbs civil-penalty + monetary-relief-and-judgment + costs-and-fees; data-lifecycle-requirements absorbs data-deletion-requirements)
- 4 new simple merges added (annual-certification, notice-and-affirmative-express-consent, tracking-surveillance-restrictions, biometric-data-protections)
- No code changes to build-patterns.ts required -- config-only updates

## Task Commits

Each task was committed atomically:

1. **Task 1: Add 7 new merge groups to pattern-merge-config.json** - `3cc7ecd` (feat)
2. **Task 2: Rebuild ftc-patterns.json with consolidated categories** - `9ec0005` (feat)

## Files Created/Modified
- `scripts/pattern-merge-config.json` - Updated merge config: replaced 6 sub-merge groups with 3 super-merges + added 4 new simple merges (16 total merge groups)
- `public/data/ftc-patterns.json` - Rebuilt pattern data: 36 patterns, 2180 variants (was 52 patterns)

## Decisions Made
- **Super-merge flattening:** Rather than adding layered merge groups that reference intermediate target IDs (which would fail in single-pass processing), replaced existing sub-merge groups with expanded super-merges containing all original source patterns. This avoids needing code changes to support multi-pass merge processing.
- **Source pattern inclusion:** For super-merges, included both the original sub-sources AND the intermediate target IDs in source_patterns, ensuring all variants are captured regardless of processing order.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Restructured super-merge groups to avoid single-pass merge dependency issue**
- **Found during:** Task 1 (merge config updates)
- **Issue:** The plan specified adding new merge groups referencing existing merge target IDs (e.g., financial-remedies referencing civil-penalty). But build-patterns.ts processes all merge groups in a single pass, accumulating merged results separately from the source patternGroups array. Super-merges referencing intermediate targets would get the pre-merge variants, not the post-merge consolidated ones, causing variant loss.
- **Fix:** Instead of adding 7 new groups on top of the existing 15, replaced 6 consumed sub-merge groups (information-security-program, privacy-program, civil-penalty, monetary-relief-and-judgment, costs-and-fees, data-deletion-requirements) with 3 expanded super-merge groups that include ALL original sub-sources. Net result: 16 merge groups instead of 22, but functionally equivalent.
- **Files modified:** scripts/pattern-merge-config.json
- **Verification:** All 7 target IDs present in rebuilt output, no orphaned source patterns remain, 36 total patterns
- **Committed in:** 3cc7ecd (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential restructuring to make config work correctly with existing single-pass merge pipeline. No scope creep -- same 7 merge decisions applied, just structured differently in config.

## Issues Encountered
None -- build-patterns.ts handled the updated config without errors on first rebuild.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Consolidated pattern data ready for 12-02 (structural pattern flagging and UI separation)
- All 7 merge groups from CONTEXT.md decisions are applied and verified
- Pattern count (36) provides clean foundation for remedy patterns sub-tab

## Self-Check: PASSED

All files and commits verified:
- scripts/pattern-merge-config.json: FOUND
- public/data/ftc-patterns.json: FOUND
- 12-01-SUMMARY.md: FOUND
- Commit 3cc7ecd (Task 1): FOUND
- Commit 9ec0005 (Task 2): FOUND

---
*Phase: 12-patterns-overhaul*
*Completed: 2026-03-02*
