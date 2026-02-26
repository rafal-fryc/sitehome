# Coding Conventions

**Analysis Date:** 2026-02-26

## Naming Patterns

**Files:**
- React components: PascalCase `.tsx` — `FTCCaseTable.tsx`, `PatternRow.tsx`, `VariantCard.tsx`
- Hooks: kebab-case with `use-` prefix — `use-ftc-data.ts`, `use-patterns.ts`, `use-provision-search.ts`
- Utility/constant modules: kebab-case — `industry-utils.ts`
- Type definition files: singular noun — `ftc.ts` (in `src/types/`)
- Constants files: singular noun — `ftc.ts` (in `src/constants/`)
- Pages: PascalCase — `FTCAnalytics.tsx`, `Index.tsx`, `NotFound.tsx`

**Functions:**
- React components: PascalCase default exports — `export default function FTCPatternsTab()`
- Hook exports: camelCase with `use` prefix — `export function useFTCData()`, `export function usePatterns()`
- Utility functions: camelCase — `classifyCategories()`, `getSectorBySlug()`, `getTopTopics()`
- Helper functions inside components: camelCase — `toggleSort()`, `violationBadge()`, `handleSearchInput()`
- Internal sub-components: PascalCase defined locally — `function SortIcon({ col }: { col: SortKey })`

**Variables:**
- Regular variables: camelCase — `filteredCases`, `searchQuery`, `topicFilter`
- Constants (module-level arrays/objects): SCREAMING_SNAKE_CASE — `ANALYTICS_SECTIONS`, `VALID_TABS`, `SORT_OPTIONS`, `CATEGORY_RULES`
- Type union literal constants: SCREAMING_SNAKE_CASE — `REMEDY_TYPE_OPTIONS`, `DATE_PRESETS`, `ADMINISTRATIONS`

**Types and Interfaces:**
- Types: PascalCase — `GroupingMode`, `SortBy`, `SortKey`, `FTCTab`
- Interfaces: PascalCase — `FTCCaseSummary`, `PatternGroup`, `ProvisionRecord`, `Props`
- Component prop interfaces: named `Props` — `interface Props { ... }` (local to the file)
- Type aliases for string unions: PascalCase — `type SortBy = "recency" | "cases" | "name"`

## Code Style

**Formatting:**
- No Prettier config file present — formatting is maintained manually
- 2-space indentation throughout
- Double quotes for JSX attributes and string values
- Trailing commas in multi-line arrays/objects

**Linting:**
- ESLint with `typescript-eslint` — config at `eslint.config.js`
- React Hooks plugin enforced (`eslint-plugin-react-hooks`)
- `@typescript-eslint/no-unused-vars`: turned OFF
- `react-refresh/only-export-components`: warn (allows constant exports)
- TypeScript `strict: false`, `noImplicitAny: false`, `noUnusedLocals: false`

## Import Organization

**Order (observed pattern):**
1. React/framework imports — `import { useState, useMemo } from "react"`
2. Third-party libraries — `import { useQuery } from "@tanstack/react-query"`
3. Internal path-alias imports (`@/`) — types first, then hooks, then components, then utils
4. Relative imports — `import FTCAnalysisPanel from "./FTCAnalysisPanel"`

**Path Aliases:**
- `@/` maps to `src/` — configured in `vite.config.ts` and `tsconfig.app.json`
- All cross-directory imports use `@/` alias: `import type { FTCDataPayload } from "@/types/ftc"`
- Same-directory imports use relative `./` — `import PatternTimeline from "./PatternTimeline"`

**Type-only imports:**
- Use `import type` for type-only imports consistently — `import type { PatternGroup } from "@/types/ftc"`

## Component Props Pattern

All non-trivial components define a local `interface Props` at the top of the file, then destructure directly in the function signature:

```typescript
interface Props {
  pattern: PatternGroup;
  isExpanded: boolean;
  onToggle: () => void;
}

export default function PatternRow({ pattern, isExpanded, onToggle }: Props) {
```

Callback props are named with `on` prefix — `onToggle`, `onSelect`, `onSearchChange`, `onSort`.

## Error Handling

**Data-fetch components — loading/error guard pattern:**
All components that use React Query follow this exact structure before returning the main UI:

```typescript
if (isLoading) {
  return (
    <div className="flex items-center justify-center py-24">
      <p className="text-muted-foreground font-garamond">Loading...</p>
    </div>
  );
}

if (isError || !data) {
  return (
    <div className="flex items-center justify-center py-24">
      <p className="text-destructive font-garamond">Failed to load. Please try again.</p>
    </div>
  );
}
```

**Fetch errors in hooks:** throw `new Error(...)` for non-ok responses — callers rely on React Query's `isError` state:

```typescript
queryFn: async () => {
  const res = await fetch("/data/ftc-cases.json");
  if (!res.ok) throw new Error("Failed to load FTC data");
  return res.json();
},
```

**No try/catch** blocks used in components or hooks — all async error handling delegated to React Query's error boundary mechanism.

## State Management

- `useState` for local UI state (expanded rows, filter values, sort direction)
- `useMemo` extensively for derived/filtered/sorted data — avoids redundant computation
- `useCallback` for stable handler references when passed as props — especially in components using `useSearchParams`
- URL search params (`useSearchParams` from `react-router-dom`) used as the state layer for cross-component navigation state (selected topic, tab, search query)
- No global state store — all state is local or URL-encoded

## Tailwind / Styling

**Class utility:** `cn()` from `src/lib/utils.ts` (wraps `clsx` + `tailwind-merge`) used for conditional class composition:

```typescript
className={cn(
  "inline-flex items-center gap-1.5 border border-rule px-3 py-1.5",
  selectedCompany && "bg-primary/10 border-primary/30"
)}
```

**Design tokens used consistently:**
- `font-garamond` — applied to all body/display text throughout the app
- `border-rule` — custom border color for dividers and card borders
- `text-muted-foreground` — secondary/supporting text
- `bg-cream` — card background color
- `text-gold`, `hover:text-gold-dark` — accent/link color
- `text-primary` — headings and prominent labels

**shadcn/ui components** used for all interactive UI elements (Button, Badge, Tabs, Select, Collapsible, Popover, Table, Input, Checkbox). Raw `<button>` elements used for custom-styled controls that don't fit shadcn patterns.

**CVA (class-variance-authority)** used in shadcn/ui components for variant-based styling — `src/components/ui/button.tsx` is the canonical example.

## Data Constants Pattern

Module-level typed arrays with `as const` for immutable option sets:

```typescript
export const DATE_PRESETS = [
  { label: "Last 5 years", start: "2021-01-01", end: "2026-12-31" },
] as const;
```

Keyword-matching taxonomies defined as typed arrays of objects — see `CATEGORY_RULES` in `src/constants/ftc.ts` and `SECTOR_TAXONOMY` in `src/components/ftc/industry/industry-utils.ts`.

## Comments

**When to Comment:**
- JSDoc-style block comments on exported utility functions (especially non-obvious ones) — `industry-utils.ts` uses this pattern consistently
- Inline comments for non-obvious logic or workarounds: `// Add documents with composite IDs`
- Section comments in JSX to label groups of elements: `{/* Header */}`, `{/* Controls row */}`
- Phase/origin comments on types: `// Phase 1: Data Pipeline — Classification taxonomy types`

**No JSDoc on React components** — props are typed via the `interface Props` pattern and are self-documenting.

## Module Design

**Exports:**
- Components: single default export per file
- Hooks: named exports (one or more per file, grouped logically — e.g., `use-provisions.ts` exports both `useProvisionsManifest` and `useProvisionShard`)
- Constants/utilities: named exports from module files
- Types: named exports from `src/types/ftc.ts`

**No barrel files** (`index.ts` re-exports) — all imports reference specific file paths directly.

---

*Convention analysis: 2026-02-26*
