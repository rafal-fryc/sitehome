# Phase 9: Key Takeaways - Research

**Researched:** 2026-03-01
**Domain:** Build-time LLM text generation pipeline + React UI integration for case summaries
**Confidence:** HIGH

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Brief takeaway (card):** One sentence, ~15-25 words, focuses only on what the business did wrong (violation). Does not mention the remedy.
- **Full takeaway (panel):** Short paragraph, 2-3 sentences, covers what went wrong AND what the FTC ordered (violation + remedy).
- **Tone:** Practitioner plain English -- direct, factual, no legalese. Accessible to non-lawyers but not dumbed down.
- **Generation approach:** LLM-generated at build time, following the existing `classify-provisions.ts` pipeline pattern (Anthropic SDK, dry-run support)
- **Input fields:** Full context -- `complaint.factual_background`, `complaint.representations_made`, provision titles/summaries, `legal_authority`, `violation_type`, `complaint_counts`
- **Storage:** Add `takeaway_brief` and `takeaway_full` fields directly to each `public/data/ftc-files/{case}.json` file
- **Dry-run validation (TAKE-05):** Run on 10 representative sample cases before full batch -- sample selection is Claude's discretion
- **Card (brief takeaway):** Inline subtle badge with text "AI-generated" next to the takeaway sentence
- **Panel (full takeaway):** Italic disclaimer line below the paragraph: "AI-generated from structured case data"
- **Per-takeaway labeling only** -- no global page-level disclaimer or banner needed
- **CaseCard:** Replace the current "X provisions" line with the brief takeaway text + AI-generated badge. If no takeaway exists, fall back to showing the provision count.
- **CaseProvisionsSheet:** Full takeaway paragraph appears in the SheetHeader, below the metadata line (year | violation | provisions), above the divider. Italic disclaimer follows.
- **Tab scope:** Claude determines which tabs have case-level displays that should show takeaways (Industry tab CaseCard is confirmed; others audited during planning)

### Claude's Discretion
- Dry-run sample case selection (representative mix of violation types, industries, complexity)
- Which tabs beyond Industry need takeaway integration
- Exact prompt engineering for the LLM generation script
- Badge styling and typography details

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TAKE-01 | Pipeline generates "what the business did wrong" summaries from complaint data at build time | Script pattern from classify-provisions.ts; Anthropic SDK 0.78.0 already installed; complaint data available in 292/293 cases |
| TAKE-02 | Brief takeaway visible on case cards across all relevant tabs | CaseCard component identified; tab audit shows only Industry tab uses CaseCard; Analytics tab uses FTCCaseTable (no takeaway display); `takeaway_brief` must be in ftc-cases.json for card access |
| TAKE-03 | Full takeaway displayed on case detail view | CaseProvisionsSheet already loads full case file via useCaseFile hook; `takeaway_full` stored in ftc-files/{case}.json is already accessible |
| TAKE-04 | Generation constrained to structured fields to prevent hallucination | Prompt engineering patterns documented; input fields verified in case JSON structure |
| TAKE-05 | Dry-run validation on 10 sample cases before full batch generation | classify-provisions.ts `--dry-run` pattern (first N files); recommend custom sample selection for representative coverage |

</phase_requirements>

## Summary

This phase adds LLM-generated plain-language summaries to FTC case cards and the provisions panel. The work has two distinct layers: (1) a build-time script that generates takeaway text for all 293 case files, and (2) UI changes to display those takeaways in CaseCard and CaseProvisionsSheet components.

The project already has a proven LLM pipeline pattern in `scripts/classify-provisions.ts` using `@anthropic-ai/sdk` v0.78.0. That script processes case files sequentially, calls Claude Sonnet via the Messages API, parses JSON output, and writes results back to source files with atomic write safety. The takeaway script should follow this pattern closely but with key differences: it produces natural language text (not structured JSON), uses richer input data (complaint context, not just provisions), and needs a more carefully engineered prompt to prevent hallucination.

The UI layer is straightforward. CaseCard currently shows a provision count line that gets replaced with takeaway text plus an AI-generated badge. CaseProvisionsSheet already loads the full case JSON via the `useCaseFile` hook, so `takeaway_full` is automatically available. The one data pipeline consideration is that `takeaway_brief` must be propagated to `ftc-cases.json` (the aggregate index) so CaseCard can display it without fetching individual case files -- this follows the same pattern used for `statutory_topics`, `practice_areas`, etc.

**Primary recommendation:** Follow the classify-provisions.ts pattern exactly for the generation script, with a carefully scoped prompt that restricts the LLM to factual claims derivable from structured data fields. Propagate `takeaway_brief` into ftc-cases.json via build-ftc-data.ts.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @anthropic-ai/sdk | 0.78.0 | LLM API calls for takeaway generation | Already installed as devDependency; proven in classify-provisions.ts |
| tsx | (via npx) | TypeScript script runner | Established pattern for all build scripts in this project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tanstack/react-query | 5.83.0 | Data fetching for case files | Already used by useCaseFile hook; takeaway_full loads via existing query |
| class-variance-authority | 0.7.1 | Badge variant styling | Used by existing Badge component for AI-generated label |
| lucide-react | 0.462.0 | Icons (if badge needs an icon) | Already available; SparkleIcon or similar for AI badge |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| LLM generation | Template-based string interpolation | Templates can't produce natural-sounding summaries from variable complaint structures; LLM is justified here |
| Storing in case JSON | Separate takeaways.json file | Adds complexity; per-case JSON storage matches existing pattern (classify-provisions wrote to same files) |

**Installation:**
```bash
# No new packages needed -- all dependencies already installed
```

## Architecture Patterns

### Recommended Project Structure
```
scripts/
  generate-takeaways.ts       # New: LLM takeaway generation pipeline
public/data/
  ftc-cases.json               # Modified: add takeaway_brief to each case
  ftc-files/{case}.json        # Modified: add takeaway_brief + takeaway_full
src/
  types/ftc.ts                 # Modified: add optional takeaway fields to types
  components/ftc/industry/
    CaseCard.tsx               # Modified: show takeaway instead of provision count
    CaseProvisionsSheet.tsx    # Modified: show full takeaway in SheetHeader
```

### Pattern 1: Sequential LLM Pipeline with Idempotency
**What:** Process case files one at a time, skip already-processed files, write back atomically.
**When to use:** Always -- this is the established pattern from classify-provisions.ts.
**Example:**
```typescript
// Source: scripts/classify-provisions.ts (existing codebase)
function isAlreadyProcessed(caseData: any): boolean {
  return caseData?.takeaway_brief !== undefined;
}

// Atomic write: temp file -> validate JSON -> rename
function writeJSONSafe(filePath: string, data: unknown): void {
  const tmp = filePath + ".tmp";
  const serialized = JSON.stringify(data, null, 2);
  JSON.parse(serialized); // throws if invalid
  writeFileSync(tmp, serialized, "utf-8");
  renameSync(tmp, filePath);
}
```

### Pattern 2: Prompt Engineering for Factual Grounding (TAKE-04)
**What:** System prompt that explicitly constrains LLM output to facts derivable from input fields, with explicit prohibitions on fabrication.
**When to use:** Critical for TAKE-04 compliance.
**Example:**
```typescript
function buildTakeawayPrompt(caseData: any): string {
  const caseInfo = caseData.case_info ?? {};
  const complaint = caseData.complaint ?? {};
  const provisions = caseData.order?.provisions ?? [];

  const provisionTitles = provisions
    .map((p: any) => `- ${p.title}`)
    .join("\n");

  const countTitles = (complaint.counts ?? [])
    .map((c: any) => `- ${c.title}`)
    .join("\n");

  const representationDescs = (complaint.representations_made ?? [])
    .map((r: any) => `- ${r.description}`)
    .join("\n");

  return `You are summarizing an FTC enforcement action for legal practitioners.

CASE DATA:
  Company: ${caseInfo.company?.name ?? "Unknown"}
  Year: ${caseInfo.case_date?.year ?? "Unknown"}
  Violation type: ${caseInfo.violation_type ?? "Unknown"}
  Legal authority: ${caseInfo.legal_authority ?? "Unknown"}

COMPLAINT BACKGROUND:
${complaint.factual_background || "Not available."}

REPRESENTATIONS MADE:
${representationDescs || "None listed."}

COMPLAINT COUNTS:
${countTitles || "None listed."}

ORDER PROVISION TITLES:
${provisionTitles || "None listed."}

INSTRUCTIONS:
Generate two summaries of this case.

1. "brief": One sentence (15-25 words) describing ONLY what the business did wrong.
   - Focus on the violation, not the remedy.
   - Use plain practitioner English -- direct and factual.
   - Example style: "Charged consumers without consent using dark patterns and retaliated against chargeback disputes."

2. "full": A short paragraph (2-3 sentences) covering what went wrong AND what the FTC ordered.
   - First sentence: what the business did wrong.
   - Remaining sentences: what the FTC required (drawn from provision titles).
   - Plain English, no legalese.

CRITICAL CONSTRAINTS:
- ONLY state facts that are directly derivable from the data above.
- Do NOT invent specific dollar amounts, dates, or statute section numbers unless they appear in the data.
- Do NOT name statutes not listed in the legal authority field.
- Do NOT speculate about consumer harm beyond what the complaint describes.
- If data is sparse, write a shorter, more general summary rather than fabricating details.

Return ONLY valid JSON:
{
  "brief": "...",
  "full": "..."
}`;
}
```

### Pattern 3: Brief Takeaway in Aggregate Index
**What:** Copy `takeaway_brief` from individual case files into `ftc-cases.json` during the build pipeline, so CaseCard can display it without fetching individual case files.
**When to use:** Required -- CaseCard renders from `EnhancedFTCCaseSummary` which comes from `ftc-cases.json`.
**Example:**
```typescript
// In build-ftc-data.ts processFile(), read takeaway_brief from classified file:
const takeaway_brief: string | undefined = classifiedData?.takeaway_brief ?? undefined;

// Include in return object:
return {
  // ... existing fields ...
  takeaway_brief,  // undefined if not yet generated
};
```

### Pattern 4: Graceful Fallback in UI
**What:** CaseCard falls back to provision count when no takeaway exists.
**When to use:** During transition period and for the 1 case with no complaint data.
**Example:**
```typescript
// CaseCard.tsx
{caseData.takeaway_brief ? (
  <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
    <span>{caseData.takeaway_brief}</span>
    <Badge variant="outline" className="text-[9px] px-1 py-0 font-normal text-muted-foreground/60">
      AI-generated
    </Badge>
  </div>
) : (
  <div className="text-xs text-muted-foreground mt-0.5">
    {provisionCount} provision{provisionCount !== 1 ? "s" : ""}
  </div>
)}
```

### Anti-Patterns to Avoid
- **Runtime LLM calls:** Never call the Anthropic API at page render time. All generation is build-time only.
- **Storing takeaways in a separate file:** Adds unnecessary complexity. Store directly in case JSON files, matching the classify-provisions pattern.
- **Unscoped LLM prompts:** Prompts without explicit constraints on what NOT to say lead to hallucinated dollar amounts, statute names, and dates. Always include negative constraints.
- **Trusting the LLM to self-limit length:** Always set `max_tokens` conservatively and validate output length programmatically.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| LLM API integration | Custom HTTP calls to Anthropic API | `@anthropic-ai/sdk` Messages API | Already installed, handles auth, retries, streaming; proven in classify-provisions.ts |
| Atomic file writes | Direct writeFileSync | writeJSONSafe pattern (tmp + rename) | Prevents file corruption on script failure mid-write |
| Badge component | Custom styled span | Existing `Badge` from `src/components/ui/badge.tsx` | CVA-based, already used throughout project for inline labels |

**Key insight:** The entire pipeline pattern is already built and proven. This phase is an adaptation, not an invention. Follow classify-provisions.ts structure and adjust the prompt and output parsing.

## Common Pitfalls

### Pitfall 1: Hallucinated Dollar Amounts and Dates
**What goes wrong:** LLM generates specific dollar amounts ("$5.7 million penalty"), statute section numbers, or dates not present in the input data.
**Why it happens:** LLMs draw on training data about well-known FTC cases and fill in details from memory rather than input.
**How to avoid:** Explicit prompt constraint: "Do NOT invent specific dollar amounts, dates, or statute section numbers unless they appear in the data." Post-generation validation: flag outputs containing dollar signs or specific dates for manual review.
**Warning signs:** Outputs that are suspiciously specific compared to the input data.

### Pitfall 2: Brief Takeaway Not in Aggregate Index
**What goes wrong:** Takeaway text is stored in individual case files but not propagated to `ftc-cases.json`, so CaseCard shows fallback (provision count) even after generation.
**Why it happens:** Forgetting that CaseCard renders from the aggregate index, not individual case files.
**How to avoid:** Modify `build-ftc-data.ts` to read `takeaway_brief` from classified case files and include it in the output. Add `takeaway_brief` to `FTCCaseSummary` / `EnhancedFTCCaseSummary` types.
**Warning signs:** Takeaways appear in the panel (CaseProvisionsSheet) but not on cards.

### Pitfall 3: Cases Without Complaint Data
**What goes wrong:** 1 case (`ntt_global_data_centers_americas`) has empty complaint fields. 12 cases have no `representations_made`. 3 cases have no `counts`.
**Why it happens:** Not all FTC cases have fully structured complaint data in the source files.
**How to avoid:** Handle gracefully in prompt construction: if `factual_background` is empty, generate from provision titles and legal authority alone (shorter, more general summary). Never crash or skip -- always produce a takeaway, even if generic.
**Warning signs:** Script errors or empty takeaways for specific cases.

### Pitfall 4: TypeScript Type Mismatch After Adding Fields
**What goes wrong:** Adding `takeaway_brief` to `FTCCaseSummary` type causes build errors because existing data doesn't have the field.
**Why it happens:** Making the field required when it should be optional during the transition.
**How to avoid:** Always make new fields optional: `takeaway_brief?: string`. Both in `FTCCaseSummary` and `EnhancedFTCCaseSummary`. The build-ftc-data script should include the field only if it exists.
**Warning signs:** TypeScript compilation errors after type changes.

### Pitfall 5: Inconsistent Tone Across 293 Cases
**What goes wrong:** Early cases sound different from later cases due to LLM temperature or prompt sensitivity.
**Why it happens:** Variable complaint data richness leads to variable output quality.
**How to avoid:** Set temperature to 0 for deterministic output. Include concrete examples in the prompt (few-shot). Dry-run on 10 diverse cases and manually review tone consistency before full batch.
**Warning signs:** Some takeaways sound clinical while others sound conversational.

### Pitfall 6: Overlong Takeaways Breaking Card Layout
**What goes wrong:** Some "brief" takeaways exceed 25 words, causing CaseCard to overflow or wrap awkwardly.
**Why it happens:** LLM doesn't strictly respect word count constraints.
**How to avoid:** Post-generation validation that warns on briefs exceeding 30 words. Programmatic word count check. CSS `line-clamp-2` as a safety net.
**Warning signs:** CaseCards with varying heights in the list.

## Code Examples

### Dry-Run with Custom Sample Selection (TAKE-05)
```typescript
// Source: derived from classify-provisions.ts pattern
const DRY_RUN = process.argv.includes("--dry-run");
const SAMPLE_SIZE = 10;

// Representative sample: mix of violation types, industries, and data richness
const SAMPLE_IDS = [
  "12.25_disney",                     // COPPA, Technology, recent
  "07.19_equifax",                    // Data security, Financial Services, complex
  "01.05_assail",                     // TSR/GLBA, old, rich complaint data
  "12.24_gravy_analytics",            // Surveillance, recent
  "10.20_ntt_global_data_centers_americas", // Edge case: no factual_background
  // ... 5 more selected during implementation
];

const filesToProcess = DRY_RUN
  ? files.filter(f => SAMPLE_IDS.some(id => f.startsWith(id)))
  : files;
```

### CaseProvisionsSheet Full Takeaway Integration
```typescript
// In CaseProvisionsSheet.tsx SheetHeader, after SheetDescription, before divider:
{data?.takeaway_full && (
  <div className="mt-3 space-y-1">
    <p className="text-sm text-foreground font-garamond leading-relaxed">
      {data.takeaway_full}
    </p>
    <p className="text-xs text-muted-foreground italic font-garamond">
      AI-generated from structured case data
    </p>
  </div>
)}
```

### Type Extensions
```typescript
// In src/types/ftc.ts
export interface FTCCaseSummary {
  // ... existing fields ...
  takeaway_brief?: string;  // AI-generated brief (for card display)
}

// EnhancedFTCCaseSummary extends FTCCaseSummary, so inherits takeaway_brief
```

### Build-ftc-data.ts Integration
```typescript
// In build-ftc-data.ts processFile(), after reading classifiedData:
const takeaway_brief: string | undefined = classifiedData?.takeaway_brief ?? undefined;

// In the return statement:
return {
  // ... existing fields ...
  ...(takeaway_brief ? { takeaway_brief } : {}),
};
```

## Tab Audit: Where Takeaways Should Appear

Based on codebase analysis of all 4 tabs:

| Tab | Component | Shows Individual Cases? | Uses CaseCard? | Takeaway Display? |
|-----|-----------|------------------------|-----------------|-------------------|
| Analytics | FTCAnalyticsTab | No (charts + aggregates) | No | No -- not applicable |
| Provisions | FTCProvisionsTab | No (provision-level, not case-level) | No | No -- not applicable |
| Industries | FTCIndustryTab > SectorDetail > CaseCardList > CaseCard | Yes | Yes | **Yes -- CaseCard + CaseProvisionsSheet** |
| Patterns | FTCPatternsTab | Variant-level (shows case references in PatternRow/VariantCard) | No | No -- shows provision variants, not case summaries |

**Recommendation:** Only the Industry tab needs takeaway integration. The Analytics tab shows aggregate charts, the Provisions tab shows individual provisions (not cases), and the Patterns tab shows provision variants with case references but not full case cards. This aligns with the CONTEXT.md confirmation that "Industry tab CaseCard is confirmed."

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| classify-provisions.ts model: "claude-sonnet-4-5" | Same model works for takeaway generation | Current | Use claude-sonnet-4-5 for consistency |
| Manual case summaries | LLM-generated at build time | This phase | Enables scalable summary generation for 293 cases |

**Deprecated/outdated:**
- None relevant -- the Anthropic SDK pattern used in this project is current.

## Open Questions

1. **Output validation granularity**
   - What we know: We need to prevent hallucinated dollar amounts and dates (TAKE-04).
   - What's unclear: How strict should automated validation be? Should we regex-check for `$` signs, specific dates, or just rely on prompt engineering?
   - Recommendation: Implement a simple post-generation check that logs warnings (not blocks) for outputs containing `$`, specific dates, or statute section numbers not present in input. This flags for manual review without blocking the pipeline.

2. **Cases with minimal complaint data**
   - What we know: 1 case has empty factual_background, 12 have no representations_made, 3 have no counts.
   - What's unclear: Whether the LLM can produce useful takeaways from provision titles and legal authority alone.
   - Recommendation: The dry-run should include the `ntt_global_data_centers_americas` edge case. If the result is poor, add a special handling path that generates from provision titles only.

3. **Re-running build-ftc-data.ts after generation**
   - What we know: `takeaway_brief` must be in `ftc-cases.json` for CaseCard display.
   - What's unclear: Whether the generation script should call build-ftc-data.ts automatically or leave it as a manual step.
   - Recommendation: Keep it manual -- the developer runs `generate-takeaways.ts` then `npm run build:data` to rebuild the aggregate index. Document this in script comments. Consistent with existing workflow.

## Sources

### Primary (HIGH confidence)
- `scripts/classify-provisions.ts` -- Direct codebase inspection of existing LLM pipeline pattern
- `src/components/ftc/industry/CaseCard.tsx` -- Codebase inspection of current card layout
- `src/components/ftc/industry/CaseProvisionsSheet.tsx` -- Codebase inspection of panel layout
- `src/types/ftc.ts` -- Codebase inspection of type definitions
- `scripts/build-ftc-data.ts` -- Codebase inspection of aggregate index build pipeline
- `package.json` -- Confirmed @anthropic-ai/sdk v0.78.0 as devDependency
- `public/data/ftc-files/*.json` -- Codebase inspection of 293 case files (complaint data structure)
- `src/hooks/use-case-file.ts` -- Codebase inspection of case file fetching
- `src/components/ftc/FTCTabShell.tsx` -- Tab structure audit

### Secondary (MEDIUM confidence)
- Data availability audit: 292/293 cases have factual_background, 281/293 have representations_made, 290/293 have complaint counts

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all dependencies already installed and proven in codebase
- Architecture: HIGH -- directly adapting an existing, proven pipeline pattern
- Pitfalls: HIGH -- derived from hands-on codebase analysis and data audit of all 293 files
- Tab audit: HIGH -- direct code reading of all 4 tab components

**Research date:** 2026-03-01
**Valid until:** 2026-04-01 (stable -- no external dependencies changing)
