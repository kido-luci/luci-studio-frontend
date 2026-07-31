import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sentry from '@sentry/astro';
import { loadEnv } from 'vite';

// Build-time Sentry source-map upload credentials (non-public). Loaded via Vite so
// they work from both local `.env` and the Cloudflare Pages build environment.
const { SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT } = loadEnv(
  process.env.NODE_ENV ?? 'production',
  process.cwd(),
  'SENTRY_',
);

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
  // Astro 7 changed the default to 'jsx', which strips whitespace between
  // inline elements; keep the v6 lossless compression so rendered text spacing
  // is unchanged.
  compressHTML: true,
  adapter: cloudflare(),
  integrations: [
    // Errors-only client monitoring. Runtime init lives in sentry.client.config.js
    // (gated on PUBLIC_SENTRY_DSN). Here we only configure the bundler plugin:
    // trim tracing/replay code from the bundle, and upload source maps so prod
    // stack traces are readable. Source-map upload is skipped cleanly when
    // SENTRY_AUTH_TOKEN is unset, so local builds / no-Sentry deploys don't fail.
    sentry({
      bundleSizeOptimizations: {
        excludeTracing: true,
        excludeReplayWorker: true,
        excludeReplayShadowDom: true,
        excludeReplayIframe: true,
      },
      // Source-map upload (top-level org/project/authToken — the nested
      // sourceMapsUploadOptions form is deprecated in @sentry/astro v10).
      // Only enabled when the auth token is present, so local builds and
      // no-Sentry deploys skip it cleanly. Generated .map files are deleted
      // after upload so they are never served publicly.
      ...(SENTRY_AUTH_TOKEN
        ? {
            org: SENTRY_ORG,
            project: SENTRY_PROJECT,
            authToken: SENTRY_AUTH_TOKEN,
            sourcemaps: {
              filesToDeleteAfterUpload: ['./dist/**/*.map'],
            },
          }
        : {}),
    }),
  ],
});
