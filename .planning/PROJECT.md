# FTC Enforcement Provisions Library

## What This Is

A comprehensive, topic-first research tool for exploring FTC enforcement actions and their substantive provisions. Built for legal practitioners who need to quickly find what the FTC has required companies to do across privacy, data security, COPPA, FCRA, and other regulatory areas — with exact citations to consent order language. Replaces the existing FTC Analytics dashboard on the sitehome portfolio site.

## Core Value

A legal practitioner can find every FTC consent order provision relevant to a specific topic (e.g., COPPA, data security) across 20+ years of enforcement, with exact paragraph-level citations and links to source documents, in under 30 seconds.

## Requirements

### Validated

- ✓ FTC case data pipeline (293 JSON files with structured complaint/order/provision data) — existing
- ✓ Case-level keyword-based topic classification (9 categories via `constants/ftc.ts`) — existing
- ✓ FTC Analytics page with overview stats and violation type breakdown — existing
- ✓ Grouping and bar charts by year, administration, and category — existing
- ✓ Group detail view showing cases within each grouping — existing
- ✓ Administration timeline mapping (Clinton through Trump 2nd term) — existing
- ✓ URL-driven state via search params — existing
- ✓ Law-library visual aesthetic with EB Garamond and cream/gold/dark-green palette — existing

### Active

**Data Classification Pipeline**
- [ ] Provision-level topic tagging — classify each provision in each consent order by substantive topic
- [ ] Case-level topic classification upgrade — replace keyword matching with proper classification derived from legal authority, complaint text, and order provisions
- [ ] Statutory topic taxonomy: COPPA, FCRA, GLBA, Health Breach Notification Rule, CAN-SPAM, TCPA
- [ ] Practice area taxonomy: Privacy, Data Security, Deceptive Design / Dark Patterns, AI / Automated Decision-Making, Surveillance
- [ ] Remedy type taxonomy: Monetary Penalties, Algorithmic Destruction, Data Deletion, Comprehensive Security Programs, Biometric Bans, Record-keeping, Compliance Monitoring, Third-Party Assessments

**Provisions Library (Topic-First Browsing)**
- [ ] Topic landing page — select a substantive topic and see every relevant provision across all consent orders
- [ ] Exact citations — paragraph-level references (e.g., "Part II.A.3") plus links to FTC.gov source documents
- [ ] Provision detail cards showing quoted order language, case context, and date
- [ ] Filtering and sorting within topic views (by date, company, remedy type)

**Analytics & Analysis**
- [ ] Interactive charts showing enforcement trends by year and presidential administration
- [ ] Topic-based analysis — how enforcement focus shifts across topics over time
- [ ] Detailed reference tables with counts and breakdowns for drill-down
- [ ] Combined chart + table views (charts for overview, tables for detail)

**Cross-Case Patterns**
- [ ] Surface reused provision language across consent orders (e.g., how "comprehensive security program" boilerplate evolves over time)
- [ ] Pattern timeline showing language evolution across enforcement eras

**Company & Industry View**
- [ ] Browse enforcement actions by industry sector
- [ ] See how enforcement patterns vary across tech, health, retail, financial services, etc.

### Out of Scope

- Full-text search of consent order documents — complex search infrastructure, defer to v2
- Comparison tool for side-by-side order viewing — useful but not core to provisions library
- User accounts or saved searches — this is a public reference tool, not a SaaS product
- Mobile app — web-first, responsive design sufficient
- Real-time FTC data sync — data pipeline runs offline, manual updates acceptable
- Commissioner voting records and dissent tracking — interesting but adds significant data complexity

## Context

**Existing codebase:** React 18 + Vite 5 + TypeScript SPA deployed to Vercel. Uses shadcn/ui + Tailwind CSS with a law-library aesthetic. Current FTC Analytics page has basic grouping/charting with Recharts.

**Data:** 293 structured JSON files in `public/data/ftc-files/` with rich case_info, complaint (factual_background, counts), and order (definitions, provisions with categories/requirements/quoted_text) fields. An offline build script (`scripts/build-ftc-data.ts`) aggregates these into `public/data/ftc-cases.json`.

**Current classification:** Keyword-based topic matching in `src/constants/ftc.ts` against count titles, legal authority, and factual background. Works at case level only. Provision categories in JSON are structural (prohibition, affirmative_obligation, assessment, etc.) not substantive.

**Key insight:** The provision-level data already exists in the JSON files with quoted text and paragraph references. The main work is adding substantive topic tags, building the browsing/library UI, and deepening the analytics.

## Constraints

- **Tech Stack**: Must use existing React/Vite/TypeScript/Tailwind/shadcn stack — no framework migrations
- **Data Source**: Static JSON files in `public/data/` — no backend database for FTC data (Supabase is only for articles)
- **Build Pipeline**: Topic classification must run offline at build time via the data pipeline script, not at runtime
- **Citation Accuracy**: Provision citations must reference exact paragraph numbers and include working FTC.gov URLs — no approximations
- **Visual Consistency**: Must maintain the law-library aesthetic (EB Garamond, cream/gold/dark-green palette)
- **Performance**: Must handle 293 cases with potentially thousands of provisions in-browser without lag

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Replace current FTC Analytics page rather than add alongside | User wants comprehensive replacement, not feature-add | — Pending |
| Topic classification at build time in data pipeline | Keeps runtime fast, classification is deterministic | — Pending |
| Three-level taxonomy (statutory + practice area + remedy type) | Covers legal practitioner needs from multiple angles | — Pending |
| Static JSON data model (no database) | Existing pattern works, 293 cases is manageable client-side | — Pending |

---
*Last updated: 2026-02-24 after initialization*
