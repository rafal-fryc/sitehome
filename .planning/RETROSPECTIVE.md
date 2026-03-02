# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.1 — Data Quality & Case Insights

**Shipped:** 2026-03-02
**Phases:** 4 | **Plans:** 8

### What Was Built
- Rule-based remedy reclassification pipeline reducing "Other" from 885 to 10 provisions (1.1%)
- Config-driven pattern merge/prune condensing 126 patterns to 52 (59% reduction)
- Inline case provisions panel (Sheet modal) in industry tab
- AI-generated key takeaways for all 293 cases with brief/full display and content badges

### What Worked
- Pipeline-first approach (phases 6-7 data, then 8-9 UI) meant UI phases were simpler — data improvements automatically reflected in existing views
- Dry-run/proposal workflow for both remedy reclassification and pattern condensing — caught issues before committing changes
- Rule-based classification over LLM for remedy reclassification — the `category` field was a deterministic signal, no LLM needed
- Config-driven merge map for patterns — auditable, user-reviewable, reproducible
- Temperature 0 for takeaway generation ensured deterministic, reproducible output

### What Was Inefficient
- Phase 06-02 took 61 minutes (longest plan in both milestones) due to writing reclassifications to 288 individual source JSON files — batch file I/O dominated
- Roadmap line 91 shows 09-02 unchecked despite being complete — roadmap status tracking got out of sync during rapid execution
- Multiple STATE.md frontmatter blocks accumulated instead of being replaced cleanly

### Patterns Established
- Proposal/review/apply workflow for data pipeline changes (used in both phases 6 and 7)
- `takeaway_brief` at top level of case JSON for efficient aggregate index propagation
- AI-generated content badges (9px outline, muted opacity) for LLM-generated text
- Composite threshold for pruning decisions (case_count AND recency, not just one criterion)
- Sheet rendered at tab level (not inside child components) for cross-view persistence

### Key Lessons
1. Rule-based classification should be the default when structured data provides deterministic signal — reserve LLM for genuinely ambiguous cases
2. User-in-the-loop consolidation of merge groups produces better results than automated grouping — the 4 user-consolidated groups covered broader topic coverage than the original 21 proposals
3. Batch file I/O (writing 288 files) is the dominant cost in pipeline phases — future pipelines should consider batch writes or in-memory transforms with single output

### Cost Observations
- Model mix: 100% opus (quality profile)
- Phases 8-9 averaged 2-5 min per plan (fast UI work), phases 6-7 averaged 7-61 min (data pipeline)
- Notable: Pattern condensing exactly matched its projection (52 from 126) — the proposal/review step made execution zero-surprise

---

## Milestone: v1.0 — MVP

**Shipped:** 2026-02-25
**Phases:** 5 | **Plans:** 21

### What Was Built
- Offline data pipeline classifying 293 FTC cases and 2,783 provisions
- 4-tab page architecture with analytics dashboard
- Topic-first provisions library with full-text search
- Industry sector browsing with 8-sector taxonomy
- 126 cross-case provision patterns with chronological timelines

### What Worked
- Static JSON data model scaled well for 293 cases — no database needed
- Topic-sharded provision files solved the 10MB flat file problem
- Build-time classification via Claude Code agents produced high-quality results
- Law-library aesthetic gave the tool a professional, domain-appropriate feel

### What Was Inefficient
- Massive initial commit volume (70 commits, 426 files, 305K lines in 2 days) — pace was sustainable but left limited room for iteration
- ScrollArea vs native overflow conflict discovered during development rather than upfront

### Patterns Established
- Build-time classification via Claude Code agents (no runtime API calls)
- Three-level taxonomy (statutory + practice area + remedy type)
- Topic-sharded JSON with manifest for lazy loading
- Law-library visual identity (EB Garamond, cream/gold/dark-green)

### Key Lessons
1. Static JSON + client-side rendering is viable for datasets of this size — don't over-architect with databases
2. Classification quality matters more than classification speed — offline build-time is the right choice

### Cost Observations
- Model mix: 100% opus
- Extremely fast: 21 plans in 2 days
- Notable: Average plan duration 3 min

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v1.0 | 5 | 21 | Initial build — high velocity, many plans per phase |
| v1.1 | 4 | 8 | Data quality focus — fewer plans but deeper pipeline work |

### Top Lessons (Verified Across Milestones)

1. Build-time classification is the right default — proven in both v1.0 (LLM classification) and v1.1 (rule-based reclassification, LLM takeaways)
2. Proposal/review/apply workflow catches issues before they hit production data — validated in v1.1 phases 6 and 7
3. Static JSON scales well for this dataset — no database needed through 293 cases and 2,783 provisions
