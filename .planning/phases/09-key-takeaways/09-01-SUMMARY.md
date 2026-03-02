---
phase: 09-key-takeaways
plan: 01
subsystem: data-pipeline
tags: [anthropic-sdk, llm-pipeline, build-time-generation, takeaways]

# Dependency graph
requires:
  - phase: 06-remedy-reclassification
    provides: classified case files with structured complaint data
provides:
  - generate-takeaways.ts LLM pipeline script for case summaries
  - takeaway_brief and takeaway_full fields on FTCCaseSummary type
  - build-ftc-data.ts propagation of takeaway_brief into aggregate index
affects: [09-key-takeaways]

# Tech tracking
tech-stack:
  added: []
  patterns: [sequential LLM pipeline with idempotency, post-generation validation for hallucination prevention]

key-files:
  created:
    - scripts/generate-takeaways.ts
  modified:
    - src/types/ftc.ts
    - scripts/build-ftc-data.ts
    - public/data/ftc-cases.json

key-decisions:
  - "10 representative sample cases for dry-run: Disney (COPPA), Equifax (data security), Gravy Analytics (surveillance), Assail (TSR/GLBA), NTT (edge case), BetterHelp (health), Epic Games (dark patterns), Google/YouTube (COPPA), Uber (data security), Credit Bureau Center (FCRA)"
  - "takeaway_brief stored at top level of case JSON (not inside case_info) per plan specification"
  - "temperature: 0 for deterministic output consistency across 293 cases"
  - "Post-generation validation logs warnings (not blocks) for hallucinated dollar amounts, dates, and word count"

patterns-established:
  - "LLM takeaway pipeline: same sequential file processing with idempotency as classify-provisions.ts"
  - "Anti-hallucination prompt constraints: explicit prohibitions on inventing dollar amounts, dates, statute names"

requirements-completed: [TAKE-01, TAKE-04, TAKE-05]

# Metrics
duration: 5min
completed: 2026-03-02
---

# Phase 9 Plan 01: Key Takeaways Pipeline Summary

**LLM takeaway generation script with anti-hallucination constraints, type extensions, and build pipeline propagation for takeaway_brief into ftc-cases.json**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-02T00:05:31Z
- **Completed:** 2026-03-02T00:10:34Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Created generate-takeaways.ts following classify-provisions.ts pipeline pattern with 10-case dry-run sample
- Added optional takeaway_brief and takeaway_full fields to FTCCaseSummary type (inherited by EnhancedFTCCaseSummary)
- Wired takeaway_brief propagation into build-ftc-data.ts aggregate index builder
- Prompt includes anti-hallucination constraints (TAKE-04): no invented dollar amounts, dates, or statute names

## Task Commits

Each task was committed atomically:

1. **Task 1: Create generate-takeaways.ts script with type updates** - `ec60c6b` (feat)
2. **Task 2: Propagate takeaway_brief into ftc-cases.json** - `78a8083` (feat)

## Files Created/Modified
- `scripts/generate-takeaways.ts` - LLM takeaway generation pipeline (297 lines)
- `src/types/ftc.ts` - Added optional takeaway_brief and takeaway_full to FTCCaseSummary
- `scripts/build-ftc-data.ts` - Reads takeaway_brief from classified files, includes in aggregate output
- `public/data/ftc-cases.json` - Rebuilt (takeaway_brief will appear once generate-takeaways.ts is run)

## Decisions Made
- Selected 10 diverse sample cases covering: COPPA (Disney, Google/YouTube), data security (Equifax, Uber), surveillance (Gravy Analytics), TSR/GLBA (Assail), FCRA (Credit Bureau Center), health data (BetterHelp), dark patterns (Epic Games), and edge case with no complaint data (NTT)
- Temperature set to 0 for deterministic, consistent tone across all cases
- Post-generation validation warns (does not block) on: briefs over 30 words, dollar signs not in input, 4-digit years not in input
- Takeaway fields stored at top level of case JSON (alongside case_info, complaint, order), not nested inside case_info

## Deviations from Plan

None - plan executed exactly as written for code artifacts.

## Authentication Gate

**Task 1 dry-run and Task 2 full batch:** ANTHROPIC_API_KEY environment variable is not set in the current session. The generate-takeaways.ts script requires this key to call the Claude Sonnet API.

- **What was completed:** All code artifacts (script, types, build pipeline) are committed and correct
- **What is pending:** Running `npx tsx scripts/generate-takeaways.ts --dry-run` then `npx tsx scripts/generate-takeaways.ts` with a valid API key
- **How to complete:**
  1. Set `ANTHROPIC_API_KEY` environment variable
  2. Run `npx tsx scripts/generate-takeaways.ts --dry-run` to validate 10 sample cases
  3. Run `npx tsx scripts/generate-takeaways.ts` for full batch (~293 cases, ~5-10 min)
  4. Run `npm run build:ftc-data` to propagate takeaway_brief into ftc-cases.json
- **Verification:** `node -e "const d=require('./public/data/ftc-cases.json'); console.log(d.cases.filter(c=>c.takeaway_brief).length, '/', d.cases.length);"`

## Issues Encountered
- ANTHROPIC_API_KEY not available in session environment -- SDK correctly reports "Could not resolve authentication method" on API calls. Script structure and prompts validated via dry-run output (prompts printed correctly for all 10 sample cases).

## User Setup Required

**ANTHROPIC_API_KEY must be set to complete takeaway generation.** Steps:
1. `export ANTHROPIC_API_KEY=sk-ant-...` (or set in .env)
2. `npx tsx scripts/generate-takeaways.ts --dry-run` (validate 10 samples)
3. `npx tsx scripts/generate-takeaways.ts` (full batch, ~5-10 min)
4. `npm run build:ftc-data` (rebuild aggregate index)

## Next Phase Readiness
- Pipeline code complete, ready for execution once API key is provided
- Plan 09-02 (UI display of takeaways) can proceed with code changes but takeaway data will be empty until generation runs
- build-ftc-data.ts will automatically propagate takeaway_brief once generated

## Self-Check: PASSED

- FOUND: scripts/generate-takeaways.ts (295 lines, min_lines: 120 met)
- FOUND: src/types/ftc.ts (contains takeaway_brief)
- FOUND: scripts/build-ftc-data.ts (contains takeaway_brief, 4 references)
- FOUND: public/data/ftc-cases.json (rebuilt)
- FOUND: commit ec60c6b (Task 1)
- FOUND: commit 78a8083 (Task 2)
- VERIFIED: writeJSONSafe/renameSync pattern in generate-takeaways.ts
- VERIFIED: TypeScript compilation passes (npx tsc --noEmit)

---
*Phase: 09-key-takeaways*
*Completed: 2026-03-02*
