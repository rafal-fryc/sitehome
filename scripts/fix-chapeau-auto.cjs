/**
 * Automatically fix mid-sentence quoted_text by finding chapeau from pre-extracted PDF text.
 * Uses fix-manifest-with-context.json (already has PDF text extracted).
 * Writes JSON safely (no Edit tool issues).
 */
const fs = require('fs');
const path = require('path');

const MANIFEST_PATH = path.join(__dirname, 'fix-manifest-with-context.json');
const FTC_DIR = path.join(__dirname, '..', 'public', 'data', 'ftc-files');
const DRY_RUN = !process.argv.includes('--apply');

function normalize(text) {
  return text
    .replace(/\u2019/g, "'").replace(/\u2018/g, "'")
    .replace(/\u201c/g, '"').replace(/\u201d/g, '"')
    .replace(/\u2013/g, '-').replace(/\u2014/g, '-')
    .replace(/\ufffd/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripLineNumbers(text) {
  // Court documents have line numbers like "1 ", "2 ", etc. at line starts
  return text.replace(/(?:^|\n)\s*\d{1,2}\s{2,}/g, '\n');
}

function stripPageHeaders(text) {
  // Remove "--- PAGE N ---" markers from extracted text
  let t = text.replace(/---\s*PAGE\s*\d+\s*---/g, '');
  // Remove court case headers like "Case: 3:24-cv-00288 Document #: 1 Filed: 05/01/24 Page 27 of 37"
  t = t.replace(/Case:\s*\d+:\d+-\w+-\d+\s*Document\s*#:\s*\d+\s*Filed:\s*\d{2}\/\d{2}\/\d{2,4}\s*Page\s*\d+\s*of\s*\d+/gi, '');
  return t;
}

function cleanPdfText(text) {
  if (!text) return '';
  let t = stripPageHeaders(text);
  t = stripLineNumbers(t);
  t = normalize(t);
  return t;
}

function findInPdf(normPdf, quotedText) {
  const normQt = normalize(quotedText);

  // Try progressively shorter fragments
  for (const len of [80, 60, 40, 30, 20, 15]) {
    const search = normQt.substring(0, len);
    if (search.length < 10) continue;
    const idx = normPdf.indexOf(search);
    if (idx >= 0) return idx;
  }

  // Try word-based matching
  const words = normQt.split(' ');
  for (const numWords of [8, 6, 4, 3]) {
    if (words.length < numWords) continue;
    const search = words.slice(0, numWords).join(' ');
    const idx = normPdf.indexOf(search);
    if (idx >= 0) return idx;
  }

  return -1;
}

function findChapeauStart(normPdf, matchIdx, maxLen = 500) {
  // Search within a reasonable window, not too far back
  const lookback = Math.min(matchIdx, 3000);
  const region = normPdf.substring(matchIdx - lookback, matchIdx);

  // Try multiple strategies, preferring the one that gives a shorter but valid prefix

  // Strategy 1: Find "IT IS [FURTHER/HEREBY] ORDERED" - use the CLOSEST one within maxLen first
  const orderPattern = /IT IS (?:FURTHER |HEREBY )?ORDERED/gi;
  let closestOrder = null;
  let lastOrder = null;
  for (const m of region.matchAll(orderPattern)) {
    const pos = (matchIdx - lookback) + m.index;
    const dist = matchIdx - pos;
    lastOrder = pos;
    if (dist <= maxLen) {
      closestOrder = pos;
    }
  }
  // Prefer closest within maxLen, otherwise try the last one
  if (closestOrder !== null) return closestOrder;

  // Strategy 2: Numbered paragraph (e.g., "49." or "3.") - find closest within maxLen
  const numPattern = /(?:^|[.;]\s+)(\d{1,3}\.\s)/g;
  let closestNum = null;
  for (const m of region.matchAll(numPattern)) {
    const offset = m[0].startsWith('.') || m[0].startsWith(';') ? m[0].indexOf(m[1]) : 0;
    const pos = (matchIdx - lookback) + m.index + offset;
    const dist = matchIdx - pos;
    if (dist <= maxLen) closestNum = pos;
  }
  if (closestNum !== null) return closestNum;

  // Strategy 3: "Provided, however, that" or "Provided, further, that"
  const providedPattern = /Provided,?\s+(?:however|further),?\s+that/gi;
  let closestProvided = null;
  for (const m of region.matchAll(providedPattern)) {
    const pos = (matchIdx - lookback) + m.index;
    if (matchIdx - pos <= maxLen) closestProvided = pos;
  }
  if (closestProvided !== null) return closestProvided;

  // Strategy 4: Sub-item label like "A." "B." "1." before the text (within 200 chars)
  const subLabelPattern = /(?:^|[.;:]\s+)([A-Z]\.\s)/g;
  let closestLabel = null;
  for (const m of region.matchAll(subLabelPattern)) {
    const offset = m[0].indexOf(m[1]);
    const pos = (matchIdx - lookback) + m.index + offset;
    if (matchIdx - pos <= 200) closestLabel = pos;
  }
  if (closestLabel !== null) return closestLabel;

  // Strategy 5: Last sentence boundary ". [A-Z]" within maxLen
  const sentPattern = /[.;:]\s+([A-Z])/g;
  let closestSent = null;
  for (const m of region.matchAll(sentPattern)) {
    const pos = (matchIdx - lookback) + m.index + m[0].indexOf(m[1]);
    if (matchIdx - pos <= maxLen) closestSent = pos;
  }
  if (closestSent !== null) return closestSent;

  // If we found an IT IS ORDERED that's too far, still return it (will be trimmed later)
  if (lastOrder !== null) return lastOrder;

  return null;
}

function isPageSplitContinuation(data, provIdx, reqIdx) {
  if (reqIdx === 0) return false;
  const prev = data.order.provisions[provIdx].requirements[reqIdx - 1];
  if (!prev || !prev.quoted_text) return false;
  const prevEnd = prev.quoted_text.trim();
  // If previous requirement ends without sentence terminator, this is a continuation
  return !prevEnd.endsWith('.') &&
    !prevEnd.endsWith(';') &&
    !prevEnd.endsWith(':') &&
    !prevEnd.endsWith('"') &&
    !prevEnd.endsWith(')');
}

function isSubItemInList(text) {
  return /^[a-z]\.\s/.test(text) || /^[ivx]+\.\s/.test(text);
}

function main() {
  if (DRY_RUN) console.log('DRY RUN - use --apply to apply fixes\n');

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));

  const stats = {
    fixed: 0,
    skipped_page_split: 0,
    skipped_sub_item: 0,
    skipped_no_pdf: 0,
    skipped_not_found: 0,
    skipped_no_chapeau: 0,
    skipped_prefix_too_long: 0,
    skipped_prefix_too_short: 0,
    skipped_already_fixed: 0,
    total: 0
  };

  const fixes = []; // Track what we'd fix
  const modifiedFiles = new Map(); // json_path -> data

  for (const batch of manifest.batches) {
    for (const fileEntry of batch.files) {
      const jsonPath = fileEntry.json_path;
      const jsonFile = fileEntry.json_file;

      // Load current JSON (may have agent edits already)
      let data;
      try {
        data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      } catch (e) {
        console.log(`SKIP ${jsonFile}: invalid JSON`);
        continue;
      }

      let modified = false;

      // Process provisions
      const orderPdfText = fileEntry.order_pdf_text || '';
      const cleanOrderPdf = cleanPdfText(orderPdfText);

      for (const provInfo of (fileEntry.affected_provisions || [])) {
        const pi = provInfo.provision_index;
        const ri = provInfo.requirement_index;
        stats.total++;

        // Safety check
        if (!data.order || !data.order.provisions[pi] || !data.order.provisions[pi].requirements[ri]) {
          continue;
        }

        const req = data.order.provisions[pi].requirements[ri];
        const currentText = req.quoted_text;

        // Skip if already starts with uppercase (already fixed by agent)
        if (!currentText || /^[A-Z]/.test(currentText)) {
          stats.skipped_already_fixed++;
          continue;
        }

        // Skip page-split continuations
        if (isPageSplitContinuation(data, pi, ri)) {
          stats.skipped_page_split++;
          continue;
        }

        // Skip sub-items
        if (isSubItemInList(currentText)) {
          stats.skipped_sub_item++;
          continue;
        }

        // No PDF text?
        if (!cleanOrderPdf) {
          stats.skipped_no_pdf++;
          continue;
        }

        // Find in PDF
        const matchIdx = findInPdf(cleanOrderPdf, currentText);
        if (matchIdx < 0) {
          stats.skipped_not_found++;
          continue;
        }

        // Find chapeau start
        const chapeauStart = findChapeauStart(cleanOrderPdf, matchIdx);
        if (chapeauStart === null || chapeauStart >= matchIdx) {
          stats.skipped_no_chapeau++;
          continue;
        }

        let prefix = cleanOrderPdf.substring(chapeauStart, matchIdx).trim();

        // Sanity checks on prefix
        if (prefix.length < 5) {
          stats.skipped_prefix_too_short++;
          continue;
        }
        if (prefix.length > 500) {
          stats.skipped_prefix_too_long++;
          continue;
        }

        // Apply fix
        const fixedText = prefix + ' ' + currentText;
        fixes.push({
          file: jsonFile,
          type: 'provision',
          pi, ri,
          prefix: prefix.substring(0, 120),
          originalStart: currentText.substring(0, 60)
        });

        if (!DRY_RUN) {
          req.quoted_text = fixedText;
          modified = true;
        }
        stats.fixed++;
      }

      // Process complaint representations
      const complaintPdfText = fileEntry.complaint_pdf_text || '';
      const cleanComplaintPdf = cleanPdfText(complaintPdfText);

      for (const repInfo of (fileEntry.affected_representations || [])) {
        const ri = repInfo.representation_index;
        stats.total++;

        if (!data.complaint || !data.complaint.representations_made || !data.complaint.representations_made[ri]) {
          continue;
        }

        const rep = data.complaint.representations_made[ri];
        const currentText = rep.quoted_text;

        if (!currentText || /^[A-Z]/.test(currentText)) {
          stats.skipped_already_fixed++;
          continue;
        }

        // Check page-split for representations
        if (ri > 0) {
          const prev = data.complaint.representations_made[ri - 1];
          if (prev && prev.quoted_text) {
            const prevEnd = prev.quoted_text.trim();
            if (!prevEnd.endsWith('.') && !prevEnd.endsWith(';') && !prevEnd.endsWith(':') && !prevEnd.endsWith('"')) {
              stats.skipped_page_split++;
              continue;
            }
          }
        }

        if (!cleanComplaintPdf) {
          stats.skipped_no_pdf++;
          continue;
        }

        const matchIdx = findInPdf(cleanComplaintPdf, currentText);
        if (matchIdx < 0) {
          stats.skipped_not_found++;
          continue;
        }

        const chapeauStart = findChapeauStart(cleanComplaintPdf, matchIdx);
        if (chapeauStart === null || chapeauStart >= matchIdx) {
          stats.skipped_no_chapeau++;
          continue;
        }

        let prefix = cleanComplaintPdf.substring(chapeauStart, matchIdx).trim();

        if (prefix.length < 5) {
          stats.skipped_prefix_too_short++;
          continue;
        }
        if (prefix.length > 500) {
          stats.skipped_prefix_too_long++;
          continue;
        }

        const fixedText = prefix + ' ' + currentText;
        fixes.push({
          file: jsonFile,
          type: 'representation',
          ri,
          prefix: prefix.substring(0, 120),
          originalStart: currentText.substring(0, 60)
        });

        if (!DRY_RUN) {
          rep.quoted_text = fixedText;
          modified = true;
        }
        stats.fixed++;
      }

      if (!DRY_RUN && modified) {
        modifiedFiles.set(jsonPath, data);
      }
    }
  }

  // Write modified files
  if (!DRY_RUN) {
    for (const [filePath, data] of modifiedFiles) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    }
    console.log(`\nWrote ${modifiedFiles.size} modified JSON files`);
  }

  console.log('\n=== RESULTS ===');
  for (const [k, v] of Object.entries(stats)) {
    if (v > 0) console.log(`  ${k}: ${v}`);
  }

  console.log('\n=== SAMPLE FIXES ===');
  for (const f of fixes.slice(0, 30)) {
    console.log(`  ${f.file} [${f.type} ${f.pi !== undefined ? `p${f.pi}r${f.ri}` : `r${f.ri}`}]`);
    console.log(`    PREFIX: ${f.prefix}`);
    console.log(`    ORIG: ${f.originalStart}`);
  }
}

main();
