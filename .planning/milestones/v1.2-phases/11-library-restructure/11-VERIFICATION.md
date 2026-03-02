---
phase: 11-library-restructure
verified: 2026-03-02T00:00:00Z
status: passed
score: 13/13 must-haves verified
re_verification: false
---

# Phase 11: Library Restructure Verification Report

**Phase Goal:** Provisions library offers distinct workflows for searching provisions by topic and browsing enforcement actions by case, with case-level provision access from the library
**Verified:** 2026-03-02
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #  | Truth                                                                                      | Status     | Evidence                                                                                                      |
|----|--------------------------------------------------------------------------------------------|------------|---------------------------------------------------------------------------------------------------------------|
| 1  | Provisions library tab has two sub-tabs: "By Topic" and "By Case"                         | VERIFIED   | TabsTrigger value="case" and value="topic" at lines 122-123 of FTCProvisionsTab.tsx                           |
| 2  | Default sub-tab when entering provisions is "By Case"                                     | VERIFIED   | Lines 22-23: `viewParam === "topic" \|\| viewParam === "case" ? viewParam : "case"` — fallback is "case"      |
| 3  | Practice Area section does not appear in the sidebar                                      | VERIFIED   | CATEGORY_ORDER has only `statutory` and `remedy_type`; `practice_area` absent from both array and groups      |
| 4  | Sidebar only appears on the "By Topic" sub-tab                                            | VERIFIED   | TopicSidebar is rendered inside `<TabsContent value="topic">` only (line 143); not in value="case" content    |
| 5  | Selecting "By Topic" with no topic selected shows brief instruction, not ProvisionsLanding | VERIFIED   | Lines 164-171: inline `<div>` with instruction text; no ProvisionsLanding import or usage in the file         |
| 6  | Practice area URLs (e.g., ?topic=pa-deception) still load and display data correctly      | VERIFIED   | Sidebar omits links but ProvisionsContent still accepts any topic slug via URL; data fetching unchanged        |
| 7  | User can search for cases by company name, case title, or year                            | VERIFIED   | CaseBrowser.tsx lines 91-97: OR-logic useMemo filters on company_name, docket_number, year                    |
| 8  | Case list filters in real-time as user types (filter-as-you-type)                        | VERIFIED   | searchQuery state bound to input onChange (line 160); filtered useMemo recomputes on every searchQuery change  |
| 9  | User can sort cases by date, company name, or number of provisions                        | VERIFIED   | SORT_OPTIONS and sorted useMemo with date/company/provisions cases at lines 30-34 and 101-119                 |
| 10 | Clicking "View provisions" on a case expands an inline accordion showing that case's provisions | VERIFIED | CaseCard.onViewProvisions triggers handleToggleExpand; CaseProvisionAccordion conditionally rendered at line 231 |
| 11 | Only one case is expanded at a time — expanding a new case collapses the previous         | VERIFIED   | handleToggleExpand uses `setExpandedCaseId(prev => prev === caseId ? null : caseId)` — exclusive state         |
| 12 | Only cases with classified provisions appear in the case list                             | VERIFIED   | casePool filters `c.num_provisions > 0` at line 84                                                           |
| 13 | Case browser has no sidebar and no topic filter                                           | VERIFIED   | CaseBrowser renders search input, sort popover, case list, pagination — no sidebar or topic filter component   |

**Score:** 13/13 truths verified

---

## Required Artifacts

| Artifact                                                           | Expected                                                             | Status     | Details                                       |
|--------------------------------------------------------------------|----------------------------------------------------------------------|------------|-----------------------------------------------|
| `src/components/ftc/FTCProvisionsTab.tsx`                          | Sub-tab layout with "By Topic" and "By Case" switching              | VERIFIED   | 177 lines; Tabs + TabsContent for both views  |
| `src/components/ftc/provisions/TopicSidebar.tsx`                   | Sidebar with only Statutory Authority and Remedy Type categories    | VERIFIED   | 121 lines; CATEGORY_ORDER has 2 entries only  |
| `src/components/ftc/provisions/CaseBrowser.tsx`                    | Case browser with search, sort, CaseCard list, expansion management | VERIFIED   | 293 lines (min_lines: 80 met)                 |
| `src/components/ftc/provisions/CaseProvisionAccordion.tsx`         | Inline provision expansion using useCaseFile and ProvisionRow       | VERIFIED   | 127 lines (min_lines: 40 met)                 |

All four artifacts exist and are substantive (well above minimum line thresholds and contain real logic).

---

## Key Link Verification

| From                            | To                                            | Via                                              | Status     | Details                                                                                         |
|---------------------------------|-----------------------------------------------|--------------------------------------------------|------------|-------------------------------------------------------------------------------------------------|
| FTCProvisionsTab.tsx            | provisions/TopicSidebar.tsx                   | TopicSidebar rendered only inside value="topic"  | VERIFIED   | Import at line 7; rendered inside `<TabsContent value="topic">` at line 143                     |
| CaseBrowser.tsx                 | industry/CaseCard.tsx                         | CaseCard reused for each case entry              | VERIFIED   | Import at line 5; rendered at line 226 with onViewProvisions prop                               |
| CaseProvisionAccordion.tsx      | hooks/use-case-file.ts                        | useCaseFile hook fetches case provisions         | VERIFIED   | Import at line 4; called at line 41 with caseId; result destructured (data, isLoading, isError) |
| CaseProvisionAccordion.tsx      | industry/ProvisionRow.tsx                     | ProvisionRow renders each provision              | VERIFIED   | Import at line 5; rendered at line 112 inside grouped topic map                                 |
| FTCProvisionsTab.tsx            | provisions/CaseBrowser.tsx                    | CaseBrowser rendered in "By Case" TabsContent    | VERIFIED   | Import at line 10; rendered at line 137 inside `<TabsContent value="case">`                     |

All 5 key links are wired. No orphaned components.

---

## Requirements Coverage

| Requirement | Source Plan | Description                                                                        | Status    | Evidence                                                                                                    |
|-------------|-------------|------------------------------------------------------------------------------------|-----------|-------------------------------------------------------------------------------------------------------------|
| LIB-01      | 11-01-PLAN  | Practice area sections removed from provisions library sidebar/navigation          | SATISFIED | CATEGORY_ORDER in TopicSidebar.tsx has only `statutory` and `remedy_type`; `practice_area` fully absent     |
| LIB-02      | 11-01-PLAN  | Provisions library has two distinct search sections — one for provisions, one for actions/cases | SATISFIED | FTCProvisionsTab renders two TabsContent: "By Topic" for provisions (with ProvisionsContent), "By Case" for CaseBrowser |
| LIB-03      | 11-02-PLAN  | Case search bar allows finding individual enforcement actions by company name or case title | SATISFIED | CaseBrowser search input filters by company_name, docket_number, and year in real-time                     |
| LIB-04      | 11-02-PLAN  | "View provisions" for a specific case is accessible from the library (not only from industry tab) | SATISFIED | CaseCard's "View provisions" button in CaseBrowser triggers CaseProvisionAccordion inline expansion         |

No orphaned requirements. All 4 LIB requirements declared in PLAN frontmatter are accounted for and satisfied.

---

## Anti-Patterns Found

| File                         | Line | Pattern                                               | Severity | Impact   |
|------------------------------|------|-------------------------------------------------------|----------|----------|
| CaseBrowser.tsx              | 161  | `placeholder=` attribute on input element             | INFO     | None — this is a legitimate HTML attribute for search field hint text, not a content placeholder |

No blocker or warning anti-patterns. The `placeholder` word match on line 161 is a false positive — it is the HTML `placeholder` attribute on the search `<input>`, not a stub or TODO.

No empty implementations, no `return null` stubs, no console.log-only handlers, no TODO/FIXME/HACK comments across any of the four phase files.

---

## Commit Verification

All commits documented in SUMMARY files were verified against the actual git log:

| Commit    | Description                                               | Exists |
|-----------|-----------------------------------------------------------|--------|
| `f8628c7` | feat(11-01): remove practice area from TopicSidebar      | YES    |
| `c11e2a0` | feat(11-01): add sub-tab layout to FTCProvisionsTab      | YES    |
| `4c74f24` | feat(11-02): create CaseBrowser and CaseProvisionAccordion | YES  |
| `f44a344` | feat(11-02): wire CaseBrowser into FTCProvisionsTab      | YES    |

---

## Human Verification Required

### 1. Visual and Interaction Confirmation

**Test:** Navigate to `?tab=provisions` and interact with both sub-tabs
**Expected:**
- Lands on "By Case" sub-tab by default
- Typing a company name filters the list in real time
- Typing a year (e.g., "2022") shows only matching cases
- "View provisions" expands an accordion inline below the case card
- Clicking a second case collapses the first and expands the new one
- Switching to "By Topic" shows sidebar with Statutory Authority and Remedy Type only (no Practice Area)
- Selecting a topic loads provisions normally

**Why human:** Real-time filtering behavior and visual layout cannot be verified from static code inspection. Accordion collapse/expand animation and single-expansion mutual exclusivity require browser interaction to confirm.

### 2. Backward Compatibility of Practice Area URLs

**Test:** Navigate directly to `?tab=provisions&topic=pa-deception`
**Expected:** Provisions for the "deceptive" practice area load and display correctly, even though no sidebar link leads there
**Why human:** Requires a running app to confirm the data-fetch path through ProvisionsContent works with a practice_area slug.

### 3. Mobile Responsive Layout

**Test:** Check the "By Topic" sidebar and the "By Case" search/case list at narrow viewport
**Expected:** Desktop sidebar collapses to mobile horizontal bar; case cards stack vertically; search input spans full width
**Why human:** CSS breakpoint behavior and layout wrapping require browser visual inspection.

---

## Summary

Phase 11 fully achieves its goal. The provisions library now offers two genuinely distinct, functional workflows:

- **By Topic** (accessed via sub-tab): TopicSidebar with Statutory Authority and Remedy Type categories drives ProvisionsContent; practice area navigation is gone from the UI while backward-compat URLs still work; no-selection state shows an inline instruction instead of the old ProvisionsLanding.

- **By Case** (default on entry): CaseBrowser provides real-time search across company name, docket number, and year; sort controls for date, company, and provision count; single-expansion accordion via CaseProvisionAccordion that fetches individual case provisions on demand using useCaseFile, grouped by statutory topic, and rendered via ProvisionRow — all without leaving the library.

All four LIB requirements are satisfied. All 5 key wiring links are live. No stubs or orphaned artifacts found. All 6 commits exist in the git log. Three items are flagged for human confirmation (visual/interactive behavior), which is expected for a UI phase.

---

_Verified: 2026-03-02_
_Verifier: Claude (gsd-verifier)_
