# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start local development server
npm run build     # Build for production (static output)
npm run preview   # Preview production build locally
npm run check     # Type-check .astro + .ts via `astro check` (fails on errors; hints/warnings don't block)
npm run test      # Unit tests (vitest)
```

`npm run check` is the cheap pre-commit gate — it catches type errors the build
does not, because the build transpiles without type-checking. It's tuned to
`--minimumFailingSeverity error` so the ~12 pre-existing legacy hints (implicit-any
in inline event handlers, `is:inline` script notices) stay advisory; only real
type errors fail it. CI runs it on every PR, ahead of the tests and the build.

`npm run dev` works in this repo (verified 2026-08-03: `/` and `/blog` both serve
200). The workspace CLAUDE.md still says both frontends' dev server is broken —
that is stale for this one; only the admin app is affected.

## Development workflow

**Per-change loop** — one focused change at a time:
1. **Explore** the real code first (grep/read) before editing — don't assume how it's wired.
2. **Edit** one focused change.
3. **Verify**: run `npm run check` (type gate), then confirm behaviour. Screenshots come
   out blank on the canvas+GSAP pages (`/`, `/blog/[slug]`) — verify those via DOM eval in
   the preview, not screenshots (`/blog` and `/lab` screenshot fine).
4. **Commit** one change per commit on a topic branch (keeps rollback points).

**Release** (this app auto-deploys to Cloudflare Pages from `master`):
- `dev` is the default/integration branch; `master` is the prod auto-deploy branch.
- Flow: topic branch → PR into `dev` → merge → PR `dev → master` → merge → annotated tag
  `vX.Y.Z` on `master`. (See the workspace CLAUDE.md for the repo-wide PR-only convention.)
- **`dev` and `master` are protected on GitHub** (set 2026-08-03 — this repo is public since
  the AGPL source release, so protection is available on the free plan): branch deletion and
  force-push are blocked, and changes must arrive through a PR (0 approvals required, admins
  not enforced). That protection, not any merge flag, is what keeps the prod `master` branch
  alive.
- **The repo's "Automatically delete head branches" setting is ON**, and
  `gh pr merge --delete-branch=false` does **not** override it — on 2026-08-03 two topic
  branches were auto-deleted at merge despite the flag. Merged topic branches disappearing is
  expected; `dev` and `master` are spared because they are protected.
- **No `master→dev` back-merges.** The dev/master merge-commit "desync" is cosmetic
  (identical content) — don't chase it. A back-merge PR has `head=master`, which the
  auto-delete-head setting used to delete the prod `master` branch outright (it did, twice on
  2026-06-22). Branch protection blocks that now, but the rule stands. See the workspace
  CLAUDE.md Git Workflow for the full rationale.
- **Build green before releasing**: with the local backend running, `npm run build` fetches
  real data and renders every page. (The build is network-gated against the prod API, so
  build against the local backend.)

## Environment Variables

Requires a `.env` file (not committed):

```
PUBLIC_API_URL=http://localhost:3000
```

`PUBLIC_` prefix is required for Astro to expose variables to client-side code. Trailing slashes are stripped in `src/services/posts.ts` before constructing endpoint URLs.

## Architecture

**Stack**: Astro (static site generation) → Cloudflare Pages. Zero JS framework — no React/Vue/Svelte. All interactivity is vanilla JS.

**Routes** (`src/pages/`) — every route file is a **thin wrapper** (4–20 lines) that
imports a body component from `src/components/pages/`. That indirection is what lets
the English and Vietnamese routes render the same component, which reads its locale
from the URL. Put page logic in the body component, never in the route file.
- `/` — Portfolio homepage: hardcoded project/experience content + a dynamic blog feed fetched from the backend at build time
- `/blog/` (index) and `/blog/[slug]` — post pages via `getStaticPaths()`; slug `{title-slug}-{id}` (e.g. `my-post-123`)
- `/blog/series/` and `/blog/series/[slug]` — series index + per-series pages
- `/vi/blog/…` — the Vietnamese mirror of the blog section, and the **only** localized
  surface. `getStaticPaths` for both locales comes from one source (`src/utils/i18nPaths.ts`)
- `/portfolio`, `/lab`, `/games`, `/videos`, `/privacy`, `/terms`, `/license`, `404`, and `sitemap.xml.ts` (there is no `/art` route — art lives in the homepage §04 gallery mosaic + lightbox only)

**Source layout** (`src/`):

| Directory | Holds |
|-----------|-------|
| `pages/` | Route wrappers only — see above |
| `components/pages/` | One body component per route (`HomePage`, `BlogIndexPage`, `PostDetailPage`, …) |
| `components/home/` | The homepage's own sections (`HomeHero`, `HomeArt`, `HomeWork`, `HomeBlogRail`, …) — `HomePage.astro` is a shell that composes them |
| `components/post/` | Widgets belonging to the post page (`SupportDialog`) |
| `components/` (root) | Cross-page components (`TopNav`, `PostCard`, `SeriesCard`, `SiteFooter`, …) |
| `services/` | One module per backend resource; pages never `fetch()` directly |
| `lib/apiClient.ts` | The shared fetch layer every service is built on |
| `utils/` | Pure transforms (markdown, series aggregation, stats, path building) |
| `scripts/` | Client-side behaviour, one module per feature; `scripts/layout/` is the site chrome and `scripts/post/` is the post page. **All client JS lives here** — nothing ships from `public/` |
| `i18n/` | Locale detection, the English string catalog, and the translation overlay |
| `data/` | Hardcoded content (games, tools, videos) that has no backend entity |
| `config/` | Feature flags |
| `styles/` | `global.css` (Tailwind directives + shared blueprint tokens), `lab-cards.css`, and `post-content.css` |

**Data flow**:
- `src/lib/apiClient.ts` — the shared fetch layer: strips the trailing slash off `PUBLIC_API_URL`, dedupes concurrent build-time callers into one round-trip, and decides via `FAIL_FAST` whether a broken backend fails the prod build or resolves empty (`ALLOW_EMPTY_POSTS=1` opts out locally)
- `src/services/*.ts` — one module per resource, built on `cachedGetAll` / `fetchOne`. `posts.ts` also owns the `Post` type. Two services bypass the client on purpose: `games.ts` (hits each game's own Worker) and `github.ts` (pure URL parsing)
- `src/utils/blog.ts` — Custom regex-based Markdown→HTML parser (not a library), plus `calculateReadTime`, `formatDate`, `slugify`
- Blog post content is fetched at build time and rendered server-side; no client-side data fetching

**Styling**:
- Tailwind CSS is compiled at build time via PostCSS (`tailwind.config.cjs`, `postcss.config.cjs`); the `@tailwind` directives live in `src/styles/global.css`, imported once in `src/layouts/Layout.astro`. Custom animations/keyframes are defined in `tailwind.config.cjs`. (Previously loaded via the `cdn.tailwindcss.com` runtime JIT — replaced to remove the render-blocking script.)
- Global CSS lives in four deliberate places, not one: `Layout.astro`'s `<style is:global>` (~390 lines — site chrome, theme tokens, accent schemes), `src/styles/global.css` (Tailwind directives + the shared `bp-` blueprint tokens and section-header atoms, already de-duplicated out of ~17 components), `src/styles/lab-cards.css` (the RepoCard palette, imported by `/lab` and `/games`), and `src/styles/post-content.css` (the post page's prose, Prism tokens, engagement bar and comment thread, imported by `PostDetailPage.astro` alone). Per-page tokens stay in the component that owns them — do not hoist them
- Everything else is component-scoped `<style>`. Note that a few base rules use the `background` **shorthand**, which resets `background-image`; a shared global class cannot override them without `!important`, so small per-component duplicates (e.g. the 45° hatch fill) are left alone on purpose
- Theme system (light default / dark toggle) uses CSS variables (`--bg-primary`, `--text-primary`, etc.) persisted in `localStorage`

**Background**: none. Each page draws its own "blueprint" drafting-grid background in its component CSS. A 2D `<canvas>` particle field used to run site-wide (the drifting `-`/`o` shapes) but was **retired** in v1.45.0 — `particles.ts` / `canvasBackground.ts` and the `#canvas-bg` / `#bg-dimmer` elements are gone; `navDimmer.ts` now only styles the nav on scroll (glass bg + hide-on-scroll). (Also removed earlier: Vanta/p5.js — only a stale `--vanta-bg` CSS var name remains.) One exception: the homepage hero band is a **three.js ocean scene** (`src/scripts/oceanHero.ts` — sky window offset right, shadow-raymarched god rays via `three-good-godrays`, Quaternius CC0 fish; three pinned at 0.179.1 for the postprocessing/godrays peer range; code-split dynamic import on `/` only, loaded from `components/home/HomeHero.astro`, which owns the whole hero band; ~30fps idle cap, offscreen/hidden pause). Armed by a cheap head probe (`html.ocean-on`); skipped via `localStorage oceanHero="off"`; reduced-motion renders one static frame; no WebGL2 (or GL death) falls back to the CSS constellation corner + hero ring diagram. It replaced the earlier `bpGlow.ts` ambient glow + tsParticles constellation trial.

**Third-party libraries** (via CDN):
- GSAP + ScrollTrigger + SplitText (jsDelivr, in `Layout.astro`) — scroll reveals, hero/section text animations
- Prism.js (cdnjs, in `components/pages/PostDetailPage.astro` only) — code syntax highlighting (Dart, Go, JS, TS). Its token CSS and the `.markdown-content` prose styles live in `src/styles/post-content.css` and are used by nothing else
- Twemoji (jsDelivr, in `components/pages/PostDetailPage.astro` only) — emoji in comments. Loaded from the body while the post modules are hoisted into `<head>`, so `window.twemoji` may be undefined at module-init time; every use is inside an event handler or runs after the comments fetch, and each one guards on it

**Windows performance mode** (`win-perf-mode`): runtime Windows detection disables backdrop-filter, 3D transforms, and heavy animations. A parallel `max-width: 768px` rule drops backdrop-filter on fixed elements (nav, mobile menu) to cut mobile scroll jank.

## Key Files

| File | Purpose |
|------|---------|
| `src/layouts/Layout.astro` | Root layout — all CDN scripts, global CSS, theme toggle, custom cursor, mobile menu |
| `src/lib/apiClient.ts` | Shared fetch layer — base URL, build-time dedupe, fail-fast policy |
| `src/services/posts.ts` | Posts resource — the `Post` type definition lives here |
| `src/utils/blog.ts` | Markdown parser and blog utilities |
| `src/utils/i18nPaths.ts` | The one `getStaticPaths` source shared by the `en` and `vi` routes |
| `src/i18n/index.ts` | Locale detection, `t()`, `localizedHref`, and the `translations` overlay |
| `src/scripts/blogIndex.ts` | `/blog` behaviour — filtering, search, pagination, topic-chip clamp |
| `src/scripts/postLikes.ts` | The one like-button implementation, shared by `/blog` and the home rail |
| `src/scripts/post/` | The post page, one module per feature: `postChrome` (copy/share/bookmark/theme icon), `postEngagement` (views + likes), `comments` (thread, Google auth, reactions, replies), `commentFormat` (its pure, tested helpers), `confirmDialog`, `emojiPicker` |
| `src/components/home/HomeHero.astro` | Homepage hero band — ocean scene, constellation and hero header, with the CSS for all three |
| `astro.config.mjs` | Static output + Cloudflare adapter |
| `tailwind.config.cjs` / `postcss.config.cjs` | Build-time Tailwind config (content globs, custom animations) + PostCSS pipeline |
| `src/styles/global.css` | `@tailwind` directives, imported in `Layout.astro` |
| `wrangler.jsonc` | Cloudflare Pages deployment config |
