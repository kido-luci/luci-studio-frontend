import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: 'https://luci-studio.com',
  trailingSlash: 'always',
  output: 'static',
  adapter: cloudflare(),
  integrations: []
});
