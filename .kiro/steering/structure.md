# Project Structure

```
/
├── public/
│   ├── images/          # Static assets (logo_icon.png, etc.)
│   └── .assetsignore
├── src/
│   ├── components/      # Reusable Astro components
│   │   ├── ProjectCard.astro   # Portfolio card with tilt/hover effects
│   │   └── TimelineItem.astro  # Expandable experience timeline row
│   ├── layouts/
│   │   └── Layout.astro        # Base HTML shell: fonts, Vanta.js, global CSS, all JS
│   └── pages/
│       └── index.astro         # Single-page app — all sections live here
├── .kiro/steering/      # AI steering rules
├── astro.config.mjs     # Astro config (minimal, no integrations)
├── tailwind.config.mjs  # Tailwind config (reference only; active config is inline in Layout.astro)
├── wrangler.jsonc       # Cloudflare Pages deployment config
└── package.json
```

## Conventions

### Components
- Props are typed with a `interface Props {}` block at the top of the frontmatter
- Destructure props from `Astro.props`
- Components receive an `index` prop for staggered reveal animations (`data-delay`)

### Styling
- Tailwind utility classes only — no separate CSS files
- Global styles and custom CSS (animations, `.tilt-card`, `.magnetic`, `.text-shimmer`, etc.) are defined in a `<style is:global>` block inside `Layout.astro`
- Dark theme: base background `#0a0a0a`, text `gray-100`
- Accent colors: violet (`violet-500`), pink (`pink-500`), blue (`blue-500`)
- Border radius is large by convention: `rounded-[32px]`, `rounded-[40px]`, `rounded-[48px]`

### JavaScript
- All interactive JS (cursor, scroll, IntersectionObserver, tilt, magnetic, timeline toggle) lives in a single `<script>` block at the bottom of `Layout.astro`
- Component-specific behavior (e.g. portfolio → timeline navigation) is also in that script, using `data-*` attributes as hooks
- No JS framework — vanilla TypeScript inside Astro `<script>` tags

### Animations & Reveals
- Scroll-triggered reveals use `data-reveal` attributes (`data-reveal`, `data-reveal="left"`, `data-reveal="right"`, `data-reveal="scale"`)
- Stagger delay via `data-delay="1"` through `data-delay="6"`
- Word-by-word headline reveals use `data-word-reveal` on the parent and `.reveal-word` on each word span
- Counter animations use `data-count` and `data-suffix` attributes

### Data
- All page content (projects, experience, indie projects) is defined as arrays in the frontmatter of `index.astro` — no CMS or external data source
