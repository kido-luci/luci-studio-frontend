# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start local development server
npm run build     # Build for production (static output)
npm run preview   # Preview production build locally
```

No test, lint, or type-check scripts are configured.

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
- Theme system (dark default / light toggle) uses CSS variables (`--bg-primary`, `--text-primary`, etc.) persisted in `localStorage`

**Third-party libraries** (all loaded via CDN in `Layout.astro`):
- Vanta.js (Three.js + p5.js) — animated background
- Anime.js — animation orchestration
- Prism.js — code syntax highlighting (Dart, Go, JS, TS)

**Windows performance mode**: Runtime detection of Windows disables backdrop-filter, 3D transforms, and heavy animations.

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
