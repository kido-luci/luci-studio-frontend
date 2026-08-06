// Feature flags for the blog frontend.
//
// COOKIE_BANNER_ENABLED gates the cookie-consent banner, which is currently
// dormant. While false:
//   - the banner and its footer "Cookie Settings" triggers are not rendered,
//     so the consent script (Layout.astro) stays inert (it keys off the
//     banner element existing).
// Flip to true to show the banner again — this single line is the only
// change needed to bring the consent flow back.
//
// NOTE: this flag is independent of AdSense, which IS still wired up — AdSlot
// renders units on the home / blog-list / post / videos pages and Layout emits
// the loader, both gated at build time on the admin-managed GET /ads/config
// (`enabled` is false until switched on in /admin/ads). Turning ads on there
// without also flipping this flag would serve ads with no consent prompt.
export const COOKIE_BANNER_ENABLED = false;
