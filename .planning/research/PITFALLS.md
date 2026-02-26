# Domain Pitfalls

**Domain:** Legal enforcement database / regulatory provisions library
**Product:** FTC Enforcement Provisions Library — v1.1 Data Quality & Case Insights
**Researched:** 2026-02-26
**Research Mode:** Pitfalls dimension — specific to LLM-generated summaries, taxonomy reclassification, pattern condensing, and modal UI added to an existing working system

---

## Scope Note

This document covers pitfalls **specific to the four v1.1 features** being added to a working v1.0 system: key takeaways (LLM-generated), remedy reclassification (280 "other" remedies), pattern condensing (126 → fewer patterns), and case provisions panel (modal in industry tab). Generic pitfalls from v1.0 research (keyword classification, file size, URL validity) are documented in the original PITFALLS.md and are not repeated here.

---

## Critical Pitfalls

Mistakes that cause rewrites, destroy data integrity, or produce legally misleading output.

---

### Pitfall 1: Remedy Reclassification Breaks the Existing Provisions Sharding System

**What goes wrong:** The `rt-other` shard currently contains 885 provisions classified as `Other` remedy type. Reclassifying these into new categories (e.g., "Civil Procedure", "Order Administration", "Injunction Relief") means adding new values to the `RemedyType` union type in `src/types/ftc.ts`. But `build-provisions.ts` writes remedy-type shards keyed by the `remedy_types` array on each provision record in the source JSON files (`public/data/ftc-files/*.json`). Adding a new `RemedyType` value without simultaneously updating (1) the TypeScript union, (2) the `TOPIC_LABELS` map in `build-provisions.ts`, (3) the `ValidRemedyTypes` enum in `classify-provisions.ts`'s prompt, and (4) re-running the full `build:provisions` pipeline results in a broken manifest where new categories appear in the shard directory but not in `manifest.json`, or appear with an unlabeled `"other"` fallback label. The UI then silently shows an unlabeled filter option.

**Why it happens:** The remedy taxonomy is encoded in four places: the TypeScript union type, the prompt enum, the label map, and implicitly in the manifest. These four are manually kept in sync. When reclassification adds new values mid-process (e.g., Claude proposes "Order Administration" as a category), only the source JSON files get updated — the build pipeline constants are forgotten.

**Consequences:**
- New remedy categories appear in provision shards but have no label in the manifest — UI displays blank badges
- TypeScript compile errors if new values are added to source JSON but not to the `RemedyType` union
- Old `rt-other-provisions.json` shard still exists and is still referenced by cached manifests — counts show double-counting if users loaded the page between pipeline runs
- Re-running classification on already-classified files requires disabling idempotency check (`isAlreadyClassified`), which could wipe existing good classifications if the script errors mid-run

**Prevention:**
1. **Establish a "taxonomy change protocol" before any reclassification run.** The sequence must be: (a) finalize the new `RemedyType` enum values with their display labels, (b) update `src/types/ftc.ts` union, (c) update `TOPIC_LABELS` in `build-provisions.ts`, (d) update the `Valid RemedyTypes` list in the classification prompt, (e) only then run classification on the 280 "other" provisions.
2. **Do not ask Claude to propose new category names at runtime.** Use a fixed pre-approved list. Claude-proposed names at classification time will be inconsistent across 280 calls — "Civil Penalties" on one case, "Civil Penalty Order" on another, "Penalty Provisions" on a third. Define the closed enum first, then classify into it.
3. **Back up source JSON files before running reclassification.** The script writes directly to `public/data/ftc-files/*.json`. A mid-run crash can leave files in a partially-classified state. Use git to commit the pre-reclassification state as a checkpoint.
4. **After reclassification, delete old shard files before re-running `build:provisions`.** Stale `rt-other-provisions.json` will not be overwritten if the `other` category becomes empty — it must be explicitly removed.

**Warning signs:**
- Running `build:provisions` logs `TOPIC_LABELS` warnings for unmapped slugs
- TypeScript shows `Type '"Order Administration"' is not assignable to type 'RemedyType'` errors
- `manifest.json` contains shard entries without a `label` field set by `TOPIC_LABELS`
- The UI's remedy type filter shows a blank entry or an unlabeled badge

**Phase:** Remedy reclassification pipeline phase. Must complete taxonomy design before touching any source files.

---

### Pitfall 2: LLM-Generated Takeaways Hallucinate Specific Facts About the Case

**What goes wrong:** Each FTC case has a `factual_background` field with prose describing what the company did. Claude is asked to generate 2-3 sentence takeaways. The hallucination risk is not generic fabrication — it is **plausible-but-wrong specifics**: wrong dollar amounts for civil penalties, wrong years, wrong statute names, wrong company descriptions. A takeaway that says "Respondent paid $1.2 million" when the actual penalty was $500K, or one that says "COPPA violation" for a Section 5 case, undermines attorney trust immediately. Legal practitioners will spot these errors and distrust the entire tool.

**Why it happens:** The existing `factual_background` field was generated by an earlier LLM extraction pass, not transcribed from the source PDF. It may already contain errors. When a second LLM pass generates takeaways from an already-hallucinated input, errors compound. The generation step has no access to the ground truth consent order — it operates entirely from extracted JSON.

**Consequences:**
- Practitioners quote an incorrect civil penalty figure from a takeaway in a client memo
- Tool loses credibility with the exact audience (attorneys) who are most likely to verify against primary sources
- No mechanism exists to detect hallucinations at generation time — errors persist silently in static JSON

**Prevention:**
1. **Constrain takeaway generation to verifiable structured fields, not prose.** The takeaway should synthesize: `legal_authority` (the actual statute), `case_info.violation_type` (deceptive/unfair), provision titles (what was required), and `complaint_counts` (number of charges). These fields are structured and were extracted from headers and structured sections — less prone to OCR errors than narrative prose. Do not ask Claude to invent detail beyond what these fields contain.
2. **Produce takeaways in a structured format, validate against source fields.** Generate JSON: `{"violation_summary": "...", "key_provisions": ["...", "..."], "statute": "..."}`. After generation, programmatically verify that the `statute` field matches `legal_authority` and that `key_provisions` map to actual provision titles. Reject and retry if validation fails.
3. **Label all takeaways as AI-generated in the UI.** Show a small indicator: "AI-generated summary — verify against source order." This is not a disclaimer that undermines the feature; it is industry-standard practice for AI-assisted legal research tools (see Westlaw AI, Casetext CARA).
4. **Generate takeaways from the most specific fields available.** The `legal_authority` field ("Children's Online Privacy Protection Act, 15 U.S.C. § 6502(a)") is authoritative and should be quoted directly in the takeaway for the statute citation. Do not paraphrase statutory authority.

**Warning signs:**
- Generated takeaway mentions a civil penalty amount not present in any structured field
- Takeaway attributes a COPPA violation to a company whose `legal_authority` field shows only "Section 5 of the FTC Act"
- Dry run of generation on 10 cases produces 2+ takeaways that cannot be verified against source data

**Phase:** Key takeaways pipeline phase. Build validation into the generation script before running on all 293 cases.

---

### Pitfall 3: Pattern Condensing Permanently Destroys the Merge-Target's Identity

**What goes wrong:** The current 126 patterns were produced by title normalization (stripping punctuation, lowercasing) plus a prefix-merge heuristic (`build-patterns.ts`). Merging similar patterns in v1.1 (e.g., merging "Comprehensive Security Program" (33 cases), "Mandated Information Security Program" (4 cases), "Mandated Data Security Program" (3 cases), and "Comprehensive Privacy Program" (4 cases) into a single pattern) produces a larger group but destroys the individual pattern identities. The problem: **once you write the condensed `ftc-patterns.json`, the original groupings are gone**. There is no incremental undo. The source data (provision shards) still exists, but reconstructing which provisions belonged to which pre-merge pattern requires re-running `build-patterns.ts` from scratch.

**Why it happens:** `build-patterns.ts` runs a one-way transformation: provisions in → pattern groups out. The output does not record which merge operations were performed. Condensing is implemented as a post-processing step that modifies the pattern output file, but the logic lives only in the script, not in the data.

**Consequences:**
- A merged "Information Security Program" pattern with 44 variants loses the timeline signal — early "Mandated Information Security Program" language (2004-2010) and later "Comprehensive Privacy Program" language (2018-2024) belonged to distinct enforcement eras and should not share a timeline
- The word-level diff feature (`TextDiff.tsx` using `jsdiff`) is most meaningful when comparing provisions that are semantically related; merging unrelated "other" patterns produces diffs that compare apples to oranges
- Practitioners using the chronological evolution view see a nonsensical "evolution" of a merged pattern

**Prevention:**
1. **Commit the current `ftc-patterns.json` to git before any condensing operation.** This creates a recoverable state. The file is 4.0 MB — Git handles it fine.
2. **Define the merge map explicitly in a config file, not as imperative code.** Write a `pattern-condense-config.json` that lists which pattern IDs should merge into which parent. The condensing script reads this config and applies it. The config becomes documentation of what was merged and why.
3. **Merge patterns only within structural/substantive class.** Structural patterns (recordkeeping, acknowledgment, compliance reporting) should only merge with other structural patterns. Substantive patterns should only merge with other substantive patterns. Cross-class merging produces timeline noise.
4. **Use the `most_recent_year` field as a merge guard.** If two patterns have `most_recent_year` more than 8 years apart, they likely represent different enforcement eras and should not be merged even if names are similar.
5. **Preserve merged-from IDs in the output.** Add a `merged_from: string[]` field to `PatternGroup` that records which original pattern IDs were absorbed. This allows future reconstruction and auditing.

**Warning signs:**
- Post-merge pattern has variants spanning more than 20 years with a gap of 5+ years in the middle (two distinct eras forced together)
- After merge, the word-level diff in `TextDiff.tsx` shows almost no common words between adjacent variants (provisions are too dissimilar to have been a real pattern)
- Pattern count drops below 60 — over-aggressive condensing has likely merged non-similar patterns

**Phase:** Pattern condensing pipeline phase. Implement the config-driven merge approach with git checkpoint before executing.

---

## Moderate Pitfalls

Mistakes that cost a sprint to fix or degrade the feature quality noticeably.

---

### Pitfall 4: Case Provisions Modal Navigates Away Instead of Showing Inline

**What goes wrong:** The current "View provisions" button in `CaseCard.tsx` calls `handleViewProvisions` in `FTCIndustryTab.tsx`, which does `setSearchParams` to `tab=provisions` — it navigates away from the industry tab entirely, losing sector context (the `sector=` URL param is replaced). This is the v1.0 behavior that v1.1 intends to replace with a modal/side panel. The pitfall is implementing the modal but **not removing or overriding the old navigate-away behavior**, resulting in two paths to the same content: the modal (new) and the tab navigation (old). Practitioners get confused when clicking "View provisions" sometimes opens a modal and sometimes navigates away.

**Why it happens:** `FTCIndustryTab.tsx` passes `onViewProvisions` as a callback down through `SectorDetail` → `CaseCardList` → `CaseCard`. The callback originates at the tab level. Changing what it does requires changing the implementation at the tab level while ensuring no other call site still uses the navigate-away behavior.

**Consequences:**
- The modal feature ships but the old navigate-away behavior persists for some entry points
- URL state becomes inconsistent — back navigation behaves differently depending on which path was taken to view provisions
- If the modal is added as a new component but `handleViewProvisions` still does `setSearchParams`, the modal never opens

**Prevention:**
1. **When implementing the modal, change `handleViewProvisions` in `FTCIndustryTab.tsx` to set a local state variable (`selectedCaseForModal: EnhancedFTCCaseSummary | null`), not `setSearchParams`.** The modal renders based on this state. The old `tab=provisions` navigation is removed from this handler entirely.
2. **The modal does not use URL params for its open/closed state.** Modals that are controlled by URL params create complex interactions: the back button closes the modal (unexpected) and sharing the URL opens the modal on page load (unexpected). Use React state for modal visibility, URL params for the sector/compare navigation that already exists.
3. **The provisions panel modal needs its own data fetch.** Case provisions live in the topic-sharded files (`provisions/*.json`), not in `ftc-cases.json`. When a user opens the modal for a specific case, the panel must fetch and filter provision shards for that case's `case_id`. This fetch happens on modal open, not on page load. Plan for a loading state inside the modal — the first open will have network latency.

**Warning signs:**
- `CaseCard.tsx` calls both `onViewProvisions` and triggers a URL change on the same click
- `FTCIndustryTab.tsx` still has `newParams.set("tab", "provisions")` in the `handleViewProvisions` handler after modal implementation
- Clicking "View provisions" on two different cards opens the modal for the first case (stale closure bug)

**Phase:** Case provisions panel UI phase. Audit all call sites of `handleViewProvisions` before adding the modal component.

---

### Pitfall 5: LLM Takeaway Generation Produces Inconsistent Tone and Length Across 293 Cases

**What goes wrong:** Running Claude generation over 293 cases produces takeaways that vary dramatically in length (2 sentences vs 8 sentences), formality (casual vs legal), and structure (bullet list vs prose). The v1.1 spec says "brief on cards" — but if takeaway A is 40 words and takeaway B is 200 words, the card layout breaks on case B and the user experience is inconsistent. Inconsistency is particularly visible on the industry tab's case list, where multiple `CaseCard` components render side-by-side with different content heights.

**Why it happens:** LLM generation with only high-level instructions ("generate a 2-3 sentence takeaway") produces free-form output. Without length enforcement in the prompt AND in the pipeline, output length drifts across a 293-case batch. The first few cases in a batch tend to set the pattern, but later cases may drift if the model context resets.

**Consequences:**
- Card layout has mismatched heights — breaks the law-library aesthetic
- Some takeaways are so long they dominate the card; practitioners cannot scan the case list
- Short takeaways for complex cases feel reductive; long takeaways for simple cases feel padded

**Prevention:**
1. **Enforce length at the prompt level with a hard token constraint.** Specify: "Generate exactly 2 sentences. First sentence: what the company did wrong. Second sentence: what the FTC required. Do not exceed 50 words total."
2. **Enforce length at the pipeline level.** After generation, check word count. If `takeaway.split(' ').length > 60`, truncate at the last sentence boundary before 60 words. Log truncations for manual review.
3. **Generate into a fixed structure, render flexibly.** Produce `{"what_company_did": "...", "what_ftc_required": "..."}` — two fixed fields, each max 25 words. The card renders them as two short lines. The full combined text is available for case detail expansion.
4. **Test the full batch in two passes:** dry-run on 10 representative cases (1 COPPA, 1 TSR, 1 data security, 1 financial), review for consistency, then run the full 293.

**Warning signs:**
- Dry run produces a takeaway exceeding 100 words
- Two consecutive cases have takeaways in completely different writing styles
- Any generated takeaway contains a list (bullet points or numbered items) — a reliable signal the model ignored the sentence-count constraint

**Phase:** Key takeaways pipeline phase. Build the validation and truncation logic before running the full 293-case batch.

---

### Pitfall 6: The 885 "Other" Remedies Include Structural Provisions That Should Stay as "Other"

**What goes wrong:** Reclassifying all 885 "other" remedies assumes they all need better categories. In fact, examination of the `rt-other` shard shows that the majority are structural/administrative provisions: `duration` category (Order Duration and Termination, Retention of Jurisdiction), `acknowledgment` category (Distribution of Order, Acknowledgment of Receipt), and `affirmative_obligation` category with administrative titles (Fees and Costs, Lifting of the Asset Freeze, Commission's Use of Funds). These were correctly classified as "Other" because they don't fit substantive remedy categories and creating new categories for them (e.g., "Order Administration") would add clutter to the remedy type filter without giving practitioners meaningful browsing value.

**Why it happens:** The milestone spec says "reclassify 280 'other' remedies" — but the actual `rt-other` shard contains 885 provisions. The discrepancy suggests that 280 is the number of cases that have at least one "other" remedy, while 885 is the total provision count. Attempting to reclassify all 885 is 3x more work than anticipated. Furthermore, reclassifying structural administrative provisions into new categories creates false-precision in the remedy type filter ("Order Administration" is not a meaningful browsing category for legal practitioners).

**Prevention:**
1. **Pre-filter the "other" shard by structural category before reclassification.** Provisions with `category` values of `duration`, `acknowledgment`, or `monitoring` that received "Other" remedy type should be left as "Other" — they are administrative scaffolding, not substantive remedies. Focus reclassification on `prohibition` and `affirmative_obligation` category provisions that received "Other."
2. **Estimate the true reclassification target before starting.** Filter `rt-other` to only `prohibition` and `affirmative_obligation` categories — this is the subset where Claude's reclassification will add meaningful value.
3. **Evaluate whether new remedy categories are worth adding to the filter.** If the new categories would each contain fewer than 20 provisions, they add noise to the remedy type filter. A category must be large enough to be a useful browsing dimension.

**Warning signs:**
- Reclassification script queues 885 API calls instead of ~200-300
- New remedy categories proposed by Claude appear only 3-8 times each across all cases
- Post-reclassification `rt-other` shard still contains 600+ provisions (structural ones correctly remain)

**Phase:** Remedy reclassification planning phase. Run the category analysis before writing any classification code.

---

### Pitfall 7: Pattern Condensing Raises the 3-Case Minimum Threshold and Silently Drops Valuable Patterns

**What goes wrong:** Raising the minimum case count threshold during condensing (e.g., from 3 to 5 cases) to reduce total pattern count will drop 45 patterns that currently have 3-4 cases. Among those 45 are substantively important patterns: "Sensitive Location Data Program" (4 cases, 2019-2024), "Location Data Deletion Requests" (4 cases, 2022-2024), "Prohibition Against Misrepresentations About Security and Privacy" (4 cases). These represent recent enforcement trends with high practitioner relevance. Pruning by threshold alone treats a 4-case recent pattern the same as a 4-case old pattern, even though recent patterns are the most valuable to practitioners researching current enforcement posture.

**Why it happens:** Threshold-based pruning is simple to implement. The temptation is to set threshold at 5 to cut the 45 borderline patterns and simplify the list. But threshold ignores recency — a 4-case pattern from 2019-2024 is more valuable than a 33-case pattern from 2002-2025 (which may represent old boilerplate no longer in use).

**Consequences:**
- Recent location data and biometric enforcement patterns disappear from the pattern browser
- The pattern library becomes less useful for practitioners researching current FTC enforcement signals
- Information loss is permanent unless the pipeline is re-run with lower threshold

**Prevention:**
1. **Use a composite keep criterion, not a flat threshold.** Keep a pattern if: (a) case_count >= 5, OR (b) case_count >= 3 AND most_recent_year >= 2020. This preserves recent small patterns as signals of emerging enforcement trends.
2. **Never prune structural patterns** — they are already filtered to a lower threshold since their value is documenting boilerplate evolution.
3. **Export a "pruned patterns" list** before writing the condensed output. Review it before committing. Any pattern with a name containing "Location", "Biometric", "AI", "Algorithm", or "Children" should be flagged for manual review regardless of case count.

**Warning signs:**
- Post-condense pattern count is below 60 (over-pruned)
- "Sensitive Location Data Program" pattern is absent from the condensed output
- All 3-case and 4-case patterns are gone regardless of recency

**Phase:** Pattern condensing pipeline phase. Define the keep criterion in the config before running.

---

### Pitfall 8: Case Provisions Modal Loads the Wrong Shard (or All Shards)

**What goes wrong:** When a user clicks "View provisions" for a specific case in the industry tab, the modal must show provisions for that case. Provision data lives in topic-sharded files (`public/data/provisions/*.json`). A case that spans multiple statutory topics (e.g., a case with COPPA + Section 5 charges) will have its provisions split across the `coppa-provisions.json` and `section-5-only-provisions.json` shards. Fetching only one shard and filtering by `case_id` misses provisions classified under the other shard. Fetching all shards (15+ files) is a waterfall of network requests.

**Why it happens:** The provision data architecture was designed for topic-based browsing, not case-based browsing. The case provisions panel flips the query direction: from "show all provisions under this topic" to "show all provisions for this case regardless of topic." The existing sharding architecture does not support this query efficiently.

**Consequences:**
- Modal shows partial provisions for multi-topic cases — practitioners see 4 provisions when the case has 12
- Fetching all 15+ shard files on modal open causes a visible loading delay and a cascade of network requests
- If the modal does not communicate "showing X of Y provisions" clearly, practitioners don't know they are seeing a partial list

**Prevention:**
1. **The build pipeline must emit a case-keyed provisions index at build time.** Before this UI phase, add a `build:case-index` pipeline step that generates `public/data/case-provisions/{case_id}.json` files — one per case, containing all provisions for that case regardless of topic. This is a denormalized index written at build time, not computed at runtime.
2. **Alternatively, add a `case_id` → `provision_ids[]` lookup to the existing `manifest.json`.** The UI can then fetch only the shard files that contain provisions for the given `case_id`, rather than all shards.
3. **Do not attempt to load all shard files on modal open.** The correct solution is a purpose-built case-provisions data structure, not runtime aggregation across 15 shard files.

**Warning signs:**
- DevTools Network tab shows 10+ parallel JSON fetches on "View provisions" click
- Modal shows fewer provisions than `caseData.num_provisions` indicates
- Any runtime filtering loop that iterates across all shard data to find a single case's provisions

**Phase:** Case provisions panel UI phase AND the preceding data pipeline phase. The data structure must be built before the modal UI can work correctly.

---

## Minor Pitfalls

Mistakes requiring a few hours to a day to fix.

---

### Pitfall 9: LLM Takeaway Script Loses Progress on Error and Restarts from the Beginning

**What goes wrong:** The existing `classify-provisions.ts` uses an idempotency check (`isAlreadyClassified`) that skips already-processed files. A takeaway generation script for 293 cases making Anthropic API calls will occasionally hit rate limits, network errors, or malformed JSON responses. If the script has no progress tracking beyond the idempotency flag in the source JSON, a crash at case 150 means the script resumes from case 1 and re-processes 0-149 unnecessarily (wasting API calls) or — if no idempotency check exists — overwrites good takeaways with new ones.

**Prevention:**
1. **Write a `key_takeaway` field directly into each source case JSON after successful generation**, matching the pattern of `classify-provisions.ts`. The `isAlreadyClassified`-style check (`data.case_info.key_takeaway !== undefined`) then skips already-processed cases on restart.
2. **Implement a per-case try/catch** that logs errors and continues to the next case rather than throwing fatally. A single malformed API response should not abort 200 remaining cases.
3. **Write a separate `takeaways-status.json` progress file** alongside the source data that records which case IDs have been completed. On restart, read this file first.

**Warning signs:**
- The script has no `--dry-run` flag
- No `try/catch` per file (only a global `catch`)
- Restarting the script after a crash starts API calls from file index 0

**Phase:** Key takeaways pipeline phase.

---

### Pitfall 10: Condensed Pattern IDs Differ From v1.0 IDs, Breaking Bookmarked URLs

**What goes wrong:** The current `PatternGroup.id` field is a slugified version of the pattern's most common title variant (`slugify(bestTitle)`). After condensing, merged patterns get a new canonical name (whichever title is most common in the merged group). If the merged group's canonical name is different from its pre-merge canonical name, the `id` slug changes. Any user who bookmarked a URL containing `?pattern=comprehensive-information-security-program` will find their bookmark broken after condensing, because the pattern is now at `?pattern=information-security-program`.

**Prevention:**
1. **Preserve the most-used pre-merge ID as the canonical ID for the merged pattern.** Do not re-slugify from the post-merge name; explicitly set the `id` field to the source pattern's existing ID.
2. **Document ID stability as a constraint in the merge config.** The config file should specify the canonical ID for each merged group, not derive it from the name.

**Warning signs:**
- After condensing, the pattern with the largest `case_count` has a different `id` than it had pre-condense
- Any pattern ID in the merged output differs from any pattern ID in the v1.0 `ftc-patterns.json`

**Phase:** Pattern condensing pipeline phase.

---

### Pitfall 11: Modal Scroll Conflicts With the Industry Tab's Existing Scroll Container

**What goes wrong:** The v1.0 industry tab uses native `overflow-y-auto` for independent sidebar scrolling (a known decision documented in PROJECT.md: "Native overflow-y-auto over ScrollArea"). A modal opened inside a scrollable container can produce double-scroll behavior: the modal itself scrolls, and the background page continues to scroll simultaneously on mousewheel events. On Windows, this is particularly problematic because the browser scrolls the element under the cursor, and if focus is on the modal but the cursor drifts, the background page scrolls unexpectedly.

**Prevention:**
1. **Use a portal to render the modal at the document root** (shadcn/ui's `Dialog` component does this by default via Radix UI's `Portal`). This removes the modal from the scroll container hierarchy.
2. **Lock `document.body` scroll when the modal is open.** shadcn/ui `Dialog` applies `pointer-events: none` to the body by default — verify this prevents background scroll.
3. **Test scroll behavior on Windows Chrome specifically.** The double-scroll problem is more common on Windows than macOS due to OS-level scrollbar behavior.

**Warning signs:**
- Background industry tab content scrolls when the user scrolls inside the modal
- Modal content gets clipped by the `overflow-y-auto` container instead of overflowing above it

**Phase:** Case provisions panel UI phase.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|----------------|------------|
| Remedy reclassification: taxonomy design | Pitfall 1 (taxonomy change breaks 4 places simultaneously) | Finalize new RemedyType enum values in writing before touching any code; update all 4 locations atomically |
| Remedy reclassification: scope | Pitfall 6 (885 provisions, not 280 — most should stay "Other") | Pre-filter to prohibition + affirmative_obligation categories before classifying; structural provisions are correctly "Other" |
| Key takeaways: generation | Pitfall 2 (hallucinated specific facts in legal summaries) | Constrain to structured fields only; validate statute against legal_authority; label as AI-generated |
| Key takeaways: consistency | Pitfall 5 (inconsistent length and tone across 293 cases) | Hard word-count limit in prompt + programmatic truncation; structured JSON output format |
| Key takeaways: pipeline | Pitfall 9 (no progress tracking, crashes require full restart) | Write takeaway field to source JSON after each case; per-case try/catch; --dry-run flag |
| Pattern condensing: data loss | Pitfall 3 (merge destroys original pattern identity permanently) | Git checkpoint before merge; config-driven merge map; preserve merged_from IDs |
| Pattern condensing: over-pruning | Pitfall 7 (threshold drops valuable recent patterns) | Composite criterion: case_count >= 5 OR (>= 3 AND most_recent_year >= 2020) |
| Pattern condensing: URL stability | Pitfall 10 (new canonical names break pattern bookmark URLs) | Preserve pre-merge ID as canonical in merge config |
| Case provisions panel: data architecture | Pitfall 8 (sharding by topic doesn't support case-keyed queries) | Build case-provisions index at pipeline time; do not aggregate shards at runtime |
| Case provisions panel: navigation | Pitfall 4 (old navigate-away handler conflicts with new modal) | Remove tab navigation from handleViewProvisions; use local React state for modal |
| Case provisions panel: scroll | Pitfall 11 (modal scroll conflicts with existing overflow-y-auto containers) | Use Radix UI Portal; test on Windows Chrome |

---

## Sources

- Direct codebase inspection: `scripts/build-patterns.ts` — identified the one-way transformation and the 3-case threshold logic; confirmed pattern IDs are derived from post-merge canonical titles
- Direct codebase inspection: `scripts/classify-provisions.ts` — identified the four-location taxonomy encoding problem; confirmed the `isAlreadyClassified` idempotency pattern
- Direct codebase inspection: `scripts/build-provisions.ts` — confirmed the `TOPIC_LABELS` map and shard architecture; identified the taxonomy-update protocol requirement
- Direct codebase inspection: `src/components/ftc/FTCIndustryTab.tsx` — confirmed `handleViewProvisions` currently calls `setSearchParams` to navigate away; identified the callback chain through SectorDetail → CaseCardList → CaseCard
- Direct codebase inspection: `src/types/ftc.ts` — confirmed the four `RemedyType` / `StatutoryTopic` union types that must be updated atomically during reclassification
- Direct data inspection: `public/data/provisions/manifest.json` — confirmed `rt-other` contains 885 provisions (vs PROJECT.md spec of "280 other remedies"); identified the count discrepancy
- Direct data inspection: `public/data/ftc-patterns.json` — confirmed 126 patterns, 43 structural / 83 substantive; identified 45 patterns with 3-4 cases including recent location data and biometric patterns; confirmed 4.0 MB file size
- Project requirements: `.planning/PROJECT.md` — confirmed the four v1.1 target features and their descriptions; confirmed static JSON constraint and build pipeline architecture
- Prior PITFALLS.md research (v1.0) — confirmed the waterfall fetch risk for per-case JSON fetches; informed Pitfall 8 (case provisions panel data architecture)
