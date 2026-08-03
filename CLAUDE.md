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

`npm run check` is the cheap pre-commit gate — it catches type errors the dev
server's per-request compile doesn't surface. It's tuned to `--minimumFailingSeverity error`
so the ~10 pre-existing legacy hints (implicit-any in inline event handlers,
`is:inline` script notices) stay advisory; only real type errors fail it.

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

**Routes** (`src/pages/`):
- `/` — Portfolio homepage: hardcoded project/experience content + a dynamic blog feed fetched from the backend at build time
- `/blog/` (index) and `/blog/[slug]` — post pages via `getStaticPaths()`; slug `{title-slug}-{id}` (e.g. `my-post-123`)
- `/blog/series/` and `/blog/series/[slug]` — series index + per-series pages
- `/portfolio`, `/lab`, `/privacy`, `/terms`, `404`, and `sitemap.xml.ts` (there is no `/art` route — art lives in the homepage §04 gallery mosaic + lightbox only)

**Data flow**:
- `src/services/posts.ts` — REST client for the backend API (`getAll()` → `GET /posts`, `getByID(id)` → `GET /posts/{id}`)
- `src/utils/blog.ts` — Custom regex-based Markdown→HTML parser (not a library), plus `calculateReadTime`, `formatDate`, `slugify`
- Blog post content is fetched at build time and rendered server-side; no client-side data fetching

**Styling**:
- Tailwind CSS is compiled at build time via PostCSS (`tailwind.config.cjs`, `postcss.config.cjs`); the `@tailwind` directives live in `src/styles/global.css`, imported once in `src/layouts/Layout.astro`. Custom animations/keyframes are defined in `tailwind.config.cjs`. (Previously loaded via the `cdn.tailwindcss.com` runtime JIT — replaced to remove the render-blocking script.)
- All other global CSS lives in `Layout.astro` (`<style is:global>`) — over 600 lines of custom styles
- Theme system (light default / dark toggle) uses CSS variables (`--bg-primary`, `--text-primary`, etc.) persisted in `localStorage`

**Background**: none. Each page draws its own "blueprint" drafting-grid background in its component CSS. A 2D `<canvas>` particle field used to run site-wide (the drifting `-`/`o` shapes) but was **retired** in v1.45.0 — `particles.ts` / `canvasBackground.ts` and the `#canvas-bg` / `#bg-dimmer` elements are gone; `navDimmer.ts` now only styles the nav on scroll (glass bg + hide-on-scroll). (Also removed earlier: Vanta/p5.js — only a stale `--vanta-bg` CSS var name remains.) One exception: the homepage hero band is a **three.js ocean scene** (`src/scripts/oceanHero.ts` — sky window offset right, shadow-raymarched god rays via `three-good-godrays`, Quaternius CC0 fish; three pinned at 0.179.1 for the postprocessing/godrays peer range; code-split dynamic import on `/` only; ~30fps idle cap, offscreen/hidden pause). Armed by a cheap head probe (`html.ocean-on`); skipped via `localStorage oceanHero="off"`; reduced-motion renders one static frame; no WebGL2 (or GL death) falls back to the CSS constellation corner + hero ring diagram. It replaced the earlier `bpGlow.ts` ambient glow + tsParticles constellation trial.

**Third-party libraries** (via CDN):
- GSAP + ScrollTrigger + SplitText (jsDelivr, in `Layout.astro`) — scroll reveals, hero/section text animations
- Prism.js (cdnjs, in `blog/[slug].astro` only) — code syntax highlighting (Dart, Go, JS, TS)

**Windows performance mode** (`win-perf-mode`): runtime Windows detection disables backdrop-filter, 3D transforms, and heavy animations. A parallel `max-width: 768px` rule drops backdrop-filter on fixed elements (nav, mobile menu) to cut mobile scroll jank.

## Key Files

| File | Purpose |
|------|---------|
| `src/layouts/Layout.astro` | Root layout — all CDN scripts, global CSS, theme toggle, custom cursor, mobile menu |
| `src/services/posts.ts` | API client — Post type definition lives here |
| `src/utils/blog.ts` | Markdown parser and blog utilities |
| `astro.config.mjs` | Static output + Cloudflare adapter |
| `tailwind.config.cjs` / `postcss.config.cjs` | Build-time Tailwind config (content globs, custom animations) + PostCSS pipeline |
| `src/styles/global.css` | `@tailwind` directives, imported in `Layout.astro` |
| `wrangler.jsonc` | Cloudflare Pages deployment config |
