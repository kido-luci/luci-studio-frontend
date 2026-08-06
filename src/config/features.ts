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
// Nothing on the site currently needs consent: the AdSense integration is gone
// (see the commit that removed AdSlot and services/ads.ts) and the only browser
// storage is the required kind the banner copy already describes — theme, likes,
// bookmarks, and the comment session. Anything optional added later should turn
// this on in the same change.
export const COOKIE_BANNER_ENABLED = false;
