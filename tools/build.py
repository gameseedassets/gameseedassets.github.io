"""
Game Seed Assets: site builder.

Reads tools/products.json and regenerates:
  * the collection grid, review list and JSON-LD inside index.html
    (between the <!-- BUILD:x --> ... <!-- /BUILD:x --> markers)
  * one landing page per product that has a "page" block  ->  /<slug>/index.html
  * catalog thumbnails       ->  assets/img/catalog/<slug>.webp
  * social share images      ->  assets/img/og/<slug>.jpg
  * sitemap.xml

Run from the repo root:   python tools/build.py
Needs Pillow:              python -m pip install pillow
"""

import datetime
import html
import io
import json
import re
import urllib.request
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://gameseedassets.store"
DATA = json.loads((ROOT / "tools" / "products.json").read_text(encoding="utf-8"))
CATS = {c["id"]: c["label"] for c in DATA["categories"]}
PRODUCTS = DATA["products"]
BY_SLUG = {p["slug"]: p for p in PRODUCTS}
REVIEWS = DATA["reviews"]
TODAY = datetime.date.today().isoformat()

STORE_META = {
    "unity": ("Unity Asset Store", "Unity", "/assets/img/icons/unity.png"),
    "fab": ("Fab Marketplace", "Fab", "/assets/img/icons/fab.png"),
    "itch": ("itch.io", "itch.io", "/assets/img/icons/itch.png"),
}
SAME_AS = [
    "https://assetstore.unity.com/publishers/132038",
    "https://www.fab.com/sellers/Game%20Seed%20Assets",
    "https://gameseedassets.itch.io/",
    "https://www.youtube.com/@GameSeedAssets",
    "https://instagram.com/gameseedassets",
    "https://discord.com/invite/sbjZXg2YJ9",
]

e = lambda s: html.escape(str(s), quote=True)


# ── images ────────────────────────────────────────────────────────────
def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "gameseedassets-site-builder"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


def thumb(p):
    """Return (src, width, height) for a product's card image, or None."""
    if p.get("image"):
        path = ROOT / p["image"]
        with Image.open(path) as im:
            return "/" + p["image"], im.width, im.height
    if p.get("imageUrl"):
        out = ROOT / "assets" / "img" / "catalog" / f"{p['slug']}.webp"
        if not out.exists():
            out.parent.mkdir(parents=True, exist_ok=True)
            im = Image.open(io.BytesIO(fetch(p["imageUrl"]))).convert("RGB")
            im.thumbnail((720, 720))
            im.save(out, "WEBP", quality=80, method=6)
            print("  thumb", out.relative_to(ROOT))
        with Image.open(out) as im:
            return "/" + out.relative_to(ROOT).as_posix(), im.width, im.height
    return None


def og_image(src_rel, name):
    """Centre-crop a source image to a 1200x630 JPG (what every social network accepts)."""
    out = ROOT / "assets" / "img" / "og" / f"{name}.jpg"
    if not out.exists():
        out.parent.mkdir(parents=True, exist_ok=True)
        im = Image.open(ROOT / src_rel).convert("RGB")
        tw, th = 1200, 630
        scale = max(tw / im.width, th / im.height)
        im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
        left, top = (im.width - tw) // 2, (im.height - th) // 2
        im.crop((left, top, left + tw, top + th)).save(out, "JPEG", quality=85, optimize=True, progressive=True)
        print("  og", out.relative_to(ROOT))
    return f"{SITE}/{out.relative_to(ROOT).as_posix()}"


# ── shared bits ───────────────────────────────────────────────────────
def primary_url(p):
    if p.get("page"):
        return f"/{p['slug']}/", False
    for k in ("unity", "fab", "itch"):
        if p["stores"].get(k):
            return p["stores"][k], True
    raise ValueError(p["slug"])


def price_tag(price):
    if not price:
        return ""
    cls = "tag-free" if price.lower() == "free" else "tag-price"
    return f'<span class="tag {cls}">{e(price)}</span>'


def stars(n):
    return "★" * n + "☆" * (5 - n)


def store_chips(p, label_prefix=True):
    out = []
    for k in ("unity", "fab", "itch"):
        url = p["stores"].get(k)
        if not url:
            continue
        full, short, icon = STORE_META[k]
        out.append(
            f'<a class="store-chip" href="{e(url)}" target="_blank" rel="noopener" '
            f'aria-label="{e(p["name"])} on {full}"><img src="{icon}" alt="" width="16" height="16" loading="lazy">{short}</a>'
        )
    if p.get("soon"):
        out.append('<span class="store-chip is-soon"><img src="/assets/img/icons/unity.png" alt="" width="16" height="16" loading="lazy">Unity · coming soon</span>')
    return "".join(out)


def card(p, reveal=True):
    href, external = primary_url(p)
    ext = ' target="_blank" rel="noopener"' if external else ""
    t = thumb(p)
    if t:
        src, w, h = t
        media = f'<img src="{src}" alt="{e(p["name"])}: {e(CATS[p["cat"]].lower())} for Unity" width="{w}" height="{h}" loading="lazy" decoding="async">'
    else:
        media = '<span class="cap-noart" aria-hidden="true"></span>'
    more = f'<a class="cap-more" href="/{p["slug"]}/">Details →</a>' if p.get("page") else ""
    return (
        f'<article class="cap" data-cat="{p["cat"]}"{" data-reveal" if reveal else ""}>\n'
        f'  <a class="cap-media" href="{e(href)}"{ext} tabindex="-1" aria-hidden="true">{media}</a>\n'
        f'  <div class="cap-body">\n'
        f'    <div class="cap-tags"><span class="tag">{e(CATS[p["cat"]])}</span>{price_tag(p["price"])}</div>\n'
        f'    <h3><a href="{e(href)}"{ext}>{e(p["name"])}</a></h3>\n'
        f'    <p>{e(p["blurb"])}</p>\n'
        f'    <div class="cap-stores">{store_chips(p)}{more}</div>\n'
        f'  </div>\n'
        f'</article>'
    )


def review_card(r, tag="li"):
    return (
        f'<{tag} class="rv" data-asset="{e(r["asset"])}" data-stars="{r["stars"]}">'
        f'<span class="rv-meta"><span>{e(r["asset"])}</span><span class="stars" aria-label="{r["stars"]} out of 5 stars">{stars(r["stars"])}</span></span>'
        f'<h3>{e(r["title"])}</h3><p>{e(r["text"])}</p>'
        f'<span class="rv-src">{e(r["asset"])} · Unity Asset Store</span></{tag}>'
    )


def replace_block(text, name, content):
    pat = re.compile(rf"(<!-- BUILD:{name} -->)(.*?)(<!-- /BUILD:{name} -->)", re.S)
    if not pat.search(text):
        raise SystemExit(f"marker BUILD:{name} not found in index.html")
    return pat.sub(lambda m: m.group(1) + "\n" + content + "\n" + m.group(3), text)


def jsonld(obj):
    return '<script type="application/ld+json">\n' + json.dumps(obj, ensure_ascii=False, indent=1) + "\n</script>"


ORG = {
    "@type": "Organization",
    "@id": f"{SITE}/#org",
    "name": "Game Seed Assets",
    "url": f"{SITE}/",
    "logo": f"{SITE}/assets/img/logo-256.webp",
    "email": "gameseedassets@gmail.com",
    "slogan": "Plant the right assets. Build better games.",
    "description": "Independent publisher of Unity and Unreal game templates, 2D environments and VFX, sold on the Unity Asset Store, Fab and itch.io.",
    "sameAs": SAME_AS,
}


# ── index.html ────────────────────────────────────────────────────────
def build_index():
    path = ROOT / "index.html"
    text = path.read_text(encoding="utf-8")

    counts = {c: sum(1 for p in PRODUCTS if p["cat"] == c) for c in CATS}
    chips = [f'<button type="button" class="cf" data-f="all" aria-pressed="true">All <span>{len(PRODUCTS)}</span></button>']
    chips += [
        f'<button type="button" class="cf" data-f="{c}" aria-pressed="false">{e(l)} <span>{counts[c]}</span></button>'
        for c, l in CATS.items() if counts[c]
    ]
    collection = (
        '<div class="cfilter" role="group" aria-label="Filter the collection">' + "".join(chips) + "</div>\n"
        '<div class="caps" id="caps">\n' + "\n".join(card(p) for p in PRODUCTS) + "\n</div>"
    )
    text = replace_block(text, "collection", collection)

    text = replace_block(
        text, "reviews",
        '<ul class="rv-grid review-data" id="review-data" aria-label="Unity Asset Store reviews">\n'
        + "\n".join(review_card(r) for r in REVIEWS) + "\n</ul>",
    )

    graph = {
        "@context": "https://schema.org",
        "@graph": [
            ORG,
            {"@type": "WebSite", "@id": f"{SITE}/#site", "name": "Game Seed Assets", "url": f"{SITE}/", "publisher": {"@id": f"{SITE}/#org"}},
            {
                "@type": "ItemList",
                "name": "Game Seed Assets collection",
                "itemListElement": [
                    {"@type": "ListItem", "position": i + 1, "name": p["name"], "url": f"{SITE}/{p['slug']}/"}
                    for i, p in enumerate(x for x in PRODUCTS if x.get("page"))
                ],
            },
        ],
    }
    text = replace_block(text, "jsonld", jsonld(graph))
    path.write_text(text, encoding="utf-8")
    print("index.html updated")


# ── product pages ─────────────────────────────────────────────────────
PAGE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  <meta name="description" content="{desc}">
  <link rel="canonical" href="{url}">
  <meta name="theme-color" content="#070b08">
  <script>document.documentElement.classList.add('js')</script>

  <meta property="og:type" content="product">
  <meta property="og:site_name" content="Game Seed Assets">
  <meta property="og:title" content="{og_title}">
  <meta property="og:description" content="{desc}">
  <meta property="og:url" content="{url}">
  <meta property="og:image" content="{og}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{og_title}">
  <meta name="twitter:description" content="{desc}">
  <meta name="twitter:image" content="{og}">

  <link rel="icon" type="image/png" href="/assets/img/favicon-64.png">
  <link rel="apple-touch-icon" href="/assets/img/logo-180.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800;9..40,900&family=DM+Mono:wght@400;500&family=Baloo+2:wght@600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/assets/style.css">
{ld}
</head>
<body class="page">

<a class="skip" href="#main">Skip to content</a>
<canvas id="bg-canvas" aria-hidden="true"></canvas>

<header class="nav scrolled" id="nav">
  <a href="/" class="brand" aria-label="Game Seed Assets home">
    <img src="/assets/img/logo-256.webp" alt="" width="32" height="32">
    <span>Game Seed<br>Assets</span>
  </a>
  <nav class="nav-links" id="nav-links" aria-label="Main">
    <a href="/#assets">Assets</a>
    <a href="/#collection">Collection</a>
    <a href="/#reviews">Reviews</a>
    <a href="/blog/">Blog</a>
    <a href="/#about">About</a>
    <a href="/#hire">Hire Us</a>
  </nav>
  <div class="nav-right">
    <a class="btn btn-green btn-sm nav-cta" href="{buy}" target="_blank" rel="noopener">{cta}</a>
    <button class="burger" id="burger" aria-label="Open menu" aria-expanded="false" aria-controls="nav-links"><span></span><span></span></button>
  </div>
</header>

<main id="main" class="pg">
  <div class="container">
    <nav class="crumbs" aria-label="Breadcrumb">
      <a href="/">Home</a><span aria-hidden="true">/</span><a href="/#collection">{cat}</a><span aria-hidden="true">/</span><span aria-current="page">{name}</span>
    </nav>

    <section class="pg-hero">
      <div class="pg-media">{media}</div>
      <div class="pg-info">
        <div class="slide-tags"><span class="tag">{cat}</span>{price}</div>
        <h1>{h1}</h1>
        {intro}
        <div class="pg-buy">{buy_btns}</div>
        {demo}
        <p class="pg-support">Includes <a href="#support">3 hours of free 1:1 support</a>: setup, questions, bug fixes and exporting your build.</p>
      </div>
    </section>

    <section class="pg-grid">
      <div class="pg-card">
        <h2>What's included</h2>
        <ul class="pg-feats">{features}</ul>
      </div>
      <div class="pg-card">
        <h2>Technical details</h2>
        <dl class="pg-specs">{specs}</dl>
      </div>
    </section>
{youtube}{codemonkey}{reviews}
    <section class="pg-sec">
      <h2>Frequently asked questions</h2>
      <div class="faq">{faq}</div>
    </section>

    <section class="pg-sec">
      <div class="sec-head">
        <h2>More from <span class="grad">Game Seed Assets</span></h2>
        <a class="link-arrow" href="/#collection">See the full collection <span>→</span></a>
      </div>
      <div class="caps caps-3">{related}</div>
    </section>

    <section class="pg-sec duo-grid" id="support">
      <div class="duo-card">
        <h3>Need a little help?</h3>
        <p>Get 3 hours of free support with your asset. I'll walk you through how it works, the best way to use it in your project, bug fixes, and exporting your build.</p>
        <a class="btn btn-green" href="https://calendly.com/gameseedassets/30min" target="_blank" rel="noopener">Book a call</a>
      </div>
      <div class="duo-card">
        <h3>Need something custom?</h3>
        <p>Need a custom asset, system or gameplay solution? We also work with developers on custom game development and assets.</p>
        <a class="btn btn-green" href="mailto:gameseedassets@gmail.com?subject=Custom%20project%20enquiry">Work with us</a>
      </div>
    </section>
  </div>
</main>

<footer class="footer">
  <div class="footer-brand">
    <img src="/assets/img/logo-256.webp" alt="" width="24" height="24" loading="lazy">
    <span>© <span id="year">{year}</span> Game Seed Assets</span>
  </div>
  <nav class="footer-links" aria-label="Footer">
    <a href="/#collection">All assets</a>
    <a href="/blog/">Blog</a>
    <a href="mailto:gameseedassets@gmail.com">Contact</a>
    <a href="https://discord.com/invite/sbjZXg2YJ9" target="_blank" rel="noopener">Discord</a>
  </nav>
</footer>

<script src="/assets/main.js" defer></script>
</body>
</html>
"""


def offer_price(price):
    return "0" if price.lower() == "free" else price.replace("$", "")


def build_page(p):
    pg = p["page"]
    url = f"{SITE}/{p['slug']}/"
    cat = CATS[p["cat"]]
    og = og_image(pg["hero"], p["slug"])
    # "soon": the listing isn't live yet. Add its store link and drop "soon" once it is.
    buy_key = next((k for k in ("unity", "fab", "itch") if p["stores"].get(k)), None)
    buy = p["stores"][buy_key] if buy_key else "https://discord.com/invite/sbjZXg2YJ9"
    cta = f"Get {p['name']}" if buy_key else "Get notified"

    if pg.get("video"):
        media = (
            f'<div class="player" data-src="/{pg["video"]}" data-poster="/{pg["hero"]}">'
            f'<img src="/{pg["hero"]}" alt="{e(p["name"])} screenshot" width="1400" height="933" fetchpriority="high">'
            f'<button class="play" aria-label="Play the {e(p["name"])} video"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></button></div>'
        )
    else:
        media = f'<img class="pg-still" src="/{pg["hero"]}" alt="{e(p["name"])} screenshot" width="1400" height="933" fetchpriority="high">'

    btns = []
    for i, k in enumerate(k for k in ("unity", "fab", "itch") if p["stores"].get(k)):
        full, short, icon = STORE_META[k]
        cls = "btn-green" if i == 0 else "btn-ghost"
        btns.append(f'<a class="btn {cls}" href="{e(p["stores"][k])}" target="_blank" rel="noopener"><img src="{icon}" alt="" width="18" height="18">{full}</a>')
    if p.get("soon"):
        btns.append('<span class="btn btn-ghost is-soon"><img src="/assets/img/icons/unity.png" alt="" width="18" height="18">Coming soon to the Unity Asset Store</span>')
        btns.append('<a class="btn btn-green" href="https://discord.com/invite/sbjZXg2YJ9" target="_blank" rel="noopener">Get notified on Discord</a>')
    demo = f'<p class="pg-demo"><a class="link-arrow" href="{e(p["demo"])}" target="_blank" rel="noopener">Play the free demo on itch.io <span>↗</span></a></p>' if p.get("demo") else ""

    youtube = ""
    if pg.get("youtube"):
        yid = pg["youtube"]
        youtube = (
            f'\n    <section class="pg-sec">\n      <h2>Watch the tutorial</h2>\n'
            f'      <div class="yt" data-id="{yid}" data-title="{e(p["name"])} tutorial">'
            f'<img src="https://i.ytimg.com/vi/{yid}/hqdefault.jpg" alt="{e(p["name"])} tutorial video" width="480" height="360" loading="lazy">'
            f'<button class="play" aria-label="Play the {e(p["name"])} tutorial on YouTube"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></button></div>\n'
            f'      <p class="pg-note"><a class="link-arrow" href="https://www.youtube.com/watch?v={yid}" target="_blank" rel="noopener">Open on YouTube <span>↗</span></a></p>\n    </section>\n'
        )

    codemonkey = ""
    if pg.get("codeMonkey"):
        codemonkey = (
            '\n    <section class="pg-sec">\n      <div class="cm-note cm-wide" data-anim-zone>\n        <div class="cm-note-copy">\n'
            '          <div class="cm-by"><img src="/assets/img/code-monkey.webp" alt="Code Monkey" width="30" height="30" loading="lazy"><span><b>Featured by Code Monkey</b></span></div>\n'
            '          <blockquote class="cm-quote">“I love the cuteness of this one!”</blockquote>\n'
            '          <a class="link-arrow" href="https://youtu.be/xDeGnrX1ds4?t=215" target="_blank" rel="noopener">Watch on YouTube <span>↗</span></a>\n'
            '        </div>\n      </div>\n    </section>\n'
        )

    revs = [r for r in REVIEWS if r["asset"] == pg.get("reviewAsset")]
    reviews = ""
    if revs:
        reviews = (
            f'\n    <section class="pg-sec">\n      <h2>What developers say</h2>\n'
            f'      <p class="pg-note">Reviews from the Unity Asset Store.</p>\n'
            f'      <ul class="rv-grid">{"".join(review_card(r) for r in revs)}</ul>\n    </section>\n'
        )

    specs = pg["specs"]
    faq_items = [
        (
            "Which engines and versions does it support?" if pg.get("compat") else "Which Unity versions and render pipelines does it support?",
            pg.get("compat") or f"{p['name']} is built for {specs['Unity version']} and works with {specs['Render pipelines']}. It runs on {specs['Platforms']}.",
        ),
        (
            "Can I use it in a commercial game?",
            "Yes. Assets from the Unity Asset Store come with Unity's standard EULA, which allows them in commercial games. Purchases on Fab and itch.io follow those stores' licences.",
        ),
        (
            "What if I get stuck?",
            'Every asset comes with 3 hours of free 1:1 support. <a href="https://calendly.com/gameseedassets/30min" target="_blank" rel="noopener">Book a call</a> or ask in the <a href="https://discord.com/invite/sbjZXg2YJ9" target="_blank" rel="noopener">Discord</a>.',
        ),
    ]
    stores_list = ", ".join(STORE_META[k][0] for k in ("unity", "fab", "itch") if p["stores"].get(k))
    if stores_list:
        where = f"{p['name']} is available on {stores_list}. Use the buttons at the top of this page."
    else:
        where = f"{p['name']} is launching on the Unity Asset Store very soon. Join the Discord to hear the moment it goes live."
    faq_items.insert(1, ("Where can I get it?", where))
    faq = "".join(f"<details><summary>{e(q)}</summary><p>{a}</p></details>" for q, a in faq_items)

    rel = [BY_SLUG[s] for s in pg.get("related", [])]
    for x in PRODUCTS:
        if len(rel) >= 3:
            break
        if x is not p and x not in rel and x.get("page") and x["cat"] == p["cat"]:
            rel.append(x)
    for x in PRODUCTS:
        if len(rel) >= 3:
            break
        if x is not p and x not in rel and x.get("page"):
            rel.append(x)

    ld = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Product",
                "name": p["name"],
                "description": pg["description"],
                "url": url,
                "image": [og, f"{SITE}/{pg['hero']}"],
                "category": cat,
                "brand": {"@type": "Brand", "name": "Game Seed Assets"},
            },
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "Home", "item": f"{SITE}/"},
                    {"@type": "ListItem", "position": 2, "name": cat, "item": f"{SITE}/#collection"},
                    {"@type": "ListItem", "position": 3, "name": p["name"], "item": url},
                ],
            },
            ORG,
        ],
    }

    if buy_key and p["price"] and p["price"][:1] in "$F":
        ld["@graph"][0]["offers"] = {
            "@type": "Offer",
            "url": buy,
            "price": offer_price(p["price"]),
            "priceCurrency": "USD",
            "availability": "https://schema.org/InStock",
            "seller": {"@type": "Organization", "name": STORE_META[buy_key][0]},
        }

    title = pg["title"] if len(pg["title"]) > 47 else pg["title"] + " | Game Seed Assets"
    out = PAGE.format(
        title=e(title), desc=e(pg["description"]), url=url, og=og, og_title=e(pg["h1"]),
        ld=jsonld(ld), buy=e(buy), cta=e(cta), short=e(p["name"]), cat=e(cat), name=e(p["name"]),
        media=media, price=price_tag(p["price"]), h1=e(pg["h1"]),
        intro="\n        ".join(f"<p>{e(t)}</p>" for t in pg["intro"]),
        buy_btns="".join(btns), demo=demo,
        features="".join(f"<li>{e(f)}</li>" for f in pg["features"]),
        specs="".join(f"<div><dt>{e(k)}</dt><dd>{e(v)}</dd></div>" for k, v in specs.items()),
        youtube=youtube, codemonkey=codemonkey, reviews=reviews, faq=faq,
        related="\n".join(card(x, reveal=False) for x in rel), year=datetime.date.today().year,
    )
    dest = ROOT / p["slug"] / "index.html"
    dest.parent.mkdir(exist_ok=True)
    dest.write_text(out, encoding="utf-8")
    print("page", dest.relative_to(ROOT))


# ── sitemap ───────────────────────────────────────────────────────────
def build_sitemap():
    urls = [(f"{SITE}/", "1.0")] + [(f"{SITE}/{p['slug']}/", "0.8") for p in PRODUCTS if p.get("page")]
    posts = ROOT / "tools" / "blog" / "posts.json"
    if posts.exists():
        urls += [(f"{SITE}/blog/", "0.7")] + [
            (f"{SITE}/blog/{x['slug']}/", "0.7") for x in json.loads(posts.read_text(encoding="utf-8"))["posts"]
        ]
    body = "\n".join(
        f"  <url><loc>{u}</loc><lastmod>{TODAY}</lastmod><priority>{pr}</priority></url>" for u, pr in urls
    )
    (ROOT / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + body + "\n</urlset>\n",
        encoding="utf-8",
    )
    print("sitemap.xml", len(urls), "urls")


if __name__ == "__main__":
    og_image("assets/img/products/dark-key-1400.webp", "home")
    for p in PRODUCTS:
        if p.get("page"):
            build_page(p)
    build_index()
    if (ROOT / "tools" / "blog" / "posts.json").exists():
        import blog
        blog.build_blog()
    build_sitemap()
