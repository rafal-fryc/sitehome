---
phase: 01-data-pipeline
plan: 03
subsystem: build-pipeline
tags: [typescript, build-scripts, topic-sharding, provisions, npm-scripts]

# Dependency graph
requires:
  - phase: 01-data-pipeline
    provides: TypeScript interfaces (StatutoryTopic, PracticeArea, RemedyType, ProvisionRecord, ProvisionShardFile, EnhancedFTCCaseSummary) from plan 01
provides:
  - scripts/build-provisions.ts topic-sharded provision file generator
  - Enhanced scripts/build-ftc-data.ts with classification fields on case summaries
  - npm scripts build:classify, build:provisions, build:data in package.json
affects: [01-04-PLAN, phase-2, phase-3]

# Tech tracking
tech-stack:
  added: []
  patterns: [writeJSONSafe temp-file-then-rename for safe writes, inline types in tsx scripts, topic slugification for shard filenames]

key-files:
  created: [scripts/build-provisions.ts]
  modified: [scripts/build-ftc-data.ts, package.json, public/data/ftc-cases.json]

key-decisions:
  - "build-provisions.ts uses inline types rather than importing from src/types/ftc.ts to follow the same pattern as build-ftc-data.ts (avoids path alias issues in tsx scripts)"
  - "Practice-area shards use pa- prefix in filenames (e.g., pa-data-security-provisions.json) to disambiguate from topic shards"
  - "build-ftc-data.ts reads classification tags from public/data/ftc-files/ copies (where classify script writes them) rather than from the raw FTC source directory"

patterns-established:
  - "build:data runs build:ftc-data then build:provisions in sequence — classification (build:classify) is a separate supervised step"
  - "Shard filenames use slugified topic names: lowercase, spaces and slashes replaced with dashes"
  - "All new classification fields default to empty arrays when source files are not yet classified"

requirements-completed: [PIPE-05, PIPE-07, PIPE-08]

# Metrics
duration: 4min
completed: 2026-02-24
---

# Phase 1 Plan 03: Build Pipeline Scripts Summary

**Topic-sharded provision file generator and enhanced ftc-cases.json with statutory_topics, practice_areas, industry_sectors, remedy_types, and provision_counts_by_topic fields**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-24T20:41:55Z
- **Completed:** 2026-02-24T20:45:45Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Created scripts/build-provisions.ts that reads tagged source files and produces per-topic and per-practice-area provision shard JSON files under public/data/provisions/
- Enhanced scripts/build-ftc-data.ts to emit five new classification fields (statutory_topics, practice_areas, industry_sectors, remedy_types, provision_counts_by_topic) alongside the existing categories field
- Added build:provisions and build:data npm scripts to package.json (build:classify already existed from Plan 02)
- All fields default to empty arrays/objects when source files are not yet classified, ensuring backward compatibility

## Task Commits

Each task was committed atomically:

1. **Task 1: Create scripts/build-provisions.ts** - `7ad12f5` (feat)
2. **Task 2: Enhance build-ftc-data.ts and add npm scripts** - `fd0d32c` (feat)

## Files Created/Modified
- `scripts/build-provisions.ts` - Topic-sharded provision file generator (reads tagged ftc-files/, writes to public/data/provisions/)
- `scripts/build-ftc-data.ts` - Enhanced to emit classification fields on each case summary
- `package.json` - Added build:provisions and build:data npm scripts
- `public/data/ftc-cases.json` - Re-generated with new empty classification fields

## Decisions Made
- Used inline types in build-provisions.ts (same pattern as build-ftc-data.ts) rather than importing from src/types/ftc.ts to avoid tsx path alias issues
- Practice-area shard filenames use a `pa-` prefix to disambiguate from statutory topic shards
- build-ftc-data.ts reads classification tags from the public/data/ftc-files/ copies where the classify script writes them, not from the raw source directory

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- build-provisions.ts is ready to produce real shard files once source files are classified (after running build:classify)
- build-ftc-data.ts will populate all classification fields once the classify script tags source files
- The build:data npm script chains build:ftc-data and build:provisions for a single-command build
- Plan 04 (verification/validation) can validate the output of these scripts after classification runs

## Self-Check: PASSED

- FOUND: scripts/build-provisions.ts
- FOUND: scripts/build-ftc-data.ts
- FOUND: package.json
- FOUND: public/data/ftc-cases.json
- FOUND: public/data/provisions/ directory
- FOUND: 01-03-SUMMARY.md
- FOUND: 7ad12f5 (Task 1 commit)
- FOUND: fd0d32c (Task 2 commit)

---
*Phase: 01-data-pipeline*
*Completed: 2026-02-24*
