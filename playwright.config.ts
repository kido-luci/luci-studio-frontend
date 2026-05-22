import { defineConfig, devices } from '@playwright/test';

// SLOW_MO=500 npm run test:e2e -- --headed --workers=1
// pauses 500ms between every browser action so you can actually watch.
// Defaults to 0 (full speed) — kept off in CI.
const slowMo = Number(process.env.SLOW_MO) || 0;

// Local E2E smoke config. Spawns `npm run dev` automatically and runs
// chromium-only to keep iteration fast. The dev server reads PUBLIC_API_URL
// from `.env`; tests that need deterministic backend behaviour should mock
// requests with `page.route(...)`.
export default defineConfig({
    testDir: './tests/e2e',
    timeout: 30_000,
    expect: { timeout: 5_000 },
    fullyParallel: true,
    retries: process.env.CI ? 2 : 0,
    reporter: process.env.CI ? 'github' : 'list',
    use: {
        baseURL: 'http://localhost:4321',
        trace: 'on-first-retry',
        launchOptions: { slowMo },
    },
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    ],
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:4321',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
    },
});
