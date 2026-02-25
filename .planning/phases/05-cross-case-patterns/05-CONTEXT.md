# Phase 5: Cross-Case Patterns - Context

**Gathered:** 2026-02-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Surface recurring provision language and its evolution across enforcement eras. Users browse named patterns, see chronological timelines of how language variants appear across consent orders, and can distinguish structural/boilerplate from substantive patterns. Fuzzy text similarity and novel language detection are out of scope (deferred requirements PATN-05, PATN-06).

</domain>

<decisions>
## Implementation Decisions

### Pattern discovery & naming
- Minimum threshold: 3+ cases required for a provision to be listed as a pattern
- Near-match grouping: similar but not identical provision titles are merged into the same pattern group (not exact-match only)
- Pattern names: short, human-friendly descriptive names (e.g., "Security Program Mandate") rather than raw provision titles
- Pre-computed in the build pipeline — produces a static patterns JSON file, not computed client-side

### Timeline presentation
- Vertical timeline layout: chronological vertical line with variant cards branching off at each year, scroll down through time
- Variant cards show first 2-3 lines of provision text with case context, expandable to full text
- Differences between consecutive variant texts visually highlighted (text diff style with colored highlighting)
- Year grouping: Claude's discretion on whether to group same-year cases or show each separately

### Boilerplate handling
- Structural provisions labeled inline with a "Structural" badge/tag — not excluded, not separated
- Always visible — no toggle to hide/show
- Classification approach: Claude's discretion (e.g., curated list, data-driven heuristic, or agent-based classification)

### Pattern browsing navigation
- Sorted vertical list (not card grid) showing pattern name, case count, date span, and "Structural" badge if applicable
- Default sort: by recency (most recently appearing patterns first)
- Inline expand: clicking a pattern row expands the timeline below the row — no page navigation
- Search box plus enforcement topic filter to narrow the pattern list

### Claude's Discretion
- Near-match grouping algorithm (string similarity, normalized titles, etc.)
- Pattern naming heuristic or mapping
- Structural/boilerplate classification method
- Year grouping on timeline (group same-year or show individually)
- Text diff highlighting implementation approach
- Sort options beyond default recency

</decisions>

<specifics>
## Specific Ideas

No specific references — open to standard approaches within the existing law-library aesthetic (EB Garamond, cream/gold/dark-green palette).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-cross-case-patterns*
*Context gathered: 2026-02-25*
