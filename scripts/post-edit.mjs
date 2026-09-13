#!/usr/bin/env node
// Edits content/posts/<slug>.md: title, category and/or body.
import fs from "node:fs";
import path from "node:path";

const slug = (process.env.SLUG || "").toLowerCase().trim();
if (!slug) { console.error("::error::Falta el campo Slug/Identificador."); process.exit(1); }

const file = path.resolve(`content/posts/${slug}.md`);
if (!fs.existsSync(file)) {
  const all = fs.readdirSync(path.resolve("content/posts")).filter((f) => f.endsWith(".md"));
  console.error(`::error::No existe el post "${slug}". Posts disponibles: ${all.join(", ")}`);
  process.exit(1);
}

const raw = fs.readFileSync(file, "utf8");
const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
const newTitle = process.env.TITLE;
const newCategory = (process.env.CATEGORY || "").toLowerCase();
const newBody = (process.env.BODY || "").trim();

let fm = m[1];
if (newTitle && !newTitle.startsWith("Editar")) {
  fm = fm.replace(/^title: .*$/m, `title: ${newTitle}`);
}
if (newCategory) fm = fm.replace(/^category: .*$/m, `category: ${newCategory}`);

let body = m[2];
if (newBody) {
  body = newBody.replace(/^```(?:markdown|md)?\r?\n([\s\S]*?)\r?\n```$/m, "$1") + "\n";
}

fs.writeFileSync(file, `---\n${fm}\n---\n\n${body}`);
console.log(`Edited ${file}`);
