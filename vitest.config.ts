import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        // Vitest's default include picks up `tests/**/*.test.ts`. We use that
        // directory for Playwright `*.spec.ts` files, which must not be loaded
        // here — they call test.describe() in the Playwright runtime.
        exclude: ['node_modules', 'dist', '.astro', 'tests/e2e/**'],
    },
});
