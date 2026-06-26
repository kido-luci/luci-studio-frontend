// English UI-string catalog. Keys are flat and dotted, grouped by surface. Every
// value is the verbatim string the templates rendered before i18n wiring, so the
// English site stays byte-identical. New surface keys are appended as each page/
// component is wired — keep en.ts and vi.ts key-for-key in sync.
export const en: Record<string, string> = {
  // nav (TopNav.astro)
  'nav.home': 'Home',
  'nav.blog': 'Blog',
  'nav.series': 'Series',
  'nav.lab': 'Lab',
  'nav.cta': "Let's Talk",
  'nav.toggleTheme': 'Toggle theme',

  // footer (FooterLinks.astro)
  'footer.portfolio': 'Portfolio',
  'footer.terms': 'Terms',
  'footer.privacy': 'Privacy',
  'footer.cookie': 'Cookie Settings',

  // read-time unit (blog.ts)
  'readtime.unit': 'min',

  // markdown callout labels (blog.ts)
  'callout.note': 'ℹ Note',
  'callout.tip': '💡 Tip',
  'callout.important': '⚡ Important',
  'callout.warning': '⚠️ Warning',
  'callout.caution': '🚫 Caution',
  'callout.affiliate': '🔗 Affiliate disclosure',
};
