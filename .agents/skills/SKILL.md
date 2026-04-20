# Antigravity Rules & Skills: Astro + Tailwind CSS Architecture

This document defines the strict coding standards, architectural patterns, and development guidelines for this web application. Adherence to these rules is mandatory for maintaining a scalable, performant, and maintainable codebase.

## 1. Core Architecture & Tech Stack

*   **Framework:** Astro (Static Site Generation by default, opt-in Server-Side Rendering only when dynamic data is strictly required).
*   **Styling:** Tailwind CSS (Utility-first). Custom CSS is strictly prohibited unless overriding third-party libraries.
*   **Components:** Astro Components (`.astro`) are the primary building blocks. UI Frameworks (React, Svelte, Vue) are restricted to interactive "islands" only.
*   **Language:** TypeScript strictly enforced for all logic (`<script lang="ts">` and `.ts` files).

## 2. Directory Structure Conventions

Enforce a strict separation of concerns within the `src/` directory:
*   `src/pages/`: File-based routing only. Keep logic minimal; delegate to components.
*   `src/layouts/`: Base HTML wrappers (e.g., `Layout.astro`).
*   `src/components/`: Reusable UI elements.
    *   `src/components/ui/`: Dumb, presentation-only components (buttons, cards).
    *   `src/components/blocks/`: Complex, composite components (navbars, footers, hero sections).
*   `src/lib/`: Utility functions, formatters, and shared TypeScript logic.
*   `src/assets/`: Images and static files requiring Astro's build-time optimization.
*   `public/`: Static files served as-is (fonts, favicons, `robots.txt`).

## 3. Astro Component Mastery

*   **Component Structure:** Ensure single-responsibility. Components exceeding 200 lines should be evaluated for splitting.
*   **Data Fetching:** Fetch data exclusively in the frontmatter (`---`). This ensures zero-JS delivery to the client. Handle loading and error states server-side.
*   **Strict Props Typing:** Every component MUST define an `interface Props` to enforce type safety.
    ```astro
    ---
    interface Props {
      title: string;
      description?: string;
      variant?: 'primary' | 'secondary';
    }
    const { title, description, variant = 'primary' } = Astro.props;
    ---
    ```
*   **Image Optimization:** Never use standard `<img>` tags for local images. Always use Astro's native `<Image />` or `<Picture />` components for automatic WebP conversion and lazy loading.

## 4. Tailwind CSS Excellence

*   **Utility-First Purity:** Write styles inline. Do not use `@apply` to extract classes into CSS files; doing so breaks the utility-first paradigm and inflates CSS bundles.
*   **Class Organization:** Group classes logically for readability (e.g., Layout -> Spacing -> Typography -> Visuals -> Interactivity).
    *   *Example:* `flex items-center justify-between p-4 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 transition-colors`
*   **Design Tokens:** Use `tailwind.config.mjs` for all brand colors, fonts, and spacing. Reject arbitrary values (`w-[324px]`) in favor of extending the theme.
*   **Dynamic Classes:** If dynamically combining Tailwind classes via JS/TS, utilize libraries like `clsx` and `tailwind-merge` to resolve conflicts safely.

## 5. Performance & Islands Architecture

*   **Zero JS by Default:** Deliver static HTML. JavaScript should be the exception, not the rule.
*   **Hydration Directives:** When client-side interactivity is unavoidable, use the most restrictive hydration directive:
    *   `client:load`: High-priority UI only (e.g., critical navigation).
    *   `client:idle`: Background tasks or below-the-fold interactive elements.
    *   `client:visible`: Heavy interactive elements (e.g., carousels, charts) that are not immediately in the viewport.
*   **State Management:** For sharing state between isolated Astro islands, strictly use `@nanostores/preact` (or relevant framework adapter). Avoid heavy state libraries like Redux.

## 6. SEO, Accessibility (A11y), and UX

*   **Semantic HTML5:** Use `<header>`, `<main>`, `<article>`, `<section>`, `<aside>`, and `<footer>` correctly. Avoid generic `<div>` soup.
*   **Meta Tags:** Every page must implement dynamic `<title>` and `<meta name="description">` tags passed through layouts.
*   **A11y:** Ensure high color contrast, visible focus states (`focus-visible:ring`), and screen-reader accessibility (`aria-labels`, `sr-only` utility class).

## 7. AI Assistant Directives (Antigravity Rules)

When acting as an AI assistant within this workspace, you MUST:
1.  **Astro First:** Default to `.astro` implementations. Only suggest React/Vue if the user explicitly requests client-side reactivity.
2.  **Tailwind Exclusivity:** Output styles exclusively using Tailwind utility classes.
3.  **Premium Aesthetics:** Proactively implement modern design patterns (glassmorphism, soft shadows, vibrant gradients, micro-interactions) to ensure a high-quality UI without requiring explicit prompting.
4.  **Immutability:** Do not refactor code outside the immediate scope of the user's request unless it fixes a critical bug or security flaw.
