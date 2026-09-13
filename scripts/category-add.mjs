#!/usr/bin/env node
// Adds a new category to content/categories.json (issue-driven, no code changes).
// Env: TITLE, CATEGORY (issue form field) or NEW_CATEGORY_NAME, CATEGORY_COLOR (hex, optional), CATEGORY_LABEL (optional)
import fs from "node:fs";
import path from "node:path";

const CATEGORIES_FILE = path.resolve("content/categories.json");

const slugify = (s) =>
  (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const rawName = process.env.CATEGORY || process.env.NEW_CATEGORY_NAME ||
  (process.env.TITLE || "").replace(/^[^:]*:\s*/, "").trim();
if (!rawName) { console.error("::error::No category name provided."); process.exit(1); }

const slug = slugify(rawName);
if (!slug) { console.error("::error::Could not derive a valid category id."); process.exit(1); }

let cats = {};
try { cats = JSON.parse(fs.readFileSync(CATEGORIES_FILE, "utf8")); } catch {}

if (cats[slug]) {
  console.log(`Category "${slug}" already exists — nothing to do.`);
  process.exit(0);
}

cats[slug] = {
  label: process.env.CATEGORY_LABEL || rawName.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
  ...(process.env.CATEGORY_COLOR ? { color: process.env.CATEGORY_COLOR } : {}),
};

fs.mkdirSync(path.dirname(CATEGORIES_FILE), { recursive: true });
fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(cats, null, 2) + "\n");
console.log(`Added category "${slug}" -> ${CATEGORIES_FILE}`);
