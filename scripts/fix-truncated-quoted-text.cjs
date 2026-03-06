const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'public', 'data', 'ftc-files');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

// Terminal punctuation that indicates a complete ending
const terminalRe = /[.;:!?"]\s*$/;

// Characters that indicate text was cut mid-sentence
// We do NOT treat ")" or "]" as truncation since those can end sentences
let totalFixed = 0;
let totalFiles = 0;

for (const file of files) {
  const filePath = path.join(dir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let fileChanged = false;

  // Walk provisions
  const provisions = data.provisions || [];
  for (const provision of provisions) {
    const requirements = provision.requirements || [];
    for (const req of requirements) {
      if (!req.quoted_text || typeof req.quoted_text !== 'string') continue;

      const text = req.quoted_text.trim();

      // Skip if empty or already ends with ...
      if (!text || text.endsWith('...')) continue;

      // Skip if text ends with terminal punctuation
      if (terminalRe.test(text)) continue;

      // Text appears truncated. Find the last sentence boundary.
      // Look for the last ". " or "." at the end of a sentence,
      // or "; " or ":" followed by space, etc.
      // We look for the last occurrence of a sentence-ending pattern.

      // Find last sentence boundary: period followed by space, or period at position
      // that looks like end of sentence (before a capital letter or end)
      // Also consider semicolons and colons as boundaries.
      let lastBoundary = -1;

      for (let i = text.length - 1; i >= 0; i--) {
        const ch = text[i];
        if (ch === '.' || ch === ';' || ch === ':' || ch === '!' || ch === '?') {
          // Check this isn't part of an abbreviation like "U.S.C." or "e.g."
          // A sentence boundary typically has a space after it (or is followed by a quote)
          if (i === text.length - 1) {
            // Punctuation at the very end - this shouldn't happen since we checked terminalRe
            lastBoundary = i;
            break;
          }
          const nextCh = text[i + 1];
          if (nextCh === ' ' || nextCh === '"' || nextCh === '\n') {
            lastBoundary = i;
            break;
          }
        }
        if (ch === '"') {
          // A closing quote can end a sentence
          if (i > 0 && (text[i-1] === '.' || text[i-1] === '!' || text[i-1] === '?')) {
            lastBoundary = i;
            break;
          }
        }
      }

      if (lastBoundary === -1) continue; // No sentence boundary found, skip

      // Don't trim if it would remove most of the text (keep at least 20 chars)
      if (lastBoundary < 20) continue;

      const trimmed = text.substring(0, lastBoundary + 1) + '...';

      // Only modify if we actually trimmed something
      if (trimmed.length < text.length) {
        const removed = text.substring(lastBoundary + 1).trim();
        console.log(`[${file}] Trimmed: ...${text.substring(Math.max(0, lastBoundary - 30), lastBoundary + 1)} | removed: "${removed.substring(0, 60)}${removed.length > 60 ? '...' : ''}"`);
        req.quoted_text = trimmed;
        fileChanged = true;
        totalFixed++;
      }
    }
  }

  if (fileChanged) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
    totalFiles++;
  }
}

console.log(`\nDone. Fixed ${totalFixed} truncated quoted_text values across ${totalFiles} files.`);
