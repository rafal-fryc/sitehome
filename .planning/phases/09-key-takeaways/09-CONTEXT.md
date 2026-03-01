# Phase 9: Key Takeaways - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Generate and display plain-language summaries ("takeaways") of what each business did wrong and what the FTC required, so practitioners can understand a case without reading the full consent order. Takeaways are generated at build time from structured case data and displayed on case cards and in the case provisions panel.

</domain>

<decisions>
## Implementation Decisions

### Takeaway content & length
- **Brief takeaway (card):** One sentence, ~15-25 words, focuses only on what the business did wrong (violation). Does not mention the remedy.
- **Full takeaway (panel):** Short paragraph, 2-3 sentences, covers what went wrong AND what the FTC ordered (violation + remedy).
- **Tone:** Practitioner plain English — direct, factual, no legalese. Accessible to non-lawyers but not dumbed down.

### Generation approach
- LLM-generated at build time, following the existing `classify-provisions.ts` pipeline pattern (Anthropic SDK, dry-run support)
- **Input fields:** Full context — `complaint.factual_background`, `complaint.representations_made`, provision titles/summaries, `legal_authority`, `violation_type`, `complaint_counts`
- **Storage:** Add `takeaway_brief` and `takeaway_full` fields directly to each `public/data/ftc-files/{case}.json` file
- **Dry-run validation (TAKE-05):** Run on 10 representative sample cases before full batch — sample selection is Claude's discretion

### AI disclosure style
- **Card (brief takeaway):** Inline subtle badge with text "AI-generated" next to the takeaway sentence
- **Panel (full takeaway):** Italic disclaimer line below the paragraph: "AI-generated from structured case data"
- **Per-takeaway labeling only** — no global page-level disclaimer or banner needed

### Card & panel placement
- **CaseCard:** Replace the current "X provisions" line with the brief takeaway text + AI-generated badge. If no takeaway exists, fall back to showing the provision count.
- **CaseProvisionsSheet:** Full takeaway paragraph appears in the SheetHeader, below the metadata line (year | violation | provisions), above the divider. Italic disclaimer follows.
- **Tab scope:** Claude determines which tabs have case-level displays that should show takeaways (Industry tab CaseCard is confirmed; others audited during planning)

### Claude's Discretion
- Dry-run sample case selection (representative mix of violation types, industries, complexity)
- Which tabs beyond Industry need takeaway integration
- Exact prompt engineering for the LLM generation script
- Badge styling and typography details

</decisions>

<specifics>
## Specific Ideas

- Follow the `classify-provisions.ts` pattern closely — same Anthropic SDK setup, `--dry-run` flag, write back to source JSON files
- Brief takeaway should feel like a tweet-length summary a practitioner would share — e.g., "Charged consumers without consent using dark patterns and retaliated against chargeback disputes."
- Full takeaway should read like a case brief opener — what happened, what law applied, what was ordered

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/classify-provisions.ts`: LLM pipeline script pattern with Anthropic SDK, dry-run mode, file-by-file processing — direct template for the takeaway generation script
- `CaseCard.tsx` (`src/components/ftc/industry/CaseCard.tsx`): Compact card showing company, year, violation type, provision count — provision count line will be replaced
- `CaseProvisionsSheet.tsx` (`src/components/ftc/industry/CaseProvisionsSheet.tsx`): Slide-out panel with SheetHeader metadata — takeaway paragraph goes below metadata
- `Badge` component (`src/components/ui/badge.tsx`): Used throughout for inline labels — use for "AI-generated" badge
- `useCaseFile` hook (`src/hooks/use-case-file.ts`): Fetches individual case JSON files — already loads the data where takeaways will be stored

### Established Patterns
- Build-time LLM processing with `npx tsx scripts/` — no runtime API calls
- Static JSON in `public/data/` fetched via React Query with `staleTime: Infinity`
- Loading/error guard pattern in data-fetch components
- `font-garamond`, `text-muted-foreground`, `border-rule` design tokens
- `cn()` for conditional class composition

### Integration Points
- `public/data/ftc-files/{case}.json` — new `takeaway_brief` and `takeaway_full` fields
- `public/data/ftc-cases.json` — may need `takeaway_brief` added to summary records for card display without fetching full case file
- `CaseCard` component — modify to show takeaway instead of provision count
- `CaseProvisionsSheet` SheetHeader — add takeaway paragraph section
- `EnhancedFTCCaseSummary` type in `src/types/ftc.ts` — add optional takeaway fields
- `scripts/build-ftc-data.ts` — may need to copy takeaway_brief into the aggregate case index

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 09-key-takeaways*
*Context gathered: 2026-03-01*
