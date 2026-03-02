# Milestones

## v1.1 Data Quality & Case Insights (Shipped: 2026-03-02)

**Phases completed:** 4 phases, 8 plans, 0 tasks

**Key accomplishments:**
- Reclassified 885 "Other" provisions into 5 named remedy categories, reducing Other to 1.1% via rule-based pipeline with human-reviewed proposals
- Condensed 126 cross-case patterns to 52 (59% reduction) through config-driven merge/prune with date-level recency sort
- Built inline case provisions panel (Sheet modal) in industry tab for case-specific provision browsing without navigation
- Generated Claude-powered "what the business did wrong" takeaways for all 293 cases with AI-generated content badges and hallucination guardrails
- Added 3 new provision shard files (Consumer Notification, Consumer Redress, Order Administration) to the topic-sharded data model

**Stats:** 41 commits, 383 files changed, +56,182/-49,224 lines, 4 days (2026-02-26 → 2026-03-01)

---

## v1.0 MVP (Shipped: 2026-02-25)

**Phases completed:** 5 phases, 21 plans, 0 tasks

**Key accomplishments:**
- Built offline data pipeline classifying 293 FTC cases and 2,783 provisions by statutory topic, practice area, remedy type, and industry sector using Claude Code agents
- Established 4-tab page architecture with analytics dashboard: enforcement trends by year, administration, topic, violation type, and provision-level breakdowns
- Created topic-first provisions library with verbatim order text, exact citations, sticky filter bar, company autocomplete, and full-text MiniSearch search
- Added industry sector browsing with 8-sector taxonomy, enforcement pattern charts, paginated case cards, and side-by-side sector comparison
- Surfaced 126 cross-case provision patterns with chronological timelines, word-level text diff highlighting, and structural/substantive classification

**Stats:** 70 commits, 426 files changed, +305,830/-8,849 lines, 2 days (2026-02-24 → 2026-02-25)

---

