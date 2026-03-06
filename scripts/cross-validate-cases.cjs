/**
 * Cross-validate case files against their provision shards.
 * Flags cases where provisions mention topics/subjects that don't
 * appear in the case's statutory_topics or practice_areas.
 *
 * Usage: node scripts/cross-validate-cases.cjs
 */

const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'public', 'data');
const casesData = JSON.parse(fs.readFileSync(path.join(dataDir, 'ftc-cases.json'), 'utf8'));
const caseMap = new Map(casesData.cases.map(c => [c.id, c]));

// Load all provisions from shards, grouped by case_id
const provisionsDir = path.join(dataDir, 'provisions');
const provisionsByCaseId = new Map();

const shardFiles = fs.readdirSync(provisionsDir).filter(f => f.endsWith('.json'));
for (const file of shardFiles) {
  const shard = JSON.parse(fs.readFileSync(path.join(provisionsDir, file), 'utf8'));
  if (!Array.isArray(shard.provisions)) continue;
  for (const prov of shard.provisions) {
    if (!prov.case_id) continue;
    if (!provisionsByCaseId.has(prov.case_id)) {
      provisionsByCaseId.set(prov.case_id, []);
    }
    provisionsByCaseId.get(prov.case_id).push({
      title: prov.title,
      category: prov.category,
      statutory_topics: prov.statutory_topics || [],
      practice_areas: prov.practice_areas || [],
      shard: file,
    });
  }
}

// Also load case files for their statutory_topics and practice_areas
const caseFilesDir = path.join(dataDir, 'ftc-files');
const caseFiles = fs.readdirSync(caseFilesDir).filter(f => f.endsWith('.json'));

// Keywords that indicate specific subject matters
const subjectKeywords = {
  biometric: ['biometric', 'facial recognition', 'face recognition', 'fingerprint', 'voiceprint'],
  coppa: ['coppa', "children's online privacy", 'child-directed', 'parental consent', 'verifiable parental'],
  fcra: ['fcra', 'fair credit reporting', 'consumer report', 'credit report'],
  hipaa: ['hipaa', 'health insurance portability'],
  glba: ['glba', 'gramm-leach-bliley', 'safeguards rule', 'financial privacy'],
  telemarketing: ['telemarketing', 'do not call', 'robocall', 'tsr'],
  canspam: ['can-spam', 'canspam', 'commercial email'],
};

// Map statutory_topics to expected subject areas
const topicToSubjects = {
  'COPPA': 'coppa',
  'FCRA': 'fcra',
  'GLBA': 'glba',
  'Health Breach Notification Rule': null,
  'Telemarketing Sales Rule': 'telemarketing',
  'Section 5 Only': null,
};

console.log('=== CROSS-VALIDATION REPORT ===\n');

let issueCount = 0;

for (const caseFile of caseFiles) {
  const caseId = caseFile.replace('.json', '');
  const caseFilePath = path.join(caseFilesDir, caseFile);
  let caseData;
  try {
    caseData = JSON.parse(fs.readFileSync(caseFilePath, 'utf8'));
  } catch (e) {
    continue;
  }

  const caseInfo = caseData.case_info;
  if (!caseInfo) continue;

  const caseTopics = new Set((caseInfo.statutory_topics || []).map(t => t.toLowerCase()));
  const casePAs = new Set((caseInfo.practice_areas || []).map(p => p.toLowerCase()));
  const issues = [];

  // Check 1: Do provisions in shards reference topics inconsistent with case file?
  const provs = provisionsByCaseId.get(caseId) || [];
  for (const prov of provs) {
    for (const provTopic of prov.statutory_topics) {
      const normTopic = provTopic.toLowerCase();
      // If provision has a specific statutory topic, case should too
      if (!caseTopics.has(normTopic) && normTopic !== 'section 5 only') {
        issues.push(`Provision "${prov.title}" has statutory_topic "${provTopic}" not in case's topics [${[...caseInfo.statutory_topics || []].join(', ')}] (shard: ${prov.shard})`);
      }
    }
  }

  // Check 2: Look for subject-matter keywords in provision titles that don't match case topics
  const allProvText = provs.map(p => p.title.toLowerCase()).join(' ');
  for (const [subject, keywords] of Object.entries(subjectKeywords)) {
    const hasKeyword = keywords.some(kw => allProvText.includes(kw));
    if (hasKeyword) {
      // Check if any case topic or practice area relates to this subject
      const expectedTopic = Object.entries(topicToSubjects).find(([, v]) => v === subject);
      if (expectedTopic) {
        const [topicName] = expectedTopic;
        if (!caseTopics.has(topicName.toLowerCase())) {
          // Check if practice areas cover it
          const hasPAMatch = subject === 'biometric'
            ? casePAs.has('ai / automated decision-making') || casePAs.has('surveillance')
            : false;
          if (!hasPAMatch) {
            issues.push(`Provisions reference "${subject}" subject but case lacks "${topicName}" in statutory_topics`);
          }
        }
      }
    }
  }

  // Check 3: Case year vs case_date consistency
  const caseEntry = caseMap.get(caseId);
  if (caseEntry && caseInfo.case_date) {
    if (caseEntry.year !== caseInfo.case_date.year) {
      issues.push(`Year mismatch: ftc-cases.json says ${caseEntry.year}, case file says ${caseInfo.case_date.year}`);
    }
  }

  // Check 4: Provision year vs case year
  for (const prov of provs) {
    if (prov.year && caseInfo.case_date && prov.year !== caseInfo.case_date.year) {
      // Only flag if difference > 1 year (sometimes orders are issued in adjacent years)
      if (Math.abs(prov.year - caseInfo.case_date.year) > 1) {
        issues.push(`Provision "${prov.title}" year ${prov.year} differs significantly from case year ${caseInfo.case_date.year}`);
      }
    }
  }

  if (issues.length > 0) {
    console.log(`[${caseId}] ${caseInfo.company?.name || 'Unknown'} (${caseInfo.case_date?.year || '?'})`);
    console.log(`  Topics: ${(caseInfo.statutory_topics || []).join(', ')}`);
    console.log(`  Practice Areas: ${(caseInfo.practice_areas || []).join(', ')}`);
    const uniqueIssues = [...new Set(issues)];
    uniqueIssues.forEach(i => console.log(`  ⚠ ${i}`));
    console.log('');
    issueCount++;
  }
}

console.log(`\n=== SUMMARY ===`);
console.log(`Cases checked: ${caseFiles.length}`);
console.log(`Cases with issues: ${issueCount}`);
console.log(`Cases in provision shards: ${provisionsByCaseId.size}`);
