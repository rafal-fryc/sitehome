---
phase: 06-remedy-reclassification
plan: 02
subsystem: data-pipeline
tags: [remedy-types, reclassification, build-provisions, enum, ftc-data]

# Dependency graph
requires:
  - phase: 06-01
    provides: RemedyType enum with Order Administration, reclassify script with --propose/--apply modes
provides:
  - 885 Other provisions reclassified into 5 named categories
  - 3 new provision shard files (consumer-notification, consumer-redress, order-administration)
  - Manifest with 13 remedy type categories
  - --write and --write-apply modes in reclassify script
affects: [provisions-tab, remedy-filter, phase-7-patterns]

# Tech tracking
tech-stack:
  added: []
  patterns: [rule-based-classification, safe-write-pattern, classification-json-config]

key-files:
  created:
    - scripts/remedy-approved-categories.json
    - public/data/provisions/rt-consumer-notification-provisions.json
    - public/data/provisions/rt-consumer-redress-provisions.json
    - public/data/provisions/rt-order-administration-provisions.json
  modified:
    - src/types/ftc.ts
    - src/constants/ftc.ts
    - scripts/build-provisions.ts
    - scripts/classify-provisions.ts
    - scripts/reclassify-remedy-other.ts
    - public/data/ftc-files/*.json (288 files)
    - public/data/provisions/*.json (29 shard files)

key-decisions:
  - "Rule-based classification (not LLM) for 885 provisions -- category field is deterministic signal for 620+ structural provisions"
  - "Consumer Notification covers disclosures, consent, opt-out, and data handling obligations to consumers"
  - "Consumer Redress covers monetary relief, refunds, credit monitoring, and asset freeze provisions"
  - "10 provisions remain as Other (1.1%) -- genuinely ambiguous or unique provisions"

patterns-established:
  - "Classification JSON config: approved_categories + classifications mapping in single file"
  - "Separate --write (summary/confirm) and --write-apply (execute) for safe multi-step workflows"

requirements-completed: [RMED-04, RMED-05, RMED-06]

# Metrics
duration: 61min
completed: 2026-02-26
---

# Phase 6 Plan 02: Apply Reclassification + Rebuild Pipeline Summary

**Rule-based reclassification of 885 Other provisions into 5 named remedy categories with rebuild, reducing Other from 31.8% to 0.4% of total provisions**

## Performance

- **Duration:** 61 min
- **Started:** 2026-02-26T22:22:54Z
- **Completed:** 2026-02-26T23:24:22Z
- **Tasks:** 5
- **Files modified:** 323 (5 code files, 288 source data files, 29 shard files, 1 config file)

## Accomplishments
- Reclassified all 885 purely-Other provisions: 664 to Order Administration, 75 to Consumer Notification, 73 to Consumer Redress, 47 to Third-Party Assessment, 16 to Recordkeeping
- Reduced Other bucket from 885 provisions (31.8%) to 10 provisions (0.4%) -- well under 5% target
- Added Consumer Notification and Consumer Redress to all 5 enum locations
- Built 3 new provision shard files and updated manifest with 13 remedy type categories
- TypeScript type check passes with no errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Finalize Enum** - `e628fd5` (feat)
2. **Task 2: Add --write Mode** - `48995ac` (feat)
3. **Task 3: Classify Provisions** - `5dbc8fb` (feat)
4. **Task 4: Write to Source Files** - `ddbc6d8` (feat)
5. **Task 5: Rebuild Shards + Verify** - `afef7fa` (feat)

## Files Created/Modified
- `src/types/ftc.ts` - Added Consumer Notification and Consumer Redress to RemedyType union
- `src/constants/ftc.ts` - Added to REMEDY_TYPE_OPTIONS array for filter dropdown
- `scripts/build-provisions.ts` - Added to inline RemedyType + TOPIC_LABELS
- `scripts/classify-provisions.ts` - Added to prompt Valid RemedyTypes string
- `scripts/reclassify-remedy-other.ts` - Added --write and --write-apply modes, updated inline RemedyType
- `scripts/remedy-approved-categories.json` - Classification config with 885 provision mappings
- `public/data/ftc-files/*.json` - 288 case files with updated remedy_types
- `public/data/provisions/*.json` - 29 shard files rebuilt with new categories

## Decisions Made
- Used rule-based classification rather than LLM: the category field (duration, acknowledgment, etc.) provides a deterministic signal for 620+ structural provisions, and title/summary keywords handle the remaining 265 enforcement provisions accurately
- Consumer Notification covers a broad range: traditional disclosures, consent requirements, opt-out mechanisms, privacy program mandates, and data handling obligations directed at consumers
- Consumer Redress covers all forms of monetary/tangible relief to consumers: refunds, restitution, disgorgement, credit monitoring, asset freeze lifting, and consumer education remedies
- 10 provisions remain as Other: genuinely ambiguous (e.g., "Preservation of All Other Provisions", "COPPA Compliance as Deemed Compliance", "Customer Service Task Force") -- acceptable at 1.1%

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created remedy-approved-categories.json before T1**
- **Found during:** Task 1
- **Issue:** Plan assumed the file existed from Plan 06-01, but it was never created (only proposed in --propose mode)
- **Fix:** Created the file with the approved_categories array as first step of T1
- **Files modified:** scripts/remedy-approved-categories.json
- **Verification:** --write mode reads it successfully
- **Committed in:** 5dbc8fb (Task 3 commit, alongside classifications)

**2. [Rule 2 - Missing Critical] Added --write-apply as separate mode from --write**
- **Found during:** Task 2
- **Issue:** Plan described adding both summary display and file writing in a single --write mode, but safety requires separating the confirmation step from the destructive write step
- **Fix:** Created --write (read-only summary/validation) and --write-apply (actual file modification) as separate modes
- **Files modified:** scripts/reclassify-remedy-other.ts
- **Verification:** --write shows summary without modifying files; --write-apply applies changes
- **Committed in:** 48995ac (Task 2 commit)

**3. [Rule 2 - Missing Critical] Force-added gitignored remedy-approved-categories.json**
- **Found during:** Task 3
- **Issue:** Plan 06-01 added remedy-approved-categories.json to .gitignore as a working file, but it's now a key artifact containing the full classification mapping
- **Fix:** Used git add -f to track the file despite .gitignore rule
- **Files modified:** scripts/remedy-approved-categories.json (tracked via -f)
- **Verification:** File appears in git log for commit 5dbc8fb
- **Committed in:** 5dbc8fb (Task 3 commit)

---

**Total deviations:** 3 auto-fixed (1 blocking, 2 missing critical)
**Impact on plan:** All fixes necessary for correct execution. No scope creep.

## Issues Encountered
None beyond the deviations documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 6 complete: all remedy reclassification work done
- Provisions tab will show new categories (Consumer Notification, Consumer Redress, Order Administration) in filter dropdown
- User should verify visually: run `npm run dev`, navigate to Provisions tab, open Remedy Type filter
- Phase 7 (Pattern Condensing) can begin independently

## Self-Check: PASSED

- All 4 created files exist on disk
- All 5 task commits found in git log
- Manifest contains 13 remedy type categories
- Other bucket: 10 provisions (0.4%) -- under 5% target
- TypeScript type check: no errors

---
*Phase: 06-remedy-reclassification*
*Completed: 2026-02-26*
