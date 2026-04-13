/**
 * Fetches research memos from rafal-fryc/zwiad-reports at build time
 * and writes them to src/data/reports.generated.json for bundling.
 *
 * Source repo:      https://github.com/rafal-fryc/zwiad-reports
 * Manifest:         /index.json  (list of {slug, file, title, date, topic, summary})
 * Memo files:       /memos/<slug>.md with YAML frontmatter + markdown body
 */
import * as fs from "fs";
import * as path from "path";
import matter from "gray-matter";

const REPO = "rafal-fryc/zwiad-reports";
const BRANCH = "main";
const RAW_BASE = `https://raw.githubusercontent.com/${REPO}/${BRANCH}`;
const OUT_FILE = path.resolve("public/data/reports.json");

type ManifestEntry = {
  slug: string;
  file: string;
  title: string;
  date: string;
  topic: string;
  jurisdiction?: string;
  summary: string;
  cluster?: string;
  cluster_slug?: string;
};

type GeneratedReport = ManifestEntry & { body: string };

type Cluster = {
  slug: string;
  name: string;
  topic: string;
  summary: string;
  reports: string[];
  dateRange: { first: string; latest: string };
  jurisdictions: string[];
};

function normalizeDate(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "string") return value.slice(0, 10);
  throw new Error(`Invalid date: ${String(value)}`);
}

function cleanBody(body: string): string {
  // Strip in-body "Related Reports" section — the site provides its own
  // related-reports footer with working links, and the embedded section
  // is either empty ("No related reports found in the knowledge base.")
  // or has broken markdown-relative links.
  let out = body.replace(
    /^##\s+Related\s+Reports[\s\S]*?(?=^##\s|\Z)/gim,
    "",
  );
  // Strip confidence tags like "[HIGH confidence]", "[MEDIUM confidence]",
  // "[LOW confidence]" that the pipeline appends to headings.
  out = out.replace(/\s*\[(HIGH|MEDIUM|LOW)\s+confidence\]/gi, "");
  return out.trim();
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Fetch ${url} failed: ${res.status} ${res.statusText}`);
  }
  return res.text();
}

async function main() {
  console.log(`[build-reports] Fetching manifest from ${RAW_BASE}/index.json`);
  const manifestRaw = await fetchText(`${RAW_BASE}/index.json`);
  const manifest = JSON.parse(manifestRaw) as { memos: ManifestEntry[] };

  if (!Array.isArray(manifest.memos)) {
    throw new Error("index.json missing 'memos' array");
  }

  const memos: GeneratedReport[] = [];
  const slugs = new Set<string>();

  for (const entry of manifest.memos) {
    if (slugs.has(entry.slug)) {
      throw new Error(`Duplicate slug in manifest: ${entry.slug}`);
    }
    slugs.add(entry.slug);

    const raw = await fetchText(`${RAW_BASE}/${entry.file}`);
    const parsed = matter(raw);
    const fm = parsed.data as Partial<ManifestEntry>;

    memos.push({
      slug: entry.slug,
      file: entry.file,
      title: fm.title || entry.title,
      date: normalizeDate(fm.date ?? entry.date),
      topic: fm.topic || entry.topic,
      jurisdiction: fm.jurisdiction || entry.jurisdiction || "Unknown",
      summary: fm.summary || entry.summary,
      cluster: fm.cluster || entry.cluster || "",
      cluster_slug: fm.cluster_slug || entry.cluster_slug || "",
      body: cleanBody(parsed.content),
    });
    console.log(`[build-reports] + ${entry.slug}`);
  }

  memos.sort((a, b) => (a.date < b.date ? 1 : -1));

  // Fetch clusters.json — tolerate a 404 in case it's the pre-cluster state of the repo
  let clusters: Cluster[] = [];
  try {
    const clustersRaw = await fetchText(`${RAW_BASE}/clusters.json`);
    clusters = JSON.parse(clustersRaw) as Cluster[];
    if (!Array.isArray(clusters)) throw new Error("clusters.json is not an array");
    console.log(`[build-reports] Loaded ${clusters.length} clusters`);
  } catch (e) {
    console.warn(`[build-reports] clusters.json unavailable — falling back to empty list: ${e}`);
    clusters = [];
  }

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify({ memos, clusters }, null, 2));
  console.log(`[build-reports] Wrote ${memos.length} report(s) and ${clusters.length} cluster(s) to ${OUT_FILE}`);
}

main().catch((err) => {
  console.error("[build-reports] FAILED:", err);
  process.exit(1);
});
