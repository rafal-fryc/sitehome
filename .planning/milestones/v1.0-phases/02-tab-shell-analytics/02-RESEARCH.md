# Phase 2: Tab Shell + Analytics - Research

**Researched:** 2026-02-24
**Domain:** React tab navigation, data visualization with Recharts, URL-driven state
**Confidence:** HIGH

## Summary

Phase 2 transforms the existing single-view FTC enforcement page into a three-tab shell (Analytics, Provisions Library, Patterns) and builds out a comprehensive analytics dashboard with enforcement trend charts and accompanying reference tables. The existing codebase already has all the core libraries needed: Recharts 2.15.4 for charting, @radix-ui/react-tabs 1.1.12 (via shadcn/ui) for tab navigation, and react-router-dom 6.30.1 for URL-driven state via `useSearchParams`. No new library installations are required.

The primary challenge is restructuring the existing `FTCAnalytics.tsx` page into a tab shell while preserving the current grouping views (year/administration/category) and adding new analytics sections: enforcement trends by year (stacked bar), enforcement by presidential administration (horizontal bar), and topic-over-time trend lines (multi-line chart). Each chart must have an always-visible reference table below it with rich breakdowns (case counts, top statutes, notable cases) and clickable rows that expand inline to show matching cases. A sticky left sidebar for section navigation and responsive collapse to a horizontal scroll bar on smaller screens are also required.

**Primary recommendation:** Use the existing Radix Tabs + Recharts stack. Restructure FTCAnalytics.tsx into a tab shell wrapper, move current content into the Analytics tab, create placeholder tab panels for Provisions Library and Patterns, and build chart+table section components vertically stacked with a sidebar for anchor-based jumping.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Tabs sit horizontally below the page header, full-width bar
- Active tab has a cream/gold filled background; inactive tabs remain transparent
- Analytics is the default tab when no tab param is in the URL
- All existing FTC page content moves inside the tab shell — nothing remains outside the tabs below the header
- Each reference table sits directly below its chart, always visible (no collapse/accordion)
- Tables show detailed breakdowns: year/topic, case count, top statutes involved, notable cases — richer data, not just summary counts
- Table rows are clickable — clicking a row expands it inline to show the matching case list below the row
- No navigation away from the Analytics tab on row click; expand in-place
- Analytics tab opens with a brief headline and 1-2 sentence summary (date range, total cases) before the first chart section
- Chart+table sections stack vertically with a sticky left sidebar showing section names for anchor-based quick jumping
- On smaller screens (tablet/mobile), the sidebar collapses into a horizontal scrollable bar above the content
- Sections flow: enforcement trends by year, enforcement by presidential administration, topic-over-time trend lines
- The law-library aesthetic (EB Garamond, cream/gold/dark-green palette) is the binding visual constraint for all new components
- Inline row expansion for reference tables should feel natural — not a modal, not a redirect, just the cases appearing below the clicked row
- The sticky sidebar should feel like a table-of-contents in a reference book

### Claude's Discretion
- Chart types and exact visual encoding for each analytics section
- Color coding within charts (beyond the palette constraint)
- Exact spacing, typography scale, and section divider styling
- Sidebar width and highlight behavior
- Loading states and skeleton design
- Empty/error state handling

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ANLY-01 | Interactive bar/line charts showing enforcement action count by year | Recharts BarChart (stacked) already used in FTCGroupChart.tsx; extend with year-by-violation-type stacking. Data available in `groupings.by_year` |
| ANLY-02 | Interactive charts showing enforcement trends by presidential administration | Recharts horizontal BarChart already implemented for administration mode; refactor into dedicated section with richer data |
| ANLY-03 | Topic-over-time trend lines showing how enforcement focus shifts across statutory topics and practice areas | Recharts LineChart with multiple series. Data must be computed client-side from `cases[].statutory_topics` by year. Each topic becomes a line series |
| ANLY-04 | Administration comparison view showing enforcement patterns side-by-side between administrations | Recharts grouped BarChart or ComposedChart. Data from `groupings.by_administration` with topic breakdowns computed from cases |
| ANLY-05 | Detailed reference tables with case counts, provision counts, and breakdowns accompanying each chart | shadcn/ui Table component (already in codebase). Always-visible below each chart. Rows show year/topic, count, top statutes, notable cases |
| ANLY-06 | Combined chart + table views — charts for visual overview, tables for drill-down | Chart+Table component pattern: wrapper that stacks chart and table vertically with shared data source |
| ANLY-07 | Violation type breakdown (deceptive vs unfair vs both) maintained from existing analytics | Already implemented in ViolationDonut and FTCGroupChart. Must be preserved in the new tab shell |
| ANLY-08 | Provision-level analytics showing counts by remedy type, topic, and category | Data available in `cases[].provision_counts_by_topic`, `cases[].remedy_types`. Compute aggregations client-side from ftc-cases.json |
| NAVX-01 | Tab navigation between Analytics, Provisions Library, and Patterns views under single FTC route | Radix Tabs (@radix-ui/react-tabs 1.1.12) already installed and styled for law-library aesthetic. Use `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent` |
| NAVX-02 | URL-driven state via search params for active tab, selected topic, active filters | react-router-dom 6.30.1 `useSearchParams` already used in FTCAnalytics.tsx. Extend with `tab` param |
| NAVX-03 | Maintains law-library aesthetic (EB Garamond, cream/gold/dark-green palette) | Tailwind config already defines `garamond`, `cream`, `gold`, `primary` (dark green), `rule` tokens. CSS variables in index.css. All new components use these tokens |
| NAVX-04 | Performs smoothly with 293 cases and thousands of provisions in-browser | ftc-cases.json is 476 KB (small). All chart data computed with useMemo. React Query with staleTime: Infinity. No provision shards loaded on Analytics tab |
| NAVX-05 | OCR extraction quality disclosure where applicable | FTCMissingCasesNotice component already handles data coverage disclosure. Extend or add provision-level OCR caveat text |
</phase_requirements>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | 2.15.4 | All charts (bar, line, pie, composed) | Already used in FTCGroupChart.tsx; has BarChart, LineChart, ComposedChart, PieChart. Mature React charting library |
| @radix-ui/react-tabs | 1.1.12 | Tab navigation primitive | Already installed via shadcn/ui. Accessible, unstyled, composable. Custom styled in `src/components/ui/tabs.tsx` |
| react-router-dom | 6.30.1 | URL-driven state via useSearchParams | Already used in FTCAnalytics.tsx for `mode` and `group` params |
| @tanstack/react-query | 5.83.0 | Data fetching with caching | Already used in `use-ftc-data.ts` with staleTime: Infinity |
| tailwindcss | 3.4.17 | Styling with design tokens | Project-wide. Law-library palette defined in CSS variables and tailwind.config.ts |

### Supporting (Already Installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | 0.462.0 | Icons for sidebar, expand/collapse | Already used throughout FTC components |
| class-variance-authority | 0.7.1 | Component variant styling | Used by shadcn/ui components |
| clsx + tailwind-merge | via `cn()` | Class name composition | `src/lib/utils.ts` exports `cn()` helper |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Recharts | Nivo, Victory, Visx | Recharts already installed and used; switching would add complexity for no benefit |
| Radix Tabs | Custom tab state | Radix provides keyboard nav, ARIA roles, focus management for free |
| CSS sticky sidebar | Headless UI / Radix ScrollArea | CSS `position: sticky` with IntersectionObserver is simpler and sufficient |

**Installation:**
```bash
# No new packages needed. All libraries already installed.
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── pages/
│   └── FTCAnalytics.tsx          # Tab shell wrapper (restructured)
├── components/ftc/
│   ├── FTCHeader.tsx              # Existing, unchanged
│   ├── FTCTabShell.tsx            # NEW: Tab bar + TabsContent panels
│   ├── FTCAnalyticsTab.tsx        # NEW: Analytics tab content (moved from current FTCAnalytics.tsx main section)
│   ├── FTCProvisionsTab.tsx       # NEW: Placeholder for Phase 3
│   ├── FTCPatternsTab.tsx         # NEW: Placeholder for Phase 5
│   ├── FTCSectionSidebar.tsx      # NEW: Sticky sidebar / responsive top bar
│   ├── analytics/
│   │   ├── AnalyticsSummary.tsx   # NEW: Headline + summary stats
│   │   ├── EnforcementByYear.tsx  # NEW: Chart + reference table for yearly enforcement
│   │   ├── EnforcementByAdmin.tsx # NEW: Chart + reference table for administration comparison
│   │   ├── TopicTrendLines.tsx    # NEW: Multi-line topic-over-time chart + reference table
│   │   ├── ProvisionAnalytics.tsx # NEW: ANLY-08 provision-level counts by remedy/topic
│   │   ├── ViolationBreakdown.tsx # NEW: Refactored from ViolationDonut (ANLY-07)
│   │   └── ReferenceTable.tsx     # NEW: Reusable chart+table component with expandable rows
│   ├── FTCGroupingSelector.tsx    # Existing (moves inside AnalyticsTab)
│   ├── FTCGroupChart.tsx          # Existing (preserved for backward compat or refactored into analytics/)
│   ├── FTCGroupList.tsx           # Existing (moves inside AnalyticsTab)
│   ├── FTCGroupDetail.tsx         # Existing (moves inside AnalyticsTab)
│   └── ...existing components
├── hooks/
│   └── use-ftc-data.ts            # Existing, unchanged
├── types/
│   └── ftc.ts                     # Existing, extend with analytics-specific types if needed
└── constants/
    └── ftc.ts                     # Existing, unchanged
```

### Pattern 1: Tab Shell with URL-Driven State
**What:** Single Radix Tabs component wrapping three TabsContent panels, with the active tab synced to `?tab=` search param.
**When to use:** When multiple views share the same route and need URL-shareable state.
**Example:**
```typescript
// FTCTabShell.tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useSearchParams } from "react-router-dom";

type FTCTab = "analytics" | "provisions" | "patterns";

const VALID_TABS: FTCTab[] = ["analytics", "provisions", "patterns"];

export default function FTCTabShell() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as FTCTab | null;
  const activeTab = tabParam && VALID_TABS.includes(tabParam) ? tabParam : "analytics";

  const handleTabChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === "analytics") {
      newParams.delete("tab"); // Default tab, keep URL clean
    } else {
      newParams.set("tab", value);
    }
    setSearchParams(newParams, { replace: true });
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList className="w-full border-b-2 border-rule-dark">
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="provisions">Provisions Library</TabsTrigger>
        <TabsTrigger value="patterns">Patterns</TabsTrigger>
      </TabsList>
      <TabsContent value="analytics">
        <FTCAnalyticsTab />
      </TabsContent>
      <TabsContent value="provisions">
        <FTCProvisionsTab /> {/* Placeholder */}
      </TabsContent>
      <TabsContent value="patterns">
        <FTCPatternsTab /> {/* Placeholder */}
      </TabsContent>
    </Tabs>
  );
}
```

### Pattern 2: Sticky Sidebar with Anchor-Based Navigation
**What:** A sidebar that sticks to the viewport while the user scrolls through chart sections. Uses `position: sticky` with `top` offset. Section headings have `id` attributes; sidebar links use `scrollIntoView({ behavior: "smooth" })`. On small screens, collapses into a horizontal scrollable bar.
**When to use:** When the page has multiple long sections and the user needs quick jumping.
**Example:**
```typescript
// FTCSectionSidebar.tsx
import { useEffect, useState, useRef } from "react";

interface Section {
  id: string;
  label: string;
}

interface Props {
  sections: Section[];
}

export default function FTCSectionSidebar({ sections }: Props) {
  const [activeSection, setActiveSection] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    // IntersectionObserver to track which section is in view
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-20% 0px -70% 0px" } // Trigger when section is in top third
    );

    for (const s of sections) {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [sections]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden lg:block sticky top-24 w-48 shrink-0 self-start">
        <ul className="space-y-1 border-l-2 border-rule">
          {sections.map((s) => (
            <li key={s.id}>
              <button
                onClick={() => scrollTo(s.id)}
                className={`block w-full text-left text-sm pl-4 py-1.5 border-l-2 -ml-[2px] transition-colors ${
                  activeSection === s.id
                    ? "border-l-gold text-primary font-semibold"
                    : "border-l-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Mobile horizontal bar */}
      <nav className="lg:hidden sticky top-0 z-10 bg-background border-b border-rule overflow-x-auto">
        <div className="flex gap-4 px-4 py-2 min-w-max">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => scrollTo(s.id)}
              className={`text-sm whitespace-nowrap px-2 py-1 ${
                activeSection === s.id
                  ? "text-primary font-semibold border-b-2 border-gold"
                  : "text-muted-foreground"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
```

### Pattern 3: Expandable Reference Table Rows
**What:** Table rows that expand inline when clicked to reveal a nested case list. Uses local state to track expanded row IDs. No accordion component needed - simple conditional rendering.
**When to use:** For reference tables that need drill-down without navigation.
**Example:**
```typescript
// ReferenceTable.tsx - expandable row pattern
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronDown, ChevronRight } from "lucide-react";

interface ReferenceRow {
  key: string;
  cells: React.ReactNode[];
  expandedContent?: React.ReactNode;
}

interface Props {
  headers: string[];
  rows: ReferenceRow[];
}

export default function ReferenceTable({ headers, rows }: Props) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (key: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/30">
          <TableHead className="w-8" /> {/* Expand icon */}
          {headers.map((h) => (
            <TableHead key={h}>{h}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => {
          const isExpanded = expandedRows.has(row.key);
          return (
            <>
              <TableRow
                key={row.key}
                className="cursor-pointer hover:bg-accent/20"
                onClick={() => row.expandedContent && toggleRow(row.key)}
              >
                <TableCell className="w-8 text-muted-foreground">
                  {row.expandedContent && (
                    isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                  )}
                </TableCell>
                {row.cells.map((cell, i) => (
                  <TableCell key={i}>{cell}</TableCell>
                ))}
              </TableRow>
              {isExpanded && row.expandedContent && (
                <TableRow key={`${row.key}-expanded`}>
                  <TableCell colSpan={headers.length + 1} className="p-0">
                    <div className="p-4 bg-cream/50 border-t border-rule">
                      {row.expandedContent}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </>
          );
        })}
      </TableBody>
    </Table>
  );
}
```

### Pattern 4: Topic-Over-Time Data Computation
**What:** Client-side computation of multi-series line chart data from the flat cases array. For each statutory topic, count cases per year.
**When to use:** For ANLY-03 topic trend lines.
**Example:**
```typescript
// useMemo inside TopicTrendLines.tsx
const trendData = useMemo(() => {
  // Get all years sorted
  const years = [...new Set(data.cases.map((c) => c.year))].sort();

  // Define topic series (from statutory_topics on EnhancedFTCCaseSummary)
  const topics = ["COPPA", "FCRA", "GLBA", "Health Breach Notification", "Section 5 Only", "TSR", "CAN-SPAM"];

  return years.map((year) => {
    const yearCases = data.cases.filter((c) => c.year === year);
    const point: Record<string, number | string> = { year: String(year) };
    for (const topic of topics) {
      point[topic] = yearCases.filter((c) =>
        (c as EnhancedFTCCaseSummary).statutory_topics?.includes(topic as StatutoryTopic)
      ).length;
    }
    return point;
  });
}, [data.cases]);
```

### Anti-Patterns to Avoid
- **Multiple data fetches for the same data:** The analytics tab only needs `ftc-cases.json` which is already cached by React Query. Do NOT fetch provision shards on the Analytics tab - they are only needed for Phase 3 (Provisions Library).
- **Recomputing derived data on every render:** All chart data derivations MUST be wrapped in `useMemo` with proper dependency arrays. With 285 cases, computation is fast, but unnecessary recalculations still cause chart flickering.
- **Using `forceMount` on TabsContent:** Radix Tabs unmounts inactive tab content by default. Do NOT use `forceMount` - let inactive tabs unmount to save memory. Data is cached in React Query anyway.
- **Full-page reload on tab switch:** Tab switching MUST use `setSearchParams` with `replace: true`, not `navigate()` or `<Link>`. This prevents adding to the browser history stack and avoids reload.
- **Chart containers without fixed height:** Recharts `ResponsiveContainer` requires a parent with explicit height. Always wrap in a div with a fixed height class like `h-[350px]` or `h-[400px]`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tab accessibility (keyboard nav, ARIA) | Custom div-based tabs | Radix Tabs (already installed) | Keyboard navigation, focus management, screen reader support built in |
| Section scroll tracking | Manual scroll event listener | IntersectionObserver API | More performant, handles edge cases (fast scroll, resize), no scroll jank |
| Chart rendering | Canvas/SVG by hand | Recharts components | Handles responsive resize, tooltips, animations, axis formatting |
| URL param parsing/serialization | Manual string manipulation | `useSearchParams` from react-router-dom | Handles encoding, history integration, type safety |
| Responsive sidebar collapse | JS media query listeners | Tailwind responsive classes (`hidden lg:block` / `lg:hidden`) | CSS-only, no JS overhead, synced with existing breakpoints |

**Key insight:** Every library needed for this phase is already installed and configured. The work is component composition and data transformation, not library integration.

## Common Pitfalls

### Pitfall 1: Tab State Conflicting with Inner Search Params
**What goes wrong:** The tab shell uses `?tab=analytics` and the inner grouping selector uses `?mode=year&group=2024`. When switching tabs, inner params persist in the URL, causing stale state on return.
**Why it happens:** `setSearchParams` replaces ALL params unless you explicitly merge.
**How to avoid:** When switching tabs, clear tab-specific params. Use a helper:
```typescript
const handleTabChange = (tab: string) => {
  const newParams = new URLSearchParams();
  if (tab !== "analytics") newParams.set("tab", tab);
  // Deliberately drop mode/group params when switching tabs
  setSearchParams(newParams, { replace: true });
};
```
**Warning signs:** URL accumulates params from multiple tabs; switching back to Analytics shows wrong grouping mode.

### Pitfall 2: Recharts ResponsiveContainer Height Collapse
**What goes wrong:** Charts render as 0-height or invisible.
**Why it happens:** `ResponsiveContainer` computes dimensions from its parent. If the parent has no explicit height (or uses `height: auto`), the chart collapses.
**How to avoid:** Always wrap `ResponsiveContainer` in a div with an explicit height class. The existing codebase already does this correctly (`className="w-full h-[350px]"`).
**Warning signs:** Chart area appears blank; resizing window briefly shows chart.

### Pitfall 3: IntersectionObserver Not Updating on Dynamic Content
**What goes wrong:** Sidebar active section doesn't update when expanding/collapsing table rows (which changes scroll position and section heights).
**Why it happens:** IntersectionObserver caches element positions. When content below the observed element grows (expanded row), the intersection ratios change but the observer may not re-fire.
**How to avoid:** Use `rootMargin` that accommodates content changes. The `-20% 0px -70% 0px` margin triggers when a section is in the top 30% of viewport, which is resilient to below-fold content changes. If needed, `observer.disconnect()` and re-observe after row expansion.
**Warning signs:** Sidebar highlight lags behind actual scroll position after expanding table rows.

### Pitfall 4: Stacked Bar Chart Y-Axis Not Matching Total
**What goes wrong:** Y-axis label shows individual segment values instead of the stacked total.
**Why it happens:** Recharts stacked bars accumulate values. If you accidentally use `stackId` on some bars but not others, you get visual overlap.
**How to avoid:** Ensure ALL bars in a stacked group share the same `stackId`. The existing FTCGroupChart already does this correctly (`stackId="a"`).
**Warning signs:** Bars visually overlap instead of stacking cleanly.

### Pitfall 5: Sticky Sidebar Overlapping Content on Mobile
**What goes wrong:** The sticky sidebar overlaps chart content or pushes content off-screen.
**Why it happens:** CSS `position: sticky` elements still take up space in the layout. If the sidebar is too wide relative to the content area, charts get compressed.
**How to avoid:** Use a flex layout with the sidebar as a shrink-0 fixed-width element and the content area as flex-1. On mobile, hide the sidebar entirely with `hidden lg:block` and show the horizontal bar instead.
**Warning signs:** Charts look compressed on medium-width screens; sidebar covers chart tooltips.

### Pitfall 6: Topic Trend Lines with Sparse Data
**What goes wrong:** Topic trend lines show misleading jumps because some topics have 0 cases in many years.
**Why it happens:** Years with no cases for a topic produce missing data points, causing Recharts to interpolate or skip.
**How to avoid:** Always include every year in the data array, even if the count is 0 for a given topic. Use `connectNulls={false}` on Line components to show gaps, or include explicit 0 values for continuous lines.
**Warning signs:** Line charts show diagonal connections between distant years, skipping years with 0 enforcement for that topic.

## Code Examples

Verified patterns from the existing codebase:

### Existing Recharts Stacked Bar Pattern
```typescript
// Source: src/components/ftc/FTCGroupChart.tsx (lines 37-72)
// Already implemented stacked bar for year view with violation type breakdown
<BarChart data={chartData} onClick={(e) => { ... }}>
  <CartesianGrid strokeDasharray="3 3" stroke="hsl(50, 15%, 85%)" />
  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(158, 20%, 35%)" }} />
  <YAxis tick={{ fontSize: 12, fill: "hsl(158, 20%, 35%)" }} />
  <Tooltip contentStyle={{
    background: "hsl(40, 50%, 98%)",
    border: "1px solid hsl(40, 25%, 80%)",
    borderRadius: 0,
    fontFamily: "EB Garamond, serif",
  }} />
  <Legend />
  <Bar dataKey="deceptive" stackId="a" fill={COLORS.deceptive} name="Deceptive" />
  <Bar dataKey="unfair" stackId="a" fill={COLORS.unfair} name="Unfair" />
  <Bar dataKey="both" stackId="a" fill={COLORS.both} name="Both" />
</BarChart>
```

### Existing URL-Driven State Pattern
```typescript
// Source: src/pages/FTCAnalytics.tsx (lines 15-47)
const [searchParams, setSearchParams] = useSearchParams();
const modeParam = searchParams.get("mode") as GroupingMode | null;

const handleModeChange = useCallback(
  (mode: GroupingMode) => {
    setGroupingMode(mode);
    setSelectedGroup(null);
    setSearchParams({ mode });
  },
  [setSearchParams]
);
```

### Existing Tailwind Law-Library Theme Tokens
```css
/* Source: src/index.css (lines 10-50) */
--primary: 158 80% 15%;          /* Dark green */
--gold: 45 85% 55%;              /* Gold accent */
--cream: 40 50% 98%;             /* Cream background */
--rule: 40 25% 80%;              /* Border/rule lines */
--rule-dark: 40 20% 65%;         /* Darker rules */
```

### Recharts LineChart for Topic Trends
```typescript
// New pattern for ANLY-03
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// Topic colors - within palette constraint, use hue variations of green/gold
const TOPIC_COLORS: Record<string, string> = {
  "COPPA": "hsl(158, 80%, 25%)",            // Deep green
  "FCRA": "hsl(45, 85%, 45%)",              // Dark gold
  "GLBA": "hsl(158, 60%, 40%)",             // Medium green
  "Health Breach Notification": "hsl(20, 70%, 50%)", // Warm amber
  "Section 5 Only": "hsl(158, 30%, 55%)",    // Muted green
  "TSR": "hsl(45, 60%, 60%)",               // Light gold
  "CAN-SPAM": "hsl(200, 40%, 45%)",         // Blue-grey (accent)
};

<ResponsiveContainer width="100%" height="100%">
  <LineChart data={trendData}>
    <CartesianGrid strokeDasharray="3 3" stroke="hsl(50, 15%, 85%)" />
    <XAxis dataKey="year" tick={{ fontSize: 11, fill: "hsl(158, 20%, 35%)" }} />
    <YAxis tick={{ fontSize: 12, fill: "hsl(158, 20%, 35%)" }} />
    <Tooltip contentStyle={{
      background: "hsl(40, 50%, 98%)",
      border: "1px solid hsl(40, 25%, 80%)",
      borderRadius: 0,
      fontFamily: "EB Garamond, serif",
    }} />
    <Legend />
    {Object.entries(TOPIC_COLORS).map(([topic, color]) => (
      <Line
        key={topic}
        type="monotone"
        dataKey={topic}
        stroke={color}
        strokeWidth={2}
        dot={{ r: 3 }}
        activeDot={{ r: 5 }}
        name={topic}
      />
    ))}
  </LineChart>
</ResponsiveContainer>
```

### Radix Tabs Custom Styling for Active State
```typescript
// The user wants cream/gold filled background on active tab
// Current tabs.tsx uses border-bottom indicator. Must override for the tab shell:
<TabsTrigger
  value="analytics"
  className="data-[state=active]:bg-gold/15 data-[state=active]:text-primary data-[state=active]:border-b-gold"
>
  Analytics
</TabsTrigger>
```

## Data Architecture

### Data Flow for Analytics Tab
```
ftc-cases.json (476 KB, fetched once, cached)
    │
    ├─→ cases[] (285 items, each with statutory_topics, practice_areas, remedy_types, etc.)
    │     │
    │     ├─→ useMemo: group by year × statutory_topic → topic trend line data (ANLY-03)
    │     ├─→ useMemo: group by administration → side-by-side comparison data (ANLY-04)
    │     ├─→ useMemo: aggregate remedy_types across all cases → provision analytics (ANLY-08)
    │     └─→ useMemo: aggregate provision_counts_by_topic → provision topic counts (ANLY-08)
    │
    ├─→ groupings.by_year[] (28 year groups) → enforcement by year chart (ANLY-01)
    ├─→ groupings.by_administration[] (6 admin groups) → enforcement by admin chart (ANLY-02)
    └─→ groupings.by_category[] (10 categories) → preserved existing category view (ANLY-07)
```

### Data NOT Needed for Analytics Tab
- `public/data/provisions/*.json` — only needed for Provisions Library (Phase 3)
- `public/data/ftc-files/*.json` — individual case files, not needed for analytics aggregations

### Key Data Shape: EnhancedFTCCaseSummary
```typescript
// Each case in ftc-cases.json has these fields (from src/types/ftc.ts):
{
  id: string;
  company_name: string;
  date_issued: string;          // "2024-03-15"
  year: number;                 // 2024
  administration: string;       // "Biden"
  categories: string[];         // ["Privacy / Deceptive Privacy Practices", "Data Security"]
  violation_type: "deceptive" | "unfair" | "both";
  statutory_topics: StatutoryTopic[];   // ["COPPA", "Section 5 Only"]
  practice_areas: PracticeArea[];       // ["Privacy", "Data Security"]
  industry_sectors: IndustrySector[];   // ["Technology"]
  remedy_types: RemedyType[];           // ["Monetary Penalty", "Data Deletion"]
  provision_counts_by_topic: Record<string, number>;  // { "COPPA": 8, "Section 5 Only": 4 }
  num_provisions: number;
  ftc_url?: string;
  docket_number: string;
  legal_authority: string;
}
```

### Data Computation Summary (285 cases)
All analytics data is derived from the single `ftc-cases.json` file:
- **Year groups:** 28 years (1997-2026), pre-computed in `groupings.by_year`
- **Administration groups:** 6 administrations, pre-computed in `groupings.by_administration`
- **Topic trend lines:** Computed client-side: for each of ~8 statutory topics, count cases per year = 28 years x 8 topics = 224 data points (trivial computation)
- **Provision analytics:** Aggregate `remedy_types` and `provision_counts_by_topic` across 285 cases (trivial)
- **Administration comparison:** Computed client-side: for each of 6 administrations, count cases by statutory topic = 6 x 8 = 48 data points

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Recharts 1.x with class components | Recharts 2.x with function components | Recharts 2.0 (2022) | All examples should use function components (already done) |
| react-router v5 `useHistory` | react-router v6 `useSearchParams` | v6 (2021) | Already using v6 pattern in FTCAnalytics.tsx |
| Manual media queries for responsive | Tailwind responsive prefixes | Established pattern | Use `lg:` prefix for sidebar visibility toggle |

**Deprecated/outdated:**
- Recharts `isAnimationActive` was buggy in early 2.x releases; 2.15.4 has stable animations. Use `isAnimationActive={false}` only if performance requires it.

## Performance Considerations

### Data Size Assessment
- `ftc-cases.json`: 476 KB raw, ~50 KB gzipped (estimate). Single fetch, cached forever.
- 285 cases with ~30 fields each. All analytics derived from this one file.
- No provision shard files loaded on the Analytics tab.

### Rendering Budget
- 285 cases is well within Recharts' comfort zone (thousands of data points are fine).
- Topic trend lines: 28 years x 8 topics = 224 points across 8 Line components. Trivial.
- Reference tables: Max ~28 rows (one per year) or ~6 rows (one per administration). Virtualization not needed.
- Expanded row content: At most ~30 cases per year. No virtualization needed at this scale.

### useMemo Strategy
Every derived dataset MUST be wrapped in `useMemo`:
- `trendData` for topic trend lines
- `adminComparisonData` for administration comparison
- `provisionAggregates` for provision-level analytics
- Chart data transformations in each analytics section component

## Tab Shell Restructure Plan

### Current State
```
FTCAnalytics.tsx
├── FTCHeader
├── main container
│   ├── FTCMissingCasesNotice
│   ├── FTCOverviewStats + ViolationDonut
│   ├── FTCGroupingSelector + FTCGroupChart + FTCGroupList
│   └── FTCGroupDetail (conditional)
```

### Target State
```
FTCAnalytics.tsx
├── FTCHeader
├── FTCTabShell
│   ├── TabsList (Analytics | Provisions Library | Patterns)
│   ├── TabsContent: Analytics
│   │   ├── FTCSectionSidebar (sticky left / responsive top)
│   │   ├── AnalyticsSummary (headline + total cases)
│   │   ├── section#enforcement-by-year
│   │   │   ├── EnforcementByYear chart
│   │   │   └── ReferenceTable (expandable rows → case list)
│   │   ├── section#enforcement-by-admin
│   │   │   ├── EnforcementByAdmin chart
│   │   │   └── ReferenceTable (expandable rows → case list)
│   │   ├── section#topic-trends
│   │   │   ├── TopicTrendLines chart
│   │   │   └── ReferenceTable (expandable rows → case list)
│   │   ├── section#violation-breakdown
│   │   │   └── ViolationBreakdown (refactored ViolationDonut)
│   │   └── section#provision-analytics
│   │       └── ProvisionAnalytics (remedy type + topic counts)
│   ├── TabsContent: Provisions Library
│   │   └── FTCProvisionsTab (placeholder: "Coming in Phase 3")
│   └── TabsContent: Patterns
│       └── FTCPatternsTab (placeholder: "Coming in Phase 5")
```

### Migration Strategy
1. Create `FTCTabShell.tsx` with three tab panels
2. Move ALL current `FTCAnalytics.tsx` main content into `FTCAnalyticsTab.tsx`
3. `FTCAnalytics.tsx` becomes a thin wrapper: `FTCHeader` + `FTCTabShell`
4. Verify existing functionality works identically in the Analytics tab
5. Then add new analytics sections incrementally

## Open Questions

1. **Existing grouping views (year/admin/category) preservation**
   - What we know: The current FTCAnalytics.tsx has a FTCGroupingSelector that lets users switch between year/admin/category views with bar charts and group detail cards.
   - What's unclear: Should these existing grouping views remain as-is within the Analytics tab alongside the new dedicated chart sections? Or should they be replaced by the new EnforcementByYear and EnforcementByAdmin sections?
   - Recommendation: The new dedicated sections (EnforcementByYear, EnforcementByAdmin, TopicTrendLines) supersede the existing grouping views for year and administration. The "By Category" view can be preserved in a separate section or dropped if the topic trend lines cover the same ground. During implementation, start by placing existing views at the bottom and progressively replace with new sections.

2. **ANLY-04 administration comparison: side-by-side vs sequential**
   - What we know: Requirement says "enforcement patterns side-by-side between administrations". User decisions say "enforcement by presidential administration" as a section.
   - What's unclear: Is ANLY-04 a separate chart from ANLY-02, or the same chart with richer data?
   - Recommendation: Treat ANLY-02 and ANLY-04 as a single section. Use a grouped/stacked bar chart showing enforcement counts by administration with topic breakdown within each administration bar. The reference table below shows the side-by-side comparison data in tabular form. This satisfies both requirements without a redundant second chart.

3. **Tab-specific URL params**
   - What we know: The current page uses `?mode=year&group=2024` for grouping state.
   - What's unclear: Should the analytics tab preserve internal scroll position / expanded rows in the URL?
   - Recommendation: Do NOT encode analytics scroll position or expanded row state in the URL. Only the tab param (`?tab=analytics` or no param for default) needs URL backing. Internal analytics state (expanded rows, active sidebar section) is ephemeral local state.

## Sources

### Primary (HIGH confidence)
- **Codebase inspection** - Read all 15 FTC component files, page files, data hooks, type definitions, build scripts, and configuration files. All findings verified against actual source code.
- **Recharts 2.15.4** - Verified BarChart, LineChart, ComposedChart, PieChart available in `node_modules/recharts/lib/chart/`. API patterns verified from existing FTCGroupChart.tsx usage.
- **@radix-ui/react-tabs 1.1.12** - Verified installed. Custom styling verified in `src/components/ui/tabs.tsx`. Tabs/TabsList/TabsTrigger/TabsContent exports confirmed.
- **react-router-dom 6.30.1** - `useSearchParams` usage verified in current FTCAnalytics.tsx.
- **Data shape** - `ftc-cases.json` structure verified: 285 cases with EnhancedFTCCaseSummary fields including statutory_topics, practice_areas, remedy_types, provision_counts_by_topic. Groupings pre-computed for year (28), administration (6), category (10).

### Secondary (MEDIUM confidence)
- **IntersectionObserver for scroll tracking** - Well-supported browser API (baseline since 2019). Pattern is standard for sticky sidebar active section tracking. Not verified against a specific library doc but is a well-established web platform feature.
- **Recharts performance at this scale** - 285 cases / ~224 data points for trend lines is well within documented Recharts limits (handles thousands of points). Not load-tested on this specific dataset but confident based on data size analysis.

### Tertiary (LOW confidence)
- None. All findings verified against codebase or established web platform APIs.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed and in use. No new dependencies.
- Architecture: HIGH - Tab shell pattern is straightforward Radix Tabs composition. Sidebar pattern uses standard CSS/IntersectionObserver. All verified against existing codebase patterns.
- Pitfalls: HIGH - Identified from actual code review (URL param conflicts, ResponsiveContainer height) and established Recharts/Radix patterns.

**Research date:** 2026-02-24
**Valid until:** 2026-03-24 (stable - no fast-moving dependencies)
