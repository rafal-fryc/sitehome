# Phase 10: Analytics Cleanup - Context

**Gathered:** 2026-03-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Make analytics detail tables collapsible (starting collapsed) and hide Order Administration from all remedy type UI presentations across the entire app. Data files retain Order Administration — this is UI-only filtering.

</domain>

<decisions>
## Implementation Decisions

### Collapsible tables
- Tables beneath bar charts on the analytics tab start in collapsed state
- User can expand/collapse each table independently
- Simple toggle — no need for expand-all/collapse-all button

### Order Administration hiding
- Hide from ALL remedy type UI surfaces: analytics charts/tables, provisions filter bar, industry sector charts, pattern charts
- Filter at the data consumption layer (where data is mapped to UI), not at the data source
- REMEDY_TYPES array in constants/ftc.ts keeps "Order Administration" — add a display-filtered variant or filter inline where rendered
- Provision shards for order-administration still exist and load; they just don't appear in category lists or filter options

### Claude's Discretion
- Collapsible implementation approach (Collapsible from radix/shadcn, details/summary, or custom state)
- Animation style for expand/collapse
- Whether to persist collapse state across tab switches
- Exact filtering approach (constant-level filter list vs inline .filter() at each render site)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ReferenceTable` component (src/components/ftc/analytics/ReferenceTable.tsx): renders tables beneath charts — wrap with collapsible
- `Collapsible` from shadcn/ui: likely already installed, standard collapse pattern
- `REMEDY_TYPES` array in src/constants/ftc.ts: central enum, line 20 contains "Order Administration"

### Established Patterns
- Analytics components: ProvisionAnalytics, ViolationBreakdown, EnforcementByYear, EnforcementByAdmin, TopicTrendLines — each has a bar chart + ReferenceTable pair
- Remedy type filtering already exists in ProvisionFilterBar.tsx (multi-select)
- Industry charts in SectorPatternCharts.tsx also display remedy types

### Integration Points
- src/constants/ftc.ts — REMEDY_TYPES array (central source for all remedy type displays)
- src/components/ftc/analytics/*.tsx — 5-6 analytics components with tables
- src/components/ftc/provisions/ProvisionFilterBar.tsx — remedy filter dropdown
- src/components/ftc/industry/SectorPatternCharts.tsx — industry remedy charts

</code_context>

<specifics>
## Specific Ideas

User said: "for all instances considering remedy type, do not mention order administration in the presentations, keep the tag and the category but I do not need to see them" — retain in data, hide everywhere in UI.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 10-analytics-cleanup*
*Context gathered: 2026-03-02*
