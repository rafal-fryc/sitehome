# Phase 3: Provisions Library - Context

**Gathered:** 2026-02-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the core topic-first browsing experience for FTC consent order provisions. Users select a substantive topic from a sidebar, see every relevant provision with verbatim order language and paragraph-level citations, and can filter/search results. Industry views and cross-case pattern analysis are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Provision card design
- Context header + text layout: company name, year, docket number, citation, and violation type in a prominent header bar, with verbatim provision text below
- Full provision text always displayed — no truncation or "read more" collapse
- Citation text (e.g. "Part II.A.3") displayed in header; separate "View on FTC.gov" link/button distinct from the citation text
- Single disclaimer banner at the top of the provisions list ("verify against source") — not repeated per card

### Topic navigation
- Persistent sidebar list of all topics, always visible while browsing provisions
- Topics grouped by category under headings: Statutory Authority (COPPA, FCRA, etc.), Practice Area (Data Security, Surveillance, etc.), Remedy Type
- Each topic shows provision count as a badge (e.g. "COPPA (47)")
- Landing view (before any topic is selected): overview summary with total provision/case counts and prompt to select a topic

### Filter & sort controls
- Sticky filter bar between topic header and provision cards — always visible while scrolling
- Date range filter uses preset period buttons: "Last 5 years", "Obama era", "Trump era", "Biden era" — plus custom range option
- Company name filter is a type-ahead search/autocomplete input suggesting matching company names
- Active filters shown as dismissible chips/tags below the filter bar (e.g. "2020–2025 ×", "Facebook ×") with a "Clear all" button

### Search experience
- Search bar integrated into the sticky filter bar alongside other filter controls
- Search scope toggle: "This topic" vs "All topics"
- Matching terms highlighted within provision text (bold or background color)
- Cross-topic results grouped by topic with counts per topic (e.g. "Data Security (12 results)", "COPPA (5 results)")

### Claude's Discretion
- Sort control design and default sort order
- Exact spacing, typography, and card shadow/border treatment within the law-library aesthetic
- Remedy type filter implementation (dropdown, multi-select, etc.)
- Loading states and performance optimization approach
- Exact preset period date ranges

</decisions>

<specifics>
## Specific Ideas

No specific references — open to standard approaches within the existing law-library aesthetic (EB Garamond, cream/gold/dark-green palette established in Phase 2).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-provisions-library*
*Context gathered: 2026-02-24*
