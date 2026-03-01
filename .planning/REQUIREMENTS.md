# Requirements: FTC Enforcement Provisions Library v1.1

**Defined:** 2026-02-26
**Core Value:** A legal practitioner can find every FTC consent order provision relevant to a specific topic, with exact paragraph-level citations and source links, in under 30 seconds.

## v1.1 Requirements

Requirements for milestone v1.1: Data Quality & Case Insights.

### Remedy Reclassification

- [x] **RMED-01**: Pipeline analyzes 885 "other" provisions and proposes new remedy categories
- [x] **RMED-02**: RemedyType taxonomy updated atomically across all 4 code locations (types, build-provisions, classify-provisions, manifest)
- [x] **RMED-03**: Dry-run mode generates proposals for human review before committing reclassification
- [x] **RMED-04**: Pipeline reclassifies ~200-300 meaningful "other" provisions into new categories
- [x] **RMED-05**: Structural/administrative provisions (~585) appropriately categorized or retained
- [x] **RMED-06**: Provisions tab remedy filter reflects new categories immediately after rebuild

### Pattern Condensing

- [x] **PTRN-01**: Similar patterns merged into groups (e.g., 12 assessment variants -> 3-4, 10 acknowledgment variants -> 1)
- [x] **PTRN-02**: Low-value patterns pruned using composite criterion (case count >= threshold OR recent activity)
- [x] **PTRN-03**: Patterns sorted by most recent example
- [x] **PTRN-04**: Config-driven merge map for auditable, reviewable merge decisions
- [x] **PTRN-05**: Current ftc-patterns.json checkpointed before any changes

### Case Provisions Panel

- [x] **CPNL-01**: User can view case-specific provisions in a modal/Sheet from industry tab
- [x] **CPNL-02**: Modal shows verbatim provision text with citations for that case only
- [x] **CPNL-03**: Industry tab "view provisions" opens panel instead of navigating to provisions tab

### Key Takeaways

- [ ] **TAKE-01**: Pipeline generates "what the business did wrong" summaries from complaint data at build time
- [ ] **TAKE-02**: Brief takeaway visible on case cards across all relevant tabs
- [ ] **TAKE-03**: Full takeaway displayed on case detail view
- [ ] **TAKE-04**: Generation constrained to structured fields (legal_authority, provision titles, complaint counts) to prevent hallucination
- [ ] **TAKE-05**: Dry-run validation on 10 sample cases before full batch generation

## Future Requirements

Deferred from PROJECT.md Active list:

- Full-text search across consent order documents (not just provisions)
- Saved searches and bookmarked provisions
- Side-by-side consent order comparison tool
- Fuzzy text similarity for provision language evolution (beyond exact title matching)
- Automatic detection of novel provision language not seen in prior orders
- Commissioner voting records and dissent tracking per case
- Commissioner-level enforcement trend analysis

## Out of Scope

| Feature | Reason |
|---------|--------|
| Runtime LLM classification | Build-time pattern proven in v1.0; no runtime API calls |
| New remedy categories at runtime | Taxonomy is static, defined at build time |
| Pattern merging UI | Merge decisions are pipeline config, not user-facing |
| Manual takeaway editing UI | Takeaways are generated artifacts, not user content |
| Case detail page (full) | v1.1 adds takeaways to existing cards/panels, not a new page |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| RMED-01 | Phase 6 | Complete (06-01) |
| RMED-02 | Phase 6 | Complete (06-01) |
| RMED-03 | Phase 6 | Complete (06-01) |
| RMED-04 | Phase 6 | Complete (06-02) |
| RMED-05 | Phase 6 | Complete (06-02) |
| RMED-06 | Phase 6 | Complete (06-02) |
| PTRN-01 | Phase 7 | Complete |
| PTRN-02 | Phase 7 | Complete |
| PTRN-03 | Phase 7 | Complete |
| PTRN-04 | Phase 7 | Complete (07-01) |
| PTRN-05 | Phase 7 | Complete (07-01) |
| CPNL-01 | Phase 8 | Complete |
| CPNL-02 | Phase 8 | Complete |
| CPNL-03 | Phase 8 | Complete |
| TAKE-01 | Phase 9 | Pending |
| TAKE-02 | Phase 9 | Pending |
| TAKE-03 | Phase 9 | Pending |
| TAKE-04 | Phase 9 | Pending |
| TAKE-05 | Phase 9 | Pending |

**Coverage:**
- v1.1 requirements: 19 total
- Mapped to phases: 19
- Unmapped: 0

---
*Requirements defined: 2026-02-26*
*Last updated: 2026-02-27 after plan 07-01 completion*
