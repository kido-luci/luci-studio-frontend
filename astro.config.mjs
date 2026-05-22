import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: 'https://luci-studio.com',
  output: 'static',
  adapter: cloudflare(),
  integrations: []
});
