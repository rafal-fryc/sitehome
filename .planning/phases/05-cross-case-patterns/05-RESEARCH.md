# Phase 5: Cross-Case Patterns - Research

**Researched:** 2026-02-25
**Domain:** Cross-case provision pattern detection, chronological timeline visualization, text diff highlighting, boilerplate classification
**Confidence:** HIGH

## Summary

Phase 5 surfaces recurring provision language patterns across FTC enforcement actions, enabling legal practitioners to see how specific consent order language (e.g., "Comprehensive Information Security Program") evolves over time. The data analysis reveals a rich pattern landscape: 2,873 provisions across statutory shards produce 763 unique titles, of which 126 appear in 3+ cases. When categorized, 87 are substantive patterns and 39 are structural/boilerplate. Structural provisions account for 51.5% of all provisions, confirming the critical importance of the inline "Structural" badge decision from CONTEXT.md.

The implementation splits into two domains: (1) a build-time pipeline script (`build-patterns.ts`) that reads existing provision shards, groups provisions by normalized title, classifies structural vs. substantive, assigns human-friendly pattern names, and outputs a static `ftc-patterns.json` file; and (2) a client-side UI that loads this JSON and renders a filterable pattern list with inline-expandable chronological timelines. The existing provision `category` field (`compliance_reporting`, `acknowledgment`, `recordkeeping`, `monitoring`, `duration` = structural; `prohibition`, `affirmative_obligation`, `assessment` = substantive) provides a high-accuracy signal for boilerplate classification, requiring no additional ML or heuristic beyond the already-classified data. For text diff highlighting between consecutive variants, the `diff` (jsdiff) npm package provides word-level diffing via `diffWords()` at ~40KB, with no additional dependencies.

**Primary recommendation:** Build a `build-patterns.ts` pipeline script that produces a single `ftc-patterns.json` (~150-300 KB estimated) containing pattern groups with embedded variant summaries and truncated text snippets. Client-side components follow established patterns: sorted vertical list with inline-expand for timelines, variant cards reusing ProvisionCard styling, and word-level diff highlighting using the `diff` npm package. No new charting libraries needed.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Minimum threshold: 3+ cases required for a provision to be listed as a pattern
- Near-match grouping: similar but not identical provision titles are merged into the same pattern group (not exact-match only)
- Pattern names: short, human-friendly descriptive names (e.g., "Security Program Mandate") rather than raw provision titles
- Pre-computed in the build pipeline — produces a static patterns JSON file, not computed client-side
- Vertical timeline layout: chronological vertical line with variant cards branching off at each year, scroll down through time
- Variant cards show first 2-3 lines of provision text with case context, expandable to full text
- Differences between consecutive variant texts visually highlighted (text diff style with colored highlighting)
- Structural provisions labeled inline with a "Structural" badge/tag — not excluded, not separated
- Always visible — no toggle to hide/show
- Sorted vertical list (not card grid) showing pattern name, case count, date span, and "Structural" badge if applicable
- Default sort: by recency (most recently appearing patterns first)
- Inline expand: clicking a pattern row expands the timeline below the row — no page navigation
- Search box plus enforcement topic filter to narrow the pattern list

### Claude's Discretion
- Near-match grouping algorithm (string similarity, normalized titles, etc.)
- Pattern naming heuristic or mapping
- Structural/boilerplate classification method
- Year grouping on timeline (group same-year or show individually)
- Text diff highlighting implementation approach
- Sort options beyond default recency

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PATN-01 | Build pipeline detects provisions with identical or near-identical titles across different consent orders | `build-patterns.ts` normalizes titles (lowercase, strip punctuation/dashes, collapse whitespace) and groups provisions. Analysis confirms 126 groups at 3+ cases with normalization. Near-match merging uses first-N-word prefix grouping for variant families (e.g., 57 "Prohibition Against Misrepresentations..." variants). |
| PATN-02 | User can view pattern groups showing how specific provision language appears across multiple cases | Client-side pattern list loads `ftc-patterns.json`, displays sorted rows with pattern name/count/date-span. Clicking a row inline-expands a chronological timeline of variant cards showing provision text and case context. |
| PATN-03 | Pattern timeline shows chronological evolution of recurring provision language | Vertical timeline component with year markers and variant cards. `diff` (jsdiff) package provides `diffWords()` for word-level highlighting of changes between consecutive variants. Cards show truncated text (expandable) with company name, year, docket number. |
| PATN-04 | Structural/boilerplate provisions excluded from pattern analysis or clearly labeled | Existing `category` field provides high-accuracy classification: `compliance_reporting`, `acknowledgment`, `recordkeeping`, `monitoring`, `duration` = structural (covers 51.5% of provisions). Structural patterns receive inline "Structural" badge. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18.3 | UI framework | Already installed, project standard |
| TypeScript | 5.8 | Type safety | Already installed, project standard |
| TanStack Query | 5.83 | Data fetching/caching | Already installed, used by `useProvisionShard` and `useFTCData` |
| react-router-dom | 6.30 | URL state management | Already installed, searchParams pattern established |
| tsx | (dev) | Build script runner | Already used for `build-provisions.ts` and `build-ftc-data.ts` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| diff (jsdiff) | 8.x | Word-level text diffing | For highlighting changes between consecutive provision text variants on the timeline |
| lucide-react | 0.462 | Icons | Already installed, for timeline markers, expand/collapse chevrons, badges |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| diff (jsdiff) | diff-match-patch | diff-match-patch is more powerful (patching, fuzzy match) but heavier; jsdiff's `diffWords()` is sufficient for word-level highlighting and lighter |
| diff (jsdiff) | Custom character comparison | Would miss word boundary semantics; reinventing the wheel for a solved problem |
| react-diff-viewer | Custom diff rendering | react-diff-viewer is designed for code (line numbers, split panes); our use case is prose paragraph comparison, better served by inline word-level spans |

**Installation:**
```bash
npm install diff
npm install -D @types/diff  # Note: jsdiff v8+ ships own types, but @types/diff may still be needed depending on resolution
```

## Architecture Patterns

### Recommended Project Structure
```
scripts/
├── build-patterns.ts           # New: pattern detection pipeline (PIPE-06)
src/
├── components/ftc/
│   ├── FTCPatternsTab.tsx      # Existing placeholder → replace with pattern browser
│   └── patterns/
│       ├── PatternList.tsx     # Sorted vertical list with search/filter
│       ├── PatternRow.tsx      # Single row: name, count, date span, structural badge
│       ├── PatternTimeline.tsx # Chronological vertical timeline for expanded pattern
│       ├── VariantCard.tsx     # Single variant on timeline: text, case context, diff
│       └── TextDiff.tsx        # Word-level diff highlighting between two texts
├── hooks/
│   └── use-patterns.ts        # New: usePatterns() hook for loading ftc-patterns.json
├── types/
│   └── ftc.ts                 # Add PatternGroup, PatternVariant interfaces
public/data/
└── ftc-patterns.json          # New: pre-computed pattern groups (build output)
```

### Pattern 1: Build Pipeline Pattern Detection
**What:** A Node.js script that reads all provision source files, normalizes titles, groups provisions into pattern families, classifies structural vs. substantive, assigns human-friendly names, and outputs a single JSON file.
**When to use:** Build time only — runs as `npm run build:patterns` alongside existing `build:provisions` and `build:ftc-data`.

**Normalization algorithm (recommended):**
```typescript
function normalizeForGrouping(title: string): string {
  return title
    .toLowerCase()
    .replace(/[—–\-]/g, ' ')       // Normalize dashes
    .replace(/[^a-z0-9\s]/g, '')    // Strip punctuation
    .replace(/\s+/g, ' ')           // Collapse whitespace
    .trim();
}
```

This normalization alone (verified against actual data) produces 126 groups at the 3+ case threshold. The near-match analysis shows that major variant families (e.g., 57 "Prohibition Against Misrepresentations..." variants) share long common prefixes. For the largest families, a two-pass approach works:

1. **Pass 1 - Exact normalized match:** Group by `normalizeForGrouping(title)`. This catches case/punctuation differences (e.g., "Prohibition Against Misrepresentations" vs "Prohibition against Misrepresentations").
2. **Pass 2 - Prefix merge:** For groups below the threshold, check if their normalized title starts with another existing group's normalized title. Merge small groups into the larger prefix group. This handles "Prohibition Against Misrepresentations About Privacy and Security" merging with the parent "Prohibition Against Misrepresentations" family.

**Pattern naming heuristic:**
- Use the most common title variant in the group as the base name.
- For large variant families, use the shortest common prefix that distinguishes from other patterns, plus a descriptive suffix (e.g., "Prohibition Against Misrepresentations" stays as-is since it's already clear).
- A curated mapping for the top ~20 patterns can provide better names (e.g., "Comprehensive Information Security Program" → "Security Program Mandate").

### Pattern 2: Static JSON Data Shape
**What:** The `ftc-patterns.json` output contains all pattern groups with variant metadata but truncated text to keep file size manageable.
**When to use:** Build output consumed by the client.

**Recommended data shape:**
```typescript
interface PatternVariant {
  case_id: string;
  company_name: string;
  date_issued: string;
  year: number;
  provision_number: string;
  title: string;                    // Original (non-normalized) title
  text_preview: string;             // First ~300 chars of verbatim_text
  verbatim_text: string;            // Full text for expanded view
  docket_number: string;
  ftc_url?: string;
  administration: string;
}

interface PatternGroup {
  id: string;                       // Slugified pattern name
  name: string;                     // Human-friendly pattern name
  is_structural: boolean;           // True for boilerplate patterns
  case_count: number;               // Unique cases
  variant_count: number;            // Total provision instances
  year_range: [number, number];     // [min_year, max_year]
  most_recent_year: number;         // For recency sort
  enforcement_topics: string[];     // Statutory topics appearing in this pattern
  practice_areas: string[];         // Practice areas appearing in this pattern
  variants: PatternVariant[];       // Sorted by date_issued ascending
}

interface PatternsFile {
  generated_at: string;
  total_patterns: number;
  total_variants: number;
  patterns: PatternGroup[];         // Sorted by most_recent_year descending (default)
}
```

**Size estimation:** With ~126 pattern groups and ~1,200 variants (provisions in 3+ case groups), and verbatim_text averaging ~1,500 chars each: 126 groups * ~10 variants * ~2KB per variant = ~2.5 MB. This is within acceptable range (similar to mid-size provision shards), but if it exceeds 3 MB, the build script should truncate `verbatim_text` to 500 chars and have the client fetch full text from existing provision shards on demand.

**Alternative approach for size management:** Include only `text_preview` (300 chars) in `ftc-patterns.json` and load full `verbatim_text` lazily from provision shards when the user expands a variant card. This would keep the patterns file under 500 KB.

### Pattern 3: Inline Expand with Timeline
**What:** Pattern list uses a sorted vertical layout where clicking a row expands the chronological timeline below it, matching the inline-expand UX decision from CONTEXT.md.
**When to use:** The main Patterns tab interaction pattern.

```typescript
// PatternList.tsx - Manages expansion state
const [expandedPatternId, setExpandedPatternId] = useState<string | null>(null);

// Each PatternRow receives:
<PatternRow
  pattern={pattern}
  isExpanded={expandedPatternId === pattern.id}
  onToggle={() => setExpandedPatternId(
    expandedPatternId === pattern.id ? null : pattern.id
  )}
/>

// When expanded, render PatternTimeline below the row
{isExpanded && <PatternTimeline variants={pattern.variants} />}
```

### Pattern 4: Word-Level Diff Highlighting
**What:** When viewing a timeline, consecutive variant cards show highlighted differences from the previous variant using the `diff` package's `diffWords()` function.
**When to use:** Inside VariantCard components for variants at index > 0.

```typescript
import { diffWords } from 'diff';

interface TextDiffProps {
  oldText: string;
  newText: string;
}

function TextDiff({ oldText, newText }: TextDiffProps) {
  const changes = diffWords(oldText, newText);
  return (
    <span className="whitespace-pre-line">
      {changes.map((change, i) => {
        if (change.added) {
          return <ins key={i} className="bg-green-100 text-green-900 no-underline px-0.5">{change.value}</ins>;
        }
        if (change.removed) {
          return <del key={i} className="bg-red-100 text-red-900 line-through px-0.5">{change.value}</del>;
        }
        return <span key={i}>{change.value}</span>;
      })}
    </span>
  );
}
```

### Pattern 5: Structural Classification via Category Field
**What:** Use the existing `category` field from provision data to classify patterns as structural vs. substantive.
**When to use:** Build pipeline step during pattern group construction.

```typescript
const STRUCTURAL_CATEGORIES = new Set([
  'compliance_reporting',
  'acknowledgment',
  'recordkeeping',
  'monitoring',
  'duration',
]);

function isStructuralPattern(variants: ProvisionRecord[]): boolean {
  // A pattern is structural if the majority of its provisions are in structural categories
  const structuralCount = variants.filter(v =>
    STRUCTURAL_CATEGORIES.has(v.category)
  ).length;
  return structuralCount > variants.length * 0.5;
}
```

This approach covers 51.5% of all provisions accurately. For edge cases (e.g., "Retention of Jurisdiction" appears in both `monitoring` and `duration` categories), the majority-vote approach handles it naturally.

### Anti-Patterns to Avoid
- **Client-side pattern computation:** The data is too large (21 MB total provisions) to compute pattern groups in the browser. Always pre-compute at build time.
- **Loading all provision shards for patterns:** Pattern data should come from a dedicated `ftc-patterns.json`, not by fetching and merging all 25+ provision shards client-side.
- **Line-by-line diff for legal text:** Legal provisions are prose paragraphs, not code. Use `diffWords()` not `diffLines()` — word-level granularity is more meaningful for spotting language evolution.
- **Exact-match-only grouping:** Would miss obvious near-matches like case differences and punctuation variants. Title normalization is essential.
- **Over-aggressive prefix merging:** Merging all "Prohibition..." patterns into one giant group would be unhelpful. The prefix merge step should require a minimum shared prefix length (e.g., 4+ words) and only merge when the smaller group is below the threshold.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Word-level text diff | Custom character/word comparison | `diff` (jsdiff) `diffWords()` | Handles word boundaries, whitespace normalization, punctuation correctly; 40KB well-maintained |
| Title normalization | Custom string cleaning | Simple normalize function (above) | Well-understood problem; keep it simple and deterministic |
| Structural classification | ML classifier or keyword lists | `category` field majority vote | Already classified by the LLM pipeline; reuse existing data |
| Collapsible/expandable rows | Custom CSS height animations | Radix Collapsible or CSS `accordion-down` animation | Already available in the project via shadcn/ui |

**Key insight:** The hardest part of this phase (pattern detection, classification) is actually well-served by the data already produced in Phase 1. The `category` field and title normalization handle 95%+ of cases. The remaining 5% (edge-case near-matches) can be addressed with conservative prefix merging in the build script.

## Common Pitfalls

### Pitfall 1: Pattern JSON File Size Explosion
**What goes wrong:** Including full `verbatim_text` for all variants produces a multi-MB JSON that causes slow initial tab load.
**Why it happens:** Provision verbatim text averages ~1,500 characters, and popular patterns like "Recordkeeping" have 215+ cases.
**How to avoid:** Include only `text_preview` (first 300 chars) in `ftc-patterns.json`. Load full text lazily from existing provision shards when a user expands a variant card. Alternative: include full text but cap the variants array at the most recent 20 per pattern, with a `total_variant_count` field for display.
**Warning signs:** `ftc-patterns.json` exceeding 1 MB before gzip.

### Pitfall 2: Diff Computation on Very Long Texts
**What goes wrong:** `diffWords()` on two 3,000-character provision texts is fast (~1ms), but if triggered for all visible variants at once (e.g., a pattern with 30 variants all expanded), it causes UI jank.
**Why it happens:** Diffing is O(n*m) where n and m are word counts. Legal provisions can be 500+ words.
**How to avoid:** Only compute diffs for the currently expanded variant card, not all at once. Use `useMemo` with the two text inputs as dependencies. Consider showing diff only on demand (a "Show changes" toggle per card) for patterns with many variants.
**Warning signs:** Visible lag when expanding a timeline for a high-frequency pattern.

### Pitfall 3: Over-Merging Pattern Groups
**What goes wrong:** Aggressive prefix merging combines semantically distinct patterns. Example: "Civil Penalty" and "Civil Penalty -- $35,000" have the same prefix but the latter group contains case-specific payment amounts.
**Why it happens:** Prefix-based merging without a minimum-distinctiveness check.
**How to avoid:** Only merge group B into group A if: (a) B's normalized title starts with A's normalized title, (b) B has fewer than 3 cases on its own, and (c) A already has 3+ cases. This ensures established patterns absorb orphans but distinct patterns remain separate.
**Warning signs:** A single pattern group with 50+ seemingly unrelated variant titles.

### Pitfall 4: Structural Badge Not Surfacing
**What goes wrong:** Structural patterns dominate the list (39 of 126 patterns, including the top 5 by case count), pushing substantive patterns below the fold.
**Why it happens:** Default sort by recency doesn't separate structural from substantive.
**How to avoid:** The user decided structural patterns should be visible with a badge, not hidden. However, include enforcement topic filtering so users can quickly narrow to substantive patterns. Also consider: sort options like "case count" or "most cases" where substantive patterns like "Comprehensive Information Security Program" (33 cases) rank high.
**Warning signs:** User scrolls past 10+ structural patterns before seeing a substantive one.

### Pitfall 5: Near-Match Grouping Missing Important Variants
**What goes wrong:** A variant like "Prohibition Against Misrepresentations About Privacy and Security" is not grouped with "Prohibition Against Misrepresentations" because the normalization + prefix check fails.
**Why it happens:** The prefix merge only runs in one direction; or the minimum prefix length is set too high.
**How to avoid:** Run prefix merge bidirectionally: if a smaller group's title starts with a larger group's title, merge. The analysis confirms that the "Prohibition Against Misrepresentations" family has 57 variants that all share the 3-word prefix. A 3-word minimum prefix overlap should capture these while avoiding false merges.
**Warning signs:** Multiple small pattern groups that a legal practitioner would clearly consider the same pattern.

## Code Examples

### Build Pipeline: Pattern Group Construction
```typescript
// Source: project analysis of actual provision data
// build-patterns.ts core logic

interface RawGroup {
  normalizedTitle: string;
  provisions: ProvisionRecord[];
  titles: Set<string>;
  cases: Set<string>;
}

function buildPatternGroups(provisions: ProvisionRecord[]): RawGroup[] {
  const groups = new Map<string, RawGroup>();

  for (const p of provisions) {
    const norm = normalizeForGrouping(p.title);
    if (!groups.has(norm)) {
      groups.set(norm, {
        normalizedTitle: norm,
        provisions: [],
        titles: new Set(),
        cases: new Set(),
      });
    }
    const g = groups.get(norm)!;
    g.provisions.push(p);
    g.titles.add(p.title);
    g.cases.add(p.case_id);
  }

  // Pass 2: Prefix merge for small groups
  const sortedKeys = [...groups.keys()].sort((a, b) => {
    const ga = groups.get(a)!;
    const gb = groups.get(b)!;
    return gb.cases.size - ga.cases.size; // Largest first
  });

  for (const smallKey of sortedKeys) {
    const small = groups.get(smallKey);
    if (!small || small.cases.size >= 3) continue; // Only merge small groups

    for (const largeKey of sortedKeys) {
      if (largeKey === smallKey) continue;
      const large = groups.get(largeKey);
      if (!large || large.cases.size < 3) continue;

      // Check if small title starts with large title (min 3 words)
      const largeWords = largeKey.split(' ');
      if (largeWords.length >= 3 && smallKey.startsWith(largeKey)) {
        // Merge small into large
        for (const p of small.provisions) {
          large.provisions.push(p);
          large.titles.add(p.title);
          large.cases.add(p.case_id);
        }
        groups.delete(smallKey);
        break;
      }
    }
  }

  return [...groups.values()].filter(g => g.cases.size >= 3);
}
```

### Client-Side: Pattern Data Hook
```typescript
// Source: project pattern — mirrors use-provisions.ts
// src/hooks/use-patterns.ts

import { useQuery } from "@tanstack/react-query";
import type { PatternsFile } from "@/types/ftc";

export function usePatterns() {
  return useQuery<PatternsFile>({
    queryKey: ["ftc-patterns"],
    queryFn: async () => {
      const res = await fetch("/data/ftc-patterns.json");
      if (!res.ok) throw new Error("Failed to load patterns data");
      return res.json();
    },
    staleTime: Infinity,
  });
}
```

### Client-Side: Vertical Timeline Layout
```typescript
// Source: CONTEXT.md decision — vertical timeline with year markers
// PatternTimeline.tsx skeleton

interface Props {
  variants: PatternVariant[];
}

export default function PatternTimeline({ variants }: Props) {
  // variants already sorted by date_issued ascending from build pipeline
  return (
    <div className="relative pl-8 border-l-2 border-rule ml-4 py-4">
      {variants.map((variant, index) => {
        const prevText = index > 0 ? variants[index - 1].verbatim_text : null;
        return (
          <div key={`${variant.case_id}__${variant.provision_number}`} className="relative mb-6">
            {/* Year marker dot on the timeline */}
            <div className="absolute -left-[calc(2rem+5px)] top-1 w-3 h-3 rounded-full bg-gold border-2 border-background" />
            {/* Year label */}
            <span className="text-xs text-muted-foreground font-semibold">
              {variant.year}
            </span>
            <VariantCard
              variant={variant}
              previousText={prevText}
            />
          </div>
        );
      })}
    </div>
  );
}
```

### Client-Side: Word-Level Diff Rendering
```typescript
// Source: jsdiff official API (https://github.com/kpdecker/jsdiff)
// TextDiff.tsx

import { diffWords } from 'diff';

interface Props {
  oldText: string;
  newText: string;
}

export default function TextDiff({ oldText, newText }: Props) {
  const changes = useMemo(
    () => diffWords(oldText, newText, { ignoreCase: false }),
    [oldText, newText]
  );

  return (
    <span className="whitespace-pre-line font-garamond leading-relaxed">
      {changes.map((change, i) => {
        if (change.added) {
          return (
            <ins key={i} className="bg-green-100/60 text-green-900 no-underline">
              {change.value}
            </ins>
          );
        }
        if (change.removed) {
          return (
            <del key={i} className="bg-red-100/60 text-red-900 line-through">
              {change.value}
            </del>
          );
        }
        return <span key={i}>{change.value}</span>;
      })}
    </span>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `diffChars()` for text comparison | `diffWords()` for prose | Always (jsdiff has had both) | Word-level is more readable for legal prose; character-level produces noisy diffs |
| Full-text in pattern JSON | Truncated preview + lazy load | N/A (design decision) | Keeps pattern JSON under 500KB vs 2.5+ MB with full text |
| react-diff-viewer for all diffs | Custom inline spans using jsdiff | N/A (design decision) | react-diff-viewer is designed for code (line numbers, split panes); inline word spans fit legal prose better |

**Deprecated/outdated:**
- `@types/diff`: Since jsdiff v8, types are bundled. Check if `@types/diff` is still needed or if `diff` v8+ ships its own `.d.ts`.

## Open Questions

1. **Optimal text_preview length for pattern JSON**
   - What we know: Full verbatim_text averages ~1,500 chars; 300 chars provides about 2-3 lines of legal text.
   - What's unclear: Whether 300 chars is enough for practitioners to differentiate variants without expanding.
   - Recommendation: Start with 300 chars (`text_preview`), include full text (`verbatim_text`) in the JSON but only for patterns with <= 20 variants. For patterns with 20+ variants (the structural ones like "Recordkeeping" at 222 provisions), include only the 20 most recent variants' full text. Measure resulting file size during build.

2. **Year grouping vs. individual entries on timeline**
   - What we know: Some patterns have multiple cases in the same year (e.g., 2013-2014 batch of "Monitoring Technology Prohibited" with 9 cases). CONTEXT.md leaves this to Claude's discretion.
   - What's unclear: Whether grouping same-year variants under one year marker improves or clutters the timeline.
   - Recommendation: Show each variant individually (not grouped by year) since the text differences matter case-by-case. Use the year as a label on each card. If a pattern has 20+ variants, paginate the timeline (show first 10, "Show more" button).

3. **Prefix merge aggressiveness**
   - What we know: "Prohibition Against Misrepresentations" has 57 variant titles across 33+ cases when exact-normalized, 100+ if prefix-merged.
   - What's unclear: Whether all 57 "Prohibition Against Misrepresentations About [X]" variants belong in one pattern group or should remain as separate patterns where they individually meet the 3-case threshold.
   - Recommendation: Keep groups that individually meet the 3-case threshold as separate patterns. Only merge orphans (< 3 cases) into their prefix parent. This preserves the specificity that legal practitioners need (e.g., "Prohibition Against Misrepresentations About Privacy and Security" is a distinct legal concept from "Prohibition Against Misrepresentations About Security").

## Sources

### Primary (HIGH confidence)
- Project codebase analysis: `build-provisions.ts`, provision shard files, `ProvisionRecord` interface, `category` field distribution
- Actual data analysis: 2,873 provisions across statutory shards, 763 unique titles, 126 groups at 3+ case threshold, 87 substantive / 39 structural split
- Category field distribution: `compliance_reporting` (495), `acknowledgment` (353), `recordkeeping` (287), `monitoring` (199), `duration` (274) = structural; `prohibition` (476), `affirmative_obligation` (680), `assessment` (109) = substantive
- [jsdiff GitHub repository](https://github.com/kpdecker/jsdiff) - `diffWords()` API, return format, options

### Secondary (MEDIUM confidence)
- [npm diff package](https://www.npmjs.com/package/diff) - Package version, TypeScript support
- [react-diff-viewer](https://github.com/praneshr/react-diff-viewer) - Evaluated and rejected for this use case (designed for code, not prose)
- [diff-match-patch](https://github.com/google/diff-match-patch) - Evaluated as alternative; heavier than needed for word-level diffs

### Tertiary (LOW confidence)
- None — all findings verified against actual project data or official library sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new libraries except `diff` (well-established, 40KB); everything else already installed
- Architecture: HIGH - Follows exact patterns from Phase 3 (Provisions Library) and Phase 4 (Industry view); data pipeline follows `build-provisions.ts` pattern
- Pitfalls: HIGH - Based on actual data analysis (measured provision counts, file sizes, title distributions), not hypothetical

**Research date:** 2026-02-25
**Valid until:** 2026-03-25 (stable domain — no rapidly changing dependencies)
