# Architecture Patterns

**Domain:** Legal provisions library / FTC enforcement research tool
**Researched:** 2026-02-24
**Confidence:** HIGH — based on direct inspection of codebase, data files, and existing patterns

---

## Recommended Architecture

The new provisions library, classification upgrade, and analytics should be structured as a **replacement** of the existing FTC Analytics page, preserving the established static-JSON pipeline pattern and extending it with two new data artifacts: a provisions index and a cross-case patterns index.

The core insight: **all data transformation happens at build time**. The browser receives pre-computed, denormalized JSON that requires no server-side queries. Client-side work is filtering, sorting, and rendering only.

### System Overview

```
Build-Time Pipeline                Runtime SPA
───────────────────────────────    ──────────────────────────────────
FTC Source JSON (293 files)
         │
         ▼
scripts/build-ftc-data.ts          /FTCAnalytics route
  ├─ classifyCategories()              └── FTCAnalytics.tsx (page)
  ├─ [NEW] classifyTopics()                ├── useEnforcementData() hook
  ├─ [NEW] indexProvisions()               │     └── fetch ftc-cases.json (React Query)
  └─ [NEW] detectPatterns()                ├── useProvisionsIndex() hook
         │                                 │     └── fetch ftc-provisions.json (React Query)
         ▼                                 ├── usePatternIndex() hook
public/data/                               │     └── fetch ftc-patterns.json (React Query)
  ├─ ftc-cases.json (existing)             │
  ├─ [NEW] ftc-provisions.json             ├── ProvisionsLibrary (topic-first browser)
  ├─ [NEW] ftc-patterns.json               ├── EnforcementAnalytics (charts + tables)
  └─ ftc-files/{id}.json (per-case)        └── CrossCasePatterns (language evolution)
```

---

## Component Boundaries

### Layer 1: Build-Time Pipeline (scripts/build-ftc-data.ts)

**Responsibility:** Read raw case JSON, classify provisions, compute indexes, write output.

No runtime code can depend on or call this layer. It runs offline via `npm run build:ftc-data`.

| Function | Input | Output | Notes |
|----------|-------|--------|-------|
| `classifyCategories()` | count titles, legal authority, factual background | `string[]` case topics | Already exists, keyword-based |
| `classifyTopics()` | individual provision: title + summary + requirements | `TopicTag[]` | New — provision-level tagging using expanded taxonomy |
| `buildProvisionsIndex()` | all cases + provisions | `ProvisionsIndex` | Flat array of every provision, enriched with case context |
| `detectPatterns()` | provisions index | `PatternIndex` | Groups provisions by normalized language fingerprint |
| `computeGroupStats()` | cases array | `GroupStats[]` | Already exists |
| `generateAnalysis()` | groupings | narrative text | Already exists |

**Output artifacts:**

`ftc-cases.json` — unchanged shape, but `FTCCaseSummary` gains `topic_tags: string[]` (provision-derived, richer than current `categories`).

`ftc-provisions.json` — flat list of all provisions across all cases, each provision enriched with case context. This is the core new artifact.

`ftc-patterns.json` — grouped provisions that share normalized boilerplate language, with timeline of when each variant appeared.

---

### Layer 2: Data Access Hooks (src/hooks/)

**Responsibility:** Fetch JSON from `/data/`, cache with React Query, expose typed data to components.

Components never fetch directly. All data access goes through hooks. Hooks never filter or transform — that belongs in `useMemo` inside components.

| Hook | Fetches | Returns | Used By |
|------|---------|---------|---------|
| `useFTCData()` | `ftc-cases.json` | `FTCDataPayload` | Analytics page |
| `useProvisionsIndex()` | `ftc-provisions.json` | `ProvisionsIndexPayload` | Provisions Library page |
| `usePatternIndex()` | `ftc-patterns.json` | `PatternIndexPayload` | Cross-case Patterns page |

All hooks use `staleTime: Infinity` — data never changes during a session. This is the established pattern and should be preserved.

---

### Layer 3: Page Components (src/pages/)

**Responsibility:** Top-level route components. Own URL state via `useSearchParams`. Orchestrate feature components via props. Handle loading and error states.

Pages do not contain rendering logic — they pass data down. The FTC Analytics page replaces the existing `FTCAnalytics.tsx`. No new routes are needed if the three feature areas (Library, Analytics, Patterns) are implemented as tabs within one page. This is the correct approach — it avoids URL proliferation and matches the existing pattern.

**Recommended page structure:**

```
/FTCAnalytics?tab=analytics     → EnforcementAnalytics view (existing + deepened)
/FTCAnalytics?tab=library       → ProvisionsLibrary view (new)
/FTCAnalytics?tab=library&topic=COPPA        → Topic detail within library
/FTCAnalytics?tab=patterns      → CrossCasePatterns view (new)
```

A single `FTCAnalytics.tsx` page handles all three tabs. This keeps the existing route, preserves backward-compatible URLs for the analytics view (the tab defaults to analytics), and avoids adding new routes to `App.tsx`.

---

### Layer 4: Feature Component Groups (src/components/ftc/)

**Responsibility:** Receive typed data via props, render domain UI. No fetching. No URL state access. Pure rendering + local interaction state only.

Three feature groups, each in its own subdirectory or clearly named prefix:

**Enforcement Analytics** (existing components, extended):

| Component | Responsibility | Input Props |
|-----------|---------------|-------------|
| `FTCHeader` | Page-level header and tab navigation | `activeTab`, `onTabChange` |
| `FTCOverviewStats` | Summary stat cards | `data: FTCDataPayload` |
| `FTCGroupingSelector` | Year / Admin / Category pivot control | `mode`, `onModeChange` |
| `FTCGroupChart` | Bar chart of enforcement counts | `data`, `mode`, `onBarClick` |
| `FTCGroupList` | Tabular group list with selection | `data`, `mode`, `selectedGroup`, `onSelectGroup` |
| `FTCGroupDetail` | Detail panel for selected group | `data`, `mode`, `groupKey` |
| `FTCAnalysisPanel` | Narrative text for group | `data`, `mode`, `groupKey` |
| `FTCCaseTable` | Sortable case list table | `cases: FTCCaseSummary[]` |

**Provisions Library** (new components):

| Component | Responsibility | Input Props |
|-----------|---------------|-------------|
| `ProvisionTopicNav` | Sidebar or tab strip listing all topics | `topics: string[]`, `activeTopic`, `onTopicSelect` |
| `ProvisionTopicView` | All provisions for one topic | `topic: string`, `provisions: ProvisionRecord[]` |
| `ProvisionCard` | Single provision: quoted text, citation, case context | `provision: ProvisionRecord` |
| `ProvisionFilterBar` | Sort/filter controls (date, remedy type, company) | `filters`, `onFilterChange` |
| `ProvisionCitationLink` | Paragraph-level citation + FTC.gov external link | `provision: ProvisionRecord` |

**Cross-Case Patterns** (new components):

| Component | Responsibility | Input Props |
|-----------|---------------|-------------|
| `PatternList` | List of detected boilerplate language clusters | `patterns: PatternGroup[]` |
| `PatternDetail` | Timeline showing how one language cluster evolved | `pattern: PatternGroup` |
| `PatternVariantCard` | One variant of a pattern: quoted text, date, company | `variant: PatternVariant` |

---

### Layer 5: Types and Constants (src/types/, src/constants/)

**Responsibility:** Shared TypeScript interfaces, taxonomy constants, classification functions. No runtime logic beyond pure functions.

New types needed alongside existing `src/types/ftc.ts`:

```typescript
// Provision-level record in the flat index
interface ProvisionRecord {
  case_id: string;
  company_name: string;
  date_issued: string;
  year: number;
  administration: string;
  ftc_url?: string;
  // Provision fields
  provision_number: string;         // "II" or "II.A.3"
  provision_title: string;
  provision_category: string;       // structural: prohibition | affirmative_obligation | etc.
  provision_summary: string;
  topic_tags: string[];             // substantive: ["COPPA", "Data Retention"]
  remedy_tags: string[];            // remedy type: ["Algorithmic Destruction"]
  // Requirement fields
  requirements: ProvisionRequirement[];
}

interface ProvisionRequirement {
  description: string;
  quoted_text: string;
  quote_start_line: number;
  quote_end_line: number;
}

interface ProvisionsIndexPayload {
  generated_at: string;
  total_provisions: number;
  topics: string[];                 // sorted topic list for navigation
  provisions: ProvisionRecord[];    // flat, all provisions
}

// Cross-case pattern
interface PatternGroup {
  pattern_id: string;
  pattern_title: string;
  canonical_language: string;       // exemplar quoted text
  topic_tags: string[];
  variant_count: number;
  first_seen: string;               // date_issued of earliest case
  last_seen: string;
  variants: PatternVariant[];
}

interface PatternVariant {
  case_id: string;
  company_name: string;
  date_issued: string;
  administration: string;
  quoted_text: string;
  provision_number: string;
}

interface PatternIndexPayload {
  generated_at: string;
  total_patterns: number;
  patterns: PatternGroup[];
}
```

Topic taxonomy constants (in `src/constants/ftc.ts`, extended):

```typescript
// Statutory topics
export const STATUTORY_TOPICS = [
  "COPPA", "FCRA", "GLBA", "Health Breach Notification Rule",
  "CAN-SPAM", "TCPA", "FTC Act Section 5"
];

// Practice area topics
export const PRACTICE_TOPICS = [
  "Privacy", "Data Security", "Deceptive Design / Dark Patterns",
  "AI / Automated Decision-Making", "Surveillance", "Location Data"
];

// Remedy types
export const REMEDY_TAGS = [
  "Monetary Penalty", "Algorithmic Destruction", "Data Deletion",
  "Comprehensive Security Program", "Biometric Ban",
  "Record-keeping", "Compliance Monitoring", "Third-Party Assessment"
];
```

---

## Data Flow

### Build-Time Data Flow

```
FTC Source JSON (293 files, external path)
         │
         ▼
scripts/build-ftc-data.ts
         │
         ├─[existing]─► classifyCategories(counts, authority, factual)
         │                      └─► case.categories[] (keyword match)
         │
         ├─[new]──────► classifyTopics(provision.title, provision.summary, requirements)
         │                      └─► provision.topic_tags[], provision.remedy_tags[]
         │
         ├─[new]──────► buildProvisionsIndex(all cases)
         │                      └─► flat array of ProvisionRecord[]
         │                          (one record per provision, enriched with case context)
         │
         └─[new]──────► detectPatterns(provisions index)
                                └─► PatternGroup[] (normalized language fingerprinting)

         Output ─►  public/data/ftc-cases.json      (enhanced FTCDataPayload)
                    public/data/ftc-provisions.json  (ProvisionsIndexPayload)
                    public/data/ftc-patterns.json    (PatternIndexPayload)
                    public/data/ftc-files/{id}.json  (unchanged per-case files)
```

### Runtime Data Flow (Provisions Library)

```
User navigates to /FTCAnalytics?tab=library
         │
         ▼
FTCAnalytics.tsx
  ├─ reads tab from useSearchParams()
  ├─ calls useProvisionsIndex() → React Query fetches ftc-provisions.json (once, staleTime: Infinity)
  └─ passes { provisionsData, activeTopic } to <ProvisionsLibraryView />
              │
              ├─ <ProvisionTopicNav topics={data.topics} activeTopic />
              │       User clicks topic
              │         └─► setSearchParams({ tab: 'library', topic: 'COPPA' })
              │
              └─ <ProvisionTopicView topic="COPPA" provisions={filtered}>
                      │
                      │  [useMemo: filter data.provisions where topic_tags includes activeTopic]
                      │
                      ├─ <ProvisionFilterBar filters onFilterChange />
                      └─ [filtered, sorted provisions].map(p =>
                              <ProvisionCard provision={p} />
                                ├─ quoted_text (blockquote)
                                ├─ provision_number + provision_title (citation)
                                └─ <ProvisionCitationLink /> → external FTC.gov link
                         )
```

**Key rule:** Filtering always happens via `useMemo` in the rendering component, never in the hook. The hook returns the full dataset; the component slices it. This matches the established `FTCGroupDetail` pattern.

### Runtime Data Flow (Analytics, enhanced)

```
User at /FTCAnalytics?tab=analytics&mode=year&group=2020
         │
         ▼
FTCAnalytics.tsx
  ├─ calls useFTCData() → ftc-cases.json (React Query, staleTime: Infinity)
  ├─ calls useProvisionsIndex() → ftc-provisions.json (same session, cached)
  └─ passes data to analytics components
              │
              ├─ Existing: FTCGroupingSelector, FTCGroupChart, FTCGroupList, FTCGroupDetail
              └─ New: TopicTrendChart (provisions data: topic frequency over time)
                       TopicBreakdownTable (rows per topic, columns per year/admin)
```

Note: Both hooks are called on the page regardless of active tab. React Query handles this gracefully — each fetch runs once and is cached. There is no performance concern; the two JSON files are loaded in parallel on first visit.

---

## Suggested Build Order

The build order is driven by data dependencies: components cannot be built until the data they consume exists and is typed.

### Phase 1: Data Pipeline Extension (prerequisite to all UI)

Build the enhanced classification and new index generation in `scripts/build-ftc-data.ts`.

1. Define all new TypeScript interfaces in `src/types/ftc.ts` and `src/types/ftc-provisions.ts`
2. Extend topic taxonomy in `src/constants/ftc.ts` (statutory, practice, remedy tags)
3. Implement `classifyTopics()` — provision-level classification
4. Implement `buildProvisionsIndex()` — flat provision records with case context
5. Implement `detectPatterns()` — language fingerprinting for cross-case patterns
6. Run pipeline, verify output JSON shape and provision counts
7. Create `useProvisionsIndex()` and `usePatternIndex()` hooks

No UI work should begin until this phase is complete. The data shape drives component props.

### Phase 2: Analytics Enhancement (least new surface area, highest value)

Extend the existing analytics page with provision-derived data. Builds on existing infrastructure.

1. Upgrade `FTCHeader` to support tab navigation (analytics / library / patterns)
2. Add topic-trend charts to the analytics tab (uses `ftc-provisions.json`)
3. Add `TopicBreakdownTable` for drill-down by topic x time period
4. Wire URL state for the new tab param

### Phase 3: Provisions Library (core new feature)

1. `ProvisionTopicNav` — topic list sidebar/tabs
2. `ProvisionTopicView` + `useMemo` filtering
3. `ProvisionCard` — quoted text display, citation, link
4. `ProvisionFilterBar` — sort by date, filter by remedy type
5. `ProvisionCitationLink` — paragraph ref display and FTC.gov URL

### Phase 4: Cross-Case Patterns (most technically novel)

1. `PatternList` — all detected pattern groups
2. `PatternDetail` — timeline view of one pattern
3. `PatternVariantCard` — individual variant display

---

## Patterns to Follow

### Pattern 1: Single Fetch, Client-Side Filter

**What:** Fetch the entire data artifact once per session (React Query, `staleTime: Infinity`). Filter and slice in `useMemo` inside rendering components.

**When:** Always, for FTC data. The dataset is bounded (293 cases, ~2,000 provisions estimated). There is no case for paginated or partial fetching.

**Example:**
```typescript
// In the page component
const { data } = useProvisionsIndex();
const activeTopic = searchParams.get("topic") ?? data?.topics[0];

// In the topic view component
const filtered = useMemo(
  () => provisions.filter(p => p.topic_tags.includes(activeTopic)),
  [provisions, activeTopic]
);
```

**Why:** Matches established pattern. Keeps components pure. Avoids prop drilling of filter state. Allows instant client-side filtering without network round-trips.

### Pattern 2: URL-Driven Navigational State

**What:** Shareable page state (active tab, selected topic, selected group) lives in URL search params. Ephemeral UI state (sort direction, hover state) lives in `useState`.

**When:** Any state a user should be able to bookmark or share.

**Example:**
```typescript
// In FTCAnalytics.tsx
const [searchParams, setSearchParams] = useSearchParams();
const tab = searchParams.get("tab") ?? "analytics";
const topic = searchParams.get("topic") ?? null;

function handleTopicSelect(t: string) {
  setSearchParams({ tab: "library", topic: t });
}
```

### Pattern 3: Page Orchestrates, Feature Components Render

**What:** The page component handles data fetching (via hooks), URL state, and passing props down. Feature components receive typed props and render without knowing about URLs, hooks, or global state.

**When:** Always. Feature components in `src/components/ftc/` should never call hooks directly or access `useSearchParams`.

**Example (existing, should be preserved):**
```typescript
// FTCGroupDetail.tsx — receives props, uses useMemo, renders
export default function FTCGroupDetail({ data, mode, groupKey }: Props) {
  const filteredCases = useMemo(() => {
    return data.cases.filter(c => { ... });
  }, [data.cases, mode, groupKey]);
  return <FTCCaseTable cases={filteredCases} />;
}
```

### Pattern 4: Build-Time Classification, Never Runtime

**What:** All topic tagging, pattern detection, and index generation happens in the build script. The browser receives pre-classified data and never runs classification logic.

**When:** For FTC data exclusively. Classification is deterministic and the data changes only when the pipeline is re-run.

**Why:** Keeps bundle size small (no NLP libraries in browser). Keeps runtime fast (no classification latency). Makes outputs auditable (pipeline output is inspectable JSON).

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Fetching Individual Case Files at Runtime for Provisions

**What:** Fetching `ftc-files/{id}.json` for each case individually to read provisions in the browser.

**Why bad:** 293 sequential or parallel fetches. Latency is unbearable. The whole point of the build pipeline is to pre-aggregate.

**Instead:** The build script reads all 293 files, extracts provisions, and writes `ftc-provisions.json` as a single pre-aggregated artifact. The browser fetches one file.

### Anti-Pattern 2: React Context for FTC Data

**What:** Putting FTC data into a React Context and consuming it in deep component trees.

**Why bad:** Causes unnecessary re-renders across the component tree. React Query is already the cache. The existing prop-drilling pattern is intentional and appropriate at this scale.

**Instead:** Continue passing data down via props from page to feature components. The tree is at most 3 levels deep.

### Anti-Pattern 3: Separate Routes for Library and Patterns

**What:** Adding `/FTCLibrary` and `/FTCPatterns` as separate top-level routes.

**Why bad:** Adds complexity to `App.tsx` and `vercel.json`. Splits page-level loading state. Makes it harder to share data fetched by one feature with another (e.g., analytics and library both need case data).

**Instead:** Single `/FTCAnalytics` route with tab navigation via search params. All three feature areas share the same page component, can share the same React Query cache, and the URL conveys the active view.

### Anti-Pattern 4: Runtime Topic Classification

**What:** Shipping the taxonomy rules and a classification function to the browser, then classifying provisions client-side on first load.

**Why bad:** Adds classification latency to every page load. Makes classification non-auditable (output changes if rules change, with no artifact to inspect). Increases bundle size unnecessarily.

**Instead:** Classification is a build-time concern. Output is static JSON. When taxonomy rules change, re-run the pipeline and redeploy.

### Anti-Pattern 5: Zod Validation of FTC JSON at Runtime

**What:** Using Zod schemas to parse/validate `ftc-cases.json` or `ftc-provisions.json` in the browser.

**Why bad:** The JSON is produced by the build pipeline we control. Runtime validation adds latency on every session start and provides no safety benefit — if the pipeline produces bad data, the build should catch it, not the browser.

**Instead:** Use Zod in the build script to validate pipeline output before writing files (optional but valuable). In the browser, trust the types.

---

## Scalability Considerations

| Concern | Current scale (293 cases) | Future scale |
|---------|--------------------------|--------------|
| `ftc-cases.json` size | ~500KB uncompressed | Linear with cases; fine to 5K cases |
| `ftc-provisions.json` size | ~2–5MB estimated (provisions with quoted text) | Gzip brings to ~400KB; fine for a reference tool |
| Client-side filter speed | Sub-millisecond with useMemo | `useMemo` + array filter scales to 10K provisions without issue |
| Build script runtime | Seconds | Minutes at 10K files; still acceptable for an offline pipeline |
| `ftc-patterns.json` size | Unknown until implemented | Start simple: exact/near-exact title matching |

Pattern detection is the only technically open question. A simple approach (normalize provision titles, group by normalized title hash) will work at this scale and should be the starting point. More sophisticated fuzzy matching can be added in a later phase if needed.

---

## File Layout for New Code

```
src/
├── types/
│   ├── ftc.ts                    # Existing — extend FTCCaseSummary with topic_tags
│   └── ftc-provisions.ts         # New — ProvisionRecord, ProvisionsIndexPayload, PatternGroup, PatternIndexPayload
├── constants/
│   └── ftc.ts                    # Existing — extend with STATUTORY_TOPICS, PRACTICE_TOPICS, REMEDY_TAGS
├── hooks/
│   ├── use-ftc-data.ts           # Existing — unchanged
│   ├── use-provisions-index.ts   # New — fetches ftc-provisions.json
│   └── use-pattern-index.ts      # New — fetches ftc-patterns.json
├── components/ftc/
│   ├── FTCHeader.tsx             # Existing — extend with tab navigation
│   ├── FTCOverviewStats.tsx      # Existing — unchanged
│   ├── FTCGroupingSelector.tsx   # Existing — unchanged
│   ├── FTCGroupChart.tsx         # Existing — unchanged
│   ├── FTCGroupList.tsx          # Existing — unchanged
│   ├── FTCGroupDetail.tsx        # Existing — unchanged
│   ├── FTCAnalysisPanel.tsx      # Existing — unchanged
│   ├── FTCCaseTable.tsx          # Existing — unchanged
│   ├── FTCMissingCasesNotice.tsx # Existing — unchanged
│   ├── TopicTrendChart.tsx       # New — analytics: topic frequency over time
│   ├── TopicBreakdownTable.tsx   # New — analytics: topic x period breakdown
│   ├── ProvisionTopicNav.tsx     # New — library: topic list navigation
│   ├── ProvisionTopicView.tsx    # New — library: all provisions for one topic
│   ├── ProvisionCard.tsx         # New — library: single provision display
│   ├── ProvisionFilterBar.tsx    # New — library: filter/sort controls
│   ├── ProvisionCitationLink.tsx # New — library: citation + FTC.gov link
│   ├── PatternList.tsx           # New — patterns: list of pattern groups
│   ├── PatternDetail.tsx         # New — patterns: timeline for one pattern
│   └── PatternVariantCard.tsx    # New — patterns: one variant in a timeline
├── pages/
│   └── FTCAnalytics.tsx          # Existing — replace with tabbed version
scripts/
└── build-ftc-data.ts             # Existing — extend with classifyTopics, buildProvisionsIndex, detectPatterns
public/data/
├── ftc-cases.json                # Existing — enhanced shape
├── ftc-provisions.json           # New artifact
├── ftc-patterns.json             # New artifact
└── ftc-files/{id}.json           # Existing per-case files
```

---

## Sources

- Direct codebase inspection: `src/types/ftc.ts`, `src/hooks/use-ftc-data.ts`, `scripts/build-ftc-data.ts`, `src/pages/FTCAnalytics.tsx`, `src/components/ftc/*`
- Raw provision data structure: `public/data/ftc-files/01.05_assail.json` (representative case)
- Existing architecture: `.planning/codebase/ARCH.md`
- Project requirements: `.planning/PROJECT.md`
- Confidence: HIGH on all component boundaries and data flow — directly grounded in existing code and data shapes
