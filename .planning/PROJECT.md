# FTC Enforcement Provisions Library

## What This Is

A comprehensive, topic-first research tool for exploring FTC enforcement actions and their substantive provisions. Legal practitioners can browse 2,783 provisions across 293 consent orders by statutory topic, practice area, or remedy type — with verbatim order language, exact paragraph-level citations, and source links. Includes enforcement trend analytics, industry sector browsing with cross-sector comparison, and 126 cross-case provision language patterns with chronological evolution timelines.

## Core Value

A legal practitioner can find every FTC consent order provision relevant to a specific topic (e.g., COPPA, data security) across 20+ years of enforcement, with exact paragraph-level citations and links to source documents, in under 30 seconds.

## Requirements

### Validated

- ✓ Provision-level topic classification (statutory, practice area, remedy type) via offline build pipeline — v1.0
- ✓ Industry sector classification inferred from company business descriptions — v1.0
- ✓ Topic-sharded provision JSON with verbatim text, violation type, and manifest — v1.0
- ✓ Cross-case pattern detection pipeline producing 126 pattern groups — v1.0
- ✓ 4-tab page architecture (Analytics, Provisions, Patterns, Industries) with URL-driven state — v1.0
- ✓ Analytics dashboard with enforcement trends by year, administration, topic, violation type, and provisions — v1.0
- ✓ Topic-first provisions library with verbatim order text, citations, and FTC.gov source links — v1.0
- ✓ Sticky filter bar with date presets, company autocomplete, remedy type multi-select, and sort — v1.0
- ✓ Full-text search (MiniSearch) with topic/all-topics scope toggle and match highlighting — v1.0
- ✓ Industry sector browsing with 8-sector taxonomy, pattern charts, and side-by-side comparison — v1.0
- ✓ Cross-case pattern browser with chronological timelines, variant cards, and word-level diff — v1.0
- ✓ Law-library aesthetic (EB Garamond, cream/gold/dark-green palette) across all surfaces — v1.0

### Active

- [ ] Full-text search across consent order documents (not just provisions)
- [ ] Saved searches and bookmarked provisions
- [ ] Side-by-side consent order comparison tool
- [ ] Fuzzy text similarity for provision language evolution (beyond exact title matching)
- [ ] Automatic detection of novel provision language not seen in prior orders
- [ ] Commissioner voting records and dissent tracking per case
- [ ] Commissioner-level enforcement trend analysis

### Out of Scope

- User accounts — this is a public reference tool, not a SaaS product
- Mobile native app — web-first, responsive design sufficient
- Real-time FTC data sync — data pipeline runs offline, manual updates acceptable
- Backend database for FTC data — static JSON pattern proven sufficient for 293 cases
- Server-side rendering — SPA architecture adequate for this dataset size
- PDF generation / export — users can print/copy citations

## Context

**Shipped v1.0** with React 18 + Vite 5 + TypeScript SPA deployed to Vercel. Uses shadcn/ui + Tailwind CSS + Recharts. 70 commits, 426 files, ~305K lines added over 2 days.

**Data pipeline:** Offline build scripts (`build-ftc-data.ts`, `build-provisions.ts`, `build-patterns.ts`) produce static JSON artifacts. Classification by Claude Code agents (Opus 4.6) at build time. 15 topic-sharded provision files, manifest.json, ftc-patterns.json (4.0 MB, 126 patterns).

**Key libraries added in v1.0:** MiniSearch (full-text search), jsdiff (word-level diff), cmdk (company autocomplete).

## Constraints

- **Tech Stack**: React/Vite/TypeScript/Tailwind/shadcn — no framework migrations
- **Data Source**: Static JSON files in `public/data/` — no backend database
- **Build Pipeline**: Classification runs offline at build time, not at runtime
- **Citation Accuracy**: Paragraph-level references with working FTC.gov URLs
- **Visual Consistency**: Law-library aesthetic (EB Garamond, cream/gold/dark-green)
- **Performance**: Handles 293 cases and 2,783 provisions in-browser without lag

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Replace FTC Analytics page entirely | Comprehensive replacement vs feature-add | ✓ Good — cleaner architecture |
| Classification at build time in pipeline | Runtime fast, classification deterministic | ✓ Good — no browser classification |
| Three-level taxonomy (statutory + practice area + remedy type) | Multiple browsing angles for practitioners | ✓ Good — 25 topics across 3 categories |
| Static JSON data model (no database) | 293 cases manageable client-side | ✓ Good — pattern proven at scale |
| Claude Code agents for classification | API key unavailable; agents classify directly | ✓ Good — better quality than rule-based |
| Topic-sharded provision files | Full flat file too large (~10 MB) | ✓ Good — fast per-topic loading |
| MiniSearch for client-side search | No server needed; prefix + fuzzy matching | ✓ Good — instant search UX |
| Native overflow-y-auto over ScrollArea | ScrollArea conflicts with CSS sticky | ✓ Good — sidebar scrolls independently |
| Pattern names from most common title variant | No curated mapping needed | ✓ Good — minimal maintenance |
| Structural classification via category majority vote | Data-driven, no manual curation | ✓ Good — 43 structural / 83 substantive |

---
*Last updated: 2026-02-25 after v1.0 milestone*
