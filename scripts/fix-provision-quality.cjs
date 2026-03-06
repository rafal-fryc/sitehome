/**
 * fix-provision-quality.cjs
 *
 * Fixes data-quality issues in provision shard files:
 *   #1  CID-encoded PDF garbage
 *   #2  Double-character corruption
 *   #9  Embedded line numbers
 *   #10 Duplicate paragraphs
 *   #7  Truncated verbatim_text
 *   #14 Lowercase starts
 *
 * Applied IN THIS ORDER (order matters).
 */

const fs = require('fs');
const path = require('path');

const PROVISIONS_DIR = path.join(__dirname, '..', 'public', 'data', 'provisions');
const manifest = JSON.parse(fs.readFileSync(path.join(PROVISIONS_DIR, 'manifest.json'), 'utf8'));

// Cases known to have systematic double-char corruption
const DOUBLE_CHAR_CASE_IDS = new Set([
  '03.12_rockyou',
  '11.11_godwin_jones_o._dba_skidekids.com',
  '04.10_united_states_of_america_v._central_credit',
  '09.10_choicepoint',
  '11.20_midwest_recovery_systems',
  '05.24_blackbaud',
  '11.10_echometrix',
]);

const counters = {
  cid_garbage: 0,
  double_char: 0,
  line_numbers: 0,
  duplicate_paragraphs: 0,
  truncation: 0,
  lowercase_start: 0,
};

const logs = [];
function log(caseId, provNum, fixType, detail) {
  logs.push({ caseId, provNum, fixType, detail });
}

// ─── FIX #1: CID garbage ────────────────────────────────────────────
function fixCidGarbage(prov) {
  let changed = false;
  if (prov.verbatim_text && prov.verbatim_text.includes('(cid:')) {
    prov.verbatim_text = '';
    counters.cid_garbage++;
    log(prov.case_id, prov.provision_number, 'cid_garbage', 'cleared verbatim_text');
    changed = true;
  }
  if (prov.summary && prov.summary.includes('(cid:')) {
    prov.summary = '';
    counters.cid_garbage++;
    log(prov.case_id, prov.provision_number, 'cid_garbage', 'cleared summary');
    changed = true;
  }
  return changed;
}

// ─── FIX #2: Double-character corruption ─────────────────────────────
function isDoubleChar(text) {
  // The doubling pattern doubles characters within words but spaces between
  // doubled words may be single. So we check word-by-word: extract words,
  // and for each word check if it consists of consecutive char pairs.
  // e.g. "ffaaiilliinngg" → pairs: ff, aa, ii, ll, ii, nn, gg → all match
  const words = text.slice(0, 500).split(/\s+/).filter(w => w.length >= 4);
  if (words.length < 3) return false;

  let doubledWords = 0;
  for (const word of words.slice(0, 30)) {
    if (word.length % 2 !== 0) continue; // doubled words have even length
    let paired = 0;
    let total = 0;
    for (let i = 0; i + 1 < word.length; i += 2) {
      total++;
      if (word[i] === word[i + 1]) paired++;
    }
    if (total > 0 && paired / total >= 0.8) {
      doubledWords++;
    }
  }

  return doubledWords >= 3 && doubledWords / Math.min(words.length, 30) >= 0.4;
}

function deduplicateChars(text) {
  // Process word by word: for doubled words, take every other char.
  // Preserve whitespace structure.
  return text.replace(/\S+/g, (word) => {
    // Check if this word is doubled (minimum 2 chars, even length)
    if (word.length >= 2 && word.length % 2 === 0) {
      let paired = 0;
      let total = 0;
      for (let i = 0; i + 1 < word.length; i += 2) {
        total++;
        if (word[i] === word[i + 1]) paired++;
      }
      if (total > 0 && paired / total >= 0.8) {
        // Deduplicate: take every other char
        let result = '';
        for (let i = 0; i < word.length; i += 2) {
          result += word[i];
        }
        return result;
      }
    }
    return word; // Not doubled, keep as-is
  });
}

function fixDoubleChar(prov) {
  if (!DOUBLE_CHAR_CASE_IDS.has(prov.case_id)) return false;
  let changed = false;
  if (prov.verbatim_text && isDoubleChar(prov.verbatim_text)) {
    prov.verbatim_text = deduplicateChars(prov.verbatim_text);
    counters.double_char++;
    log(prov.case_id, prov.provision_number, 'double_char', 'deduplicated verbatim_text');
    changed = true;
  }
  if (prov.summary && isDoubleChar(prov.summary)) {
    prov.summary = deduplicateChars(prov.summary);
    counters.double_char++;
    log(prov.case_id, prov.provision_number, 'double_char', 'deduplicated summary');
    changed = true;
  }
  return changed;
}

// ─── FIX #9: Line numbers in provision text ──────────────────────────
function fixLineNumbers(prov) {
  if (!prov.verbatim_text) return false;
  let changed = false;
  const text = prov.verbatim_text;

  // 9a: Leading provision number repeated.
  // E.g. provision_number="6", text starts "6. Defendant..."
  const provNum = String(prov.provision_number);
  // Match: text starts with the provision number followed by ". "
  const leadingRe = new RegExp(`^${escapeRegex(provNum)}\\.\\s+`);
  if (leadingRe.test(prov.verbatim_text)) {
    prov.verbatim_text = prov.verbatim_text.replace(leadingRe, '');
    counters.line_numbers++;
    log(prov.case_id, prov.provision_number, 'line_number_leading', `stripped leading "${provNum}. "`);
    changed = true;
  }

  // 9b: Embedded sequential PDF line numbers.
  // Patterns like "\n18.\n" or "\n18. " that are bare numbers on their own line,
  // appearing sequentially embedded within text.
  // We look for patterns: newline, 1-4 digit number, period, optional space, newline
  // that appear multiple times in sequence (indicating PDF line numbers rather than list items).
  // Also: bare numbers on their own line like "\n28\n" that appear between paragraphs of content.

  // First detect if there are sequential line numbers embedded in text
  // Pattern: \n<digits>.\n or \n<digits>. (followed by content on same line, but the number
  // itself is just a line marker, not content)
  // We specifically look for "\n<number>\n" patterns (bare line numbers on own line)
  const bareLineNumPattern = /\n(\d{1,4})\n/g;
  let bareMatches = [];
  let m;
  while ((m = bareLineNumPattern.exec(prov.verbatim_text)) !== null) {
    bareMatches.push({ index: m.index, num: parseInt(m[1], 10), full: m[0] });
  }

  // Check for sequential runs (at least 2 consecutive numbers)
  if (bareMatches.length >= 2) {
    // Find sequential pairs
    const toRemove = new Set();
    for (let i = 0; i < bareMatches.length - 1; i++) {
      if (bareMatches[i + 1].num === bareMatches[i].num + 1) {
        toRemove.add(i);
        toRemove.add(i + 1);
      }
    }
    if (toRemove.size > 0) {
      // Remove all identified sequential line numbers (replace "\n<num>\n" with "\n")
      // Work backwards to preserve indices
      const sorted = [...toRemove].sort((a, b) => bareMatches[b].index - bareMatches[a].index);
      for (const idx of sorted) {
        const bm = bareMatches[idx];
        prov.verbatim_text =
          prov.verbatim_text.slice(0, bm.index) + '\n' + prov.verbatim_text.slice(bm.index + bm.full.length);
      }
      counters.line_numbers++;
      log(prov.case_id, prov.provision_number, 'line_number_embedded', `removed ${toRemove.size} bare line numbers`);
      changed = true;
    }
  }

  // Also handle pattern: " <digits>\n" or " <digits>. " embedded mid-text that form sequences
  // Pattern: space-separated line numbers like "28 Consent Decree Page 4 of 20" - these are
  // typically page headers/footers from PDFs. We look for "Case..." patterns and page refs.
  // Simpler approach: remove patterns like "\d+ Consent Decree Page \d+ of \d+"
  const consentDecreePattern = /\d+\s+Consent Decree Page \d+ of \d+/g;
  if (consentDecreePattern.test(prov.verbatim_text)) {
    prov.verbatim_text = prov.verbatim_text.replace(/\d+\s+Consent Decree Page \d+ of \d+/g, '');
    counters.line_numbers++;
    log(prov.case_id, prov.provision_number, 'line_number_consent_decree', 'removed Consent Decree page refs');
    changed = true;
  }

  // Remove Case header lines like "Case3:12-cv-01487-SI Document4 Filed03/28/12 Page8 of 31"
  const caseHeaderPattern = /Case\d+:\d+-cv-\d+-\S+\s+Document\d+\s+Filed\d+\/\d+\/\d+\s+Page\d+\s+of\s+\d+/g;
  if (caseHeaderPattern.test(prov.verbatim_text)) {
    prov.verbatim_text = prov.verbatim_text.replace(
      /Case\d+:\d+-cv-\d+-\S+\s+Document\d+\s+Filed\d+\/\d+\/\d+\s+Page\d+\s+of\s+\d+/g,
      ''
    );
    counters.line_numbers++;
    log(prov.case_id, prov.provision_number, 'line_number_case_header', 'removed Case header lines');
    changed = true;
  }

  // Handle inline sequential line numbers that appear as "\n<num>.\n" or "\n<num>. " mid-text
  // Pattern: lines that are just a number followed by period
  const numberedLinePattern = /\n(\d{1,4})\.\s*\n/g;
  let numberedMatches = [];
  while ((m = numberedLinePattern.exec(prov.verbatim_text)) !== null) {
    numberedMatches.push({ index: m.index, num: parseInt(m[1], 10), full: m[0] });
  }

  if (numberedMatches.length >= 2) {
    const toRemove2 = new Set();
    for (let i = 0; i < numberedMatches.length - 1; i++) {
      if (numberedMatches[i + 1].num === numberedMatches[i].num + 1) {
        toRemove2.add(i);
        toRemove2.add(i + 1);
      }
    }
    if (toRemove2.size > 0) {
      const sorted = [...toRemove2].sort((a, b) => numberedMatches[b].index - numberedMatches[a].index);
      for (const idx of sorted) {
        const nm = numberedMatches[idx];
        prov.verbatim_text =
          prov.verbatim_text.slice(0, nm.index) + '\n' + prov.verbatim_text.slice(nm.index + nm.full.length);
      }
      counters.line_numbers++;
      log(prov.case_id, prov.provision_number, 'line_number_dotted', `removed ${toRemove2.size} dotted line numbers`);
      changed = true;
    }
  }

  // Clean up any resulting multiple blank lines
  if (changed) {
    prov.verbatim_text = prov.verbatim_text.replace(/\n{3,}/g, '\n\n').trim();
  }

  return changed;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─── FIX #10: Duplicate paragraphs ──────────────────────────────────
function fixDuplicateParagraphs(prov) {
  if (!prov.verbatim_text) return false;
  const paragraphs = prov.verbatim_text.split(/\n\n+/);
  if (paragraphs.length < 2) return false;

  const seen = new Set();
  const deduped = [];
  let removedCount = 0;

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;
    // Normalize whitespace for comparison
    const key = trimmed.replace(/\s+/g, ' ');
    if (seen.has(key)) {
      removedCount++;
    } else {
      seen.add(key);
      deduped.push(para);
    }
  }

  if (removedCount > 0) {
    prov.verbatim_text = deduped.join('\n\n');
    counters.duplicate_paragraphs++;
    log(prov.case_id, prov.provision_number, 'duplicate_paragraphs', `removed ${removedCount} duplicate paragraph(s)`);
    return true;
  }
  return false;
}

// ─── FIX #7: Truncation ─────────────────────────────────────────────
function fixTruncation(prov) {
  if (!prov.verbatim_text) return false;
  const text = prov.verbatim_text.trim();
  if (!text) return false;

  // Check if ends with terminal punctuation
  const lastChar = text[text.length - 1];
  const terminalChars = new Set(['.', ';', ':', '!', '?', '"', '\u201D']); // include smart quote
  if (terminalChars.has(lastChar)) return false;
  // Also check if it ends with "..." already
  if (text.endsWith('...')) return false;

  // Check if last char is a closing paren or bracket followed by nothing — that can be okay
  // e.g. "...§ 312.5(a)(1)" should end with the paren
  if (lastChar === ')' || lastChar === ']') return false;

  // Find the last sentence boundary
  // Look for last occurrence of ". " or ".\n" or "; " or ";\n" etc.
  const sentenceEndPattern = /[.;:!?][""\u201D]?\s/g;
  let lastBoundary = -1;
  let match;
  while ((match = sentenceEndPattern.exec(text)) !== null) {
    lastBoundary = match.index + match[0].trimEnd().length;
  }

  // Also check for terminal punctuation at end of a sentence even without trailing space
  // e.g., the text might end "...something" with a period buried earlier
  const terminalAtEnd = /[.;:!?][""\u201D]?$/;
  const termMatch = terminalAtEnd.exec(text);
  if (termMatch) return false; // Already handled above, but just in case

  if (lastBoundary > 0 && lastBoundary < text.length) {
    prov.verbatim_text = text.slice(0, lastBoundary) + '...';
    counters.truncation++;
    log(prov.case_id, prov.provision_number, 'truncation', `trimmed to last sentence boundary + "..."`);
    return true;
  }

  // If no sentence boundary found, just append "..."
  prov.verbatim_text = text + '...';
  counters.truncation++;
  log(prov.case_id, prov.provision_number, 'truncation', 'appended "..." (no sentence boundary found)');
  return true;
}

// ─── FIX #14: Lowercase starts ──────────────────────────────────────
function fixLowercaseStart(prov) {
  if (!prov.verbatim_text) return false;
  const first = prov.verbatim_text[0];
  if (first && first >= 'a' && first <= 'z') {
    prov.verbatim_text = first.toUpperCase() + prov.verbatim_text.slice(1);
    counters.lowercase_start++;
    log(prov.case_id, prov.provision_number, 'lowercase_start', `capitalized "${first}" → "${first.toUpperCase()}"`);
    return true;
  }
  return false;
}

// ─── MAIN ────────────────────────────────────────────────────────────
let totalProvisionsProcessed = 0;
let totalFilesModified = 0;

for (const [topicKey, topicInfo] of Object.entries(manifest.topics)) {
  const shardPath = path.join(PROVISIONS_DIR, topicInfo.shard);
  if (!fs.existsSync(shardPath)) {
    console.warn(`Shard file not found: ${topicInfo.shard}`);
    continue;
  }

  const shard = JSON.parse(fs.readFileSync(shardPath, 'utf8'));
  let shardModified = false;

  for (const prov of shard.provisions) {
    totalProvisionsProcessed++;

    // Apply fixes in order
    const f1 = fixCidGarbage(prov);
    const f2 = fixDoubleChar(prov);
    const f9 = fixLineNumbers(prov);
    const f10 = fixDuplicateParagraphs(prov);
    const f7 = fixTruncation(prov);
    const f14 = fixLowercaseStart(prov);

    if (f1 || f2 || f9 || f10 || f7 || f14) {
      shardModified = true;
    }
  }

  if (shardModified) {
    fs.writeFileSync(shardPath, JSON.stringify(shard, null, 2) + '\n', 'utf8');
    totalFilesModified++;
    console.log(`  Updated: ${topicInfo.shard}`);
  }
}

// ─── SUMMARY ─────────────────────────────────────────────────────────
console.log('\n=== PROVISION QUALITY FIX SUMMARY ===');
console.log(`Provisions processed: ${totalProvisionsProcessed}`);
console.log(`Shard files modified: ${totalFilesModified}`);
console.log('');
console.log('Fixes applied:');
console.log(`  #1  CID garbage cleared:       ${counters.cid_garbage}`);
console.log(`  #2  Double-char deduplicated:   ${counters.double_char}`);
console.log(`  #9  Line numbers removed:       ${counters.line_numbers}`);
console.log(`  #10 Duplicate paragraphs:       ${counters.duplicate_paragraphs}`);
console.log(`  #7  Truncation fixed:           ${counters.truncation}`);
console.log(`  #14 Lowercase starts fixed:     ${counters.lowercase_start}`);
const total = Object.values(counters).reduce((a, b) => a + b, 0);
console.log(`  TOTAL:                          ${total}`);

// Print detail log
console.log('\n=== DETAILED LOG ===');
for (const entry of logs) {
  console.log(`  [${entry.fixType}] ${entry.caseId} / provision ${entry.provNum}: ${entry.detail}`);
}
