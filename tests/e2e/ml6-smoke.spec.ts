import { test, expect } from '@playwright/test';

test('ML6 GSAP migration — hero subtitle letters slide up to final position', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', e => consoleErrors.push(String(e)));

  await page.goto('/');

  await page.waitForFunction(() => {
    const w = window as any;
    return w.gsap && w.SplitText;
  }, { timeout: 10_000 });

  const subtitle = page.locator('.hero-subtitle');
  await expect(subtitle).toBeVisible();

  // SplitText splits into words+chars; wait through 0.3s delay + ~12ms * N chars + 0.75s duration
  await page.waitForTimeout(2500);

  const state = await page.evaluate(() => {
    const el = document.querySelector<HTMLElement>('.hero-subtitle');
    if (!el) return null;
    // SplitText char spans live nested inside word spans
    const chars = el.querySelectorAll<HTMLElement>('span span');
    return {
      text: el.textContent?.trim(),
      charCount: chars.length,
      sample: Array.from(chars).slice(0, 6).map(c => ({
        text: c.textContent,
        opacity: getComputedStyle(c).opacity,
        transform: c.style.transform || getComputedStyle(c).transform,
      })),
      lastTransform: chars.length ? (chars[chars.length - 1].style.transform || getComputedStyle(chars[chars.length - 1]).transform) : null,
    };
  });
  console.log('ML6 final state:', JSON.stringify(state, null, 2));

  expect(consoleErrors.filter(e => !/favicon|adsense|adsbygoogle|ERR_CONNECTION_REFUSED|Failed to load resource/i.test(e))).toEqual([]);

  expect(state?.charCount).toBeGreaterThan(5);
  // After animation, every sampled char should be fully visible (opacity 1) and not translated
  for (const c of state?.sample ?? []) {
    expect(parseFloat(c.opacity)).toBeGreaterThan(0.9);
    expect(c.transform).not.toMatch(/translate\(0px, 1\.2em\)|translateY\(1\.2em\)/);
    // matrix shouldn't show a significant Y offset (last 2 values are tx, ty)
    const m = c.transform.match(/matrix\([^)]+\)/);
    if (m) {
      const parts = m[0].replace(/matrix\(|\)/g, '').split(',').map(s => parseFloat(s));
      expect(Math.abs(parts[5] || 0)).toBeLessThan(2);
    }
  }
});
