# Requirements: FTC Enforcement Provisions Library v1.2

**Defined:** 2026-03-02
**Core Value:** A legal practitioner can find every FTC consent order provision relevant to a specific topic, with exact paragraph-level citations and source links, in under 30 seconds.

## v1.2 Requirements

Requirements for milestone v1.2: Library & Patterns Overhaul.

### Analytics Cleanup

- [x] **ANLZ-01**: Analytics tables beneath bar charts are collapsible and start in collapsed state
- [x] **ANLZ-02**: Order Administration is hidden from all remedy type UI presentations (filters, charts, tables) while retained in underlying data

### Library Restructure

- [x] **LIB-01**: Practice area sections removed from provisions library sidebar/navigation
- [x] **LIB-02**: Provisions library has two distinct search sections — one for provisions, one for actions/cases
- [x] **LIB-03**: Case search bar allows finding individual enforcement actions by company name or case title
- [x] **LIB-04**: "View provisions" for a specific case is accessible from the library (not only from industry tab)

### Patterns Overhaul

- [x] **PATN-01**: Existing remedy provision patterns are presented as their own distinct category in the patterns section
- [ ] **PATN-02**: New behavioral summary pattern category generated from takeaway data showing what companies did wrong and common behavioral patterns
- [x] **PATN-03**: Remedy pattern categories consolidated per user-directed merge decisions

## Future Requirements

Deferred from PROJECT.md:

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
| Practice area taxonomy removal from data | Only removing from UI; data retains classification |
| Order Administration removal from data | Only hiding from UI; data and tags preserved |
| New data pipeline scripts | v1.2 is UI restructuring; pipeline changes only if needed for behavioral patterns |
| Case detail page (full standalone) | Library restructure uses existing Sheet/modal pattern |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ANLZ-01 | Phase 10 | Complete |
| ANLZ-02 | Phase 10 | Complete |
| LIB-01 | Phase 11 | Complete |
| LIB-02 | Phase 11 | Complete |
| LIB-03 | Phase 11 | Complete |
| LIB-04 | Phase 11 | Complete |
| PATN-01 | Phase 12 | Complete |
| PATN-02 | Phase 12 | Pending |
| PATN-03 | Phase 12 | Complete |

**Coverage:**
- v1.2 requirements: 9 total
- Mapped to phases: 9
- Unmapped: 0

---
*Requirements defined: 2026-03-02*
*Last updated: 2026-03-02 after roadmap creation*
