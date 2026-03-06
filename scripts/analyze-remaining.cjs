const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'public', 'data', 'ftc-files');

let provSamples = [];
let reprSamples = [];

for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) {
  const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));

  if (d.order && d.order.provisions) {
    for (const p of d.order.provisions) {
      if (!p.requirements) continue;
      for (let ri = 0; ri < p.requirements.length; ri++) {
        const r = p.requirements[ri];
        if (r.quoted_text && /^[a-z]/.test(r.quoted_text)) {
          const prev = ri > 0 ? p.requirements[ri - 1] : null;
          const prevEnd = prev ? prev.quoted_text.slice(-40) : '';
          provSamples.push({ file: f, text: r.quoted_text.substring(0, 120), prevEnd, ri });
        }
      }
    }
  }

  if (d.complaint && d.complaint.representations_made) {
    for (let ri = 0; ri < d.complaint.representations_made.length; ri++) {
      const r = d.complaint.representations_made[ri];
      if (r.quoted_text && /^[a-z]/.test(r.quoted_text)) {
        const prev = ri > 0 ? d.complaint.representations_made[ri - 1] : null;
        const prevEnd = prev ? prev.quoted_text.slice(-40) : '';
        reprSamples.push({ file: f, text: r.quoted_text.substring(0, 120), prevEnd, ri });
      }
    }
  }
}

// Categorize provisions
let pageSplit = 0, subItem = 0, needsChapeau = 0;
const chapeauNeeded = [];

for (const s of provSamples) {
  const prevEndsTrim = s.prevEnd.trim();
  const isPageSplit = s.prevEnd &&
    !prevEndsTrim.endsWith('.') &&
    !prevEndsTrim.endsWith(';') &&
    !prevEndsTrim.endsWith(':') &&
    !prevEndsTrim.endsWith('"');

  if (isPageSplit) {
    pageSplit++;
  } else if (/^[a-z]\.\s/.test(s.text)) {
    subItem++;
  } else {
    needsChapeau++;
    chapeauNeeded.push(s);
  }
}

console.log('=== PROVISION REQUIREMENTS ===');
console.log('Total lowercase items:', provSamples.length);
console.log('Page-split continuations:', pageSplit);
console.log('Sub-items (a. b. c.):', subItem);
console.log('Likely need chapeau:', needsChapeau);

console.log('\n=== COMPLAINT REPRESENTATIONS ===');
console.log('Total lowercase items:', reprSamples.length);

console.log('\n=== SAMPLE ITEMS NEEDING CHAPEAU ===');
for (const s of chapeauNeeded.slice(0, 20)) {
  console.log(`  ${s.file} [req ${s.ri}]: ${s.text.substring(0, 90)}`);
  if (s.prevEnd) console.log(`    prev ends: ...${s.prevEnd}`);
}
