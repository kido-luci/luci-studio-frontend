# luci_dev

[![CI](https://github.com/kido-luci/luci_dev/actions/workflows/ci.yml/badge.svg)](https://github.com/kido-luci/luci_dev/actions/workflows/ci.yml)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](./LICENSE)

Personal blog and portfolio site, built with [Astro](https://astro.build) and deployed as a fully static site to Cloudflare Pages. Live at **[luci-studio.com](https://luci-studio.com)**.

Posts are fetched from a separate REST API **at build time** and baked into static HTML — there are no client-side API calls for post content.

## Tech stack

- **[Astro](https://astro.build)** (`output: 'static'`, `@astrojs/cloudflare` adapter)
- Vanilla JS for all interactivity — no React/Vue
- Tailwind CSS v3, compiled at build time via PostCSS
- CDN libs: GSAP + ScrollTrigger + SplitText (scroll reveals, text animations), Prism.js (code highlighting, post pages only)
- three.js ocean scene on the homepage hero (`src/scripts/oceanHero.ts`, `three` pinned at 0.179.1)
- **[Vitest](https://vitest.dev)** (unit tests)

## Getting started

```bash
npm install
cp .env.example .env      # set PUBLIC_API_URL to your blog API
npm run build && npm run preview   # http://localhost:4321
```

> `npm run dev` is currently broken (Sentry + Cloudflare Vite SSR can't resolve
> `node:path`) — verify changes via `npm run build` + `npm run preview` instead.

| Command | Description |
|---|---|
| `npm run dev` | Dev server — **currently broken**, see note above |
| `npm run build` | Static build to `./dist/` |
| `npm run preview` | Preview the production build on `localhost:4321` |
| `npm run check` | Type-check `.astro` + `.ts` via `astro check` (the pre-commit gate) |
| `npm run test:unit` | Run unit tests (Vitest) |

> The production build fetches posts from `PUBLIC_API_URL` and **fails fast** if the API is unreachable. To build without a backend (e.g. CI), set `ALLOW_EMPTY_POSTS=1` to produce an empty-posts site.

## Project structure

```
src/
├── pages/
│   ├── index.astro           # Homepage (portfolio + animations)
│   ├── blog/[slug].astro     # Per-post pages via getStaticPaths()
│   └── sitemap.xml.ts         # Dynamic sitemap, generated at build
├── services/posts.ts          # Build-time API client
├── utils/blog.ts              # Markdown→HTML parser, slug + read-time helpers
├── components/                # ProjectCard, TimelineItem, ...
└── layouts/Layout.astro       # Shared shell, theme variables, scroll reveals
```

Post slugs follow `{title-kebab-case}-{post-id}` and are parsed in `src/utils/blog.ts`.

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `PUBLIC_API_URL` | yes | Base URL of the blog backend API |
| `PUBLIC_GSC_VERIFICATION` | no | Google Search Console verification token |
| `ALLOW_EMPTY_POSTS` | no | Set to `1` to allow builds when the API is unreachable |

## License

[AGPL-3.0-only](./LICENSE) © Luci Studio

You are free to use, study, modify, and self-host this code. If you run a
modified version as a network service, the AGPL requires you to offer its
source to your users under the same license. Site content (articles, artwork,
branding) is not covered by this license — see
[luci-studio.com/license](https://luci-studio.com/license).
