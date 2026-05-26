import { test, expect } from '@playwright/test';

test('GSAP reveals — [data-reveal] and [data-word-reveal] animate to visible', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));

  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await page.waitForFunction(() => (window as any).gsap && (window as any).ScrollTrigger, { timeout: 10_000 });

  // Give hero word-reveal time: 0.8s delay + 0.12s stagger * 6 words + 0.85s duration ≈ 2.4s
  await page.waitForTimeout(2800);

  // Scroll through the page so every [data-reveal] triggers its ScrollTrigger
  const revealCount = await page.locator('[data-reveal]').count();
  expect(revealCount).toBeGreaterThan(3);

  await page.evaluate(async () => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    for (const el of els) {
      el.scrollIntoView({ block: 'center' });
      await new Promise(r => setTimeout(r, 80));
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    await new Promise(r => setTimeout(r, 200));
  });

  // After scrolling everything into view, sample a few elements and assert they're visible
  const revealStates = await page.evaluate(() => {
    return Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]')).slice(0, 5).map(el => ({
      tag: el.tagName,
      opacity: parseFloat(getComputedStyle(el).opacity),
      transform: el.style.transform || getComputedStyle(el).transform,
    }));
  });
  console.log('data-reveal sample:', JSON.stringify(revealStates, null, 2));

  for (const s of revealStates) {
    expect(s.opacity).toBeGreaterThan(0.9);
  }

  // Hero word reveal: each .reveal-word > span should be at y:0 opacity:1
  const wordStates = await page.evaluate(() => {
    const host = document.querySelector('[data-word-reveal]');
    if (!host) return null;
    return Array.from(host.querySelectorAll<HTMLElement>('.reveal-word > span')).map(s => ({
      text: s.textContent?.trim().slice(0, 16),
      opacity: parseFloat(getComputedStyle(s).opacity),
      transform: s.style.transform || getComputedStyle(s).transform,
    }));
  });
  console.log('word-reveal sample:', JSON.stringify(wordStates, null, 2));

  expect(wordStates).not.toBeNull();
  for (const s of wordStates ?? []) {
    expect(s.opacity).toBeGreaterThan(0.9);
    // No leftover translateY(-60px) — animation completed
    expect(s.transform).not.toMatch(/translate\(0px, -60px\)|translateY\(-60px\)/);
  }

  expect(errors.filter(e => !/favicon|adsense|adsbygoogle|ERR_CONNECTION_REFUSED|Failed to load resource/i.test(e))).toEqual([]);
});
