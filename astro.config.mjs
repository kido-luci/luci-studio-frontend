import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// Surface async errors that escape try/catch during `npm run dev` /
// `npm run build`. Without these, a rejected promise inside a fire-and-forget
// call (or a thrown error in a non-awaited handler) vanishes silently.
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
});

// https://astro.build/config
export default defineConfig({
  site: 'https://luci-studio.com',
  output: 'static',
  adapter: cloudflare(),
  integrations: []
});
