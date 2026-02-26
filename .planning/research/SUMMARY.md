# Project Research Summary

**Project:** FTC Enforcement Provisions Library (v1.1 — Data Quality & Case Insights)
**Domain:** Legal enforcement database / regulatory provisions library (subsequent milestone)
**Researched:** 2026-02-26
**Confidence:** HIGH

## Executive Summary

This is a subsequent milestone on a shipped v1.0 product. The four v1.1 features — key takeaways, remedy reclassification, pattern condensing, and a case provisions panel — all layer onto a stable, static-first architecture built with React 18.3, Vite 5.4, TanStack Query, and shadcn/ui. No new npm dependencies are required. Every feature is achievable with the existing stack: the Anthropic SDK (already installed as a devDependency) handles all build-time LLM work, the existing shadcn Dialog/Sheet component handles the modal UI, TanStack Query handles lazy case file fetching, and a 10-line inline token Jaccard function handles text similarity for pattern merging. The absence of new dependencies is a research-confirmed finding from direct codebase inspection, not an assumption.

The recommended delivery order is data pipeline first, UI second. Remedy reclassification and pattern condensing are pure pipeline changes with no UI risk — they improve the existing UI automatically on the next build and can ship without any frontend work. The case provisions panel follows as a self-contained UI feature whose data source (individual `ftc-files/*.json`) already exists at runtime, though it requires a `case-index.json` build artifact created in the same phase. Key takeaways are last because they require a new pipeline script, Claude API calls across 293 cases (~15-30 min build time), a type extension, and a UI surface — and they depend on the provisions panel being ready to host the full takeaway display.

The critical risk across all four features is the taxonomy change protocol for remedy reclassification. The `RemedyType` union is encoded in four separate locations simultaneously (TypeScript type, build script label map, classification prompt enum, shard file structure), and all four must be updated atomically before any reclassification script runs. A second critical risk is hallucination in LLM-generated takeaways: generation must be constrained to structured fields only (`legal_authority`, `violation_type`, provision titles), output must be validated programmatically, and all AI-generated content must be labeled in the UI. Pattern condensing carries a data loss risk — merges are one-way transforms and must be expressed as a reviewed config file with a git checkpoint before execution.

---

## Key Findings

### Recommended Stack

The v1.0 stack is fixed by project constraint and is not re-evaluated. All v1.1 capability is additive. The key finding from STACK.md is that **zero new dependencies are required**: the existing `@anthropic-ai/sdk 0.78` handles build-time LLM generation for both takeaways and remedy reclassification, the installed `shadcn/ui Sheet` component handles the provisions panel modal, TanStack Query handles on-demand case file fetching, and an inline token Jaccard function handles pattern similarity more appropriately than any character-level edit distance library. `claude-sonnet-4-5` is the right model choice — it matches the existing `classify-provisions.ts` precedent and avoids Opus pricing (~10x more expensive) for a summarization task.

**Core technologies (all pre-installed, none new):**
- `@anthropic-ai/sdk 0.78`: Build-time LLM generation — reused as-is for two new pipeline scripts
- `shadcn/ui Sheet/Dialog`: Case provisions panel modal — already installed and confirmed in `src/components/ui/sheet.tsx`
- `TanStack Query 5.83`: On-demand case file fetching with `staleTime: Infinity` — same pattern as all existing hooks
- Inline `tokenJaccard()` (~10 lines): Pattern similarity merging — O(n²) over 126 groups completes in < 100ms at build time

**No new `npm install` commands needed.** See `.planning/research/STACK.md` for full rationale and all rejected additions.

### Expected Features

All four v1.1 features are table stakes for this milestone — missing any one means the milestone delivers no real improvement over v1.0. FEATURES.md research grounds every feature scope claim in direct data analysis, not assumptions.

**Must have (table stakes):**
- Remedy reclassification: 885 provisions in `rt-other` are unbrowsable — the remedy type filter returns no useful results for most topics. The actual reclassification target is ~200-300 `prohibition` and `affirmative_obligation` provisions (not all 885 — structural provisions like `duration` and `acknowledgment` are correctly "Other" and should stay that way)
- Pattern condensing: 12 assessment-pattern variants and 10 acknowledgment-pattern variants show as separate rows — merge into 3-4 and 1 groups respectively; prune the 11 structural patterns with < 6 cases that add noise without research value
- Case provisions panel: "View provisions" currently navigates away from the industry tab, losing sector context — an inline slide-in modal is table stakes for research tools at this maturity level (Bloomberg Law and Westlaw both use this pattern)
- Key takeaways: Plain-English "what the FTC alleged" summary per case — factual only, labeled as AI-generated, derived from structured fields (`legal_authority`, `case_info.violation_type`, provision titles)

**Should have (differentiators):**
- Factual-only takeaway framing ("The FTC alleged that...") — avoids legal advice liability; practitioners trust AI-summarized complaint facts more than AI legal analysis
- Provisions panel showing case takeaway and provisions together in one surface — no existing FTC case browser does this
- Newly categorized remedies exposed as first-class filter options — "Data Retention/Deletion", "Consumer Notification", "Consent/Opt-out" filling real browsing gaps

**Defer (v2+):**
- Case detail page as a new route — modal achieves the same goal without routing complexity
- Showing all takeaways on the industry sector landing page — volume overwhelming at that level
- Manual curation of all 885 "other" provisions — months of work; build-time Claude classification is the correct approach
- Pattern merging via external fuzzy text library — token Jaccard inline is better suited to title comparison

See `.planning/research/FEATURES.md` for full feature landscape, anti-features, data reality notes, and feature dependency chain.

### Architecture Approach

All four features integrate cleanly into the existing pipeline-driven write-back architecture: build scripts enrich `public/data/ftc-files/*.json` source files (same pattern as `classify-provisions.ts`), downstream build scripts re-read enriched files and regenerate static artifacts, and the React UI reads artifacts via TanStack Query hooks with `staleTime: Infinity`. No new data flow patterns are introduced. The case provisions panel introduces the first runtime fetch of individual `ftc-files/*.json` files; a `case-index.json` build artifact is required so the modal fetches only the 1-3 relevant provision shards rather than all 15+.

**New files:**

| File | Type | Purpose |
|------|------|---------|
| `scripts/build-takeaways.ts` | Build script | Claude API generation + write-back for `key_takeaway` per case |
| `scripts/reclassify-remedies.ts` | Build script | Generate proposal file for "Other" remedy reclassification (does not auto-apply) |
| `scripts/apply-remedy-proposals.ts` | Build script | Apply human-reviewed proposals to source files |
| `src/hooks/use-case-provisions.ts` | Hook | On-demand fetch of single case file, guarded by `enabled: !!caseId` |
| `src/components/ftc/industry/CaseProvisionsModal.tsx` | UI component | Dialog with provision list, takeaway header, loading state |

**Modified files:** `scripts/build-ftc-data.ts`, `scripts/build-patterns.ts`, `src/types/ftc.ts`, `src/components/ftc/industry/CaseCard.tsx`, `src/components/ftc/FTCIndustryTab.tsx`

**Unchanged:** Everything in `provisions/`, `analytics/`, `patterns/` subdirectories. `FTCTabShell.tsx`. `FTCProvisionsTab.tsx`. `FTCPatternsTab.tsx`. `FTCAnalyticsTab.tsx`.

See `.planning/research/ARCHITECTURE.md` for full component boundaries, data flow diagrams, patterns to follow, and anti-patterns to avoid.

### Critical Pitfalls

The following are the top pitfalls from PITFALLS.md, ranked by severity and likelihood:

1. **Remedy taxonomy updated in only some of the four required locations** — The `RemedyType` union exists simultaneously in: (a) `src/types/ftc.ts`, (b) `TOPIC_LABELS` in `build-provisions.ts`, (c) the classification prompt enum, (d) shard file naming. All four must be updated atomically. Omitting any one causes TypeScript compile errors, unlabeled UI filter entries, or double-counted manifest entries. Prevention: finalize the complete new taxonomy in writing and update all four locations in a single commit before touching any source files.

2. **LLM takeaways hallucinate specific legal facts** — Dollar amounts, statute names, and violation years can be wrong when generated from already-extracted JSON (not ground-truth PDFs). A takeaway claiming "$1.2M penalty" when the actual figure is $500K destroys attorney trust immediately. Prevention: constrain generation to structured fields only (`legal_authority`, `violation_type`, provision titles); validate `statute` field against `legal_authority` programmatically; reject and retry on mismatch; display "AI-generated summary" badge in the UI.

3. **Pattern condensing permanently destroys original pattern groupings** — `build-patterns.ts` is a one-way transform; after merging, original groupings are unrecoverable without a full pipeline re-run from source files. Prevention: git checkpoint before any merge operation; express all merges as a reviewed `pattern-condense-config.json` with `merged_from` IDs recorded in the output; apply composite keep criterion (case_count >= 5 OR (>= 3 AND most_recent_year >= 2020)) to preserve recent enforcement signals.

4. **Case provisions modal loads wrong or partial provisions** — Provision data is sharded by statutory topic, not by case. A case spanning multiple topics has provisions split across multiple shard files. Fetching only one shard returns incomplete results silently. Prevention: build a `case-index.json` mapping `case_id` to shard filenames at pipeline time; the modal fetches only the 1-3 relevant shards rather than all 15+. This pipeline step is a hard prerequisite to the UI work.

5. **Old navigate-away handler conflicts with new modal** — `handleViewProvisions` in `FTCIndustryTab.tsx` currently calls `setSearchParams({ tab: "provisions" })`. If the modal state is added without removing this navigation, "View provisions" both opens a modal and navigates away. Prevention: replace (not supplement) the `setSearchParams` call with local state `setProvisionsCase(caseData)` in the same handler.

See `.planning/research/PITFALLS.md` for full pitfall detail, including all 11 pitfalls and the phase-specific warnings table.

---

## Implications for Roadmap

Based on combined research, four phases are suggested in dependency order. The ordering is driven by: (a) data pipeline changes feed the UI automatically with no additional work, (b) the provisions panel requires a build-time `case-index.json` artifact, and (c) key takeaways require both pipeline data and a UI surface (the provisions panel) to display the full takeaway. Phases 1 and 2 can be developed concurrently — they have no shared data dependencies.

### Phase 1: Remedy Reclassification

**Rationale:** Highest-leverage improvement with zero UI risk. 885 provisions labeled "Other" make the remedy type filter useless across the entire Provisions tab. This is a pure data change that improves the existing UI automatically. Must come first because it establishes the final `RemedyType` taxonomy that all downstream work builds on. The final taxonomy is a product decision, not a research question — it must be made before any code is written.

**Delivers:** Correct remedy categorization for ~200-300 `prohibition`/`affirmative_obligation` provisions; functional remedy type filter across all statutory topics; `rt-other` shard shrinks substantially; named remedy shards grow with newly classified provisions; no UI changes required.

**Addresses:** Remedy reclassification table stakes from FEATURES.md; "Data Retention/Deletion", "Consumer Notification", "Consent/Opt-out" become first-class filter options automatically.

**Critical pre-condition:** Finalize new `RemedyType` enum values with display labels; update all four taxonomy locations atomically; back up source JSON files to git before running reclassification; pre-filter to `prohibition`/`affirmative_obligation` categories only (structural provisions correctly stay "Other").

**Avoids:** Pitfall 1 (taxonomy desync across four locations), Pitfall 6 (misscoping the 885 — filter to prohibition/affirmative_obligation only).

**Research flag:** Standard patterns. The write-back script structure is directly templated from `classify-provisions.ts`. Two-phase propose-then-apply approach is fully specified in STACK.md and ARCHITECTURE.md. No additional phase research needed.

---

### Phase 2: Pattern Condensing

**Rationale:** Pure pipeline change, no UI risk, standalone value. Cleaner provision data from Phase 1 produces better post-condense pattern groups (remedy types are now accurate, so pattern groupings gain signal quality). The `FTCPatternsTab` renders the improved list automatically — no frontend work required.

**Delivers:** Condensed pattern list (target: 80-90 patterns from 126); 12 assessment-pattern variants merged into 3-4 groups; 10 acknowledgment variants merged into 1; structural noise pruned by composite threshold; `ftc-patterns.json` shrinks from 4.0 MB. Pattern IDs for existing patterns preserved to avoid breaking bookmarked URLs.

**Addresses:** Pattern condensing table stakes from FEATURES.md; recency sort validation.

**Critical pre-condition:** Commit current `ftc-patterns.json` to git as a checkpoint. Write `pattern-condense-config.json` with explicit merge map and `merged_from` IDs. Apply composite keep criterion (>= 5 cases, OR >= 3 cases AND most_recent_year >= 2020).

**Avoids:** Pitfall 3 (permanent data loss from merge without checkpoint), Pitfall 7 (flat threshold drops recent location/biometric patterns), Pitfall 10 (post-merge IDs break bookmarked URLs — preserve pre-merge IDs as canonical in the config).

**Research flag:** Standard patterns. Config-driven merge approach is fully specified in ARCHITECTURE.md. Token Jaccard utility is specified in STACK.md. No additional phase research needed.

---

### Phase 3: Case Provisions Panel

**Rationale:** Self-contained UI feature with standalone value — does not depend on key takeaways (the panel is useful without them; takeaway display is additive). Requires exactly one pipeline artifact (`case-index.json`) that is built in this same phase. The existing `ftc-files/*.json` source files are already the data source at runtime — no new build step is needed beyond the index.

**Delivers:** Inline provisions modal in the industry tab; practitioners can drill into a specific case's provisions without losing sector context; modal loads correct provisions for all cases including multi-topic cases; shadcn Dialog with loading state, provision list with verbatim text, remedy type badges; `case-index.json` pipeline artifact emitted by `build-provisions.ts`.

**Addresses:** Case provisions panel table stakes from FEATURES.md; in-context case browsing matching Bloomberg Law / Westlaw inline panel conventions.

**Pipeline prerequisite (built in this phase):** `build-provisions.ts` must emit `public/data/provisions/case-index.json` mapping each `case_id` to its shard filenames. This is a build change, not a UI change, but it is a hard prerequisite for correct modal behavior on multi-topic cases.

**Avoids:** Pitfall 4 (old navigate-away handler must be replaced, not supplemented), Pitfall 8 (case-keyed queries require build-time index, not runtime shard aggregation), Pitfall 11 (modal scroll conflicts with existing `overflow-y-auto` containers — use Radix UI Portal, test on Windows Chrome).

**Research flag:** Standard patterns. All components are existing shadcn/ui primitives. Hook pattern mirrors existing `use-provisions.ts`. No additional phase research needed.

---

### Phase 4: Key Takeaways

**Rationale:** Most complex feature — requires a new pipeline script, Claude API calls across 293 cases (~15-30 min build time), a type extension in `src/types/ftc.ts`, and UI changes in two components. Placed last because: (a) the provisions panel must exist to host the full takeaway display, (b) the pipeline work is directly templated from `classify-provisions.ts`, (c) the UI work is small once the panel exists.

**Delivers:** `key_takeaway` field on every case in `ftc-cases.json`; short form on `CaseCard` (first sentence, structured as `{what_company_did, what_ftc_required}` each ≤ 25 words); full text in `CaseProvisionsModal` header; "AI-generated summary" label in the UI; idempotent pipeline script that skips already-processed cases on restart; per-case error handling that does not abort remaining cases.

**Addresses:** Key takeaways table stakes from FEATURES.md; factual framing that avoids legal advice liability; differentiator — provisions and conduct summary side by side in one panel.

**Critical pre-condition:** Define structured output format (`{"what_company_did": "...", "what_ftc_required": "..."}`, each field ≤ 25 words) before starting; run dry-run on 10 representative cases (1 COPPA, 1 TSR, 1 data security, 1 financial) to validate consistency; build `statute` field validation against `legal_authority` before running the full 293-case batch.

**Avoids:** Pitfall 2 (hallucinated legal facts — constrain to structured fields, validate programmatically), Pitfall 5 (length/tone inconsistency — enforce hard word limits in prompt and programmatically), Pitfall 9 (pipeline crashes lose progress — write `key_takeaway` to source JSON after each successful case, per-case `try/catch`).

**Research flag:** Standard patterns. Script structure mirrors `classify-provisions.ts` exactly. Legal AI summarization conventions are documented in FEATURES.md (Westlaw AI, Casetext CARA precedents). No additional phase research needed.

---

### Phase Ordering Rationale

- Phases 1 and 2 are pipeline-only: they deliver value through the existing UI with zero frontend risk. This matches the FEATURES.md MVP recommendation ("build data pipeline first, UI second").
- Phases 1 and 2 can be developed concurrently if needed — remedy reclassification and pattern condensing have no shared data dependencies.
- Phase 3 is independent of Phases 1 and 2. It requires exactly one pipeline artifact (`case-index.json`) that is built within Phase 3 itself. No shared state with the earlier phases.
- Phase 4 depends on Phase 3 (the provisions panel must exist to host the full takeaway display). The pipeline sub-step of Phase 4 can begin as soon as Phase 3's `CaseProvisionsModal` component exists.
- The critical path is: taxonomy decision (before Phase 1) → Phase 1 pipeline → Phase 3 panel exists → Phase 4 takeaway UI.

### Research Flags

No phase requires additional `/gsd:research-phase` depth. All four features are grounded in direct codebase inspection with HIGH confidence across all four research dimensions.

- **Phase 1:** Standard patterns — `classify-provisions.ts` is the direct template; two-phase propose/apply approach is fully specified. The only pre-planning decision needed is the product-level taxonomy choice (which new `RemedyType` values to add), which is not a research question.
- **Phase 2:** Standard patterns — merge config approach is fully specified; token Jaccard utility is self-contained; no external references needed.
- **Phase 3:** Standard patterns — shadcn Dialog + TanStack Query + `staleTime: Infinity`; hook structure mirrors existing `use-provisions.ts` exactly.
- **Phase 4:** Standard patterns — `classify-provisions.ts` is the direct template; structured output validation approach is fully specified in PITFALLS.md.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All findings from direct codebase inspection (`package.json`, installed components, existing scripts). Dependency conclusions are zero-speculation — verified against installed versions. |
| Features | HIGH | All feature scope grounded in direct data analysis (`rt-other` shard: 885 provisions, 229 unique titles; `ftc-patterns.json`: 126 patterns confirmed; individual case file structure confirmed). Legal research tool conventions verified against Bloomberg Law, Westlaw, CourtListener, Casetext precedents. |
| Architecture | HIGH | All integration points verified against running code. `handleViewProvisions` stub confirmed at `FTCIndustryTab.tsx` lines 92-99. Pipeline write-back pattern confirmed in `classify-provisions.ts`. All four taxonomy encoding locations confirmed by reading `build-provisions.ts` and `src/types/ftc.ts`. |
| Pitfalls | HIGH | All 11 pitfalls derived from direct code and data inspection. Taxonomy desync confirmed by reading all four encoding locations. Shard architecture confirmed by reading `build-provisions.ts` and `manifest.json`. 885-vs-280 provision count discrepancy confirmed by reading the `rt-other` shard directly. |

**Overall confidence: HIGH**

### Gaps to Address

- **New `RemedyType` enum values (product decision, not research gap):** Research identified the natural clusters from data analysis (Order Administration, Consumer Notification, Consent/Opt-out, Data Retention/Deletion, Breach Notification, Cooperation with Assessor, Disclosure Requirements) but the final taxonomy requires a human product decision. Must be decided before Phase 1 begins. The decision criterion is: each new category must contain at least 20 provisions to be a meaningful browsing dimension.
- **Pattern merge config content (planning task, not research gap):** The merge config structure is designed; the specific pattern ID groupings require a 30-60 minute review pass over the 126 current patterns during Phase 2 planning. Claude Code generates the initial config; a human approves it.
- **Takeaway output validation thresholds (execution validation, not research gap):** The 25-word-per-field limit is a reasonable starting point. Validate against 10 representative cases before committing to the full 293-case run in Phase 4.

---

## Sources

### Primary (HIGH confidence — direct codebase inspection)

- `scripts/classify-provisions.ts` — Template for all new build scripts (Claude API invocation, rate limiting, idempotency pattern, write-back to source files)
- `scripts/build-patterns.ts` — Full algorithm confirmed: exact-normalized pass, prefix-merge pass, 3-case filter, `most_recent_year` descending sort
- `scripts/build-provisions.ts` — `TOPIC_LABELS` map and shard architecture; confirmed four-location taxonomy encoding
- `scripts/build-ftc-data.ts` — Pipeline structure and `processFile()` extension point for `key_takeaway`
- `src/types/ftc.ts` — All type definitions; `EnhancedFTCCaseSummary`, `RemedyType` union, `StatutoryTopic`
- `src/components/ftc/FTCIndustryTab.tsx` — `handleViewProvisions` stub at lines 92-99; confirmed navigate-away behavior
- `src/components/ftc/industry/CaseCard.tsx` — `onViewProvisions` callback wiring; layout for takeaway field placement
- `src/components/ui/sheet.tsx` — Confirmed installed; `@radix-ui/react-dialog` based
- `package.json` — All installed versions confirmed; zero new dependencies needed

### Primary (HIGH confidence — direct data inspection)

- `public/data/provisions/rt-other-provisions.json` — 885 provisions, 229 unique titles; reclassification scope confirmed
- `public/data/ftc-patterns.json` — 126 patterns, 4.0 MB; 43 structural / 83 substantive; 45 patterns with 3-4 cases including recent location data and biometric patterns; `most_recent_year` sort confirmed
- `public/data/provisions/manifest.json` — 2,783 total provisions across 293 cases; shard architecture confirmed
- `public/data/ftc-files/01.18_lenovo.json` — Case file structure confirmed: `case_info`, `complaint.factual_background`, `complaint.counts[]`, `order.provisions[]`

### Secondary (MEDIUM confidence — domain knowledge)

- Bloomberg Law, Westlaw — Inline case detail panel conventions; AI-generated summary labeling standards; remedy taxonomy breadth norms for regulatory enforcement databases (15-30 categories)
- CourtListener, Casetext CARA — AI-generated headnote and summary conventions; factual-only framing standards for legal research tools

---

*Research completed: 2026-02-26*
*Ready for roadmap: yes*
