/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,vue,svelte,md,mdx}'],
  theme: {
    extend: {
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
  safelist: [
    // Dynamic accent-color classes driven by skills API data (accent_color token from DB).
    // Without these, Tailwind's purge scan misses template-literal class strings.
    { pattern: /hover:border-(violet|blue|cyan|pink|amber)-500\/(20|40)/ },
    { pattern: /bg-(violet|blue|cyan|pink|amber)-500\/(10|15|20)/ },
    { pattern: /hover:bg-(violet|blue|cyan|pink|amber)-500\/10/ },
    { pattern: /group-hover:bg-(violet|blue|cyan|pink|amber)-500\/(10|20)/ },
  ],
  plugins: [],
};
