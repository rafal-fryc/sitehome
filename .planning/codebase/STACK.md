# Technology Stack

**Analysis Date:** 2026-02-26

## Languages

**Primary:**
- TypeScript 5.8 - All frontend source code in `src/`, build scripts in `scripts/`

**Secondary:**
- TSX (React JSX) - Component files throughout `src/components/`, `src/pages/`
- SQL (PostgreSQL) - Database migrations in `supabase/migrations/`
- Deno TypeScript - Edge functions in `supabase/functions/`

## Runtime

**Environment:**
- Node.js 22.21.0 - Build scripts, dev server, `scripts/*.ts` run via `npx tsx`

**Package Manager:**
- npm 10.9.4
- Lockfiles: `package-lock.json` (npm) and `bun.lockb` (bun lockfile present but npm is primary)

## Frameworks

**Core:**
- React 18.3 - UI framework, SPA architecture, entry point `src/main.tsx`
- React Router DOM 6.30 - Client-side routing, configured in `src/App.tsx`

**UI Component System:**
- shadcn/ui - Component library over Radix UI primitives, config at `components.json`
- Radix UI - Headless primitives (accordion, dialog, dropdown, tabs, tooltip, etc.) — full suite installed per `package.json`
- Tailwind CSS 3.4 - Utility-first styling, config at `tailwind.config.ts`
- tailwindcss-animate - Animation plugin for Tailwind, used in accordion keyframes

**Data Fetching:**
- TanStack React Query 5.83 - Server state, async data fetching via `useQuery` in `src/hooks/`

**Charts & Visualization:**
- Recharts 2.15 - Used across `src/components/ftc/analytics/` (bar/line charts for FTC data)

**Forms:**
- React Hook Form 7.61 - Form state management
- Zod 3.25 - Schema validation, used with `@hookform/resolvers`

**Build/Dev:**
- Vite 5.4 - Dev server and bundler, config at `vite.config.ts`, dev port 8080
- `@vitejs/plugin-react-swc` 3.11 - SWC-powered React transform (faster than Babel)
- tsx - TypeScript script runner for `scripts/*.ts` data build pipeline

## Key Dependencies

**Critical:**
- `@supabase/supabase-js` 2.55 - Database client and edge function invocation, used in `src/integrations/supabase/client.ts` and `src/components/ArticlesSection.tsx`
- `minisearch` 7.2 - Full-text client-side search for FTC provisions, used in `src/hooks/use-provision-search.ts`
- `diff` 8.0 - Text diffing library, likely for comparing FTC order provision text

**Infrastructure:**
- `lucide-react` 0.462 - Icon set used throughout UI components
- `date-fns` 3.6 - Date formatting and manipulation
- `next-themes` 0.3 - Dark/light theme support via CSS class toggling
- `sonner` 1.7 - Toast notifications (supplementing Radix toast)
- `class-variance-authority` 0.7 - Variant-based component styling
- `clsx` + `tailwind-merge` - Class name utilities, in `src/lib/utils.ts`
- `cmdk` 1.1 - Command palette component
- `react-resizable-panels` 2.1 - Resizable split-pane layouts
- `embla-carousel-react` 8.6 - Carousel/slider component
- `vaul` 0.9 - Drawer component

**Dev-Only:**
- `@anthropic-ai/sdk` 0.78 - Anthropic Claude API client used only in `scripts/classify-provisions.ts` (data pipeline script, not shipped to browser)
- `lovable-tagger` 1.1 - Vite plugin for Lovable platform component tagging (development only)
- `@tailwindcss/typography` 0.5 - Prose styling plugin

## Configuration

**Environment:**
- `.env` file present at project root (contents not read)
- Required env vars for scripts: `ANTHROPIC_API_KEY` (for `scripts/classify-provisions.ts`)
- Supabase edge functions use: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (set in Supabase dashboard)
- Frontend Supabase client uses hardcoded public anon key and URL in `src/integrations/supabase/client.ts`

**TypeScript:**
- Two tsconfig targets: `tsconfig.app.json` (browser, ES2020, bundler resolution) and `tsconfig.node.json`
- Strict mode disabled (`strict: false`, `noImplicitAny: false`) — permissive settings
- Path alias `@/*` → `./src/*` configured in both tsconfig and Vite

**Build:**
- `vite.config.ts` — main build config
- `tailwind.config.ts` — custom design tokens (EB Garamond font, custom color palette: gold, cream, rule)
- `postcss.config.js` — PostCSS with tailwindcss and autoprefixer
- `components.json` — shadcn/ui config (style: default, baseColor: slate, cssVariables: true)

## Data Pipeline

**Build Scripts (not part of browser bundle):**
- `scripts/build-ftc-data.ts` — reads FTC JSON case files, outputs `public/data/ftc-cases.json`
- `scripts/build-provisions.ts` — generates sharded provisions data
- `scripts/build-patterns.ts` — generates FTC patterns data
- `scripts/classify-provisions.ts` — AI-powered classification using Claude Sonnet via `@anthropic-ai/sdk`
- Data source: `C:/Users/rafst/Documents/projectas/FTC/output_v2` (hardcoded local path)
- Output: `public/data/` (served as static JSON, fetched at runtime by TanStack Query)

## Platform Requirements

**Development:**
- Node.js 22+
- npm 10+
- `ANTHROPIC_API_KEY` env var required for classification scripts only

**Production:**
- Vercel (SPA hosting, config at `vercel.json`)
- Supabase project: `tltdghkyunvhayvxtudq`
- Static JSON data files served from `public/data/` via Vercel CDN

---

*Stack analysis: 2026-02-26*
