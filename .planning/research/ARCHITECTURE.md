# Architecture Patterns

**Domain:** FTC enforcement provisions library — v1.1 Data Quality & Case Insights milestone
**Researched:** 2026-02-26
**Confidence:** HIGH — all findings grounded in direct codebase inspection

---

## Context: What Already Exists

This is a subsequent milestone on a shipped product. The v1.0 architecture is stable and must not be disrupted:

- **4-tab SPA**: FTCTabShell routes between Analytics, Provisions Library, Industries, Patterns tabs via `?tab=` URL params
- **Build pipeline**: `scripts/build-ftc-data.ts` → `scripts/classify-provisions.ts` → `scripts/build-provisions.ts` → `scripts/build-patterns.ts`, run as `npm run build:data`
- **Source files**: `public/data/ftc-files/{id}.json` — 293 classified case JSON files; each has `case_info`, `complaint`, `order`, `metadata`
- **Static artifacts**: `public/data/ftc-cases.json` (case summaries), `public/data/provisions/*.json` (25 topic-sharded provision files), `public/data/ftc-patterns.json` (126 pattern groups, 4.0 MB)
- **Data access**: Three React Query hooks (`useFTCData`, `useProvisionsManifest`/`useProvisionShard`, `usePatterns`), all `staleTime: Infinity`
- **UI**: shadcn/ui + Tailwind + Recharts; law-library aesthetic (EB Garamond, cream/gold/dark-green)
- **Existing handler stub**: `handleViewProvisions` in `FTCIndustryTab.tsx` currently navigates away to the Provisions tab — it is the exact hook point for the case provisions panel feature

The four v1.1 features divide cleanly into **two pipeline features** (key takeaways, remedy reclassification) and **two UI features** (pattern condensing, case provisions panel). The pattern condensing straddles both layers.

---

## The Four Features: Integration Points

### Feature 1: Key Takeaways

**What:** Claude-generated summaries per enforcement action — what the business did wrong. Short form on case cards, long form in a case detail view.

**Pipeline integration:**

The natural home for takeaway generation is a new build script `scripts/build-takeaways.ts`, following the existing pattern of one script per concern. The script reads each `public/data/ftc-files/{id}.json` source file (which already contains `complaint.factual_background`, `complaint.counts[].title`, `case_info.violation_type`, `case_info.legal_authority`), invokes Claude, and writes the takeaway back into a new field on `case_info` in the source file — the same write-back pattern used by `classify-provisions.ts`.

After the takeaway script runs, `build-ftc-data.ts` is re-run to rebuild `ftc-cases.json`. The takeaway text needs to propagate to the case summary artifact so the UI can read it from the existing `useFTCData` hook without a new file or hook.

**Data schema change — `EnhancedFTCCaseSummary` in `ftc-cases.json`:**

```typescript
// Existing interface in src/types/ftc.ts — add one field
interface EnhancedFTCCaseSummary {
  // ... all existing fields unchanged ...
  key_takeaway?: string;  // NEW: 1-3 sentence summary, undefined if not yet generated
}
```

The source file (`ftc-files/{id}.json`) gains `case_info.key_takeaway: string` written by the build script. `build-ftc-data.ts` already reads `classifiedData?.case_info.*` fields and maps them to case summaries — adding `key_takeaway` is a one-line addition in `processFile()`.

**UI integration:**

`CaseCard.tsx` in `src/components/ftc/industry/` renders case cards in `SectorDetail`. Add a takeaway line below the provision count. `EnhancedFTCCaseSummary` is already available as the `caseData` prop — no prop drilling change needed.

For case detail view: `SectorDetail` currently shows `SectorPatternCharts` + `CaseCardList`. The full takeaway text belongs in the expanded state of `CaseCard` or a modal — to be decided in roadmap planning. The short form (first sentence or 150 chars) goes on the card inline.

**New components needed:** None required. Extend `CaseCard.tsx` in place.

**Modified components:** `CaseCard.tsx` (render takeaway field), `build-ftc-data.ts` (read and propagate `key_takeaway` from source files).

**New script:** `scripts/build-takeaways.ts` — reads source files, invokes Claude via Anthropic SDK (same pattern as `classify-provisions.ts`), writes `case_info.key_takeaway` back to source files. Skips files where `case_info.key_takeaway` already exists (idempotent, same pattern as classify-provisions).

---

### Feature 2: Remedy Reclassification

**What:** 280 provisions currently classified as `remedy_type: "Other"` need reclassification into meaningful categories. Claude proposes; human reviews; pipeline writes back.

**The problem in the data:** `build-provisions.ts` shards provisions by `remedy_types` array. When `remedy_types` is `["Other"]`, the provision goes into `rt-other-provisions.json`, which is the "catch-all" shard (currently a large, undifferentiated bucket). The existing `RemedyType` union in `src/types/ftc.ts` has 10 values — reclassification expands assignment into the existing 9 named types without adding new taxonomy values, or optionally adds 1-2 new types if Claude identifies a consistent unnamed pattern.

**Pipeline integration:**

Option A (recommended): A new script `scripts/reclassify-remedies.ts` reads each source file in `ftc-files/`, finds provisions where `remedy_types` contains only `"Other"`, asks Claude to reclassify them against the existing taxonomy, writes the corrected `remedy_types` arrays back to the source file. Then `build-provisions.ts` is re-run — provisions move from `rt-other-provisions.json` into their correct topic shards. No schema changes. The existing data pipeline handles everything.

Option B (simpler for review): The script writes a proposed-reclassification JSON file that a human approves before the actual write-back. Adds a review step but reduces risk of incorrect auto-classification.

**The key insight:** `build-provisions.ts` and `build-patterns.ts` consume source files as input. No UI code touches `remedy_types` classification logic. Fixing classification data automatically propagates to all downstream artifacts on the next pipeline run. This is the highest-leverage fix: change data, not code.

**Schema changes:** None if using existing taxonomy values. If adding new `RemedyType` values, `src/types/ftc.ts` must be updated and `build-provisions.ts` must include the new slugs in `TOPIC_LABELS`.

**New components needed:** None. This is a pure data pipeline change.

**New script:** `scripts/reclassify-remedies.ts`

**UI effect:** After re-running `build-provisions.ts`, `rt-other-provisions.json` shrinks and the named remedy type shards grow. The existing `TopicSidebar` in the Provisions tab will reflect new counts automatically (it reads from `manifest.json`). No UI changes required.

---

### Feature 3: Pattern Condensing

**What:** Merge similar patterns, prune low-value patterns, and sort by most recent example. Target: reduce 126 patterns to a meaningful subset, defaulting to recency sort.

**Pipeline integration:**

`build-patterns.ts` currently groups by normalized title (exact match after punctuation stripping), then prefix-merges orphans into parents. Two enhancement points:

**Merge similar patterns** — The current prefix-merge pass (Pass 2) only merges `small_key.startsWith(large_key + " ")`. A semantic similarity pass is not feasible at build time without a large ML model. Instead, add a **manual merge map** (a config object in `build-patterns.ts` or a separate `scripts/pattern-merge-config.ts`) that lists pairs or groups of normalized titles to merge. Claude Code generates the config by reviewing the 126 patterns and proposing consolidation; a human approves; the map is committed. The merge map is applied as Pass 2.5 before the qualification filter.

**Prune low-value patterns** — Add an optional blocklist of normalized titles to suppress. Structural boilerplate patterns (compliance reporting, recordkeeping, monitoring) that already exist in `STRUCTURAL_CATEGORIES` can be filtered to reduce noise without removing data.

**Sort by recency** — Already done in Step 7 of `build-patterns.ts`: `patternGroups.sort((a, b) => b.most_recent_year - a.most_recent_year)`. The default sort is already recency. UI just needs to ensure it renders in the order the file provides (no re-sorting in the UI).

**Data schema changes:** None to `PatternsFile` or `PatternGroup`. The pipeline emits the same shape, just fewer patterns.

**New components needed:** None. `PatternList.tsx` renders whatever `ftc-patterns.json` contains.

**Modified:** `build-patterns.ts` — add merge config map and optional prune blocklist. May also be extracted to a separate `scripts/condense-patterns.ts` if the merge logic is substantial enough to warrant isolation.

**UI integration:** `FTCPatternsTab` → `usePatterns` → `PatternList` — the entire chain is unchanged. Fewer patterns in the file = fewer rows rendered. No UI work needed for condensing itself. The sort improvement is also already handled in the pipeline.

---

### Feature 4: Case Provisions Panel

**What:** In the Industries tab, clicking "View provisions" on a case card opens a modal (or side panel) showing that case's provisions inline, without navigating away to the Provisions tab.

**Existing hook point:** `FTCIndustryTab.tsx` already defines `handleViewProvisions(caseData)` which currently just calls `setSearchParams({ tab: "provisions" })` — a navigation away. This function is passed as a prop through `SectorDetail` → `CaseCardList` → `CaseCard` → `onViewProvisions`.

**Data access:** Individual case provisions are not currently available in `ftc-cases.json` (it contains case summaries only, not provision text). The provision text lives in `public/data/ftc-files/{id}.json` and in the topic-sharded files under `public/data/provisions/`.

Two data access options:

**Option A — Fetch from source file (recommended):** A new hook `useCaseProvisions(caseId: string | null)` fetches `public/data/ftc-files/{caseId}.json` on demand when the modal opens. This file contains the full `order.provisions` array with `title`, `summary`, and `requirements[].quoted_text`. Size per file is 20-200 KB. Network fetch is fast because modal opens after user interaction (acceptable latency). No pre-aggregation needed.

```typescript
// src/hooks/use-case-provisions.ts
export function useCaseProvisions(caseId: string | null) {
  return useQuery({
    queryKey: ["case-provisions", caseId],
    queryFn: async () => {
      const res = await fetch(`/data/ftc-files/${caseId}.json`);
      if (!res.ok) throw new Error("Failed to load case provisions");
      const data = await res.json();
      return (data.order?.provisions ?? []) as ClassifiedProvision[];
    },
    enabled: !!caseId,
    staleTime: Infinity,
  });
}
```

**Option B — Read from topic-sharded files:** Filter existing provision shards by `case_id`. Works but requires loading multiple shard files (one per topic) and de-duplicating. More network overhead for this targeted use case. Not recommended.

**Component design:**

New component `CaseProvisionsModal.tsx` in `src/components/ftc/industry/`. Uses shadcn/ui `Dialog` (already in dependencies as `@radix-ui/react-dialog`, available through shadcn). Receives `caseData: EnhancedFTCCaseSummary` (for header metadata) and `isOpen: boolean` / `onClose: () => void`. Internally calls `useCaseProvisions(caseData?.id)`.

```
CaseProvisionsModal
  ├── Dialog.Header: company name, year, docket number, FTC.gov link
  ├── Loading state (spinner while fetching)
  └── Provision list:
        forEach provision:
          provision_number + title
          summary (1-2 lines)
          verbatim_text (collapsible, blockquote style)
          remedy_types badges
```

**State management in `FTCIndustryTab`:**

```typescript
// Add to FTCIndustryTab state
const [provisionsCase, setProvisionsCase] = useState<EnhancedFTCCaseSummary | null>(null);

// Replace handleViewProvisions stub
const handleViewProvisions = useCallback((caseData: EnhancedFTCCaseSummary) => {
  setProvisionsCase(caseData);
}, []);

// In JSX
<CaseProvisionsModal
  caseData={provisionsCase}
  isOpen={!!provisionsCase}
  onClose={() => setProvisionsCase(null)}
/>
```

This change is contained entirely within `FTCIndustryTab.tsx` (state) and a new `CaseProvisionsModal.tsx`. No other component is modified.

**New components needed:** `CaseProvisionsModal.tsx`, `use-case-provisions.ts` hook.

**Modified:** `FTCIndustryTab.tsx` — add modal state and wire `handleViewProvisions` to open modal instead of navigating.

---

## Component Boundaries Summary

### New Files

| File | Type | Purpose |
|------|------|---------|
| `scripts/build-takeaways.ts` | Build script | Generate `key_takeaway` for each case via Claude, write to source files |
| `scripts/reclassify-remedies.ts` | Build script | Propose reclassification of "Other" remedy provisions, write to source files |
| `src/hooks/use-case-provisions.ts` | Hook | Fetch single case file on demand for provisions modal |
| `src/components/ftc/industry/CaseProvisionsModal.tsx` | UI component | Modal showing case provisions inline in the Industries tab |

### Modified Files

| File | Change | Why |
|------|--------|-----|
| `scripts/build-ftc-data.ts` | Read `case_info.key_takeaway` from source files and include in case summary | Propagate takeaway to `ftc-cases.json` |
| `scripts/build-patterns.ts` | Add merge config map, optional prune blocklist | Pattern condensing |
| `src/types/ftc.ts` | Add `key_takeaway?: string` to `EnhancedFTCCaseSummary`; optionally add new `RemedyType` values | Schema for takeaway |
| `src/components/ftc/industry/CaseCard.tsx` | Render `caseData.key_takeaway` (short form) | Display takeaway on case cards |
| `src/components/ftc/FTCIndustryTab.tsx` | Add modal open state, replace `handleViewProvisions` stub | Case provisions panel |

### Unchanged Files

Everything in `provisions/`, `analytics/`, `patterns/` subdirectories. `FTCTabShell.tsx`. `FTCProvisionsTab.tsx`. `FTCPatternsTab.tsx`. `FTCAnalyticsTab.tsx`. All hooks except the one new file. `build-provisions.ts` (only re-run after reclassification writes back to source files).

---

## Data Flow Changes

### Takeaway Pipeline Flow

```
public/data/ftc-files/{id}.json
  └── case_info.factual_background + complaint.counts
        │
        ▼
scripts/build-takeaways.ts
  └── Claude API → key_takeaway string
        │
        ▼  (write-back to source file)
public/data/ftc-files/{id}.json
  └── case_info.key_takeaway: "Lenovo preinstalled..."
        │
        ▼  (rebuild)
npm run build:ftc-data
        │
        ▼
public/data/ftc-cases.json
  └── cases[].key_takeaway: "Lenovo preinstalled..."
        │
        ▼  (existing hook, no change)
useFTCData() → EnhancedFTCCaseSummary.key_takeaway
        │
        ▼  (existing component, minor change)
CaseCard.tsx → renders takeaway text
```

### Remedy Reclassification Flow

```
public/data/ftc-files/{id}.json
  └── order.provisions[].remedy_types: ["Other"]
        │
        ▼
scripts/reclassify-remedies.ts
  └── Claude API → new remedy_types: ["Compliance Monitoring", "Recordkeeping"]
        │
        ▼  (write-back to source file)
public/data/ftc-files/{id}.json
  └── order.provisions[].remedy_types: ["Compliance Monitoring", "Recordkeeping"]
        │
        ▼  (rebuild — same command as v1.0)
npm run build:provisions
        │
        ▼
public/data/provisions/rt-other-provisions.json (shrinks)
public/data/provisions/rt-compliance-monitoring-provisions.json (grows)
public/data/provisions/manifest.json (counts update)
        │
        ▼  (existing hooks, no change)
useProvisionsManifest() → updated counts in TopicSidebar
```

### Case Provisions Panel Flow

```
User clicks "View provisions" on CaseCard in SectorDetail
        │
        ▼  (state change in FTCIndustryTab — was navigation)
setProvisionsCase(caseData)   [new]
        │
        ▼
CaseProvisionsModal isOpen=true  [new component]
        │
        ▼
useCaseProvisions(caseData.id)  [new hook]
  └── fetch /data/ftc-files/{caseId}.json   [existing file, new runtime access]
        │
        ▼
render provisions list inline in Dialog
```

---

## Suggested Build Order

Dependencies between features drive the order:

### Step 1: Takeaway pipeline (prerequisite to CaseCard change)

1. Write `scripts/build-takeaways.ts` with Claude API invocation and write-back pattern (from `classify-provisions.ts` as template)
2. Add `key_takeaway` field to `EnhancedFTCCaseSummary` in `src/types/ftc.ts`
3. Extend `processFile()` in `build-ftc-data.ts` to read and forward `case_info.key_takeaway`
4. Run `build:classify-takeaways` → `build:ftc-data`, verify `ftc-cases.json` contains takeaway strings
5. Update `CaseCard.tsx` to display `key_takeaway` (short form)

Rationale: Type extension in step 2 must precede UI work in step 5. The pipeline scripts (1-4) have no UI dependency and can be verified independently.

### Step 2: Remedy reclassification (independent, data-only)

6. Write `scripts/reclassify-remedies.ts` — identify all "Other"-only provisions, invoke Claude, write back
7. Review proposed reclassifications (manual spot-check of output)
8. Run `build:provisions` to rebuild topic shards
9. Verify `rt-other-provisions.json` count drops; named shard counts increase

Rationale: Completely independent of all UI features and of the takeaway pipeline. Can run in parallel with Step 1. No UI changes needed.

### Step 3: Pattern condensing (pipeline + config, no UI change)

10. Run existing `build:patterns` and export current pattern list to inspect
11. Identify merge candidates (similar titles that weren't caught by prefix merge) and pruning candidates (structural noise)
12. Add merge config map to `build-patterns.ts` (or separate config file)
13. Re-run `build:patterns`, verify pattern count reduction and recency sort

Rationale: No UI changes needed. The existing `PatternList` renders whatever the file contains. This step is safe to run at any point after the data is understood.

### Step 4: Case provisions panel (UI + hook, depends on nothing else)

14. Write `src/hooks/use-case-provisions.ts`
15. Write `src/components/ftc/industry/CaseProvisionsModal.tsx` with loading state and provision list
16. Update `FTCIndustryTab.tsx`: add `provisionsCase` state, replace `handleViewProvisions` stub, add `<CaseProvisionsModal />`
17. Verify modal opens, loads provisions, closes without affecting URL or tab state

Rationale: Fully independent of the other three features. No shared data or component dependencies. The existing `ftc-files/` source files are already the data source — no new build step needed.

---

## Patterns to Follow

### Pattern 1: Write-Back to Source Files for Pipeline Classification

**What:** Build scripts that classify or generate content write results back into `public/data/ftc-files/{id}.json` under `case_info.*` or `order.provisions[].field`. Downstream build scripts re-read those enriched files.

**When:** Takeaway generation, remedy reclassification. Both follow this pattern because it preserves classification results across pipeline re-runs and makes results auditable (inspectable files).

**Example (from `classify-provisions.ts`):**
```typescript
// Read existing file, merge new fields, write back
const existing = JSON.parse(fs.readFileSync(filepath, "utf-8"));
existing.case_info.key_takeaway = generatedTakeaway;
writeJSONSafe(filepath, existing);
```

**Skip condition:** If `case_info.key_takeaway` already exists, skip — same idempotency check as `classify-provisions.ts` uses for `statutory_topics`.

### Pattern 2: Modal With On-Demand Fetch for Case Detail

**What:** Use a controlled shadcn/ui `Dialog` managed by parent state. The modal's data hook is guarded by `enabled: !!caseId`. Data is fetched once and cached by React Query.

**When:** Case provisions panel. This is the correct pattern because: (a) Dialog is already in the shadcn/ui install, (b) `staleTime: Infinity` means repeat opens of the same case are instant, (c) the fetch is deferred until user action, so it doesn't block initial tab render.

**Example:**
```typescript
// Parent manages open state
const [selectedCase, setSelectedCase] = useState<EnhancedFTCCaseSummary | null>(null);

// Hook is disabled when no case selected
const { data: provisions, isLoading } = useCaseProvisions(selectedCase?.id ?? null);
```

### Pattern 3: Single-Field Schema Extension

**What:** Add new optional fields to existing interfaces rather than creating new interfaces. `key_takeaway?: string` on `EnhancedFTCCaseSummary` rather than a new `CaseTakeaway` wrapper type.

**When:** Takeaway field. The field is small, directly associated with the case record, and the existing interface is the natural owner. Making it optional (`?`) means old `ftc-cases.json` files without the field remain type-safe.

### Pattern 4: Config-Driven Merge Map for Patterns

**What:** Pattern consolidation logic is expressed as a static merge config object, not algorithmic. Claude generates the config; a human approves; the map is committed and versioned.

**When:** Pattern condensing. The alternative (runtime semantic similarity) requires a large model at build time and produces unpredictable results. A reviewed config is deterministic and transparent.

**Example structure:**
```typescript
// In build-patterns.ts or scripts/pattern-merge-config.ts
const MERGE_MAP: Record<string, string[]> = {
  // target normalized title -> list of source normalized titles to merge into it
  "security program": [
    "information security program",
    "comprehensive information security program",
    "data security program",
  ],
};
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Generating Takeaways at Runtime

**What:** Calling the Claude API from the browser or a Vercel function to generate takeaways on demand.

**Why bad:** Breaks the "no backend" constraint. Adds API key management complexity. Adds latency to every case card render. Takeaways are deterministic for fixed source data — there is no reason to regenerate them per request.

**Instead:** Build-time generation via `scripts/build-takeaways.ts`. Results are committed to `public/data/ftc-files/{id}.json` and re-emitted into `ftc-cases.json` on the next pipeline run.

### Anti-Pattern 2: Fetching All Case Files at Modal Open

**What:** When the case provisions panel opens, fetching all 293 `ftc-files/*.json` files to build a complete index, then filtering to the selected case.

**Why bad:** 293 fetches, tens of megabytes transferred, significant latency. The entire point of the `useCaseProvisions` hook is to fetch exactly one file.

**Instead:** `useCaseProvisions(caseId)` fetches `/data/ftc-files/${caseId}.json` — one file, one fetch.

### Anti-Pattern 3: Modifying the Provisions Tab for Case-Level Browsing

**What:** Extending `FTCProvisionsTab` to accept a `caseId` filter param and wiring the "View provisions" button in the Industries tab to navigate there with `?tab=provisions&case=lenovo`.

**Why bad:** The Provisions tab is topic-first; forcing it into case-first mode requires loading all topic shards and filtering across them. Architecturally incoherent. The existing `handleViewProvisions` stub navigated to provisions without a case filter — it just dumped the user on the provisions landing page. The modal pattern avoids this entirely.

**Instead:** Case provisions panel is a modal in the Industries tab. It is not a mode of the Provisions tab.

### Anti-Pattern 4: Auto-Applying Remedy Reclassifications Without Review

**What:** Running `reclassify-remedies.ts` and immediately writing Claude's proposed classifications back to source files without a human review step.

**Why bad:** The entire point of reclassification is to improve data quality. Unchecked LLM output can introduce new errors. The existing `classify-provisions.ts` script ran in a Claude Code session where the agent could be monitored. A standalone script with no review step removes that oversight.

**Instead:** The script writes proposed reclassifications to a separate `proposed-reclassifications.json` review file (or prints them to stdout) before writing back to source files. A human spot-checks the proposals and confirms before the final write-back runs. Alternatively, build a `--dry-run` flag (same as `classify-provisions.ts`) that prints proposed changes without committing them.

---

## Scalability Considerations

| Concern | Current | v1.1 Impact |
|---------|---------|-------------|
| `ftc-cases.json` size | ~500 KB | Grows by ~50 KB (293 takeaway strings at ~170 chars each). Negligible. |
| `ft-files/{id}.json` per-case fetch | Never done at runtime before | Single file 20-200 KB. React Query caches on first open. No concern. |
| Build time for takeaways | N/A | 293 Claude API calls. Sequential: ~15-30 min. Idempotent — only runs for uncached cases. |
| Pattern file size | 4.0 MB | Shrinks as patterns are condensed. |
| Remedy reclassification build time | N/A | 280 provisions to reclassify. Single batch or sequential Claude calls. ~5-10 min. |

No scalability concerns that require architectural changes.

---

## File Layout for v1.1 Changes

```
scripts/
  build-ftc-data.ts         MODIFIED — read and propagate key_takeaway from source files
  build-patterns.ts         MODIFIED — add merge config map, optional prune blocklist
  build-takeaways.ts        NEW — Claude API generation + write-back for key_takeaway
  reclassify-remedies.ts    NEW — Claude API reclassification of "Other" remedy provisions

src/
  types/
    ftc.ts                  MODIFIED — add key_takeaway?: string to EnhancedFTCCaseSummary
  hooks/
    use-case-provisions.ts  NEW — on-demand fetch of single case file for modal
  components/ftc/
    FTCIndustryTab.tsx      MODIFIED — add provisionsCase state, replace handleViewProvisions stub
    industry/
      CaseCard.tsx          MODIFIED — render key_takeaway short form
      CaseProvisionsModal.tsx  NEW — Dialog with provision list for selected case

public/data/
  ftc-cases.json            REBUILT — cases gain key_takeaway field
  ftc-files/{id}.json       ENRICHED — case_info gains key_takeaway; provision remedy_types corrected
  provisions/
    rt-other-provisions.json        REBUILT — fewer provisions (reclassified away)
    rt-*.json               REBUILT — some shards grow with newly classified provisions
    manifest.json           REBUILT — counts update automatically
  ftc-patterns.json         REBUILT — fewer patterns after condensing
```

---

## Sources

- Direct codebase inspection: `scripts/build-ftc-data.ts`, `scripts/classify-provisions.ts`, `scripts/build-provisions.ts`, `scripts/build-patterns.ts` — pipeline write-back pattern, idempotency checks, artifact shapes
- Direct codebase inspection: `src/components/ftc/FTCIndustryTab.tsx` — existing `handleViewProvisions` stub (line 92-99) is the exact integration point for the case provisions modal
- Direct codebase inspection: `src/components/ftc/industry/CaseCard.tsx`, `CaseCardList.tsx`, `SectorDetail.tsx` — component hierarchy for takeaway display
- Direct codebase inspection: `src/types/ftc.ts` — all existing interfaces; `EnhancedFTCCaseSummary` is the correct type to extend for `key_takeaway`
- Direct codebase inspection: `src/hooks/use-ftc-data.ts`, `use-patterns.ts`, `use-provisions.ts` — established React Query hook pattern (`staleTime: Infinity`, single fetch)
- Direct data inspection: `public/data/ftc-files/01.18_lenovo.json` — confirmed `case_info`, `complaint.factual_background`, `order.provisions` structure; field availability for takeaway generation
- Direct data inspection: `public/data/ftc-patterns.json` — confirmed `total_patterns: 126`, existing `most_recent_year` sort already in place
- Project requirements: `.planning/PROJECT.md` — v1.1 feature scope, constraints
- Confidence: HIGH on all integration points — every claim is grounded in direct inspection of existing code and data
