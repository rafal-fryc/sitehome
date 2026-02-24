# Domain Pitfalls

**Domain:** Legal enforcement database / regulatory provisions library
**Product:** FTC Enforcement Provisions Library (Milestone 2)
**Researched:** 2026-02-24
**Research Mode:** Pitfalls dimension — specific to data classification pipelines, legal research tools, and client-side analytics over structured datasets

---

## Critical Pitfalls

Mistakes that cause rewrites, produce legally misleading output, or block the entire provisions library from working.

---

### Pitfall 1: Keyword Matching That Reads Across Case Boundaries ("Privacy" Classifies Everything)

**What goes wrong:** The existing `classifyCategories` function runs keyword matching against `factual_background`, which is a dense block of English prose. When you extend this same approach to provision-level classification, the word "privacy" appears in nearly every data-related consent order — in phrases like "privacy policy violations," "privacy representations," "privacy practices of the company," and as boilerplate in monitoring/reporting provisions. The result: 70-80% of provisions get tagged as "Privacy / Deceptive Privacy Practices" regardless of their actual topic, collapsing the three-axis taxonomy into noise.

**Why it happens:** Provision text and factual background text serve different purposes. Factual background describes what the company did. Provision text describes what the company must now do. The signal for topic classification is different: for a provision, the legal_authority field is authoritative (it names the statute precisely), but the provision's own quoted_text and requirements[].description contain boilerplate that appears in every order regardless of topic.

**Consequences:**
- Topic-first browsing returns hundreds of "Privacy" provisions on every topic page because the label is too broad
- Three-axis taxonomy appears populated but is actually collapsed — practitioners get noise, not signal
- Users cannot distinguish COPPA, GLBA, Health Breach, and generic Privacy cases from each other
- Classification work must be redone after UI is built, causing cascading data model changes

**Prevention:**
1. **Classify provisions against structured fields first, prose second.** For statutory topic: use the case's `legal_authority` string, which is highly specific ("Children's Online Privacy Protection Act, 15 U.S.C. § 6502" is unambiguous). For remedy type: use `provision.category` (already structural: `prohibition`, `affirmative_obligation`, `assessment`, `compliance_reporting`, `recordkeeping`, `monitoring`) plus provision title keywords ("security program," "algorithmic destruction," "data deletion"). Prose matching is a fallback, not the primary signal.
2. **Treat "Privacy" as a residual category, not a match condition.** If no more specific statutory match fires, then "Privacy" is appropriate. If a more specific match fires (COPPA, GLBA, FCRA, Health Breach), do not additionally tag "Privacy."
3. **Test classification with specific queries before building UI.** Before any UI work begins, verify that a query like `topic=COPPA` returns only COPPA-specific provisions, not every provision from a case where COPPA was one of several charges. Build a classification test script that outputs per-topic counts — if "Privacy" count exceeds "Data Security" count by 10x, something is wrong.

**Detection (warning signs):**
- Topic selector shows 60%+ of provisions under a single "Privacy" bucket
- The "Data Security" topic and "Privacy" topic have nearly identical provision lists
- Provisions from telemarketing cases (TSR violations) appear under "Privacy"

**Phase:** Address in the data pipeline phase (before any UI is built). Classification correctness is a prerequisite for every downstream feature.

---

### Pitfall 2: Flat Provisions File Grows to 10-15 MB, Breaking Page Load

**What goes wrong:** The STACK.md estimates ~7.5 MB for a flat `ftc-provisions.json` that includes all 293 cases' provisions with denormalized quoted_text. This estimate assumes ~5,000 provisions at ~1,500 bytes each. The actual Grep count shows 9,224 `quoted_text` fields across 292 files — each `quoted_text` in a requirement averages 300-500 characters, but provision-level `summary` fields add another 200-400 characters, and denormalized case metadata (company_name, factual_background excerpt, legal_authority) adds more. The real file may be 12-18 MB uncompressed and 2.5-4 MB gzipped. At 3-4 MB of blocking JSON, first load on a 10 Mbps connection (common for practitioners working on VPN or from courts) is 2.5-3 seconds just for the provisions payload — before any rendering.

**Why it happens:** The temptation is to emit one flat file containing everything the UI might need, because it's simple. But quoted_text is verbose. The `09.25_pornhubmindgeekaylo.json` file alone has 119 `quoted_text` instances, and `05.24_cerebral_and_kyle_robertson.json` has 87. The heaviest cases drive total file size disproportionately.

**Consequences:**
- Provisions library feels slow compared to the existing FTC Analytics page (which loads a 362 KB JSON)
- Users notice the loading spinner — practitioners expect Westlaw/LexisNexis speeds
- Vercel's free tier serves large assets fine, but the browser parse time for 10-18 MB of JSON is additional latency on top of download time

**Prevention:**
1. **Split the flat provisions output by topic at build time.** Instead of `ftc-provisions.json`, emit `ftc-provisions-data-security.json`, `ftc-provisions-coppa.json`, etc. Each file is only loaded when a user navigates to that topic. A topic like "Data Security" may have 80-120 provisions; its file is 500-800 KB compressed — loads in under 100ms.
2. **Keep the summary index separate from provision detail.** `ftc-provisions-index.json` contains provision titles, case names, dates, topic tags, and paragraph citations (everything needed to render the topic landing page and enable filtering). `ftc-provisions-detail/{id}.json` contains the full quoted_text (loaded on demand when a practitioner clicks a provision for detail). This is a lazy-loading pattern.
3. **The build pipeline should emit file size stats** so size regressions are detected immediately, not after the UI is built.

**Detection (warning signs):**
- `ftc-provisions.json` exceeds 5 MB uncompressed
- Chrome DevTools Network tab shows provisions JSON as the largest single payload
- Users report "slow to load" on the provisions browsing page but not on the existing analytics page

**Phase:** Address in the data pipeline phase when designing the output format. Retrofitting the file structure after UI is built requires changing every fetch call.

---

### Pitfall 3: Provision Citations Are Wrong Because the JSON Source Is an Imperfect Extraction

**What goes wrong:** The JSON data was generated by an offline LLM extraction pipeline from consent order PDFs. The `quoted_text` fields contain transcription artifacts — scan errors, OCR artifacts, and extraction inconsistencies visible in the Assail sample ("The Defendat is affliated with Masterard, any other credit card or debit card company, or a ban or other financial institution;" — "Defendat," "affliated," "Masterard," "ban" are all extraction errors). If this garbled quoted text appears verbatim in a provision card labeled as an FTC citation, a practitioner will immediately recognize it as wrong and distrust the entire tool.

**Why it happens:** PDF-to-text extraction of legal documents is lossy. Consent orders use multi-column layouts, footnotes, special characters, ligatures, and small fonts that confuse OCR. The extraction pipeline accepted its output at face value. The data is good enough for case-level categorization and analytics (where individual word errors don't matter) but inadequate for presenting verbatim quotations as authoritative legal citations.

**Consequences:**
- Practitioner quotes garbled text in a memo and is corrected or embarrassed
- Tool loses credibility immediately with the target audience (attorneys who will spot errors in seconds)
- Error correction is a manual/semi-automated process across hundreds of files — cannot be fixed programmatically without re-extracting from source PDFs

**Prevention:**
1. **Visually distinguish "extracted text" from "verified quotation."** Label provision quoted_text as "Extracted language — verify against source order" and make the FTC.gov link the prominent primary CTA ("Read the full order at FTC.gov"). Do not present extracted text with the same visual treatment as a verified legal citation.
2. **Surface the `confidence` field already in the data.** Requirements objects already have `"confidence": 1.0` or lower values. When `confidence < 0.9`, add an explicit "Low confidence extraction" indicator on the provision card. Practitioners then know to double-check.
3. **In the provision detail card UI, always show the paragraph reference AND the FTC.gov link as equal-weight elements.** Never show quoted text without the clickable source link adjacent to it.
4. **Do not claim this is a citeable legal database.** The tool header/about text should be explicit: "Provision text extracted from consent orders via automated pipeline. Always verify against the official order document." This is a disclosure, not a caveat that undermines the tool — it's what responsible legal tech does.

**Detection (warning signs):**
- Provision cards showing misspelled words in "quoted" order language
- `confidence` field below 1.0 on more than 10% of requirements objects
- Requirements with garbled words visible in the raw JSON (already confirmed in Assail sample)

**Phase:** Address in the UI design phase (provision card component). Also requires a documentation/disclaimer phase. Does NOT require fixing the underlying JSON (that would require re-running the extraction pipeline).

---

### Pitfall 4: Three-Axis Taxonomy That Does Not Match How Practitioners Actually Search

**What goes wrong:** The PROJECT.md defines three axes: Statutory (COPPA, FCRA, GLBA, etc.), Practice Area (Privacy, Data Security, Deceptive Design, AI/ADM, Surveillance), and Remedy Type (Monetary Penalties, Algorithmic Destruction, Data Deletion, etc.). The pitfall is that Statutory and Practice Area heavily overlap — a COPPA case is always a Privacy/Children's Privacy case; a GLBA case is always a Data Security/Financial Privacy case. This creates a taxonomy that looks comprehensive but doubles user confusion: should they click "COPPA" or "Children's Privacy" to find children's data cases? If both exist as separate navigation entries, practitioners will try both and get frustrated when they find nearly identical result sets.

**Why it happens:** Three axes sounds thorough in planning. In practice, legal practitioners have two distinct mental models: (1) statutory/regulatory authority ("what law applies"), and (2) what the order requires them to do ("what must we implement"). The Practice Area axis sits between these and belongs to neither — it's a categorization layer that makes sense to researchers but not to practitioners researching compliance program requirements.

**Consequences:**
- Topic selector has 25+ entries, many of which practitioners cannot distinguish
- "Data Security" (practice area) and "FCRA" (statutory) both return cases with security program provisions, and practitioners don't know which to use
- Taxonomy grows unwieldy; maintenance becomes expensive as new cases don't cleanly fit existing categories

**Prevention:**
1. **Reduce to two orthogonal axes: Statutory Authority and Remedy Type.** These are non-overlapping. A case's statutory authority is specific and clear from the `legal_authority` field. The remedy type is what the order actually requires (not what law it's under). Drop the Practice Area axis or collapse it into Statutory.
2. **Make the topic selector opinionated about primary entry points.** Instead of listing all 25 taxonomy entries equally, group them: "Browse by statute" (COPPA, FCRA, GLBA, Section 5 FTC Act, TCPA...) and "Browse by what the FTC required" (Data deletion, Security program, Monetary penalty, Algorithmic destruction...). Two clear entry points, not a flat list.
3. **Validate the taxonomy against real practitioner questions before implementing.** The two real questions practitioners ask: "What has the FTC required under COPPA?" (statutory axis) and "What does a comprehensive security program provision actually say?" (remedy type axis). Test whether both axes answer distinct questions before building both.

**Detection (warning signs):**
- Taxonomy has two axes with >60% overlap in which cases they return for the same company
- User testing shows confusion at the topic selector (practitioners ask "what's the difference between 'Data Security' and 'Safeguards Rule'?")
- More than 5 taxonomy entries that return fewer than 3 provisions each (indicates over-categorization)

**Phase:** Address at the start of the data pipeline phase, before writing the classification rules. Wrong taxonomy means reclassifying all 293 cases twice.

---

## Moderate Pitfalls

Mistakes that produce a worse tool or cost a sprint to fix, but do not require rewrites.

---

### Pitfall 5: Client-Side Filtering Over a Full Provisions List Appears Instant in Dev, Lags in Production

**What goes wrong:** In development with the Vite dev server and hot module replacement, JSON is served from the local filesystem and React renders on a fast development machine. Client-side filter operations over 5,000 provisions return instantly. In production on a user's browser (especially mid-range hardware or a work laptop with many tabs open), filter operations that recompute on every keystroke in a text input cause 100-300ms UI lag. For a tool that practitioners use to narrow from 200 provisions to the 12 they care about, filter lag is directly noticeable.

**Prevention:**
1. **Debounce all text-based filter inputs** with a 200-300ms delay. React's `useState` updating on every keypress forces re-renders; `useDeferredValue` or a debounce hook prevents this.
2. **Memoize filtered provision arrays with `useMemo`** using filter criteria as dependencies, so re-renders from unrelated state don't recompute the filter.
3. **Test filter performance with the full production dataset** (not mock data) on the slowest realistic hardware before the feature ships. Use Chrome's performance profiler CPU throttling (6x slowdown) to simulate mid-range hardware.
4. **For the search index specifically:** MiniSearch's `search()` call is synchronous and fast at this corpus size (~5,000 provisions), but if indexing is done at component mount time (not at data load time), a re-mount causes a re-index. Index once in the data loading hook, cache the index in a `useRef` or module-level cache.

**Detection (warning signs):**
- Filter operations feel slightly "lagging" in dev on battery saver mode
- React DevTools Profiler shows filter-triggered re-renders taking >50ms
- Provision list visibly "jumps" after typing stops rather than updating smoothly

**Phase:** Provisions browsing UI phase. Implement debounce and memoization from the start, not as a performance fix after the fact.

---

### Pitfall 6: Boilerplate Detection Flags Standard Order Language as a "Pattern"

**What goes wrong:** Nearly every FTC consent order contains the same standard monitoring, reporting, and recordkeeping provisions — required by the FTC's standard order language regardless of the underlying violation. The "compliance reporting" provision in a telemarketing order and a COPPA order use near-identical boilerplate. If the pattern detection algorithm flags these as a "reused language pattern," it produces a meaningless finding: "the FTC uses the same recordkeeping boilerplate in every order." This is true, trivially, and uninformative to practitioners.

**Why it happens:** String similarity across provisions will inevitably cluster on the boilerplate (monitoring, reporting, recordkeeping, acknowledgment provisions) because those are the most uniformly similar text in the corpus. The substantively interesting patterns are the substantive provisions — security program requirements, algorithmic destruction language — but these are structurally less similar because they must be tailored to each respondent.

**Consequences:**
- Pattern library shows 60% "patterns" that are just standard order boilerplate
- Practitioners get noise instead of signal on the language evolution page
- The feature requires manual curation to be useful, which was not budgeted

**Prevention:**
1. **Exclude structural provision types from pattern detection by default.** Do not run similarity analysis on `category: "compliance_reporting"`, `category: "recordkeeping"`, `category: "acknowledgment"`, `category: "monitoring"`, or `category: "duration"` provisions. These are administrative boilerplate. Only run pattern detection on `prohibition` and `affirmative_obligation` provisions.
2. **Define patterns statically, not discovered dynamically.** The PROJECT.md scope is to show how "comprehensive security program" boilerplate evolves. Define 5-10 named patterns explicitly (comprehensive security program, algorithmic destruction, data deletion, biometric ban, third-party assessment requirement, children's data prohibition). Match provisions to these patterns by title keywords and legal authority. Do not attempt open-ended clustering.
3. **Validate that each named pattern returns fewer than 40 provisions** (otherwise it's too broad) and more than 3 (otherwise it's too rare to show evolution).

**Detection (warning signs):**
- Pattern detection output shows "compliance reporting" or "acknowledgment" as the most common patterns
- Pattern named "comprehensive security program" returns 150+ provisions (too broad — reduce keyword specificity)
- Pattern preview shows provisions from cases with no data security charge

**Phase:** Data pipeline phase when implementing the pattern extraction function.

---

### Pitfall 7: Trend Charts at the Topic Level Have Too Few Data Points to Be Meaningful

**What goes wrong:** The existing analytics page shows enforcement by year across all 285 cases, producing a meaningful bar chart (1997-2025, enough data points to see trends). When you filter to a single topic (e.g., "AI / Algorithmic"), there may be only 8-15 cases over a 6-year period. A bar chart of 8 points isn't a trend — it's a table. Labeling it "Enforcement Trends" misleads practitioners into thinking they're seeing a signal when they're seeing noise.

**Prevention:**
1. **Show raw counts, not trend lines, when n < 20 per topic.** Reserve trend visualization for topics with enough historical data (Data Security, Privacy, COPPA). For low-volume topics (AI/ADM, Surveillance), show a simple count table annotated with years instead of a chart that implies false precision.
2. **Use year groupings (2-year bins) for sparse topics** to avoid single-year bars of 1-2 cases that look like meaningful variation.
3. **Label charts clearly with the data sample size:** "Showing 12 enforcement actions (2018-2025)" tells practitioners that this is not a statistically robust trend.

**Detection (warning signs):**
- AI/ADM topic trend chart shows bars of height 1 or 2 for most years
- Administration-era comparison on narrow topics shows 1-2 cases per administration
- Chart looks identical whether viewed as "trend" or as raw data points

**Phase:** Analytics / charts phase. Design chart components to inspect data count before choosing visualization type.

---

### Pitfall 8: FTC.gov URLs Break for Older Cases

**What goes wrong:** The PROJECT.md constraint states "Provision citations must reference exact paragraph numbers and include working FTC.gov URLs — no approximations." The `ftc_url` field in the JSON contains FTC.gov case URLs. FTC.gov has reorganized its case proceedings database at least twice since 2001. URLs in the data for cases from the early 2000s (Clinton/G.W. Bush administrations) may return 404 or redirect chains. Displaying broken source links next to provision text destroys practitioner trust immediately.

**Prevention:**
1. **Do not assume all FTC.gov URLs are valid.** Add a URL validation pass to the build pipeline (simple HTTP HEAD check against each `ftc_url`) that emits a report of broken URLs before the build is committed. This can run as an optional pipeline step (`--validate-urls` flag) since it makes network requests.
2. **For cases with `ftc_url: null` or broken URLs, link to the FTC legal library search for that docket number** (`https://www.ftc.gov/legal-library/browse/cases-proceedings/{docket_number}`). The FTC legal library search is stable even when direct case URLs change.
3. **Display the docket number visibly on every provision card** even when a URL exists. Practitioners can independently look up any case by docket number — it's the permanent identifier.

**Detection (warning signs):**
- Cases from before 2005 having `ftc_url` values that use a different URL pattern than post-2010 cases
- Manual spot-check of 10 older case URLs finds 2-3 returning 404
- FTC.gov URL format includes deprecated path components (check for `/os/caselist/` vs `/legal-library/browse/cases-proceedings/`)

**Phase:** Data pipeline phase (add URL validation) and UI design phase (docket number as fallback citation). Pre-launch verification step.

---

### Pitfall 9: Individual Case JSON Fetches Cause a Waterfall of Network Requests

**What goes wrong:** The current architecture fetches one `ftc-cases.json` (362 KB) for the analytics page. The provisions library might be designed to load individual case JSON files on demand — when a user clicks a provision, fetch `public/data/ftc-files/{case-id}.json` to get the full order text. This seems lazy and efficient. But when a user filters to "COPPA provisions" and the result set contains 25 cases, the UI triggers 25 parallel fetches for 25 individual JSON files, each 20-80 KB. Browsers cap parallel connections to the same origin at 6-8. The user sees a cascade of loading spinners as case files load in batches of 6.

**Prevention:**
1. **The build pipeline should emit a flat `ftc-provisions.json` (or topic-sharded versions) that contains all provision data needed for the browsing UI, without requiring any additional per-case fetches.** Individual case JSON files are only needed for download by developers; the provisions UI should be self-contained from the pre-built aggregated output.
2. **If per-provision detail fetch is required** (for full order definitions, full complaint counts, etc.), lazy-load it only when a user explicitly requests a "full case view" — not for the provision card display. The provision card can render entirely from denormalized data in the aggregated file.
3. **Profile the network waterfall in production** (not local dev, where all files are served from disk instantly) before shipping the provisions browsing UI.

**Detection (warning signs):**
- DevTools Network tab shows 20+ individual `.json` fetches triggered by a topic page load
- Loading state lasts >1 second for a filtered topic view even on fast connections
- Provision cards appear in batches rather than simultaneously

**Phase:** Data pipeline phase (design the denormalized aggregated format) and provisions UI phase (ensure components don't trigger per-case fetches).

---

## Minor Pitfalls

Mistakes that require a few hours to a day to fix.

---

### Pitfall 10: URL State Broken for Provisions With Special Characters in Topic Names

**What goes wrong:** Topic names like "AI / Algorithmic / Facial Recognition" and "Gramm-Leach-Bliley" contain characters that require URL encoding (`/`, `-`). React Router's `useSearchParams` handles encoding, but if topic keys are derived from the human-readable label string rather than a slug, URL params look like `?topic=AI+%2F+Algorithmic+%2F+Facial+Recognition`, which are ugly, brittle, and break when topic labels change.

**Prevention:** Define stable machine-readable slugs for each taxonomy entry separate from display labels (`"ai-algorithmic"` as the URL key, `"AI / Algorithmic / Facial Recognition"` as the display label). Use the slug in URL params. Changes to display labels never break existing bookmarked URLs. This is a one-time design decision in the taxonomy data structure.

**Phase:** Data pipeline phase (add `slug` field to taxonomy constants) and URL routing design.

---

### Pitfall 11: Provision Count Display Misleads Because One Case Can Appear Under Multiple Topics

**What goes wrong:** "289 provisions in Data Security" sounds authoritative. But a single data security case with 22 provisions can have 14 of those provisions also tagged under "Privacy." If a user filters to "Data Security" AND "Privacy" expecting to narrow results, the count may not decrease meaningfully, because the overlap is large. This is confusing if not surfaced.

**Prevention:** On the topic selector screen, show provision counts as unique provisions within that topic (not deduplicated cross-topic). When filtering by multiple topics simultaneously (AND vs OR logic), display the count update in real-time so the user sees narrowing is working. Document the intersection behavior in a tooltip.

**Phase:** Provisions browsing UI phase.

---

### Pitfall 12: The Law Library Aesthetic Breaks Under Dense Provision Tables

**What goes wrong:** The existing FTC Analytics page is primarily charts and summary cards — sparse layout. The provisions library renders dense tables with long quoted text, multiple badge rows (topic tags, remedy types), and multi-column case metadata. EB Garamond at 16px on a cream background reads beautifully in sparse contexts. In a dense provisions table with 30+ rows and multi-line cells, the lack of visual separation makes it hard to scan. Legal research tool aesthetics require clear horizontal rule demarcation between rows, strong typographic hierarchy for cited text, and narrow-enough columns that the eye doesn't have to sweep far.

**Prevention:**
1. Design provision cards (not tables) as the primary browsing format for the topic view. Cards handle variable-length quoted text and metadata better than table rows.
2. Test layout with actual provision data (not Lorem Ipsum placeholders) — the variance in quoted_text length (50 chars to 800 chars) is the real challenge.
3. Use the `border-rule` border color already in the project for horizontal dividers. Add subtle alternating background on table rows only when list density exceeds 20 rows.

**Phase:** Provisions browsing UI phase.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|----------------|------------|
| Data pipeline: provision classification | Pitfall 1 (keyword matching too broad, "Privacy" captures everything) | Prioritize structured fields (legal_authority, provision category) over prose matching; validate per-topic counts before UI work |
| Data pipeline: output format design | Pitfall 2 (single flat file becomes 12+ MB) | Topic-shard output files; separate index from detail payload |
| Data pipeline: pattern detection | Pitfall 6 (boilerplate clusters dominate patterns) | Exclude structural provision categories; use statically-defined pattern names |
| Data pipeline: FTC URL handling | Pitfall 8 (old case URLs broken) | Validate URLs in pipeline; always surface docket number as fallback |
| Data pipeline: taxonomy design | Pitfall 4 (overlapping axes confuse practitioners) | Reduce to Statutory + Remedy Type; validate axes are orthogonal before building classification rules |
| Provisions browsing UI: performance | Pitfall 5 (filter lag on real hardware) | Debounce inputs, memoize filtered arrays, test on CPU-throttled Chrome |
| Provisions browsing UI: network | Pitfall 9 (waterfall of per-case fetches) | Ensure all provision card data comes from pre-aggregated file, no per-case fetches needed |
| Provisions browsing UI: URL routing | Pitfall 10 (special characters in topic names break URL params) | Define slugs in taxonomy constants, never derive URL keys from display labels |
| Provisions browsing UI: citations | Pitfall 3 (garbled extracted text presented as authoritative quotes) | Label all extracted text as unverified; make FTC.gov source link the primary citation |
| Analytics / charts phase | Pitfall 7 (trend charts meaningless for sparse topics) | Conditionally render chart vs count table based on n; label data sample size clearly |
| Pre-launch verification | Pitfall 8 (FTC.gov URLs broken for old cases) | Run URL validation pipeline step against all 285 case URLs before deployment |

---

## Sources

- Direct codebase inspection: `scripts/build-ftc-data.ts` — identified the existing keyword classification approach and its extension risks
- Direct data inspection: `public/data/ftc-files/01.05_assail.json` — confirmed OCR/extraction artifacts in `quoted_text` fields (garbled words present in 2005 case)
- Direct data inspection: Grep count of `quoted_text` across 292 files — confirmed 9,224 instances, establishing actual corpus scale for performance risk assessment
- Codebase inspection: `src/types/ftc.ts`, `src/hooks/use-ftc-data.ts`, `src/components/ftc/FTCGroupDetail.tsx` — confirmed current fetch architecture and memoization patterns
- Project requirements: `.planning/PROJECT.md` — confirmed citation accuracy constraint and URL requirement
- Existing research: `.planning/research/STACK.md` — MiniSearch choice and denormalized provisions file design inform Pitfalls 5 and 9
- Domain conventions: Legal research tool UX patterns (Westlaw, CourtListener) — inform Pitfall 3 (citation standards) and Pitfall 12 (dense layout)
- Data scale observation: The 30 highest-count files (betterhelp 82, cerebral 87, pornhub 119 quoted_text fields) demonstrate that per-case file sizes vary significantly, informing Pitfall 2
