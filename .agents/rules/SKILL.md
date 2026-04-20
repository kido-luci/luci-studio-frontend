# Antigravity Rules & Skills: Astro + Tailwind CSS Project

This document outlines the core coding standards, architectural patterns, and development guidelines for this Astro and Tailwind CSS web application.

## 1. Core Architecture & Tech Stack

*   **Framework:** Astro (Static Site Generation by default, opt-in SSR if needed).
*   **Styling:** Tailwind CSS (Utility-first CSS).
*   **Components:** Astro Components (`.astro`) are preferred. React/Svelte/Vue components should only be used when client-side interactivity is strictly required (islands architecture).
*   **Language:** TypeScript is highly recommended for script tags and components (`<script lang="ts">`).

## 2. Astro Component Best Practices

*   **Component Structure:**
    *   Keep components small, reusable, and focused on a single responsibility.
    *   Separate layout components (e.g., `Layout.astro`) from page components (`src/pages/*.astro`) and UI components (`src/components/*.astro`).
*   **Data Fetching:**
    *   Perform data fetching in the frontmatter (`---`) of Astro components. This runs at build time (or server side if SSR is enabled), shipping zero JavaScript to the client.
*   **Props Typing:**
    *   Always define an `interface Props` in the frontmatter to type-check component inputs.
    ```astro
    ---
    interface Props {
      title: string;
      description?: string;
    }
    const { title, description = 'Default description' } = Astro.props;
    ---
    ```

## 3. Tailwind CSS & Styling Guidelines

*   **Utility-First:** Use Tailwind utility classes directly in the markup. Avoid writing custom CSS in `<style>` tags unless absolutely necessary (e.g., complex animations or third-party overrides).
*   **Class Organization:** Order classes logically (e.g., layout, spacing, typography, colors, effects).
*   **Design Tokens:** Utilize Tailwind's configuration (`tailwind.config.mjs`) to define custom colors, fonts, and spacing that align with the brand. Avoid arbitrary values (e.g., `text-[#123456]`) if the color is used more than once.
*   **Responsive Design:** Always design mobile-first. Use `sm:`, `md:`, `lg:`, `xl:` prefixes to handle larger viewports.
*   **Reusability:** If a combination of Tailwind classes is reused heavily across multiple files, abstract it into an Astro component rather than using `@apply` in CSS, to maintain the utility-first paradigm.

## 4. Performance & Islands Architecture

*   **Zero JS by Default:** Astro ships zero JavaScript to the client by default. Maintain this wherever possible.
*   **Hydration Directives:** When using UI framework components (React, Vue, etc.) that require JavaScript, explicitly use Astro hydration directives:
    *   `client:load`: High priority UI (e.g., mobile menu toggle).
    *   `client:idle`: Medium priority, load when the main thread is free.
    *   `client:visible`: Low priority, load only when the component enters the viewport.
    *   `client:only="react"`: Use only for components that rely entirely on client-side APIs (like `window`).

## 5. SEO & Accessibility (A11y)

*   **Semantic HTML:** Use proper HTML5 semantic tags (`<header>`, `<main>`, `<article>`, `<nav>`, `<footer>`).
*   **Meta Tags:** Ensure every page has a unique `<title>` and `<meta name="description">`.
*   **Alt Text:** Always provide meaningful `alt` attributes for `<img>` tags.
*   **Contrast & Focus:** Ensure text contrast meets WCAG standards and interactive elements have visible focus states (`focus:ring`, `focus:outline`).

## 6. Development Workflow

*   **Routing:** Utilize Astro's file-based routing mechanism inside `src/pages/`.
*   **Static Assets:** Place images, fonts, and other static assets in the `public/` directory if they do not need processing, or in `src/assets/` if they should be optimized by Astro's image processing.
*   **Formatting:** Use Prettier with the `prettier-plugin-astro` and `prettier-plugin-tailwindcss` to ensure consistent code formatting and automatic class sorting.

## 7. AI Assistant Directives (Antigravity)

When assisting with this project, Antigravity must:
1.  **Prioritize Astro Native:** Always suggest an Astro (`.astro`) solution before introducing a client-side framework like React.
2.  **Tailwind Strictness:** Write styles exclusively using Tailwind CSS utility classes.
3.  **Modern Aesthetics:** Produce code that implements modern web design principles (glassmorphism, subtle gradients, dark mode support, and micro-animations) without being explicitly told.
4.  **No Arbitrary Refactoring:** Do not modify existing working code unless requested or if fixing a critical bug.
