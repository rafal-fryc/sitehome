/**
 * merge-classifications.ts
 *
 * Reads classification manifest files (classify-result-*.json) and
 * merges the tags into the source files in public/data/ftc-files/.
 *
 * Usage: npx tsx scripts/merge-classifications.ts
 */

import { readFileSync, writeFileSync, renameSync, readdirSync } from "fs";
import * as path from "path";

function writeJSONSafe(filePath: string, data: unknown): void {
  const tmp = filePath + ".tmp";
  const serialized = JSON.stringify(data, null, 2);
  JSON.parse(serialized);
  writeFileSync(tmp, serialized, "utf-8");
  renameSync(tmp, filePath);
}

interface ProvisionClassification {
  n: string; // provision_number
  statutory_topics: string[];
  practice_areas: string[];
  remedy_types: string[];
}

interface CaseClassification {
  file: string;
  statutory_topics: string[];
  practice_areas: string[];
  industry_sectors: string[];
  provisions: ProvisionClassification[];
}

const DATA_DIR = path.resolve("public/data/ftc-files");
const MANIFESTS_DIR = path.resolve("public/data");

// Load all manifest files
const manifestFiles = readdirSync(MANIFESTS_DIR)
  .filter((f) => f.startsWith("classify-result-") && f.endsWith(".json"))
  .sort();

if (manifestFiles.length === 0) {
  console.error("No classify-result-*.json files found in public/data/");
  process.exit(1);
}

let merged = 0;
let errors = 0;
let totalFiles = 0;

for (const mf of manifestFiles) {
  const manifest: CaseClassification[] = JSON.parse(
    readFileSync(path.join(MANIFESTS_DIR, mf), "utf-8")
  );
  console.log(`Processing ${mf}: ${manifest.length} classifications`);
  totalFiles += manifest.length;

  for (const cls of manifest) {
    const filePath = path.join(DATA_DIR, cls.file);
    try {
      const data = JSON.parse(readFileSync(filePath, "utf-8"));

      // Apply case-level tags
      data.case_info.statutory_topics = cls.statutory_topics;
      data.case_info.practice_areas = cls.practice_areas;
      data.case_info.industry_sectors = cls.industry_sectors;

      // Apply provision-level tags
      const provisions = data.order?.provisions ?? [];
      for (const prov of provisions) {
        const match = cls.provisions.find(
          (p) => p.n === prov.provision_number
        );
        if (match) {
          prov.statutory_topics = match.statutory_topics;
          prov.practice_areas = match.practice_areas;
          prov.remedy_types = match.remedy_types;
        } else {
          // Default empty arrays for unmatched provisions
          prov.statutory_topics = prov.statutory_topics ?? [];
          prov.practice_areas = prov.practice_areas ?? [];
          prov.remedy_types = prov.remedy_types ?? [];
        }
      }

      writeJSONSafe(filePath, data);
      merged++;
    } catch (err) {
      console.error(`ERR  ${cls.file}: ${err}`);
      errors++;
    }
  }
}

console.log(
  `\nDone: ${merged} merged, ${errors} errors, ${totalFiles} total from ${manifestFiles.length} manifests`
);

if (errors > 0) {
  process.exit(1);
}
