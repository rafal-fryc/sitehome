# Phase 3: Provisions Library - Research

**Researched:** 2026-02-24
**Domain:** Topic-first provisions browsing, client-side search (MiniSearch), filtering/sorting, provision data enrichment
**Confidence:** HIGH

## Summary

Phase 3 builds the core provisions browsing experience: a persistent topic sidebar (grouped by Statutory Authority, Practice Area, and Remedy Type), provision cards showing verbatim order language with paragraph-level citations, filtering by date/company/remedy type, sorting, and full-text search via MiniSearch. The existing codebase has a placeholder `FTCProvisionsTab` component ready to replace, 15 topic-sharded JSON files in `public/data/provisions/`, and all the UI primitives needed (shadcn/ui components, Tailwind law-library theme, React Query for data fetching).

The most significant finding is a **data gap**: the current provision shard files contain `summary` (a paraphrase) but NOT `quoted_text` (the actual verbatim order language from the source files). PROV-02 requires "verbatim quoted order language as the primary content." The build pipeline (`scripts/build-provisions.ts`) must be updated to include verbatim text from `order.provisions[].requirements[].quoted_text` in the shard output. This will increase shard sizes by approximately 60-70% (from ~6 MB total to ~10 MB total), but gzip compression keeps transfer sizes manageable (largest shard ~200 KB gzipped with text included).

The only new dependency required is `minisearch` (v7.2.0, ~8 KB gzipped) for client-side full-text search (PROV-09). Everything else uses existing libraries: React Query for data fetching, shadcn/ui for UI components, cmdk for company name typeahead, Tailwind for styling, and react-router-dom for URL-driven state.

**Primary recommendation:** Update the build pipeline to include verbatim text in provision shards, then build the provisions tab as a sidebar + content area layout with lazy-loaded shard data per selected topic, client-side filtering/sorting, and MiniSearch indexing for cross-topic search.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Provision card design: Context header + text layout: company name, year, docket number, citation, and violation type in a prominent header bar, with verbatim provision text below
- Full provision text always displayed -- no truncation or "read more" collapse
- Citation text (e.g. "Part II.A.3") displayed in header; separate "View on FTC.gov" link/button distinct from the citation text
- Single disclaimer banner at the top of the provisions list ("verify against source") -- not repeated per card
- Persistent sidebar list of all topics, always visible while browsing provisions
- Topics grouped by category under headings: Statutory Authority (COPPA, FCRA, etc.), Practice Area (Data Security, Surveillance, etc.), Remedy Type
- Each topic shows provision count as a badge (e.g. "COPPA (47)")
- Landing view (before any topic is selected): overview summary with total provision/case counts and prompt to select a topic
- Sticky filter bar between topic header and provision cards -- always visible while scrolling
- Date range filter uses preset period buttons: "Last 5 years", "Obama era", "Trump era", "Biden era" -- plus custom range option
- Company name filter is a type-ahead search/autocomplete input suggesting matching company names
- Active filters shown as dismissible chips/tags below the filter bar (e.g. "2020-2025 x", "Facebook x") with a "Clear all" button
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

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PROV-01 | User can browse provisions by selecting a substantive topic (statutory, practice area, or remedy type) | Topic sidebar with 15 shard files covering 7 statutory topics + 8 practice areas. Remedy type topics need separate shards or computed from existing shards. Lazy-load shard on topic selection via React Query |
| PROV-02 | Each provision displays verbatim quoted order language as the primary content | **DATA GAP**: Current shards have `summary` (paraphrase) only. Must update `build-provisions.ts` to include `quoted_text` from source file `order.provisions[].requirements[].quoted_text`. Average 1,491 chars per provision across 8,279 requirement records |
| PROV-03 | Each provision shows exact paragraph-level citation (e.g., "Part II.A.3") plus working link to FTC.gov source document | `provision_number` field exists in shards (e.g., "I", "II", "III"). Format as "Part {provision_number}". `ftc_url` field exists for source link. `quote_start_line` / `quote_end_line` available in source files for additional precision |
| PROV-04 | Each provision card shows case context: company name, date issued, docket number, violation type | All fields already in provision shards: `company_name`, `date_issued`, `docket_number`. Violation type needs to be added to shards (currently only on case level in ftc-cases.json, not in provision records) |
| PROV-05 | User can filter provisions within a topic by date range | `date_issued` and `year` fields in each provision record. Preset periods map to year ranges (e.g., "Obama era" = 2009-2017). Client-side filter with `useMemo` |
| PROV-06 | User can filter provisions within a topic by company name | `company_name` field in each provision record. 279 unique companies across all shards. Use cmdk (already installed) with Popover for typeahead autocomplete |
| PROV-07 | User can filter provisions within a topic by remedy type | `remedy_types` array on each provision record. 10 distinct remedy types. Multi-select dropdown using shadcn/ui Select or custom checkbox list |
| PROV-08 | User can sort provisions by date, company, or provision type | Client-side sort on `date_issued`, `company_name`, or `category` fields. Default sort: by date descending (most recent first) |
| PROV-09 | User can search across all provisions using text search (MiniSearch) | MiniSearch v7.2.0 (~8 KB gzipped). Index `title`, `summary`, and `verbatim_text` fields. Filter callback for scoped search ("this topic" vs "all topics"). Requires loading all shards for cross-topic search |
| PROV-10 | Provisions library displays total count of matching provisions and cases | Computed from filtered/searched results. Count unique `case_id` values for case count. Display in filter bar area |
</phase_requirements>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @tanstack/react-query | 5.83.0 | Lazy-load provision shard files per topic | Already used for ftc-cases.json. Each shard gets its own queryKey for independent caching |
| react-router-dom | 6.30.1 | URL-driven state for selected topic, filters, search | Already used in FTCTabShell for tab param. Extend with topic/filter params |
| tailwindcss | 3.4.17 | Styling with law-library design tokens | Project-wide. cream/gold/dark-green palette already defined |
| cmdk | 1.1.1 | Company name typeahead autocomplete | Already installed. Powers shadcn/ui Command component. Combined with Popover for inline autocomplete |

### New (Must Install)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| minisearch | 7.2.0 | Client-side full-text search across provisions | Requirement PROV-09 explicitly names MiniSearch. ~8 KB gzipped. Zero dependencies. Supports prefix, fuzzy, boosting, filter callbacks. TypeScript types included |

### Supporting (Already Installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | 0.462.0 | Icons for filters, search, external link, dismiss chips | Already used throughout FTC components |
| date-fns | 3.6.0 | Date parsing/comparison for date range filtering | Already installed. Use `isWithinInterval`, `parseISO` for date range checks |
| class-variance-authority | 0.7.1 | Provision card variant styling | Used by shadcn/ui Badge, Button. Use for card category variants |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| MiniSearch | Fuse.js | Fuse.js is fuzzy-only, no inverted index, slower on large datasets. MiniSearch has proper full-text search with ranking. Requirement explicitly names MiniSearch |
| MiniSearch | Lunr.js | Lunr builds immutable index (no add/remove after build). MiniSearch allows dynamic updates and is actively maintained |
| cmdk Command | Custom typeahead | cmdk already installed, provides keyboard navigation, filtering, ARIA for free |
| Client-side filtering | Server-side / API | Project is static JSON pattern. No backend. Client-side filtering is the established architecture |

**Installation:**
```bash
npm install minisearch
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/ftc/
│   ├── FTCProvisionsTab.tsx         # REPLACE: Main provisions tab (sidebar + content area)
│   ├── provisions/
│   │   ├── TopicSidebar.tsx         # NEW: Persistent topic navigation sidebar
│   │   ├── ProvisionsLanding.tsx    # NEW: Landing view before topic selection
│   │   ├── ProvisionsContent.tsx    # NEW: Provision list with filter bar + cards
│   │   ├── ProvisionCard.tsx        # NEW: Single provision card (header + verbatim text)
│   │   ├── ProvisionFilterBar.tsx   # NEW: Sticky filter/sort/search bar
│   │   ├── FilterChips.tsx          # NEW: Active filter chips with dismiss
│   │   ├── CompanyAutocomplete.tsx  # NEW: Company name typeahead (cmdk + Popover)
│   │   ├── SearchResults.tsx        # NEW: Cross-topic search results grouped by topic
│   │   └── HighlightText.tsx        # NEW: Text highlighting for search matches
│   └── ...existing components
├── hooks/
│   ├── use-ftc-data.ts              # Existing, unchanged
│   ├── use-provisions.ts            # NEW: React Query hook for provision shards
│   └── use-provision-search.ts      # NEW: MiniSearch index management hook
├── types/
│   └── ftc.ts                       # MODIFY: Add verbatim_text to ProvisionRecord
└── constants/
    └── ftc.ts                       # MODIFY: Add topic groupings and date presets
```

### Pattern 1: Lazy-Loaded Topic Shards via React Query
**What:** Each topic shard is fetched independently when the user selects that topic. React Query caches the result so subsequent visits are instant.
**When to use:** For loading provision data per topic selection.
**Example:**
```typescript
// hooks/use-provisions.ts
import { useQuery } from "@tanstack/react-query";
import type { ProvisionShardFile } from "@/types/ftc";

const SHARD_FILENAMES: Record<string, string> = {
  "COPPA": "coppa-provisions.json",
  "FCRA": "fcra-provisions.json",
  "Privacy": "pa-privacy-provisions.json",
  // ... all 15 topics
};

export function useProvisions(topic: string | null) {
  return useQuery<ProvisionShardFile>({
    queryKey: ["provisions", topic],
    queryFn: async () => {
      const filename = SHARD_FILENAMES[topic!];
      const res = await fetch(`/data/provisions/${filename}`);
      if (!res.ok) throw new Error(`Failed to load provisions for ${topic}`);
      return res.json();
    },
    enabled: !!topic && !!SHARD_FILENAMES[topic],
    staleTime: Infinity,
  });
}
```

### Pattern 2: MiniSearch Index for Full-Text Search
**What:** Build a MiniSearch index from all loaded provision data. Support scoped search (current topic) and global search (all topics, requiring all shards to be loaded).
**When to use:** For PROV-09 text search with ranking.
**Example:**
```typescript
// hooks/use-provision-search.ts
import MiniSearch from "minisearch";
import { useMemo } from "react";
import type { ProvisionRecord } from "@/types/ftc";

// Extended ProvisionRecord with verbatim_text field (after build pipeline update)
export function useProvisionSearch(provisions: ProvisionRecord[]) {
  const miniSearch = useMemo(() => {
    const ms = new MiniSearch({
      fields: ["title", "summary", "verbatim_text"],
      storeFields: ["case_id", "company_name", "provision_number"],
      idField: "id", // will need composite ID: case_id + provision_number
      searchOptions: {
        boost: { title: 2 },
        prefix: true,
        fuzzy: 0.2,
      },
    });
    // Add composite ID for MiniSearch (requires unique string ID per document)
    const docs = provisions.map((p, i) => ({
      ...p,
      id: `${p.case_id}__${p.provision_number}`,
    }));
    ms.addAll(docs);
    return ms;
  }, [provisions]);

  return miniSearch;
}
```

### Pattern 3: Sidebar + Content Layout with URL State
**What:** A two-panel layout with a persistent topic sidebar on the left and a content area on the right. The selected topic is stored in URL search params for shareability.
**When to use:** For the main provisions tab layout.
**Example:**
```typescript
// FTCProvisionsTab.tsx
import { useSearchParams } from "react-router-dom";

export default function FTCProvisionsTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedTopic = searchParams.get("topic");

  const handleTopicSelect = (topic: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("tab", "provisions");
    newParams.set("topic", topic);
    // Clear filters when switching topics
    newParams.delete("q");
    newParams.delete("company");
    newParams.delete("dateRange");
    newParams.delete("remedy");
    setSearchParams(newParams, { replace: true });
  };

  return (
    <div className="flex gap-6 py-6">
      <TopicSidebar
        selectedTopic={selectedTopic}
        onSelectTopic={handleTopicSelect}
      />
      <div className="flex-1 min-w-0">
        {selectedTopic ? (
          <ProvisionsContent topic={selectedTopic} />
        ) : (
          <ProvisionsLanding />
        )}
      </div>
    </div>
  );
}
```

### Pattern 4: Provision Card Component
**What:** A card displaying verbatim order language as the primary content, with a context header showing company name, year, docket number, citation, and violation type.
**When to use:** For each provision in the list.
**Example:**
```typescript
// provisions/ProvisionCard.tsx
interface Props {
  provision: ProvisionRecord; // Extended with verbatim_text
  searchQuery?: string;       // For highlighting matches
}

export default function ProvisionCard({ provision, searchQuery }: Props) {
  return (
    <article className="border border-rule bg-cream/30 mb-4">
      {/* Context header bar */}
      <header className="bg-primary/5 border-b border-rule px-4 py-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="font-semibold text-primary font-garamond">
          {provision.company_name}
        </span>
        <span className="text-sm text-muted-foreground">{provision.year}</span>
        <span className="text-sm text-muted-foreground">{provision.docket_number}</span>
        <span className="text-sm font-medium text-gold-dark">
          Part {provision.provision_number}
        </span>
        <span className="text-xs text-muted-foreground uppercase tracking-wide-label">
          {provision.violation_type}
        </span>
        <a
          href={provision.ftc_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-gold hover:text-gold-dark underline ml-auto"
        >
          View on FTC.gov
        </a>
      </header>
      {/* Verbatim provision text */}
      <div className="px-4 py-4 font-garamond text-foreground leading-relaxed">
        <h4 className="font-semibold mb-2">{provision.title}</h4>
        <HighlightText text={provision.verbatim_text} query={searchQuery} />
      </div>
    </article>
  );
}
```

### Pattern 5: Sticky Filter Bar
**What:** A filter bar that sticks below the topic header as the user scrolls through provision cards. Contains date range presets, company autocomplete, remedy type filter, sort control, and search input.
**When to use:** For the filter controls above provision cards.
**Example:**
```typescript
// provisions/ProvisionFilterBar.tsx
// Sticky bar with CSS position: sticky + top offset
<div className="sticky top-0 z-10 bg-background border-b border-rule py-3 space-y-2">
  <div className="flex flex-wrap items-center gap-3">
    {/* Date range presets */}
    <div className="flex gap-1">
      {DATE_PRESETS.map(preset => (
        <button
          key={preset.label}
          onClick={() => onDateRange(preset.range)}
          className={cn(
            "text-xs px-2 py-1 border border-rule font-garamond",
            activeDateRange === preset.label
              ? "bg-primary text-primary-foreground"
              : "bg-cream hover:bg-gold/10"
          )}
        >
          {preset.label}
        </button>
      ))}
    </div>
    {/* Company autocomplete */}
    <CompanyAutocomplete onSelect={onCompanyFilter} />
    {/* Remedy type filter */}
    {/* Sort control */}
    {/* Search bar */}
    <SearchInput value={query} onChange={onSearch} scopeToggle />
  </div>
  {/* Active filter chips */}
  <FilterChips filters={activeFilters} onDismiss={onRemoveFilter} onClearAll={onClearAll} />
</div>
```

### Anti-Patterns to Avoid
- **Loading all shards upfront:** Do NOT fetch all 15 shard files on tab mount. Fetch only the selected topic's shard. Total shards are ~6 MB raw (~500 KB gzipped combined); loading them all wastes bandwidth for users who browse one topic. Exception: cross-topic search ("All topics" scope) requires loading all shards, but only trigger this when the user explicitly searches across topics.
- **Storing provisions in component state instead of React Query:** Use React Query as the data cache. Do NOT copy fetched provision data into useState. Derive filtered/sorted views with `useMemo` from the query data.
- **Rebuilding MiniSearch index on every render:** The MiniSearch index must be wrapped in `useMemo` with the provisions array as dependency. Index building is O(n) and should only happen when the underlying data changes.
- **Filtering inside render instead of useMemo:** All filtering (date range, company, remedy type) and sorting must be in `useMemo` with proper dependencies. With up to 1,583 provisions per shard, unnecessary recalculations are noticeable.
- **Using regex for search highlighting:** Use string splitting for highlight, not regex with user input (XSS risk and regex special character issues). Split matched text at boundaries.

## Data Architecture

### Critical Data Gap: Verbatim Text

The provision shard files currently contain these fields per provision:
```json
{
  "provision_number": "I",
  "title": "Prohibition Against Billing Without Express, Informed Consent",
  "category": "prohibition",
  "summary": "Respondent is prohibited from billing...",  // PARAPHRASE
  "statutory_topics": ["Section 5 Only"],
  "practice_areas": ["Deceptive Design / Dark Patterns"],
  "remedy_types": ["Prohibition"],
  "case_id": "01.24_epic_games",
  "company_name": "Epic Games, Inc.",
  "date_issued": "2024-01-15",
  "year": 2024,
  "administration": "Biden",
  "legal_authority": "Section 5 of the Federal Trade Commission Act",
  "ftc_url": "https://www.ftc.gov/...",
  "docket_number": "C-4790"
}
```

**Missing:** The `quoted_text` field from source files (`order.provisions[].requirements[].quoted_text`). The `summary` field is an AI-generated paraphrase; the `quoted_text` is the actual verbatim order language that PROV-02 requires.

**Also missing:** `violation_type` (deceptive/unfair/both) -- this exists in `case_info` in source files and in `ftc-cases.json` but is NOT included in the provision shard `ProvisionRecord` type.

### Build Pipeline Updates Required

The `build-provisions.ts` script must be updated to:
1. Concatenate `requirements[].quoted_text` into a single `verbatim_text` field per provision
2. Include `violation_type` from case_info in each provision record
3. The `ProvisionRecord` type in `src/types/ftc.ts` must be extended accordingly

**Size impact with verbatim text:**

| Shard | Current Size | Est. with Text | Est. Gzipped |
|-------|-------------|----------------|--------------|
| section-5-only | 1,523 KB | ~3,828 KB | ~200 KB |
| pa-privacy | 1,421 KB | ~3,429 KB | ~190 KB |
| pa-data-security | 821 KB | ~2,022 KB | ~120 KB |
| coppa | 520 KB | ~1,268 KB | ~65 KB |
| All 15 shards total | 5,882 KB | ~10,033 KB | ~750 KB |

All gzipped sizes are within acceptable range for on-demand loading (largest shard ~200 KB gzipped).

### Remedy Type as Topic Category

The CONTEXT.md specifies topics grouped under three headings: Statutory Authority, Practice Area, and **Remedy Type**. Currently, shards are keyed by statutory topic and practice area only. Remedy type provisions would need to be derived differently:

**Option A (Recommended):** Generate remedy-type shards at build time (10 additional shard files, one per remedy type). Each provision appears in shards for its remedy types. This follows the same pattern as existing statutory/practice-area shards.

**Option B:** Compute remedy-type groupings client-side from a loaded shard. This avoids new shards but requires loading all provisions to see remedy-type totals in the sidebar.

**Recommendation:** Option A. Generate remedy-type shards in `build-provisions.ts`. This keeps the sidebar counts accurate without loading all data, and follows the established sharding pattern.

### Topic Taxonomy (for sidebar)

**Statutory Authority** (7 topics, existing shards):
- COPPA (451 provisions)
- FCRA (399)
- GLBA (252)
- Health Breach Notification (106)
- CAN-SPAM (14)
- TSR (68)
- Section 5 Only (1,583)

**Practice Area** (8 topics, existing shards with `pa-` prefix):
- Privacy (1,379)
- Data Security (804)
- Deceptive Design / Dark Patterns (59)
- AI / Automated Decision-Making (39)
- Surveillance (104)
- Financial Practices (403)
- Telemarketing (34)
- Other (87)

**Remedy Type** (10 topics, need new shards):
- Monetary Penalty
- Data Deletion
- Comprehensive Security Program
- Third-Party Assessment
- Algorithmic Destruction
- Biometric Ban
- Compliance Monitoring
- Recordkeeping
- Prohibition
- Other

### Provision Counts Manifest

To show provision counts in the sidebar without loading all shards, generate a small manifest file at build time:

```json
// public/data/provisions/manifest.json (~1 KB)
{
  "generated_at": "2026-02-24T...",
  "total_provisions": 2783,
  "total_cases": 293,
  "topics": {
    "coppa": { "count": 451, "shard": "coppa-provisions.json", "category": "statutory" },
    "pa-privacy": { "count": 1379, "shard": "pa-privacy-provisions.json", "category": "practice_area" },
    "rt-monetary-penalty": { "count": 234, "shard": "rt-monetary-penalty-provisions.json", "category": "remedy_type" },
    ...
  }
}
```

This manifest is fetched once on provisions tab mount and drives the sidebar display.

### Data Flow
```
Tab mount → Fetch manifest.json (~1 KB)
    │
    ├─→ Sidebar renders with topic names + counts
    │
    User selects topic → Fetch {topic}-provisions.json (50-200 KB gzipped)
    │
    ├─→ Provisions list renders (up to 1,583 cards)
    ├─→ MiniSearch index built for current topic
    ├─→ Filters applied via useMemo
    │
    User searches "All topics" → Fetch ALL remaining shards (parallel)
    │
    ├─→ MiniSearch index rebuilt with all provisions
    ├─→ Results grouped by topic
```

### URL State Schema
```
/FTCAnalytics?tab=provisions                         # Landing view
/FTCAnalytics?tab=provisions&topic=coppa              # Topic selected
/FTCAnalytics?tab=provisions&topic=coppa&q=security   # Search within topic
/FTCAnalytics?tab=provisions&topic=coppa&dateRange=last5y&company=Meta
/FTCAnalytics?tab=provisions&q=algorithmic+destruction # Cross-topic search
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Full-text search with ranking | Custom string matching or regex search | MiniSearch | Handles tokenization, TF-IDF ranking, prefix matching, fuzzy matching. Custom search will miss edge cases and perform poorly at scale |
| Typeahead autocomplete | Custom input with manual filtering | cmdk Command + Popover (already installed) | Keyboard navigation, ARIA, scroll virtualization, fuzzy matching built in |
| URL state management | Custom URL encoding/decoding | react-router-dom `useSearchParams` | Handles encoding, browser history, type safety |
| Date range comparison | Manual date string comparison | date-fns `isWithinInterval` + `parseISO` (already installed) | Handles edge cases (timezone, format variance) |
| Text highlighting | Regex-based dangerouslySetInnerHTML | String split + React nodes | Avoids XSS, handles special characters, composable with React |
| Virtualized list | Custom scroll virtualization | Pagination (page through results) | With up to 1,583 provisions per shard, pagination (50 per page) is simpler and more appropriate for legal research UX than infinite scroll. Users need stable references, not streaming content |

**Key insight:** The primary complexity in this phase is data pipeline enhancement (adding verbatim text) and state management (filters + search + URL sync), not UI component building. The UI components are straightforward composition of existing shadcn/ui primitives.

## Common Pitfalls

### Pitfall 1: MiniSearch ID Uniqueness
**What goes wrong:** MiniSearch throws "duplicate ID" error when building the index.
**Why it happens:** `provision_number` is not unique across cases (many cases have provisions "I", "II", "III"). MiniSearch requires a unique ID per document.
**How to avoid:** Create a composite ID: `${case_id}__${provision_number}`. This is guaranteed unique since each case file has unique provision numbers.
**Warning signs:** Error thrown during `ms.addAll()` call.

### Pitfall 2: Cross-Topic Search Loading All Shards
**What goes wrong:** User switches search scope to "All topics" and the UI freezes while 15 shard files are fetched sequentially.
**Why it happens:** Fetching all shards serially blocks the UI. Combined, all shards are ~750 KB gzipped.
**How to avoid:** Use `Promise.all()` to fetch all shards in parallel when the user switches to "All topics" scope. Show a loading indicator during the fetch. Pre-fetch remaining shards in the background after the first topic is loaded (using React Query `prefetchQuery` or a background effect).
**Warning signs:** Long delay when switching from "This topic" to "All topics" search scope.

### Pitfall 3: Filter State Staling Across Topic Switches
**What goes wrong:** User filters by "Facebook" in the COPPA topic, switches to FCRA topic, and the "Facebook" filter is still active but matches nothing. User is confused by empty results.
**Why it happens:** Filter state persists in URL params across topic changes.
**How to avoid:** Clear company-specific and remedy-specific filters when switching topics. Date range can optionally persist (it's cross-topic relevant). The `handleTopicSelect` function must explicitly delete stale filter params.
**Warning signs:** Empty provision list after switching topics with active filters.

### Pitfall 4: Provision Card Rendering Performance with Full Text
**What goes wrong:** Scrolling through 1,583 provisions with full verbatim text (avg 1,491 chars each) causes jank.
**Why it happens:** Rendering 1,583 DOM nodes with long text content overloads the browser's layout engine.
**How to avoid:** Paginate the provision list (e.g., 50 provisions per page with "Load more" or page navigation). Do NOT render all 1,583 cards at once. Consider windowing (react-window) only if pagination is insufficient -- but pagination is simpler and more appropriate for legal research (users cite by page position).
**Warning signs:** Slow initial render when selecting a large topic like "Section 5 Only" or "Privacy".

### Pitfall 5: Search Highlighting Breaking HTML Structure
**What goes wrong:** Search highlight splits text mid-word or creates nested/invalid elements.
**Why it happens:** Naive string replacement with `dangerouslySetInnerHTML` or regex match on raw HTML.
**How to avoid:** Use a React-based highlighter: split the plain text at match boundaries, wrap matched segments in `<mark>` elements, return an array of React nodes. No HTML injection needed.
**Warning signs:** Broken layout in provision cards when search is active; console warnings about invalid HTML nesting.

### Pitfall 6: Tab Shell Clearing Provisions URL State
**What goes wrong:** User navigates to a specific topic with filters, switches to Analytics tab, then returns to Provisions -- all state is lost.
**Why it happens:** The existing `handleTabChange` in `FTCTabShell.tsx` clears ALL params when switching tabs (creates a fresh `URLSearchParams()`).
**How to avoid:** Modify `handleTabChange` to preserve provisions-specific params (`topic`, `q`, `dateRange`, etc.) when switching away and back. Or: accept that tab switches reset provisions state (simpler, user can re-select topic quickly from sidebar). Recommend the simpler approach -- clearing state on tab switch is expected behavior.
**Warning signs:** Users lose their browsing position when switching tabs.

## Code Examples

Verified patterns from the existing codebase and official documentation:

### MiniSearch Setup and Search
```typescript
// Source: MiniSearch official docs (https://lucaong.github.io/minisearch/)
import MiniSearch from "minisearch";

const miniSearch = new MiniSearch({
  fields: ["title", "summary", "verbatim_text"],
  storeFields: ["case_id", "company_name", "provision_number", "topic"],
  idField: "id",
  searchOptions: {
    boost: { title: 2, verbatim_text: 1 },
    prefix: true,
    fuzzy: 0.2,
  },
});

// Add documents (with composite ID)
miniSearch.addAll(provisions.map(p => ({
  ...p,
  id: `${p.case_id}__${p.provision_number}`,
})));

// Search with topic filter (for "This topic" scope)
const results = miniSearch.search("comprehensive security program", {
  filter: (result) => result.topic === selectedTopic,
});

// Search all topics
const allResults = miniSearch.search("comprehensive security program");
```

### Company Autocomplete using cmdk + Popover
```typescript
// Source: shadcn/ui Combobox pattern (Popover + Command)
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty } from "@/components/ui/command";

function CompanyAutocomplete({ companies, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="border border-rule px-3 py-1.5 text-sm font-garamond">
          {value || "Company..."}
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-64">
        <Command>
          <CommandInput placeholder="Search company..." />
          <CommandList>
            <CommandEmpty>No company found.</CommandEmpty>
            {companies.map((company) => (
              <CommandItem key={company} onSelect={() => {
                onSelect(company);
                setValue(company);
                setOpen(false);
              }}>
                {company}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

### Text Highlighting (React-safe, no dangerouslySetInnerHTML)
```typescript
// Safe text highlighting using string splitting
function HighlightText({ text, query }: { text: string; query?: string }) {
  if (!query || !query.trim()) {
    return <span>{text}</span>;
  }

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escapedQuery})`, "gi"));

  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-gold-light/50 text-foreground px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}
```

### Date Range Presets
```typescript
// constants/ftc.ts additions
export const DATE_PRESETS = [
  { label: "Last 5 years", start: "2021-01-01", end: "2026-12-31" },
  { label: "Obama era", start: "2009-01-20", end: "2017-01-20" },
  { label: "Trump era", start: "2017-01-20", end: "2021-01-20" },
  { label: "Biden era", start: "2021-01-20", end: "2025-01-20" },
] as const;

// Usage in filter logic
import { parseISO, isWithinInterval } from "date-fns";

function filterByDateRange(provisions: ProvisionRecord[], start: string, end: string) {
  const interval = { start: parseISO(start), end: parseISO(end) };
  return provisions.filter(p => isWithinInterval(parseISO(p.date_issued), interval));
}
```

### Provision Shard Fetch Hook
```typescript
// hooks/use-provisions.ts
import { useQuery, useQueries } from "@tanstack/react-query";

interface ProvisionsManifest {
  total_provisions: number;
  total_cases: number;
  topics: Record<string, { count: number; shard: string; category: string }>;
}

export function useProvisionsManifest() {
  return useQuery<ProvisionsManifest>({
    queryKey: ["provisions-manifest"],
    queryFn: async () => {
      const res = await fetch("/data/provisions/manifest.json");
      if (!res.ok) throw new Error("Failed to load provisions manifest");
      return res.json();
    },
    staleTime: Infinity,
  });
}

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

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Lunr.js (immutable index) | MiniSearch 7.x (dynamic, typed) | MiniSearch 7.0 (2024) | Supports addAll/removeAll dynamically, TypeScript-first, smaller bundle |
| Manual URL state mgmt | react-router-dom v6 useSearchParams | v6 (2021) | Already using this pattern |
| Virtual scroll for long lists | Pagination for legal/reference content | UX best practice | Legal practitioners need stable page references, not streaming content |

**Deprecated/outdated:**
- Fuse.js is still maintained but is a fuzzy matcher, not a full-text search engine. For ranked full-text search with boosting, MiniSearch is the standard choice.
- `react-minisearch` (React wrapper) exists but adds unnecessary abstraction. Using MiniSearch directly with `useMemo` is simpler and more transparent.

## Performance Considerations

### Data Transfer Budget
- Manifest file: ~1 KB (fetched once on tab mount)
- Single shard: 50-200 KB gzipped (fetched per topic selection)
- All shards: ~750 KB gzipped (fetched only for cross-topic search)
- MiniSearch library: ~8 KB gzipped

### Rendering Budget
- Largest shard: 1,583 provisions (Section 5 Only)
- With pagination (50 per page): 50 provision cards rendered at a time
- Each card: ~50 DOM nodes (header bar + text block)
- Total DOM: ~2,500 nodes per page -- well within browser limits
- MiniSearch index build: ~50ms for 1,583 documents (fast enough for synchronous `useMemo`)

### Pagination Strategy
Paginate provision lists at 50 items per page. This provides:
- Fast initial render (<100ms)
- Manageable DOM size
- Stable page references for legal practitioners
- "Showing 1-50 of 1,583 provisions" count display (PROV-10)

## Open Questions

1. **Remedy type shard generation**
   - What we know: The CONTEXT.md specifies remedy types as a sidebar category. Current build pipeline generates statutory + practice area shards only.
   - What's unclear: Exact provision counts per remedy type (need to run analysis). Some remedy types may have very few provisions.
   - Recommendation: Add remedy-type shard generation to `build-provisions.ts` with `rt-` prefix. If any remedy type has fewer than 5 provisions, consider grouping it under "Other" or keeping it but noting the small count.

2. **Cross-topic search loading strategy**
   - What we know: "All topics" search requires all shard data. Total ~750 KB gzipped.
   - What's unclear: Should we prefetch all shards in the background after the first topic loads, or only fetch on demand when user toggles to "All topics"?
   - Recommendation: Lazy prefetch. After the first topic shard loads, use `queryClient.prefetchQuery` to start loading other shards in the background with low priority. This way, by the time the user tries "All topics" search, most shards are already cached. If not all loaded yet, show a loading state for the remaining shards.

3. **Violation type inclusion in provision shards**
   - What we know: PROV-04 requires "violation type" on each provision card. The `violation_type` field exists on `case_info` in source files but is not included in `ProvisionRecord`.
   - What's unclear: Whether to add it to the build pipeline or compute it by joining with ftc-cases.json data.
   - Recommendation: Add `violation_type` to the `ProvisionRecord` type and the build pipeline. It is a per-case field (not per-provision), so it adds minimal size overhead (~15 chars per provision).

## Sources

### Primary (HIGH confidence)
- **Codebase inspection** - Read all provision shard files, source case files, build-provisions.ts, FTCTabShell.tsx, FTCProvisionsTab.tsx, FTCSectionSidebar.tsx, FTCAnalyticsTab.tsx, all type definitions, hooks, constants, tailwind config, package.json. All data gap findings verified against actual file contents.
- **MiniSearch official docs** (https://lucaong.github.io/minisearch/) - Verified version 7.2.0, API methods (addAll, search, autoSuggest), constructor options (fields, storeFields, idField, searchOptions), search options (boost, prefix, fuzzy, filter). Bundle size under 10 KB gzipped.
- **MiniSearch GitHub README** (https://github.com/lucaong/minisearch) - Verified TypeScript types included, zero dependencies, filter callback API for scoped search.
- **Data analysis** - Ran scripts to verify: 2,783 total provisions, 279 unique companies, 8,279 requirement records with quoted_text (8,279 with text / 18 without), average 1,491 chars per provision verbatim text. Gzip compression analysis of all 15 shard files.

### Secondary (MEDIUM confidence)
- **cmdk Combobox pattern** - shadcn/ui documents Popover + Command for combobox/autocomplete. Pattern verified from existing `command.tsx` and `popover.tsx` in the codebase. Exact cmdk version (1.1.1) confirmed in package.json.
- **date-fns 3.6.0** - `isWithinInterval` and `parseISO` are standard date-fns functions. Verified installed in package.json.

### Tertiary (LOW confidence)
- **MiniSearch index build performance** - Estimated ~50ms for 1,583 documents based on library claims of "fast in-browser performance." Not benchmarked on this specific dataset. Should be validated during implementation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - MiniSearch is the only new dependency. All other libraries already installed and in use. MiniSearch verified via official docs.
- Architecture: HIGH - Sidebar + content layout follows existing FTCAnalyticsTab pattern (FTCSectionSidebar + content area). Data fetching follows existing React Query pattern (use-ftc-data.ts). URL state follows existing useSearchParams pattern.
- Data pipeline: HIGH - Build pipeline update is straightforward (add fields to existing ProvisionRecord). Verified source data has quoted_text in 99.8% of requirement records.
- Pitfalls: HIGH - Identified from data analysis (ID uniqueness, shard sizes, rendering performance) and existing codebase patterns (tab state clearing, filter persistence).

**Research date:** 2026-02-24
**Valid until:** 2026-03-24 (stable - MiniSearch 7.x is mature, no fast-moving dependencies)
