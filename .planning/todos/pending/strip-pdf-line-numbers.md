---
id: strip-pdf-line-numbers
area: data-pipeline
priority: medium
created: 2026-03-01
source: phase-08 execution
---

# Strip embedded PDF line numbers from provision text

The `quoted_text` fields in case JSON files (`public/data/ftc-files/*.json`) contain stray line numbers from the original PDF court documents. These numbers appear inline within provision text (e.g., "from a 19 representative" where "19" is a line number, not content).

**Visible in:** Both the Provisions tab (via provision shards) and the new Case Provisions Panel (via case files directly).

**Example:** Disney COPPA Part VII — "Within fourteen (14) days of receipt of a written request from a 19 representative of the Commission..."

**Fix:** Create a pipeline script that detects and strips PDF line numbers from `quoted_text` and `verbatim_text` fields across all case files, then rebuild provision shards.
