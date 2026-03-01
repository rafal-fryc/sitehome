# Phase 8: Case Provisions Panel - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Practitioners can drill into a specific case's provisions from the industry tab without losing sector context. Clicking "View provisions" on a case card opens an inline Sheet showing that case's provisions with verbatim text and citations. Closing the Sheet returns to the industry tab. No navigation to the Provisions tab occurs.

</domain>

<decisions>
## Implementation Decisions

### Panel container
- Sheet component (shadcn/ui), slides in from the right
- Responsive width: ~50% viewport on desktop, full width on mobile
- Backdrop click closes the Sheet (standard behavior) plus an X button inside
- "View provisions" button on CaseCard opens the Sheet inline (replaces current ExternalLink icon behavior)

### Provision display
- Compact collapsible rows: provision title + Part number + remedy type badge visible when collapsed
- Click/tap a row to expand and show verbatim provision text + FTC.gov link
- Provisions grouped by statutory topic with section headers
- Each topic group header shows a count badge (e.g., "CAN-SPAM (4)")
- No jump-navigation tags — users scroll naturally through the grouped list

### Data loading
- Fetch the individual case JSON file (`/data/ftc-files/[filename].json`) lazily when "View provisions" is clicked
- Add a `source_file` field to `FTCCaseSummary` in `ftc-cases.json` during the build step so each case carries its own filename — no separate lookup map needed
- Show a brief loading state inside the Sheet while the case file loads
- Use React Query with `staleTime: Infinity` for caching (consistent with existing hooks)

### Panel header
- Header shows: company name, year, violation type, provision count, link to case on FTC.gov
- No search or filtering within the panel — just scroll
- Topic grouping with count badges provides sufficient navigation for typical 5-30 provision cases

### Claude's Discretion
- Loading skeleton/spinner design inside the Sheet
- Exact collapsible animation (Collapsible component vs custom)
- Provision sort order within each topic group
- How to handle the edge case of provisions with no statutory topic

</decisions>

<specifics>
## Specific Ideas

- Compact collapsible layout lets practitioners scan all provision titles before reading any — overview first, detail on demand
- Remedy type badges on collapsed rows leverage Phase 6 reclassification work (e.g., "Data Deletion", "Monetary Penalty")
- The panel should feel lightweight — a quick reference, not a full-page experience

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Sheet` component (`src/components/ui/sheet.tsx`): shadcn/ui Sheet with SheetContent, SheetHeader, SheetTitle, SheetDescription
- `Collapsible` component (`src/components/ui/collapsible.tsx`): shadcn/ui for expand/collapse behavior
- `ProvisionCard` (`src/components/ftc/provisions/ProvisionCard.tsx`): existing provision display — not reused directly but its verbatim text + FTC link pattern is replicated in expanded rows
- `CaseCard` (`src/components/ftc/industry/CaseCard.tsx`): already has `onViewProvisions` callback prop wired through `CaseCardList`
- `Badge` component (`src/components/ui/badge.tsx`): for remedy type badges

### Established Patterns
- React Query hooks in `src/hooks/` with `staleTime: Infinity` for static data fetching
- `cn()` utility for conditional Tailwind class composition
- Design tokens: `font-garamond`, `border-rule`, `bg-cream/30`, `text-gold`, `text-muted-foreground`
- Loading/error guard pattern before rendering main UI

### Integration Points
- `CaseCard.onViewProvisions` callback — currently passed through `CaseCardList`, opens the Sheet
- `CaseCardList.onViewProvisions(caseData)` — receives `EnhancedFTCCaseSummary`, needs to trigger Sheet state
- `FTCIndustryTab` — Sheet state likely managed here or in `SectorDetail`
- `build-ftc-data.ts` pipeline script — add `source_file` field to case summary output
- `FTCCaseSummary` type in `src/types/ftc.ts` — add `source_file: string` field

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-case-provisions-panel*
*Context gathered: 2026-03-01*
