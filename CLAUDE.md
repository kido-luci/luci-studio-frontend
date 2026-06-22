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

## Environment Variables

Requires a `.env` file (not committed):

```
PUBLIC_API_URL=http://localhost:3000
```

`PUBLIC_` prefix is required for Astro to expose variables to client-side code. Trailing slashes are stripped in `src/services/posts.ts` before constructing endpoint URLs.

## Architecture

**Stack**: Astro (static site generation) → Cloudflare Pages. Zero JS framework — no React/Vue/Svelte. All interactivity is vanilla JS.

**Two routes**:
- `/` — Portfolio homepage with hardcoded project/experience content + dynamic blog feed fetched from backend API
- `/blog/[slug].astro` — Pre-generated blog post pages using `getStaticPaths()`. Slug format: `{title-slug}-{id}` (e.g. `my-post-123`).

**Data flow**:
- `src/services/posts.ts` — REST client for the backend API (`getAll()` → `GET /posts`, `getByID(id)` → `GET /posts/{id}`)
- `src/utils/blog.ts` — Custom regex-based Markdown→HTML parser (not a library), plus `calculateReadTime`, `formatDate`, `slugify`
- Blog post content is fetched at build time and rendered server-side; no client-side data fetching

**Styling**:
- Tailwind CSS is compiled at build time via PostCSS (`tailwind.config.cjs`, `postcss.config.cjs`); the `@tailwind` directives live in `src/styles/global.css`, imported once in `src/layouts/Layout.astro`. Custom animations/keyframes are defined in `tailwind.config.cjs`. (Previously loaded via the `cdn.tailwindcss.com` runtime JIT — replaced to remove the render-blocking script.)
- All other global CSS lives in `Layout.astro` (`<style is:global>`) — over 600 lines of custom styles
- Theme system (light default / dark toggle) uses CSS variables (`--bg-primary`, `--text-primary`, etc.) persisted in `localStorage`

**Animated background**: a lightweight 2D `<canvas>` particle system (~50 particles, capped at 60fps) in `Layout.astro` — NOT Vanta/Three.js/p5.js (those were removed; only a stale `--vanta-bg` CSS var name remains). The canvas loop is skipped on mobile (`max-width: 768px`) and on Windows (`win-perf-mode`).

**Third-party libraries** (via CDN):
- GSAP + ScrollTrigger + SplitText (jsDelivr, in `Layout.astro`) — scroll reveals, hero/section text animations
- Prism.js (cdnjs, in `blog/[slug].astro` only) — code syntax highlighting (Dart, Go, JS, TS)

**Windows performance mode** (`win-perf-mode`): runtime Windows detection disables backdrop-filter, 3D transforms, and heavy animations. A parallel `max-width: 768px` rule drops backdrop-filter on fixed elements (nav, dimmer, mobile menu) to cut mobile scroll jank.

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
