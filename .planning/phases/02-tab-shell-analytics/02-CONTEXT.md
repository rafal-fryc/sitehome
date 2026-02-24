# Phase 2: Tab Shell + Analytics - Context

**Gathered:** 2026-02-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Build a tabbed navigation shell for the FTC enforcement tool with three tabs (Analytics, Provisions Library, Patterns) and an analytics dashboard showing enforcement trend charts with accompanying reference tables. Tab switching updates the URL search param without a full page reload. All content lives within the tab shell. The law-library aesthetic (EB Garamond, cream/gold/dark-green palette) must be consistent across all new components.

</domain>

<decisions>
## Implementation Decisions

### Tab navigation
- Tabs sit horizontally below the page header, full-width bar
- Active tab has a cream/gold filled background; inactive tabs remain transparent
- Analytics is the default tab when no tab param is in the URL
- All existing FTC page content moves inside the tab shell — nothing remains outside the tabs below the header

### Reference tables
- Each reference table sits directly below its chart, always visible (no collapse/accordion)
- Tables show detailed breakdowns: year/topic, case count, top statutes involved, notable cases — richer data, not just summary counts
- Table rows are clickable — clicking a row expands it inline to show the matching case list below the row
- No navigation away from the Analytics tab on row click; expand in-place

### Page composition
- Analytics tab opens with a brief headline and 1-2 sentence summary (date range, total cases) before the first chart section
- Chart+table sections stack vertically with a sticky left sidebar showing section names for anchor-based quick jumping
- On smaller screens (tablet/mobile), the sidebar collapses into a horizontal scrollable bar above the content
- Sections flow: enforcement trends by year, enforcement by presidential administration, topic-over-time trend lines

### Claude's Discretion
- Chart types and exact visual encoding for each analytics section
- Color coding within charts (beyond the palette constraint)
- Exact spacing, typography scale, and section divider styling
- Sidebar width and highlight behavior
- Loading states and skeleton design
- Empty/error state handling

</decisions>

<specifics>
## Specific Ideas

- The law-library aesthetic (EB Garamond, cream/gold/dark-green palette) is the binding visual constraint for all new components
- Inline row expansion for reference tables should feel natural — not a modal, not a redirect, just the cases appearing below the clicked row
- The sticky sidebar should feel like a table-of-contents in a reference book

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-tab-shell-analytics*
*Context gathered: 2026-02-24*
