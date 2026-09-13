#!/usr/bin/env node
// Deletes content/posts/<slug>.md
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

fs.unlinkSync(file);
console.log(`Deleted ${file}`);
