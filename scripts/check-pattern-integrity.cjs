const fs = require('fs');
const d = JSON.parse(fs.readFileSync('public/data/ftc-patterns.json','utf8'));
const cases = JSON.parse(fs.readFileSync('public/data/ftc-cases.json','utf8'));
const caseMap = new Map(cases.cases.map(c => [c.id, c]));

console.log('=== PATTERN INTEGRITY CHECK ===\n');

for (const p of d.patterns) {
  const issues = [];
  const uniqueCases = new Set(p.variants.map(v => v.case_id));

  // case_count mismatch
  if (p.case_count != uniqueCases.size) {
    issues.push(`case_count=${p.case_count} but ${uniqueCases.size} unique cases in variants`);
  }

  // duplicate variants (same case_id + title)
  const seen = new Set();
  let dupes = 0;
  for (const v of p.variants) {
    const key = v.case_id + '|' + v.title;
    if (seen.has(key)) dupes++;
    seen.add(key);
  }
  if (dupes > 0) issues.push(`${dupes} duplicate variant(s)`);

  // case_ids not in ftc-cases.json
  for (const cid of uniqueCases) {
    if (!caseMap.has(cid)) {
      issues.push(`orphan case_id: ${cid}`);
    }
  }

  // Check if variant years match the case year in ftc-cases.json
  for (const v of p.variants) {
    const caseData = caseMap.get(v.case_id);
    if (caseData && caseData.year && v.year && caseData.year != v.year) {
      issues.push(`year mismatch: ${v.case_id} variant says ${v.year}, case says ${caseData.year}`);
    }
  }

  if (issues.length > 0) {
    console.log(`[${p.name}] (${p.case_count} cases, ${p.variant_count} variants)`);
    issues.forEach(i => console.log(`  - ${i}`));
    console.log('');
  }
}

// Also check: cases that appear in patterns they shouldn't
// Look for the specific Rite Aid 2010 issue
console.log('=== RITE AID CROSS-CHECK ===');
const riteAid2010 = caseMap.get('11.10_rite_aid_corporation');
const riteAid2024 = caseMap.get('03.24_rite_aid_corporation');
if (riteAid2010) console.log('11.10_rite_aid_corporation:', riteAid2010.year, riteAid2010.company_name);
if (riteAid2024) console.log('03.24_rite_aid_corporation:', riteAid2024.year, riteAid2024.company_name);

// Which patterns contain Rite Aid 2010?
console.log('\nPatterns containing 11.10_rite_aid_corporation:');
for (const p of d.patterns) {
  const has = p.variants.some(v => v.case_id === '11.10_rite_aid_corporation');
  if (has) {
    const count = p.variants.filter(v => v.case_id === '11.10_rite_aid_corporation').length;
    console.log(`  ${p.name}: ${count} variants`);
  }
}

console.log('\nPatterns containing 03.24_rite_aid_corporation:');
for (const p of d.patterns) {
  const has = p.variants.some(v => v.case_id === '03.24_rite_aid_corporation');
  if (has) {
    const count = p.variants.filter(v => v.case_id === '03.24_rite_aid_corporation').length;
    console.log(`  ${p.name}: ${count} variants`);
  }
}
