# Phase 1: Data Pipeline - Context

**Gathered:** 2026-02-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Extend the offline build pipeline to classify all 293 FTC enforcement cases' provisions by substantive topic, remedy type, and industry sector — then emit static JSON artifacts that every downstream UI surface depends on. Classification is powered by Claude Code (Sonnet agent), not rule-based keyword matching. No UI work in this phase.

</domain>

<decisions>
## Implementation Decisions

### Taxonomy Design
- **Three classification axes maintained:** Statutory Topics, Practice Areas, and Remedy Types are separate dimensions — not merged
- **Statutory Topics:** COPPA, FCRA, GLBA, Health Breach Notification, CAN-SPAM, TCPA (and others surfaced from data)
- **Practice Areas:** Privacy, Data Security, Deceptive Design / Dark Patterns, AI / Automated Decision-Making, Surveillance (and others surfaced from data)
- **Remedy Types:** Map from existing structural provision categories (prohibition, affirmative_obligation, assessment, etc.) to substantive remedies (Monetary Penalty, Data Deletion, Comprehensive Security Program, Third-Party Assessment, Algorithmic Destruction, Biometric Ban, Compliance Monitoring, Recordkeeping, Prohibition, Other)
- **Multi-topic tagging:** A single provision gets ALL applicable topics — shows up in multiple topic views. No primary/secondary distinction.
- **Unclassified provisions:** Tagged as "Other" — visible and browsable in the library, not hidden

### Classification Logic
- **LLM-driven classification via Claude Code:** Spawn a Sonnet agent within Claude Code (user's Max subscription — no API costs) that reads each case JSON and writes topic/remedy/industry tags back into the source files
- **One-time batch + incremental:** Classify all 293 existing cases once. Future new cases get classified when added to the dataset.
- **Sequential processing:** One agent processes all cases in sequence, writing tags as it goes
- **Tags only:** Sonnet adds statutory topics, practice areas, remedy types, and industry sector. No enrichment of summaries or titles — existing data is sufficient.
- **Tags written into source JSON files:** Classification becomes part of the raw case data in `public/data/ftc-files/`, not a separate mapping file
- **Verification:** Both output distribution statistics (detect systematic issues) AND manual spot-check of 20-30 cases across different topics and years

### Output File Structure
- **Topic-sharded provision files:** Separate JSON files per topic (e.g., `coppa-provisions.json`, `data-security-provisions.json`) rather than one flat file — browser loads only what's needed
- **ftc-patterns.json deferred to Phase 5:** No pattern detection in this phase. Phase 5 will design its own pattern detection when it needs it.
- **Enhanced ftc-cases.json:** Each case gains: topic aggregation (all statutory + practice area topics from provisions), remedy summary (all remedy types), industry sector, and provision counts by topic
- **All classification at build time:** `npm run build:data` reads the tagged source JSONs and produces the sharded provision files + enhanced cases file. No classification logic ships to browser.
- **TypeScript interfaces first:** Define data shapes in `src/types/` before building the pipeline

### Industry Inference
- **Hierarchical sectors:** Broad categories (Technology, Healthcare, Financial Services, Retail, Telecom, Education, Social Media) with nested subsectors (AdTech, HealthTech, Fintech, E-commerce, Mobile Apps, IoT, etc.)
- **Multiple sectors per company:** A company can be tagged with all applicable sectors (same approach as topic tagging)
- **Same classification pass:** Industry sector inferred in the same Claude Code agent run as topic classification — reads business_description alongside legal_authority and provisions

### Claude's Discretion
- Exact prompt design for the Sonnet classification agent
- How to batch the 293 cases within a single sequential run (all at once vs checkpoint-based)
- Exact sharding strategy for provision files (one per statutory topic, or group small topics)
- TypeScript interface naming and organization

</decisions>

<specifics>
## Specific Ideas

- Classification should use structured fields (legal_authority, provision.category) as primary signals — the research found that free-text "privacy" keyword appears in nearly every case and is useless as a discriminating signal
- The existing `classifyCategories()` function in `src/constants/ftc.ts` should be replaced or deprecated once LLM classification is in the source JSONs
- OCR artifacts exist in some case files (confirmed in `01.05_assail.json`: "Defendat," "affliated," "Masterard") — these should be noted but NOT fixed in this phase

</specifics>

<deferred>
## Deferred Ideas

- Cross-case pattern detection (ftc-patterns.json) — Phase 5
- OCR artifact cleanup — future data quality pass
- Fuzzy text similarity for provision language evolution — Phase 5

</deferred>

---

*Phase: 01-data-pipeline*
*Context gathered: 2026-02-24*
