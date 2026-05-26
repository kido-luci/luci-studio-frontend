import { test, expect } from '@playwright/test';

test('Hero patch reveal — tiles populate then clean up', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));

  await page.goto('/', { waitUntil: 'domcontentloaded' });

  // Wait for GSAP to load and the IIFE to populate tiles
  await page.waitForFunction(() => {
    const host = document.querySelector('[data-hero-patches]');
    return host && host.children.length > 50;
  }, { timeout: 10_000 });

  const initialCount = await page.locator('[data-hero-patches] > div').count();
  // cols/rows derived from host size + target cell px — exact count depends on viewport,
  // but should be at least 4*4 = 16 (the floor) and well under 1000.
  expect(initialCount).toBeGreaterThan(16);
  expect(initialCount).toBeLessThan(1000);

  // Reveal: total stagger 1.4s + tile duration 0.55s + small buffer
  await page.waitForTimeout(2400);

  // After onComplete, the host element is removed entirely
  const hostAfter = await page.locator('[data-hero-patches]').count();
  expect(hostAfter).toBe(0);

  expect(errors.filter(e => !/favicon|adsense|adsbygoogle|ERR_CONNECTION_REFUSED|Failed to load resource/i.test(e))).toEqual([]);
});
