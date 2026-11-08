# Game Seed Assets — website

Static site. Drop these files at the repo root and GitHub Pages serves them as-is.

## Page order
hero → featured carousel → Code Monkey → work for hire + support → collection → reviews → about → final CTA

## Catalogue, reviews and asset pages (`tools/`)
The collection grid, the review list, the homepage JSON-LD, the asset landing pages
(`/archer-kit/`, `/rope-puzzle/` …) and `sitemap.xml` are all generated from **`tools/products.json`**.

```
python -m pip install pillow      # once
python tools/build.py             # after every edit to products.json
```

- **Add a product:** add an entry to `products` (slug, name, cat, price, blurb, stores, and `image`
  for a local file or `imageUrl` for a store image; the build saves a WebP thumbnail to
  `assets/img/catalog/`).
- **Not live yet?** Set `"soon": true` and leave the Unity link out of `stores`: the page and card show
  "Unity · coming soon" and a Discord button. When the listing goes live, add the `unity` link, remove
  `soon`, set the real `price`, rebuild, and swap the "soon" button in the featured carousel
  (`index.html`) for a real link. Grass Cutting Simulator and Paper Plane Controller (Unity) use this now.
- **Give it its own page:** add a `page` block (copy one from an existing product). Then it gets
  `/<slug>/`, an entry in the sitemap and a "Details →" link on its card.
- **Add a review:** add it to `reviews`. The first six float around the counter; the rest scroll.
  Reviews are written into the HTML so search engines and AI tools can read them.
- Only edit `index.html` **outside** the `<!-- BUILD:x -->` markers; the build overwrites what's inside them.
- After deploying, submit `https://gameseedassets.store/sitemap.xml` in Google Search Console and
  Bing Webmaster Tools.

## Where things live
- `index.html` — all page content.
- `assets/style.css`, `assets/main.js` — styling and behaviour (vanilla, no build step, no libraries).
- `assets/video/*.mp4` — `*-loop.mp4` are the short muted previews (autoplay only while on screen);
  `dark.mp4`, `archer.mp4`, `fire.mp4` are the full demos and are downloaded only when someone presses play.
- `assets/img/posters/*.webp` — the still frame shown before a video loads.
- `assets/img/products/*.webp` — store artwork.

## Common edits
- **Click feel (one system):** `assets/main.js` → `squash()` + `burst()`. Every element matching `SEL`
  in the `tactile()` block squashes and pops particles; a click on empty space fires the cursor ripple.
- **Atmosphere particles:** `assets/main.js` → the `atmosphere()` block. Sprites are drawn once and
  re-used, the loop is capped at 30fps, the count scales with screen size, and it stops when the tab
  is hidden or the visitor prefers reduced motion. Change `COLORS`, `TYPES` or the count formula there.
- **Click feel:** `assets/main.js` → the `tactile()` block. `SEL` lists which elements squish on
  press; clicks on empty space fire the cursor ripple instead (one at a time, removed after 0.5s).
- **Booking link:** search `calendly.com` in `index.html`.
- **Add an asset to the carousel:** copy one `<article class="slide">` block; the dots and arrows adjust automatically.
  Add `data-loop="assets/video/<name>-loop.mp4"` on `.slide-media` to give it a moving preview.
- **Swap a video:** replace the file in `assets/video/` keeping the same name, and update its poster in `assets/img/posters/`.

## Re-encoding a new video (keeps the site fast)
```
# short silent preview (~150-400 KB)
ffmpeg -ss 8 -t 9 -i source.mp4 -vf "scale=-2:480,fps=24" -c:v libx264 -preset slow -crf 32 \
       -pix_fmt yuv420p -movflags +faststart -an assets/video/name-loop.mp4

# full demo
ffmpeg -i source.mp4 -vf "scale=-2:720,fps=30" -c:v libx264 -preset slow -crf 30 \
       -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 96k assets/video/name.mp4

# poster frame
ffmpeg -ss 10 -i source.mp4 -frames:v 1 -vf "scale=1280:-2" poster.png
```

## Notes
- The display font (IntegralCF) only has real letter glyphs, so CSS restricts it to A–Z; digits and
  punctuation come from DM Sans on purpose.
- Prices and links were taken from the Unity Asset Store, Fab and itch.io listings. Update them in
  `tools/products.json` (and the carousel in `index.html`) when a listing changes.
- The 15,000+ counter number is `data-target` on `#trust-count` in `index.html`; keep the text inside
  it the same number so crawlers see the real figure.
