const fs = require('fs');
const path = require('path');

const CASE_ID = '02.23_goodrx_holdings';
const provDir = 'public/data/provisions';

// 1. Remove from provision shards
const manifest = JSON.parse(fs.readFileSync(path.join(provDir, 'manifest.json'), 'utf8'));
for (const [key, topic] of Object.entries(manifest.topics)) {
  const filePath = path.join(provDir, topic.shard);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const before = data.provisions.length;
  data.provisions = data.provisions.filter(p => p.case_id !== CASE_ID);
  if (data.provisions.length < before) {
    data.total_provisions = data.provisions.length;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
    console.log(`${topic.shard}: removed ${before - data.provisions.length} provisions`);
  }
}

// 2. Remove from ftc-patterns.json
const patternsFile = 'public/data/ftc-patterns.json';
const patterns = JSON.parse(fs.readFileSync(patternsFile, 'utf8'));
let patternFixes = 0;
for (const pattern of patterns) {
  if (pattern.cases) {
    const bc = pattern.cases.length;
    pattern.cases = pattern.cases.filter(c => c.case_id !== CASE_ID);
    if (pattern.cases.length < bc) {
      pattern.case_count = pattern.cases.length;
      patternFixes += bc - pattern.cases.length;
    }
  }
  if (pattern.variants) {
    const bv = pattern.variants.length;
    pattern.variants = pattern.variants.filter(v => v.case_id !== CASE_ID);
    if (pattern.variants.length < bv) {
      pattern.variant_count = pattern.variants.length;
    }
  }
}
fs.writeFileSync(patternsFile, JSON.stringify(patterns, null, 2) + '\n');
console.log(`ftc-patterns.json: removed ${patternFixes} case references`);

// 3. Remove from ftc-behavioral-patterns.json
const behavFile = 'public/data/ftc-behavioral-patterns.json';
const behav = JSON.parse(fs.readFileSync(behavFile, 'utf8'));
let behavFixes = 0;
for (const cat of behav.categories) {
  const before = cat.cases.length;
  cat.cases = cat.cases.filter(c => c.case_id !== CASE_ID);
  if (cat.cases.length < before) {
    cat.case_count = cat.cases.length;
    behavFixes += before - cat.cases.length;
  }
}
if (behavFixes > 0) {
  behav.total_cases_categorized = new Set(
    behav.categories.flatMap(c => c.cases.map(cs => cs.case_id))
  ).size;
}
fs.writeFileSync(behavFile, JSON.stringify(behav, null, 2) + '\n');
console.log(`ftc-behavioral-patterns.json: removed ${behavFixes} case references`);
