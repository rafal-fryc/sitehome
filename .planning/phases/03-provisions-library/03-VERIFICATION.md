---
phase: 03-provisions-library
verified: 2026-02-25T16:30:00Z
status: human_needed
score: 11/12 must-haves verified
re_verification: null
gaps: null
human_verification:
  - test: "Open /FTCAnalytics?tab=provisions and select any topic. Inspect provision cards — the citation reads 'Part I', 'Part II', etc. Verify whether Part-level granularity is sufficient for the stated requirement. PROV-03 says 'exact paragraph-level citation (e.g., Part II.A.3)' but source data only provides part numbers, not sub-paragraph references. Confirm this is acceptable."
    expected: "User accepts that 'Part I' / 'Part II' constitutes sufficient paragraph-level citation given that sub-paragraph data does not exist in the source files, OR reports that sub-paragraph resolution is required."
    why_human: "Cannot determine from code whether Part-level citation satisfies PROV-03's 'paragraph-level' intent. The source JSON has no paragraph_reference field in requirements[]; only provision_number (Roman numerals) is available. The research notes explicitly acknowledged this limitation. The requirement example 'Part II.A.3' is aspirational — but whether 'Part I' alone meets the spirit of the requirement is a judgment call."
---

# Phase 3: Provisions Library Verification Report

**Phase Goal:** A legal practitioner can select a topic, see every relevant provision across all consent orders, read verbatim order language with exact paragraph-level citations, and filter/search the results to find specific provisions in under 30 seconds
**Verified:** 2026-02-25T16:30:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can see a sidebar listing all 25 topics grouped by Statutory Authority, Practice Area, and Remedy Type with count badges | VERIFIED | `TopicSidebar.tsx` groups manifest topics by category field into 3 sections with Badge counts; wired in `FTCProvisionsTab.tsx` |
| 2 | User can select a topic from the sidebar and see provision cards for that topic | VERIFIED | `FTCProvisionsTab` writes `topic` to URL via `useSearchParams`; `ProvisionsContent` reads it and calls `useProvisionShard(topicMeta.shard)` to fetch and render cards |
| 3 | Each provision card shows a context header with company name, year, docket number, citation, violation type, and a View on FTC.gov link | VERIFIED | `ProvisionCard.tsx` header renders `company_name`, `year`, `docket_number`, `Part {provision_number}`, `violation_type`, and conditional `ftc_url` link — all wired to `ProvisionRecord` fields |
| 4 | Each provision card displays full verbatim order language below the header | VERIFIED | `ProvisionCard.tsx` renders `provision.verbatim_text` via `HighlightText` inside `whitespace-pre-line` div; falls back to summary with "(summary)" label |
| 5 | Before selecting a topic, user sees a landing view with total provision/case counts | VERIFIED | `ProvisionsLanding.tsx` renders `manifest.total_provisions` (2,783) and `manifest.total_cases` (293) from manifest; wired in `FTCProvisionsTab` as `!selectedTopic` branch |
| 6 | The selected topic is persisted in the URL via ?topic= search param | VERIFIED | `FTCProvisionsTab` uses `useSearchParams` to read/write `topic` param; `handleTopicSelect` sets it via `newParams.set("topic", topicSlug)` |
| 7 | User can filter provisions by date range using preset era buttons | VERIFIED | `ProvisionFilterBar.tsx` renders DATE_PRESETS (Last 5 years, Obama era, Trump era, Biden era); `ProvisionsContent` applies `isWithinInterval(parseISO(...))` filter from date-fns |
| 8 | User can filter by company name using typeahead autocomplete | VERIFIED | `CompanyAutocomplete.tsx` uses cmdk Command + Popover; `ProvisionsContent` filters by exact `company_name` match |
| 9 | User can filter by remedy type using multi-select | VERIFIED | `ProvisionFilterBar` uses Popover + Checkbox list for multi-select; `ProvisionsContent` filters by `remedy_types.some(rt => selectedRemedyTypes.includes(rt))` |
| 10 | Active filters shown as dismissible chips with Clear all | VERIFIED | `FilterChips.tsx` renders chips for each active filter with X button; "Clear all" shown when `filters.length > 1` |
| 11 | User can search using text search with scope toggle (This topic / All topics) | VERIFIED | `use-provision-search.ts` builds MiniSearch index; `ProvisionFilterBar` has debounced input + scope toggle; `SearchResults.tsx` handles cross-topic with `useAllProvisionsForSearch` + `useQueries` |
| 12 | Citation shows "exact paragraph-level" reference per PROV-03 | UNCERTAIN | `ProvisionCard` renders "Part {provision_number}" (e.g., "Part I", "Part II"). Source JSON has no sub-paragraph data (`paragraph_reference` field absent in `requirements[]`). REQUIREMENTS.md marks PROV-03 `[x]` complete. Needs human judgment on whether Part-level satisfies requirement intent. |

**Score:** 11/12 truths verified — 1 uncertain (citation granularity)

---

## Required Artifacts

### Plan 01: Data Pipeline

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scripts/build-provisions.ts` | Build pipeline with verbatim text, remedy shards, manifest | VERIFIED | Exists; produces all 26 output files |
| `src/types/ftc.ts` | ProvisionRecord with verbatim_text and violation_type | VERIFIED | Both fields present at lines 122-123; ManifestTopic and ProvisionsManifest at lines 156-168 |
| `public/data/provisions/manifest.json` | 25-topic manifest with counts, labels, categories | VERIFIED | 25 topics: 7 statutory + 8 practice_area + 10 remedy_type; total_provisions=2783, total_cases=293 |
| `public/data/provisions/rt-*.json` (10 files) | Remedy-type shards | VERIFIED | All 10 rt-* files confirmed in directory listing |
| All 15 existing shard files | Updated with verbatim_text and violation_type | VERIFIED | Spot-checked coppa-provisions.json: verbatim_text="Failing to make reasonable efforts..." (actual order language), violation_type="deceptive" |

### Plan 02: Core UI

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/hooks/use-provisions.ts` | Exports useProvisionsManifest and useProvisionShard | VERIFIED | Both exported; fetch /data/provisions/manifest.json and /data/provisions/${shardFilename} with staleTime: Infinity |
| `src/components/ftc/FTCProvisionsTab.tsx` | Main tab with sidebar + content, no placeholder | VERIFIED | Full implementation; no "Coming Soon" — sidebar + landing/content/search branching |
| `src/components/ftc/provisions/TopicSidebar.tsx` | Grouped sidebar with count badges | VERIFIED | Groups by statutory/practice_area/remedy_type; native overflow-y-auto (fixed in plan 05) |
| `src/components/ftc/provisions/ProvisionsLanding.tsx` | Landing with totals and disclaimer | VERIFIED | Shows manifest.total_provisions + total_cases; disclaimer banner present |
| `src/components/ftc/provisions/ProvisionsContent.tsx` | Paginated provision list | VERIFIED | PAGE_SIZE=50, pagination controls wired; all filter/sort state managed here |
| `src/components/ftc/provisions/ProvisionCard.tsx` | Provision card with header + verbatim text | VERIFIED | Header: company, year, docket, Part citation, violation type, FTC.gov link; body: HighlightText wrapping verbatim_text |

### Plan 03: Filtering

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/ftc/provisions/ProvisionFilterBar.tsx` | Sticky filter bar | VERIFIED | sticky top-0 z-10; search input, scope toggle, DATE_PRESETS, CompanyAutocomplete, remedy type popover, sort popover, result count |
| `src/components/ftc/provisions/FilterChips.tsx` | Dismissible filter chips | VERIFIED | Renders FilterChip[] with X buttons; "Clear all" conditional on length > 1 |
| `src/components/ftc/provisions/CompanyAutocomplete.tsx` | cmdk typeahead | VERIFIED | Popover + Command + CommandInput pattern |
| `src/constants/ftc.ts` | DATE_PRESETS and REMEDY_TYPE_OPTIONS | VERIFIED | Both constants exported; 4 presets, 10 remedy types matching RemedyType union |

### Plan 04: Search

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/hooks/use-provision-search.ts` | MiniSearch index hook | VERIFIED | Imports MiniSearch; indexes title, summary, verbatim_text; exports useProvisionSearch and useAllProvisionsForSearch |
| `src/components/ftc/provisions/HighlightText.tsx` | Safe text highlighting | VERIFIED | Regex-based split with escapeRegex(); uses `<mark>` element; no dangerouslySetInnerHTML |
| `src/components/ftc/provisions/SearchResults.tsx` | Cross-topic search results grouped by topic | VERIFIED | useAllProvisionsForSearch + useProvisionSearch; groups by _shardTopic; top 5 per group; "View all N in Topic" link |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `use-provisions.ts` | `/data/provisions/manifest.json` | `fetch("/data/provisions/manifest.json")` | WIRED | Line 8: exact fetch call |
| `use-provisions.ts` | `/data/provisions/*.json` | `fetch(\`/data/provisions/${shardFilename}\`)` | WIRED | Line 21: template literal fetch |
| `FTCProvisionsTab.tsx` | `use-provisions.ts` | `import { useProvisionsManifest }` | WIRED | Line 3: import present; used at line 11 |
| `FTCTabShell.tsx` | `FTCProvisionsTab.tsx` | `TabsContent value="provisions"` | WIRED | Line 6 import; line 68-70 render in TabsContent |
| `ProvisionsContent.tsx` | `ProvisionFilterBar.tsx` | Renders `<ProvisionFilterBar>` with all filter state | WIRED | Lines 285-306: ProvisionFilterBar with all props passed |
| `ProvisionFilterBar.tsx` | `CompanyAutocomplete.tsx` | Renders `<CompanyAutocomplete>` | WIRED | Line 180-184: imported and rendered |
| `ProvisionsContent.tsx` | `date-fns` | `parseISO` and `isWithinInterval` | WIRED | Line 2: import; lines 111-118: date filter applied |
| `use-provision-search.ts` | `minisearch` | `import MiniSearch from "minisearch"` | WIRED | Line 3: import; npm package confirmed in package.json |
| `ProvisionsContent.tsx` | `use-provision-search.ts` | `useProvisionSearch(shardProvisions)` | WIRED | Line 4: import; line 55: hook called; lines 91-95: search applied |
| `FTCProvisionsTab.tsx` | `SearchResults.tsx` | Renders `<SearchResults>` when scope="all" | WIRED | Line 7: import; lines 93-99: rendered in showCrossTopicSearch branch |
| `ProvisionCard.tsx` | `HighlightText.tsx` | Wraps verbatim_text and title in HighlightText | WIRED | Line 3: import; lines 51 and 59: both title and displayText wrapped |

---

## Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|---------|
| PROV-01 | 03-02, 03-05 | User can browse provisions by selecting a topic | SATISFIED | TopicSidebar + ProvisionsContent: 25 topics, 3 categories, shard loading wired |
| PROV-02 | 03-01, 03-02, 03-05 | Each provision displays verbatim quoted order language | SATISFIED | verbatim_text field in ProvisionRecord; sourced from requirements[].quoted_text; rendered as primary content in ProvisionCard |
| PROV-03 | 03-02, 03-05 | Exact paragraph-level citation + FTC.gov link | PARTIAL — NEEDS HUMAN | "Part {provision_number}" renders Part-level only (e.g., "Part I"). Source data lacks sub-paragraph references. ftc_url link is wired and working. See human verification item. |
| PROV-04 | 03-01, 03-02, 03-05 | Card shows company name, date, docket number, violation type | SATISFIED | All 4 fields present in ProvisionCard header; violation_type conditionally shown |
| PROV-05 | 03-03, 03-05 | Filter by date range | SATISFIED | 4 era presets; custom range supported; date-fns isWithinInterval in ProvisionsContent useMemo |
| PROV-06 | 03-03, 03-05 | Filter by company name | SATISFIED | CompanyAutocomplete with cmdk; exact match filter in ProvisionsContent |
| PROV-07 | 03-03, 03-05 | Filter by remedy type | SATISFIED | Popover+Checkbox multi-select; array intersection filter in ProvisionsContent |
| PROV-08 | 03-03, 03-05 | Sort by date, company, or provision type | SATISFIED | Sort popover with date/company/type options; asc/desc direction toggle |
| PROV-09 | 03-04, 03-05 | Text search using MiniSearch | SATISFIED | MiniSearch installed (v7.2.0); indexes title+summary+verbatim_text; scope toggle; cross-topic search with useAllProvisionsForSearch |
| PROV-10 | 03-02, 03-03, 03-04, 03-05 | Display total count of matching provisions and cases | SATISFIED | ProvisionsContent: "Showing X-Y of N provisions from M cases (filtered from T total)"; ProvisionFilterBar: "Showing N of T provisions from M cases"; SearchResults: "N matching provisions across M cases in K topics" |

**All 10 PROV requirements accounted for.** No orphaned requirements. No requirements declared for Phase 3 outside PROV-01 through PROV-10.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `ProvisionFilterBar.tsx` | 113 | `placeholder="Search provisions..."` | Info | HTML input placeholder attribute — NOT a code stub |
| `CompanyAutocomplete.tsx` | 50 | `placeholder="Search company..."` | Info | HTML input placeholder attribute — NOT a code stub |

No actual stubs, empty implementations, or TODO/FIXME markers found in any Phase 3 file. All component returns render substantive content.

---

## Human Verification Required

### 1. Paragraph-Level Citation Granularity (PROV-03)

**Test:** Open `/FTCAnalytics?tab=provisions&topic=coppa`. Inspect any provision card's gold citation text. It will read "Part I", "Part II", "Part III", etc.

**Expected:** Confirm that Part-level citation is acceptable for the tool's use case. Legal practitioners using this tool need to locate provisions within consent orders — Part-level citations are sufficient to navigate to the right section of a consent order PDF, even without sub-paragraph granularity.

**Why human:** The REQUIREMENTS.md example says "Part II.A.3" but the FTC consent order source data (from PDF extraction) does not contain sub-paragraph references — only provision-level (Part I, II, III). The research notes explicitly acknowledged this and stated the implementation should use `provision_number` with "Part {provision_number}" format. The requirement is marked `[x]` complete in REQUIREMENTS.md. However, the stated spec example ("Part II.A.3") differs from the actual output ("Part I"). Only the practitioner/product owner can confirm the current granularity meets their research needs.

---

## Gaps Summary

No blocking gaps found. All 12 artifacts exist, are substantive (not stubs), and are correctly wired. All filtering, sorting, and search pathways were traced end-to-end in code.

The single uncertain item is PROV-03 citation granularity — a data limitation acknowledged in research, not an implementation deficiency. The source PDF-extracted data contains provision-level (Roman numeral) references only; sub-paragraph references are structurally absent. This needs confirmation that the Part-level output is acceptable.

---

_Verified: 2026-02-25T16:30:00Z_
_Verifier: Claude (gsd-verifier)_
