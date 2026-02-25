---
phase: 03-provisions-library
plan: 01
subsystem: data-pipeline
tags: [build-script, provisions, verbatim-text, violation-type, remedy-type, manifest, json-shards]

# Dependency graph
requires:
  - phase: 01-data-pipeline
    provides: Classified source files with statutory_topics, practice_areas, remedy_types, and requirements[].quoted_text
provides:
  - Provision shard files with verbatim_text and violation_type fields
  - 10 remedy-type shard files (rt-* prefix) for remedy-type browsing
  - manifest.json with provision counts, shard filenames, labels, and categories for all 25 topics
  - Extended ProvisionRecord and ProvisionsManifest TypeScript types
affects: [03-provisions-library, provisions-sidebar, provisions-content, provisions-search]

# Tech tracking
tech-stack:
  added: []
  patterns: [remedy-type shard generation with rt- prefix, manifest.json for sidebar metadata]

key-files:
  created:
    - public/data/provisions/manifest.json
    - public/data/provisions/rt-monetary-penalty-provisions.json
    - public/data/provisions/rt-data-deletion-provisions.json
    - public/data/provisions/rt-comprehensive-security-program-provisions.json
    - public/data/provisions/rt-third-party-assessment-provisions.json
    - public/data/provisions/rt-algorithmic-destruction-provisions.json
    - public/data/provisions/rt-biometric-ban-provisions.json
    - public/data/provisions/rt-compliance-monitoring-provisions.json
    - public/data/provisions/rt-recordkeeping-provisions.json
    - public/data/provisions/rt-prohibition-provisions.json
    - public/data/provisions/rt-other-provisions.json
  modified:
    - scripts/build-provisions.ts
    - src/types/ftc.ts
    - public/data/provisions/ (all 15 existing shard files regenerated with new fields)

key-decisions:
  - "verbatim_text concatenated from requirements[].quoted_text joined by double newline -- preserves full order language per provision"
  - "violation_type sourced from case_info.violation_type (per-case, not per-provision) -- minimal size overhead, 100% coverage"
  - "Remedy-type shards use rt- prefix (matching pa- prefix pattern for practice areas) to disambiguate from statutory topic shards"
  - "manifest.json includes human-readable labels, shard filenames, counts, and category classification for all 25 topics"

patterns-established:
  - "rt-{slug}-provisions.json naming convention for remedy-type shard files"
  - "manifest.json as lightweight metadata file for sidebar counts without loading full shard data"

requirements-completed: [PROV-02, PROV-03, PROV-04]

# Metrics
duration: 3min
completed: 2026-02-24
---

# Phase 3 Plan 1: Provision Pipeline Enhancement Summary

**Build pipeline extended with verbatim order text, violation types, 10 remedy-type shards, and manifest.json for 25-topic provisions library**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-25T01:37:47Z
- **Completed:** 2026-02-25T01:40:58Z
- **Tasks:** 2
- **Files modified:** 28

## Accomplishments
- Extended ProvisionRecord with verbatim_text (99.6% coverage) and violation_type (100% coverage) fields
- Generated 10 new remedy-type shard files covering all remedy categories (3 to 885 provisions each)
- Produced manifest.json with counts, labels, and categories for all 25 topics (7 statutory + 8 practice area + 10 remedy type)
- Added ProvisionsManifest and ManifestTopic TypeScript types for downstream UI consumption
- All 2,783 provisions from 293 cases processed successfully

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend ProvisionRecord type and update build pipeline** - `60f2ade` (feat)
2. **Task 2: Run build pipeline and verify output quality** - verification-only task, no code changes

**Plan metadata:** pending (docs: complete plan)

## Files Created/Modified
- `src/types/ftc.ts` - Added verbatim_text and violation_type to ProvisionRecord; added ManifestTopic and ProvisionsManifest interfaces
- `scripts/build-provisions.ts` - Added verbatim text extraction, violation type propagation, remedy-type shard generation, manifest.json generation
- `public/data/provisions/manifest.json` - New: topic metadata with counts, shard filenames, labels, categories for all 25 topics
- `public/data/provisions/rt-*-provisions.json` - New: 10 remedy-type shard files
- `public/data/provisions/*-provisions.json` - Updated: all 15 existing shard files regenerated with verbatim_text and violation_type fields

## Decisions Made
- verbatim_text is the concatenation of all requirements[].quoted_text for each provision, joined by double newline separator -- this preserves the full order language as required by PROV-02
- violation_type sourced from case_info.violation_type (a per-case field, not per-provision) and propagated to every provision record -- adds minimal size overhead (~15 chars per record)
- Remedy-type shards follow the existing prefix convention: rt- for remedy type (matching pa- for practice area, bare slug for statutory)
- manifest.json kept small (~4.3 KB) with just counts and metadata -- no provision data, fetched once on tab mount
- TOPIC_LABELS map provides human-readable labels for all slugs in the manifest

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 25 shard files ready for lazy loading via React Query hooks
- manifest.json ready to drive sidebar topic list with counts and labels
- ProvisionRecord type ready for ProvisionCard component (verbatim_text as primary content, violation_type in header)
- ProvisionsManifest type ready for useProvisionsManifest hook

## Self-Check: PASSED

All files verified present. Commit 60f2ade confirmed in git log.

---
*Phase: 03-provisions-library*
*Completed: 2026-02-24*
