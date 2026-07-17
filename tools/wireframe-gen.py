#!/usr/bin/env python3
"""Low-fi wireframe generator for the luci-studio (blog frontend) pages.

Emits one Excalidraw scene per page — home, /blog (list, post, series
index, series detail), /games, /portfolio, /lab, /videos, and the shared
legal template — into the local watch-your-ai-code (WYAC) design library.

Each page's block layout is derived from the real components under
src/components/pages/*.astro, not invented; edit a PAGE spec below and
re-run to regenerate. Scenes are pushed over WYAC's HTTP API (not its MCP
tools, so large scenes don't have to travel through a model's context) and
updated by name, so re-running is idempotent — it overwrites in place
rather than duplicating.

Not part of the Astro build (a dev/doc tool, like tools/cover.html and
tools/og-gen.mjs).

Prereq: WYAC running locally at 127.0.0.1:4777 (see the watch-your-ai-code
project). Usage:
    python3 tools/wireframe-gen.py            # push/refresh all 10 scenes
    python3 tools/wireframe-gen.py --dry-run  # print sizes, write nothing
    python3 tools/wireframe-gen.py --only=/games   # just the matching route
"""
import json, random, string, sys, time, urllib.request, urllib.error

BASE = "http://127.0.0.1:4777"
TS = int(time.time() * 1000)
ALPH = string.ascii_letters + string.digits + "_-"

INK, MUTED, LINE = "#1e1e1e", "#868e96", "#adb5bd"
FILL_A, FILL_B, FILL_C = "#f1f3f5", "#e9ecef", "#dee2e6"
ACCENT, DARK = "#4c6ef5", "#343a40"

W, PAD = 1240, 40
CW = W - 2 * PAD


class Scene:
    def __init__(self, seed):
        self.els = []
        self.rng = random.Random(seed)

    def _id(self):
        return "".join(self.rng.choice(ALPH) for _ in range(21))

    def add(self, type_, x, y, w, h, **kw):
        el = {
            "id": self._id(), "type": type_,
            "x": round(x, 2), "y": round(y, 2),
            "width": round(w, 2), "height": round(h, 2),
            "angle": 0,
            "strokeColor": kw.pop("stroke", INK),
            "backgroundColor": kw.pop("bg", "transparent"),
            "fillStyle": "solid",
            "strokeWidth": kw.pop("sw", 1),
            "strokeStyle": kw.pop("ss", "solid"),
            "roughness": 1, "opacity": 100,
            "groupIds": [], "frameId": None,
            "roundness": kw.pop("roundness", None),
            "seed": self.rng.randint(1, 2**31 - 1),
            "version": 1, "versionNonce": self.rng.randint(1, 2**31 - 1),
            "isDeleted": False, "boundElements": [],
            "updated": TS, "link": None, "locked": False,
        }
        el.update(kw)
        self.els.append(el)
        return el

    def rect(self, x, y, w, h, bg="transparent", stroke=LINE, ss="solid", r=True, sw=1):
        return self.add("rectangle", x, y, w, h, bg=bg, stroke=stroke, ss=ss, sw=sw,
                        roundness={"type": 3} if r else None)

    def text(self, x, y, s, size=13, color=INK, align="left"):
        tw, th = len(s) * size * 0.5, size * 1.25
        if align == "center":
            x -= tw / 2
        elif align == "right":
            x -= tw
        return self.add("text", x, y, tw, th, stroke=color, text=s, fontSize=size,
                        fontFamily=5, textAlign="left", verticalAlign="top",
                        containerId=None, originalText=s, autoResize=True, lineHeight=1.25)

    def line(self, x, y, w, color=LINE):
        return self.add("line", x, y, w, 0, stroke=color, points=[[0, 0], [w, 0]],
                        lastCommittedPoint=None, startBinding=None, endBinding=None,
                        startArrowhead=None, endArrowhead=None)

    def dot(self, x, y, d=8, color=ACCENT):
        return self.add("ellipse", x, y, d, d, stroke=color, bg=color)

    def json(self):
        return json.dumps({
            "type": "excalidraw", "version": 2, "source": BASE,
            "elements": self.els,
            "appState": {"gridSize": 20, "gridStep": 5, "gridModeEnabled": False,
                         "viewBackgroundColor": "#ffffff"},
            "files": {},
        }, indent=2)


class Page:
    """Vertical block-stack layout engine. y is the running cursor."""

    def __init__(self, name, route, subtitle):
        self.name, self.route = name, route
        self.sc = Scene(abs(hash(route)) % 99991)
        self.sc.text(0, 0, route + "  —  " + subtitle, size=26, color=INK)
        self.sc.text(0, 36, "low-fi wireframe · luci-studio · structure from src/components/pages/",
                     size=11, color=MUTED)
        self.frame = self.sc.rect(0, 64, W, 100, bg="#ffffff", stroke=INK, r=False)
        self.y = 64 + 28

    # -- primitives ------------------------------------------------------
    def _card(self, x, y, w, h, item, parts, media=True):
        self.sc.rect(x, y, w, h, bg=FILL_A)
        cy = y + 8
        if media and parts:
            mh = min(h * 0.42, 76)
            self.sc.rect(x + 8, cy, w - 16, mh, bg=FILL_C)
            self.sc.text(x + w / 2, cy + mh / 2 - 6, parts[0], size=10, color=MUTED, align="center")
            cy += mh + 8
            parts = parts[1:]
        for p in parts:
            if cy + 12 > y + h - 4:
                break
            self.sc.text(x + 10, cy, p, size=10, color=MUTED)
            cy += 15
        if item:
            self.sc.text(x + w - 6, y + h - 14, item, size=9, color=LINE, align="right")

    def sec(self, eyebrow=None, count=None, h=None, sub=None, link=None):
        if eyebrow:
            self.sc.dot(PAD, self.y + 3, 7)
            self.sc.text(PAD + 14, self.y, eyebrow.upper(), size=10, color=MUTED)
            lx = PAD + 20 + len(eyebrow) * 6
            rx = PAD + CW - (len(count) * 5.5 + 8 if count else 0)
            if rx > lx:
                self.sc.line(lx, self.y + 6, rx - lx)
            if count:
                self.sc.text(PAD + CW, self.y, count, size=10, color=MUTED, align="right")
            self.y += 20
        if h:
            self.sc.text(PAD, self.y, h, size=22, color=INK)
            self.y += 30
        if sub:
            self.sc.text(PAD, self.y, sub, size=11, color=MUTED)
            self.y += 18
        if link:
            self.sc.text(PAD + CW, self.y - 24, link, size=10, color=ACCENT, align="right")
        self.y += 8

    def nav(self):
        self.sc.rect(PAD, self.y, CW, 44, bg=FILL_A)
        self.sc.rect(PAD + 12, self.y + 14, 108, 16, bg=FILL_C)
        self.sc.text(PAD + 20, self.y + 16, "LUCI STUDIO.", size=9, color=MUTED)
        cx = PAD + CW / 2 - 190
        for lbl in ["HOME", "BLOG / SERIES", "APPS / TOOLS", "GAMES", "VIDEOS"]:
            w = len(lbl) * 5.6 + 12
            self.sc.rect(cx, self.y + 15, w, 14, bg=FILL_B)
            self.sc.text(cx + 5, self.y + 16, lbl, size=8, color=MUTED)
            cx += w + 10
        rx = PAD + CW - 12
        for lbl in ["CTA pill", "◐", "◑", "EN|VI"]:
            w = len(lbl) * 5.5 + 10
            self.sc.rect(rx - w, self.y + 15, w, 14, bg=FILL_B)
            self.sc.text(rx - w + 4, self.y + 16, lbl, size=8, color=MUTED)
            rx -= w + 8
        self.sc.line(PAD, self.y + 43, CW * 0.35, ACCENT)
        self.y += 44
        self.sc.text(PAD, self.y + 3, "TopNav — one line, fixed overlay; accent scroll-progress rule; burger ≤860px",
                     size=9, color=LINE)
        self.y += 26

    def hero(self):
        h = 190
        lw = CW * 0.58
        self.sc.text(PAD, self.y + 8, "N 10°49′ · CREATIVE ENGINEERING STUDIO", size=10, color=MUTED)
        self.sc.text(PAD, self.y + 30, "LUCI STUDIO.", size=40, color=INK)
        self.sc.text(PAD, self.y + 86, "tagline — creative engineering", size=12, color=MUTED)
        for i, b in enumerate(["View work", "See art →"]):
            self.sc.rect(PAD + i * 108, self.y + 116, 96, 30, bg=FILL_B)
            self.sc.text(PAD + i * 108 + 48, self.y + 125, b, size=10, color=INK, align="center")
        self.sc.rect(PAD + lw + 20, self.y, CW - lw - 20, h, bg=FILL_B)
        self.sc.text(PAD + lw + 20 + (CW - lw - 20) / 2, self.y + h / 2 - 6,
                     "SVG blueprint diagram", size=11, color=MUTED, align="center")
        self.sc.text(PAD, self.y + h - 8, "SCROLL ↓", size=9, color=LINE)
        self.y += h + 22

    def grid(self, cols, rows=1, h=150, item="", parts=(), gap=16, media=True, n=None, more=None):
        """n = how many cards actually render; the rest are drawn as empty cells.
        Keeps the wireframe honest about real data counts."""
        cwid = (CW - gap * (cols - 1)) / cols
        total = cols * rows
        n = total if n is None else n
        k = 0
        for r in range(rows):
            for c in range(cols):
                x = PAD + c * (cwid + gap)
                if k < n:
                    self._card(x, self.y, cwid, h, item, list(parts), media)
                else:
                    self.sc.rect(x, self.y, cwid, h, ss="dashed")
                    self.sc.text(x + cwid / 2, self.y + h / 2 - 6, "(no item — cell empty)",
                                 size=9, color=LINE, align="center")
                k += 1
            self.y += h + gap
        if more:
            self.sc.rect(PAD, self.y, CW, 30, bg=FILL_B, ss="dashed")
            self.sc.text(PAD + CW / 2, self.y + 9, more, size=10, color=MUTED, align="center")
            self.y += 40
        self.y += 8

    def rail(self, n=5, h=160, item="", parts=(), note=None):
        cwid, gap = 230, 14
        x = PAD
        for i in range(n):
            w = min(cwid, PAD + CW - x)
            if w < 40:
                break
            self._card(x, self.y, w, h, item if w > 120 else "", list(parts) if w > 120 else [], media=w > 120)
            x += cwid + gap
        self.sc.text(PAD + CW - 6, self.y + h / 2, "→", size=18, color=MUTED, align="right")
        self.y += h + 6
        self.sc.text(PAD, self.y, note or "horizontal scroll rail — clipped at viewport edge", size=9, color=LINE)
        self.y += 24

    def rows(self, n=3, h=76, item="", parts=(), idx=False):
        for i in range(n):
            self.sc.rect(PAD, self.y, CW, h, bg=FILL_A)
            x = PAD + 12
            if idx:
                self.sc.text(x, self.y + h / 2 - 8, "%02d" % (i + 1), size=14, color=MUTED)
                x += 46
            self.sc.rect(x, self.y + 10, 84, h - 20, bg=FILL_C)
            self.sc.text(x + 42, self.y + h / 2 - 6, "thumb", size=9, color=MUTED, align="center")
            tx = x + 98
            for j, p in enumerate(parts):
                self.sc.text(tx, self.y + 12 + j * 15, p, size=10, color=MUTED)
            if item:
                self.sc.text(PAD + CW - 8, self.y + h - 14, item, size=9, color=LINE, align="right")
            self.y += h + 10
        self.y += 8

    def split(self, left, right, h=210, ratio=0.55):
        lw = CW * ratio - 10
        self.sc.rect(PAD, self.y, lw, h, bg=FILL_B)
        self.sc.text(PAD + lw / 2, self.y + h / 2 - 6, left, size=11, color=MUTED, align="center")
        rx, rw = PAD + lw + 20, CW - lw - 20
        self.sc.rect(rx, self.y, rw, h, bg=FILL_A)
        for j, p in enumerate(right):
            self.sc.text(rx + 14, self.y + 16 + j * 18, p, size=10, color=MUTED)
        self.y += h + 20

    def prose(self, lines=6, w=None, cx=None, label=None):
        w = w or CW * 0.72
        x = cx - w / 2 if cx else PAD
        if label:
            self.sc.text(x, self.y, label, size=10, color=LINE)
            self.y += 16
        for i in range(lines):
            lw = w * (0.62 if i == lines - 1 else 1.0)
            self.sc.line(x, self.y, lw, LINE)
            self.y += 13
        self.y += 12

    def bar(self, label, h=52, bg=FILL_B, dashed=False):
        self.sc.rect(PAD, self.y, CW, h, bg=bg, ss="dashed" if dashed else "solid")
        self.sc.text(PAD + CW / 2, self.y + h / 2 - 6, label, size=10, color=MUTED, align="center")
        self.y += h + 16

    def mosaic(self, cols=3, rows=2, h=130):
        gap = 12
        cwid = (CW - gap * (cols - 1)) / cols
        for r in range(rows):
            for c in range(cols):
                x = PAD + c * (cwid + gap)
                self.sc.rect(x, self.y, cwid, h, bg=FILL_C)
                self.sc.text(x + cwid / 2, self.y + h / 2 - 12, "art image", size=10, color=MUTED, align="center")
                self.sc.line(x + 8, self.y + h - 16, cwid - 16, LINE)
                self.sc.text(x + 8, self.y + h - 14, "title · topic·date · ♥ n", size=8, color=MUTED)
            self.y += h + gap
        self.y += 8

    def cta(self):
        h = 120
        self.sc.rect(PAD, self.y, CW, h, bg=DARK, stroke=DARK)
        self.sc.text(PAD + CW / 2, self.y + 24, "END OF SHEET — LET'S BUILD", size=9, color="#ffffff", align="center")
        self.sc.text(PAD + CW / 2, self.y + 44, "Got a hard problem? Let's talk.", size=20, color="#ffffff", align="center")
        for i, b in enumerate(["Let's talk →", "mailto", "LinkedIn ↗"]):
            bx = PAD + CW / 2 - 165 + i * 115
            self.sc.rect(bx, self.y + 78, 100, 26, bg="#ffffff", stroke="#ffffff")
            self.sc.text(bx + 50, self.y + 86, b, size=9, color=DARK, align="center")
        self.y += h + 18

    def footer(self):
        h = 96
        self.sc.rect(PAD, self.y, CW, h, bg=FILL_A)
        cwid = CW / 4
        for i, col in enumerate(["brand — logo + blurb", "SITEMAP (5)", "MAKE (4)", "ELSEWHERE (social)"]):
            x = PAD + i * cwid + 14
            self.sc.text(x, self.y + 14, col, size=10, color=MUTED)
            for j in range(3):
                self.sc.line(x, self.y + 36 + j * 11, cwid * 0.6, LINE)
        self.sc.line(PAD + 14, self.y + h - 22, CW - 28, LINE)
        self.sc.text(PAD + 14, self.y + h - 18, "© copyright · legal links · REV 1.0 / ✛ N10°49′", size=8, color=MUTED)
        self.y += h + 10
        self.sc.text(PAD, self.y, "SiteFooter", size=9, color=LINE)
        self.y += 24

    def note(self, text):
        self.sc.text(PAD, self.y, "※ " + text, size=10, color=ACCENT)
        self.y += 18

    def gap(self, h=14):
        self.y += h

    def finish(self):
        self.frame["height"] = round(self.y + 24 - self.frame["y"], 2)
        return self.sc.json()


# ======================================================================
# PAGE SPECS  — every block below traces to the mapped component tree.
# ======================================================================
def p_home():
    p = Page("luci-studio · / — home", "/", "home")
    p.nav()
    p.hero()
    p.sec(eyebrow="directory", count="6")
    p.grid(6, 1, 92, "directory item", ["num", "title", "desc"], media=False)
    p.sec(eyebrow="the record", count="4", h="Things I've shipped.", link="ALL WORK →")
    p.grid(2, 2, 150, "project card", ["thumb / fig + callout", "title · badge · year", "desc"])
    p.sec(eyebrow="arcade", count="12", h="Play something.")
    p.bar("tech marquee ticker — 9 terms", 30)
    p.rail(6, 170, "game card", ["cover img", "plays", "title + blurb", "host ↗"],
           note="rail: 2-row bento, 3 card variants (tall / photo / spec) + 'All games →' end card")
    p.sec(eyebrow="youtube channel", count="2", h="Watch something.", link="ALL VIDEOS →")
    p.bar("channel strip — @the-luci-studio · View channel ↗", 44)
    p.grid(3, 1, 150, "video card", ["thumb + platform", "tag · title", "host ↗"], n=2)
    p.sec(eyebrow="annex c — tools index", count="11 ENGINES / 64", h="Use something.", link="ALL 64 TOOLS →")
    p.grid(3, 1, 132, "engine block", ["engine name + count", "≤5 rows: chip · title · ↗", "ALL NN →"],
           media=False, more="… 11 engine blocks flow across 3 CSS columns (64 tools total)")
    p.sec(eyebrow="annex d — live telemetry", count="4", h="Track something.")
    p.grid(4, 1, 76, "instrument", ["label + live dot", "value", "sub"], media=False)
    p.note("client-side live instruments; no crypto/map on home (VN gate)")
    p.sec(eyebrow="services", count="4", h="What I build.")
    p.rows(4, 62, "service row", ["num · title", "desc", "tag"])
    p.sec(eyebrow="writing", count="≤6 + ≤6", h="From the blog.", link="ALL POSTS →")
    p.rail(6, 150, "plate", ["cover", "title"],
           note="rail: 2-row bento — posts = full-height plates, series = half-height pairs")
    p.sec(eyebrow="gallery", count="6", h="Hand-drawn & digital.",
          sub="Off-clock studies — pen, pencil and pixels.")
    p.mosaic(3, 2, 128)
    p.note("full-screen lightbox on click")
    p.sec(eyebrow="studio", count="compass SVG")
    p.split("compass SVG", ["stat row — num + suffix", "label", "sub", "(from API)"], 130, 0.55)
    p.bar("AdSlot", 44, FILL_B, dashed=True)
    p.cta()
    p.footer()
    p.note("hero/sections joined by hairline connector ticks; blueprint grid bg + constellation starfield; custom cursor")
    return p


def p_blog():
    p = Page("luci-studio · /blog — post list", "/blog", "post list")
    p.nav()
    p.sec(eyebrow="thoughts", count="NN POSTS")
    p.split("(count numeral + label, right)", ["H1  blog.", "sub — n posts…"], 96, 0.55)
    p.bar("search input (magnifier)  +  'filter' label", 44)
    p.bar("topic chip rail — 'All' + one per topic (freq-sorted) + show all/fewer", 40)
    p.gap(6)
    p.sec(eyebrow="featured", count="fig.00")
    p.split("figure — cover / gradient+tag, 'fig.00 — featured' callout, FEATURED badge",
            ["cat line", "H2 title", "excerpt", "meta — date · read",
             "foot — Read article → · views · likes"], 190, 0.52)
    p.note("featured hero hides while filtering")
    p.sec(eyebrow="all posts", count="9 PER PAGE")
    p.grid(3, 3, 168, "PostCard", ["cover / gradient + tag word + Blog badge",
                                   "cat line (tags)", "title", "excerpt",
                                   "meta — date • read", "foot — Read → · views · likes"])
    p.bar("pagination — ‹ prev · 1 2 3 · next ›     +  'showing x of y'", 44)
    p.note("empty state: title + sub + 'clear filters' button (no load-more)")
    p.bar("AdSlot — blog-list (may render nothing)", 40, FILL_B, dashed=True)
    p.sec(eyebrow="collections", count="TOP 3", h="Series.", link="SEE ALL →")
    p.rows(3, 70, "SeriesCard", ["meta — SERIES / N POSTS / views / likes / year", "title", "desc"])
    p.footer()
    p.note("/vi/blog mirrors this structure 1:1 — thin wrapper, same BlogIndexPage, translated strings")
    return p


def p_post():
    p = Page("luci-studio · /blog/[slug] — post page", "/blog/[slug]", "post page")
    p.nav()
    cx = PAD + CW / 2
    p.gap(4)
    p.note("NO cover hero — cover_image_url is OG-meta only. No TOC, no scroll-progress, no prev/next.")
    p.gap(6)
    pw = CW * 0.74
    p.sc.rect(cx - pw / 2 - 16, p.y, pw + 32, 4, bg=FILL_B, stroke=FILL_B)
    p.sc.text(cx - pw / 2 - 16, p.y + 8, "← back to blog", size=10, color=ACCENT)
    p.y += 26
    for i in range(3):
        p.sc.rect(cx - pw / 2 + i * 66, p.y, 58, 18, bg=FILL_B)
        p.sc.text(cx - pw / 2 + i * 66 + 29, p.y + 4, "topic", size=8, color=MUTED, align="center")
    p.y += 30
    p.sc.text(cx, p.y, "H1  post title", size=26, color=INK, align="center")
    p.y += 40
    p.sc.line(cx - pw / 2, p.y, pw)
    p.y += 16
    p.sc.rect(cx - pw / 2, p.y, pw, 52, bg=FILL_A)
    p.sc.dot(cx - pw / 2 + 12, p.y + 16, 22, FILL_C)
    p.sc.text(cx - pw / 2 + 44, p.y + 12, "Trung Lập (Luci)", size=10, color=MUTED)
    p.sc.text(cx - pw / 2 + 44, p.y + 28, "date · read time · 👁 views · ♥ likes", size=9, color=MUTED)
    p.sc.text(cx + pw / 2 - 12, p.y + 20, "Share  ·  ⌾", size=9, color=MUTED, align="right")
    p.y += 62
    p.sc.line(cx - pw / 2, p.y, pw)
    p.y += 16
    p.bar("AdSlot — post-top", 38, FILL_B, dashed=True)
    p.prose(7, pw, cx, label="markdown body (set:html)")
    p.sc.rect(cx - pw / 2, p.y, pw, 60, bg=FILL_C)
    p.sc.text(cx, p.y + 24, "code block — Prism (dart / go / js / ts)", size=10, color=MUTED, align="center")
    p.y += 72
    p.prose(4, pw, cx)
    p.bar("AdSlot — post-bottom", 38, FILL_B, dashed=True)
    p.sc.rect(cx - pw / 2, p.y, pw, 84, bg=FILL_A)
    p.sc.dot(cx - pw / 2 + 24, p.y + 26, 34, FILL_C)
    p.sc.text(cx - pw / 2 + 74, p.y + 20, "support work.", size=12, color=INK)
    p.sc.text(cx - pw / 2 + 74, p.y + 40, "big circular like button + count", size=9, color=MUTED)
    p.sc.rect(cx + pw / 2 - 110, p.y + 28, 92, 26, bg=FILL_B)
    p.sc.text(cx + pw / 2 - 64, p.y + 36, "support →", size=9, color=INK, align="center")
    p.y += 94
    p.note("support button opens native <dialog> — TP Bank/VietQR (copy+QR) · PayPal · GitHub Sponsors")
    p.gap(8)
    p.sec(eyebrow="more posts", count="3")
    p.grid(3, 1, 140, "compact PostCard", ["cover", "title", "meta"])
    p.sec(eyebrow="comments", count="N")
    p.bar("write card — signed-out: disabled textarea + B/I/U + emoji + 'Sign in with Google'", 46)
    p.bar("signed-in: avatar + contenteditable + toolbar + char count + submit", 40, FILL_A)
    p.bar("list header — count badge  ·  newest / oldest sort toggle", 36, FILL_A)
    p.rows(2, 58, "comment + replies", ["avatar · author · date", "body", "↳ reply"])
    p.bar("load more", 34, FILL_B, dashed=True)
    p.sc.rect(PAD + CW - 120, p.y - 6, 108, 34, bg=FILL_C)
    p.sc.text(PAD + CW - 66, p.y + 4, "♥ like pill", size=9, color=INK, align="center")
    p.sc.text(PAD + CW - 130, p.y + 6, "fixed bottom-right →", size=8, color=LINE, align="right")
    p.y += 44
    p.footer()
    p.note("/vi/blog/[slug] mirrors this 1:1 — same PostDetailPage + shared postPaths(); 404 fallback branch exists")
    return p


def p_series_index():
    p = Page("luci-studio · /blog/series — series index", "/blog/series", "series index")
    p.nav()
    p.sc.text(PAD, p.y, "← thoughts", size=10, color=ACCENT)
    p.y += 24
    p.sec(eyebrow="collections", count="NN COLLECTIONS", h="series.", sub="n series…")
    p.note("no search / no filter / no pagination")
    p.gap(6)
    for i in range(3):
        p.sc.text(PAD, p.y, "%02d   COLLECTION" % (i + 1), size=9, color=MUTED)
        p.sc.line(PAD + 108, p.y + 5, CW - 108)
        p.y += 18
        h = 108
        p.sc.rect(PAD, p.y, CW, h, bg=FILL_A)
        p.sc.rect(PAD + 10, p.y + 10, 210, h - 20, bg=FILL_C)
        p.sc.text(PAD + 115, p.y + h / 2 - 12, "figure — cover / striped", size=9, color=MUTED, align="center")
        p.sc.text(PAD + 115, p.y + h / 2 + 4, "node · 'fig.NN · n posts'", size=8, color=MUTED, align="center")
        bx = PAD + 236
        for j, s in enumerate(["meta — SERIES / N POSTS / views / likes / year", "H2 series title",
                               "description", "topic tags", "READ THE SERIES →"]):
            p.sc.text(bx, p.y + 12 + j * 17, s, size=10,
                      color=ACCENT if j == 4 else MUTED)
        p.sc.text(PAD + CW - 16, p.y + h / 2 - 6, "→", size=16, color=MUTED, align="right")
        p.y += h + 14
    p.gap(4)
    p.note("SeriesCard = horizontal 3-col row: clamp(190px,26%,300px) | 1fr | auto  ·  empty state present")
    p.footer()
    return p


def p_series_detail():
    p = Page("luci-studio · /blog/series/[slug] — series detail", "/blog/series/[slug]", "series detail")
    p.nav()
    p.sc.text(PAD, p.y, "← all series", size=10, color=ACCENT)
    p.y += 24
    p.sec(eyebrow="curated series", count="NN POSTS  ✛", h="H1 series title",
          sub="description  ·  meta: n posts · curated <date>")
    p.sc.rect(PAD, p.y, CW, 150, bg=FILL_C)
    p.sc.text(PAD + CW / 2, p.y + 66, "cover image block", size=11, color=MUTED, align="center")
    p.sc.text(PAD + CW / 2, p.y + 84, "'fig.00 — cover' callout + node", size=9, color=MUTED, align="center")
    p.y += 164
    p.sec(eyebrow="posts in series", count="ordered")
    p.rows(4, 72, ".bp-track row", ["tags · date · read", "H3 post title", "subtitle"], idx=True)
    p.note("row grid = 3rem | 5rem | 1fr | auto  →  index | thumb | meta | stats (views, likes)")
    p.note("mobile: stats column hidden → 3 cols  ·  empty state present  ·  no pagination")
    p.footer()
    return p


def p_games():
    p = Page("luci-studio · /games — showcase", "/games", "showcase")
    p.nav()
    p.sec(eyebrow="arcade", count="19 GAMES  ◎", h="Play a game.",
          sub="Browser-native games built from scratch…")
    p.note("no filters / no controls  ·  radar SVG at header right")
    p.gap(6)
    p.split("media — Beta badge · cover img / video · Cover ⇄ Demo toggle pills",
            ["eyebrow tagline", "H2 title", "blurb", "tag chips",
             "Play now ↗  (pill)", "meta — host dot · 'N plays' or 'New'"], 200, 0.55)
    p.note("featured = GAMES[0] (Faldrop); it repeats inside the AVAILABLE shelf below")
    p.sec(eyebrow="available", count="02 GAMES", h="Available.")
    p.grid(3, 1, 156, "game card", ["media — Beta badge + img", "title", "blurb",
                                    "plays / New", "footer — host dot • ↗"], n=2)
    p.note("only 2 cards render here — the row is short (Faldrop, Sumfall)")
    p.sec(eyebrow="beta", count="17 GAMES", h="Beta.")
    p.grid(3, 2, 156, "game card", ["media — Beta badge + img", "title", "blurb",
                                    "plays / New", "footer — host dot • ↗"],
           more="… + 11 more cards — 17 total → ~6 rows at 3-col (drawn short here)")
    p.note("shelves are built by GAMES.filter(g => !g.beta) / filter(g => g.beta) — 2 vs 17 is lopsided")
    p.note("shelf self-hides when empty  ·  no CTA block beyond SiteFooter")
    p.footer()
    return p


def p_portfolio():
    p = Page("luci-studio · /portfolio — the record", "/portfolio", "the record")
    p.nav()
    p.note("NO page-level H1 / hero — the first section header carries the h1")
    p.gap(6)
    p.sec(eyebrow="01 · story — the person")
    p.split("photo + 'Based in' badge",
            ["H2  My story.", "bio paragraphs", "2-col facts grid"], 200, 0.42)
    p.sec(eyebrow="stats", count="auto-fit")
    p.grid(5, 1, 78, "stat", ["count-up number", "label", "sub"], media=False)
    p.sec(eyebrow="02 · work — the record", h="Experience.")
    p.sc.text(PAD, p.y, "H3  Paid Work", size=13, color=INK)
    p.y += 22
    for i in range(2):
        p.sc.dot(PAD + 6, p.y + 10, 9)
        p.sc.line(PAD + 10, p.y + 20, 0)
        p.sc.text(PAD + 22, p.y + 6, "period", size=9, color=MUTED)
        p.sc.rect(PAD + 90, p.y, CW - 90, 92, bg=FILL_A)
        for j, s in enumerate(["logo · role · company · location", "summary",
                               "achievements", "tech chips  ·  gallery  ·  links"]):
            p.sc.text(PAD + 104, p.y + 12 + j * 18, s, size=10, color=MUTED)
        p.sc.text(PAD + CW - 8, p.y + 80, "TimelineItem", size=9, color=LINE, align="right")
        p.y += 102
    p.sc.text(PAD, p.y, "H3  Own Bets", size=13, color=INK)
    p.y += 22
    for i in range(2):
        p.sc.dot(PAD + 6, p.y + 10, 9)
        p.sc.text(PAD + 22, p.y + 6, "period", size=9, color=MUTED)
        p.sc.rect(PAD + 90, p.y, CW - 90, 78, bg=FILL_A)
        for j, s in enumerate(["logo · role · company", "summary", "achievements · tech · links"]):
            p.sc.text(PAD + 104, p.y + 12 + j * 18, s, size=10, color=MUTED)
        p.y += 88
    p.gap(6)
    p.sec(eyebrow="skills — the stack")
    p.bar("header + 2 stat tiles — disciplines / tools", 46)
    p.grid(4, 1, 96, "skill card", ["dot + label", "num", "chips"], media=False)
    p.split("wide skill card", ["wide skill card — full-width 2-col split row"], 84, 0.48)
    p.note("data is backend-driven (profileService / workService / skillsService) — counts not in src/data/**")
    p.footer()
    return p


def p_lab():
    p = Page("luci-studio · /lab — apps & source", "/lab", "apps & source")
    p.nav()
    p.note("NO page header — first section header carries the h1; crosshair-plotter SVG top-right")
    p.gap(6)
    p.sec(eyebrow="apps", count="NN SHIPPED", h="Released apps.", sub="description")
    p.grid(2, 2, 150, "RepoCard (blueprint)",
           ["banner / monogram tile + owner-name", "title", "desc", "tag chips", "stats row · host footer"])
    p.note("apps come from the /projects API — dynamic count, not in src/data/**")
    p.sec(eyebrow="hubs", count="02 EXTERNAL", h="Tools & Live.")
    p.grid(2, 1, 150, "hub card (hardcoded)",
           ["banner", "Tools — stat '60+ tools' ↗", "Live — stat '5 widgets' ↗"])
    p.note("the 64-tool index is NOT on this page — it lives only in HomePage 'ANNEX C'; these hubs link out")
    p.sec(eyebrow="source", count="NN REPOS", h="Public source.")
    p.grid(2, 1, 150, "RepoCard (blueprint)",
           ["banner / monogram tile", "title", "desc", "tag chips", "stats row · host footer"])
    p.note("empty-state mono line renders here when no repos")
    p.footer()
    return p


def p_videos():
    p = Page("luci-studio · /videos — off-site directory", "/videos", "off-site directory")
    p.nav()
    p.sec(eyebrow="off-site", count="02 VIDEOS", h="Videos.", sub="sub")
    p.bar("channel strip — ▶ YouTube mark  |  'YOUTUBE CHANNEL' + @the-luci-studio  |  View channel ↗ (pill)", 54)
    p.gap(4)
    p.grid(3, 1, 170, "video card", ["16:9 thumb + red platform badge", "tag chip", "title",
                                     "footer — host dot • ↗"], n=2)
    p.note("only 2 videos in src/data/videos.ts → the grid is ONE SHORT ROW (3rd cell empty)")
    p.note("every card target='_blank' — nothing is embedded; off-site directory only")
    p.bar("AdSlot — videos  (the only one of /games /portfolio /lab /videos with a footer ad slot)", 44, FILL_B, dashed=True)
    p.footer()
    return p


def p_legal():
    p = Page("luci-studio · /license · /privacy · /terms — legal template", "/legal", "legal template")
    p.nav()
    p.note("one shared shell, copy-pasted across the 3 pages (not a shared component); TopNav has no active slug")
    p.gap(8)
    cx = PAD + CW / 2
    pw = CW * 0.62
    p.sc.dot(cx - pw / 2, p.y + 3, 7)
    p.sc.text(cx - pw / 2 + 14, p.y, "LEGAL", size=10, color=MUTED)
    p.sc.line(cx - pw / 2 + 62, p.y + 6, pw - 62)
    p.y += 22
    p.sc.text(cx - pw / 2, p.y, "H1  page title", size=24, color=INK)
    p.sc.dot(cx - pw / 2 + 150, p.y + 22, 8)
    p.y += 38
    p.sc.text(cx - pw / 2, p.y, "mono — Last updated: <date>", size=10, color=MUTED)
    p.y += 26
    for i in range(4):
        p.sc.text(cx - pw / 2, p.y, "H2  section heading", size=13, color=INK)
        p.y += 20
        p.prose(3, pw, cx)
        p.sc.line(cx - pw / 2, p.y - 4, pw)
        p.y += 8
    p.sc.text(cx - pw / 2, p.y, "H2  Contact", size=13, color=INK)
    p.y += 20
    p.sc.text(cx - pw / 2, p.y, "mailto: kidoluci.work@gmail.com", size=10, color=ACCENT)
    p.y += 26
    p.note("article.bp-legal-inner — centered prose, max-w 48rem; sections hairline-separated")
    p.note("License = 9 sections (updated Jun 30 2026) · Privacy = 7 (Jul 11 2026) · Terms = 7 (Jun 19 2026)")
    p.note("no AdSlot, no CTA block")
    p.footer()
    return p


PAGES = [p_home, p_blog, p_post, p_series_index, p_series_detail,
         p_games, p_portfolio, p_lab, p_videos, p_legal]


# ---------------------------------------------------------------- push
def api(method, path, body=None, headers=None, raw=False):
    data = body if raw else (json.dumps(body).encode() if body is not None else None)
    if isinstance(data, str):
        data = data.encode()
    req = urllib.request.Request(BASE + path, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    for k, v in (headers or {}).items():
        req.add_header(k, v)
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode() or "{}")


def main():
    dry = "--dry-run" in sys.argv
    # the HTTP API returns a bare list; the MCP wraps it as {"drawings": [...]}
    listing = api("GET", "/api/drawings")
    if isinstance(listing, dict):
        listing = listing.get("drawings", [])
    existing = {d["name"]: d for d in (listing or [])}
    only = next((a.split("=", 1)[1] for a in sys.argv if a.startswith("--only=")), None)
    for fn in PAGES:
        p = fn()
        if only and only not in p.route:
            continue
        content = p.finish()
        n_els = len(p.sc.els)
        if dry:
            print("%-58s %4d els  %6d B  h=%d" % (p.name, n_els, len(content), p.frame["height"]))
            continue
        if p.name in existing:
            d = existing[p.name]
            d = api("PUT", "/api/drawings/" + d["id"], content, raw=True,
                    headers={"X-Base-Updated-At": d["updatedAt"]})
            verb = "updated"
        else:
            d = api("POST", "/api/drawings", {"Name": p.name})
            d = api("PUT", "/api/drawings/" + d["id"], content, raw=True,
                    headers={"X-Base-Updated-At": d["updatedAt"]})
            verb = "created"
        print("%-9s %-58s %4d els  id=%s" % (verb, p.name, n_els, d["id"]))


if __name__ == "__main__":
    main()
