# Game Seed Assets — website

Static site. Drop these files at the repo root and GitHub Pages serves them as-is.

## Page order
hero → spotlight carousel → capsule collection → Code Monkey → reviews → work for hire + support → final CTA

## Where things live
- `index.html` — all page content.
- `assets/style.css`, `assets/main.js` — styling and behaviour (vanilla, no build step, no libraries).
- `assets/video/*.mp4` — `*-loop.mp4` are the short muted previews (autoplay only while on screen);
  `dark.mp4`, `archer.mp4`, `fire.mp4` are the full demos and are downloaded only when someone presses play.
- `assets/img/posters/*.webp` — the still frame shown before a video loads.
- `assets/img/products/*.webp` — store artwork.

## Common edits
- **Fab links:** every asset card has a Fab Marketplace button pointing at the seller page for now —
  search `FAB:` in `index.html` and paste each asset's own Fab product URL. Delete the button for
  any asset that isn't on Fab.
- **Click feel (one system):** `assets/main.js` → `squash()` + `burst()`. Every element matching `SEL`
  in the `tactile()` block squashes and pops particles; a click on empty space fires the cursor ripple.
- **Add a review:** open `assets/main.js` and add one line to the `REVIEWS` list at the top
  (`{ asset, title, text, stars }`). The first six float around the 15,000+ counter; every review
  after that goes into the scrolling strip underneath.
- **Atmosphere particles:** `assets/main.js` → the `atmosphere()` block. Sprites are drawn once and
  re-used, the loop is capped at 30fps, the count scales with screen size, and it stops when the tab
  is hidden or the visitor prefers reduced motion. Change `COLORS`, `TYPES` or the count formula there.
- **Click feel:** `assets/main.js` → the `tactile()` block. `SEL` lists which elements squish on
  press; clicks on empty space fire the cursor ripple instead (one at a time, removed after 0.5s).
- **Add a capsule card:** copy one `<a class="shot">` block in the
  collection section and put the capsule in `assets/img/products/`
  (export at 1400px and 700px wide, WebP, quality ~86).
- **Booking link:** search `calendly.com` in `index.html`.
- **itch.io capsules:** the four itch products (2.5D Game Template, Cute Environment Pack 1 & 2,
  Cartoon Trees) load their cover art straight from `img.itch.zone`. If itch ever blocks that,
  save each cover into `assets/img/products/` and point the `src` at the local file — the cards
  already fall back to a green tile if an image fails.
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
- Prices, ratings and links were taken from the Unity Asset Store listings — update them in
  `index.html` when a listing changes.
