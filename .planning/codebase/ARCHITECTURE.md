# Architecture

**Analysis Date:** 2026-02-26

## Pattern Overview

**Overall:** Static-first SPA with offline-capable client-side data analysis

**Key Characteristics:**
- No backend API at runtime — all FTC enforcement data is pre-built into static JSON files served from `public/data/`
- Data pipeline (scripts) runs offline/locally to transform raw case JSON into typed, sharded data payloads
- Client fetches JSON over HTTP and performs all filtering, searching, and aggregation in the browser
- URL search params (`?tab=`, `?topic=`, `?sector=`, `?q=`) serve as the navigation state store
- React Query (`staleTime: Infinity`) caches all fetched JSON indefinitely — no re-fetching after initial load

## Layers

**Data Pipeline (Build-time):**
- Purpose: Transform raw FTC consent order JSON into typed, sharded static files ready for the browser
- Location: `scripts/`
- Contains: `build-ftc-data.ts`, `classify-provisions.ts`, `build-provisions.ts`, `build-patterns.ts`
- Depends on: Raw source JSON at `C:/Users/rafst/Documents/projectas/FTC/output_v2` (external path, not in repo)
- Used by: Build process only; outputs land in `public/data/`
- Run order: `build:ftc-data` → `build:classify` → `build:provisions` → `build:patterns`

**Static Data Layer:**
- Purpose: Pre-built JSON files served as static assets
- Location: `public/data/`
- Contains:
  - `ftc-cases.json` — aggregate case index with groupings and analysis (`FTCDataPayload`)
  - `ftc-files/[case-id].json` — individual classified consent order files
  - `provisions/manifest.json` — index of all provision topic shards (`ProvisionsManifest`)
  - `provisions/[topic]-provisions.json` — statutory topic shards (`ProvisionShardFile`)
  - `provisions/pa-[area]-provisions.json` — practice area shards
  - `provisions/rt-[remedy]-provisions.json` — remedy type shards
  - `ftc-patterns.json` — cross-case pattern groups (`PatternsFile`)

**Data Access Layer (React Hooks):**
- Purpose: Typed `fetch()` wrappers using React Query; cache all responses permanently
- Location: `src/hooks/`
- Contains:
  - `use-ftc-data.ts` — fetches `ftc-cases.json`; returns `FTCDataPayload`
  - `use-provisions.ts` — `useProvisionsManifest()` and `useProvisionShard(filename)`
  - `use-patterns.ts` — fetches `ftc-patterns.json`; returns `PatternsFile`
  - `use-provision-search.ts` — MiniSearch index over loaded provision shards; supports in-topic and cross-topic search
  - `use-mobile.tsx` — viewport detection
  - `use-toast.ts` — toast notification helper
- Depends on: `@tanstack/react-query`, `minisearch`
- Used by: Feature tab components

**Type Definitions:**
- Purpose: Single source of truth for all FTC domain types
- Location: `src/types/ftc.ts`
- Contains: `FTCCaseSummary`, `FTCDataPayload`, `GroupStats`, `ProvisionRecord`, `ProvisionShardFile`, `ProvisionsManifest`, `PatternGroup`, `PatternsFile`, `EnhancedFTCCaseSummary`, and all union types (`StatutoryTopic`, `PracticeArea`, `RemedyType`, `IndustrySector`)

**Constants / Classification Logic:**
- Purpose: Keyword-based classification rules and administration date ranges shared across build scripts and runtime
- Location: `src/constants/ftc.ts`
- Contains: `CATEGORY_RULES`, `ADMINISTRATIONS`, `DATE_PRESETS`, `REMEDY_TYPE_OPTIONS`, `classifyCategories()`, `getAdministration()`
- Note: Build scripts inline these constants to avoid path alias issues in `tsx` runner

**Feature Components (Tab System):**
- Purpose: Tab-level orchestration and domain-specific UI; receive pre-loaded data as props or fetch via hooks
- Location: `src/components/ftc/`
- Key orchestrators:
  - `FTCTabShell.tsx` — URL-driven tab router; loads `useFTCData()` once and gates all tabs
  - `FTCAnalyticsTab.tsx` — receives `FTCDataPayload`; renders analytics chart sections
  - `FTCProvisionsTab.tsx` — URL-driven provisions browser; loads manifest then lazily loads shards on topic selection
  - `FTCIndustryTab.tsx` — receives `FTCDataPayload`; URL-driven sector/compare/detail view switching
  - `FTCPatternsTab.tsx` — loads `usePatterns()`; renders `PatternList`

**Sub-Feature Components:**
- Purpose: Presentational components for specific features within each tab
- Location: `src/components/ftc/analytics/`, `src/components/ftc/provisions/`, `src/components/ftc/industry/`, `src/components/ftc/patterns/`
- Receive data as props; no direct data fetching

**Shared UI Components:**
- Purpose: Radix UI primitives wrapped by shadcn/ui conventions
- Location: `src/components/ui/`
- Contains: ~40 shadcn/ui components (Button, Card, Tabs, Select, Input, Pagination, etc.)

**Portfolio Landing Layer:**
- Purpose: Personal portfolio site wrapping the FTC analytics tool
- Location: `src/components/` (root level), `src/pages/Index.tsx`
- Contains: `Header.tsx`, `HeroSection.tsx`, `ArticlesSection.tsx`, `ProjectsSection.tsx`

## Data Flow

**Primary FTC Data Flow (Analytics/Industry tabs):**

1. App mounts → `FTCTabShell` calls `useFTCData()` → React Query fetches `GET /data/ftc-cases.json`
2. JSON is cached (`staleTime: Infinity`) and typed as `FTCDataPayload`
3. Tab components receive `data` as a prop — no additional fetches
4. All grouping, filtering, and aggregation runs client-side via `useMemo`

**Provisions Library Data Flow:**

1. `FTCProvisionsTab` mounts → `useProvisionsManifest()` fetches `GET /data/provisions/manifest.json`
2. User selects a topic → `useProvisionShard(filename)` fetches the relevant shard file (e.g., `GET /data/provisions/coppa-provisions.json`)
3. Shard is cached; `useProvisionSearch` builds a MiniSearch index over the shard's provisions
4. Filters (date range, company, remedy type) and search apply client-side via `useMemo`
5. Cross-topic search: `useAllProvisionsForSearch` fires `useQueries` to load all shards in parallel, deduplicates by composite ID (`case_id__provision_number`)

**Patterns Data Flow:**

1. `FTCPatternsTab` mounts → `usePatterns()` fetches `GET /data/ftc-patterns.json`
2. `PatternList` filters/sorts client-side via `useMemo`
3. `PatternRow` expands inline to show `PatternTimeline` and `VariantCard` components

**URL State Management:**

- `FTCTabShell`: reads `?tab=` param; clears all tab-specific params on tab switch
- `FTCProvisionsTab`: reads `?topic=`, `?q=`, `?scope=`; updates via `setSearchParams`
- `FTCIndustryTab`: reads `?sector=`, `?compare=`; encodes compare slugs as comma-separated list

## Key Abstractions

**Data Shard Model:**
- Purpose: Provisions are split by topic/practice-area/remedy-type into separate JSON files to enable lazy loading
- Examples: `public/data/provisions/coppa-provisions.json`, `public/data/provisions/pa-privacy-provisions.json`
- Pattern: Manifest-driven; UI loads `manifest.json` first to know what shards exist, then fetches by slug

**Pattern Groups:**
- Purpose: Cross-case detection of recurring provision language; grouped by normalized title with prefix-merge pass
- Examples: `public/data/ftc-patterns.json` → `PatternGroup[]` in `src/types/ftc.ts`
- Pattern: Pre-computed at build time; browser only renders and filters

**Enhanced Case Summary:**
- Purpose: `EnhancedFTCCaseSummary` extends `FTCCaseSummary` with classification tags injected during the classify step
- Location: `src/types/ftc.ts`
- Used in: Industry tab casts `data.cases as EnhancedFTCCaseSummary[]`

**Sector Taxonomy:**
- Purpose: Maps `IndustrySector` labels to URL slugs and subsector definitions for keyword-based subsector classification
- Location: `src/components/ftc/industry/industry-utils.ts`
- Pattern: Utility functions `getSectorBySlug()`, `getSectorLabel()`, `classifySubsector()`

## Entry Points

**Browser Entry:**
- Location: `src/main.tsx`
- Triggers: HTML loads `index.html` → Vite bundles `main.tsx` → `createRoot().render(<App />)`
- Responsibilities: Mount React tree, inject global CSS

**App Router:**
- Location: `src/App.tsx`
- Triggers: `BrowserRouter` + `Routes`
- Responsibilities: Provide `QueryClient`, `TooltipProvider`, `Toaster`; route `/` → `Index`, `/FTCAnalytics` → `FTCAnalytics`

**FTC Analytics Entry:**
- Location: `src/pages/FTCAnalytics.tsx`
- Triggers: Route `/FTCAnalytics`
- Responsibilities: Render `FTCHeader` + `FTCTabShell`; triggers data loading

**Portfolio Entry:**
- Location: `src/pages/Index.tsx`
- Triggers: Route `/`
- Responsibilities: Section-based rendering (home/articles/projects) driven by `activeSection` state

**Data Pipeline Entry Points:**
- `scripts/build-ftc-data.ts` — run via `npm run build:ftc-data`
- `scripts/classify-provisions.ts` — run via `npm run build:classify`
- `scripts/build-provisions.ts` — run via `npm run build:provisions`
- `scripts/build-patterns.ts` — run via `npm run build:patterns`

## Error Handling

**Strategy:** Early-return loading/error states at tab orchestrator level; sub-components assume data is available

**Patterns:**
- Each tab hook result checks `isLoading` / `error` and renders spinner or error message before passing data down
- React Query surfaces errors automatically; no custom error boundaries present
- Build scripts use `console.warn` for skippable items and `process.exit(1)` for fatal errors
- `writeJSONSafe()` in build scripts validates JSON round-trip before replacing output files

## Cross-Cutting Concerns

**Logging:** `console.warn` / `console.log` in build scripts only; no runtime logging in browser code

**Validation:** TypeScript type assertions at API boundaries; no runtime schema validation (no Zod in data fetch paths)

**Authentication:** None for FTC analytics; Supabase client configured in `src/integrations/supabase/client.ts` for unrelated Substack sync function, not used in the main analytics UI

---

*Architecture analysis: 2026-02-26*
