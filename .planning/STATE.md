# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-24)

**Core value:** A legal practitioner can find every FTC consent order provision relevant to a specific topic, with exact paragraph-level citations and source links, in under 30 seconds.
**Current focus:** Phase 4 — Company & Industry View (Complete)

## Current Position

Phase: 4 of 5 (Company & Industry View)
Plan: 4 of 4 in current phase (phase complete)
Status: Phase Complete
Last activity: 2026-02-25 — Completed 04-04-PLAN.md (Visual verification checkpoint)

Progress: [██████████████████░░] 90%

## Performance Metrics

**Velocity:**
- Total plans completed: 18
- Average duration: 3 min
- Total execution time: 0.93 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-data-pipeline | 4 | 23 min | 6 min |
| 02-tab-shell-analytics | 5 | 9 min | 2 min |
| 03-provisions-library | 5 | 14 min | 3 min |
| 04-company-industry-view | 4 | 11 min | 3 min |

**Recent Trend:**
- Last 5 plans: 03-05 (1 min), 04-01 (4 min), 04-02 (3 min), 04-03 (3 min), 04-04 (1 min)
- Trend: Stable

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Pre-Phase 1]: Research recommends reducing taxonomy from three axes (Statutory + Practice Area + Remedy Type) to two orthogonal axes (Statutory + Remedy Type) — validate against actual legal_authority field distribution before writing classification rules
- [Pre-Phase 1]: File split strategy (flat ftc-provisions.json vs topic-sharded files) must be decided before building any fetch hooks — measure actual file size after first pipeline run
- [Phase 1, Plan 01]: EnhancedFTCCaseSummary uses `extends FTCCaseSummary` to preserve backward compat with categories field
- [Phase 1, Plan 01]: ClassifiedProvision omits requirements array — plan spec did not include it; keeps interface focused on classification tags
- [Phase 1, Plan 02]: business_description extracted from case_info.company.business_description (not case_info.business_description) — matching actual source file structure
- [Phase 1, Plan 02]: Rule-based hints passed as structured context in prompt, not used as final classification answers — LLM makes final decisions
- [Phase 1, Plan 03]: build-provisions.ts uses inline types (same pattern as build-ftc-data.ts) to avoid tsx path alias issues
- [Phase 1, Plan 03]: Practice-area shard filenames use pa- prefix to disambiguate from statutory topic shards
- [Phase 1, Plan 03]: build-ftc-data.ts reads classification tags from public/data/ftc-files/ copies (where classify script writes them)
- [Phase 1, Plan 04]: Classification done by Claude Code agents (Opus 4.6) not API script — ANTHROPIC_API_KEY not available in shell, but agents classify directly
- [Phase 1, Plan 04]: Privacy provision % at 49.5% — under 60% threshold, monitor in Phase 2
- [Phase 1, Plan 04]: PIPE-06 (ftc-patterns.json) formally deferred to Phase 5
- [Phase 2, Plan 01]: FTCTabShell owns useFTCData() and passes data to FTCAnalyticsTab as props — avoids duplicate fetches
- [Phase 2, Plan 01]: Tab-specific URL params (mode, group) cleared on tab switch to prevent stale state
- [Phase 2, Plan 01]: Default analytics tab omits ?tab= param from URL for cleaner default links
- [Phase 2, Plan 01]: FTCAnalyticsTab merges mode/group params with existing searchParams to preserve tab param
- [Phase 2, Plan 02]: FTCSectionSidebar uses cn() for className merging, consistent with project shadcn/ui patterns
- [Phase 2, Plan 02]: AnalyticsSummary counts unique categories for numTopics to match existing FTCCaseSummary data shape
- [Phase 2, Plan 02]: ReferenceTable uses Fragment key pattern for row+expanded pairs, expandable rows tracked via Set<string>
- [Phase 2, Plan 03]: EnforcementByAdmin combines ANLY-02 and ANLY-04 into single section -- chart shows stacked bars, table shows side-by-side comparison columns
- [Phase 2, Plan 03]: Admin chart uses layout=vertical (horizontal bars) with dynamic height based on admin count
- [Phase 2, Plan 03]: Both chart sections cast cases as EnhancedFTCCaseSummary to access statutory_topics for topic counting
- [Phase 2, Plan 04]: TopicTrendLines uses explicit 0 values for years with no cases for a topic, ensuring continuous lines without misleading jumps
- [Phase 2, Plan 04]: ProvisionAnalytics aggregates remedy_types and provision_counts_by_topic from EnhancedFTCCaseSummary for provision-level analytics
- [Phase 2, Plan 04]: ViolationBreakdown refactored from ViolationDonut with added reference table showing count and percentage per type
- [Phase 2, Plan 05]: Old grouping views fully replaced by 5 dedicated analytics sections -- FTCGroupingSelector, FTCGroupChart, FTCGroupList, FTCGroupDetail, FTCOverviewStats, ViolationDonut all removed
- [Phase 2, Plan 05]: Analytics layout: flex container with sticky sidebar left + space-y-12 content stack right, mobile collapse handled by FTCSectionSidebar internally
- [Phase 3, Plan 01]: verbatim_text concatenated from requirements[].quoted_text joined by double newline -- preserves full order language per provision
- [Phase 3, Plan 01]: violation_type sourced from case_info.violation_type (per-case, not per-provision) -- 100% coverage, minimal size overhead
- [Phase 3, Plan 01]: Remedy-type shards use rt- prefix (matching pa- prefix pattern for practice areas)
- [Phase 3, Plan 01]: manifest.json includes human-readable labels, shard filenames, counts, and category classification for all 25 topics
- [Phase 3, Plan 02]: TopicSidebar groups topics alphabetically within each category using manifest.topics category field
- [Phase 3, Plan 02]: ProvisionCard shows full verbatim_text with whitespace-pre-line, falls back to summary with (summary) label
- [Phase 3, Plan 02]: ProvisionsContent paginates at 50 provisions per page with ellipsis-based page numbers
- [Phase 3, Plan 02]: Default sort is date descending (most recent first) per research recommendation
- [Phase 3, Plan 02]: useProvisionShard fetches by shard filename from manifest -- avoids hardcoded shard filename map
- [Phase 3, Plan 03]: Date preset toggles deselect when clicked again (same preset click clears the date filter)
- [Phase 3, Plan 03]: Sort defaults to date descending; switching sort key sets default direction (date=desc, company/type=asc); clicking same key flips direction
- [Phase 3, Plan 03]: All filters reset on topic change to prevent stale empty results (per research Pitfall 3)
- [Phase 3, Plan 03]: Remedy type multi-select uses Popover + Checkbox list pattern since shadcn Select is single-select only
- [Phase 3, Plan 04]: MiniSearch indexes title (boosted 2x), summary, and verbatim_text with prefix and fuzzy matching
- [Phase 3, Plan 04]: Composite ID case_id__provision_number used for deduplication across shards and search result matching
- [Phase 3, Plan 04]: Search applied before other filters (date, company, remedy) so filters narrow search results
- [Phase 3, Plan 04]: Cross-topic search uses useQueries to load all shards in parallel with progress indicator
- [Phase 3, Plan 04]: Search query persisted in URL via q param for shareability; scope via scope param
- [Phase 3, Plan 05]: TopicSidebar switched from ScrollArea to native overflow-y-auto -- ScrollArea conflicts with CSS sticky positioning
- [Phase 3, Plan 05]: All 10 PROV requirements (PROV-01 through PROV-10) verified by user visual inspection
- [Phase 04]: classifySubsector uses company_name and categories fields (not business_description which is unavailable at runtime)
- [Phase 04]: Subsector display shows General for most cases -- acceptable per research; future pipeline enhancement can add business_description
- [Phase 04]: Compare functionality wired at UI level with checkbox selection and sticky bar; compare view placeholder for Plan 03
- [Phase 04]: SectorStats aggregated in FTCIndustryTab parent and passed to SectorGrid/SectorCard to avoid recomputation
- [Phase 04]: handleViewProvisions navigates to ?tab=provisions landing page -- no case-level filter in Provisions Library
- [Phase 04]: CaseCardList topic filter uses multi-select Popover+Checkbox pattern matching ProvisionFilterBar
- [Phase 04]: getPageNumbers helper duplicated in CaseCardList rather than extracting shared utility -- keeps components self-contained
- [Phase 04]: SectorCompare receives sectorStats from parent (same data flow as SectorGrid) -- avoids duplicate computation
- [Phase 04]: Top companies in compare view ranked by num_provisions not case count -- provisions more meaningful for practitioner comparison
- [Phase 04]: 3-sector selection limit enforced silently in handleToggleSelect (no toast) -- keeps UI simple
- [Phase 04]: All three INDY requirements (INDY-01, INDY-02, INDY-03) verified by user visual inspection -- Phase 4 complete

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 1]: Taxonomy axis count (2 vs 3) is unresolved — must validate against actual legal_authority strings in source data before classification rules are written
- [Phase 1]: ftc-provisions.json size unknown — 7.5-18 MB range; if over ~2 MB gzipped, topic-sharded output is required and affects all downstream hook APIs
- [Phase 4]: Industry sector classification relies on PIPE-04 (business_description inference) — quality of inference is unknown until pipeline runs; Phase 4 scope may need adjustment
- [Phase 5]: Pattern detection quality is unknown until pipeline runs — Phase 5 UI scope should be confirmed after inspecting ftc-patterns.json output

## Session Continuity

Last session: 2026-02-25
Stopped at: Completed 04-04-PLAN.md (Visual verification checkpoint — Phase 4 complete)
Resume file: None
