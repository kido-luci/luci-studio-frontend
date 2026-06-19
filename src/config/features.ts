// Feature flags for the blog frontend.
//
// ADS_ENABLED gates the Google AdSense integration and the cookie-consent
// banner that exists solely to gate it. While false:
//   - the cookie-consent banner and its footer "Cookie Settings" triggers
//     are not rendered, so the consent/AdSense script (Layout.astro) stays
//     inert (it keys off the banner element existing), and
//   - no AdSense script is ever loaded.
// Flip to true to restore the previous behavior — this single line is the
// only change needed to bring ads (and the consent flow) back.
export const ADS_ENABLED = false;
