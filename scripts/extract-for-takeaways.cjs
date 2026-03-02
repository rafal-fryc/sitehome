// Extracts compact case data for agent-based takeaway generation
const fs = require("fs");
const path = require("path");

const dir = "public/data/ftc-files";
const files = fs.readdirSync(dir).filter(f => f.endsWith(".json")).sort();
console.log("Total case files:", files.length);

const cases = files.map(f => {
  const data = JSON.parse(fs.readFileSync(path.join(dir, f), "utf-8"));
  const ci = data.case_info || {};
  const complaint = data.complaint || {};
  const provisions = data.order?.provisions || [];
  return {
    id: f.replace(".json", ""),
    company: ci.company?.name || "Unknown",
    year: ci.case_date?.year || "Unknown",
    violation_type: ci.violation_type || "Unknown",
    legal_authority: ci.legal_authority || "Unknown",
    factual_background: (complaint.factual_background || "").slice(0, 600),
    representations: (complaint.representations_made || []).slice(0, 5).map(r => r.description).join("; "),
    counts: (complaint.counts || []).map(c => c.title).join("; "),
    provision_titles: provisions.map(p => p.title || "Untitled").join("; "),
    already_has_takeaway: data.takeaway_brief !== undefined
  };
});

const needsProcessing = cases.filter(c => !c.already_has_takeaway);
console.log("Already have takeaway:", cases.length - needsProcessing.length);
console.log("Need processing:", needsProcessing.length);

// Split into 4 chunks for parallel processing
const chunkSize = Math.ceil(needsProcessing.length / 4);
for (let i = 0; i < 4; i++) {
  const chunk = needsProcessing.slice(i * chunkSize, (i + 1) * chunkSize);
  const outPath = `public/data/_takeaway_batch_${i}.json`;
  fs.writeFileSync(outPath, JSON.stringify(chunk, null, 2));
  console.log(`Batch ${i}: ${chunk.length} cases -> ${outPath}`);
}
