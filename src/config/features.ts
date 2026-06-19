// Feature flags for the blog frontend.
//
// COOKIE_BANNER_ENABLED gates the cookie-consent banner. The AdSense
// integration has been removed entirely; this banner is kept as dormant,
// reusable consent infrastructure. While false:
//   - the banner and its footer "Cookie Settings" triggers are not rendered,
//     so the consent script (Layout.astro) stays inert (it keys off the
//     banner element existing).
// Flip to true to show the banner again — this single line is the only
// change needed to bring the consent flow back.
export const COOKIE_BANNER_ENABLED = false;
