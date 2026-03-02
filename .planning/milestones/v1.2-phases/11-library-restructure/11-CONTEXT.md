# Phase 11: Library Restructure - Context

**Gathered:** 2026-03-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Restructure the provisions library tab into two distinct workflows: topic-based provision browsing and case-based enforcement action browsing. Remove practice area sections from the sidebar, add case search, and make case provisions accessible directly from the library via inline expansion.

</domain>

<decisions>
## Implementation Decisions

### Two-section layout
- Sub-tabs within the provisions tab: "By Topic" and "By Case"
- Default sub-tab is "By Case" — users land on the case browser first
- Remove ProvisionsLanding page entirely — both sub-tabs go straight to their content
- Tab placement is Claude's discretion

### Case browser experience
- Reuse existing CaseCard component as-is (company name, year, violation type, takeaway, "View provisions")
- Controls: search bar + sort (date/company/provisions) — no topic filter
- "View provisions" uses inline expansion (accordion), NOT the Sheet modal
- Only one case expanded at a time — expanding a new case collapses the previous
- Only show cases that have classified provisions — no dead-end entries

### Sidebar after restructure
- Remove Practice Area from sidebar — keep Statutory Authority and Remedy Type sections only
- Sidebar appears on "By Topic" sub-tab only — "By Case" has no sidebar
- Practice area URLs (e.g., ?topic=pa-deception) still load data if accessed directly — just no sidebar links
- Update landing/instruction text to remove "practice area" references

### Case search behavior
- Filter-as-you-type: search bar at top of case list, list filters in real-time as user types
- Match against: company name, case title, and year
- Placeholder text: e.g., "Search by company, case title, or year..."

### Claude's Discretion
- Sub-tab placement relative to header (below or inline)
- Exact placeholder text wording
- Animation style for inline provision expansion
- How provisions are grouped/displayed in the inline expansion
- Whether to persist sub-tab selection in URL params
- "By Topic" behavior when no topic is selected (empty state or first topic auto-selected)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `CaseCard.tsx` (src/components/ftc/industry/): case card with company, year, violation, takeaway — reuse directly
- `CaseCardList.tsx` (src/components/ftc/industry/): sort/filter/pagination for cases — adapt for library (remove topic filter, add search)
- `CaseProvisionsSheet.tsx` (src/components/ftc/industry/): provisions display grouped by topic — reference for inline expansion content
- `ProvisionRow.tsx` (src/components/ftc/industry/): individual provision display — reuse in inline expansion
- `useCaseFile` hook (src/hooks/use-case-file.ts): fetches individual case file with provisions — reuse for inline expansion data
- `CompanyAutocomplete.tsx` (src/components/ftc/provisions/): typeahead pattern — reference for search implementation
- `TopicSidebar.tsx` (src/components/ftc/provisions/): current sidebar with 3 categories — modify to remove practice_area
- `Tabs` component from shadcn/ui: already used for main tab navigation — reuse for sub-tabs

### Established Patterns
- URL search params (useSearchParams) for cross-component navigation state
- React Query with staleTime: Infinity for static data fetching
- useMemo for derived/filtered data
- cn() utility for conditional Tailwind classes
- font-garamond, border-rule, text-gold design tokens

### Integration Points
- `FTCProvisionsTab.tsx`: main orchestrator — needs major restructure to add sub-tabs
- `TopicSidebar.tsx`: remove practice_area from CATEGORY_ORDER array
- `useFTCData` hook: provides case data for the case browser list
- `use-case-file.ts`: provides individual case provisions for inline expansion

</code_context>

<specifics>
## Specific Ideas

- "By Case" as default tab signals the library is equally about finding cases as it is about browsing provisions by topic
- Inline accordion expansion (not Sheet modal) for case provisions keeps user in the browsing flow — important for scanning multiple cases
- Filter-as-you-type search means the case list itself is the search results — no separate results view needed

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 11-library-restructure*
*Context gathered: 2026-03-02*
