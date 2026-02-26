# Codebase Concerns

**Analysis Date:** 2026-02-26

## Tech Debt

**Duplicated logic between scripts and constants:**
- Issue: `ADMINISTRATIONS` array, `getAdministration()` function, and `CATEGORY_RULES` / `classifyCategories()` are defined once in `src/constants/ftc.ts` for the app, then duplicated inline in both `scripts/build-ftc-data.ts` and `scripts/build-provisions.ts` with a comment explaining the duplication ("Inline types to avoid path alias issues in tsx scripts"). This means bug fixes must be applied in multiple places.
- Files: `src/constants/ftc.ts`, `scripts/build-ftc-data.ts`, `scripts/build-provisions.ts`
- Impact: If an administration date range or category keyword changes, developers must update three files. The scripts currently use slightly different regex patterns for filename date parsing.
- Fix approach: Create a shared `scripts/shared.ts` (no path aliases, plain relative imports) that both scripts and the app can import.

**Hardcoded absolute path in build script:**
- Issue: `build-ftc-data.ts` has `const FTC_SOURCE = path.resolve("C:/Users/rafst/Documents/projectas/FTC/output_v2");` — a machine-specific absolute path hardcoded at line 103. The script will fail silently on any other machine or if the directory moves.
- Files: `scripts/build-ftc-data.ts`
- Impact: Build scripts are not portable. Any collaborator or CI environment cannot run `npm run build:ftc-data` or `npm run build:data`.
- Fix approach: Move to an environment variable with a fallback: `const FTC_SOURCE = process.env.FTC_SOURCE ?? path.resolve("../FTC/output_v2");` or a config file.

**Inline types in build scripts instead of shared imports:**
- Issue: All interfaces (`ProvisionRecord`, `PatternGroup`, etc.) are fully re-declared inline in `scripts/build-patterns.ts` and `scripts/build-provisions.ts` rather than importing from `src/types/ftc.ts`. The comment explicitly says this is to "avoid path alias issues in tsx scripts."
- Files: `scripts/build-patterns.ts`, `scripts/build-provisions.ts`, `src/types/ftc.ts`
- Impact: Type definitions can diverge silently. If a field is added to `ProvisionRecord` in `src/types/ftc.ts`, the build scripts won't pick it up.
- Fix approach: Configure `tsconfig.json` to support `paths` resolution in the scripts context, or use a relative import path without aliases.

**`FTCDataPayload.cases` typed as `FTCCaseSummary[]` but used as `EnhancedFTCCaseSummary[]`:**
- Issue: `FTCDataPayload.cases` is typed as `FTCCaseSummary[]`, but the runtime JSON actually contains `EnhancedFTCCaseSummary[]` fields. Multiple components use `data.cases as EnhancedFTCCaseSummary[]` to work around this.
- Files: `src/types/ftc.ts`, `src/components/ftc/analytics/TopicTrendLines.tsx`, `src/components/ftc/analytics/EnforcementByAdmin.tsx`, `src/components/ftc/analytics/EnforcementByYear.tsx`, `src/components/ftc/analytics/ProvisionAnalytics.tsx`, `src/components/ftc/FTCIndustryTab.tsx`, `src/components/ftc/industry/SectorGrid.tsx`
- Impact: Unsafe type assertions bypass TypeScript checking. If the JSON structure changes, runtime errors will occur with no compile-time warning.
- Fix approach: Update `FTCDataPayload.cases` to `EnhancedFTCCaseSummary[]` in `src/types/ftc.ts` and remove all `as EnhancedFTCCaseSummary[]` casts.

**`getPageNumbers` helper duplicated across two components:**
- Issue: The `getPageNumbers(current, total)` pagination utility function is copy-pasted identically into both `src/components/ftc/provisions/ProvisionsContent.tsx` (line 389) and `src/components/ftc/industry/CaseCardList.tsx` (line 298).
- Files: `src/components/ftc/provisions/ProvisionsContent.tsx`, `src/components/ftc/industry/CaseCardList.tsx`
- Impact: Any pagination bug fix or enhancement must be applied twice. Not DRY.
- Fix approach: Extract to `src/lib/pagination.ts` and import in both components.

**`ArticlesSection.tsx` uses raw `useEffect` + direct Supabase calls without React Query:**
- Issue: `ArticlesSection.tsx` fetches articles with manual `useState` + `useEffect` pattern and raw Supabase client calls, inconsistent with the React Query data-fetching pattern used everywhere else in the app.
- Files: `src/components/ArticlesSection.tsx`
- Impact: No caching, no deduplication, no stale-while-revalidate behavior. The component refetches on every mount. The `fetchArticles` function is defined inside the component body but called from `syncSubstack` via closure, making it fragile.
- Fix approach: Replace with a `useQuery` hook wrapping the Supabase fetch, and a `useMutation` for the sync operation.

## Known Bugs

**`useProvisionSearch` builds MiniSearch index on every render cycle when provisions change:**
- Symptoms: When `allProvisions` array reference changes (e.g., from `useAllProvisionsForSearch`), `useProvisionSearch` rebuilds the entire MiniSearch index synchronously inside `useMemo`. With potentially thousands of provisions, this causes a noticeable UI freeze.
- Files: `src/hooks/use-provision-search.ts`
- Trigger: Switching cross-topic search scope while shards are still loading causes partial index builds followed by full rebuilds.
- Workaround: None currently. The issue is mitigated because `staleTime: Infinity` prevents repeated fetches, but the initial index build on first cross-topic search is expensive.

**Missing cases notice contains hardcoded stale counts:**
- Symptoms: `FTCMissingCasesNotice.tsx` hardcodes "327 privacy and data-security enforcement actions" and "285 fully analyzed cases" as static text. If the dataset is updated, the notice will show incorrect numbers.
- Files: `src/components/ftc/FTCMissingCasesNotice.tsx`
- Trigger: Any data pipeline re-run that adds new cases.
- Workaround: None. The count is manually maintained.

**`DATE_PRESETS` in `src/constants/ftc.ts` has a hardcoded future end date:**
- Symptoms: `{ label: "Last 5 years", start: "2021-01-01", end: "2026-12-31" }` — the end date is a static string that will make the preset stale after December 2026.
- Files: `src/constants/ftc.ts`
- Trigger: After December 31, 2026, the "Last 5 years" preset will not include cases from 2027 onward.
- Workaround: None. Should be computed as `new Date().toISOString().slice(0, 10)`.

**Pattern grouping by normalized title is fragile for slight title variations:**
- Symptoms: `build-patterns.ts` uses exact normalized title matching as Pass 1, then a prefix merge as Pass 2. Titles that differ by one word (e.g., "Order to Pay Civil Penalty" vs "Order to Pay Civil Penalties") produce separate groups.
- Files: `scripts/build-patterns.ts` (lines 69-176)
- Trigger: Visible in `ftc-patterns.json` as near-duplicate pattern groups.
- Workaround: The prefix merge (Pass 2) catches some cases, but similarity-based clustering would be more robust.

## Security Considerations

**Supabase publishable key committed to source control:**
- Risk: `src/integrations/supabase/client.ts` contains `SUPABASE_PUBLISHABLE_KEY` as a literal string committed to the repository. While this is an anon/public key (not a service role key), it is permanently embedded in git history.
- Files: `src/integrations/supabase/client.ts`
- Current mitigation: The key is the anon/public key with RLS policies enforced server-side, which is the standard Supabase pattern for frontend apps. Exposure is low risk for read-only public data.
- Recommendations: Move to `VITE_SUPABASE_ANON_KEY` environment variable for consistency with 12-factor practices and to allow key rotation without code changes.

**Supabase URL also committed to source control:**
- Risk: `SUPABASE_URL = "https://tltdghkyunvhayvxtudq.supabase.co"` is hardcoded and committed, revealing the project instance.
- Files: `src/integrations/supabase/client.ts`
- Current mitigation: Same as above — public Supabase projects are discoverable by design.
- Recommendations: Move to `VITE_SUPABASE_URL` environment variable.

**`ArticlesSection.tsx` exposes a Sync button publicly:**
- Risk: The "Sync" button calls `supabase.functions.invoke('sync-substack')`, invoking a Supabase Edge Function, without any authentication check. Any visitor to the site can trigger article sync.
- Files: `src/components/ArticlesSection.tsx`
- Current mitigation: The Edge Function call likely uses the anon key which has limited permissions. Sync operations are idempotent.
- Recommendations: Gate the Sync button behind an admin check or remove it from the public-facing UI entirely; expose it only in a CMS or admin context.

**Raw JSON source files publicly accessible:**
- Risk: `public/data/ftc-files/` (293 files, 14 MB) contains the full extracted case source JSON files. These are served directly as static assets at `/data/ftc-files/<id>.json`. The `FTCCaseTable` component links to them at line 137.
- Files: `src/components/ftc/FTCCaseTable.tsx`, `public/data/ftc-files/`
- Current mitigation: The data is public FTC enforcement record information, so exposure is acceptable for this use case.
- Recommendations: Verify no intermediate classification metadata or internal notes are embedded in the source JSON files before deploying.

## Performance Bottlenecks

**`ftc-patterns.json` is 4.0 MB served on tab activation:**
- Problem: Navigating to the "Patterns" tab triggers a single `fetch("/data/ftc-patterns.json")` that downloads a 4.0 MB JSON payload before anything renders.
- Files: `src/hooks/use-patterns.ts`, `public/data/ftc-patterns.json`
- Cause: All pattern groups and their full variant text are in one monolithic file. The `build-patterns.ts` script intentionally includes verbatim text for the 30 most recent variants per pattern.
- Improvement path: Shard `ftc-patterns.json` similarly to the provisions shards — a pattern index file with metadata only, and per-pattern detail files fetched on expand. Or enable gzip compression on the dev/production server.

**`section-5-only-provisions.json` is 3.8 MB, `pa-privacy-provisions.json` is 3.4 MB:**
- Problem: Selecting either "Section 5 Only" or "Privacy" topics in the Provisions Library triggers a 3.4–3.8 MB download before the filter bar and provision list can render.
- Files: `src/hooks/use-provisions.ts`, `public/data/provisions/section-5-only-provisions.json`, `public/data/provisions/pa-privacy-provisions.json`
- Cause: These are the largest statutory topic shards because Section 5 is the most common enforcement authority and Privacy is the most common practice area.
- Improvement path: Further sub-shard by year range or implement server-side pagination. Enable HTTP compression on the static file server.

**Cross-topic search loads all shards simultaneously:**
- Problem: `useAllProvisionsForSearch` in `src/hooks/use-provision-search.ts` uses `useQueries` to fetch all topic shards in parallel when the user switches to "all topics" search scope. This triggers 25+ concurrent fetches totaling 22+ MB.
- Files: `src/hooks/use-provision-search.ts`
- Cause: MiniSearch requires all documents in memory for full-text indexing. There is no server-side search endpoint.
- Improvement path: Implement a backend search API (Supabase full-text search or an Edge Function) to avoid client-side loading of all provision data. Or limit cross-topic search to a pre-built search index.

**`TopicTrendLines.tsx` iterates cases twice to produce chart data and table rows:**
- Problem: `TopicTrendLines` has two separate `useMemo` blocks — `chartData` and `tableRows` — both of which iterate the full cases array by year. The computation is effectively doubled.
- Files: `src/components/ftc/analytics/TopicTrendLines.tsx`
- Cause: Chart data and table row formats differ, leading to separate memos instead of derived shared state.
- Improvement path: Compute a single `yearStats` memo and derive both `chartData` and `tableRows` from it.

## Fragile Areas

**Data pipeline depends on external FTC source directory:**
- Files: `scripts/build-ftc-data.ts`
- Why fragile: The hardcoded path `C:/Users/rafst/Documents/projectas/FTC/output_v2` at line 103 means the entire `npm run build:data` pipeline fails if that directory is absent or the path changes. There is no documentation of how to populate this source directory.
- Safe modification: Add a `--source` CLI argument or read from `FTC_SOURCE` environment variable. Document the source directory structure in a README.
- Test coverage: No tests exist for any build scripts.

**Classification idempotency check is a single field presence test:**
- Files: `scripts/classify-provisions.ts` (line 278), `scripts/build-ftc-data.ts` (lines 386-389)
- Why fragile: `isAlreadyClassified` returns `true` if `case_info.statutory_topics !== undefined`. A file with an empty `statutory_topics: []` array is considered classified and will never be re-classified even if the classification was incorrect or incomplete.
- Safe modification: Add a `--force` flag to bypass the idempotency check and re-classify specific files.
- Test coverage: None.

**Pattern ID generation via `slugify(bestTitle)` is not guaranteed unique:**
- Files: `scripts/build-patterns.ts` (lines 78-85, 241)
- Why fragile: Two patterns with titles that slugify to the same string would have duplicate IDs, causing React key warnings and potentially incorrect toggle behavior in `PatternList.tsx` / `PatternRow.tsx` which use `pattern.id` as keys.
- Safe modification: Append a numeric suffix or hash to guarantee uniqueness: `id = slugify(bestTitle) + '-' + index`.
- Test coverage: None.

**`classifySubsector` falls through to last subsector as generic fallback:**
- Files: `src/components/ftc/industry/industry-utils.ts` (line 242)
- Why fragile: The convention that the last subsector in each `SECTOR_TAXONOMY` entry is the "General" fallback is an implicit contract, not enforced by typing. Adding a new subsector to any sector definition before the "General" entry would break classification logic.
- Safe modification: Give each sector an explicit `fallback` field, or rename the last subsector `isDefault: true`.
- Test coverage: None.

**URL state in `FTCIndustryTab` uses comma-separated sector slugs:**
- Files: `src/components/ftc/FTCIndustryTab.tsx` (lines 109-111)
- Why fragile: `compareParam.split(",")` to parse sector slugs from the URL means any sector slug containing a comma would cause incorrect parsing. Current slugs don't contain commas, but this is not enforced.
- Safe modification: Use repeated query params (`?compare=tech&compare=retail`) instead of a comma-joined single param.
- Test coverage: None.

## Scaling Limits

**MiniSearch index is held entirely in browser memory:**
- Current capacity: Works for ~thousands of provisions across the current dataset.
- Limit: If the FTC dataset grows significantly (e.g., 10x), the 22 MB of JSON + in-memory MiniSearch index may exceed browser memory limits on mobile devices or lower-end hardware.
- Scaling path: Move full-text search to Supabase (PostgreSQL full-text search) or a dedicated search service.

**Static JSON data files grow linearly with dataset:**
- Current capacity: 14 MB `ftc-files/`, 22 MB `provisions/`, 4 MB `ftc-patterns.json`, 473 KB `ftc-cases.json`.
- Limit: No compression or CDN is configured. The provisions directory is already 22 MB of uncompressed JSON. Adding 100+ more cases will push the largest shards to 5+ MB each.
- Scaling path: Enable gzip/Brotli compression on the static server or CDN. Migrate provisions to a database with server-side filtering and pagination.

## Dependencies at Risk

**`@anthropic-ai/sdk` in devDependencies:**
- Risk: The Anthropic SDK (`^0.78.0`) is listed as a devDependency and used by `scripts/classify-provisions.ts`. The script hardcodes model `"claude-sonnet-4-5"` which may be deprecated. Classification of new cases would require updating the model ID.
- Impact: Running `npm run build:classify` with a deprecated model ID would return API errors and fail to classify new cases.
- Migration plan: Update model ID to a current Claude model before running classification on new cases. Consider making the model ID a configurable argument.

**`react-day-picker` at v8 with `date-fns` v3:**
- Risk: `react-day-picker ^8.10.1` is designed for `date-fns` v2, but the project uses `date-fns ^3.6.0`. The two packages have a known incompatibility at major versions.
- Impact: The `Calendar` component in `src/components/ui/calendar.tsx` may produce subtle formatting bugs or throw at runtime if `react-day-picker` internally calls `date-fns` v2 APIs that changed in v3. Calendar is not currently used in the main FTC views.
- Migration plan: Upgrade to `react-day-picker ^9` which natively supports `date-fns` v3.

**`next-themes` installed but no dark mode implemented:**
- Risk: `next-themes ^0.3.0` is a dependency but no theme toggle or dark mode CSS variables exist in `src/index.css` beyond the shadcn/ui defaults. The package adds runtime overhead without providing user value.
- Impact: Unnecessary bundle size (~3 KB).
- Migration plan: Either implement a theme toggle or remove `next-themes` from dependencies.

## Missing Critical Features

**No error boundaries:**
- Problem: There are no React error boundaries anywhere in the component tree. A runtime error in any analytics chart or provision card will crash the entire tab.
- Blocks: Resilient user experience for edge-case data.
- Files affected: All FTC tab components under `src/components/ftc/`.

**No retry logic on data fetch failures:**
- Problem: All fetch hooks (`useFTCData`, `useProvisionsManifest`, `useProvisionShard`, `usePatterns`) use the default React Query retry behavior (`retry: 3`) inherited from the default `QueryClient` configuration. However, the `QueryClient` is instantiated with no custom options in `src/App.tsx`, so the default retry behavior applies. The error UI just shows "Failed to load data. Please try again." with no retry button.
- Files: `src/App.tsx`, `src/components/ftc/FTCTabShell.tsx`, `src/components/ftc/FTCPatternsTab.tsx`

**No loading state for the full cross-topic search index build:**
- Problem: When the user switches to "All Topics" search scope, `useAllProvisionsForSearch` shows `isLoading` but `ProvisionsTab` / `SearchResults` do not display a loading indicator explaining that all 25 provision shards are being fetched. The UI appears frozen.
- Files: `src/components/ftc/provisions/SearchResults.tsx`, `src/hooks/use-provision-search.ts`

## Test Coverage Gaps

**Zero test coverage across entire codebase:**
- What's not tested: All React components, all data hooks, all build scripts, all utility functions, all classification logic.
- Files: Every file under `src/` and `scripts/`.
- Risk: Regressions in data pipeline scripts (classification, provision sharding, pattern detection) can silently corrupt the `public/data/` JSON files that power the entire site. UI regressions have no automated detection.
- Priority: High for `scripts/build-patterns.ts` and `scripts/build-provisions.ts` (data correctness), Medium for hooks and utility functions.

**Classification accuracy not validated:**
- What's not tested: The LLM-based classification in `classify-provisions.ts` has no test suite verifying that known cases receive correct statutory topics, practice areas, and industry sectors.
- Files: `scripts/classify-provisions.ts`, `public/data/ftc-files/`
- Risk: If the classification prompt or model output format changes, incorrect tags could propagate throughout all provision shards and analytics charts without detection.
- Priority: High — classification quality is foundational to the entire analytical value of the app.

---

*Concerns audit: 2026-02-26*
