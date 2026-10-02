import { whenReady } from './whenReady';

export function initHomeHeaderReveals() {
  // ML9 "Coffee Mornings" — chars rise from behind a per-char mask with a slight tilt,
  // settling with an expo decel. Triggered once per header on scroll into view.
  (function () {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const w = window as any;
    const ready = () => w.gsap && w.ScrollTrigger && w.SplitText;
    const run = () => {
      const { gsap, ScrollTrigger, SplitText } = w;
      gsap.registerPlugin(ScrollTrigger, SplitText);

      document.querySelectorAll<HTMLElement>('[data-ml9]').forEach(h2 => {
        // Mask wrappers need overflow visible? No — overflow:clip on the mask box is what
        // gives the reveal. inline-block on chars so transforms apply.
        const split = SplitText.create(h2, { type: 'words,chars', mask: 'chars', aria: 'auto' });
        gsap.set(split.chars, { display: 'inline-block', transformOrigin: '50% 100%', willChange: 'transform' });
        gsap.from(split.chars, {
          yPercent: 120,
          rotate: 10,
          skewX: -6,
          duration: 1.1,
          ease: 'expo.out',
          stagger: { each: 0.04, from: 'start' },
          scrollTrigger: { trigger: h2, start: 'top 85%', once: true }
        });
      });
    };
    whenReady(ready, run);
  })();
}
