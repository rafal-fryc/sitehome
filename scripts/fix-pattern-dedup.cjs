/**
 * Fix pattern data integrity in ftc-patterns.json:
 * 1. Deduplicate variants by case_id + title (keep first occurrence)
 * 2. Fix variant years to match authoritative ftc-cases.json years
 * 3. Recalculate case_count and variant_count
 *
 * Usage: node scripts/fix-pattern-dedup.cjs [--dry-run]
 */

const fs = require('fs');
const path = require('path');

const dryRun = process.argv.includes('--dry-run');
const dataDir = path.join(__dirname, '..', 'public', 'data');

const patternsPath = path.join(dataDir, 'ftc-patterns.json');
const casesPath = path.join(dataDir, 'ftc-cases.json');

const patternsData = JSON.parse(fs.readFileSync(patternsPath, 'utf8'));
const casesData = JSON.parse(fs.readFileSync(casesPath, 'utf8'));
const caseMap = new Map(casesData.cases.map(c => [c.id, c]));

let totalDupsRemoved = 0;
let totalYearFixes = 0;
let totalCountFixes = 0;

for (const pattern of patternsData.patterns) {
  const issues = [];

  // 1. Fix variant years to match case years
  for (const v of pattern.variants) {
    const caseData = caseMap.get(v.case_id);
    if (caseData && caseData.year && v.year && caseData.year !== v.year) {
      issues.push(`  year fix: ${v.case_id} ${v.year} -> ${caseData.year}`);
      v.year = caseData.year;
      totalYearFixes++;
    }
  }

  // 2. Deduplicate variants by case_id + title
  const seen = new Set();
  const deduped = [];
  let dupsRemoved = 0;
  for (const v of pattern.variants) {
    const key = v.case_id + '|' + v.title;
    if (seen.has(key)) {
      dupsRemoved++;
      continue;
    }
    seen.add(key);
    deduped.push(v);
  }
  if (dupsRemoved > 0) {
    issues.push(`  deduped: removed ${dupsRemoved} duplicate(s) (${pattern.variants.length} -> ${deduped.length})`);
    pattern.variants = deduped;
    totalDupsRemoved += dupsRemoved;
  }

  // 3. Recalculate counts
  const uniqueCases = new Set(pattern.variants.map(v => v.case_id));
  const newCaseCount = uniqueCases.size;
  const newVariantCount = pattern.variants.length;

  if (pattern.case_count !== newCaseCount || pattern.variant_count !== newVariantCount) {
    issues.push(`  counts: case_count ${pattern.case_count} -> ${newCaseCount}, variant_count ${pattern.variant_count} -> ${newVariantCount}`);
    pattern.case_count = newCaseCount;
    pattern.variant_count = newVariantCount;
    totalCountFixes++;
  }

  if (issues.length > 0) {
    console.log(`[${pattern.name}]`);
    issues.forEach(i => console.log(i));
  }
}

console.log(`\nSummary: ${totalDupsRemoved} duplicates removed, ${totalYearFixes} year fixes, ${totalCountFixes} count fixes`);

if (!dryRun) {
  fs.writeFileSync(patternsPath, JSON.stringify(patternsData, null, 2) + '\n');
  console.log('Written to ftc-patterns.json');
} else {
  console.log('(dry run - no changes written)');
}
