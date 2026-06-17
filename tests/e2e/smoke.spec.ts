import { test, expect, type Page } from '@playwright/test';

// Smoke tests — verify the static shell of each top-level page renders
// even when the backend is unreachable. The page services catch fetch
// failures and return [] / null, so the layout itself should always paint.

test.describe('Page smoke tests', () => {
    test('homepage renders title, hero, and key sections', async ({ page }) => {
        await page.goto('/');

        await expect(page).toHaveTitle(/Luci Studio/);
        await expect(page.locator('h1.hero-headline')).toBeVisible();
        await expect(page.locator('.hero-subtitle')).toBeVisible();
        // Stat pills are static markup — a good signal that the hero rendered.
        await expect(page.getByText('5+ yrs Flutter')).toBeVisible();
    });

    test('/blog renders the THOUGHTS heading', async ({ page }) => {
        await page.goto('/blog');
        await expect(page).toHaveTitle(/Blog/);
        await expect(page.getByRole('heading', { name: /THOUGHTS/i })).toBeVisible();
    });
});

test.describe('Resilience', () => {
    // Hard-fail the test the moment a 5xx page is shown by the dev server.
    test('homepage paints even when all backend endpoints are unreachable', async ({ page }) => {
        await page.route('**/posts**', route => route.abort('connectionrefused'));
        await page.route('**/gallery**', route => route.abort('connectionrefused'));

        const response = await page.goto('/');
        expect(response?.status()).toBeLessThan(500);
        await expect(page.locator('h1.hero-headline')).toBeVisible();
    });

    test('client-side post stats request hits /posts/stats', async ({ page }) => {
        // Capture the request rather than mocking — we just want to confirm
        // the stats hydration fires after page load.
        const statsPromise = page.waitForRequest(req =>
            /\/posts\/stats(\?|$)/.test(req.url()) && req.method() === 'GET',
            { timeout: 10_000 },
        ).catch(() => null);

        await page.goto('/');
        const req = await statsPromise;
        expect(req, 'expected GET /posts/stats from refreshPostStats()').not.toBeNull();
    });
});

// ---------------------------------------------------------------------------
// Full-page error sweep
//
// For every top-level page (and one random blog detail page), open it, scroll
// to the very bottom, and assert no uncaught JS exceptions or app-level
// console.error fires along the way. Third-party CDN scripts (Vanta, p5,
// Three, Anime, Prism, AdSense) live on different domains and are filtered
// out — they aren't ours to fix, and flakiness there shouldn't fail CI.
// ---------------------------------------------------------------------------

const THIRD_PARTY_NOISE = [
    /googletagmanager|googlesyndication|adsbygoogle|googleads|google_ad|doubleclick|cookieyes/i,
    /vanta|three\.min|p5\.min|anime\.min|prism|cdn\.jsdelivr|unpkg/i,
    /ERR_BLOCKED_BY_CLIENT/,
    /Failed to load resource:.*\.(?:png|jpg|jpeg|webp|gif|svg|ico)\b/i, // missing image asset — not fatal
];

function isNoise(text: string): boolean {
    return THIRD_PARTY_NOISE.some(rx => rx.test(text));
}

function watchPageErrors(page: Page): { errors: string[] } {
    const errors: string[] = [];
    page.on('pageerror', err => {
        errors.push(`[pageerror] ${err.message}`);
    });
    page.on('console', msg => {
        if (msg.type() !== 'error') return;
        const text = msg.text();
        if (isNoise(text)) return;
        errors.push(`[console.error] ${text}`);
    });
    return { errors };
}

// Scroll until window.scrollY stops increasing for 3 consecutive frames,
// which handles both lazy-loaded growth and pages shorter than the viewport.
async function scrollToBottom(page: Page) {
    await page.evaluate(async () => {
        await new Promise<void>(resolve => {
            const step = 250;
            let stable = 0;
            const tick = () => {
                const before = window.scrollY;
                window.scrollBy(0, step);
                if (window.scrollY === before) {
                    if (++stable >= 3) return resolve();
                } else {
                    stable = 0;
                }
                requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        });
    });
    // Settle: let any IntersectionObserver-driven animations + lazy
    // images finish their work after the final scroll position is reached.
    await page.waitForTimeout(600);
}

const SWEEP_PAGES = ['/', '/blog', '/portfolio', '/privacy', '/terms'];

test.describe('Full-page error sweep', () => {
    for (const path of SWEEP_PAGES) {
        test(`${path} loads and scrolls to bottom with no errors`, async ({ page }) => {
            const watcher = watchPageErrors(page);
            const response = await page.goto(path, { waitUntil: 'load' });

            expect(response, `no response for ${path}`).not.toBeNull();
            expect(response!.status(), `${path} responded ${response!.status()}`).toBeLessThan(400);

            await scrollToBottom(page);

            expect(
                watcher.errors,
                `errors during ${path}:\n${watcher.errors.join('\n')}`,
            ).toEqual([]);
        });
    }

    test('a random /blog/[slug] detail page loads, scrolls, and has no errors', async ({ page }) => {
        // Step 1: collect candidate post URLs from the blog index. Errors
        // captured during this navigation are reset before the real assertion
        // so unrelated /blog noise can't taint the detail-page verdict.
        const indexWatcher = watchPageErrors(page);
        await page.goto('/blog', { waitUntil: 'load' });

        const hrefs = await page.locator('a[href^="/blog/"]').evaluateAll(els =>
            els
                .map(a => (a as HTMLAnchorElement).getAttribute('href') || '')
                .filter(h => h && h !== '/blog' && h !== '/blog/')
        );

        test.skip(hrefs.length === 0, 'No blog posts available — start the backend');

        const target = hrefs[Math.floor(Math.random() * hrefs.length)];
        console.log(`[random blog detail] visiting ${target}`);

        // Reset error log: we only care about errors on the detail page itself.
        indexWatcher.errors.length = 0;

        const response = await page.goto(target, { waitUntil: 'load' });
        expect(response!.status(), `${target} responded ${response!.status()}`).toBeLessThan(400);

        // The detail page must render an article title — confirms we landed
        // on a real post and not a redirected 404.
        await expect(page.locator('h1').first()).toBeVisible();

        await scrollToBottom(page);

        expect(
            indexWatcher.errors,
            `errors visiting ${target}:\n${indexWatcher.errors.join('\n')}`,
        ).toEqual([]);
    });
});
