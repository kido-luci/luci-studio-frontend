# Antigravity Rules & Skills: Luci Portfolio & Blog

This document outlines the strict coding standards, architectural decisions, and development workflow for this Astro-based portfolio and blog. It reflects the **actual project setup** and must be followed precisely.

---

## 1. Project Identity & Purpose

*   **Owner:** Luci — a Fullstack Developer and Digital Artist.
*   **Goal:** A premium personal portfolio, art showcase, and technical blog.
*   **Brand Identity:** Dual identity — technical precision (The Engineer) and creative expression (The Artist).
*   **Visual Style:** Dark mode-first, premium aesthetics — neon gradients (purple → blue → pink), glassmorphism, bold Outfit typography for headings, Inter for body text, micro-animations.

---

## 2. Core Architecture & Tech Stack

| Concern | Technology | Notes |
|---|---|---|
| Framework | Astro 6+ | Static Site Generation (SSG) by default |
| Styling | Tailwind CSS (via CDN) | See §3 for critical setup details |
| Fonts | Google Fonts (Inter, Outfit) | Loaded via `<link>` in `Layout.astro` |
| Deployment | Cloudflare Workers (static) | Configured via `wrangler.jsonc` |
| Language | TypeScript preferred | Use `<script lang="ts">` and `interface Props` |

---

## 3. Tailwind CSS — Critical Setup (CDN Mode)

> **IMPORTANT:** This project currently uses the **Tailwind Play CDN** (`cdn.tailwindcss.com`), NOT a build-time integration. This is because `@astrojs/tailwind` cannot be installed in the current network environment.

*   **CDN Script Location:** The CDN script is loaded in `src/layouts/Layout.astro` via `<script is:inline src="https://cdn.tailwindcss.com">`.
*   **Custom Configuration:** Tailwind configuration (custom animations, keyframes) is embedded in a second `<script is:inline>` block in `Layout.astro` using `tailwind.config = { ... }`. Do NOT use `tailwind.config.mjs` for CDN configuration — the file exists for reference only.
*   **Do NOT:** Remove the CDN script or attempt to switch to a build-time Tailwind integration without verifying that npm packages can be installed first.
*   **Utility-First:** Write all styles using Tailwind utility classes in the markup. Avoid custom `<style>` blocks unless writing complex keyframe animations.
*   **Responsive Design:** Mobile-first. Use `sm:`, `md:`, `lg:`, `xl:` breakpoints. Never skip mobile styles.
*   **Arbitrary Values:** Allowed for one-off values (e.g., `bg-[#050505]`, `blur-[120px]`). For repeated values, add them to the embedded `tailwind.config` theme extension.

### Established Custom Animations (Already Configured)
These are available as Tailwind classes because they are defined in the embedded config:
*   `animate-fade-in-up` — for hero entry animations
*   `animate-blob` — for floating background blobs
*   `animate-gradient-xy` — for gradient logo animations

---

## 4. File & Component Architecture

```
src/
├── layouts/
│   └── Layout.astro        # Global HTML shell, fonts, Tailwind CDN, global styles
├── pages/
│   └── index.astro         # Landing page — DO NOT split unless adding new pages
├── components/             # Create here when a UI pattern is reused 3+ times
└── assets/                 # Processed assets (images that need Astro optimization)

public/
├── images/                 # Static images (no processing needed)
└── .assetsignore           # Required empty file for Cloudflare Workers deployment
```

*   **Layout vs Page:** `Layout.astro` is the HTML shell (head, fonts, body, global CSS). Pages contain sections and content. Keep them separate.
*   **Component Extraction Rule:** Extract to a component when a UI pattern appears 3+ times, or when it exceeds ~60 lines. Name components descriptively (e.g., `ProjectCard.astro`, `BlogPostCard.astro`).
*   **Always define `interface Props`** in component frontmatter for type safety.

---

## 5. Page Sections — Established Patterns

The `index.astro` landing page follows this established section order:

1.  **Background & Noise Overlay** — Fixed, `z-[-10]` to `z-[100]`, decorative blobs.
2.  **Navigation** — Fixed top, glassmorphism (`backdrop-blur-xl bg-black/20`), logo + links + CTA.
3.  **Hero** — Full viewport height, centered, large Outfit font, animated badge + title + subtitle + CTAs + scroll indicator.
4.  **Split Identity** — Two cards side by side: "THE ENGINEER" (purple) and "THE ARTIST" (blue).
5.  **Selected Work** (`#work`) — Portfolio grid, project cards with hover reveal overlays.
6.  **Latest Articles** (`#blog`) — Blog post card grid, article metadata, hover effects.
7.  **CTA / Contact** (`#contact`) — Large gradient block with a "SAY HELLO" button.
8.  **Footer** — Logo, navigation columns, social links, copyright.

When adding new sections, maintain this order and follow the same design language.

---

## 6. Design System Rules

### Color Palette
*   **Background base:** `#050505`, sections alternate to `#080808` and `#0a0a0a`.
*   **Primary accent:** Purple (`purple-600`, `purple-500`, `purple-400`)
*   **Secondary accent:** Blue (`blue-500`, `blue-600`, `blue-400`)
*   **Tertiary:** Pink (`pink-500`) for gradients only.
*   **Text:** `white` for headings, `gray-400` for body, `gray-500` for muted/footer.

### Typography
*   **Headings:** `font-family: 'Outfit', sans-serif` — always `font-black` or `font-bold`, `tracking-tighter` or `tracking-tight`.
*   **Body:** `font-family: 'Inter', sans-serif` — `text-gray-400`, `leading-relaxed`.
*   **Labels/Badges:** `uppercase tracking-widest text-xs font-bold`.

### Component Patterns
*   **Cards:** `bg-[#0a0a0a] border border-white/5 rounded-[40px]` — hover state adds colored border (`hover:border-purple-500/30`).
*   **Buttons (Primary):** `bg-purple-600 rounded-2xl text-white font-bold uppercase tracking-widest hover:scale-105 hover:shadow-[0_0_40px_rgba(147,51,234,0.3)]`.
*   **Buttons (Ghost):** `bg-white/5 border border-white/10 rounded-2xl`.
*   **Nav CTA:** `bg-white text-black rounded-full hover:bg-purple-500 hover:text-white`.
*   **Section Labels:** `text-purple-500 font-bold uppercase tracking-[0.3em] text-xs`.

---

## 7. Performance & Islands Architecture

*   **Zero JS by Default:** Astro ships zero JS to the client. This is the default — preserve it.
*   **No Framework Components Unless Required:** Do not introduce React/Vue/Svelte unless a feature genuinely requires client-side state that cannot be achieved with vanilla JS.
*   **Hydration Directives (if frameworks are used):**
    *   `client:load` — Critical UI only (e.g., mobile menu).
    *   `client:idle` — Below-the-fold interactive.
    *   `client:visible` — Heavy components not in initial viewport.
*   **Animations:** Prefer CSS animations (`@keyframes` or Tailwind `animate-*`) over JS-driven animations.

---

## 8. SEO & Accessibility

*   **Every page must have:** A unique `<title>` and `<meta name="description">` passed as props to `Layout.astro`.
*   **Single `<h1>` per page.** Use `<h2>` for sections, `<h3>` for cards.
*   **Semantic HTML5:** `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`. No `<div>` soup.
*   **Images:** Always include meaningful `alt` attributes. Use `loading="lazy"` for below-the-fold images.
*   **Focus states:** All interactive elements must have visible focus styles (`focus-visible:ring`).
*   **Color contrast:** Maintain WCAG AA minimum for body text against backgrounds.

---

## 9. Deployment — Cloudflare Workers

*   **Platform:** Cloudflare Workers (static assets mode), NOT Cloudflare Pages.
*   **Configuration:** `wrangler.jsonc` at project root. **Critical rule:** Do NOT add `"binding": "ASSETS"` to the `assets` object for a static-only site — it causes a deploy error.

```jsonc
// Correct wrangler.jsonc for this static Astro site:
{
  "name": "luci-dev",
  "compatibility_date": "2024-04-20",
  "assets": {
    "directory": "./dist"
  },
  "observability": {
    "enabled": true
  }
}
```

*   **Build command:** `npm run build` → outputs to `dist/`
*   **Deploy command:** `npx wrangler deploy`
*   **Required file:** `public/.assetsignore` must exist (even if empty).
*   **Node version:** Pin `NODE_VERSION=20` in Cloudflare environment variables to avoid initialization hangs.

---

## 10. Git & Version Control

*   **Gitignore must include:** `node_modules/`, `dist/`, `.astro/`, `.DS_Store`, `.env*`.
*   **Commit message format:** `<Type>: <Short description>` — e.g., `Feat: Add blog section`, `Fix: Remove invalid wrangler binding`, `Style: Update hero gradient`.
*   **Never commit:** `.env` files, `node_modules/`, or editor-specific files.

---

## 11. AI Assistant Directives (Antigravity)

When assisting with this project, Antigravity must strictly follow:

1.  **Respect the CDN Tailwind setup.** Never remove `<script is:inline src="https://cdn.tailwindcss.com">` or the embedded `tailwind.config` script block from `Layout.astro`. Always add new custom animations/tokens to the embedded config, not to `tailwind.config.mjs`.
2.  **Preserve the established design language.** All new UI must use the defined color palette, typography scale, and component patterns. Never introduce plain colors or default browser styles.
3.  **Astro-native first.** Suggest `.astro` component solutions before any client-side framework.
4.  **Maintain the wrangler.jsonc rules.** Never add `binding` to the static assets config.
5.  **No unsolicited refactoring.** Do not modify existing working code unless it is explicitly requested or blocks a critical fix.
6.  **Premium aesthetics always.** Any new section, page, or component must meet the "wow factor" standard — glassmorphism, gradient accents, smooth transitions, and the Outfit/Inter font pairing.
7.  **Check before installing packages.** This environment has network restrictions. Confirm network availability before proposing `npm install` commands.
