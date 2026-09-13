# Pulsar Feed

An RSS feed managed entirely through **GitHub Issues and Actions**, published to **Cloudflare Pages**.

- **Site**: https://pulsar-feed.pages.dev
- **Feed**: https://pulsar-feed.pages.dev/feed.xml

## How it works

1. Open an issue using one of the templates:
   - **New post** — publishes a markdown post
   - **Edit post** — modifies an existing post
   - **Delete post** — removes a post
   - **New category** — registers a category without touching code
2. A workflow applies the change, commits it, rebuilds the site and `feed.xml`, and deploys to Cloudflare Pages.
3. The issue is closed automatically with a comment reporting the result.

Only the repository owner (`jaimegh-es`) can publish content. The workflow checks
the issue author and exits early for anyone else.

## Repository layout

```
content/posts/       # posts in markdown with front matter
content/categories.json
scripts/build.mjs    # generates site/index.html and site/feed.xml
scripts/issue-ops.mjs
scripts/post-create.mjs / post-edit.mjs / post-delete.mjs
scripts/category-add.mjs
.github/workflows/   # feed.yml (push) and issue-ops.yml (issues)
```

## Post front matter

```markdown
---
title: My post
date: 2026-09-13
category: releases
slug: my-post
---

Content in **markdown**...
```

Supported markdown: headings, bold, italic, links, images, lists, inline code and fenced code blocks.

## Categories

Categories live in `content/categories.json` with an id, a display label and an
optional accent color:

```json
{
  "releases": { "label": "Releases", "color": "#1b5e20" }
}
```

- Use the **New category** issue template to add one (name, optional label, optional hex color).
- If a post references a category missing from the JSON, the build registers it
  automatically with a palette color, so a typo never breaks the deploy.

## Workflows

| Workflow | Trigger | What it does |
|---|---|---|
| `Build and Deploy Feed` | push to `main` or manual | Rebuilds the site and deploys it |
| `Issue Ops` | issue opened/edited/labeled | Applies create/edit/delete, rebuilds, deploys, closes the issue |

## Requirements

Repository secrets (provided by the `Inled-Pulsar-OS` organization):

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Repository variable:

- `FEED_SITE_URL` — public URL of the site (defaults to `https://pulsar-feed.pages.dev`)

The Cloudflare Pages project is `pulsar-feed` (production branch: `main`).
To change the project name, edit both workflows.

## Local development

```sh
node scripts/build.mjs   # outputs to site/
python3 -m http.server -d site 8080
```

No dependencies. Requires Node 18+.
