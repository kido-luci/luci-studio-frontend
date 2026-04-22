# Tech Stack

## Framework
- **Astro v6** – Static site generator, `.astro` component format
- Tailwind CSS – loaded via CDN (`is:inline` script in Layout.astro), config defined inline
- `tailwind.config.mjs` exists but the active config is the inline one in `Layout.astro`

## Fonts & External Libraries (CDN)
- **Google Fonts:** Inter (body), Outfit (headings)
- **Three.js r134** – required by Vanta.js
- **Vanta.js (HALO)** – animated background in the hero section

## Deployment
- **Cloudflare Pages** via Wrangler (`wrangler.jsonc`)
- Static output served from `./dist`
- Wrangler project name: `luci-dev`

## Common Commands

```bash
# Start local dev server
npm run dev

# Production build (outputs to ./dist)
npm run build

# Preview production build locally
npm run preview

# Deploy to Cloudflare Pages (requires wrangler auth)
npx wrangler pages deploy ./dist
```

## Notes
- No TypeScript config — Astro handles TS natively in `.astro` frontmatter
- No test framework configured
- No CSS preprocessor — utility-first Tailwind only
- Animations and interactive JS live in `<script>` blocks inside `.astro` files
