---
phase: 05-cross-case-patterns
plan: 02
subsystem: ui
tags: [react, patterns, timeline, diff, jsdiff, collapsible, radix, tanstack-query]

# Dependency graph
requires:
  - phase: 05-cross-case-patterns
    provides: "ftc-patterns.json with 126 pattern groups, PatternVariant/PatternGroup/PatternsFile types"
  - phase: 02-tab-shell-analytics
    provides: "FTCTabShell with patterns tab routing, shadcn/ui Select, Input, Badge, Collapsible components"
provides:
  - "usePatterns() React Query hook for loading ftc-patterns.json"
  - "FTCPatternsTab replacing placeholder with full pattern browser"
  - "PatternList with search, topic filter, and sort controls"
  - "PatternRow with inline-expand via Radix Collapsible and structural badge"
  - "PatternTimeline vertical chronological layout with year markers and pagination"
  - "VariantCard with case context header, expand/collapse, and diff toggle"
  - "TextDiff word-level diff highlighting using jsdiff diffWords()"
affects: [05-cross-case-patterns]

# Tech tracking
tech-stack:
  added: ["diff (jsdiff) v8.0.3"]
  patterns: ["word-level diff highlighting via diffWords() with useMemo", "Radix Collapsible for inline-expand pattern rows", "vertical timeline with absolute-positioned dots and border-l line"]

key-files:
  created:
    - src/hooks/use-patterns.ts
    - src/components/ftc/patterns/TextDiff.tsx
    - src/components/ftc/patterns/VariantCard.tsx
    - src/components/ftc/patterns/PatternTimeline.tsx
    - src/components/ftc/patterns/PatternRow.tsx
    - src/components/ftc/patterns/PatternList.tsx
  modified:
    - src/components/ftc/FTCPatternsTab.tsx
    - package.json
    - package-lock.json

key-decisions:
  - "diff v8.0.3 ships own types -- @types/diff not needed"
  - "VariantCard defaults to text_preview with on-demand full text and diff toggle -- avoids performance issues with many expanded variants"
  - "PatternTimeline paginates at 15 variants with 'Show all N variants' button for large patterns"
  - "PatternRow uses Radix Collapsible for smooth expand/collapse animation"
  - "Only one pattern expanded at a time (single expandedPatternId state) to keep UI focused"

patterns-established:
  - "usePatterns hook mirrors useProvisionsManifest pattern: fetch + staleTime Infinity"
  - "Inline expand via Radix Collapsible + parent-managed expansion state"
  - "TextDiff uses useMemo to cache diffWords() result per text pair"

requirements-completed: [PATN-02, PATN-03]

# Metrics
duration: 3min
completed: 2026-02-25
---

# Phase 5 Plan 02: Pattern Browser UI Summary

**Filterable pattern list with inline-expandable chronological timelines, variant cards with word-level diff highlighting, and structural badges using jsdiff diffWords()**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-25T21:54:52Z
- **Completed:** 2026-02-25T21:57:36Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Built complete Patterns tab UI replacing the "Coming Soon" placeholder with a full pattern browser
- PatternList provides search (substring match), topic filter (Select dropdown), and three sort options (Most Recent, Most Cases, Alphabetical)
- PatternRow displays pattern name, structural badge, case count, and date span with Radix Collapsible for inline timeline expansion
- PatternTimeline renders vertical chronological layout with gold dots, year labels, and paginated display for patterns with 15+ variants
- VariantCard shows case context (company, year, docket, FTC.gov link) with expand/collapse for full text and on-demand diff toggle
- TextDiff renders word-level diff highlighting using jsdiff diffWords() with green (additions) and red strikethrough (removals) styling

## Task Commits

Each task was committed atomically:

1. **Task 1: Install diff package, create usePatterns hook, TextDiff, and VariantCard** - `d358896` (feat)
2. **Task 2: Create PatternTimeline, PatternRow, PatternList, and wire FTCPatternsTab** - `2e3dd9e` (feat)

## Files Created/Modified
- `src/hooks/use-patterns.ts` - React Query hook fetching ftc-patterns.json with staleTime: Infinity
- `src/components/ftc/patterns/TextDiff.tsx` - Word-level diff highlighting using diffWords() with useMemo optimization
- `src/components/ftc/patterns/VariantCard.tsx` - Variant card with case context header, expand/collapse, and diff toggle
- `src/components/ftc/patterns/PatternTimeline.tsx` - Vertical chronological timeline with year labels, dots, and 15-variant pagination
- `src/components/ftc/patterns/PatternRow.tsx` - Pattern row with Radix Collapsible inline expansion and structural badge
- `src/components/ftc/patterns/PatternList.tsx` - Pattern browser with search, topic filter, sort controls, and expansion state management
- `src/components/ftc/FTCPatternsTab.tsx` - Replaced placeholder with full pattern browser using usePatterns() hook
- `package.json` - Added diff v8.0.3 dependency
- `package-lock.json` - Updated lockfile

## Decisions Made
- diff v8.0.3 ships its own TypeScript types -- @types/diff is not needed
- VariantCard defaults to showing text_preview (not full text or diff) to avoid performance issues when many cards are visible
- Diff is computed on-demand via "Show changes" toggle per card, not pre-computed for all variants
- PatternTimeline paginates at 15 variants to keep initial expand fast for high-frequency patterns like Recordkeeping (216 variants)
- Single expanded pattern at a time (controlled by PatternList) to keep UI focused and reduce DOM size

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Pattern browser is fully functional with all CONTEXT.md decisions honored
- Ready for Plan 03 (final verification and polish)
- PATN-02 and PATN-03 requirements satisfied: users can view pattern groups and see chronological timeline evolution with diff highlighting

## Self-Check: PASSED

- All 7 key files verified present on disk
- Both task commits (d358896, 2e3dd9e) verified in git log

---
*Phase: 05-cross-case-patterns*
*Completed: 2026-02-25*
