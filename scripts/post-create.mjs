#!/usr/bin/env node
// Creates content/posts/<slug>.md from issue data.
import fs from "node:fs";
import path from "node:path";

const title = process.env.TITLE || "Sin título";
const category = process.env.CATEGORY || "general";
const body = (process.env.BODY || "").trim();
const issueNumber = process.env.ISSUE_NUMBER || "";
const date = new Date().toISOString().slice(0, 10);

let slug = (process.env.SLUG || "").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
if (!slug) slug = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || `post-${issueNumber || Date.now()}`;

const dir = path.resolve("content/posts");
fs.mkdirSync(dir, { recursive: true });
const file = path.join(dir, `${slug}.md`);

if (fs.existsSync(file)) {
  console.error(`::error::Ya existe un post con slug "${slug}". Usa la plantilla Editar o elige otro título.`);
  process.exit(1);
}

const fm = `---\ntitle: ${title}\ndate: ${date}\ncategory: ${category}\nslug: ${slug}\nissue: ${issueNumber}\n---\n\n${body}\n`;
fs.writeFileSync(file, fm);
console.log(`Created ${file}`);
