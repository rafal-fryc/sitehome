# Phase 7: Pattern Condensing - Research

**Researched:** 2026-02-27
**Domain:** Build-pipeline data transformation (JSON pattern grouping, merging, pruning)
**Confidence:** HIGH

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Group assessment-pattern variants by **topic area** (security, privacy, data handling, etc.) -- not by structural similarity or timing
- Merged groups get a **single clean name** -- no variant counts in the display name
- Original individual variants are **removed from the browser** after merging -- the merged group replaces them entirely. Original data preserved in git checkpoint
- **Propose-then-apply workflow** (same as Phase 6 reclassification): Claude generates a merge proposal for user review/approval before anything changes in the data
- Sorted by most recent example -- merged groups use the **newest case date across all original variants** (no recency data lost)
- Case count for merged groups uses **unique cases only** -- deduplicated across variants (same consent order appearing in multiple variants counts once)
- **Secondary sort**: tie-break by case count (more cases first) when most-recent dates match
- **Minor UI polish allowed** -- data changes are the focus, but small tweaks are fine if they improve the condensed view (e.g., showing date range)

### Claude's Discretion
- Pruning threshold and criteria for low-value patterns (case count, recency, structural flag, composite scoring)
- Exact merge grouping algorithm and how to handle edge cases
- Config file format for recording merge/prune decisions
- Any minor UI polish details that improve the condensed pattern browser
- Acknowledgment variant merge approach (success criteria: merge into 1 group)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PTRN-01 | Similar patterns merged into groups (e.g., 12 assessment variants -> 3-4, 10 acknowledgment variants -> 1) | Merge config file maps source pattern IDs to target groups. build-patterns.ts applies merge map after grouping. 12 assessment variants identified, 10 acknowledgment variants identified, 13 misrepresentation variants identified. |
| PTRN-02 | Low-value patterns pruned using composite criterion (case count >= threshold OR recent activity) | Composite threshold research: `case_count < 5 AND most_recent_year < 2020` prunes 19 patterns (mix of structural and substantive). Recommended as baseline. |
| PTRN-03 | Patterns sorted by most recent example | Currently sorted by `most_recent_year` (integer year). Upgrade to `most_recent_date` (ISO date string from `max(variants[].date_issued)`) for finer granularity. 35 patterns tie at 2025, 18 at 2024 -- date-level sort resolves ties meaningfully. |
| PTRN-04 | Config-driven merge map for auditable, reviewable merge decisions | JSON config at `scripts/pattern-merge-config.json` with merge groups, prune list, and metadata. Same propose-then-apply pattern as Phase 6's `remedy-approved-categories.json`. |
| PTRN-05 | Current ftc-patterns.json checkpointed before any changes | Git checkpoint commit of `public/data/ftc-patterns.json` before any modifications. Simple `git add + commit` before merge/prune logic runs. |

</phase_requirements>

## Summary

Phase 7 condenses the pattern browser from 126 patterns (many redundant variants of the same enforcement concept) to approximately 60-70 meaningful, distinct patterns by merging variant families and pruning low-value noise. This is a **build-pipeline data transformation** -- the merge/prune logic lives in `scripts/build-patterns.ts`, the config lives in a new JSON file, and the UI components require no structural changes (they already consume `PatternGroup[]` and render whatever data they receive).

The current `ftc-patterns.json` contains 126 pattern groups with 2,194 variants across 4.0 MB. Analysis reveals clear merge families: **12 assessment variants** (80 unique cases across all), **10 acknowledgment variants** (241 unique cases), **13 misrepresentation variants** (177 unique cases), plus smaller families in security programs (12), recordkeeping (5), compliance reporting (7), corporate changes (11), order duration/termination (6), COPPA/children (8), monetary (8), and deletion (7). After merging and pruning, the pattern count should drop from 126 to roughly 60-70, with dramatically better signal-to-noise for practitioners.

**Primary recommendation:** Create a `pattern-merge-config.json` using the Phase 6 propose-then-apply workflow, then modify `build-patterns.ts` to read that config and apply merges + prunes + date-level sort in a single pipeline rebuild. Split into two plans: (1) checkpoint + propose merge/prune config, (2) apply config + rebuild + minor UI polish.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js fs/path | built-in | Read/write JSON files | Already used by all build scripts |
| tsx | project dep | TypeScript script runner | Already used for all `scripts/*.ts` |

### Supporting
No new libraries needed. This phase modifies an existing build script and adds a config file.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| JSON config file | YAML config | YAML adds a dependency; JSON is already the project standard for config (see `remedy-approved-categories.json`) |
| Modifying build-patterns.ts | Separate merge script | Single script is simpler; Phase 6 precedent shows the propose/apply workflow can live in its own script, but the merge logic is tightly coupled to the build pipeline |

**Installation:**
No new packages needed.

## Architecture Patterns

### Recommended Project Structure
```
scripts/
  build-patterns.ts              # MODIFIED: reads merge config, applies merges/prunes/sort
  condense-patterns.ts           # NEW: propose-then-apply script (like reclassify-remedy-other.ts)
  pattern-merge-config.json      # NEW: auditable merge/prune decisions
public/data/
  ftc-patterns.json              # OUTPUT: condensed patterns (fewer rows, same schema)
src/
  components/ftc/patterns/       # MINIMAL CHANGES: PatternRow.tsx may get minor polish
  types/ftc.ts                   # NO CHANGES: PatternGroup interface stays the same
```

### Pattern 1: Propose-Then-Apply Workflow (Phase 6 Precedent)
**What:** A multi-mode script that separates analysis/proposal from data modification.
**When to use:** When data changes need human review before being applied.
**How Phase 6 did it:**
1. `--propose` mode: reads source data, generates a structured proposal JSON for review
2. User reviews and approves (or edits) the proposal
3. `--apply` mode: reads approved config, applies changes, shows summary
4. `--write-apply` mode: actually writes changes to source files

**Phase 7 adaptation:** The script generates a merge/prune proposal showing:
- Which patterns will be merged into which groups (with case counts, variant counts, and date ranges)
- Which patterns will be pruned (with justification: case count + recency below threshold)
- The final pattern list after condensing (projected count)

The user approves, then the build pipeline applies the config.

### Pattern 2: Config-Driven Merge Map
**What:** A JSON configuration file that maps source pattern IDs to target merged groups.
**Recommended format:**
```json
{
  "generated_at": "2026-02-27T...",
  "approved_at": null,
  "merge_groups": [
    {
      "target_name": "Third-Party Security Assessments",
      "target_id": "third-party-security-assessments",
      "topic_area": "security",
      "source_patterns": [
        "third-party-security-assessments",
        "biennial-third-party-security-assessments",
        "cooperation-with-third-party-information-security-assessor",
        "information-security-assessments-by-a-third-party",
        "third-party-assessments",
        "third-party-information-security-assessments-for-covered-businesses",
        "data-security-assessments-by-a-third-party",
        "biennial-assessment-requirements"
      ],
      "estimated_unique_cases": 68,
      "rationale": "All are variants of third-party assessment requirements for information security"
    }
  ],
  "prune_list": [
    {
      "pattern_id": "fees-and-costs",
      "reason": "3 cases, last seen 2005, structural"
    }
  ],
  "prune_criteria": {
    "description": "Pruned if case_count < 5 AND most_recent_year < 2020",
    "case_count_threshold": 5,
    "recency_cutoff_year": 2020
  }
}
```

### Pattern 3: Build-Pipeline Merge Application
**What:** Merging happens AFTER the existing grouping logic in build-patterns.ts, as a post-processing step.
**Why:** The existing Pass 1 (normalized title) and Pass 2 (prefix merge) grouping stays intact. The merge config is applied as a Pass 3 that collapses specified groups into single entries.
**Algorithm:**
1. Build groups normally (existing Pass 1 + Pass 2 + filter)
2. Read merge config
3. For each merge group: find all source patterns by ID, combine their variants into the target, deduplicate by case_id, use the target name
4. Remove source patterns, add merged target
5. Apply prune list: remove patterns matching prune criteria
6. Sort by `most_recent_date` (max date_issued across variants) desc, then case_count desc
7. Write output

### Anti-Patterns to Avoid
- **Merging before grouping:** Do not try to merge at the provision level before pattern groups are formed. The existing grouping logic is correct; merge as a post-processing step on already-formed PatternGroup objects.
- **Changing the PatternGroup schema:** Keep the same `PatternGroup` interface. The UI components already work with it. Merged groups just have a cleaner name and combined variants.
- **Hardcoding merge decisions in build-patterns.ts:** All merge/prune decisions must live in the config file for auditability (PTRN-04). The script reads the config, not inline constants.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Case deduplication across merged variants | Custom dedup logic | `Set<string>` on `case_id` (already used in build-patterns.ts line 131) | The existing pattern is proven and simple |
| Safe JSON write | Manual file write | `writeJSONSafe()` (already exists in build-patterns.ts line 87-93) | Validates JSON before write, uses tmp-rename pattern |
| Pattern ID generation | Custom ID logic | `slugify()` (already exists in build-patterns.ts line 78-85) | Consistent with existing IDs |

**Key insight:** Nearly all utilities needed already exist in build-patterns.ts. The merge/prune logic is the only new code, and it operates on already-formed PatternGroup objects.

## Common Pitfalls

### Pitfall 1: Case Count Inflation from Duplicate Variants
**What goes wrong:** When merging pattern groups, the same case_id can appear in multiple source groups. Summing case_counts instead of deduplicating gives inflated numbers.
**Why it happens:** A single consent order may have provisions matching multiple pattern title variants (e.g., "Third-Party Security Assessments" and "Biennial Third-Party Security Assessments").
**How to avoid:** Always collect unique case_ids across all source variants, then count the set size. The assessment family has 12 patterns with individual case counts summing to ~101, but only 80 unique cases.
**Warning signs:** Merged group case_count exceeds the sum of its topic shard's case counts.

### Pitfall 2: Lost Variant Data After Merge
**What goes wrong:** Variants from source groups are not properly combined into the merged target, losing provision text, date ranges, or case links.
**Why it happens:** Overwriting instead of concatenating variant arrays.
**How to avoid:** Concatenate all variant arrays from source patterns, then sort chronologically. The merged group's variants should include every variant from every source pattern.
**Warning signs:** Merged group variant_count is less than sum of source pattern variant_counts.

### Pitfall 3: Sort Precision -- Year vs Date
**What goes wrong:** Patterns from the same year appear in arbitrary order because sort uses integer year instead of full date.
**Why it happens:** Current `most_recent_year` field is year-level granularity only.
**How to avoid:** Add a `most_recent_date` field (ISO date string) to PatternGroup computed as `max(variants[].date_issued)`. Sort by this field. Currently 35 patterns tie at year 2025 and 18 tie at year 2024 -- date-level sort resolves these ties meaningfully.
**Warning signs:** Patterns within the same year appear in case_count order rather than actual date order.

### Pitfall 4: Pruning Valuable Low-Frequency Patterns
**What goes wrong:** Aggressive pruning removes patterns that are rare but represent important emerging enforcement trends.
**Why it happens:** Using case_count alone as a pruning criterion.
**How to avoid:** Use a composite criterion: prune only when BOTH case_count is below threshold AND the pattern has no recent activity. Recommended: `case_count < 5 AND most_recent_year < 2020` (prunes 19 patterns, all genuinely low-value historical artifacts). This preserves recent small patterns like "Sensitive Location Data Program" (4 cases, 2024-2025) and "Supplier Assessment Program" (3 cases, 2024-2025).
**Warning signs:** Recently-active patterns (2020+) appearing in the prune list.

### Pitfall 5: Breaking the Build Pipeline Chain
**What goes wrong:** Modifying build-patterns.ts breaks `npm run build:data` which runs `build:ftc-data && build:provisions && build:patterns` in sequence.
**Why it happens:** Introducing a new dependency or changing the script's entry/exit contract.
**How to avoid:** The merge config file must exist before build-patterns.ts runs. If the config doesn't exist, the script should run in "passthrough" mode (no merges, no prunes) to maintain backward compatibility.
**Warning signs:** `npm run build:data` fails after changes.

## Code Examples

### Merge Application Logic (new Pass 3 in build-patterns.ts)
```typescript
// Source: project-specific, based on existing build-patterns.ts patterns

interface MergeGroup {
  target_name: string;
  target_id: string;
  topic_area: string;
  source_patterns: string[]; // pattern IDs to merge
}

interface PruneEntry {
  pattern_id: string;
  reason: string;
}

interface MergeConfig {
  merge_groups: MergeGroup[];
  prune_list: PruneEntry[];
}

function applyMergeConfig(
  patterns: PatternGroup[],
  config: MergeConfig
): PatternGroup[] {
  const result = [...patterns];
  const toRemove = new Set<string>();

  // Apply merges
  for (const group of config.merge_groups) {
    const sourceIds = new Set(group.source_patterns);
    const sources = result.filter((p) => sourceIds.has(p.id));
    if (sources.length === 0) continue;

    // Combine all variants
    const allVariants: PatternVariant[] = [];
    const allCases = new Set<string>();
    const allTopics = new Set<string>();
    const allAreas = new Set<string>();

    for (const src of sources) {
      for (const v of src.variants) {
        allVariants.push(v);
        allCases.add(v.case_id);
      }
      for (const t of src.enforcement_topics) allTopics.add(t);
      for (const a of src.practice_areas) allAreas.add(a);
      toRemove.add(src.id);
    }

    // Sort variants chronologically
    allVariants.sort((a, b) => a.date_issued.localeCompare(b.date_issued));

    // Compute year range and most_recent_date
    const years = allVariants.map((v) => v.year);
    const maxDate = allVariants.reduce(
      (max, v) => (v.date_issued > max ? v.date_issued : max),
      "0000-00-00"
    );

    // Determine structural status (>50% structural)
    // For merged groups this is inherited from source patterns
    const structuralCount = sources.filter((s) => s.is_structural).length;
    const isStructural = structuralCount > sources.length * 0.5;

    const merged: PatternGroup = {
      id: group.target_id,
      name: group.target_name,
      is_structural: isStructural,
      case_count: allCases.size,
      variant_count: allVariants.length,
      year_range: [Math.min(...years), Math.max(...years)],
      most_recent_year: Math.max(...years),
      enforcement_topics: [...allTopics].sort(),
      practice_areas: [...allAreas].sort(),
      variants: allVariants,
    };

    result.push(merged);
  }

  // Apply prunes
  const pruneIds = new Set(config.prune_list.map((p) => p.pattern_id));
  for (const id of pruneIds) toRemove.add(id);

  // Remove merged sources and pruned patterns
  return result.filter((p) => !toRemove.has(p.id));
}
```

### Date-Level Sort Upgrade
```typescript
// Source: upgrade to existing sort in build-patterns.ts (line 302-307)

// Before (year-level):
patternGroups.sort((a, b) => {
  if (b.most_recent_year !== a.most_recent_year)
    return b.most_recent_year - a.most_recent_year;
  return b.case_count - a.case_count;
});

// After (date-level):
// Compute most_recent_date for each group
for (const group of patternGroups) {
  (group as any).most_recent_date = group.variants.reduce(
    (max, v) => (v.date_issued > max ? v.date_issued : max),
    "0000-00-00"
  );
}

patternGroups.sort((a, b) => {
  const dateA = (a as any).most_recent_date;
  const dateB = (b as any).most_recent_date;
  if (dateB !== dateA) return dateB.localeCompare(dateA);
  return b.case_count - a.case_count;
});
```

### Config File Loading with Passthrough Fallback
```typescript
// Source: project pattern from build-patterns.ts

const CONFIG_PATH = path.resolve("scripts/pattern-merge-config.json");

let mergeConfig: MergeConfig = { merge_groups: [], prune_list: [] };
if (fs.existsSync(CONFIG_PATH)) {
  mergeConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
  console.log(
    `Loaded merge config: ${mergeConfig.merge_groups.length} merge groups, ` +
    `${mergeConfig.prune_list.length} prune entries`
  );
} else {
  console.log("No merge config found -- running in passthrough mode");
}
```

## Current Data Analysis

### Pattern Inventory (126 total)

**Clear merge families (by topic area, per user decision):**

| Family | Current Count | Unique Cases | Proposed Merge Result |
|--------|--------------|--------------|----------------------|
| Assessment / Third-Party Evaluation | 12 patterns | 80 cases | 3-4 groups: Security Assessments, Privacy Assessments, Cooperation with Assessor, Supplier Assessment |
| Acknowledgment / Order Receipt | 10 patterns | 241 cases | 1 group: Order Acknowledgments |
| Misrepresentation / Prohibition | 13 patterns | 177 cases | 3-4 groups: General Misrepresentations, Privacy/Security Misrepresentations, Privacy Program Misrepresentations, Security-Specific Misrepresentations |
| Security/Privacy Programs | 12 patterns | ~90 cases | 3-4 groups: Information Security Program, Privacy Program, Combined Security/Privacy Program |
| Recordkeeping | 5 patterns | ~250 cases | 1-2 groups: Recordkeeping |
| Compliance Reporting | 7 patterns | ~280 cases | 1-2 groups: Compliance Reporting, Compliance Reports and Notices |
| Corporate Changes / Distribution | 11 patterns | ~100 cases | 2-3 groups: Corporate Change Notification, Order Distribution |
| Order Duration / Termination | 6 patterns | ~160 cases | 1-2 groups: Order Duration and Termination |
| COPPA / Children | 8 patterns | ~45 cases | 2-3 groups: COPPA Injunctions, Children's Data Deletion, KidzPrivacy Notice |
| Monetary | 8 patterns | ~130 cases | 2-3 groups: Civil Penalty, Monetary Relief, Costs |
| Deletion | 7 patterns | ~35 cases | 2-3 groups: Data Deletion, Children's Data Deletion, Biometric Deletion |

**Pruning candidates (composite: case_count < 5 AND most_recent_year < 2020): 19 patterns**

These 19 patterns are all genuinely low-value historical artifacts that would be pruned:
- 6 structural patterns (e.g., Order Termination, Fees and Costs, Submission Address)
- 13 substantive patterns (e.g., Comprehensive Privacy Program 2011-2016, Ban on Sale of Customer Phone Records 2006-2008)

**After condensing:** ~60-70 patterns (from 126), ~1,900-2,100 variants (some pruned), file size drops ~15-25%.

### Sort Improvement Opportunity

Current sort uses `most_recent_year` (integer). Upgrade to `most_recent_date` (ISO date string) resolves ties within years:
- 2025: 35 patterns tie (date-level sort spreads these meaningfully)
- 2024: 18 patterns tie
- 2014: 12 patterns tie

The `date_issued` field exists on every variant and is already an ISO date string, so the max can be computed trivially.

### UI Impact Assessment

| Component | Impact | Change Needed |
|-----------|--------|---------------|
| `FTCPatternsTab.tsx` | None | Consumes `PatternsFile` unchanged |
| `PatternList.tsx` | Minimal | Already has sort by recency; may benefit from showing `most_recent_date` instead of year range |
| `PatternRow.tsx` | Minimal | May show date range or "last seen" date for polish |
| `PatternTimeline.tsx` | None | Renders variants array unchanged |
| `VariantCard.tsx` | None | Renders individual variants unchanged |
| `use-patterns.ts` | None | Fetches ftc-patterns.json unchanged |
| `types/ftc.ts` | Optional | Add `most_recent_date?: string` to `PatternGroup` if desired |
| `SectorPatternCharts.tsx` | None | Does not reference patterns at all (uses statutory_topics/remedy_types from case data) |

## Open Questions

1. **Exact assessment merge groupings**
   - What we know: 12 assessment patterns span security (8), privacy (3), and supplier (1) areas per enforcement_topics data
   - What's unclear: Whether "Cooperation with Assessor" (3 cases, privacy) should merge with privacy assessments or stay separate
   - Recommendation: Propose in the merge config with rationale; user approves the exact groupings

2. **Misrepresentation merge granularity**
   - What we know: 13 patterns, some clearly distinct (general vs. privacy/security vs. program-specific)
   - What's unclear: Whether "No Misrepresentations About Privacy" (9 cases, 2013-2014 only) is distinct enough to keep separate from "Prohibition Against Privacy Misrepresentations" (3 cases)
   - Recommendation: Propose 3-4 groups by topic area: General, Privacy & Security, Program Participation, Security-Only. User approves.

3. **Should the `most_recent_date` field be added to the PatternGroup type?**
   - What we know: Adding it to the type enables UI components to display finer date information and enables date-level sort
   - What's unclear: Whether this is worth a type change vs. computing at sort time only
   - Recommendation: Add to type -- minimal cost, enables UI polish, and the planner can decide if PatternRow should display it

## Sources

### Primary (HIGH confidence)
- `scripts/build-patterns.ts` -- full source read, all 367 lines; current grouping/sorting logic understood
- `public/data/ftc-patterns.json` -- full data analysis (126 patterns, 2194 variants, 4.0 MB)
- `scripts/reclassify-remedy-other.ts` -- Phase 6 propose-then-apply workflow precedent (394 lines)
- `src/types/ftc.ts` -- PatternGroup/PatternVariant/PatternsFile interfaces
- All 5 UI components in `src/components/ftc/patterns/` -- read in full

### Secondary (MEDIUM confidence)
- Phase 6 PLAN files (06-01, 06-02) -- workflow structure precedent

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries; all tools already exist in the project
- Architecture: HIGH -- propose-then-apply workflow has direct Phase 6 precedent; merge logic is straightforward post-processing on existing data structures
- Pitfalls: HIGH -- data analysis confirms case deduplication and sort precision issues; pruning thresholds validated against actual data

**Research date:** 2026-02-27
**Valid until:** 2026-03-27 (stable domain -- data pipeline, no external dependencies)
