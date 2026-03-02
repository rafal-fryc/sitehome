# Phase 6: Remedy Reclassification - Research

**Researched:** 2026-02-26
**Domain:** TypeScript build pipeline — LLM-based classification, enum taxonomy, JSON data files
**Confidence:** HIGH (codebase fully readable, no external dependencies to verify)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Claude (Sonnet agent within Claude Code, no API) proposes ~5-10 new remedy categories
- Categories at same granularity as existing (e.g., "Data Security", "Monitoring/Compliance")
- Legal terminology for naming (e.g., "Injunctive Relief", "Consumer Redress") — match existing taxonomy style
- User reviews and constrains proposed category set before reclassification runs
- A small "Other" bucket is acceptable after reclassification (<5% of total provisions)
- The ~585 structural/administrative provisions get a new "Order Administration" category (not left in "Other")
- Sonnet agent within Claude Code instance — same pattern as v1.0 (no Anthropic API calls)
- Each provision gets exactly one remedy type (best single category, no multi-category)
- Only reclassify provisions currently in the "Other" bucket — don't re-evaluate existing classifications
- Review workflow: Step 1 propose → Step 2 show examples → Step 3 user approves → Step 4 classify batch → Step 5 summary → Step 6 approve rebuild

### Claude's Discretion
- Exact category names (within legal terminology constraint)
- How to structure the classification prompt for the Sonnet agent
- RemedyType enum update strategy across the 4 code locations
- Pipeline rebuild sequence after reclassification

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| RMED-01 | Pipeline analyzes 885 "other" provisions and proposes new remedy categories | New `reclassify-remedy-other.ts` script reads source files, filters provisions where remedy_types includes only "Other", proposes categories interactively |
| RMED-02 | RemedyType taxonomy updated atomically across all 4 code locations | 4 locations confirmed: `src/types/ftc.ts` (type union), `src/constants/ftc.ts` (REMEDY_TYPE_OPTIONS array), `scripts/build-provisions.ts` (inline type), `scripts/classify-provisions.ts` (inline type) |
| RMED-03 | Dry-run mode generates proposals for human review before committing reclassification | Script runs in two phases: propose-only (prints categories + examples, no writes) then classify-and-write after user confirms |
| RMED-04 | Pipeline reclassifies ~200-300 meaningful "other" provisions into new categories | Sonnet agent reads provision title+summary+category field, assigns single best-fit new category |
| RMED-05 | Structural/administrative provisions (~585) appropriately categorized or retained | "Order Administration" added as new category; structural detection by category field values (duration, acknowledgment, recordkeeping-adjacent) |
| RMED-06 | Provisions tab remedy filter reflects new categories immediately after rebuild | build-provisions.ts reads remedy_types from source files → writes shard files → manifest auto-includes all distinct remedy values; REMEDY_TYPE_OPTIONS in constants must match |
</phase_requirements>

---

## Summary

Phase 6 is a pure data-pipeline phase. There is no new UI code; the Provisions tab already reads remedy_types dynamically from the manifest. The work is: (1) write a new classification script that operates only on provisions where `remedy_types` currently contains only `"Other"`, (2) add ~5-10 new `RemedyType` enum values in 4 code locations, and (3) run the script through a two-stage human-in-the-loop review workflow before writing changes to source files.

The v1.0 `classify-provisions.ts` pattern is the direct template. Key difference: v1.0 used Anthropic SDK API calls (`anthropic.messages.create`). The CONTEXT.md decision is to use **Sonnet agent within Claude Code** — meaning the new script is run by the user inside Claude Code and Claude itself does the classification reasoning using the Read tool on each provision, not an API call. This is a "Claude reads files and outputs JSON" pattern, not a traditional script loop.

The 4 code locations for the RemedyType enum are confirmed by codebase inspection: `src/types/ftc.ts` (the canonical union type), `src/constants/ftc.ts` (the `REMEDY_TYPE_OPTIONS` array used by the UI filter), `scripts/build-provisions.ts` (inline duplicate type), and `scripts/classify-provisions.ts` (inline duplicate type). All 4 must be updated atomically.

**Primary recommendation:** Implement Phase 6 as a single interactive script `reclassify-remedy-other.ts` with `--propose` and `--apply` modes, plus a Wave 0 task to update the enum in all 4 locations before the script runs.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| tsx | existing | Run TypeScript scripts directly | Already used for all pipeline scripts |
| Node.js fs | built-in | Read/write source JSON files | Same pattern as build-provisions.ts |
| TypeScript | existing | Type safety for RemedyType enum | Existing project language |

### No New Dependencies
This phase adds zero new npm dependencies. All tooling (tsx, fs, path) is already in the project.

---

## Architecture Patterns

### The 4-Location Enum Update Pattern

The `RemedyType` union type is intentionally duplicated across 4 files. The project uses inline types in scripts to avoid path alias issues with tsx:

```
src/types/ftc.ts              — canonical type, used by UI components
src/constants/ftc.ts          — REMEDY_TYPE_OPTIONS array, drives UI filter dropdown
scripts/build-provisions.ts   — inline copy (avoids @/ alias issues in tsx)
scripts/classify-provisions.ts — inline copy (same reason)
```

**All 4 must be updated together.** Adding a new `RemedyType` value to only `src/types/ftc.ts` will not break the build (TypeScript won't complain about extra values in data files) but the UI filter dropdown will be missing the new option until `REMEDY_TYPE_OPTIONS` is also updated. The inline script copies must match or the classification output may write values the build step doesn't recognize.

### The "Claude-in-the-Loop" Classification Pattern

The CONTEXT.md decision to use "Sonnet agent within Claude Code, no API calls" means the workflow is:

```
User runs script --propose  →  Script reads all "Other" provisions, formats a prompt
                             →  Claude (in Claude Code) reads the output and proposes categories
                             →  User sees categories + 3-5 examples each
                             →  User approves/edits category list

User runs script --apply    →  Script reads approved categories from a config file
                             →  Claude (in Claude Code) classifies each provision
                             →  Script writes results to source JSON files
                             →  User reviews summary → triggers rebuild
```

**Implementation approach:** The script writes a structured proposal file (e.g., `scripts/remedy-reclassification-proposal.json`) after `--propose`. Claude reads provisions, outputs classification JSON. The `--apply` phase reads that proposal file plus the approved category list.

### Recommended Project Structure for Phase 6

```
scripts/
├── reclassify-remedy-other.ts    # New: main reclassification script
├── remedy-proposal.json          # Generated: proposed categories + examples (gitignored during work)
├── remedy-approved-categories.json  # User-edited: approved category list
classify-provisions.ts            # Existing: DO NOT MODIFY (v1.0 is done)
build-provisions.ts               # Existing: reads remedy_types, no changes needed
```

### Source File Structure (confirmed)

Each file in `public/data/ftc-files/*.json` has this shape:

```typescript
// order.provisions[n].remedy_types — the field to update
{
  case_info: { ... },
  order: {
    provisions: [
      {
        provision_number: "I",
        title: "...",
        category: "affirmative_obligation" | "prohibition" | "recordkeeping" | "duration" | ...,
        summary: "...",
        remedy_types: ["Other"]  // ← target: replace with new category
      }
    ]
  }
}
```

### `--propose` Mode Output Pattern

```typescript
// Console output for user review:
PROPOSED REMEDY CATEGORIES
===========================

1. Order Administration (~585 provisions)
   Examples:
   - "Duration of Order" (duration category)
   - "Acknowledgment of Receipt" (acknowledgment category)
   - "Service on Respondent" (administrative category)

2. Consumer Notification (~X provisions)
   Examples:
   - ...

TOTAL "Other" provisions: 885
Flagged for manual review: X
```

### `--apply` Mode Pattern

```typescript
// After user approves categories, script writes to source files:
function reclassifyProvision(
  provision: any,
  approvedCategories: string[]
): string {
  // Claude determines best-fit category based on title + summary + raw category field
  // Returns single category string — not an array
  // Ambiguous: returns "Other" and logs to flagged list
}
```

### Safe Write Pattern (existing, must reuse)

```typescript
// From classify-provisions.ts — validated before write
function writeJSONSafe(filePath: string, data: unknown): void {
  const tmp = filePath + ".tmp";
  const serialized = JSON.stringify(data, null, 2);
  JSON.parse(serialized); // throws if invalid
  writeFileSync(tmp, serialized, "utf-8");
  renameSync(tmp, filePath);
}
```

This pattern MUST be reused. Never write directly to source files.

### Anti-Patterns to Avoid

- **Multi-value remedy_types after reclassification:** Each reclassified provision must have exactly one value in `remedy_types`. The existing data model stores an array but the decision is single best-fit. Do not assign `["Order Administration", "Recordkeeping"]`.
- **Re-classifying non-Other provisions:** Filter strictly on `remedy_types.every(r => r === "Other")` before reclassifying. Do not touch provisions already classified as Monitoring, Recordkeeping, etc.
- **Writing categories not in the enum:** The approved category list must be finalized in the enum BEFORE `--apply` runs. Writing a value like "Consumer Notification" to source files when it's not in the TypeScript type causes silent data inconsistency.
- **Updating only 1 of the 4 enum locations:** The UI filter will silently show no results for a new category if `REMEDY_TYPE_OPTIONS` in `src/constants/ftc.ts` is not updated.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Safe atomic file write | Custom write logic | Existing `writeJSONSafe` pattern from classify-provisions.ts | Already handles tmp-rename, JSON validation |
| Idempotency tracking | Custom state file | Filter on `remedy_types` field itself | Source files are ground truth; already-classified provisions will not have `["Other"]` after apply |
| Provision enumeration | Custom file walker | Existing `readdirSync(DATA_DIR).filter(f => f.endsWith('.json'))` pattern | Identical to classify-provisions.ts |

---

## Common Pitfalls

### Pitfall 1: Enum Update Out of Sync Across 4 Locations
**What goes wrong:** New RemedyType values appear in source JSON files but the UI filter dropdown doesn't show them, or TypeScript compilation fails.
**Why it happens:** The project intentionally duplicates the type in script files to avoid `@/` alias issues. It's easy to update `src/types/ftc.ts` and forget `src/constants/ftc.ts`.
**How to avoid:** Wave 0 task updates all 4 locations atomically. Verify by running `npx tsx scripts/build-provisions.ts --dry-run` and checking the manifest output includes new remedy keys.
**Warning signs:** Provisions tab shows empty results when filtering by new category after rebuild.

### Pitfall 2: `remedy_types` Array vs Single Value Confusion
**What goes wrong:** Agent assigns `remedy_types: ["Order Administration", "Recordkeeping"]` to an ambiguous provision because it logically fits both.
**Why it happens:** The existing data model uses an array (from v1.0 multi-tagging). The Phase 6 decision is single best-fit.
**How to avoid:** Classification prompt must explicitly state "Return exactly one remedy type string, not an array. If ambiguous, choose the primary enforcement intent." Post-apply validation: assert `provision.remedy_types.length === 1` for all reclassified provisions.

### Pitfall 3: Filtering "Other" Provisions — Edge Cases
**What goes wrong:** A provision with `remedy_types: ["Recordkeeping", "Other"]` (multi-tagged in v1.0) gets reclassified when it shouldn't.
**Why it happens:** Filter condition `remedy_types.includes("Other")` catches mixed-tag provisions.
**How to avoid:** Filter condition must be `remedy_types.length === 1 && remedy_types[0] === "Other"` — only purely-Other provisions are in scope.

### Pitfall 4: Proposal File Gets Committed to Git
**What goes wrong:** Intermediate working files (proposal JSON, approved categories JSON) get committed, cluttering git history.
**How to avoid:** Add `scripts/remedy-proposal.json` and `scripts/remedy-approved-categories.json` to `.gitignore` during Wave 0, or use a `scripts/reclassify-working/` directory. Commit only the final source file changes and the updated enum files.

### Pitfall 5: Rebuild Required But Not Triggered
**What goes wrong:** Source files updated with new remedy_types but provision shard files in `public/data/provisions/` still contain old data. UI shows stale results.
**Why it happens:** `build-provisions.ts` must be re-run after source files change. It's not automatic.
**How to avoid:** Final step in the workflow explicitly runs `npx tsx scripts/build-provisions.ts`. The summary step (Step 5) should print this reminder.

---

## Code Examples

### Filtering "Other" Provisions from Source Files

```typescript
// Source: classify-provisions.ts pattern, adapted for remedy filter
const DATA_DIR = path.resolve("public/data/ftc-files");

const allOtherProvisions: Array<{
  filename: string;
  provision_number: string;
  title: string;
  summary: string;
  category: string;
}> = [];

const files = readdirSync(DATA_DIR)
  .filter((f) => f.endsWith(".json"))
  .sort();

for (const filename of files) {
  const filePath = path.join(DATA_DIR, filename);
  const data = JSON.parse(readFileSync(filePath, "utf-8"));
  const provisions: any[] = data.order?.provisions ?? [];

  for (const prov of provisions) {
    const remedies: string[] = prov.remedy_types ?? [];
    // Only purely "Other" — not mixed-tagged
    if (remedies.length === 1 && remedies[0] === "Other") {
      allOtherProvisions.push({
        filename,
        provision_number: prov.provision_number,
        title: prov.title ?? "",
        summary: (prov.summary ?? "").slice(0, 400),
        category: prov.category ?? "",
      });
    }
  }
}

console.log(`Found ${allOtherProvisions.length} purely-Other provisions`);
```

### Writing Reclassified Remedy Back to Source File

```typescript
// Source: applyClassification pattern from classify-provisions.ts, adapted
function applyRemedyReclassification(
  caseData: any,
  reclassifications: Record<string, string>  // provision_number -> new category
): any {
  const data = JSON.parse(JSON.stringify(caseData));  // deep clone
  const provisions: any[] = data.order?.provisions ?? [];

  for (const prov of provisions) {
    const newCategory = reclassifications[prov.provision_number];
    if (newCategory !== undefined) {
      prov.remedy_types = [newCategory];  // single value, still an array
    }
  }

  return data;
}
```

### Adding New RemedyType Values (all 4 locations)

```typescript
// Location 1: src/types/ftc.ts
export type RemedyType =
  | "Monetary Penalty"
  | "Data Deletion"
  | "Comprehensive Security Program"
  | "Third-Party Assessment"
  | "Algorithmic Destruction"
  | "Biometric Ban"
  | "Compliance Monitoring"
  | "Recordkeeping"
  | "Prohibition"
  | "Order Administration"   // NEW
  | "Consumer Notification"  // NEW (example — actual names TBD by Claude)
  | "Other";

// Location 2: src/constants/ftc.ts
export const REMEDY_TYPE_OPTIONS: RemedyType[] = [
  "Monetary Penalty",
  // ... existing ...
  "Order Administration",   // NEW — add in logical position
  "Consumer Notification",  // NEW
  "Other",
];

// Locations 3 & 4: scripts/build-provisions.ts and scripts/classify-provisions.ts
// Update the inline `type RemedyType = ...` union to match
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| API-based LLM classification (classify-provisions.ts) | Claude-in-the-loop via Claude Code (no API) | Phase 6 decision | No ANTHROPIC_API_KEY needed; Claude reads files directly |
| All misc provisions bucketed as "Other" | Named categories for enforcement provisions + "Order Administration" for structural | Phase 6 | Provisions tab filter becomes useful |

---

## Open Questions

1. **Exact new RemedyType category names**
   - What we know: Must use legal terminology, match existing granularity, include "Order Administration"
   - What's unclear: The other 4-9 category names are Claude's discretion — to be proposed in Step 1 of the workflow and locked after user review
   - Recommendation: Planning should treat category names as a Wave 1 output (produced by the proposal step), not a pre-determined input. The enum update in Wave 0 should add placeholder names or be done after Step 3 user approval. Simplest: Wave 0 only adds "Order Administration" (certain); remaining names added after user approves the proposal.

2. **Whether build-provisions.ts manifest generation auto-discovers new remedy keys**
   - What we know: `build-provisions.ts` generates shard files by iterating `remedy_types` values found in source data. The manifest keys are derived from this.
   - What's unclear: Whether the UI Provisions tab filter reads from the manifest dynamically or from the `REMEDY_TYPE_OPTIONS` constant
   - Recommendation: Inspect the Provisions tab component to confirm. If it reads `REMEDY_TYPE_OPTIONS`, updating that array is mandatory. If it reads the manifest, the array update is still needed for TypeScript type safety.

3. **Count of mixed-tagged "Other" provisions (remedy_types.length > 1 containing "Other")**
   - What we know: Filter must target `remedy_types.length === 1 && remedy_types[0] === "Other"`
   - What's unclear: How many provisions have mixed tags that include "Other" — these stay untouched
   - Recommendation: The `--propose` script should report both counts: purely-Other (in scope) and mixed-with-Other (out of scope, logged for awareness).

---

## Sources

### Primary (HIGH confidence)
- `src/types/ftc.ts` — canonical RemedyType union, all 10 existing values confirmed
- `src/constants/ftc.ts` — REMEDY_TYPE_OPTIONS array confirmed, UI filter source
- `scripts/classify-provisions.ts` — v1.0 classification pattern: safe write, dry-run flag, idempotency check, prompt builder
- `scripts/build-provisions.ts` (first 80 lines) — inline type duplication pattern confirmed
- `.planning/phases/06-remedy-reclassification/06-CONTEXT.md` — all locked decisions

### Secondary (MEDIUM confidence)
- `.planning/REQUIREMENTS.md` — RMED-01 through RMED-06 requirements
- `.planning/STATE.md` — current project position, no blockers beyond category name finalization

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; existing toolchain fully confirmed
- Architecture: HIGH — all 4 enum locations confirmed by direct codebase read; v1.0 pattern directly usable
- Pitfalls: HIGH — enum sync and array-vs-single pitfalls derived directly from codebase structure
- Category names: LOW — deliberately deferred to the propose workflow; names are a Phase 6 runtime output

**Research date:** 2026-02-26
**Valid until:** 2026-04-26 (stable codebase; no external dependencies)
