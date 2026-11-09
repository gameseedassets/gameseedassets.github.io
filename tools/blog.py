"""
Game Seed Assets: blog builder.

Reads tools/blog/posts.json (metadata) and tools/blog/posts/<slug>.html (the article body)
and writes:
  * /blog/index.html            the blog home
  * /blog/<slug>/index.html     one page per post
  * assets/img/og/blog-<slug>.jpg  share images

Run through the main build (python tools/build.py), which also adds the posts to sitemap.xml.
Body files are plain HTML. Every <h2> gets an id and goes into the table of contents.
"""

import datetime
import json
import re
from pathlib import Path

import build as B

ROOT = B.ROOT
BLOG = ROOT / "tools" / "blog"
POSTS = json.loads((BLOG / "posts.json").read_text(encoding="utf-8"))["posts"]
e = B.e

AUTHOR = {"@type": "Organization", "name": "Game Seed Assets", "url": f"{B.SITE}/"}


def slugify(t):
    return re.sub(r"[^a-z0-9]+", "-", re.sub(r"<[^>]+>", "", t).lower()).strip("-")


def prepare(body):
    """Give each <h2> an id, return (body, toc, word_count)."""
    toc = []

    def h2(m):
        attrs, text = m.group(1), m.group(2)
        hid = re.search(r'id="([^"]+)"', attrs)
        hid = hid.group(1) if hid else slugify(text)
        toc.append((hid, re.sub(r"<[^>]+>", "", text)))
        attrs = re.sub(r'\s*id="[^"]+"', "", attrs)
        return f'<h2 id="{hid}"{attrs}>{text}</h2>'

    body = re.sub(r"<h2([^>]*)>(.*?)</h2>", h2, body, flags=re.S)
    text = re.sub(r"<(script|style|svg)[^>]*>.*?</\1>", " ", body, flags=re.S)
    words = len(re.sub(r"<[^>]+>", " ", text).split())
    return body, toc, words


def nice_date(iso):
    d = datetime.date.fromisoformat(iso)
    return f"{d.day} {d.strftime('%B %Y')}"


HEAD = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  <meta name="description" content="{desc}">
  <link rel="canonical" href="{url}">
  <meta name="theme-color" content="#fbfcf8">
  <script>document.documentElement.classList.add('js')</script>
  <meta property="og:type" content="{ogtype}">
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
  <link rel="alternate" type="application/rss+xml" title="Game Seed Assets blog" href="/blog/feed.xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&family=Baloo+2:wght@600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/assets/style.css">
  <link rel="stylesheet" href="/assets/blog.css">
{ld}
</head>
<body class="blog">

<a class="skip" href="#main">Skip to content</a>

<header class="nav scrolled" id="nav">
  <a href="/" class="brand" aria-label="Game Seed Assets home">
    <img src="/assets/img/logo-256.webp" alt="" width="32" height="32">
    <span>Game Seed<br>Assets</span>
  </a>
  <nav class="nav-links" id="nav-links" aria-label="Main">
    <a href="/#assets">Assets</a>
    <a href="/#collection">Collection</a>
    <a href="/blog/" class="active">Blog</a>
    <a href="/#about">About</a>
    <a href="/#hire">Hire Us</a>
  </nav>
  <div class="nav-right">
    <a class="btn btn-green btn-sm nav-cta" href="/#collection">Explore Assets</a>
    <button class="burger" id="burger" aria-label="Open menu" aria-expanded="false" aria-controls="nav-links"><span></span><span></span></button>
  </div>
</header>
"""

FOOT = """
<footer class="footer">
  <div class="footer-brand">
    <img src="/assets/img/logo-256.webp" alt="" width="24" height="24" loading="lazy">
    <span>© <span id="year">{year}</span> Game Seed Assets</span>
  </div>
  <nav class="footer-links" aria-label="Footer">
    <a href="/blog/">Blog</a>
    <a href="/#collection">All assets</a>
    <a href="mailto:gameseedassets@gmail.com">Contact</a>
    <a href="https://discord.com/invite/sbjZXg2YJ9" target="_blank" rel="noopener">Discord</a>
  </nav>
</footer>

<script src="/assets/main.js" defer></script>
</body>
</html>
"""


def post_card(p, words=None):
    mins = p.get("_mins", "")
    return (
        f'<article class="bp-card">\n'
        f'  <a class="bp-card-media" href="/blog/{p["slug"]}/" tabindex="-1" aria-hidden="true">'
        f'<img src="/{p["thumb"]}" alt="" width="700" height="467" loading="lazy" decoding="async"></a>\n'
        f'  <div class="bp-card-body">\n'
        f'    <p class="bp-meta"><span>{e(p["tag"])}</span><span>{mins} min read</span></p>\n'
        f'    <h2><a href="/blog/{p["slug"]}/">{e(p["title"])}</a></h2>\n'
        f'    <p>{e(p["excerpt"])}</p>\n'
        f'  </div>\n'
        f'</article>'
    )


def build_post(p, i):
    raw = (BLOG / "posts" / f'{p["slug"]}.html').read_text(encoding="utf-8")
    body, toc, words = prepare(raw)
    mins = max(3, round(words / 230))
    p["_mins"] = mins
    url = f'{B.SITE}/blog/{p["slug"]}/'
    og = B.og_image(p["hero"], f'blog-{p["slug"]}')

    toc_html = "".join(f'<li><a href="#{hid}">{e(t)}</a></li>' for hid, t in toc)
    related = [B.BY_SLUG[s] for s in p.get("related", []) if s in B.BY_SLUG]
    rel_html = "\n".join(B.card(x, reveal=False) for x in related)

    others = [q for q in POSTS if q is not p][:3]
    more = "\n".join(
        f'<li><a href="/blog/{q["slug"]}/"><span>{e(q["tag"])}</span>{e(q["title"])}</a></li>' for q in others
    )

    ld = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "BlogPosting",
                "headline": p["title"],
                "description": p["description"],
                "image": [og, f'{B.SITE}/{p["hero"]}'],
                "datePublished": p["date"],
                "dateModified": p.get("updated", p["date"]),
                "author": AUTHOR,
                "publisher": {"@id": f"{B.SITE}/#org"},
                "mainEntityOfPage": url,
                "wordCount": words,
                "keywords": ", ".join(p.get("keywords", [])),
            },
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "Home", "item": f"{B.SITE}/"},
                    {"@type": "ListItem", "position": 2, "name": "Blog", "item": f"{B.SITE}/blog/"},
                    {"@type": "ListItem", "position": 3, "name": p["title"], "item": url},
                ],
            },
            B.ORG,
        ],
    }

    title = p["seoTitle"] if len(p["seoTitle"]) > 50 else p["seoTitle"] + " | Game Seed Assets"
    out = HEAD.format(
        title=e(title), desc=e(p["description"]), url=url, og=og, og_title=e(p["title"]),
        ogtype="article", ld=B.jsonld(ld),
    )
    out += f"""
<main id="main" class="bp">
  <article class="bp-article">
    <header class="bp-head">
      <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><a href="/blog/">Blog</a></nav>
      <p class="bp-kicker">{e(p["tag"])}</p>
      <h1>{e(p["title"])}</h1>
      <p class="bp-dek">{e(p["excerpt"])}</p>
      <p class="bp-byline">
        <img src="/assets/img/logo-256.webp" alt="" width="34" height="34">
        <span><b>Game Seed Assets</b><br><time datetime="{p["date"]}">{nice_date(p["date"])}</time> · {mins} min read</span>
      </p>
    </header>

    <figure class="bp-hero">
      <img src="/{p["hero"]}" alt="{e(p["heroAlt"])}" width="1400" height="933" fetchpriority="high">
      <figcaption>{p["heroCaption"]}</figcaption>
    </figure>

    <div class="bp-layout">
      <aside class="bp-toc" aria-label="On this page">
        <p>On this page</p>
        <ol>{toc_html}</ol>
      </aside>
      <div class="bp-body">
{body}
      </div>
    </div>
  </article>

  <section class="bp-after">
    <div class="bp-cta">
      <div>
        <h2>Stuck on your own asset?</h2>
        <p>Every Game Seed asset comes with 3 hours of free 1:1 support, and we're happy to talk store pages and publishing too. Come say hi on Discord.</p>
      </div>
      <div class="bp-cta-btns">
        <a class="btn btn-green" href="https://discord.com/invite/sbjZXg2YJ9" target="_blank" rel="noopener">Join the Discord</a>
        <a class="btn btn-ghost" href="https://calendly.com/gameseedassets/30min" target="_blank" rel="noopener">Book a call</a>
      </div>
    </div>
    {'<h2 class="bp-sub">Assets mentioned in this post</h2><div class="caps caps-3">' + rel_html + '</div>' if rel_html else ''}
    <h2 class="bp-sub">Keep reading</h2>
    <ul class="bp-more">{more}</ul>
  </section>
</main>
"""
    out += FOOT.format(year=datetime.date.today().year)
    dest = ROOT / "blog" / p["slug"] / "index.html"
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(out, encoding="utf-8")
    print("post", dest.relative_to(ROOT), f"({words} words)")


def build_index():
    url = f"{B.SITE}/blog/"
    og = B.og_image(POSTS[0]["hero"], "blog-home")
    ld = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Blog",
                "name": "Game Seed Assets blog",
                "url": url,
                "description": "Practical notes on making, publishing and marketing game assets for Unity and Unreal, from a small asset studio.",
                "publisher": {"@id": f"{B.SITE}/#org"},
                "blogPost": [
                    {"@type": "BlogPosting", "headline": p["title"], "url": f'{B.SITE}/blog/{p["slug"]}/', "datePublished": p["date"]}
                    for p in POSTS
                ],
            },
            B.ORG,
        ],
    }
    out = HEAD.format(
        title="Blog: Selling and Marketing Game Assets | Game Seed Assets",
        desc="Practical, no-fluff notes on publishing to the Unity Asset Store, Fab and itch.io, marketing game assets, Reddit, and store pages that sell. From a small asset studio.",
        url=url, og=og, og_title="The Game Seed Assets blog", ogtype="website", ld=B.jsonld(ld),
    )
    first, rest = POSTS[0], POSTS[1:]
    out += f"""
<main id="main" class="bp bp-home">
  <header class="bp-home-head">
    <p class="bp-kicker">The blog</p>
    <h1>Notes from a small <span class="grad">asset studio</span></h1>
    <p class="bp-dek">What we've learned publishing 25+ packs to the Unity Asset Store, Fab and itch.io: the submission grind, store pages, pricing, and getting anyone to notice.</p>
  </header>
  <div class="bp-feature">{post_card(first)}</div>
  <div class="bp-grid">
{chr(10).join(post_card(p) for p in rest)}
  </div>
</main>
"""
    out += FOOT.format(year=datetime.date.today().year)
    (ROOT / "blog").mkdir(exist_ok=True)
    (ROOT / "blog" / "index.html").write_text(out, encoding="utf-8")
    print("blog/index.html")


def build_feed():
    items = "\n".join(
        f"""  <item>
    <title>{e(p["title"])}</title>
    <link>{B.SITE}/blog/{p["slug"]}/</link>
    <guid>{B.SITE}/blog/{p["slug"]}/</guid>
    <pubDate>{datetime.datetime.fromisoformat(p["date"]).strftime("%a, %d %b %Y 09:00:00 +0000")}</pubDate>
    <description>{e(p["description"])}</description>
  </item>"""
        for p in POSTS
    )
    (ROOT / "blog" / "feed.xml").write_text(
        f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>Game Seed Assets blog</title>
  <link>{B.SITE}/blog/</link>
  <description>Notes on making, publishing and marketing game assets.</description>
{items}
</channel>
</rss>
""",
        encoding="utf-8",
    )


def urls():
    return [f"{B.SITE}/blog/"] + [f'{B.SITE}/blog/{p["slug"]}/' for p in POSTS]


def build_blog():
    for i, p in enumerate(POSTS):
        build_post(p, i)
    build_index()
    build_feed()


if __name__ == "__main__":
    build_blog()
