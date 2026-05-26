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

  // SplitText splits into lines; wait through 0.25s delay + ~0.18s * N lines + 1.4s duration
  await page.waitForTimeout(3500);

  const state = await page.evaluate(() => {
    const el = document.querySelector<HTMLElement>('.hero-subtitle');
    if (!el) return null;
    // SplitText with mask: 'lines' produces: <span overflow:clip>  <span display:block>line text</span>  </span>
    // The animated unit is the inner display:block span (has will-change/transform residue).
    const lines = Array.from(el.querySelectorAll<HTMLElement>('span[style*="display: block"]'));
    return {
      text: el.textContent?.trim(),
      lineCount: lines.length,
      sample: lines.map(l => ({
        text: l.textContent?.slice(0, 40),
        opacity: getComputedStyle(l).opacity,
        transform: l.style.transform || getComputedStyle(l).transform,
        height: l.offsetHeight,
      })),
    };
  });
  console.log('ML6 final state:', JSON.stringify(state, null, 2));

  expect(consoleErrors.filter(e => !/favicon|adsense|adsbygoogle|ERR_CONNECTION_REFUSED|Failed to load resource/i.test(e))).toEqual([]);

  expect(state?.lineCount).toBeGreaterThan(0);
  for (const line of state?.sample ?? []) {
    expect(parseFloat(line.opacity)).toBeGreaterThan(0.9);
    expect(line.height).toBeGreaterThan(10);
    const m = line.transform.match(/matrix\([^)]+\)/);
    if (m) {
      const parts = m[0].replace(/matrix\(|\)/g, '').split(',').map(s => parseFloat(s));
      expect(Math.abs(parts[5] || 0)).toBeLessThan(2);
      expect(Math.abs(parts[4] || 0)).toBeLessThan(2);
    }
  }
});
