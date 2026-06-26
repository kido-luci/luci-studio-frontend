// Vietnamese UI-string catalog. Mirrors en.ts key-for-key. Short UI labels are
// drafted here; tone can be refined later. A missing key falls back to the English
// value (see useTranslations), so the site never renders blank.
export const vi: Record<string, string> = {
  // nav
  'nav.home': 'Trang chủ',
  'nav.blog': 'Blog',
  'nav.series': 'Series',
  'nav.lab': 'Lab',
  'nav.cta': 'Liên hệ',
  'nav.toggleTheme': 'Đổi giao diện',

  // footer
  'footer.portfolio': 'Portfolio',
  'footer.terms': 'Điều khoản',
  'footer.privacy': 'Bảo mật',
  'footer.cookie': 'Cài đặt Cookie',

  // read-time unit
  'readtime.unit': 'phút',

  // markdown callout labels
  'callout.note': 'ℹ Ghi chú',
  'callout.tip': '💡 Mẹo',
  'callout.important': '⚡ Quan trọng',
  'callout.warning': '⚠️ Cảnh báo',
  'callout.caution': '🚫 Thận trọng',
  'callout.affiliate': '🔗 Tiết lộ liên kết tài trợ',
};
