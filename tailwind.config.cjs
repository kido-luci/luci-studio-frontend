/** @type {import('tailwindcss').Config} */
// The brand accent IS the only purple in the app. Remap Tailwind's `violet` and
// `purple` scales onto the --accent-rgb var so every existing *-violet-*/*-purple-*
// utility follows the active color scheme with zero per-class edits (and no risk of
// breaking the custom CSS selectors that target those class names). `blue` is left
// untouched so violet→blue decorative gradients keep their blue stop.
const accentColor = 'rgb(var(--accent-rgb) / <alpha-value>)';
const accentScale = Object.fromEntries(
  [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((s) => [s, accentColor]),
);

module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,vue,svelte,md,mdx}'],
  theme: {
    extend: {
      colors: {
        accent: accentColor,
        violet: accentScale,
        purple: accentScale,
      },
      animation: {
        'gradient-xy': 'gradient-xy 15s ease infinite',
        'spin-slow': 'spin 12s linear infinite',
        'reverse-spin': 'reverse-spin 8s linear infinite',
        'marquee': 'marquee 30s linear infinite',
        'marquee2': 'marquee2 30s linear infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        'gradient-xy': {
          '0%, 100%': { 'background-size': '400% 400%', 'background-position': 'left center' },
          '50%': { 'background-size': '200% 200%', 'background-position': 'right center' },
        },
        'reverse-spin': { 'from': { transform: 'rotate(360deg)' }, 'to': { transform: 'rotate(0deg)' } },
        'marquee': { '0%': { transform: 'translateX(0%)' }, '100%': { transform: 'translateX(-50%)' } },
        'marquee2': { '0%': { transform: 'translateX(50%)' }, '100%': { transform: 'translateX(0%)' } },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
    },
  },
  plugins: [],
};
