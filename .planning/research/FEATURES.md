# Feature Landscape

**Domain:** Legal enforcement database / regulatory provisions library
**Product:** FTC Enforcement Provisions Library
**Researched:** 2026-02-24
**Overall confidence:** HIGH (domain grounded in known legal research tool conventions and direct examination of existing codebase and data)

---

## What Already Exists (Do Not Rebuild)

Before categorizing features to build, these are already working in the current FTC Analytics page:

| Feature | Status |
|---------|--------|
| Case-level grouping by year, administration, topic category | Done |
| Bar chart + donut chart visualizations | Done |
| Group detail view with case list | Done |
| URL-driven state (mode + group params) | Done |
| Overview stats (total cases, violation breakdown) | Done |
| Law library aesthetic | Done |
| Working FTC.gov source links per case | Done |
| Keyword-based case-level topic classification | Done (to be replaced) |

The milestone builds on and replaces this — it does NOT start from scratch.

---

## Table Stakes

Features users expect when they arrive at a legal enforcement database. Missing = product feels incomplete or unprofessional.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Topic-first browsing | Primary mental model for legal research: "find everything the FTC has done on X topic" — not "browse by company" | Medium | Core differentiating architecture vs current analytics-first view |
| Exact paragraph-level citations | Legal practitioners cannot use uncited sources; "Part II.A.3" matters as much as the substance | Low (data exists) | Paragraph refs already in JSON `source_paragraph` and provision numbering fields |
| Quoted order language, verbatim | Practitioners quote consent orders directly in briefs/memos; paraphrases are useless | Low (data exists) | `quoted_text` field already present in requirements objects |
| Working links to FTC.gov source documents | Verification requirement for any legal use; FTC.gov is the authoritative source | Low (data exists) | `ftc_url` exists per case already |
| Case metadata with each provision | Who (company), when (date), what authority invoked — context that makes a provision usable | Low (data exists) | Case date, company name, legal authority all present |
| Filtering within topic views | Finding relevant provisions in a topic set of 50+ requires filtering by date or company | Medium | Date range, company name, remedy type filters |
| Sorting within topic views | Most recent first vs oldest first — two different research needs (current practice vs historical context) | Low | Date sort ascending/descending |
| Visible provision categories | Structural type (prohibition, affirmative obligation, assessment) helps practitioners scan quickly | Low | Category field already exists on provisions |
| Case count / provision count per topic | Tells practitioners how settled or sparse the enforcement record is on a topic | Low | Aggregation at build time |
| Print/copy-friendly output | Legal research always ends up in a document; practitioners will copy-paste or print | Low-Medium | Clean layout, no layout-breaking elements in provision cards |

---

## Differentiators

Features that set this tool apart from the FTC's own case database and generic legal databases like Westlaw/LexisNexis.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Three-axis taxonomy (statutory + practice area + remedy type) | No public FTC tool offers provision-level tagging across all three axes simultaneously. Practitioners can ask "show me COPPA data deletion requirements specifically" | High (classification build work) | Taxonomy must be built and applied in data pipeline |
| Remedy type as a first-class filter | Practitioners building compliance programs specifically need "what does a comprehensive security program provision look like across cases" — no existing public tool does this at provision level | Medium | Requires remedy taxonomy + classification in build pipeline |
| Enforcement trend charts by topic | Shows how FTC focus has shifted within a topic (e.g., how data security requirements became more specific 2017–2024) | Medium | Requires provision-level date data aggregated by topic |
| Language evolution tracking | Shows how "comprehensive security program" boilerplate changed across enforcement eras — uniquely valuable for understanding FTC's current expectations | High | Cross-case provision text comparison; detect near-duplicate language |
| Administration-era context on provisions | Annotates whether a provision was from an aggressive or restrained enforcement era, giving practitioners policy context | Medium | Administration data already exists; needs surface in provision UI |
| Topic coverage summary ("what the FTC requires") | For each topic, a synthesized summary of what FTC consent orders consistently require — distilled from the provisions themselves | High | LLM-generated or manually authored; not strictly from structured data |
| Industry sector drill-down | Enforcement patterns differ significantly between health, fintech, kids apps, retail — segmenting by industry makes the tool more actionable | High | Requires industry classification in build pipeline; not currently present |
| Penalty / monetary remedy tracking | Visible monetary penalty amounts per case in context with topic — helps practitioners communicate regulatory financial exposure to clients | Medium | Penalty amount data needs to be added to or extracted from case JSON |

---

## Anti-Features

Features to deliberately NOT build for this milestone. Explicitly scoping out is as important as scoping in.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Full-text search across all order language | Requires search index infrastructure (Fuse.js is possible but results are poor for legal text; Algolia/Meilisearch require a backend) — far exceeds scope, and topic-first browsing covers the primary use case | Use topic tagging as the discovery mechanism; full-text is v2 |
| Side-by-side order comparison tool | Useful but is a separate product surface that requires significant UI investment and doesn't fit the topic-first mental model | Defer to v2 after provisions library proves value |
| User accounts / saved searches / collections | This is a public reference tool, not a SaaS product; accounts add auth complexity, privacy obligations, and maintenance burden | Keep it stateless; practitioners can bookmark URLs since state is URL-driven |
| Real-time FTC data sync | FTC doesn't publish a structured API; scraping is fragile; the data pipeline is intentionally offline and periodic | Manually update data pipeline when significant new cases arrive |
| Commissioner voting records | Interesting but distinct research track from enforcement provisions; requires separate data model and adds complexity without serving the core "what did the FTC require" use case | Note as potential future feature; out of scope for provisions library |
| Mobile-native features (swipe, offline, PWA) | Target users are attorneys at desks; responsive web is sufficient | Ensure responsive layout works, but no native mobile investment |
| PDF export of full consent orders | FTC.gov already provides PDFs; duplicating this adds infra (PDF generation library), storage, and maintenance | Always link to FTC.gov source; never host document copies |
| Alerts / email subscriptions for new cases | Requires backend (email service, job scheduler, user management); outside the static-site architecture | Out of scope; practitioners can manually revisit when needed |
| AI-generated legal advice / summaries beyond description | Generates liability concerns; practitioners already distrust AI legal analysis; factual descriptions of what provisions require are appropriate, interpretive advice is not | Present what the order says, not what it means for the user's situation |

---

## Feature Dependencies

```
Provision-level topic classification (build pipeline)
  └── Topic landing page (browse by topic)
        └── Filtering within topic views (date, company, remedy type)
              └── Trend charts by topic (requires date + topic aggregation)

Remedy type taxonomy (build pipeline)
  └── Remedy type filter on topic views
  └── Trend charts by remedy type

Industry sector classification (build pipeline)
  └── Industry sector drill-down view

Language evolution tracking
  └── Provision-level topic classification (need topics to group by)
  └── Boilerplate detection algorithm (needs cross-case text comparison)

Case detail page (individual case deep-dive)
  └── Provision detail cards with full quoted text
  └── Links to FTC.gov source document
```

**Critical path dependency:** Everything in the provisions library depends on the data pipeline producing provision-level topic tags. This is the first thing to build — all UI surfaces are blocked until classification is available.

---

## MVP Recommendation

The minimum coherent product that delivers the core value proposition:

**Prioritize (Phase 1 - Data Foundation):**
1. Provision-level topic classification in build pipeline — assigns statutory topic + practice area + remedy type tags to each provision
2. Aggregated provisions data structure emitted by build pipeline — topic → [provisions with case context]

**Prioritize (Phase 2 - Core Library UI):**
3. Topic landing page — select a topic and see all provisions across 20+ years
4. Provision detail cards — quoted text, paragraph citation, case name/date, FTC.gov link
5. Date sort (newest first default) and date range filter within topic views

**Add early if complexity is low:**
6. Provision count per topic on the topic selector screen
7. Case metadata visible on each provision card (company, year, administration)

**Defer (Phase 3+):**
- Remedy type as a filter (needs taxonomy built first)
- Enforcement trend charts by topic (needs provision-date aggregation)
- Language evolution / boilerplate tracking
- Industry sector drill-down
- Administration-era context annotations

---

## Research Notes on Legal Research Tool Conventions

The following reflects established conventions in legal research tools (Westlaw, LexisNexis, Bloomberg Law, CourtListener, agency-specific enforcement databases) that set practitioner expectations:

**Citation is king.** Practitioners cannot use a source they cannot cite. Every provision card must include: case name, docket number, order paragraph number, and a working link. Missing any of these makes the tool unusable for professional work.

**Verbatim text, not paraphrase.** Legal meaning lives in exact words ("shall" vs "must", "material" vs "significant"). Summaries can introduce error. Show the actual order language, put summaries secondary.

**Chronological defaults.** In enforcement databases, the default sort is almost always newest-first (current practice), with oldest-first available (historical trend). This matches how practitioners think: "what is the FTC requiring today" before "how did this evolve."

**Topic/subject matter as primary axis.** Practitioners research by legal issue, not by company. Company-first browsing (searching for what happened to Facebook) is secondary to topic-first (finding every COPPA children's data deletion provision). The current analytics page is company/year-first; the provisions library inverts this correctly.

**Scannability over density.** Legal research tools that cram too much on screen slow practitioners down. Cards with clear hierarchy (provision title → case name/date → quoted text → citation) outperform dense tables for this use case.

**Permanence of URLs.** Legal citations must be linkable and stable over time. The existing URL-driven state pattern is the right call — practitioners will link to specific topic views in memos and emails.

---

## Sources

- Direct codebase analysis: existing FTC Analytics implementation, data model, and build pipeline
- JSON data examination: `public/data/ftc-files/01.05_assail.json` — confirmed provision structure, citation data, quoted text fields
- Project requirements: `.planning/PROJECT.md` (validated requirements list)
- Domain knowledge: established conventions of Westlaw, LexisNexis, Bloomberg Law, CourtListener, and FTC's own case proceedings browser
- FTC enforcement database conventions: FTC.gov/enforcement case proceedings UI (known from training; confidence HIGH for UI conventions, MEDIUM for recent UI changes since August 2025)
