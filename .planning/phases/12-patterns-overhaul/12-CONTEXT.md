# Phase 12: Patterns Overhaul - Context

**Gathered:** 2026-03-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Transform the patterns section from a single flat list of provision-based patterns into a multi-category experience with two sub-tabs: restructured remedy patterns (consolidated categories, structural patterns separated) and new behavioral summary patterns extracted from takeaway data. Patterns tab navigation, data pipeline extraction, category consolidation, and display are all in scope. New pattern types or cross-tab linking are not.

</domain>

<decisions>
## Implementation Decisions

### Pattern type navigation
- Sub-tabs within the Patterns tab: "Remedy Patterns" and "Behavioral Patterns"
- Default sub-tab: Behavioral Patterns (lead with new content)
- Overall "Cross-Case Patterns" header stays; each sub-tab shows its own count (e.g., "35 remedy patterns" / "12 behavioral patterns")
- Sub-tab implementation follows existing Provisions tab sub-tab pattern

### Behavioral pattern extraction
- Hybrid approach: AI proposes categories from takeaway data, user approves before finalizing
- Extraction performed by a Sonnet agent within Claude Code — no external API calls or ANTHROPIC_API_KEY usage
- Agent reads all 293 case takeaway_brief and takeaway_full fields
- Multiple behavioral patterns per case (a case can appear under several categories)
- Target granularity: 10-15 broad categories (e.g., "Deceptive marketing", "Unauthorized data collection")
- Two-pass workflow: agent outputs a review file (categories + sample cases), user edits, agent re-runs to finalize
- Output: new JSON file (e.g., ftc-behavioral-patterns.json) in public/data/
- Each behavioral pattern includes: both takeaway_brief and takeaway_full per case, enforcement topic/statute associations for cross-referencing

### Remedy category consolidation
- Structural (boilerplate) patterns separated into a collapsible "Order Mechanics" group at the bottom of the Remedy Patterns sub-tab
- 7 merge groups decided (52 patterns → ~35 patterns):

**Merge 1:** Annual Certification + Annual Certifications → **"Annual Certification"** (35 cases)

**Merge 2:** Notice and Affirmative Express Consent Provision + Notice and Affirmative Express Consent → **"Notice and Affirmative Express Consent"** (6 cases)

**Merge 3:** Privacy Program + Mandated Privacy and Information Security Program + Information Security Program + Protection of Data → **"Data Protection Program"** (95 cases)

**Merge 4:** Monitoring Technology Prohibited + Use of Tracking Technology Limited + Sensitive Location Data Program + Location Data Deletion Requests → **"Tracking & Surveillance Restrictions"** (26 cases)

**Merge 5:** Use of Facial Recognition or Analysis Systems Prohibited + Deletion of Covered Biometric Information + Mandated Automated Biometric Security or Surveillance System Monitoring Program + Mandatory Notice and Complaint Procedures for Automated Biometric Security or Surveillance Systems + Required Retention Limits for Biometric Information + Disclosure of Automated Biometric Security or Surveillance Systems → **"Biometric Data Protections"** (~3-5 cases)

**Merge 6:** Data Deletion Requirements + Data Retention Limits → **"Data Lifecycle Requirements"** (23 cases)

**Merge 7:** Civil Penalty + Monetary Relief and Judgment + Costs and Fees → **"Financial Remedies"** (~138 cases)

- All remaining substantive patterns kept as-is (no further merges)

### Behavioral pattern display
- Same PatternRow layout as remedy patterns: name, case count, year range, enforcement topic badges
- Expanded view: timeline chart (cases over time) + case cards showing company name, date, takeaway_brief; click to see takeaway_full
- Same controls as remedy patterns: search bar, topic filter dropdown, sort by recency/cases/name
- No TextDiff component for behavioral patterns (takeaways are unique free-form text per case, not comparable variants)

### Claude's Discretion
- Exact behavioral category names (subject to user review/approval)
- Timeline chart adaptation for behavioral patterns
- Case card layout within expanded behavioral pattern rows
- Collapsible group styling for structural patterns
- Loading skeleton and error states

</decisions>

<specifics>
## Specific Ideas

- Behavioral extraction uses Sonnet agent inside Claude Code session, not a pipeline script with API key
- Review file approach for both behavioral categories and (already decided) remedy merges — user edits before finalization
- Structural patterns are not hidden, just visually separated in a collapsible section

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `FTCPatternsTab.tsx`: Current patterns tab shell — will become the sub-tab container
- `PatternList.tsx`: Search/filter/sort controls + pattern list rendering — reusable for both sub-tabs
- `PatternRow.tsx`: Expandable row with name, case count, year range, topic badges — reusable for behavioral patterns
- `PatternTimeline.tsx`: Year-over-year timeline chart — reusable for behavioral patterns
- `VariantCard.tsx`: Current provision variant display — used only in remedy patterns, not behavioral
- `TextDiff.tsx`: Provision text diffing — used only in remedy patterns, not behavioral
- `use-patterns.ts`: React Query hook for patterns data — needs extension or sibling hook for behavioral data
- `Collapsible` component from shadcn/ui — available for structural patterns group

### Established Patterns
- Sub-tab navigation: `FTCProvisionsTab.tsx` uses URL search params for sub-tab state (By Topic / By Case) — follow same approach
- Data hooks: React Query with `staleTime: Infinity` for static JSON
- Component structure: PascalCase files in `src/components/ftc/patterns/`
- State management: `useState` for local UI, `useMemo` for derived data
- Pipeline scripts: `scripts/build-*.ts` pattern with `npx tsx` runner

### Integration Points
- `FTCPatternsTab.tsx` registers in `FTCTabShell.tsx` tab system
- New behavioral patterns JSON needs to be served from `public/data/`
- Pattern merge logic needs to update `build-patterns.ts` or run as a post-processing step
- Types in `src/types/ftc.ts` need extension for behavioral pattern data structures

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 12-patterns-overhaul*
*Context gathered: 2026-03-02*
