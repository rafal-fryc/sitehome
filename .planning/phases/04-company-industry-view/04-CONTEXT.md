# Phase 4: Company & Industry View - Context

**Gathered:** 2026-02-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Add industry sector browsing showing how enforcement patterns vary across sectors. Users select a sector, see enforcement pattern breakdowns (topics, remedy types), and browse case cards with links to provisions. Cross-case language patterns and provision evolution are Phase 5.

</domain>

<decisions>
## Implementation Decisions

### Industry sector definitions
- Classification approach: Claude's discretion based on available data (existing tags, company metadata, or build-pipeline mapping)
- Broad sectors (5-8 top-level) with expandable subsectors within each
- Cases can appear in multiple sectors — no single-sector constraint
- An "Other" catch-all sector for cases that don't fit defined sectors

### Sector browsing navigation
- Landing page: sector card grid showing name, case count, and 2-3 most common enforcement topics as tags
- Sector cards on the grid are expandable to show subsector breakdown inline
- Inside a sector view: breadcrumb trail at top ("Industries > Technology") with back arrow to return to grid
- No dropdown for switching between sectors — user navigates back to grid

### Enforcement pattern comparison
- Both charts and expandable reference tables (matching the analytics tab pattern) showing topic and remedy type distribution per sector
- No per-sector enforcement timeline — analytics tab already covers time-based charts
- Side-by-side comparison: user selects 2-3 sectors from the grid, then a "Compare" button opens a side-by-side pattern view

### Case cards within a sector
- Compact cards: company name, year, violation type, and provision count — click to see full provisions
- "View provisions" link navigates to the Provisions Library tab filtered to that case's provisions
- Cases sortable by date, company name, or provision count, plus filterable by enforcement topic within the sector
- 20 case cards per page with pagination

### Claude's Discretion
- Industry sector taxonomy (specific sectors and subsectors)
- Classification algorithm or mapping approach
- Chart types for pattern breakdowns (bar, pie, horizontal bar, etc.)
- Compare view layout (columns, overlapping charts, etc.)
- Card styling and hover states

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

*Phase: 04-company-industry-view*
*Context gathered: 2026-02-25*
