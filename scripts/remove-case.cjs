/**
 * Remove a case from all data files:
 * - ftc-cases.json
 * - ftc-patterns.json (variants + recalculate counts)
 * - ftc-behavioral-patterns.json
 * - provision shards in public/data/provisions/
 * - case file in public/data/ftc-files/
 *
 * Usage: node scripts/remove-case.cjs <case_id>
 * Example: node scripts/remove-case.cjs 11.10_rite_aid_corporation
 */

const fs = require('fs');
const path = require('path');

const caseId = process.argv[2];
if (!caseId) {
  console.error('Usage: node scripts/remove-case.cjs <case_id>');
  process.exit(1);
}

const dataDir = path.join(__dirname, '..', 'public', 'data');

// 1. Remove from ftc-cases.json
const casesPath = path.join(dataDir, 'ftc-cases.json');
const casesData = JSON.parse(fs.readFileSync(casesPath, 'utf8'));
const beforeCount = casesData.cases.length;
casesData.cases = casesData.cases.filter(c => c.id !== caseId);
const afterCount = casesData.cases.length;
if (beforeCount !== afterCount) {
  fs.writeFileSync(casesPath, JSON.stringify(casesData, null, 2) + '\n');
  console.log(`ftc-cases.json: removed ${beforeCount - afterCount} entry (${beforeCount} -> ${afterCount})`);
} else {
  console.log(`ftc-cases.json: case ${caseId} not found`);
}

// 2. Remove from ftc-patterns.json
const patternsPath = path.join(dataDir, 'ftc-patterns.json');
const patternsData = JSON.parse(fs.readFileSync(patternsPath, 'utf8'));
let patternsModified = 0;
for (const pattern of patternsData.patterns) {
  const before = pattern.variants.length;
  pattern.variants = pattern.variants.filter(v => v.case_id !== caseId);
  const after = pattern.variants.length;
  if (before !== after) {
    patternsModified++;
    const uniqueCases = new Set(pattern.variants.map(v => v.case_id));
    pattern.case_count = uniqueCases.size;
    pattern.variant_count = pattern.variants.length;
    console.log(`ftc-patterns.json [${pattern.name}]: removed ${before - after} variant(s), now ${after} variants, ${uniqueCases.size} cases`);
  }
}
if (patternsModified > 0) {
  fs.writeFileSync(patternsPath, JSON.stringify(patternsData, null, 2) + '\n');
  console.log(`ftc-patterns.json: ${patternsModified} pattern(s) modified`);
}

// 3. Remove from ftc-behavioral-patterns.json
const behavioralPath = path.join(dataDir, 'ftc-behavioral-patterns.json');
if (fs.existsSync(behavioralPath)) {
  const behavioralData = JSON.parse(fs.readFileSync(behavioralPath, 'utf8'));
  let behavioralModified = false;

  const removeFromObj = (obj) => {
    if (!obj) return;
    // Handle arrays of patterns/groups
    if (Array.isArray(obj)) {
      for (const item of obj) removeFromObj(item);
      return;
    }
    if (typeof obj !== 'object') return;

    // Remove from case_ids arrays
    if (Array.isArray(obj.case_ids)) {
      const before = obj.case_ids.length;
      obj.case_ids = obj.case_ids.filter(id => id !== caseId);
      if (before !== obj.case_ids.length) {
        behavioralModified = true;
        if (obj.count !== undefined) obj.count = obj.case_ids.length;
      }
    }

    // Remove from cases arrays (objects with case_id field)
    if (Array.isArray(obj.cases)) {
      const before = obj.cases.length;
      obj.cases = obj.cases.filter(c => c.case_id !== caseId && c.id !== caseId);
      if (before !== obj.cases.length) {
        behavioralModified = true;
        if (obj.count !== undefined) obj.count = obj.cases.length;
      }
    }

    // Recurse into all properties
    for (const key of Object.keys(obj)) {
      if (key === 'case_ids' || key === 'cases') continue;
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        removeFromObj(obj[key]);
      }
    }
  };

  removeFromObj(behavioralData);
  if (behavioralModified) {
    fs.writeFileSync(behavioralPath, JSON.stringify(behavioralData, null, 2) + '\n');
    console.log('ftc-behavioral-patterns.json: removed references');
  } else {
    console.log('ftc-behavioral-patterns.json: no references found');
  }
}

// 4. Remove from provision shards
const provisionsDir = path.join(dataDir, 'provisions');
if (fs.existsSync(provisionsDir)) {
  const shardFiles = fs.readdirSync(provisionsDir).filter(f => f.endsWith('.json'));
  let shardsModified = 0;
  for (const file of shardFiles) {
    const shardPath = path.join(provisionsDir, file);
    const shardData = JSON.parse(fs.readFileSync(shardPath, 'utf8'));
    let modified = false;

    if (Array.isArray(shardData.provisions)) {
      const before = shardData.provisions.length;
      shardData.provisions = shardData.provisions.filter(p => p.case_id !== caseId);
      if (before !== shardData.provisions.length) {
        modified = true;
        console.log(`provisions/${file}: removed ${before - shardData.provisions.length} provision(s)`);
      }
    }

    if (modified) {
      fs.writeFileSync(shardPath, JSON.stringify(shardData, null, 2) + '\n');
      shardsModified++;
    }
  }
  console.log(`Provision shards: ${shardsModified} file(s) modified`);
}

// 5. Delete case file
const caseFile = path.join(dataDir, 'ftc-files', `${caseId}.json`);
if (fs.existsSync(caseFile)) {
  fs.unlinkSync(caseFile);
  console.log(`Deleted case file: ftc-files/${caseId}.json`);
} else {
  console.log(`Case file not found: ftc-files/${caseId}.json`);
}

console.log('\nDone. Remember to add the case to FTCMissingCasesNotice.tsx if appropriate.');
