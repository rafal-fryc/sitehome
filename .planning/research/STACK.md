# Technology Stack

**Project:** FTC Enforcement Provisions Library (Milestone 2)
**Researched:** 2026-02-24
**Research Mode:** Stack dimension — additive to existing codebase

---

## Scope of This Document

This document covers only the **new libraries and patterns** needed for the provisions library milestone. The existing foundation (React 18.3, Vite 5.4, TypeScript 5.8, Tailwind 3.4, shadcn/ui, Recharts 2.15, TanStack Query 5.83, React Router 6.30) is fixed by constraint and not re-evaluated here.

---

## New Library Recommendations

### 1. Client-Side Full-Text Search

**Recommended: MiniSearch ^7.x**

```bash
npm install minisearch
```

**Why MiniSearch over alternatives:**

- **vs Fuse.js:** Fuse.js is a fuzzy-match library, not a full-text search engine. It has no inverted index, no field boosting, and degrades badly above ~2,000 documents. With provision-level indexing (~2,000-5,000 provisions across 293 cases), Fuse becomes noticeably slow. MiniSearch builds an inverted index at index-time, making query time O(1) regardless of corpus size. **Confidence: HIGH** — this is a well-understood architectural difference.

- **vs FlexSearch:** FlexSearch has faster raw throughput but a less ergonomic API, poorer TypeScript types, and a more complex configuration surface. For a legal provisions corpus where query latency is not the bottleneck (corpus is small relative to FlexSearch's target scale), MiniSearch's cleaner API and better DX justify the choice. **Confidence: MEDIUM** — based on training data, verify npm download trends if needed.

- **vs lunr.js:** lunr.js is effectively unmaintained (last release 2022). Avoid.

**MiniSearch key capabilities needed:**
- Multi-field indexing (provision title, quoted_text, summary, case company_name)
- Field weight boosting (quoted_text weighted higher for legal precision)
- Fuzzy matching configurable per-query
- Returns document IDs only — application layer joins back to full provision objects
- Works entirely at runtime in the browser with no server

**Build-time vs runtime indexing decision:** Index at runtime on first load using TanStack Query's `staleTime: Infinity` pattern already established. Provisions data will be embedded in the aggregated JSON or lazy-loaded per-case. MiniSearch indexes in-memory after the JSON fetch completes. No pre-built index serialization needed at this scale. **Confidence: HIGH** — 5,000 provisions at ~500 bytes each is 2.5 MB of provision text; MiniSearch indexes this in under 200ms on modern hardware.

**Confidence: HIGH** (architectural reasoning), **MEDIUM** (version number — verify current MiniSearch release on npm before installing, as major version may have advanced from 6.x to 7.x since training cutoff).

---

### 2. Topic Classification Pipeline (Build-Time)

**Recommended: Pure TypeScript in the existing `scripts/build-ftc-data.ts` pipeline**

No new library needed. The classification work happens in the offline build script using rule-based matching extended with the three-level taxonomy (statutory, practice area, remedy type).

**Rationale:** The existing build script already performs keyword-based classification (`classifyCategories` function). The new taxonomy is an additive expansion of the same pattern — match legal authority text, count titles, factual background, and now provision category/requirements text against keyword sets per taxonomy dimension.

**Why not an NLP library (compromise/wordnet/natural):**
- This is a closed, well-defined legal taxonomy with ~25 categories total, not open-domain classification
- The FTC's legal authority strings are highly predictable ("Children's Online Privacy Protection Act," "Gramm-Leach-Bliley Act," etc.) — exact string matching on legal_authority outperforms statistical NLP for this domain
- NLP libraries add build-step complexity and bundle size without accuracy gains on a controlled legal corpus
- The existing keyword approach already achieves correct classification for the major categories; extending it to provision-level requires only more granular keyword sets

**Confidence: HIGH** — verified against the actual provision data structure (provision.category field is already structural, provision.requirements[].description is already natural language; keyword matching on these is sufficient for the defined taxonomy).

---

### 3. Data Tables with Sorting, Filtering, and Pagination

**Recommended: TanStack Table ^8.x (headless, already ecosystem-adjacent)**

```bash
npm install @tanstack/react-table
```

**Why TanStack Table:**
- TanStack Query is already installed (^5.83.0) — TanStack Table is the same vendor/philosophy, headless, composable with shadcn/ui primitives already in the project
- The existing `FTCCaseTable.tsx` hand-rolls sorting with `useState` + `useMemo`. TanStack Table provides column filtering, pagination, multi-sort, and row selection with zero styling opinions — all styled with existing Tailwind/shadcn patterns
- Provisions library will need tables with: column filters (by topic, remedy type, year, company), multi-column sort, and pagination across potentially hundreds of filtered rows
- shadcn/ui ships a Data Table guide built on TanStack Table — the integration is documented and well-worn

**Why not react-table v7:** TanStack Table v8 is the successor; v7 is deprecated.

**Why not AG Grid or MUI DataGrid:** Both bring their own styling systems that conflict with the law-library Tailwind aesthetic. shadcn/ui + TanStack Table is the correct integration for this project.

**Confidence: HIGH** — TanStack Table v8 is the established standard for headless React tables with shadcn/ui. Version is stable and actively maintained.

---

### 4. Cross-Case Pattern Detection (Text Similarity)

**Recommended: No new library — implement with normalized string comparison in the build script**

Cross-case pattern detection ("how boilerplate language evolves") does not require an NLP similarity library. The approach:

1. In `build-ftc-data.ts`, for each provision category (e.g., `affirmative_obligation` with title containing "comprehensive security program"), collect all `quoted_text` values across cases, sorted by date
2. Emit a `patterns` object in the aggregated JSON keyed by pattern name (defined statically — "comprehensive_security_program", "algorithmic_destruction", etc.)
3. Each pattern entry contains an array of `{ case_id, date, provision_number, quoted_text, similarity_to_canonical }` sorted chronologically
4. Similarity to a canonical template can be computed with a simple character-level Jaccard or Levenshtein ratio — both implementable in ~20 lines of TypeScript with no library dependency

**Why not a string-similarity library (string-similarity, natural, fastest-levenshtein):**
- The pattern set is predefined, not discovered dynamically
- At 293 cases, even O(n²) pairwise comparison is fast at build time
- Adding a library to the build script for a 20-line utility function adds dependency surface without benefit

**If dynamic similarity is needed later:** `fastest-levenshtein` is the correct choice (pure JS, no WASM dependency, ~3KB). Add it at that point.

**Confidence: HIGH** — reasoning based directly on the data structure and the project constraints. "Cross-case patterns" as defined in PROJECT.md is about tracking known provision language evolution, not discovering novel clusters.

---

### 5. URL State Management for Provisions Browsing

**Recommended: Existing React Router DOM ^6.30 + `useSearchParams` — no new library**

The existing app already uses URL-driven state via search params (noted in PROJECT.md as an existing feature). The provisions browsing UI (topic selection, active filters, selected provision) maps cleanly to search params:

```
/ftc-provisions?topic=data-security&year=2019&company=google&provision=abc123
```

React Router 6's `useSearchParams` hook handles this without additional libraries.

**Why not nuqs or react-router-dom's createSearchParamStore:** Unnecessary abstraction on top of a standard hook the project already uses.

**Confidence: HIGH.**

---

### 6. Analytics Charts — Extended (Line/Area Charts)

**Recommended: Extend existing Recharts ^2.15 — no new charting library**

The existing `FTCGroupChart.tsx` uses Recharts BarChart and PieChart. The new analytics requirements (enforcement trends over time, topic shifts by year) need:
- `LineChart` / `AreaChart` — already in Recharts
- `ComposedChart` for combined chart types — already in Recharts
- Brush component for timeline scrubbing — already in Recharts

Recharts has all chart types required. Adding a second charting library creates visual inconsistency and bundle bloat.

**The one limitation:** Recharts tooltips require careful styling to match the law-library aesthetic (already demonstrated in `FTCGroupChart.tsx` with custom `contentStyle`). This is a DX cost, not a blocker.

**Confidence: HIGH** — Recharts 2.x component list is stable and well-documented.

---

### 7. Highlight Matched Text in Search Results

**Recommended: `mark.js` browser port via `mark.js` npm package, or inline implementation**

When a user searches for "algorithmic destruction" and provisions display, matched terms should be highlighted in the quoted_text. Two options:

**Option A — `mark.js` npm package (~5KB gzipped):** Mature, actively maintained, handles regex and fuzzy highlighting in DOM elements. Works well with React via `ref` + `useEffect`.

**Option B — Inline highlight utility (~15 lines):** Split text on matched terms, wrap in `<mark>` tags, render as JSX. Sufficient for single-term and phrase matching.

**Recommendation: Start with Option B (inline utility).** MiniSearch returns match positions — use those to reconstruct highlighted text without a library. Add `mark.js` only if multi-term highlighting with overlapping matches becomes complex.

**Confidence: HIGH** — this is a standard pattern with well-understood tradeoffs.

---

### 8. TypeScript Types for the Extended Data Model

**Recommended: Extend `src/types/ftc.ts` — no new library**

The new data model adds `topic_tags` arrays to provisions, pattern entries, and potentially industry/sector fields. These are plain TypeScript interface additions.

The extended provision type will look like:

```typescript
export interface FTCProvision {
  provision_number: string;
  title: string;
  category: "prohibition" | "affirmative_obligation" | "assessment" | "reporting" | "other";
  summary: string;
  topic_tags: {
    statutory: string[];      // e.g. ["COPPA", "FCRA"]
    practice_area: string[];  // e.g. ["Data Security", "AI / ADM"]
    remedy_type: string[];    // e.g. ["Algorithmic Destruction", "Comprehensive Security Program"]
  };
  requirements: FTCRequirement[];
  // case context (denormalized for browsing performance)
  case_id: string;
  company_name: string;
  date_issued: string;
  ftc_url?: string;
}
```

Denormalizing case context into each provision object at build time eliminates the need for client-side joins when rendering the provisions browsing UI. This is the correct pattern for static JSON + client-side rendering.

**Confidence: HIGH.**

---

## What NOT to Add

| Rejected Library | Reason |
|-----------------|--------|
| Elasticsearch / OpenSearch | Requires a server. Project constraint is client-side static JSON. |
| Algolia / Typesense | External service with API key and network dependency. Overkill for 5,000 provisions. |
| D3.js | Recharts already covers all chart types needed. D3 adds complexity without benefit given existing Recharts investment. |
| Prisma / any ORM | No database. FTC data is static JSON. |
| React Virtual / TanStack Virtual | Premature. 293 cases visible at once is fine. Add if provisions list virtualization is needed (> 500 rows rendered). |
| Next.js / Remix | Framework migration explicitly forbidden by constraint. |
| Redux / Zustand | TanStack Query + React Router search params already handle all state. URL state is better than in-memory for a reference tool (shareable links). |
| Fuse.js | Fuzzy matching without an inverted index. Not suited for legal text corpus at this scale. |
| lunr.js | Unmaintained since 2022. |
| natural / compromise (NLP) | Overkill for a closed legal taxonomy. Keyword matching on structured legal authority strings is more accurate. |
| FlexSearch | More complex API, weaker TypeScript support than MiniSearch for equivalent functionality at this scale. |

---

## Installation Summary

```bash
# New production dependencies
npm install minisearch @tanstack/react-table

# New dev dependencies
# None required — tsx, TypeScript, and existing toolchain handle the build pipeline extension
```

**Total new bundle impact:** MiniSearch ~7KB gzipped + TanStack Table ~15KB gzipped = ~22KB additional. Acceptable given the feature surface added.

---

## Build Pipeline Extension Pattern

The existing pattern (confirmed by reading `scripts/build-ftc-data.ts`):

```
offline source JSONs → build-ftc-data.ts (tsx) → public/data/ftc-cases.json + public/data/ftc-files/*.json
```

Extended pattern for this milestone:

```
offline source JSONs
  → build-ftc-data.ts (tsx)
      → topic classification (new classifyProvisionTopics function, same file)
      → pattern extraction (new extractPatterns function, same file)
  → public/data/ftc-cases.json          (existing, extended with topic_tags)
  → public/data/ftc-provisions.json     (new: flat list of all provisions, denormalized)
  → public/data/ftc-patterns.json       (new: provision language pattern groups)
  → public/data/ftc-files/*.json        (existing, unchanged)
```

The `ftc-provisions.json` flat file allows the provisions browsing UI to load all provisions in one fetch and filter/search entirely client-side. At ~5,000 provisions × ~1,500 bytes average (with quoted_text), the file is ~7.5 MB uncompressed. Vercel serves this gzipped (~1.5-2 MB compressed) — acceptable for a reference tool. If size becomes a concern, split by topic at build time.

**Confidence: HIGH** — this is derived directly from reading the existing build script and data structure.

---

## Confidence Assessment

| Decision | Level | Basis |
|----------|-------|-------|
| MiniSearch for search | MEDIUM-HIGH | Architectural reasoning is HIGH; exact current version needs npm verification |
| TanStack Table v8 | HIGH | Stable, well-documented, ecosystem match with existing TanStack Query |
| No NLP library for classification | HIGH | Closed taxonomy + structured legal authority fields make keyword matching superior |
| Recharts extension (no new charting lib) | HIGH | All required chart types confirmed present in Recharts 2.x |
| Build pipeline extension pattern | HIGH | Derived from direct reading of existing build script |
| Denormalized provisions flat file | HIGH | Standard pattern for static JSON + client-side search |
| No Zustand/Redux | HIGH | URL state + TanStack Query covers all state needs |

---

## Sources

- Existing codebase: `scripts/build-ftc-data.ts`, `src/types/ftc.ts`, `src/hooks/use-ftc-data.ts`, `src/components/ftc/FTCGroupChart.tsx`, `src/components/ftc/FTCCaseTable.tsx` (direct inspection)
- Existing data structure: `public/data/ftc-files/03.24_rite_aid.json` (provision schema confirmed)
- Project constraints: `.planning/PROJECT.md` (direct inspection)
- MiniSearch project: https://lucaong.github.io/minisearch/ — **version not verified against current npm release, check before install**
- TanStack Table: https://tanstack.com/table/v8 — **HIGH confidence, stable v8 API**
- Recharts component list: https://recharts.org/en-US/api — **HIGH confidence for 2.x components**
