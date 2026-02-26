# Technology Stack

**Project:** FTC Enforcement Provisions Library (v1.1 — Data Quality & Case Insights)
**Researched:** 2026-02-26
**Research Mode:** Stack dimension — additive only, covers NEW capabilities for this milestone

---

## Scope of This Document

This document covers only what is **new or changed** for v1.1. The existing foundation is fixed by project constraint and not re-evaluated:

| Layer | Existing (fixed) |
|-------|-----------------|
| Framework | React 18.3 + Vite 5.4 + TypeScript 5.8 |
| Styling | Tailwind CSS 3.4 + shadcn/ui + Tailwind Typography |
| Charts | Recharts 2.15 |
| Data fetching | TanStack Query 5.83 |
| Routing | React Router DOM 6.30 |
| Search | MiniSearch 7.2 |
| Diff | diff 8.0 (jsdiff) |
| Autocomplete | cmdk 1.1 |
| Claude API | @anthropic-ai/sdk 0.78 (devDependency, build pipeline only) |
| Runtime model | `claude-sonnet-4-5` (existing classify-provisions.ts) |

---

## New Capability: Key Takeaways Generation

**What is needed:** A new build-time script (`scripts/build-takeaways.ts`) that reads each source file under `public/data/ftc-files/`, sends a prompt to Claude, and writes 3-5 bullet takeaways back into the data model.

### Claude API — No Version Change

**Existing @anthropic-ai/sdk 0.78 is sufficient.** The pattern is identical to `classify-provisions.ts`:

```typescript
import Anthropic from "@anthropic-ai/sdk";
const anthropic = new Anthropic(); // reads ANTHROPIC_API_KEY from env

const response = await anthropic.messages.create({
  model: "claude-sonnet-4-5",   // keep consistent with existing scripts
  max_tokens: 512,               // takeaways are short; 512 is ample
  messages: [{ role: "user", content: prompt }],
});
```

**Why claude-sonnet-4-5 not claude-opus-4-6:**
- Takeaway generation is a short summarization task, not complex reasoning
- Sonnet is 5-10x cheaper per token than Opus; 285 cases × ~1,000 tokens = ~285K tokens
- The existing classify-provisions.ts uses Sonnet and produces high-quality classifications — same model is appropriate here
- **Confidence: HIGH** — based on direct reading of the existing script and cost-quality tradeoff analysis

**No new library needed.** The sdk is already in devDependencies at `^0.78.0`.

### Data Model Change: Add `key_takeaways` to Source JSON

The takeaways are written into each `public/data/ftc-files/*.json` source file (same pattern as classification), then surfaced in the aggregated `ftc-cases.json` by `build-ftc-data.ts`.

```typescript
// Addition to EnhancedFTCCaseSummary in src/types/ftc.ts
export interface EnhancedFTCCaseSummary extends FTCCaseSummary {
  statutory_topics: StatutoryTopic[];
  practice_areas: PracticeArea[];
  industry_sectors: IndustrySector[];
  remedy_types: RemedyType[];
  provision_counts_by_topic: Record<string, number>;
  key_takeaways?: string[];  // NEW — 3-5 bullets, e.g. "Collected precise location data without consent"
}
```

**Skip-if-present pattern:** Check for `case_info.key_takeaways` in source file before calling API. Same pattern as `isAlreadyClassified()` in classify-provisions.ts. This makes the script idempotent and cheap to re-run.

**Confidence: HIGH** — direct derivation from existing codebase pattern.

---

## New Capability: Remedy Reclassification

**What is needed:** A new build-time script (`scripts/reclassify-remedies.ts`) that reads provisions with `remedy_types: ["Other"]`, prompts Claude to propose a more specific category, and optionally introduces new `RemedyType` values or remaps to existing ones.

### Claude API — Same SDK, Structured Output Pattern

Use the same `@anthropic-ai/sdk` 0.78. The reclassification prompt should request JSON output with a `proposed_remedy_type` field, following the same JSON extraction pattern as the existing classify-provisions.ts (parse the assistant message text for a JSON block).

**Scale consideration:** 282 of 285 cases have "Other" in their remedy_types. However, each case has multiple provisions — only some provisions are tagged "Other". The actual count at provision level is what matters. Claude should be given provision title + verbatim_text and propose the most specific RemedyType that fits.

**Decision point: Extend the RemedyType enum or remap to existing values?**
Claude should be prompted to choose from the existing `RemedyType` union first, and only propose a new label if none fit. New labels should be reviewed by a human before committing — the script should output a proposal file (`public/data/remedy-proposals.json`) for review, not write directly into source files.

**Two-phase approach:**
1. Script generates `remedy-proposals.json` (proposal only, no writes)
2. Human reviews, approves, runs a second `apply-remedy-proposals.ts` pass that writes approved changes into source files

**Confidence: HIGH** — this pattern (generate-then-review) is safer than direct write for a taxonomy-changing operation, and follows the project's general philosophy of deterministic, reviewable pipeline outputs.

---

## New Capability: Pattern Condensing / Merging

**What is needed:** Improvements to `scripts/build-patterns.ts` to merge semantically similar patterns (not just exact-normalized title matches), prune low-value patterns, and resort by most recent example.

### Text Similarity for Pattern Merging — No New Library

The existing `build-patterns.ts` already implements:
- Pass 1: Exact normalized title matching (lowercase, dashes to spaces, strip punctuation)
- Pass 2: Prefix merge for orphan groups (< 3 cases merged into parent if title starts with parent title)

The 126 current patterns include redundancy that survives both passes because the titles are not prefix-related. For example, "Annual Privacy Notice" and "Annual Notice to Consumers" should merge but won't under current logic.

**Recommended approach: Bigram/token Jaccard similarity at build time.**

Implement in `build-patterns.ts` as a ~30-line utility function — no library dependency:

```typescript
function tokenJaccard(a: string, b: string): number {
  const tokensA = new Set(a.split(" "));
  const tokensB = new Set(b.split(" "));
  const intersection = [...tokensA].filter(x => tokensB.has(x)).length;
  const union = new Set([...tokensA, ...tokensB]).size;
  return union === 0 ? 0 : intersection / union;
}
```

**Merge threshold:** Jaccard >= 0.6 AND both groups have fewer than 10 cases each. Groups with 10+ cases are large enough to stand alone. This avoids false merges on high-frequency terms like "recordkeeping" appearing in different provision types.

**Why not a library:**
- O(n²) pairwise comparisons over 126 groups is 7,875 operations — runs in < 100ms at build time
- The utility function is 10 lines; adding a dependency for 10 lines adds maintenance risk
- `fastest-levenshtein` and `string-similarity` are designed for character-level edit distance, not the token-overlap metric that fits title comparison better

**Pruning criteria (no library):**
- Remove patterns with exactly 1 variant (no cross-case repetition — these are one-offs, not patterns)
- Consider removing patterns where all variants come from the same 2-year window (potentially era-specific artifacts, not durable patterns)

**Resorting:** Already implemented — `most_recent_year` descending is the existing default sort in build-patterns.ts. Confirm this is exposed in UI sort options. No pipeline change needed.

**Confidence: HIGH** — based on direct reading of the existing algorithm and the dataset size.

---

## New Capability: Case Provisions Panel (Modal / Sheet)

**What is needed:** In the Industry tab, clicking "View provisions" on a `CaseCard` should open a side panel showing that case's provisions, rather than navigating to the Provisions tab.

### Component: shadcn/ui Sheet — Already Installed

`Sheet` (`src/components/ui/sheet.tsx`) is already in the codebase. It wraps `@radix-ui/react-dialog` with a slide-in animation from the right (`side="right"`). The Sheet component provides:
- `SheetContent` — full-height right-side panel with backdrop
- `SheetHeader`, `SheetTitle`, `SheetDescription` — accessible header
- `SheetClose` — built-in close button

**No new library needed.** The case provisions panel is a straightforward Sheet implementation:

```typescript
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription
} from "@/components/ui/sheet";

// Usage in FTCIndustryTab.tsx:
const [panelCase, setPanelCase] = useState<EnhancedFTCCaseSummary | null>(null);

// The existing handleViewProvisions currently navigates to provisions tab.
// Change it to: setPanelCase(caseData)

<Sheet open={panelCase !== null} onOpenChange={(open) => !open && setPanelCase(null)}>
  <SheetContent side="right" className="w-[600px] sm:max-w-[600px] overflow-y-auto">
    <SheetHeader>
      <SheetTitle className="font-garamond">{panelCase?.company_name}</SheetTitle>
      <SheetDescription>{panelCase?.year} · {panelCase?.docket_number}</SheetDescription>
    </SheetHeader>
    {panelCase && <CaseProvisionsPanel caseId={panelCase.id} />}
  </SheetContent>
</Sheet>
```

### Data Fetching: Load Provision Shards Lazily

Provisions are already stored in topic-sharded files under `public/data/provisions/[topic]-provisions.json`. For a given `case_id`, provisions can be found by:

1. Reading the manifest (`public/data/provisions/manifest.json`) to get all shard filenames
2. Fetching each shard and filtering for matching `case_id`

**Better approach:** Add a `case-index.json` at build time — a map from `case_id` → array of `{ shard, provision_number }`. This allows the panel to fetch only the shards containing that case's provisions (typically 1-3 shards per case) rather than all 15 shards.

```typescript
// public/data/provisions/case-index.json structure
{
  "08.97_bruno_s": ["fcra-provisions.json"],
  "09.97_aldi": ["fcra-provisions.json"],
  ...
}
```

**Why not a flat all-provisions.json:** The full flat file would be ~8-10 MB uncompressed. Per-case lazy loading (1-3 shards, ~200-800 KB each) is faster to first paint and more respectful of bandwidth. TanStack Query caches shard responses — revisiting another case in the same topic is instant.

**TanStack Query pattern** (already used in the app):

```typescript
const { data: provisions } = useQuery({
  queryKey: ["case-provisions", caseId],
  queryFn: () => fetchProvisionsByCaseId(caseId, caseIndex, shardCache),
  staleTime: Infinity,   // Static data — never refetch
  enabled: !!caseId,
});
```

**Confidence: HIGH** — Sheet component is already installed and styled. TanStack Query is already the fetching pattern. The case-index build step is a straightforward additive pipeline change.

---

## Summary: What Changes and What Doesn't

### New Scripts (build pipeline only)

| Script | Purpose | New Deps |
|--------|---------|----------|
| `scripts/build-takeaways.ts` | Claude-generated key takeaways per case | None (reuses @anthropic-ai/sdk) |
| `scripts/reclassify-remedies.ts` | Claude-proposed remedy reclassification | None |
| `scripts/apply-remedy-proposals.ts` | Apply reviewed remedy proposals to source files | None |

### Modified Scripts

| Script | Change | Impact |
|--------|--------|--------|
| `scripts/build-patterns.ts` | Add token Jaccard merge pass + pruning | Reduces pattern count from 126 |
| `scripts/build-ftc-data.ts` | Read `key_takeaways` from source files, pass through to ftc-cases.json | Additive field |
| `scripts/build-provisions.ts` | Emit `case-index.json` mapping case_id → shards | New output file |

### New UI Components

| Component | Implements | Uses |
|-----------|-----------|------|
| `src/components/ftc/industry/CaseProvisionsPanel.tsx` | Provisions list for a single case | Existing ProvisionRecord types |
| Sheet wrapper in `FTCIndustryTab.tsx` | Opens CaseProvisionsPanel | Existing Sheet component |

### Type Changes

| Type | Change |
|------|--------|
| `EnhancedFTCCaseSummary` | Add optional `key_takeaways?: string[]` |
| No new types for remedies | Proposed remedy labels go through review before becoming `RemedyType` values |

---

## What NOT to Add

| Rejected Addition | Reason |
|------------------|--------|
| string-similarity / fastest-levenshtein | Token Jaccard in 10 lines is better suited to title comparison than character edit distance; no dependency warranted at 126 patterns |
| natural / compromise (NLP) | Still overkill for a closed taxonomy. Claude handles nuanced reclassification better than NLP libraries for this legal domain |
| New UI modal library (react-modal, headlessui) | Sheet is already installed; adding a second modal system creates visual inconsistency |
| All-provisions flat JSON file | Too large for initial load; case-indexed shard loading is faster and already achievable with TanStack Query |
| Separate Claude Opus model for takeaways | Sonnet is sufficient for summarization; Opus cost penalty (~10x) not justified for 285 cases |
| Pattern clustering library (ml-kmeans, kmeans-ts) | 126 groups at build time: O(n²) Jaccard is 7,875 comparisons, completes in < 100ms, no ML infrastructure needed |
| React Virtual / TanStack Virtual | Case provisions panel will show at most ~20-30 provisions per case — no virtualization needed |

---

## Installation

No new production or dev dependencies are required for this milestone.

All four features (takeaways, remedy reclassification, pattern condensing, case provisions panel) are implementable with:
- Existing @anthropic-ai/sdk 0.78 (build-time scripts)
- Existing shadcn/ui Sheet component (UI panel)
- Existing TanStack Query (data fetching)
- Inline TypeScript utilities (text similarity)

```bash
# No npm install commands needed
```

---

## Confidence Assessment

| Decision | Level | Basis |
|----------|-------|-------|
| @anthropic-ai/sdk 0.78 sufficient (no upgrade) | HIGH | Installed version confirmed; messages.create API is stable |
| claude-sonnet-4-5 for takeaways | HIGH | Direct reading of classify-provisions.ts; same task complexity |
| Two-phase remedy reclassification (propose then apply) | HIGH | Architectural reasoning from project's deterministic pipeline philosophy |
| Token Jaccard for pattern merging (no library) | HIGH | Dataset size (126 groups) makes inline implementation trivially fast |
| Sheet component for case provisions panel | HIGH | Component confirmed installed and working in src/components/ui/sheet.tsx |
| Case-index build artifact (not flat all-provisions.json) | HIGH | Shard architecture already exists; case-index is the natural complement |
| No new npm dependencies | HIGH | Derived from direct codebase inspection |

---

## Sources

- Existing codebase (direct inspection):
  - `scripts/classify-provisions.ts` — Claude API invocation pattern, model choice, rate-limiting approach
  - `scripts/build-patterns.ts` — Full algorithm: exact-normalized pass, prefix-merge pass, filter threshold, sort
  - `scripts/build-ftc-data.ts` — Pipeline structure, output file format
  - `src/components/ui/sheet.tsx` — Confirmed installed, @radix-ui/react-dialog based
  - `src/components/ftc/FTCIndustryTab.tsx` — Current handleViewProvisions behavior (navigates to provisions tab)
  - `src/components/ftc/industry/CaseCard.tsx` — onViewProvisions callback already wired
  - `src/types/ftc.ts` — Full data model including EnhancedFTCCaseSummary, ProvisionRecord, RemedyType enum
  - `package.json` — All installed versions confirmed
- Data files (direct inspection):
  - `public/data/ftc-cases.json` — 285 cases, field schema confirmed
  - `public/data/ftc-patterns.json` — 126 patterns, current algorithm output confirmed
