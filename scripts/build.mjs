#!/usr/bin/env node
// Builds site/index.html + site/feed.xml from content/posts/*.md
// Zero dependencies: minimal front-matter parser + markdown-to-HTML converter.

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.cwd());
const POSTS_DIR = path.join(ROOT, "content/posts");
const OUT_DIR = path.join(ROOT, "site");
const PUBLIC_DIR = path.join(ROOT, "public");

const SITE_URL = process.env.SITE_URL || "https://pulsar-feed.pages.dev";
const SITE_TITLE = "Pulsar Feed";
const SITE_DESC = "Releases, progress and announcements.";

// Categories: content/categories.json holds curated metadata (color, label);
// categories discovered in posts are auto-registered so new ones can be created
// from issues without touching code.
const CATEGORIES_FILE = path.join(ROOT, "content/categories.json");
const PILL_PALETTE = [
  { bg: "#e8f5e9", fg: "#1b5e20" }, // green
  { bg: "#e3f2fd", fg: "#0d47a1" }, // blue
  { bg: "#fff3e0", fg: "#e65100" }, // orange
  { bg: "#f3e5f5", fg: "#4a148c" }, // purple
  { bg: "#e0f2f1", fg: "#004d40" }, // teal
  { bg: "#fce4ec", fg: "#880e4f" }, // pink
];

function loadCategories() {
  let meta = {};
  try { meta = JSON.parse(fs.readFileSync(CATEGORIES_FILE, "utf8")); } catch {}
  return meta;
}

function collectCategories(posts, meta) {
  const cats = new Set(Object.keys(meta));
  for (const p of posts) cats.add(p.category);
  if (!cats.size) cats.add("general");
  return [...cats].sort();
}

function categoryStyles(cats, meta) {
  return cats
    .map((c, i) => {
      const cfg = meta[c] || {};
      const pal = cfg.color
        ? { bg: cfg.color + "22", fg: cfg.color }
        : PILL_PALETTE[i % PILL_PALETTE.length];
      return `.pill-${c}{background:${pal.bg};color:${pal.fg}}`;
    })
    .join("\n");
}

function parsePost(file) {
  const raw = fs.readFileSync(file, "utf8");
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return null;
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (kv) meta[kv[1].trim()] = kv[2].trim().replace(/^["']|["']$/g, "");
  }
  return {
    title: meta.title || path.basename(file, ".md"),
    date: meta.date || "1970-01-01",
    category: (meta.category || "general").toLowerCase(),
    slug: meta.slug || path.basename(file, ".md"),
    body: m[2].trim(),
  };
}

// --- Minimal markdown -> HTML ---
function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function mdToHtml(md) {
  const blocks = md.split(/\n{2,}/);
  const out = [];
  for (let block of blocks) {
    const t = block.trim();
    if (!t) continue;
    if (/^```/.test(t)) {
      out.push("<pre><code>" + esc(t.replace(/^```\w*\n?/, "").replace(/```$/, "")) + "</code></pre>");
      continue;
    }
    const lines = t.split(/\r?\n/);
    if (lines.every((l) => /^[-*] /.test(l))) {
      out.push("<ul>" + lines.map((l) => "<li>" + inline(l.slice(2)) + "</li>").join("") + "</ul>");
      continue;
    }
    const h = t.match(/^(#{1,4}) (.*)$/);
    if (h && lines.length === 1) {
      out.push(`<h${h[1].length + 1}>` + inline(h[2]) + `</h${h[1].length + 1}>`);
      continue;
    }
    out.push("<p>" + lines.map(inline).join("<br>") + "</p>");
  }
  return out.join("\n");

  function inline(s) {
    return esc(s)
      .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1" loading="lazy">')
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>')
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|\W)\*([^*]+)\*(?=\W|$)/g, "$1<em>$2</em>")
      .replace(/`([^`]+)`/g, "<code>$1</code>");
  }
}

const files = fs.existsSync(POSTS_DIR) ? fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md")) : [];
const posts = files
  .map((f) => parsePost(path.join(POSTS_DIR, f)))
  .filter(Boolean)
  .sort((a, b) => new Date(b.date) - new Date(a.date));

const catMeta = loadCategories();
const categories = collectCategories(posts, catMeta);
const categoryCSS = categoryStyles(categories, catMeta);

fs.rmSync(OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

// Copy public/
if (fs.existsSync(PUBLIC_DIR)) {
  fs.cpSync(PUBLIC_DIR, OUT_DIR, { recursive: true });
}

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

const label = (c) => esc(catMeta[c]?.label || c);

const card = (p) => `
<article class="card reveal" id="${p.slug}">
  <div class="card-top">
    <span class="pill pill-${p.category}">${label(p.category)}</span>
    <time datetime="${p.date}">${fmtDate(p.date)}</time>
  </div>
  <h2>${esc(p.title)}</h2>
  <div class="card-body">${mdToHtml(p.body)}</div>
</article>`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${SITE_TITLE}</title>
<meta name="description" content="${SITE_DESC}">
<link rel="alternate" type="application/rss+xml" title="${SITE_TITLE}" href="${SITE_URL}/feed.xml">
<style>
:root{
  --bg:#f5f5f7;--card:#ffffff;--text:#1d1d1f;--muted:#6e6e73;--accent:#0071e3;
  --border:rgba(0,0,0,.08);
}
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",Roboto,sans-serif;
  background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased;line-height:1.55}
.hero{padding:120px 24px 60px;text-align:center;max-width:840px;margin:0 auto}
.hero h1{font-size:clamp(40px,7vw,72px);font-weight:700;letter-spacing:-.02em}
.hero p{font-size:clamp(18px,2.5vw,24px);color:var(--muted);margin-top:14px;font-weight:500}
.actions{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin-top:32px}
.btn{display:inline-flex;align-items:center;gap:8px;padding:12px 24px;border-radius:980px;
  font-size:15px;font-weight:600;text-decoration:none;cursor:pointer;border:none;
  transition:transform .15s ease,opacity .15s ease}
.btn:active{transform:scale(.97)}
.btn-primary{background:var(--accent);color:#fff}
.btn-secondary{background:transparent;color:var(--accent);border:1.5px solid var(--accent)}
.btn.copied{opacity:.7}
main{max-width:720px;margin:0 auto;padding:20px 24px 100px;display:flex;flex-direction:column;gap:28px}
.card{background:var(--card);border-radius:22px;padding:36px;box-shadow:0 4px 24px rgba(0,0,0,.06);
  border:1px solid var(--border)}
.card-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
.card time{color:var(--muted);font-size:14px}
.card h2{font-size:28px;font-weight:700;letter-spacing:-.01em;margin-bottom:14px}
.card-body{color:var(--text);font-size:17px}
.card-body p{margin-bottom:12px}
.card-body a{color:var(--accent);text-decoration:none}
.card-body a:hover{text-decoration:underline}
.card-body img{max-width:100%;border-radius:14px;margin:8px 0}
.card-body code{font-family:"SF Mono",ui-monospace,Menlo,monospace;font-size:.9em;
  background:rgba(128,128,128,.15);padding:2px 6px;border-radius:6px}
.card-body pre{background:rgba(128,128,128,.12);padding:16px;border-radius:12px;overflow-x:auto;margin-bottom:12px}
.card-body pre code{background:none;padding:0}
.card-body ul{padding-left:24px;margin-bottom:12px}
.pill{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;
  padding:5px 12px;border-radius:980px}
${categoryCSS}
.reveal{opacity:0;transform:translateY(18px);transition:opacity .6s ease,transform .6s ease}
.reveal.visible{opacity:1;transform:none}
.empty{text-align:center;color:var(--muted);padding:60px 0;font-size:18px}
.toast{position:fixed;bottom:28px;left:50%;transform:translateX(-50%) translateY(80px);
  background:var(--text);color:var(--bg);padding:10px 22px;border-radius:980px;
  font-size:14px;font-weight:600;transition:transform .3s ease;pointer-events:none}
.toast.show{transform:translateX(-50%) translateY(0)}
footer{text-align:center;color:var(--muted);font-size:13px;padding:0 24px 60px}
footer a{color:var(--accent);text-decoration:none}
</style>
</head>
<body>
<header class="hero">
  <h1>${SITE_TITLE}</h1>
  <p>${SITE_DESC}</p>
  <div class="actions">
    <button class="btn btn-primary" id="copy-feed" data-url="${SITE_URL}/feed.xml">
      ⧉ Copy RSS Feed URL
    </button>
    <a class="btn btn-secondary" href="feed.xml" target="_blank" rel="noopener">View raw XML feed →</a>
  </div>
</header>
<main>
${posts.length ? posts.map(card).join("\n") : '<p class="empty">No posts yet. Create one from GitHub Issues ✨</p>'}
</main>
<footer>
  <p>Auto-generated · <a href="feed.xml">RSS</a></p>
</footer>
<div class="toast" id="toast">Feed URL copied ✓</div>
<script>
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target)}}),{threshold:.1});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
document.getElementById('copy-feed').addEventListener('click',async function(){
  try{await navigator.clipboard.writeText(this.dataset.url)}
  catch{const i=document.createElement('input');i.value=this.dataset.url;document.body.appendChild(i);i.select();document.execCommand('copy');i.remove()}
  const t=document.getElementById('toast');t.classList.add('show');this.classList.add('copied');
  setTimeout(()=>{t.classList.remove('show');this.classList.remove('copied')},1800);
});
</script>
</body>
</html>
`;

fs.writeFileSync(path.join(OUT_DIR, "index.html"), html);

// RSS 2.0
const item = (p) => `    <item>
      <title>${esc(p.title)}</title>
      <link>${SITE_URL}/#${p.slug}</link>
      <guid isPermaLink="false">${p.slug}</guid>
      <pubDate>${new Date(p.date).toUTCString()}</pubDate>
      <category>${esc(p.category)}</category>
      <description>${esc(p.body)}</description>
    </item>`;

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(SITE_TITLE)}</title>
    <link>${SITE_URL}</link>
    <description>${esc(SITE_DESC)}</description>
    <language>en</language>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
${posts.map(item).join("\n")}
  </channel>
</rss>
`;

fs.writeFileSync(path.join(OUT_DIR, "feed.xml"), rss);

console.log(`Built ${posts.length} post(s) -> ${OUT_DIR}`);
