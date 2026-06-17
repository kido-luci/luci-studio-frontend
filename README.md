# luci_dev

[![CI](https://github.com/kido-luci/luci_dev/actions/workflows/ci.yml/badge.svg)](https://github.com/kido-luci/luci_dev/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

Personal blog and portfolio site, built with [Astro](https://astro.build) and deployed as a fully static site to Cloudflare Pages. Live at **[luci-studio.com](https://luci-studio.com)**.

Posts are fetched from a separate REST API **at build time** and baked into static HTML — there are no client-side API calls for post content.

## Tech stack

- **[Astro](https://astro.build)** (`output: 'static'`, `@astrojs/cloudflare` adapter)
- Vanilla JS for all interactivity — no React/Vue
- Tailwind via CDN (no PostCSS/build step for CSS)
- CDN libs: Vanta.js + Three.js + p5.js (animated background), Anime.js, Prism.js (code highlighting)
- **[Vitest](https://vitest.dev)** (unit) + **[Playwright](https://playwright.dev)** (e2e)

## Getting started

```bash
npm install
cp .env.example .env      # set PUBLIC_API_URL to your blog API
npm run dev               # http://localhost:4321
```

| Command | Description |
|---|---|
| `npm run dev` | Dev server on `localhost:4321` |
| `npm run build` | Static build to `./dist/` |
| `npm run preview` | Preview the production build |
| `npm run test:unit` | Run unit tests (Vitest) |
| `npm run test:e2e` | Run end-to-end tests (Playwright) |

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

[MIT](./LICENSE) © Luci
