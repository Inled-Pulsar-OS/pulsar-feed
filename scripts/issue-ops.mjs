#!/usr/bin/env node
// Parses a GitHub issue into operation + fields (writes to GITHUB_OUTPUT).
// Accepts issue-form templates and plain-text issues.
import fs from "node:fs";

const title = process.env.TITLE || "";
const body = process.env.BODY || "";
const labels = JSON.parse(process.env.LABELS || "[]");

// Multiline-safe GITHUB_OUTPUT writes (heredoc delimiter format)
const outPath = process.env.GITHUB_OUTPUT;
if (!outPath) {
  console.error("GITHUB_OUTPUT is not set; this script runs inside GitHub Actions.");
  process.exit(1);
}
const outs = [];
const out = (k, v) => outs.push([k, v]);

// Split the issue body into "### Header" sections, then find the one whose
// header starts with any of the alternatives (case-insensitive).
// Handles trailing words in labels ("Slug of the post to edit").
function field(pattern) {
  const sections = body.split(/^###\s*/m).slice(1);
  for (const section of sections) {
    const nl = section.indexOf("\n");
    if (nl === -1) continue;
    const header = section.slice(0, nl).trim();
    const value = section.slice(nl + 1).trim();
    const re = new RegExp(`^(?:${pattern})(?:\\b|\\s|\\(|$)`, "i");
    if (re.test(header)) {
      if (!value || /^_no.?response_?$/i.test(value)) return "";
      return value.replace(/^["']|["']$/g, "");
    }
  }
  return "";
}

// Operation detection: from title prefix and/or labels
const t = title.toLowerCase();
let operation = "unknown";
if (/new category/.test(t) || labels.some((l) => /^(add-category|new-category)$/i.test(l)))
  operation = "add-category";
else if (/(nueva noticia|new post|crear|create|\bnuevo\b)/.test(t) || labels.some((l) => /^(create|nueva-noticia)$/i.test(l)))
  operation = "create";
else if (/(editar|edit\b|modificar|update)/.test(t) || labels.some((l) => /^(edit|editar)$/i.test(l)))
  operation = "edit";
else if (/(eliminar|delete|borrar|remove)/.test(t) || labels.some((l) => /^(delete|eliminar)$/i.test(l)))
  operation = "delete";

const newCatName = field("Category name");
const catField = (field("Categoría|Category") || (operation === "add-category" ? newCatName : "")).toLowerCase();
const displayLabel = field("Display label");
const accentColor = field("Accent color");
const postTitle = field("Título|Title") || title.replace(/^[^:]*:\s*/, "").trim();
const slug = field("Slug|Identificador|Post").toLowerCase().trim().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");

// Body: multi-line, strip optional code fences used in forms
let content = field("Contenido|Contenido \\(markdown\\)|Content|Body|Nuevo contenido") || "";
content = content.replace(/^```(?:markdown|md)?\r?\n([\s\S]*?)\r?\n```$/m, "$1").trim();

out("operation", operation);
out("title", postTitle.split("\n")[0]);
out("new_category_name", newCatName);
out("category_label", displayLabel);
out("category_color", accentColor);
out("category", catField.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "general");
out("slug", slug);
out("body", content);

fs.writeFileSync(
  outPath,
  outs.map(([k, v]) => `${k}<<EOF\n${v}\nEOF`).join("\n") + "\n"
);
console.log(`operation=${operation} category=${catField || "general"} slug=${slug || "-"}`);
