const fs = require('fs');
const files = [
  'public/data/ftc-files/02.23_goodrx_holdings.json',
  'public/data/ftc-files/05.20_jasjit_gotra.json'
];

for (const file of files) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  let fixes = 0;

  function clean(obj) {
    if (obj === null || obj === undefined || typeof obj !== 'object') return;
    for (const key of Object.keys(obj)) {
      if (typeof obj[key] === 'string' && obj[key].includes('(cid:')) {
        obj[key] = '';
        fixes++;
      } else if (Array.isArray(obj[key])) {
        obj[key].forEach(item => clean(item));
      } else if (typeof obj[key] === 'object') {
        clean(obj[key]);
      }
    }
  }

  clean(data);
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
  console.log(`${file}: cleared ${fixes} fields with CID garbage`);
}
