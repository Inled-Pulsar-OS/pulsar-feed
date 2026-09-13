#!/usr/bin/env node
// Parses a GitHub issue into operation + fields (writes to GITHUB_OUTPUT).
// Accepts issue-form templates and plain-text issues.
import fs from "node:fs";

const title = process.env.TITLE || "";
const body = process.env.BODY || "";
const labels = JSON.parse(process.env.LABELS || "[]");

const out = (k, v) => fs.appendFileSync(process.env.GITHUB_OUTPUT, `${k}=${v}\n`);

// Normalize form answers: "### Field\r\n\r\nValue" OR "Field: Value"
function field(pattern) {
  const form = body.match(new RegExp(`###?\\s*${pattern}\\s*\\r?\\n\\r?\\n([\\s\\S]*?)(?=\\r?\\n###?\\s|$)`, "i"));
  const val = form ? form[1].trim() : "";
  if (val && !/^_no.?response_?$/i.test(val)) return val.replace(/^["']|["']$/g, "");
  const kv = body.match(new RegExp(`${pattern}\\s*:\\s*(.+)`, "i"));
  return kv ? kv[1].trim().replace(/^["']|["']$/g, "") : "";
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

const catField = field("Categoría|Category|Category name").toLowerCase();
out("operation", operation);
out("title", (field("Título|Title") || title.replace(/^[^:]*:\s*/, "")).split("\n")[0]);
// New category name comes from the "Category name" field; for posts, validate
// against categories.json so typos fail loudly instead of creating orphan pills.
const newCatName = field("Category name");
out("new_category_name", newCatName);
out("category_label", field("Display label"));
out("category_color", field("Accent color"));
out("category", catField.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "general");
out("slug", (field("Slug|Identificador|Post") || "").toLowerCase().trim().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, ""));
// Body: multi-line, strip code fences used in forms
let content = field("Contenido|Contenido \\(markdown\\)|Body|Nuevo contenido") || "";
content = content.replace(/^```(?:markdown|md)?\r?\n([\s\S]*?)\r?\n```$/m, "$1");
out("body", content);
console.log(`operation=${operation} category=${catField || "general"}`);
