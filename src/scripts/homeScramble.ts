import { whenReady } from './whenReady';

// ── Home section-label scramble — PROTOTYPE (units.gr-inspired) ─────────────
// The IBM Plex Mono eyebrows (.bp-sec-label / .bp-sec-count) decode like a
// terminal readout as they scroll into view; the label text is restored
// verbatim at the end. ScrambleTextPlugin comes from its own CDN tag in
// HomePage.astro; without it (or GSAP) after 8 s the labels simply stay put.
export function initHomeScramble() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const w = window;
  const ready = () => w.gsap && w.ScrollTrigger && w.ScrambleTextPlugin;
  const run = () => {
    const { gsap, ScrollTrigger, ScrambleTextPlugin } = w;
    gsap.registerPlugin(ScrambleTextPlugin);
    document.querySelectorAll('.bp-sec-label, .bp-sec-count').forEach(el => {
      const text = el.textContent;
      ScrollTrigger.create({
        trigger: el,
        start: 'top 88%',
        once: true,
        onEnter: () => {
          gsap.to(el, { duration: 0.9, scrambleText: { text, chars: '01/—·+×', speed: 0.35 } });
        },
      });
    });
  };
  whenReady(ready, run, { timeoutMs: 8000 });
}
