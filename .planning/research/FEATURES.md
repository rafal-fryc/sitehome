# Feature Landscape

**Domain:** Legal enforcement database / regulatory provisions library (v1.1 milestone)
**Product:** FTC Enforcement Provisions Library — Data Quality & Case Insights
**Researched:** 2026-02-26
**Overall confidence:** HIGH — grounded in direct codebase inspection, data analysis, and established legal research tool conventions

---

## Context: What This Milestone Is Scoping

This is a SUBSEQUENT MILESTONE on a shipped v1.0 product. The existing features (4-tab architecture, provisions library, patterns browser, industry tab, analytics) are not under scope. Four new features are being added:

1. **Key takeaways** — "what the business did wrong" summaries per case
2. **Remedy reclassification** — 280+ "other" remedies need proper categories (data shows 885 provisions in rt-other, concentrated in ~229 unique titles)
3. **Pattern condensing** — merge similar patterns (12 assessment-pattern variants exist), prune low-value structural patterns (11 structural patterns with < 6 cases), sort by recency
4. **Case provisions panel** — industry tab "View provisions" opens a modal/panel instead of navigating away

---

## Existing Features (Do Not Rebuild)

| Feature | Status |
|---------|--------|
| 4-tab architecture (Analytics, Provisions, Patterns, Industries) | Done |
| Topic-first provisions library with verbatim text, citations, search | Done |
| Industry sector browsing with case cards and comparison | Done |
| Cross-case pattern browser with timelines and word-level diff | Done |
| Analytics dashboard with enforcement trend charts | Done |
| Full-text search (MiniSearch) with topic/all-topics toggle | Done |
| URL-driven state (tab, topic, sector, search query) | Done |
| Classification pipeline (Claude at build time) | Done |
| Remedy type taxonomy with 9 categories (+ "Other") | Done — Other bucket has 885 provisions needing reclassification |

---

## Table Stakes

Features users expect from this milestone. Missing = the milestone delivers no real improvement over v1.0.

### For Key Takeaways

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Brief "what they did wrong" summary on case cards | Industry cards show company name, year, violation type — no plain-English description of the conduct | Low (one new field) | Shown inline on CaseCard; 1-2 sentences max. Source data exists: `complaint.factual_background` and `complaint.counts[]` per case file |
| Full takeaway on case detail or provisions panel | Practitioners need full context when drilling into a case's provisions | Low (same field, more space) | Displayed in the case provisions panel rather than on CaseCard |
| Build-time generation (not runtime) | Consistent with established architecture; browser never calls Anthropic API | Medium (new pipeline script) | New `generate-takeaways.ts` script using Anthropic SDK, same pattern as `classify-provisions.ts` |
| Takeaway stored in `ftc-cases.json` | All case-level data lives there; UI already fetches this file | Low (data shape extension) | Add `key_takeaway: string` field to `EnhancedFTCCaseSummary` |
| Attribution that it is a generated summary | Legal practitioners are sensitive to AI-generated content; must not present as authoritative | Low | Small footnote or badge: "AI-generated summary from FTC complaint" |

### For Remedy Reclassification

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Meaningful category for every remedy provision | 885 provisions labeled "other" are unbrowsable; the rt-other shard is useless to practitioners | High (293 cases × provision review) | Claude proposes new categories at build time; existing pipeline re-run |
| New categories that reflect actual content | Data analysis shows clear natural clusters: Order Administration, Consumer Notification, Consent/Opt-out, Data Retention/Deletion, Breach Notification, Cooperation with Assessor, Disclosure Requirements, Consumer Redress, Consumer Education | Medium (taxonomy design) | See Anti-Features for what NOT to do |
| The rt-other shard shrinks substantially or disappears | Practitioners filtering by remedy type see no results for many topics today because everything is "other" | Medium (pipeline re-run) | After reclassification, rt-other should contain only genuinely unclassifiable provisions |
| Reclassified provisions appear in correct remedy-type shards | Provisions re-emerge in filtered views (remedy type filter in Provisions tab) | Low (pipeline outputs automatically) | No UI changes needed if taxonomy is extended and pipeline re-run |

### For Pattern Condensing

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Merged assessment patterns | 12 variants of "Third-Party [Security/Privacy] Assessments" currently show as separate rows — this is noise | Medium (merge logic in build-patterns.ts) | Merge by semantic similarity, not just prefix; Claude-assisted or rule-based with manual list |
| Merged acknowledgment patterns | 10 variants of order acknowledgment patterns (Order Acknowledgments, Acknowledgments of the Order, Order Delivery and Acknowledgment, etc.) appear separately; all are structural | Medium | One merged "Order Acknowledgment" structural group |
| Pruned low-value structural groups | 11 structural patterns with 3-5 cases each (Annual Certifications, Fees and Costs, Submission Address, etc.) add clutter without informing legal research | Low (filter in build-patterns.ts) | Raise minimum threshold or explicitly suppress these |
| Sort by most recent by default | Already implemented in build-patterns.ts — but may need re-validation after merge/prune changes | Low | Verify `most_recent_year` descending sort survives the changes |

### For Case Provisions Panel

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Provisions for a case accessible from industry tab without leaving | Current "View provisions" navigates to the Provisions tab (generic landing page, not the specific case) — this is a dead end | Medium (modal + data fetching) | The individual case file at `public/data/ftc-files/{case_id}.json` contains all provisions for that case; already fetched individually by the classify script |
| Modal or side panel opens in-context | Practitioners comparing cases in the industry tab lose context when navigating away | Medium (modal component) | shadcn Dialog or Sheet component — both exist in the UI library |
| Case provisions shown with verbatim text and citations | Same standard as the Provisions tab; practitioners expect this | Low (reuse ProvisionCard or a simplified version) | Can reuse existing `ProvisionCard` component or a simpler variant |
| Panel is closeable and returns to case list | Basic modal UX | Low | shadcn Dialog handles this automatically |
| Key takeaway shown in the panel header | First thing practitioners want to know: what did this company do? | Low (if takeaway field is already added) | Depends on key takeaways feature being implemented first |

---

## Differentiators

Features that elevate this beyond "data cleanup" into something genuinely more useful.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Factual-only takeaway framing ("what the FTC alleged") | Avoids the legal liability of AI legal advice; practitioners can trust AI-summarized complaint facts more than AI legal analysis | Low (prompt design) | Frame as: "The FTC alleged that [company] [conduct]..." — factual, not interpretive |
| Pattern canonical variant selection improvement | Currently uses most-common title; after merging similar groups, a curator-selected canonical variant would be more informative | Medium | Could be a build-time configuration file (a JSON map of pattern-id → canonical-variant-index) |
| Provisions panel shows case takeaway + provisions together | No existing legal research tool shows "what they did wrong" and "what they were required to do" side by side in one surface | Low (if data is present) | Unique combination unavailable in FTC's own case browser |
| Newly categorized remedies (post-reclassification) exposed in filter UI | "Data Retention / Deletion", "Consumer Notification", "Consent / Opt-out" become first-class filter options instead of invisible | Low (update REMEDY_TYPE_OPTIONS constant) | The rt-other disappearing is a differentiator because it fills gaps in coverage |

---

## Anti-Features

Things to deliberately NOT build in this milestone.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Runtime LLM calls for takeaway generation | Every page load would depend on Anthropic API availability and response latency — breaks the static-first architecture | Generate at build time in a new pipeline script, store in `ftc-cases.json` |
| AI-generated legal analysis or interpretation | Introduces liability; practitioners distrust AI legal advice; FTC complaint facts are sufficient | Present verbatim complaint facts with a 1-2 sentence summary preamble only |
| Manual curation of all 885 "other" provisions | 885 provisions at human review time is months of work; entirely defeats the purpose | Use Claude to propose categories at build time; human reviews the category taxonomy, not individual provisions |
| New top-level remedy categories for one-off provisions | Adding "Taxpayer Identifying Number Disclosure" as a remedy category would fragment the taxonomy past usability | Consolidate into broader categories (e.g., "Disclosure Requirements") even if imperfect |
| A separate "case detail page" as a new route | Adds routing complexity; the case provisions panel (modal/sheet) achieves the same goal without a URL change | Use shadcn Dialog or Sheet in-place |
| Showing all 293 case takeaways on the industry sector landing page | Volume overwhelms; the list is already paginated by sector | Show takeaway only in the case provisions panel (detail context), not on the card list |
| Fuzzy text similarity for pattern merging at build time | Fuse.js or cosine similarity on 2,194 provision texts is computationally expensive and produces noisy merges at this scale | Use a curated merge map (explicit list of pattern IDs to merge) or Claude-proposed groupings for the specific similar sets identified in data analysis |
| Keeping structural patterns in the condensed browser | Structural patterns (recordkeeping, compliance reporting, etc.) are not what practitioners research; they add noise | Add a toggle to hide structural patterns by default in the patterns browser (or prune the worst ones entirely from the output file) |
| Rebuilding the existing provisions browser | v1.0 provisions browser is working; this milestone is about data quality, not UI rework | Data pipeline changes feed the existing UI automatically |

---

## Feature Dependencies

```
Feature A → Feature B (B requires A)

generate-takeaways.ts pipeline script
  └── key_takeaway field added to EnhancedFTCCaseSummary type
        └── Key takeaway shown in CaseCard (brief)
        └── Key takeaway shown in Case Provisions Panel (full)

Case Provisions Panel (modal/sheet)
  └── Fetches individual case file: public/data/ftc-files/{case_id}.json
        └── Renders provisions from order.provisions[] in that file
        └── Optionally shows key_takeaway from ftc-cases.json (depends on takeaways feature)

Remedy reclassification
  └── Extended RemedyType union in src/types/ftc.ts
        └── Updated REMEDY_TYPE_OPTIONS constant
              └── classify-provisions.ts re-run (or new reclassify-remedies.ts script)
                    └── build-provisions.ts re-run → new/updated rt-* shard files
                          └── manifest.json updated with new remedy type counts
                                └── Provisions tab remedy type filter shows new categories automatically

Pattern condensing
  └── build-patterns.ts updated (merge logic, prune logic, sort validation)
        └── ftc-patterns.json regenerated with fewer, better patterns
              └── FTCPatternsTab renders smaller, more useful set automatically
```

**Critical path for takeaways:** The `key_takeaway` field must be generated and stored in `ftc-cases.json` before any UI work begins. All UI surfaces that show takeaways depend on this data being present.

**Critical path for provisions panel:** The individual case files (`ftc-files/{id}.json`) already exist and have the right structure (`order.provisions[]`). The modal only needs to fetch and render them — no pipeline work required unless takeaways need to be shown.

**Reclassification is independent:** Remedy reclassification is a pure data pipeline change. No UI work is required — the existing Provisions tab remedy filter already reads from shard files. New shards appear in the filter automatically.

**Pattern condensing is independent:** A pure build script change. The PatternsTab renders whatever is in `ftc-patterns.json` — fewer, better patterns just render as a better UI automatically.

---

## MVP Recommendation for v1.1

The minimum coherent delivery that achieves the milestone goal (data quality + case insights):

**Build first (data pipeline):**
1. Remedy reclassification — the highest-leverage improvement: 885 provisions become browsable. Low UI cost, high practitioner value.
2. Pattern condensing — merge the 12 assessment variants into 3-4, merge acknowledgment variants into 1, prune the 11 structural outliers. Low risk, clear criteria.

**Build second (UI):**
3. Case provisions panel — practitioners can drill from the Industry tab into a specific case's provisions without losing context. Moderate UI work, standalone value.
4. Key takeaways — show factual complaint summary on the case provisions panel. Requires pipeline work + UI change, but the pipeline is analogous to classify-provisions.ts and the UI work is small once the panel exists.

**Phase the work this way because:**
- Remedy reclassification and pattern condensing are pure data changes with no UI risk — they make everything else better and can ship first
- Case provisions panel is standalone; its value does not depend on takeaways
- Takeaways are the most complex piece (new pipeline script + LLM calls + new data field + UI) and should be built last when the panel is ready to display them

---

## Data Reality Notes

These are grounded findings from direct data analysis, not assumptions:

| Finding | Implication |
|---------|-------------|
| 885 provisions in rt-other (not 280 as initially stated) | Reclassification scope is larger; Claude batch classification is definitely necessary |
| 229 unique titles in rt-other | Most are clusterable into ~8-10 new remedy categories |
| ~585 of the 885 "other" provisions are order administration items (duration, termination, acknowledgment, jurisdiction) | A new "Order Administration" category would absorb the majority; this is low-controversy |
| 12 assessment-related patterns exist as separate groups | A single merge pass with explicit ID list would reduce to 3-4 meaningful groups |
| 10 acknowledgment-pattern variants exist as separate structural groups | Could merge into 1; all are structural boilerplate |
| 11 structural patterns have < 6 cases | These are noise; prune by raising the structural minimum threshold to 6 |
| Individual case files (`ftc-files/{id}.json`) have `order.provisions[]` with full verbatim text | Case provisions panel can be built without any pipeline changes — just fetch and render |
| Case files have `complaint.factual_background` and `complaint.counts[]` | Rich source material for key takeaways generation exists in every case file |

---

## Research Notes on Legal Research Tool Conventions (v1.1 Focus)

**Case summarization in legal tools:** Tools like CourtListener, Casetext, and Bloomberg Law use AI summarization for case headnotes and summaries but consistently present them as "AI-generated" and factual only. They never assert legal conclusions from summaries. The FTC consent order context is easier than case law because the complaint itself states the alleged misconduct plainly — a good takeaway can be directly derived from `complaint.factual_background` and `complaint.counts[].representation` without interpretation.

**Remedy taxonomy:** Legal databases (Westlaw KeyCite, Bloomberg Law topic classifiers) typically have 15-30 remedy categories for regulatory enforcement databases. The current taxonomy (9 categories + Other) is sparse. Adding 6-8 new remedy types is consistent with industry norms and fills the gaps. The key is that every category must be browsable and meaningful — no category should have < 10 provisions.

**Pattern browsers in legal databases:** The closest analogue is Westlaw's "Citing References" view and Bloomberg's "By Frequency" filter on citing cases. These tools surface the most-cited/most-used language, not all variants. The pattern browser currently shows 126 patterns; condensing to 80-90 meaningful ones with proper merge logic matches industry precedent for "most useful" over "most complete."

**Modal/inline detail in legal tools:** Bloomberg Law and Westlaw both use slide-in panels for case detail previews — users can review a case's content without navigating away from search results. The case provisions panel mirrors this pattern exactly. It is table stakes for research tools at this maturity level.

---

## Sources

- Direct codebase analysis: `src/types/ftc.ts`, `src/components/ftc/industry/CaseCard.tsx`, `src/components/ftc/FTCIndustryTab.tsx`, `scripts/build-patterns.ts`, `scripts/classify-provisions.ts`
- Data inspection: `public/data/ftc-patterns.json` (126 patterns, 2,194 variants), `public/data/provisions/rt-other-provisions.json` (885 provisions, 229 unique titles), `public/data/provisions/manifest.json` (2,783 total provisions across 293 cases)
- Case file structure: `public/data/ftc-files/01.10_onyx_graphics.json` — confirmed `complaint.factual_background`, `complaint.counts[]`, `order.provisions[]` structure
- Domain knowledge: Established conventions of Bloomberg Law, Westlaw, CourtListener, Casetext — case summarization, remedy taxonomy, pattern browsers, inline case detail panels
- Confidence: HIGH — all feature scope directly grounded in existing data and code; no speculative dependencies
