import { test, expect } from '@playwright/test';

test('ML9 GSAP migration — section headers animate to scale 1', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', e => consoleErrors.push(String(e)));

  await page.goto('/');

  // Wait for GSAP, ScrollTrigger, SplitText globals to load
  await page.waitForFunction(() => {
    const w = window as any;
    return w.gsap && w.ScrollTrigger && w.SplitText;
  }, { timeout: 10_000 });

  const headers = page.locator('[data-ml9]');
  const count = await headers.count();
  expect(count).toBeGreaterThan(0);

  // Each header should have been split — verify it now contains span chars
  const firstHeader = headers.first();
  await firstHeader.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500); // let stagger finish (longest header ~ 12 letters * 45ms + 800ms duration)

  const charScales = await firstHeader.locator('div, span').evaluateAll(els =>
    els
      .filter(el => /scale/.test((el as HTMLElement).style.transform || ''))
      .slice(0, 5)
      .map(el => (el as HTMLElement).style.transform)
  );

  console.log('First header sample transforms:', charScales);

  // Most reliable check: the inline-block char spans should report scale very close to 1
  const allLetters = await page.evaluate(() => {
    const h = document.querySelector('[data-ml9]') as HTMLElement;
    if (!h) return null;
    const chars = h.querySelectorAll<HTMLElement>('[style*="display: inline-block"]');
    return Array.from(chars).slice(0, 5).map(c => ({
      text: c.textContent,
      transform: c.style.transform || getComputedStyle(c).transform,
    }));
  });
  console.log('Sample letters:', JSON.stringify(allLetters));

  // Test all headers end up visible (post-animation scale ~ 1)
  const finalScales = await page.evaluate(async () => {
    // Scroll to each ml9 header and wait
    const heads = Array.from(document.querySelectorAll<HTMLElement>('[data-ml9]'));
    const results: any[] = [];
    for (const h of heads) {
      h.scrollIntoView({ block: 'center' });
      await new Promise(r => setTimeout(r, 1300));
      const chars = h.querySelectorAll<HTMLElement>('[style*="display: inline-block"]');
      const lastChar = chars[chars.length - 1];
      results.push({
        text: h.textContent?.trim().slice(0, 30),
        chars: chars.length,
        lastTransform: lastChar ? (lastChar.style.transform || getComputedStyle(lastChar).transform) : null,
      });
    }
    return results;
  });
  console.log('Final state:', JSON.stringify(finalScales, null, 2));

  expect(consoleErrors.filter(e => !/favicon|adsense|adsbygoogle|ERR_CONNECTION_REFUSED|Failed to load resource/i.test(e))).toEqual([]);

  // All headers should have at least 1 char and the last char's transform should not still be scale(0)
  for (const h of finalScales) {
    expect(h.chars).toBeGreaterThan(0);
    expect(h.lastTransform).not.toMatch(/scale\(0\)/);
    // matrix() with scale ~1 produces e.g. matrix(1, 0, 0, 1, 0, 0) — not zero on diagonal
    expect(h.lastTransform).not.toMatch(/matrix\(0[\s,]/);
  }
});
