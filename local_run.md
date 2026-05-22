# Running Luci Blog Frontend Locally

This app is the public Astro blog/portfolio frontend. It fetches posts from the Go backend during development and at build time.

## Prerequisites

- Node.js and npm installed.
- The backend API running locally, usually from `../luci_web_blog-backend` on `http://localhost:3000`.

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
- `/chat` loads the chat page.
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

Two suites live in this repo:

- **Unit tests** — Vitest. Cover the service clients (`src/services/*.ts`), the blog utilities (`src/utils/blog.ts`), and the post-stats cache (`src/utils/postStats.ts`). They mock `fetch`/DOM and need no servers running.
- **E2E tests** — Playwright. Drive a real Chromium against `npm run dev` and assert that the top-level pages render. Playwright auto-spawns the dev server before tests and reuses it if one is already running.

### First-time setup

```bash
npm install
npx playwright install chromium chromium-headless-shell
```

Browsers are downloaded once into `~/Library/Caches/ms-playwright` and reused across runs.

### Common commands

```bash
npm run test:unit          # vitest, ~0.5s
npm run test:unit:watch    # vitest in watch mode
npm run test:e2e           # playwright headless, ~15s
npm run test:e2e:ui        # interactive Playwright UI (best for development)
npm run test:all           # unit + e2e in sequence
```

### Watching the browser drive the tests

By default Playwright runs headless. To see the browser:

```bash
npm run test:e2e -- --headed --workers=1
```

`--workers=1` runs the tests one-at-a-time instead of opening five Chromium windows in parallel.

To slow each browser action down enough to actually follow along, set `SLOW_MO` (milliseconds between actions):

```bash
SLOW_MO=500 npm run test:e2e -- --headed --workers=1
```

For step-by-step debugging with a Resume/Step-over UI:

```bash
npm run test:e2e -- --debug
```

To run a single test by name:

```bash
npm run test:e2e -- -g "homepage renders"
```

### After a failed E2E run

Playwright writes a full HTML report — open it with:

```bash
npx playwright show-report
```

Traces are recorded on the first retry (`trace: 'on-first-retry'` in `playwright.config.ts`). Open a trace file with `npx playwright show-trace <path-to-trace.zip>` to step through the failed run frame-by-frame.

### Where the tests live

```
src/
  services/posts.test.ts       — unit tests for the posts API client
  services/gallery.test.ts     — unit tests for the gallery API client
  utils/blog.test.ts           — unit tests for slugify / markdown / date utils
  utils/postStats.test.ts      — unit tests for the localStorage stats cache
tests/
  e2e/smoke.spec.ts            — Playwright smoke suite for /, /blog, /chat
```

## Common Issues

- `Failed to fetch posts`: start the backend or set `PUBLIC_API_URL` to the correct API host.
- `GET /posts/{id} failed with 404`: the post appears in `/posts` but the detail endpoint cannot load it; refresh backend data before deploying.
- Cloudflare/Astro build tries to bind an inspector port such as `9229`; if blocked by your environment, rerun the build with permission to bind local ports.
