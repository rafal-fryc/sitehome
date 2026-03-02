# Phase 7: Pattern Condensing - Context

**Gathered:** 2026-02-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Curate the existing pattern set in ftc-patterns.json — merge redundant pattern variants into clean groups, prune low-value structural noise, and sort by recency. This is a build-pipeline data organization phase. The pattern browser UI stays essentially the same; only the data feeding it changes (fewer rows, better sorted). No new UI features or capabilities.

</domain>

<decisions>
## Implementation Decisions

### Merge grouping logic
- Group assessment-pattern variants by **topic area** (security, privacy, data handling, etc.) — not by structural similarity or timing
- Merged groups get a **single clean name** — no variant counts in the display name
- Original individual variants are **removed from the browser** after merging — the merged group replaces them entirely. Original data preserved in git checkpoint
- **Propose-then-apply workflow** (same as Phase 6 reclassification): Claude generates a merge proposal for user review/approval before anything changes in the data

### Sort & display impact
- Sorted by most recent example — merged groups use the **newest case date across all original variants** (no recency data lost)
- Case count for merged groups uses **unique cases only** — deduplicated across variants (same consent order appearing in multiple variants counts once)
- **Secondary sort**: tie-break by case count (more cases first) when most-recent dates match
- **Minor UI polish allowed** — data changes are the focus, but small tweaks are fine if they improve the condensed view (e.g., showing date range)

### Claude's Discretion
- Pruning threshold and criteria for low-value patterns (case count, recency, structural flag, composite scoring)
- Exact merge grouping algorithm and how to handle edge cases
- Config file format for recording merge/prune decisions
- Any minor UI polish details that improve the condensed pattern browser
- Acknowledgment variant merge approach (success criteria: merge into 1 group)

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches within the existing codebase patterns established in Phase 5.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-pattern-condensing*
*Context gathered: 2026-02-27*
