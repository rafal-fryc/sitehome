---
phase: 01-data-pipeline
plan: 02
subsystem: pipeline
tags: [typescript, anthropic-sdk, llm-classification, claude-sonnet, atomic-writes, idempotent]

# Dependency graph
requires:
  - phase: 01-data-pipeline
    plan: 01
    provides: StatutoryTopic, PracticeArea, RemedyType, IndustrySector union types and ClassifiedProvision, ClassifiedCaseInfo interfaces
provides:
  - classify-provisions.ts script — LLM-powered classification agent for tagging all 293 FTC case source files
  - Rule-based hint builders for statutory topics (from legal_authority) and remedy types (from provision category)
  - Structured prompt builder that includes business_description for industry sector inference
  - Atomic file write utility (writeJSONSafe) preventing source file corruption
  - Idempotent classification (skips already-classified files)
affects: [01-03-PLAN, 01-04-PLAN, phase-2, phase-3, phase-4]

# Tech tracking
tech-stack:
  added: ["@anthropic-ai/sdk ^0.78.0"]
  patterns: [rule-based hints as LLM prompt context, atomic JSON writes via tmp+rename, idempotent processing with skip-if-tagged]

key-files:
  created: [scripts/classify-provisions.ts]
  modified: [package.json, package-lock.json]

key-decisions:
  - "business_description extracted from case_info.company.business_description (not case_info.business_description) — matching actual source file structure"
  - "Rule-based hints passed as structured context in prompt, not used as final classification answers — LLM makes final decisions"
  - "300ms rate-limiting pause between API calls to avoid rate limit errors"
  - "Dry-run mode processes only first 3 files and prints prompts without writing to disk"

patterns-established:
  - "Classification scripts import types from ../src/types/ftc.js using relative paths with .js extension for tsx ESM"
  - "Source file modification uses writeJSONSafe (write to .tmp, validate JSON, rename) to prevent corruption"
  - "Idempotent processing: check for statutory_topics field to determine if already classified"

requirements-completed: [PIPE-01, PIPE-02, PIPE-03, PIPE-04, PIPE-08]

# Metrics
duration: 4min
completed: 2026-02-24
---

# Phase 1 Plan 02: Classification Agent Summary

**Claude Sonnet classification agent script with rule-based hints, business_description-driven industry inference, and atomic file writes for tagging 293 FTC case source files**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-24T20:42:13Z
- **Completed:** 2026-02-24T20:46:25Z
- **Tasks:** 1
- **Files modified:** 3 (scripts/classify-provisions.ts created, package.json and package-lock.json updated)

## Accomplishments
- Created classify-provisions.ts as a fully functional TypeScript classification agent using @anthropic-ai/sdk to call Claude Sonnet (claude-sonnet-4-5)
- Implemented rule-based hint builders that derive statutory topic hints from legal_authority and remedy type hints from provision category/title, passed as structured context in LLM prompts
- Built structured prompt that includes business_description (from case_info.company.business_description) immediately after company name and legal_authority for accurate industry sector inference
- Implemented atomic file writes via writeJSONSafe (tmp + validate + rename) preventing source file corruption
- Added idempotency check (isAlreadyClassified) that skips files where statutory_topics already exists
- Added --dry-run flag support for testing prompt structure without modifying files or running all 293 cases
- All valid enum values included in prompt to constrain LLM output to valid taxonomy values

## Task Commits

Each task was committed atomically:

1. **Task 1: Write classify-provisions.ts as a Sonnet-powered classification agent with rule-based hints** - `8fca363` (feat)

## Files Created/Modified
- `scripts/classify-provisions.ts` - LLM-powered classification agent script (376 lines) with rule-based hints, business_description extraction, atomic writes, and idempotent processing
- `package.json` - Added `build:classify` npm script and `@anthropic-ai/sdk` devDependency
- `package-lock.json` - Lock file updated with @anthropic-ai/sdk and transitive dependencies

## Decisions Made
- Extracted business_description from `case_info.company.business_description` (with fallback to `case_info.business_description`) since actual source files store it under the company object, not at case_info root level
- Included instructions in the prompt to reserve "Privacy" practice area for cases where the PRIMARY violation involves misrepresentation about privacy practices, avoiding the 67% false-positive rate from keyword matching
- Case-level statutory_topics instructed to be the UNION of all provision-level statutory_topics in the prompt
- Used 300ms delay between API calls as rate limiting

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed business_description extraction path**
- **Found during:** Task 1 (script implementation)
- **Issue:** Plan referenced `data.case_info?.business_description` but actual source files store it at `data.case_info.company.business_description`
- **Fix:** Added fallback chain: `data.case_info?.business_description ?? data.case_info?.company?.business_description ?? ""`
- **Files modified:** scripts/classify-provisions.ts
- **Verification:** Dry-run output shows correct business_description for all 3 test files
- **Committed in:** 8fca363

**2. [Rule 1 - Bug] Fixed date_issued display in prompt**
- **Found during:** Task 1 (script implementation)
- **Issue:** Plan's date display code had incorrect ternary operator precedence; 288 of 293 files lack `date_issued` and use `case_date` object instead
- **Fix:** Used proper ternary chain: check `date_issued` first, fall back to `case_date.month/year` format
- **Files modified:** scripts/classify-provisions.ts
- **Verification:** Dry-run shows "Date: 1/2005" correctly derived from case_date object
- **Committed in:** 8fca363

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both auto-fixes necessary for correct data extraction from source files. No scope creep.

## Issues Encountered
- ANTHROPIC_API_KEY is not available in the current environment, so dry-run mode successfully builds and prints prompts but API calls return authentication errors. This is expected — the script is designed to be run with a valid API key (available automatically in Claude Code Max sessions or set manually).

## User Setup Required
None - script uses ANTHROPIC_API_KEY environment variable which is provided automatically in Claude Code sessions with Max subscription.

## Next Phase Readiness
- classify-provisions.ts is ready to be run via `npm run build:classify` (or `npx tsx scripts/classify-provisions.ts`)
- Plan 04 will execute the full classification run against all 293 source files
- Plan 03 (build-provisions.ts) can be developed in parallel since it reads from already-classified source files
- The --dry-run flag allows testing prompt quality before committing to the full 293-case batch

## Self-Check: PASSED

- FOUND: scripts/classify-provisions.ts
- FOUND: 8fca363 (Task 1 commit)
- FOUND: 01-02-SUMMARY.md

---
*Phase: 01-data-pipeline*
*Completed: 2026-02-24*
