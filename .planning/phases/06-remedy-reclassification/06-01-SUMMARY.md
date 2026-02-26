---
phase: 06-remedy-reclassification
plan: 01
subsystem: data-pipeline
tags: [taxonomy, remedy-types, reclassification, proposal-workflow]

# Dependency graph
requires:
  - phase: 01-data-pipeline
    provides: classified source JSON files with remedy_types arrays
provides:
  - RemedyType enum with "Order Administration" in all 4 code locations
  - reclassify-remedy-other.ts script with --propose and --apply modes
  - remedy-proposal.json with 885 analyzed provisions
  - Proposed category list for user approval
affects: [06-02-apply-reclassification]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Purely-Other filter: remedy_types.length === 1 && remedy_types[0] === 'Other' (excludes mixed-tagged)"
    - "Safe JSON write pattern: serialize -> validate -> write tmp -> rename (from classify-provisions.ts)"

key-files:
  created:
    - scripts/reclassify-remedy-other.ts
  modified:
    - src/types/ftc.ts
    - src/constants/ftc.ts
    - scripts/build-provisions.ts
    - scripts/classify-provisions.ts
    - .gitignore

key-decisions:
  - "classify-provisions.ts uses import not inline type -- updated prompt string instead of adding inline union"
  - "Added TOPIC_LABELS entry for order-administration in build-provisions.ts (Rule 2 - missing critical for manifest correctness)"
  - "Proposed 4 new categories + 2 existing-category reclassifications to achieve 3.6% remaining Other"

patterns-established:
  - "Remedy reclassification workflow: --propose generates JSON for analysis, --apply consumes approved categories"
  - "Working files (remedy-proposal.json, remedy-approved-categories.json) are gitignored as intermediate state"

requirements-completed: [RMED-01, RMED-02, RMED-03]

# Metrics
duration: 7min
completed: 2026-02-26
---

# Phase 6 Plan 01: Enum Foundation + Proposal Script Summary

**Added "Order Administration" to RemedyType taxonomy across 4 code locations, created reclassify-remedy-other.ts script, analyzed 885 "Other" provisions, and proposed 4 new + 2 reclassified remedy categories achieving 3.6% residual Other**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-26T22:06:21Z
- **Completed:** 2026-02-26T22:13:18Z
- **Tasks:** 4
- **Files modified:** 6

## Accomplishments
- Updated RemedyType union/array in all 4 code locations with "Order Administration" before "Other"
- Created reclassify-remedy-other.ts script with --propose and --apply modes
- Ran --propose mode: found exactly 885 purely-Other provisions, 0 mixed-tagged
- Analyzed all 885 provisions and proposed 4 new categories + 2 existing-category reclassifications

## Task Commits

Each task was committed atomically:

1. **Task 1: Update RemedyType Enum in All 4 Locations** - `23e6952` (feat)
2. **Task 2: Add Working Files to .gitignore** - `f01617f` (chore)
3. **Task 3: Create reclassify-remedy-other.ts Script** - `caa4c01` (feat)
4. **Task 4: Run Proposal Workflow** - no commit (analysis-only task, output presented to user)

## Files Created/Modified
- `src/types/ftc.ts` - Added "Order Administration" to RemedyType union
- `src/constants/ftc.ts` - Added "Order Administration" to REMEDY_TYPE_OPTIONS array
- `scripts/build-provisions.ts` - Added "Order Administration" to inline RemedyType and TOPIC_LABELS
- `scripts/classify-provisions.ts` - Added "Order Administration" to valid RemedyTypes prompt string
- `.gitignore` - Added remedy-proposal.json and remedy-approved-categories.json
- `scripts/reclassify-remedy-other.ts` - New script with --propose and --apply modes

## Decisions Made
- classify-provisions.ts uses `import type { RemedyType }` from src/types/ftc.ts rather than an inline type union. Updated the LLM prompt string (line 181) which contains the valid RemedyType values as literal text.
- Added `"order-administration": "Order Administration"` to TOPIC_LABELS in build-provisions.ts so the manifest correctly labels the new remedy type shard (auto-fix, Rule 2).
- Proposed 4 new remedy categories (Order Administration, Consumer Notification, Consumer Redress, Comprehensive Privacy Program) plus 2 existing-category reclassifications (Third-Party Assessment, Recordkeeping) to reduce "Other" from 885 to ~32 provisions (3.6%).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added TOPIC_LABELS entry for "order-administration" in build-provisions.ts**
- **Found during:** Task 1 (RemedyType enum updates)
- **Issue:** build-provisions.ts has a TOPIC_LABELS map for manifest generation. Without a label entry for "order-administration", the manifest would display the raw slug instead of the human-readable "Order Administration".
- **Fix:** Added `"order-administration": "Order Administration"` to the TOPIC_LABELS object.
- **Files modified:** scripts/build-provisions.ts
- **Verification:** Confirmed entry present via grep
- **Committed in:** 23e6952 (Task 1 commit)

**2. [Rule 2 - Missing Critical] Updated classify-provisions.ts prompt string instead of inline type**
- **Found during:** Task 1
- **Issue:** Plan assumed classify-provisions.ts has an inline `type RemedyType` union. It actually imports the type from src/types/ftc.ts. However, it has a literal string on line 181 listing valid RemedyTypes for the LLM classification prompt. Without updating this string, the LLM would not classify provisions as "Order Administration".
- **Fix:** Added "Order Administration" to the Valid RemedyTypes prompt string.
- **Files modified:** scripts/classify-provisions.ts
- **Verification:** Confirmed via grep that "Order Administration" appears in the file
- **Committed in:** 23e6952 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 missing critical)
**Impact on plan:** Both auto-fixes necessary for manifest correctness and LLM classification accuracy. No scope creep.

## Issues Encountered
None

## Proposal Output (Task 4)

The proposed category list was presented to the user (see plan completion output). User approval is required before Plan 06-02 can proceed with --apply mode.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- User must review and approve the proposed remedy categories (presented in Task 4 output)
- After approval, Plan 06-02 will add approved categories to the enum, run --apply mode, and rebuild the pipeline
- The remedy-proposal.json file exists at scripts/remedy-proposal.json with all 885 provisions for reference

## Self-Check: PASSED

All files verified present:
- scripts/reclassify-remedy-other.ts
- src/types/ftc.ts (modified)
- src/constants/ftc.ts (modified)
- scripts/build-provisions.ts (modified)
- scripts/classify-provisions.ts (modified)
- scripts/remedy-proposal.json (generated, gitignored)
- .planning/phases/06-remedy-reclassification/06-01-SUMMARY.md

All commits verified:
- 23e6952: feat(06-01): add Order Administration to RemedyType enum
- f01617f: chore(06-01): add remedy reclassification working files to .gitignore
- caa4c01: feat(06-01): create reclassify-remedy-other.ts script

---
*Phase: 06-remedy-reclassification*
*Completed: 2026-02-26*
