const fs = require('fs');

const targetCases = [
  'public/data/ftc-files/03.12_rockyou.json',
  'public/data/ftc-files/11.11_godwin_jones_o._dba_skidekids.com.json',
  'public/data/ftc-files/04.10_united_states_of_america_v._central_credit.json',
  'public/data/ftc-files/09.10_choicepoint.json',
  'public/data/ftc-files/11.20_midwest_recovery_systems.json',
  'public/data/ftc-files/05.24_blackbaud.json',
  'public/data/ftc-files/11.10_echometrix.json',
];

function isDoubledWord(word) {
  if (word.length < 4 || word.length % 2 !== 0) return false;
  for (let i = 0; i < word.length; i += 2) {
    if (word[i] !== word[i + 1]) return false;
  }
  return true;
}

function isDoubledText(text) {
  if (!text || text.length < 20) return false;
  const words = text.split(/\s+/).filter(w => w.length >= 4);
  if (words.length < 3) return false;
  const doubled = words.filter(w => isDoubledWord(w)).length;
  return doubled / words.length > 0.5;
}

function deduplicateWord(word) {
  let result = '';
  for (let i = 0; i < word.length; i += 2) {
    result += word[i];
  }
  return result;
}

function deduplicateText(text) {
  // Split on whitespace, preserving whitespace
  return text.replace(/\S+/g, (word) => {
    if (isDoubledWord(word)) {
      return deduplicateWord(word);
    }
    return word;
  });
}

for (const file of targetCases) {
  if (!fs.existsSync(file)) { console.log(`${file}: not found, skipping`); continue; }
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  let fixes = 0;

  function fixStrings(obj) {
    if (obj === null || obj === undefined || typeof obj !== 'object') return;
    for (const key of Object.keys(obj)) {
      if (typeof obj[key] === 'string' && isDoubledText(obj[key])) {
        obj[key] = deduplicateText(obj[key]);
        fixes++;
      } else if (Array.isArray(obj[key])) {
        for (let i = 0; i < obj[key].length; i++) {
          if (typeof obj[key][i] === 'string' && isDoubledText(obj[key][i])) {
            obj[key][i] = deduplicateText(obj[key][i]);
            fixes++;
          } else if (typeof obj[key][i] === 'object') {
            fixStrings(obj[key][i]);
          }
        }
      } else if (typeof obj[key] === 'object') {
        fixStrings(obj[key]);
      }
    }
  }

  fixStrings(data);
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
  console.log(`${file}: fixed ${fixes} doubled fields`);
}
