# Pulsar Feed

Feed de noticias estilo RSS gestionado 100% desde **GitHub Issues + Actions**, publicado en **Cloudflare Pages**.

## Cómo funciona

1. Abre una issue usando una de las plantillas:
   - 📰 **Nueva noticia** — crea un post en markdown
   - ✏️ **Editar noticia** — modifica un post existente
   - 🗑️ **Eliminar noticia** — borra un post
   - 🏷️ **New category** — registra una categoría nueva (sin tocar código)
2. La Action aplica el cambio, hace commit, reconstruye el sitio + `feed.xml` y despliega a Cloudflare Pages automáticamente.

## Categorías dinámicas

Las categorías viven en `content/categories.json` (id, label y color opcional). Si un post usa una categoría que no está en el JSON, se registra sola con un color de la paleta. Para crear una nueva con nombre y color bonitos, usa la plantilla **🏷️ New category**.

## Estructura

```
content/posts/     # noticias en markdown con front matter
scripts/build.mjs  # genera index.html + feed.xml desde el markdown
public/            # estáticos copiados tal cual
.github/workflows/feed.yml
```

## Front matter de cada post

```markdown
---
title: Mi noticia
date: 2026-09-13
category: releases
slug: mi-noticia
---

Contenido en **markdown**...
```

## Feed

- Frontal: `https://<project>.pages.dev/`
- Feed XML: `https://<project>.pages.dev/feed.xml` (botón de copiar URL y ver raw en la web)

## Secretos requeridos (ya configurados en la org)

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

El nombre del proyecto de Pages se configura en `projectName` dentro de `.github/workflows/feed.yml`.
