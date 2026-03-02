// Merges generated takeaways back into individual case JSON files
const fs = require("fs");
const path = require("path");

const dir = "public/data/ftc-files";
let merged = 0;
let errors = 0;

// Read all output batch files
for (let i = 0; i < 4; i++) {
  const outPath = `public/data/_takeaway_output_${i}.json`;
  if (!fs.existsSync(outPath)) {
    console.log(`SKIP batch ${i}: ${outPath} not found`);
    continue;
  }

  const takeaways = JSON.parse(fs.readFileSync(outPath, "utf-8"));
  console.log(`Processing batch ${i}: ${takeaways.length} takeaways`);

  for (const entry of takeaways) {
    const filePath = path.join(dir, entry.id + ".json");
    if (!fs.existsSync(filePath)) {
      console.log(`ERR: ${filePath} not found`);
      errors++;
      continue;
    }

    try {
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      data.takeaway_brief = entry.brief;
      data.takeaway_full = entry.full;

      // Atomic write
      const tmp = filePath + ".tmp";
      const serialized = JSON.stringify(data, null, 2);
      JSON.parse(serialized); // validate
      fs.writeFileSync(tmp, serialized, "utf-8");
      fs.renameSync(tmp, filePath);
      merged++;
    } catch (err) {
      console.log(`ERR: ${entry.id}: ${err.message}`);
      errors++;
    }
  }
}

console.log(`\nDone: ${merged} merged, ${errors} errors`);

// Cleanup temp files
for (let i = 0; i < 4; i++) {
  for (const prefix of ["_takeaway_batch_", "_takeaway_output_"]) {
    const f = `public/data/${prefix}${i}.json`;
    if (fs.existsSync(f)) fs.unlinkSync(f);
  }
}
if (fs.existsSync("public/data/_takeaway_input.json")) {
  fs.unlinkSync("public/data/_takeaway_input.json");
}
console.log("Cleaned up temp files.");
