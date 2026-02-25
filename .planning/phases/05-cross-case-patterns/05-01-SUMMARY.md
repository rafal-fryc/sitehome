---
phase: 05-cross-case-patterns
plan: 01
subsystem: data-pipeline
tags: [pattern-detection, normalization, structural-classification, build-script, typescript]

# Dependency graph
requires:
  - phase: 01-data-pipeline
    provides: "Provision shard files with category field and classification tags"
provides:
  - "build-patterns.ts pipeline script producing ftc-patterns.json"
  - "PatternVariant, PatternGroup, PatternsFile TypeScript interfaces"
  - "Pre-computed 126 pattern groups with structural/substantive classification"
  - "build:patterns npm script integrated into build:data chain"
affects: [05-cross-case-patterns]

# Tech tracking
tech-stack:
  added: []
  patterns: ["title normalization + prefix merge for near-match grouping", "structural classification via category field majority vote", "text_preview truncation with verbatim_text capping at 30 most recent variants"]

key-files:
  created:
    - scripts/build-patterns.ts
    - public/data/ftc-patterns.json
  modified:
    - src/types/ftc.ts
    - package.json

key-decisions:
  - "Statutory shards only (no pa-* or rt-*) as input to avoid double-counting provisions"
  - "Prefix merge requires smallKey.startsWith(largeKey + ' ') with 3-word minimum prefix -- avoids over-merging"
  - "Groups that independently meet 3-case threshold remain separate -- preserves specificity for practitioners"
  - "Verbatim text included for 30 most recent variants per pattern; older variants get text_preview only"
  - "Pattern name is most common original title variant (not curated) -- already human-readable from LLM classification"

patterns-established:
  - "Pattern detection pipeline: normalize -> group -> prefix merge -> filter -> classify -> output"
  - "Composite deduplication key: case_id__provision_number"

requirements-completed: [PATN-01, PATN-04]

# Metrics
duration: 3min
completed: 2026-02-25
---

# Phase 5 Plan 01: Pattern Detection Pipeline Summary

**Build-time pipeline detecting 126 cross-case provision patterns (43 structural, 83 substantive) from 2783 provisions via title normalization, prefix merge, and category-based structural classification**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-25T21:47:56Z
- **Completed:** 2026-02-25T21:51:10Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Created build-patterns.ts pipeline that reads 7 statutory provision shards, deduplicates 2783 provisions, and groups them into 126 pattern families
- Two-pass grouping: exact normalized matching produces 740 groups, then prefix merge absorbs 84 orphan groups into parents
- Structural classification via category field majority vote (43 structural/34.1%, 83 substantive/65.9%)
- All patterns have enforcement_topics and practice_areas populated; variants sorted chronologically

## Task Commits

Each task was committed atomically:

1. **Task 1: Add TypeScript interfaces and create build-patterns.ts pipeline** - `aa32657` (feat)
2. **Task 2: Run pipeline and validate output quality** - `10c9d2f` (chore)

## Files Created/Modified
- `scripts/build-patterns.ts` - Pattern detection build pipeline (reads provision shards, normalizes titles, groups, classifies, outputs JSON)
- `src/types/ftc.ts` - Added PatternVariant, PatternGroup, PatternsFile interfaces
- `package.json` - Added build:patterns script, updated build:data chain
- `public/data/ftc-patterns.json` - Pre-computed pattern groups (126 patterns, 2194 variants, 4.0 MB)

## Decisions Made
- Statutory shards only used as input (not pa-* or rt-*) to avoid double-counting provisions that appear in multiple shard types
- Prefix merge only absorbs groups below the 3-case threshold into larger parents -- groups independently meeting 3+ cases remain separate to preserve specificity
- Pattern name derived from most common original title variant (no curated name mapping needed -- LLM-classified titles are already human-readable)
- Verbatim text capped at 30 most recent variants per pattern group to manage file size; older variants retain 300-char text_preview
- Output file is 4.0 MB (above the 3MB estimate from research) but acceptable -- text_preview truncation is active

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- ftc-patterns.json ready for consumption by UI components in Plan 02 (pattern browser) and Plan 03 (timeline visualization)
- TypeScript interfaces exported from src/types/ftc.ts for use in hooks and components
- PATN-01 and PATN-04 requirements satisfied at build time; PATN-02 and PATN-03 remain for UI implementation

## Self-Check: PASSED

- All 4 key files verified present on disk
- Both task commits (aa32657, 10c9d2f) verified in git log

---
*Phase: 05-cross-case-patterns*
*Completed: 2026-02-25*
