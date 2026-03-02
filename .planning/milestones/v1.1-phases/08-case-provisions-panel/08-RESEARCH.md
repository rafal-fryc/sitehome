# Phase 8: Case Provisions Panel - Research

**Researched:** 2026-03-01
**Domain:** React UI (Sheet panel + lazy data fetching + collapsible provision display)
**Confidence:** HIGH

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Panel container:** Sheet component (shadcn/ui), slides in from the right. Responsive width: ~50% viewport on desktop, full width on mobile. Backdrop click + X button to close. "View provisions" button on CaseCard opens the Sheet inline (replaces current ExternalLink icon behavior).
- **Provision display:** Compact collapsible rows: provision title + Part number + remedy type badge visible when collapsed. Click/tap a row to expand and show verbatim provision text + FTC.gov link. Provisions grouped by statutory topic with section headers. Each topic group header shows a count badge (e.g., "CAN-SPAM (4)"). No jump-navigation tags -- users scroll naturally through the grouped list.
- **Data loading:** Fetch the individual case JSON file (`/data/ftc-files/[filename].json`) lazily when "View provisions" is clicked. Add a `source_file` field to `FTCCaseSummary` in `ftc-cases.json` during the build step so each case carries its own filename -- no separate lookup map needed. Show a brief loading state inside the Sheet while the case file loads. Use React Query with `staleTime: Infinity` for caching (consistent with existing hooks).
- **Panel header:** Header shows: company name, year, violation type, provision count, link to case on FTC.gov. No search or filtering within the panel -- just scroll. Topic grouping with count badges provides sufficient navigation for typical 5-30 provision cases.

### Claude's Discretion
- Loading skeleton/spinner design inside the Sheet
- Exact collapsible animation (Collapsible component vs custom)
- Provision sort order within each topic group
- How to handle the edge case of provisions with no statutory topic

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CPNL-01 | User can view case-specific provisions in a modal/Sheet from industry tab | Sheet component already exists; CaseCard already has `onViewProvisions` callback wired through CaseCardList -> SectorDetail -> FTCIndustryTab; `handleViewProvisions` in FTCIndustryTab currently navigates to provisions tab -- replace with Sheet open state |
| CPNL-02 | Modal shows verbatim provision text with citations for that case only | Case JSON files in `/data/ftc-files/{id}.json` contain `order.provisions[]` with `requirements[].quoted_text` (verbatim text) plus `title`, `summary`, `statutory_topics`, `remedy_types`, `provision_number`; verbatim text assembled by concatenating `requirements[].quoted_text` (same pattern as `build-provisions.ts` line 219-222) |
| CPNL-03 | Industry tab "view provisions" opens panel instead of navigating to provisions tab | Current `handleViewProvisions` in FTCIndustryTab (line 92-98) navigates to provisions tab via `setSearchParams({tab: "provisions"})`; replace with `useState` to manage Sheet open/close + selected case |

</phase_requirements>

## Summary

This phase adds an inline provisions panel to the industry tab so practitioners can view a specific case's provisions without leaving their sector context. The implementation is straightforward: a Sheet component (already available) opens when "View provisions" is clicked on a CaseCard, lazily fetches the case's full JSON file, and displays provisions as collapsible rows grouped by statutory topic.

The existing codebase already provides all the building blocks. The `CaseCard` component has an `onViewProvisions` callback wired through the entire component chain (`CaseCard` -> `CaseCardList` -> `SectorDetail` -> `FTCIndustryTab`). The `FTCIndustryTab` currently navigates to the Provisions tab -- this must be replaced with local Sheet state management. Each case's `id` field directly maps to the file path `/data/ftc-files/{id}.json`, so no build changes are needed for data loading (the `source_file` field mentioned in CONTEXT.md is unnecessary because `id` is already the sanitized filename and the mapping is `{id}.json`).

The case JSON files average ~44KB, making lazy fetching practical. Provisions have 5-30 items per case (average 9.5), which is well-suited for a scrollable grouped list without search/filtering.

**Primary recommendation:** Build a `CaseProvisionsSheet` component that owns Sheet state, a React Query hook for lazy case file fetching, and a `ProvisionRow` collapsible sub-component. Wire it into `FTCIndustryTab` by replacing the current tab-navigation handler with Sheet state management.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@radix-ui/react-dialog` | ^1.1.14 | Sheet primitive (already in sheet.tsx) | Already installed and powering the existing Sheet component |
| `@radix-ui/react-collapsible` | ^1.1.11 | Expand/collapse provision rows | Already installed with Collapsible/CollapsibleTrigger/CollapsibleContent exports |
| `@tanstack/react-query` | ^5.83.0 | Lazy case file fetching with cache | Already used for all data fetching in the project (`staleTime: Infinity` pattern) |
| `lucide-react` | ^0.462.0 | Icons (ChevronDown, ExternalLink, X) | Already the project's icon library |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `class-variance-authority` | ^0.7.1 | Badge variant styling | Already used for Badge component variants |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Sheet (Radix Dialog) | Drawer (vaul) | Sheet is locked decision; Drawer is bottom-sheet mobile pattern, vaul is installed but Sheet is the right choice for side panel |
| Collapsible (Radix) | Accordion (Radix) | Accordion enforces single-open; Collapsible allows multiple-open which is better for scanning provisions |
| Native overflow scroll | ScrollArea (Radix) | ScrollArea adds custom scrollbar styling; native overflow-y-auto is simpler and sufficient for a Sheet body |

**Installation:** No new packages needed. Everything is already installed.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/ftc/industry/
│   ├── CaseProvisionsSheet.tsx      # NEW: Sheet + header + grouped provision list
│   └── ProvisionRow.tsx             # NEW: Collapsible row for a single provision
├── hooks/
│   └── use-case-file.ts             # NEW: React Query hook for lazy case JSON fetch
├── components/ftc/
│   └── FTCIndustryTab.tsx           # MODIFIED: Sheet state management replaces tab navigation
└── components/ftc/industry/
    └── CaseCard.tsx                 # MODIFIED: Remove ExternalLink icon, keep "View provisions" text
```

### Pattern 1: Sheet State Management in FTCIndustryTab
**What:** Lift Sheet open/close state and selected case to `FTCIndustryTab`, pass down via props.
**When to use:** When a modal/Sheet needs to overlay an entire tab view.
**Why here:** The Sheet must render at the `FTCIndustryTab` level (not inside `SectorDetail`) because it needs to overlay the full tab content and use a portal. The `handleViewProvisions` callback already flows from `FTCIndustryTab` down to `CaseCard`.

```typescript
// In FTCIndustryTab.tsx
const [sheetCase, setSheetCase] = useState<EnhancedFTCCaseSummary | null>(null);

const handleViewProvisions = useCallback(
  (caseData: EnhancedFTCCaseSummary) => {
    setSheetCase(caseData);  // Opens the Sheet with this case's data
  },
  []
);

// Render the Sheet alongside the current view (SectorDetail / SectorGrid / SectorCompare)
return (
  <>
    {/* existing view routing (SectorGrid / SectorDetail / SectorCompare) */}
    <CaseProvisionsSheet
      caseData={sheetCase}
      open={!!sheetCase}
      onOpenChange={(open) => { if (!open) setSheetCase(null); }}
    />
  </>
);
```

### Pattern 2: Lazy Case File Fetching with React Query
**What:** Fetch `/data/ftc-files/{id}.json` only when the Sheet opens, cache indefinitely.
**When to use:** When data is needed on-demand and is static.
**Why here:** Case files average 44KB; prefetching all 293 is wasteful. React Query's `enabled` flag makes the fetch conditional.

```typescript
// src/hooks/use-case-file.ts
import { useQuery } from "@tanstack/react-query";

export function useCaseFile(caseId: string | null) {
  return useQuery({
    queryKey: ["case-file", caseId],
    queryFn: async () => {
      const res = await fetch(`/data/ftc-files/${caseId}.json`);
      if (!res.ok) throw new Error("Failed to load case file");
      return res.json();
    },
    enabled: !!caseId,
    staleTime: Infinity,
  });
}
```

### Pattern 3: Verbatim Text Assembly from Case JSON
**What:** Case JSON stores verbatim text in `order.provisions[].requirements[].quoted_text`. Assemble by concatenating.
**When to use:** When displaying provision text inside the Sheet.
**Why:** The case files do NOT have a `verbatim_text` field at the provision level. The provision-sharded files (`/data/provisions/*.json`) DO have `verbatim_text` but they are topic-indexed, not case-indexed. The build-provisions pipeline assembles it via:

```typescript
const verbatimText = (provision.requirements || [])
  .map((r: any) => r.quoted_text || "")
  .filter(Boolean)
  .join("\n\n");
```

Replicate this in the frontend component or create a utility function.

### Pattern 4: Provision Grouping by Statutory Topic
**What:** Group provisions by their `statutory_topics[]` array, with provisions appearing in each topic group they belong to.
**When to use:** For the grouped display with topic headers and count badges.
**Key detail:** A provision can have multiple statutory topics (appears in multiple groups) or zero topics (edge case for uncategorized provisions).

```typescript
function groupByTopic(provisions: any[]): Map<string, any[]> {
  const groups = new Map<string, any[]>();
  for (const prov of provisions) {
    const topics = prov.statutory_topics ?? [];
    if (topics.length === 0) {
      // Edge case: no topic assigned
      const key = "Other";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(prov);
    } else {
      for (const topic of topics) {
        if (!groups.has(topic)) groups.set(topic, []);
        groups.get(topic)!.push(prov);
      }
    }
  }
  return groups;
}
```

### Pattern 5: Collapsible Provision Rows
**What:** Each provision is a compact row (title + Part number + remedy badge) that expands on click to show verbatim text + FTC link.
**When to use:** For the provision display inside the Sheet.
**Why Collapsible over Accordion:** Collapsible allows multiple provisions to be open simultaneously, which is better for comparing provisions within a case.

```tsx
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";

function ProvisionRow({ provision }: { provision: any }) {
  const verbatimText = (provision.requirements || [])
    .map((r: any) => r.quoted_text || "")
    .filter(Boolean)
    .join("\n\n");

  return (
    <Collapsible>
      <CollapsibleTrigger className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-accent/50">
        <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
        <span className="font-garamond font-semibold truncate">{provision.title}</span>
        <span className="text-xs text-muted-foreground">Part {provision.provision_number}</span>
        {provision.remedy_types?.map((r: string) => (
          <Badge key={r} variant="outline" className="text-xs">{r}</Badge>
        ))}
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pb-3">
        <div className="font-garamond whitespace-pre-line text-sm leading-relaxed">
          {verbatimText || provision.summary}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
```

### Anti-Patterns to Avoid
- **Fetching provision shards instead of case files:** The provision shards are topic-indexed (e.g., `coppa-provisions.json`), not case-indexed. Filtering a shard by case_id would require loading large shard files and discarding most data. Use the case JSON files directly.
- **Adding Sheet state inside SectorDetail:** The Sheet renders via a portal and should be managed at the tab level. Putting state in SectorDetail would lose the Sheet when navigating back to SectorGrid.
- **Creating a new build artifact for case-indexed provisions:** The case files in `ftc-files/` already contain all the provision data needed. No new build step is required.
- **Modifying the build pipeline to add `source_file`:** The CONTEXT.md mentions adding a `source_file` field, but this is unnecessary because `EnhancedFTCCaseSummary.id` is already the sanitized filename and the case file URL is simply `/data/ftc-files/${id}.json`. No build changes needed.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Side panel overlay | Custom fixed-position div | shadcn/ui Sheet (Radix Dialog) | Handles focus trap, portal, backdrop, animations, keyboard nav (Escape), screen reader |
| Expand/collapse animation | Manual height transitions | Radix Collapsible | Handles animation, ARIA expanded/collapsed, keyboard interaction |
| Data fetching + caching | Manual fetch + useState | React Query useQuery | Handles loading/error states, dedup, cache, retry, `enabled` flag |
| Icon chevron rotation | Manual state + className | CSS `[[data-state=open]>&]:rotate-180` | Radix sets `data-state` attribute; CSS selector handles rotation without JS state |

**Key insight:** Every UI interaction pattern in this phase (overlay, collapse, data fetch) has a well-tested library solution already installed. The novel work is composing them together and connecting to the existing data model.

## Common Pitfalls

### Pitfall 1: Sheet Width Override
**What goes wrong:** The default shadcn Sheet width is `w-3/4 sm:max-w-sm` (right variant), which is too narrow for provision text.
**Why it happens:** Sheet's `sheetVariants` cva uses the default right variant sizing.
**How to avoid:** Override width via className on `SheetContent`: `className="w-full sm:w-[50vw] sm:max-w-2xl"`. The Sheet component accepts className and merges with `cn()`.
**Warning signs:** Provision text gets truncated or the panel feels cramped.

### Pitfall 2: Verbatim Text Not at Provision Level
**What goes wrong:** Attempting to access `provision.verbatim_text` in the case JSON file returns `undefined`.
**Why it happens:** Case JSON files store verbatim text inside `requirements[].quoted_text`, not as a top-level provision field. Only the provision shard files (built by `build-provisions.ts`) have a `verbatim_text` field.
**How to avoid:** Always assemble verbatim text by concatenating `provision.requirements[].quoted_text` with `"\n\n"` separator (same logic as `build-provisions.ts` lines 219-222).
**Warning signs:** Empty provision text in expanded rows.

### Pitfall 3: Body Scroll Lock with Sheet Open
**What goes wrong:** Users can still scroll the background content behind the Sheet overlay.
**Why it happens:** Radix Dialog (which Sheet uses) normally handles scroll lock, but only if the overlay is rendered correctly.
**How to avoid:** Ensure `SheetOverlay` is rendered (it is by default in the existing Sheet component). The shadcn Sheet already handles this correctly.
**Warning signs:** Background scrolls while Sheet is open.

### Pitfall 4: Missing Accessibility on Collapsible Triggers
**What goes wrong:** Screen readers don't announce expand/collapse state.
**Why it happens:** Using a plain `div` as the trigger instead of the `CollapsibleTrigger` component.
**How to avoid:** Always use `CollapsibleTrigger` (wraps a button element) from Radix. It automatically sets `aria-expanded`.
**Warning signs:** No keyboard interaction or screen reader announcements on provision rows.

### Pitfall 5: Sheet Re-renders Losing Scroll Position
**What goes wrong:** When the Sheet re-renders (e.g., parent state change), scroll position resets to top.
**Why it happens:** React Query refetch or parent re-render causes the Sheet content to unmount/remount.
**How to avoid:** Use `staleTime: Infinity` (prevents refetch) and ensure the Sheet is not conditionally rendered based on loading state (show loading skeleton inside the Sheet body instead of replacing it).
**Warning signs:** Users lose their place in the provision list.

### Pitfall 6: Provisions with No Statutory Topic
**What goes wrong:** Some provisions may have an empty `statutory_topics` array, causing them to be omitted from the grouped display.
**Why it happens:** Not all provisions in a case file have been classified with statutory topics.
**How to avoid:** Group uncategorized provisions under an "Other" or "General" heading, or display them in a separate section at the end.
**Warning signs:** Provision count in header doesn't match the number of visible provisions.

## Code Examples

### Case File JSON Structure (verified from source data)
```json
// /data/ftc-files/01.23_chegg.json (simplified)
{
  "case_info": {
    "docket_number": "C-4782",
    "company": { "name": "Chegg, Inc." },
    "legal_authority": "Section 5(a) of the FTC Act",
    "violation_type": "unfair",
    "ftc_url": "https://www.ftc.gov/...",
    "statutory_topics": ["Section 5 Only"],
    "practice_areas": ["Data Security"],
    "industry_sectors": ["Education", "Technology"]
  },
  "order": {
    "provisions": [
      {
        "provision_number": "I",
        "title": "Prohibition Against Misrepresentations",
        "category": "prohibition",
        "summary": "Respondent must not misrepresent...",
        "requirements": [
          {
            "quoted_text": "A. The extent to which Respondent collects...",
            "deadline": null
          }
        ],
        "statutory_topics": ["Section 5 Only"],
        "practice_areas": ["Data Security"],
        "remedy_types": ["Prohibition"]
      }
    ]
  }
}
```

### EnhancedFTCCaseSummary.id -> File Path Mapping (verified)
```typescript
// id = "01.23_chegg" -> file at /data/ftc-files/01.23_chegg.json
// No build step needed -- id IS the sanitized filename
const url = `/data/ftc-files/${caseData.id}.json`;
```

### Existing Hook Pattern (from use-provisions.ts)
```typescript
// Source: src/hooks/use-provisions.ts
export function useProvisionShard(shardFilename: string | null) {
  return useQuery<ProvisionShardFile>({
    queryKey: ["provisions", shardFilename],
    queryFn: async () => {
      const res = await fetch(`/data/provisions/${shardFilename}`);
      if (!res.ok) throw new Error("Failed to load provisions");
      return res.json();
    },
    enabled: !!shardFilename,
    staleTime: Infinity,
  });
}
```

### Current handleViewProvisions (to be replaced)
```typescript
// Source: src/components/ftc/FTCIndustryTab.tsx lines 92-99
const handleViewProvisions = useCallback(
  (_caseData: EnhancedFTCCaseSummary) => {
    const newParams = new URLSearchParams();
    newParams.set("tab", "provisions");
    setSearchParams(newParams);
  },
  [setSearchParams]
);
```

### Design Tokens Used Across the Project (verified)
```
font-garamond        - All UI text
border-rule          - Borders and dividers
bg-cream/30          - Card backgrounds
text-gold            - Interactive links
text-gold/80         - Hover state for links
text-gold-dark       - Emphasized link text
text-muted-foreground - Secondary/tertiary text
text-primary         - Primary headings
bg-primary/5         - Subtle header backgrounds
tracking-wide-label  - Uppercase label letter-spacing
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Navigate to Provisions tab | Inline Sheet panel | This phase | Users stay on industry tab; no context loss |
| No case-level provision view | Case-scoped provision display | This phase | Practitioners can see all provisions for one case at once |

**No deprecated APIs or outdated patterns involved.** All libraries in use are current versions.

## Open Questions

1. **source_file vs id for file path resolution**
   - What we know: CONTEXT.md says "Add a `source_file` field to `FTCCaseSummary` in `ftc-cases.json` during the build step." However, the `id` field already IS the sanitized filename and maps directly to `/data/ftc-files/{id}.json`. The existing `source_filename` field contains the *original* (unsanitized) filename from the FTC source data, not the sanitized one.
   - What's unclear: Whether the user specifically wants a new `source_file` field added or whether using `id` is acceptable.
   - Recommendation: Use `id` directly -- it already works and requires no build changes. If the user insists on a separate field, it would be a trivial addition to `build-ftc-data.ts`. Planner should note this discrepancy and explain the simplification.

2. **Provision sort order within topic groups**
   - What we know: This is left to Claude's discretion. Provisions in the case JSON are ordered by their Roman numeral provision_number (I, II, III, ...), which matches the order in the consent decree.
   - Recommendation: Preserve the original order (as they appear in the JSON array, which is the order in the consent decree). This is the most natural order for legal practitioners who expect provisions in document order.

3. **Provisions with no statutory topic**
   - What we know: In the current dataset, all classified provisions have at least one statutory topic (based on the build pipeline which requires classification). However, edge cases may exist.
   - Recommendation: Display provisions without statutory topics in an "Other" group at the end of the list, consistent with how `build-provisions.ts` handles the same edge case.

## Sources

### Primary (HIGH confidence)
- **Codebase inspection** -- All component files, hooks, types, and build scripts read directly from source
- **Data inspection** -- Case JSON files examined for structure and field availability
- **Package.json** -- All dependency versions verified from project package.json

### Secondary (MEDIUM confidence)
- **Radix UI Dialog** -- Sheet behavior (focus trap, scroll lock, portal) based on Radix Dialog primitives which the project's sheet.tsx wraps
- **Radix UI Collapsible** -- Expand/collapse behavior based on the installed `@radix-ui/react-collapsible` package

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed and in use in the project
- Architecture: HIGH - All integration points verified in source code; component chain fully traced
- Pitfalls: HIGH - Based on direct codebase inspection (e.g., verbatim text location, Sheet width defaults)
- Data model: HIGH - Case JSON structure verified against actual file content

**Research date:** 2026-03-01
**Valid until:** 2026-04-01 (stable -- no external dependencies or moving targets)
