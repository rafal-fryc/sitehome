---
phase: 05-cross-case-patterns
verified: 2026-02-25T22:30:00Z
status: human_needed
score: 7/7 must-haves verified
re_verification: false
human_verification:
  - test: "Navigate to http://localhost:5173/FTCAnalytics?tab=patterns and confirm pattern list renders with 126 named patterns, case counts, and date spans"
    expected: "Pattern list shows 126 patterns with names like 'Recordkeeping', 'Prohibition Against Misrepresentations', etc., each with case count and year range"
    why_human: "Cannot programmatically confirm React rendering — component wiring is verified but visual render requires a browser"
  - test: "Click a substantive pattern (e.g., one containing 'Security' or 'Misrepresentations') and confirm the timeline expands with chronological variant cards"
    expected: "Vertical timeline expands below the row with year labels, gold dots, and VariantCard for each variant in ascending date order"
    why_human: "Collapsible expand/collapse behavior and visual timeline layout require browser verification"
  - test: "Click 'Show changes' on a non-first variant card and confirm word-level diff highlighting appears"
    expected: "Green-highlighted insertions and red strikethrough deletions between consecutive provision texts using jsdiff diffWords()"
    why_human: "Diff rendering quality and correctness of text comparison require visual inspection"
  - test: "Verify structural patterns show a 'Structural' badge inline (not hidden or separated)"
    expected: "Patterns like 'Recordkeeping', 'Compliance Monitoring', 'Duration of Order' display a 'Structural' badge next to the name"
    why_human: "Badge rendering and visual presentation require browser confirmation"
  - test: "Type 'security' in the search box and confirm pattern list filters in real time"
    expected: "Pattern list narrows to patterns with 'security' in the name; 'N patterns found' count updates"
    why_human: "Real-time filtering behavior requires interactive browser test"
  - test: "Select a topic from the topic filter dropdown and confirm list narrows correctly"
    expected: "Only patterns whose enforcement_topics array includes the selected topic are shown"
    why_human: "Dropdown populate and filter interaction requires browser verification"
  - test: "Confirm the Patterns tab maintains the law-library aesthetic (EB Garamond font, cream/gold/dark-green palette)"
    expected: "Text uses font-garamond class, timeline dots are gold, variant cards have cream background"
    why_human: "Visual aesthetic quality cannot be verified programmatically"
---

# Phase 5: Cross-Case Patterns Verification Report

**Phase Goal:** A legal practitioner can see how specific recurring provision language (e.g., "comprehensive security program") has evolved across enforcement eras, with a chronological timeline of variants
**Verified:** 2026-02-25T22:30:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Running `npm run build:patterns` produces a valid `ftc-patterns.json` in `public/data/` | VERIFIED | `public/data/ftc-patterns.json` exists (4.0 MB, 4,117,618 bytes), `package.json` has `build:patterns` script at line 15 |
| 2 | Each pattern group has 3+ unique cases and a human-friendly pattern name | VERIFIED | Node.js validation: `all patterns have 3+ cases: true`, `min case_count: 3`, names are LLM-sourced human-readable titles like "Prohibition Against Misrepresentations" |
| 3 | Structural patterns are correctly classified with `is_structural: true` based on provision category field | VERIFIED | 43 structural / 83 substantive (34.1%/65.9%); `build-patterns.ts` lines 244–247 implement >50% category majority vote against STRUCTURAL_CATEGORIES set |
| 4 | Near-identical provision titles are merged into the same pattern group via normalization + prefix merge | VERIFIED | `build-patterns.ts` implements two-pass algorithm: Pass 1 (exact normalized grouping, 740 groups), Pass 2 (prefix merge absorbing 84 orphan groups); logic at lines 180–213 |
| 5 | Pattern variants are sorted chronologically (ascending by `date_issued`) | VERIFIED | `build-patterns.ts` line 263: `sortedProvisions.sort((a, b) => a.date_issued.localeCompare(b.date_issued))`. Data spot-check: "Recordkeeping" first 5 dates: `["1997-08-15","1997-09-15","1999-08-15","1999-08-15","1999-08-15"]` — ascending confirmed |
| 6 | User can see a sortable/searchable list of named pattern groups with case count, date span, and Structural badge; clicking a row expands a chronological vertical timeline with variant cards | VERIFIED (code) | `PatternList.tsx` (150 lines): search, topic filter, 3-way sort with `useMemo`. `PatternRow.tsx` (57 lines): Radix Collapsible with `PatternTimeline`. `PatternTimeline.tsx` (53 lines): vertical timeline with year labels and pagination. `FTCPatternsTab.tsx` wired in `FTCTabShell.tsx` at line 79. Needs human visual confirmation. |
| 7 | Consecutive variants show word-level diff highlighting via "Show changes" toggle | VERIFIED (code) | `TextDiff.tsx` (39 lines): uses `diffWords()` from `diff@8.0.3` with `useMemo` optimization; `VariantCard.tsx` (95 lines) has `canDiff` guard and "Show changes" / "Show full text" toggle at lines 81–91. Needs human visual confirmation. |

**Score:** 7/7 truths verified (5 automated + 2 requiring human visual confirmation)

### Required Artifacts

| Artifact | Min Lines | Actual Lines | Status | Details |
|----------|-----------|--------------|--------|---------|
| `scripts/build-patterns.ts` | 150 | 366 | VERIFIED | Full pipeline: normalize, deduplicate, prefix merge, structural classify, sort, output |
| `src/types/ftc.ts` | — | — | VERIFIED | `PatternVariant` at line 172, `PatternGroup` at line 186, `PatternsFile` at line 199 — all exported |
| `public/data/ftc-patterns.json` | — | 4.0 MB | VERIFIED | `total_patterns: 126`, `total_variants: 2194`, all patterns have `enforcement_topics` and `practice_areas` populated |
| `package.json` | — | — | VERIFIED | `build:patterns` at line 15, `build:data` chain updated at line 16 |
| `src/hooks/use-patterns.ts` | — | 14 | VERIFIED | React Query hook with `staleTime: Infinity`, fetches `/data/ftc-patterns.json` |
| `src/components/ftc/FTCPatternsTab.tsx` | 15 | 43 | VERIFIED | Replaces placeholder; calls `usePatterns()`, handles loading/error states, renders `PatternList` |
| `src/components/ftc/patterns/PatternList.tsx` | 60 | 150 | VERIFIED | Search (substring), topic filter (Select), three sort options; `useMemo` for filtered+sorted list |
| `src/components/ftc/patterns/PatternRow.tsx` | 25 | 57 | VERIFIED | Radix Collapsible, `PatternTimeline` rendered in `CollapsibleContent`, Structural badge |
| `src/components/ftc/patterns/PatternTimeline.tsx` | 30 | 53 | VERIFIED | Vertical timeline with gold dots, year labels, 15-variant pagination, renders `VariantCard` |
| `src/components/ftc/patterns/VariantCard.tsx` | 40 | 95 | VERIFIED | Case context header (company, year, docket, FTC.gov link), text/diff toggle, expand/collapse |
| `src/components/ftc/patterns/TextDiff.tsx` | 20 | 39 | VERIFIED | `diffWords()` with `useMemo`, green `<ins>` for additions, red `<del>` for removals |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `scripts/build-patterns.ts` | `public/data/provisions/*-provisions.json` | `readdirSync` + `readFileSync` on statutory shards | WIRED | Lines 117–146: reads `PROVISIONS_DIR`, filters `*-provisions.json` excluding `pa-*` and `rt-*`, parses each shard |
| `scripts/build-patterns.ts` | `public/data/ftc-patterns.json` | `writeJSONSafe()` output | WIRED | Line 323: `writeJSONSafe(OUT_FILE, output)` where `OUT_FILE = path.resolve("public/data/ftc-patterns.json")` |
| `src/types/ftc.ts` | `PatternsFile` interface | Exported and consumed by UI hook | WIRED | `export interface PatternsFile` at line 199; imported in `use-patterns.ts` as `import type { PatternsFile } from "@/types/ftc"` |
| `src/hooks/use-patterns.ts` | `/data/ftc-patterns.json` | `fetch` with React Query | WIRED | Line 8: `fetch("/data/ftc-patterns.json")` |
| `src/components/ftc/FTCPatternsTab.tsx` | `src/hooks/use-patterns.ts` | `usePatterns()` hook call | WIRED | Line 1 import, line 5 call: `const { data, isLoading, isError } = usePatterns()` |
| `src/components/ftc/patterns/PatternList.tsx` | `src/components/ftc/patterns/PatternRow.tsx` | Renders rows with expansion state | WIRED | Line 12 import, lines 130–141 render with `isExpanded` and `onToggle` props |
| `src/components/ftc/patterns/PatternRow.tsx` | `src/components/ftc/patterns/PatternTimeline.tsx` | Renders timeline when expanded | WIRED | Line 9 import, line 52: `<PatternTimeline variants={pattern.variants} />` inside `CollapsibleContent` |
| `src/components/ftc/patterns/PatternTimeline.tsx` | `src/components/ftc/patterns/VariantCard.tsx` | Renders variant cards along timeline | WIRED | Line 3 import, line 35: `<VariantCard variant={variant} previousText={prevText} isFirst={index === 0} />` |
| `src/components/ftc/patterns/VariantCard.tsx` | `src/components/ftc/patterns/TextDiff.tsx` | Renders diff when variant has previous text | WIRED | Line 4 import, lines 54–58: `<TextDiff oldText={previousText!} newText={variant.verbatim_text} />` guarded by `showDiff && canDiff` |
| `src/components/ftc/FTCPatternsTab.tsx` | `src/components/ftc/FTCTabShell.tsx` | Tab shell renders patterns tab at `?tab=patterns` | WIRED | `FTCTabShell.tsx` line 7 import, line 79: `<FTCPatternsTab />` inside `TabsContent value="patterns"` |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| PATN-01 | 05-01 | Build pipeline detects provisions with identical or near-identical titles across different consent orders | SATISFIED | `build-patterns.ts` two-pass algorithm (normalize + prefix merge) produces 126 pattern groups from 2783 provisions; all groups have 3+ cases; `ftc-patterns.json` confirmed valid with correct structure |
| PATN-02 | 05-02 | User can view pattern groups showing how specific provision language appears across multiple cases | SATISFIED (needs human) | `PatternList` renders filterable/sortable groups; `PatternRow` inline-expands timeline; code verified substantive and wired; visual render needs human confirmation |
| PATN-03 | 05-02 | Pattern timeline shows chronological evolution of recurring provision language | SATISFIED (needs human) | `PatternTimeline` renders `VariantCard` array in ascending `date_issued` order; `TextDiff` provides word-level diff via jsdiff `diffWords()`; code verified complete; visual render needs human confirmation |
| PATN-04 | 05-01 | Structural/boilerplate provisions are excluded from pattern analysis or clearly labeled | SATISFIED | 43 of 126 patterns have `is_structural: true`; `PatternRow` renders "Structural" `Badge` conditionally at lines 29–35; structural patterns remain visible in list (not hidden) |

No orphaned requirements: all four PATN-01 through PATN-04 requirements are claimed and satisfied by plans 05-01 and 05-02.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/components/ftc/patterns/PatternList.tsx` | 85, 98 | `placeholder=` attribute | Info | HTML input placeholder attributes — not code stubs, fully legitimate |

No blockers or warnings found. No TODO/FIXME/XXX comments, no empty return statements, no stub handlers.

### Human Verification Required

#### 1. Pattern List Renders with 126 Patterns

**Test:** Start `npm run dev`, navigate to `http://localhost:5173/FTCAnalytics?tab=patterns`
**Expected:** Pattern list shows 126 recurring patterns with human-readable names, case counts, and year spans; header subtitle reads "126 recurring patterns across 2,194 provision variants"
**Why human:** React render chain is code-verified (FTCTabShell -> FTCPatternsTab -> PatternList -> PatternRow) but visual output requires a browser

#### 2. Inline Timeline Expansion

**Test:** Click on a pattern row (e.g., "Prohibition Against Misrepresentations")
**Expected:** Vertical timeline expands below the row with year labels, gold circular dots on a vertical line, and chronological variant cards showing company name, year, and docket number
**Why human:** Radix Collapsible animation and vertical timeline visual layout require browser confirmation

#### 3. Word-Level Diff Highlighting

**Test:** Expand a substantive pattern with 2+ variants, then click "Show changes" on a non-first variant card
**Expected:** Green-highlighted insertions (`<ins>`) and red strikethrough removals (`<del>`) showing the specific word changes between consecutive provision texts
**Why human:** Diff computation correctness and visual presentation require human judgment

#### 4. Structural Badge Visibility

**Test:** Scroll through the pattern list and identify patterns with "Structural" badge
**Expected:** Patterns like "Recordkeeping" (215 cases), "Compliance Monitoring", and "Duration of Order" show a gray "Structural" badge inline next to the name — not hidden or separated into a different section
**Why human:** Badge visual appearance requires browser confirmation

#### 5. Search and Filter Interactivity

**Test:** (a) Type "security" in the search input; (b) select a topic from the topic dropdown; (c) change sort to "Most Cases"
**Expected:** (a) List filters to patterns containing "security"; (b) list narrows to matching topic; (c) patterns reorder by case_count descending with Recordkeeping (215 cases) at top
**Why human:** Real-time interactivity requires browser testing

#### 6. Law-Library Aesthetic

**Test:** Observe the visual styling of the Patterns tab
**Expected:** EB Garamond font for provision text and pattern names; cream/gold/dark-green palette consistent with other tabs; timeline dots in gold; variant cards with cream background
**Why human:** Visual aesthetic quality cannot be verified programmatically

### Summary

Phase 5 goal achievement is verified at the code level. All 7 observable truths are satisfied:

- The build pipeline (`build-patterns.ts`, 366 lines) correctly reads statutory provision shards, normalizes titles, performs prefix merge, classifies structural patterns, and outputs `ftc-patterns.json` with 126 patterns and 2,194 variants
- All data quality checks pass: 126 total patterns, all with 3+ cases, 43 structural (34.1%), all with `enforcement_topics` and `practice_areas` populated, variants sorted chronologically
- The complete UI component chain is implemented and wired: `usePatterns` hook -> `FTCPatternsTab` -> `PatternList` -> `PatternRow` (Radix Collapsible) -> `PatternTimeline` -> `VariantCard` -> `TextDiff`
- All four PATN requirements are satisfied: PATN-01 (pattern detection) and PATN-04 (structural classification) at build time; PATN-02 (pattern groups) and PATN-03 (chronological timeline) in the UI
- All four git commits (aa32657, 10c9d2f, d358896, 2e3dd9e) confirmed in git history
- No stub implementations, no TODO/FIXME comments, no empty handlers found

The 7 human verification items are visual and interactive quality checks — the underlying code is fully substantive. Phase goal achievement is blocked only on user visual confirmation.

---

_Verified: 2026-02-25T22:30:00Z_
_Verifier: Claude (gsd-verifier)_
