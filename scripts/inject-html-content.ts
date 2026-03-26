/**
 * inject-html-content.ts
 *
 * Post-build script that injects rich HTML content into dist/index.html
 * so LLM fetchers see real content instead of an empty SPA shell.
 *
 * Also generates llms.txt, llms-full.txt, and data-index.json.
 *
 * Run after `vite build`: npx tsx scripts/inject-html-content.ts
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve } from "path";

const DIST = resolve(process.cwd(), "dist");
const SITE_URL = "https://www.rafalsportfolio.me";

// --- Helpers ---

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function readJson(path: string): any {
  return JSON.parse(readFileSync(path, "utf-8"));
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

// --- Load data ---

const cases = readJson(resolve(DIST, "data/ftc-cases.json"));
const manifest = readJson(resolve(DIST, "data/provisions/manifest.json"));
const patterns = readJson(resolve(DIST, "data/ftc-patterns.json"));
const behavioral = readJson(resolve(DIST, "data/ftc-behavioral-patterns.json"));

const totalCases = cases.total_cases as number;
const totalProvisions = manifest.total_provisions as number;
const totalPatterns = patterns.total_patterns as number;
const totalBehavioral = behavioral.total_patterns as number;

// Get statutory topics from manifest
const statutoryTopics = Object.entries(manifest.topics as Record<string, { count: number; category: string; label: string }>)
  .filter(([, t]) => t.category === "statutory")
  .sort((a, b) => b[1].count - a[1].count)
  .map(([, t]) => `${t.label} (${t.count} provisions)`);

// Get date range
const sortedCases = [...cases.cases].sort(
  (a: any, b: any) => new Date(a.date_issued).getTime() - new Date(b.date_issued).getTime()
);
const earliestYear = new Date(sortedCases[0].date_issued).getFullYear();
const latestYear = new Date(sortedCases[sortedCases.length - 1].date_issued).getFullYear();

// Get 15 most recent cases
const recentCases = [...cases.cases]
  .sort((a: any, b: any) => new Date(b.date_issued).getTime() - new Date(a.date_issued).getTime())
  .slice(0, 15);

// --- 1. Generate HTML content for #root ---

function generateRootContent(): string {
  const recentCaseItems = recentCases
    .map((c: any) => {
      const year = new Date(c.date_issued).getFullYear();
      const topics = (c.statutory_topics || []).join(", ");
      const takeaway = c.takeaway_brief ? escapeHtml(c.takeaway_brief) : "";
      return `<li><strong>${escapeHtml(c.company_name)} (${year})</strong>${topics ? ` — ${escapeHtml(topics)}` : ""}${takeaway ? `. ${takeaway}` : ""}</li>`;
    })
    .join("\n        ");

  return `
    <header>
      <h1>FTC Enforcement Provisions Library</h1>
      <p>Interactive analysis of ${totalCases} Federal Trade Commission enforcement actions
      spanning ${earliestYear}–${latestYear}, with ${totalProvisions.toLocaleString()} searchable consent order
      provisions organized by statute, practice area, and remedy type.</p>
    </header>
    <main>
      <section>
        <h2>Database Coverage</h2>
        <ul>
          <li>${totalCases} enforcement actions across ${latestYear - earliestYear + 1} years (${earliestYear}–${latestYear})</li>
          <li>${totalProvisions.toLocaleString()} consent order provisions with verbatim text and paragraph-level citations</li>
          <li>${totalPatterns} cross-case remedy patterns</li>
          <li>${totalBehavioral} behavioral enforcement categories</li>
          <li>Statutory topics: ${statutoryTopics.join(", ")}</li>
        </ul>
      </section>
      <section>
        <h2>Recent Enforcement Actions</h2>
        <ul>
        ${recentCaseItems}
        </ul>
      </section>
      <section>
        <h2>Analysis Views</h2>
        <p>This site provides four interactive analysis views:</p>
        <ul>
          <li><strong>Analytics</strong> — Enforcement trends by year, administration, topic, and violation type</li>
          <li><strong>Provisions Library</strong> — Search ${totalProvisions.toLocaleString()} provisions by statute and remedy type with verbatim order language</li>
          <li><strong>Industries</strong> — Sector-level enforcement analysis across 8 industry categories</li>
          <li><strong>Patterns</strong> — ${totalPatterns} remedy patterns and ${totalBehavioral} behavioral categories across cases</li>
        </ul>
      </section>
      <section>
        <h2>Data Access</h2>
        <p>All data is available as structured JSON for programmatic access:</p>
        <ul>
          <li><a href="/data/ftc-cases.json">Case Database</a> — ${totalCases} enforcement actions with metadata and classifications</li>
          <li><a href="/data/provisions/manifest.json">Provisions Index</a> — Index of ${totalProvisions.toLocaleString()} provisions across ${Object.keys(manifest.topics).length} topic shards</li>
          <li><a href="/data/ftc-patterns.json">Remedy Patterns</a> — ${totalPatterns} cross-case remedy patterns</li>
          <li><a href="/data/ftc-behavioral-patterns.json">Behavioral Patterns</a> — ${totalBehavioral} behavioral enforcement categories</li>
          <li><a href="/llms.txt">llms.txt</a> — Structured overview for LLMs</li>
          <li><a href="/llms-full.txt">Full Content Export</a> — Comprehensive Markdown content dump</li>
        </ul>
      </section>
    </main>
  `;
}

// --- 2. Generate JSON-LD ---

function generateJsonLd(): string {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "name": "FTC Enforcement Provisions Library",
    "description": `Searchable database of ${totalProvisions.toLocaleString()} provisions from ${totalCases} FTC consent orders (${earliestYear}–${latestYear}), organized by statutory topic, practice area, and remedy type.`,
    "url": `${SITE_URL}/FTCAnalytics`,
    "creator": {
      "@type": "Person",
      "name": "Rafal Fryc"
    },
    "temporalCoverage": `${earliestYear}/${latestYear}`,
    "distribution": [
      {
        "@type": "DataDownload",
        "encodingFormat": "application/json",
        "contentUrl": `${SITE_URL}/data/ftc-cases.json`,
        "name": "FTC Enforcement Cases"
      },
      {
        "@type": "DataDownload",
        "encodingFormat": "application/json",
        "contentUrl": `${SITE_URL}/data/ftc-patterns.json`,
        "name": "Remedy Patterns"
      },
      {
        "@type": "DataDownload",
        "encodingFormat": "text/plain",
        "contentUrl": `${SITE_URL}/llms-full.txt`,
        "name": "Full Content Export (Markdown)"
      }
    ],
    "keywords": [
      "FTC", "Federal Trade Commission", "enforcement", "consent orders",
      "COPPA", "FCRA", "GLBA", "data security", "privacy", "provisions"
    ]
  };
  return `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`;
}

// --- 3. Inject into dist/index.html ---

function injectIntoHtml(): void {
  const htmlPath = resolve(DIST, "index.html");
  let html = readFileSync(htmlPath, "utf-8");

  // Replace empty #root with content-filled #root
  const rootContent = generateRootContent();
  html = html.replace(
    '<div id="root"></div>',
    `<div id="root">${rootContent}</div>`
  );

  // Inject JSON-LD before </head>
  const jsonLd = generateJsonLd();
  html = html.replace("</head>", `  ${jsonLd}\n  </head>`);

  writeFileSync(htmlPath, html, "utf-8");
  console.log(`✓ Injected content into dist/index.html`);
}

// --- 4. Generate llms.txt ---

function generateLlmsTxt(): void {
  const topicList = Object.entries(manifest.topics as Record<string, { count: number; shard: string; label: string }>)
    .filter(([, t]) => (t as any).category === "statutory")
    .sort((a, b) => b[1].count - a[1].count)
    .map(([, t]) => `- [${t.label} Provisions](${SITE_URL}/data/provisions/${t.shard}): ${t.count} provisions`);

  const content = `# FTC Enforcement Provisions Library

> A searchable database of ${totalProvisions.toLocaleString()} provisions from ${totalCases} FTC consent orders (${earliestYear}–${latestYear}), organized by statutory topic, practice area, and remedy type.

## Overview

This site provides structured data on FTC enforcement actions including consent order provisions with verbatim text, cross-case remedy patterns, and behavioral enforcement categories.

- [Full Content Export](${SITE_URL}/llms-full.txt): Comprehensive Markdown covering all cases, provisions, patterns, and categories
- [Data Catalog](${SITE_URL}/data/data-index.json): Machine-readable index of all JSON data files with schemas and querying guide

## Data Files

- [Case Database](${SITE_URL}/data/ftc-cases.json): ${totalCases} enforcement actions with metadata, classifications, and takeaways
- [Provisions Manifest](${SITE_URL}/data/provisions/manifest.json): Index of provision shard files across statutory topics, practice areas, and remedy types
- [Remedy Patterns](${SITE_URL}/data/ftc-patterns.json): ${totalPatterns} cross-case remedy patterns
- [Behavioral Patterns](${SITE_URL}/data/ftc-behavioral-patterns.json): ${totalBehavioral} behavioral enforcement categories

## Provision Shards by Topic

### Statutory Topics

${topicList.join("\n")}
`;

  writeFileSync(resolve(DIST, "llms.txt"), content, "utf-8");
  const size = (Buffer.byteLength(content) / 1024).toFixed(1);
  console.log(`✓ Generated llms.txt (${size} KB)`);
}

// --- 5. Generate llms-full.txt ---

function extractFirstSentence(text: string, maxLen = 200): string {
  if (!text) return "";
  // Match sentence end: period followed by space and uppercase letter (handles U.S.C., C.F.R., Inc.)
  const match = text.match(/^(.+?\.)\s+(?=[A-Z])/);
  const sentence = match ? match[1] : text.split(".")[0] + ".";
  return sentence.length > maxLen ? sentence.substring(0, maxLen) + "..." : sentence;
}

function generateLlmsFullTxt(): void {
  const lines: string[] = [];

  lines.push(`# FTC Enforcement Provisions Library — Full Content Export`);
  lines.push(``);
  lines.push(`> ${totalCases} enforcement actions, ${totalProvisions.toLocaleString()} provisions, ${totalPatterns} remedy patterns, ${totalBehavioral} behavioral categories (${earliestYear}–${latestYear})`);
  lines.push(``);

  // Cases section
  lines.push(`## Cases (${totalCases})`);
  lines.push(``);
  const sortedByDate = [...cases.cases].sort(
    (a: any, b: any) => new Date(b.date_issued).getTime() - new Date(a.date_issued).getTime()
  );
  for (const c of sortedByDate) {
    const topics = (c.statutory_topics || []).join(", ");
    lines.push(`### ${c.company_name} (${c.date_issued})`);
    if (topics) lines.push(`**Topics:** ${topics}`);
    if (c.industry_sectors?.length) lines.push(`**Industry:** ${c.industry_sectors.join(", ")}`);
    if (c.takeaway_brief) lines.push(`> ${c.takeaway_brief}`);
    lines.push(``);
  }

  // Provisions section (statutory topics only to avoid duplication)
  lines.push(`## Provisions by Statutory Topic`);
  lines.push(``);

  const statutoryEntries = Object.entries(manifest.topics as Record<string, any>)
    .filter(([, t]) => t.category === "statutory")
    .sort((a, b) => b[1].count - a[1].count);

  for (const [key, topic] of statutoryEntries) {
    lines.push(`### ${topic.label} (${topic.count} provisions)`);
    lines.push(``);
    try {
      const shardPath = resolve(DIST, "data/provisions", topic.shard);
      const shard = readJson(shardPath);
      const provisions = shard.provisions || shard;
      const items = Array.isArray(provisions) ? provisions : [];
      for (const p of items.slice(0, 50)) {
        const title = p.title || p.provision_title || "Untitled";
        const excerpt = extractFirstSentence(p.verbatim_text || p.quoted_text || "");
        lines.push(`- **${title}**${excerpt ? ` — ${excerpt}` : ""}`);
      }
      if (items.length > 50) {
        lines.push(`- ... and ${items.length - 50} more provisions`);
      }
    } catch {
      lines.push(`- (see ${SITE_URL}/data/provisions/${topic.shard})`);
    }
    lines.push(``);
  }

  // Patterns section
  lines.push(`## Remedy Patterns (${totalPatterns})`);
  lines.push(``);
  for (const p of patterns.patterns) {
    lines.push(`### ${p.name} (${p.case_count} cases)`);
    if (p.variants?.length) {
      const topVariants = p.variants.slice(0, 3).map((v: any) => v.company_name || v.name || "").filter(Boolean);
      if (topVariants.length) lines.push(`Companies: ${topVariants.join(", ")}`);
    }
    lines.push(``);
  }

  // Behavioral categories section
  lines.push(`## Behavioral Categories (${totalBehavioral})`);
  lines.push(``);
  for (const b of behavioral.patterns) {
    lines.push(`### ${b.name} (${b.case_count} cases)`);
    if (b.description) lines.push(`${b.description}`);
    lines.push(``);
  }

  const content = lines.join("\n");
  writeFileSync(resolve(DIST, "llms-full.txt"), content, "utf-8");
  const size = (Buffer.byteLength(content) / 1024).toFixed(1);
  console.log(`✓ Generated llms-full.txt (${size} KB)`);
}

// --- 6. Generate data-index.json ---

function generateDataIndex(): void {
  const index = {
    generated_at: new Date().toISOString(),
    site_url: SITE_URL,
    description: "Machine-readable index of all FTC Enforcement Provisions Library data files",
    data_files: [
      {
        name: "FTC Cases",
        path: "/data/ftc-cases.json",
        url: `${SITE_URL}/data/ftc-cases.json`,
        record_count: totalCases,
        description: "All FTC enforcement actions with metadata, classifications, and takeaways",
        schema: {
          total_cases: "number",
          cases: "array of objects with: id, company_name, date_issued, docket_number, violation_type, legal_authority, statutory_topics, practice_areas, industry_sectors, remedy_types, takeaway_brief, ftc_url, num_provisions"
        }
      },
      {
        name: "Provisions Manifest",
        path: "/data/provisions/manifest.json",
        url: `${SITE_URL}/data/provisions/manifest.json`,
        record_count: totalProvisions,
        description: "Index of provision shard files organized by topic",
        schema: {
          total_provisions: "number",
          total_cases: "number",
          topics: "object keyed by topic slug with: count, shard (filename), category (statutory|practice_area|remedy_type), label"
        }
      },
      {
        name: "Remedy Patterns",
        path: "/data/ftc-patterns.json",
        url: `${SITE_URL}/data/ftc-patterns.json`,
        record_count: totalPatterns,
        description: "Cross-case remedy patterns identified across enforcement actions",
        schema: {
          total_patterns: "number",
          patterns: "array of objects with: id, name, is_structural, case_count, variant_count, year_range, variants"
        }
      },
      {
        name: "Behavioral Patterns",
        path: "/data/ftc-behavioral-patterns.json",
        url: `${SITE_URL}/data/ftc-behavioral-patterns.json`,
        record_count: totalBehavioral,
        description: "Behavioral enforcement categories showing what businesses did wrong",
        schema: {
          total_patterns: "number",
          patterns: "array of objects with: id, name, description, case_count, year_range, cases"
        }
      }
    ],
    querying_guide: {
      description: "Common query patterns for the FTC data",
      queries: [
        { pattern: "Find all COPPA cases", method: "Filter cases where statutory_topics includes 'COPPA'" },
        { pattern: "Find cases by company", method: "Filter cases by company_name field" },
        { pattern: "Browse provisions by topic", method: "Read manifest.json, then fetch the shard file for the desired topic" },
        { pattern: "Find recent enforcement actions", method: "Sort cases by date_issued descending" },
        { pattern: "Explore remedy patterns", method: "Read ftc-patterns.json, filter by is_structural or case_count" },
        { pattern: "Understand behavioral categories", method: "Read ftc-behavioral-patterns.json for 'what the business did wrong' patterns" }
      ]
    }
  };

  writeFileSync(resolve(DIST, "data/data-index.json"), JSON.stringify(index, null, 2), "utf-8");
  console.log(`✓ Generated data/data-index.json`);
}

// --- Main ---

console.log("\n📄 Injecting LLM-accessible content into build output...\n");

injectIntoHtml();
generateLlmsTxt();
generateLlmsFullTxt();
generateDataIndex();

console.log("\n✅ Done. LLM content injection complete.\n");
