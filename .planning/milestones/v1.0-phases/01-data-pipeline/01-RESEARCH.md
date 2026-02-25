# Phase 1: Data Pipeline - Research

**Researched:** 2026-02-24
**Domain:** Offline build pipeline — LLM-driven classification of FTC provision data into static JSON
**Confidence:** HIGH (all findings grounded in direct inspection of the actual codebase and data)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Taxonomy Design**
- Three classification axes maintained: Statutory Topics, Practice Areas, and Remedy Types are separate dimensions — not merged
- Statutory Topics: COPPA, FCRA, GLBA, Health Breach Notification, CAN-SPAM, TCPA (and others surfaced from data)
- Practice Areas: Privacy, Data Security, Deceptive Design / Dark Patterns, AI / Automated Decision-Making, Surveillance (and others surfaced from data)
- Remedy Types: Map from existing structural provision categories (prohibition, affirmative_obligation, assessment, etc.) to substantive remedies (Monetary Penalty, Data Deletion, Comprehensive Security Program, Third-Party Assessment, Algorithmic Destruction, Biometric Ban, Compliance Monitoring, Recordkeeping, Prohibition, Other)
- Multi-topic tagging: A single provision gets ALL applicable topics — shows up in multiple topic views. No primary/secondary distinction.
- Unclassified provisions: Tagged as "Other" — visible and browsable in the library, not hidden

**Classification Logic**
- LLM-driven classification via Claude Code: Spawn a Sonnet agent within Claude Code (user's Max subscription — no API costs) that reads each case JSON and writes topic/remedy/industry tags back into the source files
- One-time batch + incremental: Classify all 293 existing cases once. Future new cases get classified when added to the dataset.
- Sequential processing: One agent processes all cases in sequence, writing tags as it goes
- Tags only: Sonnet adds statutory topics, practice areas, remedy types, and industry sector. No enrichment of summaries or titles — existing data is sufficient.
- Tags written into source JSON files: Classification becomes part of the raw case data in `public/data/ftc-files/`, not a separate mapping file
- Verification: Both output distribution statistics (detect systematic issues) AND manual spot-check of 20-30 cases across different topics and years

**Output File Structure**
- Topic-sharded provision files: Separate JSON files per topic (e.g., `coppa-provisions.json`, `data-security-provisions.json`) rather than one flat file — browser loads only what's needed
- ftc-patterns.json deferred to Phase 5: No pattern detection in this phase.
- Enhanced ftc-cases.json: Each case gains: topic aggregation (all statutory + practice area topics from provisions), remedy summary (all remedy types), industry sector, and provision counts by topic
- All classification at build time: `npm run build:data` reads the tagged source JSONs and produces the sharded provision files + enhanced cases file. No classification logic ships to browser.
- TypeScript interfaces first: Define data shapes in `src/types/` before building the pipeline

**Industry Inference**
- Hierarchical sectors: Broad categories (Technology, Healthcare, Financial Services, Retail, Telecom, Education, Social Media) with nested subsectors (AdTech, HealthTech, Fintech, E-commerce, Mobile Apps, IoT, etc.)
- Multiple sectors per company: A company can be tagged with all applicable sectors
- Same classification pass: Industry sector inferred in the same Claude Code agent run as topic classification

### Claude's Discretion
- Exact prompt design for the Sonnet classification agent
- How to batch the 293 cases within a single sequential run (all at once vs checkpoint-based)
- Exact sharding strategy for provision files (one per statutory topic, or group small topics)
- TypeScript interface naming and organization

### Deferred Ideas (OUT OF SCOPE)
- Cross-case pattern detection (ftc-patterns.json) — Phase 5
- OCR artifact cleanup — future data quality pass
- Fuzzy text similarity for provision language evolution — Phase 5
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PIPE-01 | Build pipeline classifies each provision by statutory topic (COPPA, FCRA, GLBA, Health Breach Notification, CAN-SPAM, TCPA) using legal_authority and complaint fields | legal_authority field is structured and reliable for statutory topics; COPPA=23 cases, FCRA=47, GLBA=15, Health Breach=2, CAN-SPAM=1 — can be rule-matched then LLM-confirmed |
| PIPE-02 | Build pipeline classifies each provision by practice area (Privacy, Data Security, Deceptive Design / Dark Patterns, AI / Automated Decision-Making, Surveillance) | Practice area requires LLM — provision title + summary + complaint.factual_background are the signal; keyword matching fails (67% of cases get "Privacy" under keyword approach) |
| PIPE-03 | Build pipeline tags each provision by remedy type (Monetary Penalty, Data Deletion, Comprehensive Security Program, Third-Party Assessment, Algorithmic Destruction, Biometric Ban, Compliance Monitoring, Recordkeeping, Prohibition, Other) | provision.category is a partial signal; assessment→Third-Party Assessment, recordkeeping→Recordkeeping, monitoring→Compliance Monitoring are reliable; affirmative_obligation (659 provisions) requires LLM to distinguish Security Program vs Monetary Penalty vs Data Deletion |
| PIPE-04 | Build pipeline classifies each case by industry sector inferred from company business_description field | business_description exists on all 293 cases; LLM classification using hierarchical sector taxonomy; same pass as topic classification |
| PIPE-05 | Build pipeline produces denormalized `ftc-provisions.json` flat file with all provisions, topic tags, case context, and citations | 2783 total provisions; estimated 8.9 MB raw / 2.7 MB gzipped for flat file — over 2 MB threshold, supports the sharding decision |
| PIPE-06 | Build pipeline produces `ftc-patterns.json` with cross-case language pattern groups | DEFERRED TO PHASE 5 per CONTEXT.md decisions |
| PIPE-07 | Enhanced `ftc-cases.json` includes provision-level topic aggregations and industry sector per case | Existing ftc-cases.json is 0.34 MB; adding topic arrays + industry sector adds minimal size |
| PIPE-08 | Classification runs entirely at build time — no classification logic ships to the browser | Existing build script pattern (scripts/build-ftc-data.ts via tsx) establishes this correctly |
| PIPE-09 | TypeScript interfaces defined for all new data shapes before pipeline implementation | Existing src/types/ftc.ts has base interfaces; new interfaces extend these |
</phase_requirements>

## Summary

The project has 293 FTC enforcement case files in `public/data/ftc-files/`, each with a consistent 4-key structure (`case_info`, `complaint`, `order`, `metadata`). The `order.provisions` array contains 2,783 total provisions across all cases, with 8 structural category values (`prohibition`, `affirmative_obligation`, `assessment`, `compliance_reporting`, `monitoring`, `recordkeeping`, `acknowledgment`, `duration`). None of the 293 files contain any classification tags yet — all 293 need classification.

The existing build pipeline (`scripts/build-ftc-data.ts`, invoked via `npm run build:ftc-data` using `npx tsx`) reads from a source directory, classifies cases using keyword matching (the `classifyCategories()` function in `src/constants/ftc.ts`), and writes `public/data/ftc-cases.json`. Empirical measurement confirms the keyword-matching problem identified in CONTEXT.md: 67% of all cases get tagged "Privacy / Deceptive Privacy Practices" under the current approach. The existing `classifyCategories()` function must be deprecated.

The classification plan has two distinct granularities. Case-level classification (293 items) determines statutory topics and industry sector from `legal_authority` and `business_description`. Provision-level classification (2,783 items) determines practice areas and remedy types from `provision.category`, `provision.title`, and `provision.summary`. The `affirmative_obligation` category (659 provisions, the largest group) is the hardest to classify — it contains everything from "Civil Penalty" to "Required Information Security Program" to "Disposition of Personal Information" — and genuinely requires LLM judgment rather than rule-based mapping.

**Primary recommendation:** Build the classification agent as a TypeScript script (run via `tsx`) that processes one case file at a time in sequence, writing tags directly into the source JSON files. Implement TypeScript interfaces first, then write the build script (`build:data`) that reads tagged source files and emits sharded provision files and enhanced `ftc-cases.json`. Run the Sonnet classification agent only after interfaces and build script are complete and testable.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| tsx | (via npx, current) | Run TypeScript scripts without compilation | Already in use for `build:ftc-data` script; zero config needed |
| TypeScript | ^5.8.3 | Type safety for data shapes | Already installed; project is full TypeScript |
| Node.js fs | built-in | Read/write JSON files | No library needed for local file I/O |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @anthropic-ai/sdk | (if needed) | Call Claude API from build script | Only if direct API calls are needed for the classification script; not needed if the classification agent is run interactively via Claude Code |
| zod | ^3.25.76 | Runtime validation of data shapes | Already installed; use for build-time validation of source JSON structure |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| tsx for build scripts | ts-node | tsx is already used in the project and is faster |
| Writing tags into source files | Separate classification mapping file | CONTEXT.md decision: tags go into source files |
| Flat provision file | Topic-sharded files | CONTEXT.md decision: sharded; flat file is 8.9 MB raw / 2.7 MB gzipped, confirming sharding is needed |

**Installation:**
```bash
# No new packages required — tsx is already accessible via npx
# The existing devDependencies cover all build-time needs
```

## Architecture Patterns

### Recommended Project Structure
```
scripts/
├── build-ftc-data.ts          # EXISTING — produces ftc-cases.json (to be enhanced)
├── classify-provisions.ts     # NEW — classification agent script (run once)
└── build-provisions.ts        # NEW — reads tagged source files, emits sharded JSONs

src/types/
└── ftc.ts                     # EXISTING — extend with new classification interfaces

public/data/
├── ftc-cases.json             # EXISTING — enhanced with topic/sector fields
├── ftc-files/                 # EXISTING — 293 source files (classification tags added here)
└── provisions/                # NEW — topic-sharded provision files
    ├── coppa-provisions.json
    ├── fcra-provisions.json
    ├── data-security-provisions.json
    └── [topic]-provisions.json
```

### Pattern 1: Classification Tags Written Into Source Files

**What:** The Sonnet classification agent reads each `public/data/ftc-files/XX.json` file and writes classification fields directly into `case_info` (for case-level tags) and into each `order.provisions[N]` object (for provision-level tags).

**When to use:** One-time classification pass and for future incremental additions.

**Source file structure after classification:**
```typescript
// public/data/ftc-files/XX.json — AFTER classification agent runs
{
  case_info: {
    // ... existing fields ...
    statutory_topics: ["GLBA", "TSR"],          // ADDED — case-level
    practice_areas: ["Data Security", "Deceptive Design"],  // ADDED — case-level aggregated
    industry_sectors: ["Financial Services", "Fintech"],    // ADDED — case-level
  },
  order: {
    provisions: [
      {
        provision_number: "I",
        title: "...",
        category: "prohibition",        // EXISTING
        statutory_topics: ["GLBA"],     // ADDED — provision-level
        practice_areas: ["Data Security"],        // ADDED — provision-level
        remedy_types: ["Prohibition"],  // ADDED — provision-level
        // ... existing fields ...
      }
    ]
  }
}
```

### Pattern 2: Deterministic Remedy Type Mapping (Rule-Based First)

**What:** Most remedy types can be determined from `provision.category` alone without LLM. Map these first; use LLM only for the ambiguous `affirmative_obligation` category.

**Reliable rule-based mappings (covering ~2124 of 2783 provisions):**
```typescript
const CATEGORY_TO_REMEDY: Record<string, string[]> = {
  assessment:          ["Third-Party Assessment"],
  compliance_reporting: ["Compliance Monitoring"],
  monitoring:          ["Compliance Monitoring"],
  recordkeeping:       ["Recordkeeping"],
  acknowledgment:      ["Recordkeeping"],  // or "Other"
  duration:            ["Other"],
};
// prohibition -> ["Prohibition"] UNLESS title contains "facial recognition", "biometric", "algorithmic" etc
// affirmative_obligation -> REQUIRES LLM (659 provisions, heterogeneous)
```

### Pattern 3: Checkpoint-Based Sequential Processing

**What:** The classification agent writes tags to each source file immediately after classifying it, not in a batch at the end. This allows resuming from any interruption.

**When to use:** For the 293-case classification pass.

```typescript
// In classify-provisions.ts (pseudocode pattern)
for (const file of caseFiles) {
  const data = readJSON(file);

  // Skip if already classified (idempotent)
  if (data.case_info.statutory_topics !== undefined) {
    console.log(`Skipping (already classified): ${file}`);
    continue;
  }

  // Classify: call Claude agent or apply rules
  const tags = await classifyCase(data);

  // Write immediately — don't buffer
  writeJSON(file, { ...data, case_info: { ...data.case_info, ...tags.caseLevel },
    order: { ...data.order, provisions: data.order.provisions.map((p, i) => ({
      ...p, ...tags.provisionLevel[i]
    })) }
  });

  console.log(`Classified: ${file}`);
}
```

### Pattern 4: Two-Script Architecture (Classify Then Build)

**What:** Keep classification logic separate from build logic. The classification agent script writes tags into source files. The build script reads tagged source files and produces output JSON. This separation makes testing easier.

**Two scripts, two purposes:**
```
classify-provisions.ts   → reads source files → writes tags into source files
build-provisions.ts      → reads tagged source files → writes sharded provision JSON files
                           (also updates build-ftc-data.ts to add new fields to ftc-cases.json)
```

### Anti-Patterns to Avoid

- **Writing classification tags into a separate mapping file:** CONTEXT.md decision is to write into source files. A separate map file would require joining at build time and is harder to spot-check.
- **Running LLM on every provision individually via API:** The Sonnet agent in Claude Code can process an entire case file (avg 9.5 provisions) in one prompt — sending 2,783 individual API calls is unnecessary.
- **Re-classifying already-tagged files:** The agent must check for existing tags and skip classified files (idempotent behavior enables safe reruns).
- **Producing a single flat ftc-provisions.json:** At 8.9 MB raw / 2.7 MB gzipped, it exceeds the ~2 MB threshold. Sharded files are required.
- **Doing classification in the browser:** PIPE-08 is an explicit hard requirement. No classification logic in any React component or hook.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| TypeScript execution in Node | Custom tsc-then-node pipeline | `npx tsx scripts/foo.ts` | Already the project pattern; tsx handles ESM + paths correctly |
| JSON schema validation | Custom type-checking code | `zod` (already installed) | Validates at runtime, catches malformed source files before classification |
| Statistical sampling for verification | Custom random-picker | `Math.random()` with seed OR just pick every Nth file | Verification is a manual spot-check, not statistical testing |
| Practice area detection for Section 5 cases | Complex keyword scoring | LLM via Claude Code agent | 246 of 293 cases are Section 5 only — complaint.factual_background + provision titles are the only signals, and keyword matching fails |

**Key insight:** The classification problem for Section 5-only cases (84% of the dataset) is genuine NLP — the same legal phrases appear across different practice areas depending on context. Keyword matching was tried (current `classifyCategories()`) and produces 67% Privacy tagging, which is useless for a provisions library organized by topic.

## Common Pitfalls

### Pitfall 1: Statutory Topic Mismatch Between Case-Level and Provision-Level

**What goes wrong:** Case is tagged with COPPA at the case level, but individual provisions inside that case are tagged with a different topic, causing cross-joins to produce wrong results in the provisions library.

**Why it happens:** Statutory topics are determined from `case_info.legal_authority` (case level). Provisions don't all enforce the same statute — one GLBA case might have provisions for both GLBA safeguards and Section 5 general requirements.

**How to avoid:** Case-level `statutory_topics` should be the UNION of all provision-level `statutory_topics` arrays. Generate case-level aggregation from provision-level tags, not independently.

**Warning signs:** Case is tagged COPPA but no individual provision in that case is tagged COPPA.

### Pitfall 2: "Privacy" Swallowing Everything

**What goes wrong:** The new LLM classification reproduces the same problem as keyword matching — nearly every case gets tagged "Privacy" because the word "personal information" appears in almost every consent order.

**Why it happens:** "Privacy" as a practice area is vague. An FTC enforcement action about COPPA is not the same as one about deceptive privacy policies, even though both use privacy language.

**How to avoid:** Define "Privacy / Deceptive Privacy Practices" narrowly in the agent prompt: reserved for cases where the PRIMARY violation is misrepresentation about privacy practices — NOT for cases where privacy is incidental to data security, COPPA, FCRA, etc. Check: if a case has a specific statutory topic (COPPA, FCRA, GLBA), its primary practice area should reflect that statute's domain, not "Privacy" generically.

**Warning signs:** Verification shows more than 50% of provisions tagged "Privacy / Deceptive Privacy Practices" — that was the old keyword failure mode.

### Pitfall 3: PIPE-06 Confusion (Patterns Deferred)

**What goes wrong:** REQUIREMENTS.md lists PIPE-06 as "Build pipeline produces ftc-patterns.json" — a planner might try to implement this in Phase 1.

**Why it happens:** PIPE-06 is in the Phase 1 requirements list in REQUIREMENTS.md but CONTEXT.md explicitly defers it to Phase 5.

**How to avoid:** PIPE-06 is explicitly OUT OF SCOPE for Phase 1 per CONTEXT.md. The plan must acknowledge PIPE-06 as deferred and note it will be addressed in Phase 5.

**Warning signs:** Any plan task that mentions "pattern detection" or "ftc-patterns.json" in Phase 1.

### Pitfall 4: affirmative_obligation Remedy Mapping Ambiguity

**What goes wrong:** A provision with `category: "affirmative_obligation"` is assigned a single remedy type when it should be mapped more specifically (Civil Penalty ≠ Data Deletion ≠ Security Program).

**Why it happens:** `affirmative_obligation` is the catch-all for everything from monetary judgments to data deletion orders to security program requirements. It is the largest provision category at 659 provisions.

**How to avoid:** The LLM classification prompt must instruct the agent to examine `provision.title` and `provision.summary` — not just `provision.category` — when assigning remedy types to `affirmative_obligation` provisions. The title "Civil Penalty" → Monetary Penalty, "Disposition of Personal Information" → Data Deletion, "Required Information Security Program" → Comprehensive Security Program.

**Warning signs:** All `affirmative_obligation` provisions end up tagged "Other".

### Pitfall 5: Source File Corruption During Classification

**What goes wrong:** The classification agent overwrites a source file with malformed JSON (interrupted write, serialization error), corrupting the dataset.

**Why it happens:** Writing back to source files is risky — if `JSON.stringify` is called on a partially-constructed object or if the process is interrupted mid-write, the file is corrupted.

**How to avoid:** Write to a temp file first, validate the JSON, then rename to the final path. Pattern: `writeFileSync(file + '.tmp', JSON.stringify(data, null, 2)); renameSync(file + '.tmp', file)`.

**Warning signs:** Source file that used to parse successfully now throws a JSON parse error.

### Pitfall 6: Build Script Command Name Mismatch

**What goes wrong:** The phase success criteria require `npm run build:data` but the existing script is `build:ftc-data`.

**Why it happens:** The success criteria (from the phase objective) use `npm run build:data` while the existing `package.json` uses `build:ftc-data`.

**How to avoid:** Either add a `build:data` alias that runs both `build:ftc-data` and `build:provisions` scripts, or rename consistently. The plan must be explicit about what the final command is called.

**Warning signs:** `npm run build:data` returns "missing script" error.

## Code Examples

### TypeScript Interface Extensions

```typescript
// src/types/ftc.ts — new interfaces to add

export type StatutoryTopic =
  | "COPPA"
  | "FCRA"
  | "GLBA"
  | "Health Breach Notification"
  | "CAN-SPAM"
  | "TCPA"
  | "TSR"
  | "Section 5 Only";

export type PracticeArea =
  | "Privacy"
  | "Data Security"
  | "Deceptive Design / Dark Patterns"
  | "AI / Automated Decision-Making"
  | "Surveillance"
  | "Financial Practices"
  | "Telemarketing"
  | "Other";

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
  | "Other";

export type IndustrySector =
  | "Technology"
  | "Healthcare"
  | "Financial Services"
  | "Retail"
  | "Telecom"
  | "Education"
  | "Social Media"
  | "Other";

// Enhanced provision (written into source files + used in output shards)
export interface ClassifiedProvision {
  provision_number: string;
  title: string;
  category: string;                    // existing structural category
  summary: string;
  requirements: ProvisionRequirement[];
  statutory_topics: StatutoryTopic[];  // NEW
  practice_areas: PracticeArea[];      // NEW
  remedy_types: RemedyType[];          // NEW
}

// Enhanced case_info (written into source files)
export interface ClassifiedCaseInfo {
  // ... all existing case_info fields ...
  statutory_topics: StatutoryTopic[];  // NEW — aggregated from provisions
  practice_areas: PracticeArea[];      // NEW — aggregated from provisions
  industry_sectors: IndustrySector[];  // NEW
}

// Denormalized provision record (in topic-sharded output files)
export interface ProvisionRecord {
  provision_number: string;
  title: string;
  category: string;
  summary: string;
  requirements: ProvisionRequirement[];
  statutory_topics: StatutoryTopic[];
  practice_areas: PracticeArea[];
  remedy_types: RemedyType[];
  // Denormalized case context
  case_id: string;
  company_name: string;
  date_issued: string;
  year: number;
  administration: string;
  legal_authority: string;
  ftc_url?: string;
  docket_number: string;
}

// Topic shard file structure
export interface ProvisionShardFile {
  topic: string;                       // e.g., "coppa" or "data-security"
  generated_at: string;
  total_provisions: number;
  provisions: ProvisionRecord[];
}

// Enhanced FTCCaseSummary (ftc-cases.json)
export interface EnhancedFTCCaseSummary extends FTCCaseSummary {
  statutory_topics: StatutoryTopic[];
  practice_areas: PracticeArea[];
  industry_sectors: IndustrySector[];
  remedy_types: RemedyType[];
  provision_counts_by_topic: Record<string, number>;
}
```

### Remedy Type Rule-Based Mapping

```typescript
// Deterministic mappings (no LLM needed for these)
const CATEGORY_REMEDY_MAP: Record<string, RemedyType[]> = {
  assessment:          ["Third-Party Assessment"],
  compliance_reporting: ["Compliance Monitoring"],
  monitoring:          ["Compliance Monitoring"],
  recordkeeping:       ["Recordkeeping"],
  acknowledgment:      ["Recordkeeping"],
  duration:            ["Other"],
  // 'prohibition' and 'affirmative_obligation' require title inspection
};

function getRemedyTypesFromCategory(
  category: string,
  title: string
): RemedyType[] | null {
  if (CATEGORY_REMEDY_MAP[category]) {
    return CATEGORY_REMEDY_MAP[category];
  }
  // Prohibition: check for specialized types
  if (category === "prohibition") {
    const t = title.toLowerCase();
    if (t.includes("facial recognition") || t.includes("biometric ban"))
      return ["Biometric Ban"];
    if (t.includes("algorithm") || t.includes("model destruction"))
      return ["Algorithmic Destruction"];
    return ["Prohibition"];
  }
  // affirmative_obligation: needs LLM
  return null;
}
```

### Checkpoint-Based File Writer

```typescript
// Safe write pattern for classification agent
import { writeFileSync, renameSync, existsSync } from "fs";

function writeJSONSafe(filePath: string, data: unknown): void {
  const tmp = filePath + ".tmp";
  const serialized = JSON.stringify(data, null, 2);
  // Validate before writing
  JSON.parse(serialized); // throws if invalid
  writeFileSync(tmp, serialized, "utf-8");
  renameSync(tmp, filePath);
}

function isAlreadyClassified(data: CaseFile): boolean {
  return data.case_info?.statutory_topics !== undefined;
}
```

### Build Script Invocation Pattern

```bash
# package.json scripts (to add)
"build:classify": "npx tsx scripts/classify-provisions.ts",
"build:provisions": "npx tsx scripts/build-provisions.ts",
"build:data": "npm run build:ftc-data && npm run build:provisions"
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Keyword matching for categories | LLM-driven classification | Phase 1 | Eliminates the 67% "Privacy" false-positive rate |
| Single ftc-cases.json output | ftc-cases.json + per-topic provision shards | Phase 1 | Browser loads only relevant topic, not 8.9 MB flat file |
| Categories derived from keywords | Tags written into source JSON at classification time | Phase 1 | Classification is auditable, one source of truth per file |
| classifyCategories() in constants | Deprecated function (kept for reference) | Phase 1 | Build pipeline no longer calls it |

**Deprecated/outdated:**
- `classifyCategories()` in `src/constants/ftc.ts`: Keyword-based, produces 67% Privacy rate; to be deprecated after LLM classification is complete
- `categories` field on `FTCCaseSummary`: Replaced by `statutory_topics` + `practice_areas`; existing groupings in ftc-cases.json use this — needs migration strategy

## Open Questions

1. **PIPE-06 scope reconciliation**
   - What we know: REQUIREMENTS.md lists PIPE-06 under Phase 1; CONTEXT.md defers it to Phase 5
   - What's unclear: Whether the plan should explicitly mark PIPE-06 as "Out of scope — Phase 5" or simply not mention it
   - Recommendation: Plan includes one task explicitly noting PIPE-06 is deferred to Phase 5 per user decision; no work done on it

2. **Taxonomy axis count (2 vs 3)**
   - What we know: STATE.md flags "Taxonomy axis count (2 vs 3) is unresolved" but CONTEXT.md locks in THREE axes (Statutory + Practice Area + Remedy Type)
   - What's unclear: The STATE.md concern predates CONTEXT.md; CONTEXT.md is more recent and authoritative
   - Recommendation: Treat CONTEXT.md as the final decision: three axes are locked. The STATE.md concern is resolved.

3. **Flat file vs sharding threshold**
   - What we know: Flat ftc-provisions.json is 8.9 MB raw / 2.7 MB gzipped; CONTEXT.md locks in topic-sharded approach
   - What's unclear: Topic shard for "Privacy/Data Security" practice area could still be 5.3 MB raw / 1.6 MB gzipped (worst case)
   - Recommendation: After first classification run, measure actual shard sizes. If Privacy/Data Security shard exceeds 2 MB gzipped, sub-shard by year or combine less-used topics. The build script should report shard sizes during build.

4. **Backward compatibility of ftc-cases.json**
   - What we know: Existing code reads `case.categories` from ftc-cases.json for analytics display
   - What's unclear: Whether to keep `categories` field alongside new `statutory_topics`/`practice_areas`, or remove it
   - Recommendation: Keep `categories` field populated (by mapping from new fields) for backward compatibility during Phase 1. Phase 2 analytics work will migrate components to use new fields.

5. **Classification agent as TypeScript script vs interactive Claude session**
   - What we know: CONTEXT.md says "Spawn a Sonnet agent within Claude Code (user's Max subscription — no API costs)"
   - What's unclear: Does this mean an interactive Claude Code session running `/agent` commands, or a script that calls the Anthropic API?
   - Recommendation: The classification agent should be a TypeScript script (`classify-provisions.ts`) that uses Claude Code's `run_with_bash` pattern — a shell script that invokes `claude -p "prompt" --input-format json` for each case file. This avoids embedding API keys and uses the Max subscription. Alternatively, a manual interactive session works for one-time classification.

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection — all data from actual files in the project repository
  - `scripts/build-ftc-data.ts` — existing build pipeline, confirmed working
  - `src/types/ftc.ts` — existing TypeScript interfaces
  - `src/constants/ftc.ts` — existing `classifyCategories()` and `CATEGORY_RULES`
  - `public/data/ftc-files/*.json` — all 293 source files inspected programmatically
  - `public/data/ftc-cases.json` — existing output file (0.34 MB, 285 cases)
  - `package.json` — existing scripts and dependencies

### Secondary (MEDIUM confidence)
- CONTEXT.md — user decisions from `/gsd:discuss-phase` session (2026-02-24)
- STATE.md — accumulated project decisions and blockers

### Tertiary (LOW confidence)
- None — all findings are from direct data inspection; no web search was needed

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in package.json; build pattern already established
- Architecture: HIGH — derived from actual data measurements (2783 provisions, 8.9 MB flat file size, category distribution, etc.)
- Classification strategy: HIGH — empirical confirmation that keyword matching fails (67% Privacy rate) from querying actual ftc-cases.json output
- Pitfalls: HIGH — all pitfalls derived from direct data inspection, not speculation

**Research date:** 2026-02-24
**Valid until:** 2026-05-24 (stable — no external dependencies, all internal data)
