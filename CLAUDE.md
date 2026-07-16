# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start local development server
npm run build     # Build for production (static output)
npm run preview   # Preview production build locally
npm run check     # Type-check .astro + .ts via `astro check` (fails on errors; hints/warnings don't block)
npm run test      # Unit tests (vitest)
npm run test:e2e  # End-to-end smoke tests (playwright)
npm run test:all  # Unit + e2e
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
- **Always merge with `gh pr merge <n> --merge --delete-branch=false`.** A back-merge PR
  (`head=master`) merged without it once auto-deleted the prod `master` branch — never let
  a merge delete a long-lived branch.
- **No `master→dev` back-merges.** The dev/master merge-commit "desync" is cosmetic
  (identical content) — don't chase it. A back-merge PR has `head=master`, which the repo's
  auto-delete-head setting uses to delete the prod `master` branch (it did, twice on
  2026-06-22). See the workspace CLAUDE.md Git Workflow for the full rationale.
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
- `/portfolio`, `/lab`, `/art/[slug]`, `/privacy`, `/terms`, `404`, and `sitemap.xml.ts`

**Data flow**:
- `src/services/posts.ts` — REST client for the backend API (`getAll()` → `GET /posts`, `getByID(id)` → `GET /posts/{id}`)
- `src/utils/blog.ts` — Custom regex-based Markdown→HTML parser (not a library), plus `calculateReadTime`, `formatDate`, `slugify`
- Blog post content is fetched at build time and rendered server-side; no client-side data fetching

**Styling**:
- Tailwind CSS is compiled at build time via PostCSS (`tailwind.config.cjs`, `postcss.config.cjs`); the `@tailwind` directives live in `src/styles/global.css`, imported once in `src/layouts/Layout.astro`. Custom animations/keyframes are defined in `tailwind.config.cjs`. (Previously loaded via the `cdn.tailwindcss.com` runtime JIT — replaced to remove the render-blocking script.)
- All other global CSS lives in `Layout.astro` (`<style is:global>`) — over 600 lines of custom styles
- Theme system (light default / dark toggle) uses CSS variables (`--bg-primary`, `--text-primary`, etc.) persisted in `localStorage`

**Background**: none. Each page draws its own "blueprint" drafting-grid background in its component CSS. A 2D `<canvas>` particle field used to run site-wide (the drifting `-`/`o` shapes) but was **retired** in v1.45.0 — `particles.ts` / `canvasBackground.ts` and the `#canvas-bg` / `#bg-dimmer` elements are gone; `navDimmer.ts` now only styles the nav on scroll (glass bg + hide-on-scroll). (Also removed earlier: Vanta/Three.js/p5.js — only a stale `--vanta-bg` CSS var name remains.) One exception: the homepage layers a WebGL2 ambient glow under its grid (`src/scripts/bpGlow.ts` — raw fragment shader, no Three.js; ~30fps idle throttle, on mobile too since v1.66.0; skipped on reduced-motion, missing WebGL2, or `localStorage bpGlow="off"`) plus a tsParticles "links" constellation in the hero.

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
