// Shared tools catalog — a hardcoded MIRROR of the cross-engine catalog in
// luci-tools/tools-home/src/consts.ts (ENGINES). The blog builds standalone on
// Cloudflare Pages and can't import across repos, so this is a deliberate
// one-line-per-tool mirror (same pattern as games.ts / videos.ts) — when a tool
// or engine ships or is renamed over there, update it here. Rendered by the
// homepage ANNEX C — TOOLS INDEX section. Per-engine accent colors and icons
// are deliberately NOT mirrored: the homepage keeps its single page accent.
export const TOOLS_URL = "https://tools.luci-studio.com";

export interface ToolEntry {
  /** kebab-case slug — tool URL is `${TOOLS_URL}/${engine.prefix}/${slug}/` */
  slug: string;
  title: string;
  /** short monospace chip glyph shown before the title, e.g. `H→J`, `MD5` */
  chip?: string;
  /** styled Unicode specimen shown instead of a chip (fancy-text) */
  specimen?: string;
}

export interface ToolEngine {
  /** URL prefix — the engine hub is `${TOOLS_URL}/${prefix}/` */
  prefix: string;
  name: string;
  tools: ToolEntry[];
}

export const TOOL_ENGINES: ToolEngine[] = [
  {
    prefix: "image",
    name: "Image",
    tools: [
      { slug: "heic-to-jpg", title: "HEIC to JPG", chip: "H→J" },
      { slug: "png-to-jpg", title: "PNG to JPG", chip: "P→J" },
      { slug: "webp-to-jpg", title: "WebP to JPG", chip: "W→J" },
      { slug: "jpg-to-png", title: "JPG to PNG", chip: "J→P" },
      { slug: "png-to-webp", title: "PNG to WebP", chip: "P→W" },
      { slug: "jpg-to-webp", title: "JPG to WebP", chip: "J→W" },
      { slug: "heic-to-png", title: "HEIC to PNG", chip: "H→P" },
      { slug: "avif-to-jpg", title: "AVIF to JPG", chip: "A→J" },
      { slug: "svg-to-png", title: "SVG to PNG", chip: "S→P" },
    ],
  },
  {
    prefix: "fancy-text",
    name: "Fancy Text",
    tools: [
      { slug: "bold-text-generator", title: "Bold Text Generator", specimen: "𝗔𝗮" },
      { slug: "italic-text-generator", title: "Italic Text Generator", specimen: "𝘈𝘢" },
      { slug: "strikethrough-text-generator", title: "Strikethrough Text Generator", specimen: "A̶a̶" },
      { slug: "cursive-text-generator", title: "Cursive Text Generator", specimen: "𝓐𝓪" },
      { slug: "bubble-text-generator", title: "Bubble Text Generator", specimen: "Ⓐⓐ" },
      { slug: "wide-text-generator", title: "Wide Text Generator", specimen: "Ａａ" },
      { slug: "monospace-text-generator", title: "Monospace Text Generator", specimen: "𝙰𝚊" },
      { slug: "underline-text-generator", title: "Underline Text Generator", specimen: "A̲a̲" },
    ],
  },
  {
    prefix: "json",
    name: "JSON",
    tools: [
      { slug: "json-formatter", title: "JSON Formatter", chip: "{ }" },
      { slug: "json-minifier", title: "JSON Minifier", chip: "{-}" },
      { slug: "json-validator", title: "JSON Validator", chip: "{✓}" },
      { slug: "json-to-csv", title: "JSON to CSV", chip: "J→C" },
      { slug: "csv-to-json", title: "CSV to JSON", chip: "C→J" },
    ],
  },
  {
    prefix: "qr",
    name: "QR Code",
    tools: [
      { slug: "qr-code-generator", title: "QR Code Generator", chip: "▦" },
      { slug: "wifi-qr-code-generator", title: "WiFi QR Code", chip: "wifi" },
      { slug: "vcard-qr-code", title: "vCard QR Code", chip: "vC" },
      { slug: "email-qr-code", title: "Email QR Code", chip: "@" },
      { slug: "url-qr-code", title: "URL QR Code", chip: "url" },
      { slug: "qr-code-with-logo", title: "QR Code with Logo", chip: "▦+" },
    ],
  },
  {
    prefix: "pdf",
    name: "PDF",
    tools: [
      { slug: "merge-pdf", title: "Merge PDF", chip: "⊕" },
      { slug: "jpg-to-pdf", title: "JPG to PDF", chip: "J▤" },
      { slug: "png-to-pdf", title: "PNG to PDF", chip: "P▤" },
      { slug: "rotate-pdf", title: "Rotate PDF", chip: "↻" },
      { slug: "split-pdf", title: "Split PDF", chip: "⑂" },
    ],
  },
  {
    prefix: "unit",
    name: "Unit Converter",
    tools: [
      { slug: "cm-to-inches", title: "CM to Inches", chip: "cm→in" },
      { slug: "inches-to-cm", title: "Inches to CM", chip: "in→cm" },
      { slug: "mm-to-inches", title: "MM to Inches", chip: "mm→in" },
      { slug: "meters-to-feet", title: "Meters to Feet", chip: "m→ft" },
      { slug: "feet-to-meters", title: "Feet to Meters", chip: "ft→m" },
      { slug: "km-to-miles", title: "KM to Miles", chip: "km→mi" },
      { slug: "miles-to-km", title: "Miles to KM", chip: "mi→km" },
      { slug: "kg-to-lbs", title: "KG to Lbs", chip: "kg→lb" },
      { slug: "lbs-to-kg", title: "Lbs to KG", chip: "lb→kg" },
      { slug: "celsius-to-fahrenheit", title: "Celsius to Fahrenheit", chip: "°C→F" },
      { slug: "fahrenheit-to-celsius", title: "Fahrenheit to Celsius", chip: "°F→C" },
    ],
  },
  {
    prefix: "hash",
    name: "Hash Generator",
    tools: [
      { slug: "md5-hash-generator", title: "MD5 Hash", chip: "MD5" },
      { slug: "sha256-hash-generator", title: "SHA-256 Hash", chip: "256" },
      { slug: "sha1-hash-generator", title: "SHA-1 Hash", chip: "SHA1" },
      { slug: "sha512-hash-generator", title: "SHA-512 Hash", chip: "512" },
    ],
  },
  {
    prefix: "time",
    name: "Timestamp",
    tools: [
      { slug: "unix-timestamp-converter", title: "Unix Timestamp Converter", chip: "TS" },
      { slug: "epoch-to-date", title: "Epoch to Date", chip: "E→D" },
      { slug: "date-to-unix-timestamp", title: "Date to Unix Timestamp", chip: "D→T" },
    ],
  },
  {
    prefix: "encode",
    name: "Encode / Decode",
    tools: [
      { slug: "base64-encode", title: "Base64 Encode", chip: "64↑" },
      { slug: "base64-decode", title: "Base64 Decode", chip: "64↓" },
      { slug: "url-encode", title: "URL Encode", chip: "%↑" },
      { slug: "url-decode", title: "URL Decode", chip: "%↓" },
      { slug: "html-entity-encoder", title: "HTML Entity Encoder", chip: "&#;" },
      { slug: "jwt-decoder", title: "JWT Decoder", chip: "JWT" },
    ],
  },
  {
    prefix: "color",
    name: "Color Tools",
    tools: [
      { slug: "hex-to-rgb", title: "HEX to RGB", chip: "hex" },
      { slug: "rgb-to-hex", title: "RGB to HEX", chip: "rgb" },
      { slug: "hex-to-hsl", title: "HEX to HSL", chip: "hsl" },
      { slug: "color-contrast-checker", title: "Contrast Checker", chip: "◐" },
    ],
  },
  {
    prefix: "password",
    name: "Password Tools",
    tools: [
      { slug: "password-generator", title: "Password Generator", chip: "•••" },
      { slug: "strong-password-generator", title: "Strong Password Generator", chip: "••✦" },
      { slug: "passphrase-generator", title: "Passphrase Generator", chip: "abc" },
    ],
  },
];
