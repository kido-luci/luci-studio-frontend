# Running Luci Blog Frontend Locally

This app is the public Astro blog/portfolio frontend. It fetches posts from the Go backend during development and at build time.

## Prerequisites

- Node.js and npm installed.
- The backend API running locally, usually from `../luci-studio_backend` on `http://localhost:3000`.

## Environment Setup

Create a `.env` file in this directory:

```env
PUBLIC_API_URL=http://localhost:3000
```

`PUBLIC_API_URL` must include the `PUBLIC_` prefix because Astro exposes only public-prefixed variables to client-side code. Do not commit `.env`; it is ignored by Git.

## Install Dependencies

```bash
npm install
```

## Start Development Server

```bash
npm run dev
```

Astro will print the local URL, normally `http://localhost:4321`. Open it in a browser and verify:

- `/` renders the portfolio and latest posts.
- `/blog` lists blog posts.
- `/blog/{slug}` renders generated post pages when backend data is available.

To make the dev server reachable from another device on the same network, bind Astro to all interfaces:

```bash
npm run dev -- --host 0.0.0.0
```

Then open `http://<your-local-ip>:4321`, for example `http://192.168.1.20:4321`. If the site calls a local backend from another device, update `.env` so `PUBLIC_API_URL` also uses the backend machine's LAN IP instead of `localhost`, for example:

```env
PUBLIC_API_URL=http://192.168.1.20:3000
```

## Build and Preview

Run a production build:

```bash
npm run build
```

Production builds fetch post data from `PUBLIC_API_URL`. If the backend is unavailable, the build fails so an empty blog is not deployed by accident.

For local build checks without the backend, allow empty post data explicitly:

```bash
ALLOW_EMPTY_POSTS=1 npm run build
```

Preview the built site:

```bash
npm run preview
```

## Running Tests

One suite lives in this repo: **unit tests** on Vitest. They cover the shared API client (`src/lib/apiClient.ts`), the posts, gallery and GitHub services (`src/services/`), the `src/utils/` helpers (blog, series, i18n paths, lab cards, post-stats cache), the i18n helpers (`src/i18n/`), and the comment formatting helpers (`src/scripts/post/commentFormat.ts`). They mock `fetch`/DOM and need no servers running.

### Common commands

```bash
npm run test:unit          # vitest, ~0.5s
npm run test:unit:watch    # vitest in watch mode
```

### Where the tests live

```
src/
  i18n/i18n.test.ts            — unit tests for locale detection, localized paths and the translation overlay
  lib/apiClient.test.ts        — unit tests for the shared fetch layer (fail-fast, 404, dedupe)
  scripts/post/commentFormat.test.ts — unit tests for the comment formatting helpers
  services/posts.test.ts       — unit tests for the posts API client
  services/gallery.test.ts     — unit tests for the gallery API client
  services/github.test.ts      — unit tests for the GitHub repo-URL parser
  utils/blog.test.ts           — unit tests for slugify / markdown / date utils
  utils/i18nPaths.test.ts      — unit tests for the shared getStaticPaths builders
  utils/labCards.test.ts       — unit tests for the /lab project-card mapping
  utils/postStats.test.ts      — unit tests for the localStorage stats cache
  utils/series.test.ts         — unit tests for the series aggregation
```

## Common Issues

- `Failed to fetch /posts`: start the backend or set `PUBLIC_API_URL` to the correct API host.
- A post listed by `/posts` gets no page: its `GET /posts/{id}` returned 404, which the build treats as missing and skips without an error; refresh backend data before deploying.
- Cloudflare/Astro build tries to bind an inspector port such as `9229`; if blocked by your environment, rerun the build with permission to bind local ports.
