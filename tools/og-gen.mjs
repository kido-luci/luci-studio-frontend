// Render one 1200x630 OG image per blog landing page from tools/og-batch.html.
//
//   node tools/og-gen.mjs            # regenerate every card
//   node tools/og-gen.mjs blog lab   # only the named keys
//
// Uses the system Google Chrome via Playwright (channel:'chrome') so it needs
// no chromium download. Screenshots the exact .card element (1200x630) at DPR 1.
// Outputs:  public/images/og/<key>.png   (and og-default.png at images root)

import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const templateUrl = 'file://' + path.join(here, 'og-batch.html');
const ogDir = path.resolve(here, '../public/images/og');
const imagesDir = path.resolve(here, '../public/images');

// keys must match the PAGES map in og-batch.html
const ALL_KEYS = [
  'home', 'blog', 'lab', 'games', 'videos',
  'portfolio', 'series', 'license', 'privacy', 'terms',
  'og-default',
];

// og-default lives at the images root (PostDetailPage's no-cover fallback path);
// everything else goes under images/og/.
const outPath = (key) =>
  key === 'og-default'
    ? path.join(imagesDir, 'og-default.png')
    : path.join(ogDir, `${key}.png`);

const requested = process.argv.slice(2);
const keys = requested.length ? requested : ALL_KEYS;
for (const k of keys) {
  if (!ALL_KEYS.includes(k)) {
    console.error(`✗ unknown key "${k}" — valid: ${ALL_KEYS.join(', ')}`);
    process.exit(1);
  }
}

await mkdir(ogDir, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 1,
});

for (const key of keys) {
  await page.goto(`${templateUrl}?key=${encodeURIComponent(key)}`, { waitUntil: 'load' });
  // wait for fonts + render (og-batch.html flips this once document.fonts.ready)
  await page.waitForSelector('html[data-og-ready="1"]', { timeout: 10000 });
  const dest = outPath(key);
  await page.locator('#card').screenshot({ path: dest });
  console.log(`✓ ${path.relative(path.resolve(here, '..'), dest)}`);
}

await browser.close();
console.log(`\nDone — ${keys.length} image(s).`);
