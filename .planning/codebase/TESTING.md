# Testing Patterns

**Analysis Date:** 2026-02-26

## Test Framework

**Runner:** None configured.

No test framework is installed. `package.json` contains no test dependencies (no Jest, Vitest, Playwright, Cypress, or Testing Library packages). There is no `jest.config.*`, `vitest.config.*`, or `playwright.config.*` file present.

**Test Commands:** None defined in `package.json` scripts.

```bash
# No test commands available in this project
npm run dev        # Development server (port 8080)
npm run build      # Production build
npm run lint       # ESLint only
npm run build:data # Data pipeline scripts
```

## Test File Organization

**No test files exist** in the codebase. A search for `*.test.*` and `*.spec.*` files returns zero results.

## Current State

This is a frontend data-visualization application with **zero automated test coverage**. There is no test infrastructure of any kind.

The codebase relies entirely on:
- Manual visual verification during development
- TypeScript type checking (`tsc --noEmit` via Vite build)
- ESLint static analysis (`npm run lint`)
- Runtime validation through the browser during development

## Coverage

**Requirements:** None enforced.

**Coverage tooling:** Not installed.

## What Exists Instead of Tests

**TypeScript as a safety net:**
- All data shapes defined as interfaces in `src/types/ftc.ts` — catches shape mismatches at compile time
- Strict-mode is OFF (`"strict": false` in `tsconfig.app.json`) — type checking is looser than it could be
- `noImplicitAny: false` — implicit any is allowed, reducing type safety

**Data pipeline validation:**
- Build scripts in `scripts/` (`build-ftc-data.ts`, `build-patterns.ts`, `build-provisions.ts`, `classify-provisions.ts`) produce output JSON files that are manually inspected
- No assertion library or schema validation (e.g., Zod) used in build scripts
- Zod is installed as a dependency but not actively used for runtime validation of API responses

**React Query for data integrity:**
- All `fetch()` calls check `res.ok` and throw on failure — surfaces broken data at runtime
- `staleTime: Infinity` on all queries means data is fetched once and not re-validated

## Recommendations for Adding Tests

If tests are added, this project's stack (Vite + React + TypeScript) pairs naturally with:

**Unit/Integration tests:**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

Config location: `vitest.config.ts` (can extend `vite.config.ts`)

**Vitest test structure to follow for this codebase:**

```typescript
// src/components/ftc/patterns/__tests__/PatternList.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PatternList from "@/components/ftc/patterns/PatternList";
import type { PatternGroup } from "@/types/ftc";

const mockPatterns: PatternGroup[] = [
  {
    id: "test-pattern",
    name: "Test Pattern",
    is_structural: false,
    case_count: 3,
    variant_count: 3,
    year_range: [2020, 2023],
    most_recent_year: 2023,
    enforcement_topics: ["Privacy"],
    practice_areas: ["Privacy"],
    variants: [],
  },
];

describe("PatternList", () => {
  it("renders pattern names", () => {
    render(<PatternList patterns={mockPatterns} />);
    expect(screen.getByText("Test Pattern")).toBeInTheDocument();
  });
});
```

**Highest-value test targets (pure logic functions):**
- `src/constants/ftc.ts` — `classifyCategories()` and `getAdministration()` are pure functions with no dependencies; ideal for unit tests
- `src/components/ftc/industry/industry-utils.ts` — `classifySubsector()`, `getSectorSlug()`, `getTopTopics()` are pure utility functions
- `src/components/ftc/provisions/HighlightText.tsx` — `escapeRegex()` is a standalone pure function

**E2E tests:**
- Not applicable currently; no framework installed
- Playwright would be the natural choice given Vite/React stack

## Test Types

**Unit Tests:** Not implemented. Highest-value targets are pure utility functions in `src/constants/ftc.ts` and `src/components/ftc/industry/industry-utils.ts`.

**Integration Tests:** Not implemented. React Query hooks like `useFTCData()`, `useProvisionShard()`, and `usePatterns()` in `src/hooks/` would benefit from integration tests using MSW (Mock Service Worker) to mock `fetch()`.

**E2E Tests:** Not implemented.

**Visual Regression:** Not implemented.

---

*Testing analysis: 2026-02-26*
