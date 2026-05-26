import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } }); // iPhone 13-ish

test('Hero patches on mobile — tiles are roughly square', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => {
    const host = document.querySelector('[data-hero-patches]');
    return host && host.children.length > 0;
  }, { timeout: 10_000 });

  const dims = await page.evaluate(() => {
    const tile = document.querySelector<HTMLElement>('[data-hero-patches] > div');
    if (!tile) return null;
    const r = tile.getBoundingClientRect();
    return { w: r.width, h: r.height, ratio: r.width / r.height };
  });
  expect(dims).not.toBeNull();
  expect(dims!.ratio).toBeGreaterThan(0.85);
  expect(dims!.ratio).toBeLessThan(1.18);
});
