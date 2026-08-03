import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        // `.claude/` holds local agent worktrees — full copies of the repo whose
        // test files would otherwise be collected and run alongside the real ones.
        exclude: ['node_modules', 'dist', '.astro', '.claude/**'],
    },
});
