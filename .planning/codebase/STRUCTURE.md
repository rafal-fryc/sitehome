# Codebase Structure

**Analysis Date:** 2026-02-26

## Directory Layout

```
sitehome/
├── src/                         # All application source code
│   ├── main.tsx                 # React entry point
│   ├── App.tsx                  # Router and global providers
│   ├── index.css                # Global CSS and Tailwind base
│   ├── App.css                  # App-level styles
│   ├── vite-env.d.ts            # Vite type shims
│   ├── pages/                   # Route-level page components
│   ├── components/              # All UI components
│   │   ├── ftc/                 # FTC analytics feature components
│   │   │   ├── analytics/       # Analytics tab sub-components
│   │   │   ├── provisions/      # Provisions tab sub-components
│   │   │   ├── industry/        # Industry tab sub-components
│   │   │   └── patterns/        # Patterns tab sub-components
│   │   └── ui/                  # shadcn/ui primitive components
│   ├── hooks/                   # React Query data hooks and utilities
│   ├── types/                   # TypeScript domain type definitions
│   ├── constants/               # Classification rules and static lookups
│   ├── lib/                     # Shared utilities (cn helper)
│   └── integrations/
│       └── supabase/            # Supabase client and generated types
├── scripts/                     # Offline data pipeline scripts (Node/tsx)
├── public/                      # Static assets served as-is
│   └── data/                    # Pre-built JSON data files
│       ├── ftc-cases.json       # Aggregate case index
│       ├── ftc-patterns.json    # Cross-case pattern groups
│       ├── ftc-files/           # Individual classified case JSON files
│       └── provisions/          # Topic-sharded provision JSON files
├── supabase/                    # Supabase config (edge functions, migrations)
│   ├── functions/
│   │   └── sync-substack/       # Edge function for Substack sync
│   └── migrations/              # SQL migration files
├── dist/                        # Vite build output (gitignored)
├── .planning/                   # GSD planning documents (not shipped)
├── index.html                   # HTML entry point for Vite
├── vite.config.ts               # Vite config with @ alias
├── tailwind.config.ts           # Tailwind theme extensions
├── tsconfig.json                # TypeScript project config
├── tsconfig.app.json            # App-specific TS config
├── tsconfig.node.json           # Node scripts TS config
├── components.json              # shadcn/ui component config
├── eslint.config.js             # ESLint flat config
├── postcss.config.js            # PostCSS config
├── vercel.json                  # Vercel deployment rewrites
├── package.json                 # NPM scripts and dependencies
└── bun.lockb                    # Bun lockfile (npm also present)
```

## Directory Purposes

**`src/pages/`:**
- Purpose: Route-level page components; one file per route
- Contains: `Index.tsx` (portfolio home), `FTCAnalytics.tsx` (FTC tool), `NotFound.tsx` (404)
- Key files: `src/pages/FTCAnalytics.tsx`, `src/pages/Index.tsx`

**`src/components/ftc/`:**
- Purpose: All components specific to the FTC enforcement analytics feature
- Contains: Tab shells, tab orchestrators, and tab-level layout components
- Key files:
  - `src/components/ftc/FTCTabShell.tsx` — URL-driven tab switcher and top-level data gate
  - `src/components/ftc/FTCAnalyticsTab.tsx` — analytics tab layout
  - `src/components/ftc/FTCProvisionsTab.tsx` — provisions browser orchestrator
  - `src/components/ftc/FTCIndustryTab.tsx` — industry tab with URL-driven view switching
  - `src/components/ftc/FTCPatternsTab.tsx` — patterns tab
  - `src/components/ftc/FTCHeader.tsx` — page header with back link
  - `src/components/ftc/FTCOverviewStats.tsx` — summary stat cards
  - `src/components/ftc/FTCMissingCasesNotice.tsx` — data completeness disclaimer

**`src/components/ftc/analytics/`:**
- Purpose: Chart and visualization sub-components for the Analytics tab
- Contains: `AnalyticsSummary.tsx`, `EnforcementByYear.tsx`, `EnforcementByAdmin.tsx`, `TopicTrendLines.tsx`, `ViolationBreakdown.tsx`, `ProvisionAnalytics.tsx`, `ReferenceTable.tsx`
- Pattern: Each component receives `FTCDataPayload` as a prop and renders a self-contained chart section

**`src/components/ftc/provisions/`:**
- Purpose: Provisions library browser sub-components
- Contains: `TopicSidebar.tsx`, `ProvisionsLanding.tsx`, `ProvisionsContent.tsx`, `SearchResults.tsx`, `ProvisionCard.tsx`, `ProvisionFilterBar.tsx`, `FilterChips.tsx`, `CompanyAutocomplete.tsx`, `HighlightText.tsx`

**`src/components/ftc/industry/`:**
- Purpose: Industry/sector view sub-components
- Contains: `SectorGrid.tsx`, `SectorCard.tsx`, `SectorDetail.tsx`, `SectorCompare.tsx`, `SectorPatternCharts.tsx`, `CaseCard.tsx`, `CaseCardList.tsx`, `industry-utils.ts`
- Key file: `src/components/ftc/industry/industry-utils.ts` — sector taxonomy, slug/label converters, subsector classifier

**`src/components/ftc/patterns/`:**
- Purpose: Cross-case pattern browser sub-components
- Contains: `PatternList.tsx`, `PatternRow.tsx`, `PatternTimeline.tsx`, `TextDiff.tsx`, `VariantCard.tsx`

**`src/components/ui/`:**
- Purpose: shadcn/ui components — Radix UI primitives with Tailwind styling
- Contains: ~40 files; all are generated/managed by shadcn CLI
- Do not edit manually; regenerate via `npx shadcn@latest add [component]`

**`src/hooks/`:**
- Purpose: React Query fetch hooks and utility hooks
- Contains:
  - `use-ftc-data.ts` — fetches aggregate case data
  - `use-provisions.ts` — manifest and shard fetchers
  - `use-patterns.ts` — fetches patterns file
  - `use-provision-search.ts` — MiniSearch index builder for provision full-text search
  - `use-mobile.tsx` — responsive breakpoint detection
  - `use-toast.ts` — toast helper

**`src/types/`:**
- Purpose: All TypeScript interfaces and union types for the FTC domain
- Contains: `src/types/ftc.ts` — single file with all types

**`src/constants/`:**
- Purpose: Static data and classification logic used at both build time and runtime
- Contains: `src/constants/ftc.ts` — category rules, administration date ranges, remedy type options, `classifyCategories()`, `getAdministration()`

**`src/lib/`:**
- Purpose: Tiny shared utilities
- Contains: `src/lib/utils.ts` — `cn()` helper (clsx + tailwind-merge)

**`src/integrations/supabase/`:**
- Purpose: Supabase client and auto-generated database types
- Contains: `client.ts`, `types.ts`
- Note: Used by `supabase/functions/sync-substack/` edge function, not by FTC analytics

**`scripts/`:**
- Purpose: Offline Node.js data pipeline scripts run with `npx tsx`
- Contains:
  - `build-ftc-data.ts` — reads raw FTC JSON, deduplicates, classifies categories, outputs `public/data/ftc-cases.json` and copies to `public/data/ftc-files/`
  - `classify-provisions.ts` — uses Anthropic SDK to classify each case file's provisions with `statutory_topics`, `practice_areas`, `remedy_types`, `industry_sectors` tags; writes back to `public/data/ftc-files/`
  - `build-provisions.ts` — reads classified case files, shards provisions by topic/practice-area/remedy-type, writes to `public/data/provisions/`, generates `manifest.json`
  - `build-patterns.ts` — reads all statutory provision shards, groups by normalized title, prefix-merges small groups, writes `public/data/ftc-patterns.json`

**`public/data/`:**
- Purpose: Pre-built static JSON served directly by Vite dev server and Vercel in production
- Generated: Yes (by scripts above)
- Committed: Yes (data files are checked into git as static assets)
- Key files:
  - `public/data/ftc-cases.json`
  - `public/data/ftc-patterns.json`
  - `public/data/provisions/manifest.json`
  - `public/data/provisions/[topic]-provisions.json` (statutory shards)
  - `public/data/provisions/pa-[area]-provisions.json` (practice area shards)
  - `public/data/provisions/rt-[remedy]-provisions.json` (remedy type shards)
  - `public/data/ftc-files/[case-id].json` (individual case files)

**`supabase/`:**
- Purpose: Supabase project config; edge functions for Substack content sync
- Generated: Partially (migrations auto-generated by Supabase CLI)
- Committed: Yes

## Key File Locations

**Entry Points:**
- `src/main.tsx`: React DOM mount
- `src/App.tsx`: Router, providers, route definitions
- `index.html`: HTML shell with `<div id="root">`

**Configuration:**
- `vite.config.ts`: Vite config, `@` path alias pointing to `src/`
- `tailwind.config.ts`: Custom theme tokens (colors, fonts, etc.)
- `tsconfig.app.json`: TypeScript config for `src/`
- `tsconfig.node.json`: TypeScript config for `scripts/`
- `components.json`: shadcn/ui component registry config
- `vercel.json`: SPA fallback rewrite and proxy rules

**Core Domain Logic:**
- `src/types/ftc.ts`: All domain types
- `src/constants/ftc.ts`: Classification rules and lookups
- `src/components/ftc/industry/industry-utils.ts`: Sector taxonomy and classifiers

**Data Pipeline:**
- `scripts/build-ftc-data.ts`: Step 1 of data pipeline
- `scripts/classify-provisions.ts`: Step 2 (requires `ANTHROPIC_API_KEY` in `.env`)
- `scripts/build-provisions.ts`: Step 3
- `scripts/build-patterns.ts`: Step 4

## Naming Conventions

**Files:**
- Page components: `PascalCase.tsx` (e.g., `FTCAnalytics.tsx`, `Index.tsx`)
- Feature components: `PascalCase.tsx`, prefixed by domain (e.g., `FTCTabShell.tsx`, `SectorDetail.tsx`)
- Hook files: `use-kebab-case.ts` or `use-kebab-case.tsx` (e.g., `use-ftc-data.ts`, `use-mobile.tsx`)
- Utility/type files: `kebab-case.ts` (e.g., `utils.ts`, `industry-utils.ts`, `ftc.ts`)
- shadcn/ui components: `kebab-case.tsx` (e.g., `button.tsx`, `scroll-area.tsx`)
- Build scripts: `kebab-case.ts` (e.g., `build-ftc-data.ts`)

**Directories:**
- Feature sub-directories: `lowercase` (e.g., `analytics/`, `provisions/`, `industry/`, `patterns/`)
- Integration directories: `lowercase` (e.g., `supabase/`)

**Components:**
- Named exports for page-level and tab-level components (`export default function FTCTabShell`)
- Named exports for sub-components (`export default function PatternList`)
- `interface Props` for component prop types (local to file, not exported unless needed cross-file)

**Types:**
- Interfaces: `PascalCase` with descriptive name (e.g., `ProvisionRecord`, `PatternGroup`)
- Union types: `PascalCase` (e.g., `StatutoryTopic`, `GroupingMode`)

## Where to Add New Code

**New FTC tab:**
- Tab component: `src/components/ftc/FTC[Name]Tab.tsx`
- Register in `FTCTabShell.tsx` — add to `VALID_TABS` union and add `TabsTrigger` + `TabsContent`
- Data hook if needed: `src/hooks/use-[name].ts`
- Types if needed: append to `src/types/ftc.ts`

**New analytics chart/section:**
- Component: `src/components/ftc/analytics/[Name].tsx`
- Register in `FTCAnalyticsTab.tsx` — add to `ANALYTICS_SECTIONS` array and render in the content column

**New provisions sub-component:**
- Component: `src/components/ftc/provisions/[Name].tsx`
- Import in `FTCProvisionsTab.tsx` or `ProvisionsContent.tsx`

**New industry sub-component:**
- Component: `src/components/ftc/industry/[Name].tsx`

**New patterns sub-component:**
- Component: `src/components/ftc/patterns/[Name].tsx`

**New data pipeline script:**
- Script: `scripts/[name].ts`
- Add npm script in `package.json`; use `tsconfig.node.json` path resolution
- Inline types instead of importing from `src/types/` (tsx runner doesn't resolve `@/` aliases)

**New static data file:**
- Place in `public/data/` or a subdirectory thereof
- Fetch in a new hook in `src/hooks/` using React Query with `staleTime: Infinity`

**New shadcn/ui component:**
- Add via: `npx shadcn@latest add [component-name]`
- Output lands in `src/components/ui/`

**New shared utility:**
- Add to `src/lib/utils.ts` if it is a generic helper
- Add to `src/constants/ftc.ts` if it is FTC domain logic (classification rules, lookups)

**New page/route:**
- Page: `src/pages/[Name].tsx`
- Register route in `src/App.tsx` inside `<Routes>`

## Special Directories

**`public/data/`:**
- Purpose: Pre-built JSON data files consumed by the browser at runtime
- Generated: Yes, by `npm run build:data`
- Committed: Yes — treated as static assets since there is no backend API

**`dist/`:**
- Purpose: Vite production build output
- Generated: Yes, by `npm run build`
- Committed: No (gitignored)

**`.planning/`:**
- Purpose: GSD planning documents, architecture notes, phase plans
- Generated: No (hand-edited and AI-written)
- Committed: Yes (in git)

**`src/components/ui/`:**
- Purpose: shadcn/ui component library
- Generated: Yes (shadcn CLI outputs here)
- Committed: Yes — these are vendor-copied files, not a package dependency

---

*Structure analysis: 2026-02-26*
