# Phase 4: Company & Industry View - Research

**Researched:** 2026-02-25
**Domain:** Industry sector browsing, enforcement pattern visualization, comparative analytics, case card navigation
**Confidence:** HIGH

## Summary

Phase 4 adds an "Industries" tab to the existing FTCTabShell, enabling users to browse enforcement actions by industry sector and compare enforcement patterns across sectors. The data foundation is already solid: all 285 cases in `ftc-cases.json` already have `industry_sectors` arrays classified at build time (PIPE-04 complete), with 8 sectors (Technology: 146, Financial Services: 59, Retail: 44, Healthcare: 30, Other: 23, Social Media: 16, Education: 8, Telecom: 7) and 48 cases classified into multiple sectors. Each `EnhancedFTCCaseSummary` already carries `statutory_topics`, `practice_areas`, `remedy_types`, and `provision_counts_by_topic` — everything needed to compute per-sector enforcement pattern breakdowns without additional data pipeline work.

The implementation follows established project patterns exactly: a new `FTCIndustryTab` component added to FTCTabShell (like FTCAnalyticsTab and FTCProvisionsTab), using the same Recharts charting patterns (horizontal bars, stacked bars), ReferenceTable for drill-down data, Card/Badge components for the sector grid, and Breadcrumb components for navigation within sectors. URL state management follows the existing `useSearchParams` pattern. No new libraries are needed — the entire phase builds on the current stack of React 18, Recharts 2.15, TanStack Query 5, react-router-dom 6, and the shadcn/ui component library already installed. The sector card grid with expandable subsectors can use the existing Collapsible component from Radix.

**Primary recommendation:** Build entirely on existing patterns. Add a new "Industries" tab to FTCTabShell, create a sector card grid landing page, a sector detail view with enforcement pattern charts and case cards, and a compare view for side-by-side sector analysis. All data derives from the already-loaded `ftc-cases.json` via `useFTCData()` — no new data files or API calls required.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Classification approach: Claude's discretion based on available data (existing tags, company metadata, or build-pipeline mapping)
- Broad sectors (5-8 top-level) with expandable subsectors within each
- Cases can appear in multiple sectors — no single-sector constraint
- An "Other" catch-all sector for cases that don't fit defined sectors
- Landing page: sector card grid showing name, case count, and 2-3 most common enforcement topics as tags
- Sector cards on the grid are expandable to show subsector breakdown inline
- Inside a sector view: breadcrumb trail at top ("Industries > Technology") with back arrow to return to grid
- No dropdown for switching between sectors — user navigates back to grid
- Both charts and expandable reference tables (matching the analytics tab pattern) showing topic and remedy type distribution per sector
- No per-sector enforcement timeline — analytics tab already covers time-based charts
- Side-by-side comparison: user selects 2-3 sectors from the grid, then a "Compare" button opens a side-by-side pattern view
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

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INDY-01 | User can browse enforcement actions by industry sector (tech, health, retail, financial services, etc.) | Sector card grid landing page with 8 existing classified sectors; `EnhancedFTCCaseSummary.industry_sectors` already populated for all 285 cases; sector detail view with case cards |
| INDY-02 | Industry view shows how enforcement patterns (topics, remedy types) vary across sectors | Per-sector charts using Recharts horizontal bars for topic and remedy distribution; ReferenceTable for drill-down; compare view for side-by-side multi-sector comparison |
| INDY-03 | Individual case cards within industry view show company details, provision summaries, and links to full provisions | Compact case card component showing company name, year, violation type, provision count; "View provisions" link constructs URL to Provisions Library tab filtered by case |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18.3.1 | UI framework | Already installed, project standard |
| Recharts | 2.15.4 | Charts for enforcement pattern breakdowns | Already used in analytics tab for identical chart types |
| @tanstack/react-query | 5.83.0 | Data fetching (useFTCData) | Already used, data already cached with staleTime: Infinity |
| react-router-dom | 6.30.1 | URL state via useSearchParams | Already used for tab navigation and provisions filtering |
| shadcn/ui (Radix) | Various | Card, Badge, Breadcrumb, Collapsible, Pagination, Popover, Checkbox | All already installed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | 0.462.0 | Icons (ChevronDown, ChevronRight, ArrowLeft, ExternalLink) | Sector card expand icons, breadcrumb navigation, case card links |
| date-fns | 3.6.0 | Date formatting if needed for case cards | Already available, minimal usage expected |
| class-variance-authority | 0.7.1 | Badge variants for sector topic tags | Already in use via shadcn Badge component |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Recharts horizontal bars | Pie charts for pattern breakdown | Horizontal bars are more readable for comparison across sectors; pie charts poorly encode differences in similar-sized segments; project already has horizontal bar pattern in ProvisionAnalytics |
| Collapsible for subsector expansion | Accordion | Collapsible is simpler for single-item expand; Accordion is for mutually exclusive expansion — not what we need since user may want multiple subsectors visible |
| URL params for sector state | React state only | URL params enable shareable links and browser back/forward — consistent with existing tab and topic state patterns |

**Installation:**
```bash
# No new installations needed — all libraries already in package.json
```

## Architecture Patterns

### Recommended Project Structure
```
src/components/ftc/
├── FTCTabShell.tsx              # Modified: add "industries" tab
├── FTCIndustryTab.tsx           # NEW: top-level industry tab component
├── industry/
│   ├── IndustrySummary.tsx      # NEW: headline + intro (like AnalyticsSummary)
│   ├── SectorGrid.tsx           # NEW: landing page card grid
│   ├── SectorCard.tsx           # NEW: individual sector card with expand
│   ├── SectorDetail.tsx         # NEW: single sector detail view
│   ├── SectorPatternCharts.tsx  # NEW: topic + remedy charts for a sector
│   ├── CaseCard.tsx             # NEW: compact enforcement action card
│   ├── CaseCardList.tsx         # NEW: paginated case card list with filters/sort
│   ├── SectorCompare.tsx        # NEW: side-by-side comparison view
│   └── industry-utils.ts        # NEW: sector taxonomy, subsector mapping, helpers
```

### Pattern 1: Tab Integration
**What:** Add "Industries" as a fourth tab in FTCTabShell following the exact pattern of existing tabs.
**When to use:** Always — this is the entry point.
**Example:**
```typescript
// FTCTabShell.tsx modification
type FTCTab = "analytics" | "provisions" | "patterns" | "industries";
const VALID_TABS: FTCTab[] = ["analytics", "provisions", "patterns", "industries"];

// In JSX:
<TabsTrigger value="industries">Industries</TabsTrigger>
<TabsContent value="industries">
  <FTCIndustryTab data={data} />
</TabsContent>
```

### Pattern 2: Sector State via URL Params
**What:** Use `useSearchParams` to track selected sector and compare state, consistent with existing tab/topic patterns.
**When to use:** All navigation within the industry tab.
**Example:**
```typescript
// URL patterns:
// /FTCAnalytics?tab=industries                         → sector grid
// /FTCAnalytics?tab=industries&sector=technology       → sector detail
// /FTCAnalytics?tab=industries&compare=technology,healthcare  → compare view

const [searchParams, setSearchParams] = useSearchParams();
const selectedSector = searchParams.get("sector");
const compareParam = searchParams.get("compare");
const compareSectors = compareParam ? compareParam.split(",") : [];
```

### Pattern 3: Data Derivation from Existing Cache
**What:** All sector data computed client-side from the already-loaded `ftc-cases.json` via `useFTCData()`. No new data files needed.
**When to use:** Always — the dataset is 285 cases, well within browser computation limits.
**Example:**
```typescript
// Derive sector stats from cases already in memory
const sectorStats = useMemo(() => {
  const enhanced = data.cases as EnhancedFTCCaseSummary[];
  const stats: Record<string, SectorStats> = {};

  for (const c of enhanced) {
    for (const sector of c.industry_sectors) {
      if (!stats[sector]) {
        stats[sector] = { cases: [], topicCounts: {}, remedyCounts: {} };
      }
      stats[sector].cases.push(c);
      // Aggregate topics and remedies...
    }
  }
  return stats;
}, [data]);
```

### Pattern 4: Sector Taxonomy as Constants
**What:** Define the 8 sectors, their slugs, display labels, and subsector mappings as a constants file, similar to how `CATEGORY_RULES` and `ADMINISTRATIONS` are defined in `constants/ftc.ts`.
**When to use:** Always — keeps taxonomy centralized and maintainable.
**Example:**
```typescript
// industry-utils.ts
export interface SectorDefinition {
  slug: string;
  label: string;
  subsectors: string[];
}

export const SECTOR_TAXONOMY: SectorDefinition[] = [
  {
    slug: "technology",
    label: "Technology",
    subsectors: ["Software & Apps", "IoT & Connected Devices", "Ad Tech & Tracking"],
  },
  {
    slug: "healthcare",
    label: "Healthcare",
    subsectors: ["Health Tech", "Pharma & Biotech", "Health Services"],
  },
  // ...
];

export function getSectorBySlug(slug: string): SectorDefinition | undefined {
  return SECTOR_TAXONOMY.find(s => s.slug === slug);
}

export function getSectorSlug(label: string): string {
  return label.toLowerCase().replace(/\s+/g, "-");
}
```

### Pattern 5: Chart Reuse from Analytics Tab
**What:** Reuse the identical Recharts patterns from `ProvisionAnalytics.tsx` (horizontal bars with alternating green/gold colors) and `EnforcementByYear.tsx` (stacked bars) for sector enforcement patterns.
**When to use:** SectorPatternCharts and SectorCompare components.
**Example:**
```typescript
// Consistent chart styling across the application
const CHART_STYLE = {
  gridStroke: "hsl(50, 15%, 85%)",
  tickStyle: { fontSize: 12, fill: "hsl(158, 20%, 35%)" },
  tooltipStyle: {
    background: "hsl(40, 50%, 98%)",
    border: "1px solid hsl(40, 25%, 80%)",
    borderRadius: 0,
    fontFamily: "EB Garamond, serif",
  },
  barColors: ["hsl(158, 60%, 35%)", "hsl(45, 85%, 55%)"],
};
```

### Pattern 6: Cross-Tab Navigation (Case Card → Provisions)
**What:** Case cards link to the Provisions Library tab filtered to that specific case. This constructs a URL that the ProvisionsTab can interpret.
**When to use:** CaseCard "View provisions" link.
**Example:**
```typescript
// Navigate to provisions tab filtered by company name
const handleViewProvisions = (caseSummary: EnhancedFTCCaseSummary) => {
  const params = new URLSearchParams();
  params.set("tab", "provisions");
  // The provisions tab supports company filtering via the filter bar
  // Set a default topic and let user refine
  setSearchParams(params, { replace: false });
};
```

### Anti-Patterns to Avoid
- **Fetching data separately for each sector:** The full dataset is 285 cases. Do NOT create per-sector data files or API calls. Derive everything from `useFTCData()`.
- **Duplicating chart configuration:** Extract shared Recharts styling into constants. Every chart in the analytics tab uses the same grid stroke, tick style, and tooltip style — sector charts must match exactly.
- **Creating subsectors at the data pipeline level:** Subsectors are a UI concern only. They should be derived from mapping the `business_description` field or by keyword heuristics in a client-side utility function, not added to the build pipeline.
- **Using React state for sector selection instead of URL params:** This breaks browser back/forward and prevents sharing links. Always use `useSearchParams`.
- **Building a completely new card component when existing patterns exist:** The ProvisionCard pattern (header bar + content) should inform CaseCard styling, but CaseCard is intentionally more compact (no verbatim text).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Expandable sector cards | Custom expand/collapse state | Radix Collapsible (already installed) | Handles animation, accessibility, keyboard navigation |
| Breadcrumb navigation | Custom breadcrumb HTML | shadcn/ui Breadcrumb components | Already installed, handles separators, accessibility |
| Pagination controls | Custom page numbers | shadcn/ui Pagination components | Already used in ProvisionsContent with getPageNumbers helper |
| Sector topic tags | Custom styled spans | Badge component (already installed) | Consistent styling via variant props |
| Sort/filter controls | Custom popover menus | Popover + Checkbox from shadcn/ui | Already used in ProvisionFilterBar — identical pattern |
| Card containers | Custom div styling | Card/CardHeader/CardContent/CardFooter | Already installed, themed for project palette |

**Key insight:** Every UI primitive needed for Phase 4 already exists in the project's shadcn/ui component library. The only new components are domain-specific compositions of existing primitives.

## Common Pitfalls

### Pitfall 1: Stale URL Params When Switching Tabs
**What goes wrong:** User is on `?tab=industries&sector=technology`, switches to Analytics tab, then back to Industries — sector param persists unexpectedly or causes stale state.
**Why it happens:** FTCTabShell.handleTabChange currently clears all params on tab switch (`const newParams = new URLSearchParams()`). This is actually correct — it prevents stale state. But the Industry tab must be designed to handle "no sector selected" gracefully as its default landing page (the grid).
**How to avoid:** Ensure FTCIndustryTab checks for `sector` and `compare` params and defaults to the grid view when neither is present. Never assume a sector is always selected.
**Warning signs:** Grid doesn't show after switching away and back; sector detail loads with undefined sector.

### Pitfall 2: Cases in Multiple Sectors Appearing Twice in Comparisons
**What goes wrong:** When comparing Technology vs Healthcare, a case like "CVS Caremark" (both Healthcare and Retail) appears in both sectors' case lists, inflating counts.
**Why it happens:** 48 of 285 cases have multiple `industry_sectors`. This is correct behavior per the user decision ("Cases can appear in multiple sectors — no single-sector constraint"), but the comparison view must make this clear.
**How to avoid:** Display a note in the compare view: "Some cases appear in multiple sectors." Consider showing overlap counts. Ensure charts clearly label "Cases" not "Unique cases."
**Warning signs:** Sector case count totals sum to more than 285; user confusion about duplicate entries.

### Pitfall 3: Subsector Classification Without Source Data
**What goes wrong:** The user wants expandable subsectors, but the source data only has top-level `industry_sectors` (e.g., "Technology") — no subsector field exists.
**Why it happens:** PIPE-04 classified at the sector level only. Subsectors need to be derived.
**How to avoid:** Use keyword-based heuristics on the `business_description` field (available for 290/293 cases) to map cases to subsectors. Define subsectors as a UI-layer taxonomy constant, not a data pipeline addition. Accept that some cases will fall into a "General" subsector within their sector.
**Warning signs:** Empty subsector groups; cases that don't match any subsector keyword.

### Pitfall 4: Performance with Recharts in Compare View
**What goes wrong:** Rendering 4-6 Recharts charts simultaneously in the compare view (2-3 sectors x 2 chart types each) causes sluggish rendering.
**Why it happens:** Recharts renders SVG DOM elements; many charts on screen simultaneously can be expensive.
**How to avoid:** Use `ResponsiveContainer` with explicit heights. Consider lazy rendering: only render charts when their container is in the viewport. For 2-3 sectors this should be manageable, but be conscious of the total chart count.
**Warning signs:** Noticeable lag when opening compare view; scroll jank with multiple charts visible.

### Pitfall 5: Provision Link Construction
**What goes wrong:** "View provisions" link on case cards doesn't properly filter the Provisions Library to that case's provisions.
**Why it happens:** The Provisions Library filters by topic (shard), company, date range, and remedy type — but not by case_id directly. There's no "show all provisions for case X" filter.
**How to avoid:** Use the company name filter as the primary mechanism: navigate to `?tab=provisions&topic={first_topic}` and let the user see that company's provisions. Alternatively, set the company filter via URL params if the ProvisionsTab supports it (currently it does not read company from URL — this may need a small enhancement).
**Warning signs:** Link goes to generic provisions landing; user sees all provisions instead of case-specific ones.

### Pitfall 6: Tab Shell handleTabChange Clearing Industry Params
**What goes wrong:** Within the Industries tab, navigating between grid/detail/compare changes URL params. But FTCTabShell's `handleTabChange` clears all params except `tab`. If the industry tab components use `setSearchParams` incorrectly, they could trigger a tab change side effect.
**How to avoid:** Industry tab internal navigation should always preserve the `tab=industries` param when updating `sector` or `compare` params. Use the pattern: `const newParams = new URLSearchParams(searchParams); newParams.set("sector", slug); setSearchParams(newParams, { replace: true });` — copying existing params and modifying only what's needed.
**Warning signs:** Navigating to a sector resets to analytics tab; breadcrumb back button clears everything.

## Code Examples

Verified patterns from the existing codebase:

### Sector Grid Card
```typescript
// Based on Card component + Badge + Collapsible patterns already in project
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";

interface SectorCardProps {
  sector: SectorDefinition;
  caseCount: number;
  topTopics: string[];
  subsectorCounts: { label: string; count: number }[];
  isSelected: boolean;
  onSelect: () => void;
  onToggleExpand: () => void;
  isExpanded: boolean;
}

function SectorCard({ sector, caseCount, topTopics, subsectorCounts, isSelected, onSelect, onToggleExpand, isExpanded }: SectorCardProps) {
  return (
    <Card className={cn("cursor-pointer hover:border-gold/50 transition-colors", isSelected && "border-gold bg-gold/5")}>
      <CardHeader className="pb-3" onClick={onSelect}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold font-garamond text-primary">{sector.label}</h3>
          <Badge variant="secondary">{caseCount} cases</Badge>
        </div>
        <div className="flex gap-1.5 flex-wrap mt-2">
          {topTopics.map(topic => (
            <Badge key={topic} variant="outline" className="text-xs font-garamond">{topic}</Badge>
          ))}
        </div>
      </CardHeader>
      {subsectorCounts.length > 0 && (
        <Collapsible open={isExpanded} onOpenChange={onToggleExpand}>
          <CollapsibleTrigger className="w-full px-6 pb-3 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            Subsectors
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              {/* subsector list */}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      )}
    </Card>
  );
}
```

### Breadcrumb Navigation Inside Sector View
```typescript
// Using existing shadcn Breadcrumb components
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { ArrowLeft } from "lucide-react";

function SectorBreadcrumb({ sectorLabel, onBack }: { sectorLabel: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
      </button>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink className="cursor-pointer font-garamond" onClick={onBack}>Industries</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="font-garamond">{sectorLabel}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
```

### Horizontal Bar Chart for Sector Pattern Breakdown
```typescript
// Exact Recharts pattern from ProvisionAnalytics.tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

function SectorTopicChart({ data }: { data: { name: string; count: number }[] }) {
  const chartHeight = Math.max(250, data.length * 40);
  return (
    <div className="w-full" style={{ height: chartHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(50, 15%, 85%)" />
          <XAxis type="number" tick={{ fontSize: 12, fill: "hsl(158, 20%, 35%)" }} />
          <YAxis type="category" dataKey="name" width={200} tick={{ fontSize: 12, fill: "hsl(158, 20%, 35%)" }} />
          <Tooltip contentStyle={{
            background: "hsl(40, 50%, 98%)",
            border: "1px solid hsl(40, 25%, 80%)",
            borderRadius: 0,
            fontFamily: "EB Garamond, serif",
          }} />
          <Bar dataKey="count" name="Cases">
            {data.map((_, i) => (
              <Cell key={i} fill={i % 2 === 0 ? "hsl(158, 60%, 35%)" : "hsl(45, 85%, 55%)"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

### Compact Case Card
```typescript
// Simpler than ProvisionCard — compact card per user decision
import { ExternalLink } from "lucide-react";
import type { EnhancedFTCCaseSummary } from "@/types/ftc";

function CaseCard({ caseData, onViewProvisions }: { caseData: EnhancedFTCCaseSummary; onViewProvisions: () => void }) {
  const provisionCount = caseData.num_provisions;
  return (
    <article className="border border-rule bg-cream/30 px-4 py-3 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-3">
          <span className="font-semibold text-primary font-garamond truncate">{caseData.company_name}</span>
          <span className="text-sm text-muted-foreground">{caseData.year}</span>
          <span className="text-xs text-muted-foreground uppercase tracking-wide-label">{caseData.violation_type}</span>
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {provisionCount} provision{provisionCount !== 1 ? "s" : ""}
        </div>
      </div>
      <button onClick={onViewProvisions} className="text-sm text-gold hover:text-gold-dark font-garamond inline-flex items-center gap-1 shrink-0">
        View provisions
        <ExternalLink className="h-3.5 w-3.5" />
      </button>
    </article>
  );
}
```

### Pagination (Reuse from ProvisionsContent)
```typescript
// getPageNumbers helper and Pagination components are already implemented in ProvisionsContent.tsx
// Extract getPageNumbers to a shared utility or simply duplicate the ~30-line helper in CaseCardList
```

## Subsector Taxonomy Recommendation

Since subsectors are at Claude's discretion, here is the recommended taxonomy based on analysis of the 285 cases' `business_description` fields:

| Sector | Subsectors | Rationale |
|--------|------------|-----------|
| Technology | Software & Apps, IoT & Connected Devices, Ad Tech & Tracking, Cloud Services, General Technology | Covers the breadth of 146 tech cases from mobile apps to smart devices |
| Financial Services | Banking & Lending, Credit Reporting, Insurance, Payment Processing, General Financial | Reflects FCRA (28 cases) and GLBA (22 cases) concentrations |
| Retail | E-Commerce, Brick-and-Mortar, General Retail | 44 cases spanning online and physical retail |
| Healthcare | Health Tech & Apps, Health Services, Pharma & Biotech, General Healthcare | Health Breach Notification (6 cases) + general health data cases |
| Social Media | Social Networks, Online Communities | 16 cases, COPPA-heavy (10 cases) |
| Education | EdTech, Educational Institutions | 8 cases total |
| Telecom | ISPs & Carriers, General Telecom | 7 cases total |
| Other | General / Unclassified | 23 cases that don't fit above sectors |

**Subsector classification approach:** Define keyword lists for each subsector based on patterns in `business_description`. Map at the UI layer using a pure function in `industry-utils.ts`. Cases that match no subsector keywords within their sector go to "General [Sector]."

## Data Shape Analysis

### What's Already Available (No Pipeline Work Needed)

```typescript
// Every case in ftc-cases.json already has:
interface EnhancedFTCCaseSummary {
  industry_sectors: IndustrySector[];    // e.g., ["Technology", "Healthcare"]
  statutory_topics: StatutoryTopic[];    // e.g., ["COPPA", "Section 5 Only"]
  practice_areas: PracticeArea[];        // e.g., ["Privacy", "Data Security"]
  remedy_types: RemedyType[];            // e.g., ["Monetary Penalty", "Prohibition"]
  provision_counts_by_topic: Record<string, number>;  // e.g., {"COPPA": 5}
  company_name: string;
  date_issued: string;
  year: number;
  violation_type: "deceptive" | "unfair" | "both";
  num_provisions: number;
  // ... all other fields
}
```

### Data Distribution Summary

| Sector | Cases | Multi-Sector Overlap | Top Statutory Topic | Top Remedy Type |
|--------|-------|---------------------|---------------------|-----------------|
| Technology | 146 | 36 shared | Section 5 Only (96) | Other (145) |
| Financial Services | 59 | 15 shared | FCRA (28) | Other (58) |
| Retail | 44 | 15 shared | Section 5 Only (36) | Other (44) |
| Healthcare | 30 | 12 shared | Section 5 Only (21) | Other (30) |
| Other | 23 | 4 shared | Section 5 Only (19) | Other (23) |
| Social Media | 16 | 3 shared | COPPA (10) | Other (16) |
| Education | 8 | 3 shared | Section 5 Only (5) | Prohibition (8) |
| Telecom | 7 | 2 shared | Section 5 Only (5) | Prohibition (6) |

**Note:** "Other" remedy type is the most common because it includes standard order provisions (e.g., "order acknowledgment"). The interesting enforcement signal is in specific remedies like Monetary Penalty, Data Deletion, Algorithmic Destruction, etc.

### Subsector Data (Requires UI-Layer Derivation)

The `business_description` field in the source files (`public/data/ftc-files/*.json`) is available for 290 of 293 source files. It is NOT currently in the `ftc-cases.json` output — the build pipeline does not propagate it. There are two options:

1. **Preferred: Add `business_description` to `EnhancedFTCCaseSummary` in the build pipeline.** This is a small change to `build-ftc-data.ts` — add one field from `caseInfo.company.business_description`. Then subsector classification can happen client-side using the description text.

2. **Alternative: Read from `public/data/ftc-files/*.json` at build time and produce a subsector mapping file.** More complex, but avoids adding a text field to every case in the JSON payload.

**Recommendation:** Option 1. Adding one string field to each of the 285 cases adds ~50-80KB to `ftc-cases.json` (currently ~350KB). This is negligible and keeps the subsector logic simple.

## Compare View Design

The compare view lets users select 2-3 sectors and see them side-by-side. Recommended approach:

**Layout:** Responsive columns — each selected sector gets a column. On desktop: 2-3 columns. On mobile: vertical stack.

**Content per column:**
1. Sector name + case count header
2. Statutory topic distribution (horizontal bar chart)
3. Remedy type distribution (horizontal bar chart)
4. Top 5 companies in that sector

**Selection UX:** Checkboxes on sector cards in the grid. When 2+ sectors are checked, a sticky "Compare Selected" button appears. Clicking it transitions to the compare view. A "Clear selection" option returns to the grid.

**Implementation:** The compare view is a sibling to the grid and detail views, selected via `?tab=industries&compare=technology,healthcare`.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Building separate data files per view | Deriving from single source file | Phase 1 (2026-02-24) | All phase 4 data comes from ftc-cases.json — no new pipeline work |
| Custom expand/collapse | Radix Collapsible | Already in project | Sector card subsector expansion uses existing primitive |
| Manual URL construction | URLSearchParams API | Phase 2 (2026-02-24) | All navigation within industry tab follows established pattern |

**Deprecated/outdated:**
- Nothing deprecated that affects Phase 4. All libraries and patterns from Phases 2-3 remain current.

## Open Questions

1. **Subsector keyword accuracy**
   - What we know: business_description is available for 290/293 files and contains rich text about company activities
   - What's unclear: How well simple keyword matching will classify subsectors — some descriptions may be ambiguous
   - Recommendation: Start with keyword heuristics, accept that "General [Sector]" will be the fallback for ambiguous cases. Can refine keywords iteratively after visual inspection. This is a UI-layer concern only.

2. **"View provisions" link target specificity**
   - What we know: Provisions Library currently filters by topic, company, date, and remedy type — but NOT by case_id
   - What's unclear: Whether we should add case_id filtering to ProvisionsTab or just use company name as a proxy
   - Recommendation: Navigate to `?tab=provisions` with the company name pre-selected. This shows all provisions for that company across topics. A minor enhancement to ProvisionsTab URL param handling may be needed to accept company from URL.

3. **Compare view chart scaling**
   - What we know: Comparing 3 sectors means rendering 6+ charts simultaneously
   - What's unclear: Recharts performance with this many charts in a responsive layout
   - Recommendation: Start with the straightforward approach (all charts rendered). If performance is an issue, add lazy rendering for charts below the fold. 285 cases is a small dataset — chart data points will be small.

## Sources

### Primary (HIGH confidence)
- **Existing codebase analysis** — direct inspection of all source files listed in Architecture Patterns and Code Examples
- `src/types/ftc.ts` — `EnhancedFTCCaseSummary`, `IndustrySector`, `ProvisionRecord` type definitions
- `public/data/ftc-cases.json` — 285 cases, all with `industry_sectors` populated, direct data analysis
- `src/components/ftc/FTCTabShell.tsx` — tab integration pattern
- `src/components/ftc/analytics/*.tsx` — Recharts chart patterns, ReferenceTable, styling constants
- `src/components/ftc/provisions/*.tsx` — filter bar, pagination, card, sidebar patterns
- `src/components/ui/*.tsx` — Card, Badge, Breadcrumb, Collapsible, Pagination, Popover components

### Secondary (MEDIUM confidence)
- Subsector taxonomy — derived from analysis of `business_description` field across 290 source files, reasonable but not validated against legal expert expectations

### Tertiary (LOW confidence)
- Recharts performance with 6+ charts — not tested, estimate based on dataset size (285 cases). Flagged for validation during implementation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries needed; everything is already installed and patterns are established
- Architecture: HIGH — follows exact patterns from Phase 2 (tab integration) and Phase 3 (sidebar, filter bar, pagination, card components)
- Data availability: HIGH — all 285 cases have industry_sectors, statutory_topics, practice_areas, remedy_types
- Subsector classification: MEDIUM — business_description available but keyword heuristic quality is unvalidated
- Compare view: MEDIUM — design is sound but chart performance with 6+ simultaneous Recharts instances needs validation
- Pitfalls: HIGH — identified from real patterns in existing codebase (URL param clearing, multi-sector overlap, provision link construction)

**Research date:** 2026-02-25
**Valid until:** 2026-03-25 (stable — no external library changes expected; all patterns from existing codebase)
