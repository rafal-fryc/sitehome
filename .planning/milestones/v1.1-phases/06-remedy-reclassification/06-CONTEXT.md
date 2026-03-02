# Phase 6: Remedy Reclassification - Context

**Gathered:** 2026-02-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Reclassify 885 "other" provisions into meaningful remedy categories via the build pipeline. The Provisions tab remedy filter should show named categories instead of an overloaded "Other" bucket. Only the "Other" bucket is touched — existing non-Other classifications are validated and stay as-is.

</domain>

<decisions>
## Implementation Decisions

### New Category Design
- Claude (Sonnet agent within Claude Code, no API) proposes ~5-10 new remedy categories
- Categories at same granularity level as existing ones (e.g., "Data Security", "Monitoring/Compliance")
- Legal terminology for naming (e.g., "Injunctive Relief", "Consumer Redress") — match existing taxonomy style
- User reviews and constrains the proposed category set before reclassification runs
- A small "Other" bucket is acceptable after reclassification (<5% of total provisions)
- The ~585 structural/administrative provisions get a new "Order Administration" category (not left in "Other")

### Classification Approach
- Sonnet agent within Claude Code instance — same pattern as v1.0 classification (no Anthropic API calls)
- Each provision gets exactly one remedy type (best single category, no multi-category)
- Only reclassify provisions currently in the "Other" bucket — don't re-evaluate existing classifications

### Review Workflow
- Step 1: Agent analyzes 885 "other" provisions and proposes new category names
- Step 2: Agent shows proposed categories with 3-5 example provisions per category for user review
- Step 3: User approves/edits the category list
- Step 4: Agent reclassifies all 885 provisions in one batch using approved categories
- Step 5: Agent shows summary of changes (counts per new category, flagged ambiguous provisions) before rebuild
- Step 6: User approves, then pipeline rebuilds provision files

### Edge Case Handling
- Provisions that fit multiple categories: agent picks the single best fit
- Truly ambiguous or unique provisions: flagged for manual review, kept as "Other" until resolved
- Structural provisions (duration, jurisdiction, acknowledgment): classified as "Order Administration"

### Claude's Discretion
- Exact category names (within legal terminology constraint)
- How to structure the classification prompt for the Sonnet agent
- RemedyType enum update strategy across the 4 code locations
- Pipeline rebuild sequence after reclassification

</decisions>

<specifics>
## Specific Ideas

- Same agent-based classification pattern as v1.0's `classify-provisions.ts` — Sonnet agent, not API
- "Order Administration" as a named category makes these provisions legitimate rather than ignored
- The review checkpoint (propose → approve → classify → summarize → rebuild) ensures no surprises

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-remedy-reclassification*
*Context gathered: 2026-02-26*
