import * as Sentry from '@sentry/astro';

// Client-side error monitoring (errors-only). Auto-loaded by the @sentry/astro
// integration. Gated on PUBLIC_SENTRY_DSN: with no DSN the SDK is disabled, so
// local dev and no-Sentry deploys ship nothing.
const dsn = import.meta.env.PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: import.meta.env.PUBLIC_SENTRY_ENVIRONMENT ?? 'production',
  // Errors-only: no performance tracing, no session replay. We intentionally do
  // NOT override `integrations` — the SDK defaults capture errors; tracing and
  // replay are opt-in and simply left unconfigured. tracesSampleRate: 0 ensures
  // no transactions are sent even if something enables tracing.
  tracesSampleRate: 0,
});
