---
phase: 12-patterns-overhaul
plan: 02
subsystem: data-pipeline
tags: [patterns, behavioral, extraction, categorization, json]

# Dependency graph
requires:
  - phase: 12-patterns-overhaul
    plan: 01
    provides: "Consolidated remedy patterns (52 -> 36)"
provides:
  - "13 behavioral pattern categories extracted from 285 case takeaway_brief texts"
  - "ftc-behavioral-patterns.json with 284 categorized cases"
  - "BehavioralPattern/BehavioralCase/BehavioralPatternsFile types in ftc.ts"
affects: [12-03, behavioral-patterns-tab]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Keyword-based categorization with human-in-the-loop review"]

key-files:
  created:
    - "scripts/extract-behavioral-patterns.ts"
    - "scripts/behavioral-categories-review.json"
    - "public/data/ftc-behavioral-patterns.json"
  modified:
    - "src/types/ftc.ts"

key-decisions:
  - "Absorbed 41 privacy-related cases from 'Deceptive Marketing Claims' into expanded 'False Security & Privacy Claims' category (84 -> 125 cases)"
  - "Narrowed marketing category to 'Deceptive Product & Service Claims' (96 -> 18 truly marketing cases)"
  - "Keyword matching approach for categorization with user review checkpoint"

patterns-established:
  - "Two-pass extraction: propose categories via keyword matching, user reviews, then finalize with full metadata"

requirements-completed: [PATN-02]

# Metrics
duration: ~15min
completed: 2026-03-02
---

# Phase 12 Plan 02: Behavioral Pattern Extraction Summary

**13 behavioral categories extracted from 285 case takeaway texts, with user-reviewed category refinements producing ftc-behavioral-patterns.json**

## Performance

- **Duration:** ~15 min (including user review)
- **Started:** 2026-03-02T19:46:00Z
- **Completed:** 2026-03-02T20:01:00Z
- **Tasks:** 3 (1 auto, 1 checkpoint, 1 auto)
- **Files created:** 3
- **Files modified:** 1

## Accomplishments
- Extracted 13 behavioral pattern categories from 285 case takeaway_brief texts
- 284 of 285 cases categorized (1 uncategorized: Facebook legal brief with no violation findings)
- User-reviewed categories with significant refinement: merged overlapping marketing/privacy categories
- Added BehavioralPattern, BehavioralCase, BehavioralPatternsFile types to ftc.ts
- Each pattern includes full case metadata: takeaway_brief, year, statutory_topics, date ranges

## Task Commits

Each task was committed atomically:

1. **Task 1: Define behavioral pattern types and create extraction script** - `ea7195d` (feat)
2. **Task 2: User reviews behavioral categories** - checkpoint (user approved with edits)
3. **Task 3: Finalize behavioral patterns JSON** - `6f5c150` (feat)

## Files Created/Modified
- `scripts/extract-behavioral-patterns.ts` - Two-mode extraction script (--propose and --finalize)
- `scripts/behavioral-categories-review.json` - User-reviewed categories with refinements applied
- `public/data/ftc-behavioral-patterns.json` - Finalized behavioral patterns data (307.8 KB, 13 patterns, 284 cases)
- `src/types/ftc.ts` - Added BehavioralPattern, BehavioralCase, BehavioralPatternsFile interfaces

## Category Summary

| # | Category | Cases | Year Range |
|---|----------|-------|------------|
| 1 | False Security & Privacy Claims | 125 | 1999-2025 |
| 2 | Inadequate Data Security | 59 | 2002-2025 |
| 3 | Children's Privacy Violations | 42 | 1999-2025 |
| 4 | Credit Reporting Violations | 40 | 1997-2026 |
| 5 | Unauthorized Data Collection | 36 | 1999-2025 |
| 6 | Surveillance & Tracking | 35 | 2010-2025 |
| 7 | Unauthorized Data Sharing | 27 | 2003-2026 |
| 8 | Deceptive Product & Service Claims | 18 | 2002-2025 |
| 9 | Unfair Billing Practices | 13 | 2005-2024 |
| 10 | Identity Theft Facilitation | 10 | 2002-2020 |
| 11 | Dark Patterns & Deceptive Design | 9 | 2002-2024 |
| 12 | Algorithmic Harm | 5 | 2015-2025 |
| 13 | Illegal Telemarketing | 2 | 2005-2020 |

## Decisions Made
- **Category consolidation:** User identified that 81% of "Deceptive Marketing Claims" cases were really about false security/privacy claims (keywords like "falsely claimed encryption", "falsely claimed HIPAA compliance"). Absorbed 41 privacy-related cases into expanded "False Security & Privacy Claims" (125 total). Narrowed marketing to 18 truly product/service cases renamed "Deceptive Product & Service Claims".

## Deviations from Plan

### User-directed Changes

**1. [User-directed] Merged overlapping marketing/privacy categories**
- **Found during:** Task 2 (user review checkpoint)
- **Issue:** "Deceptive Marketing Claims" (96 cases) had massive overlap with "Privacy Policy Deception" (84 cases) — 37 cases in both, plus 41 marketing-only cases that were really about false security/privacy claims
- **Fix:** Absorbed privacy-related cases into expanded "False Security & Privacy Claims", narrowed marketing to "Deceptive Product & Service Claims"
- **Impact:** Better category accuracy — categories now reflect what the business actually did wrong

---

**Total deviations:** 1 user-directed
**Impact on plan:** Improved category quality. No scope change — still 13 categories, still covers all 284 categorizable cases.

## Issues Encountered
None.

## User Setup Required
None.

## Next Phase Readiness
- Behavioral patterns data ready for 12-03 (Patterns tab UI overhaul)
- 13 categories with full case metadata available at public/data/ftc-behavioral-patterns.json
- Types defined in src/types/ftc.ts for component consumption

## Self-Check: PASSED

All files and commits verified:
- scripts/extract-behavioral-patterns.ts: FOUND
- scripts/behavioral-categories-review.json: FOUND
- public/data/ftc-behavioral-patterns.json: FOUND
- src/types/ftc.ts: FOUND
- Commit ea7195d (Task 1): FOUND
- Commit 6f5c150 (Task 3): FOUND

---
*Phase: 12-patterns-overhaul*
*Completed: 2026-03-02*
