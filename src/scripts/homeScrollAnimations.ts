import { whenReady } from './whenReady';

export function initHomeScrollAnimations() {
  // ════════════════════════════════════════════════════════════════════════
  // HOME SCROLL ANIMATIONS — "Develop & Dive"
  // One gsap.matchMedia() gate wraps every new homepage scroll animation so the
  // reduced-motion / mobile / desktop paths live in one place. Every CSS hidden
  // initial-state is gated on html.home-anim; the load failsafe AND the reduce
  // branch both drop that class so content reveals when motion is unavailable or
  // unwanted. Waits for the CDN globals via the shared whenReady helper.
  // ════════════════════════════════════════════════════════════════════════
  (function () {
    const w = window as any;
    const root = document.documentElement;
    const ready = () => w.gsap && w.ScrollTrigger;

    const run = () => {
      const { gsap, ScrollTrigger } = w;
      gsap.registerPlugin(ScrollTrigger);

      const REDUCE = '(prefers-reduced-motion: reduce)';
      const FULL   = '(min-width: 769px) and (prefers-reduced-motion: no-preference)';
      const MOBILE = '(max-width: 768px) and (prefers-reduced-motion: no-preference)';

      const mm = gsap.matchMedia();

      // ── Section builders (called from the contexts below; tweens created here
      // are auto-reverted by matchMedia when their context stops matching) ──────

      // Section connectors: the 4 pink lines draw downward (scaleY 0→1 from the
      // top) as a handoff cue between sections. Once, not scrub — pure transform,
      // win-perf-mode safe, no extra continuously-updating triggers.
      const buildConnectors = () => {
        const lines = gsap.utils.toArray('[data-connector]');
        if (!lines.length) return;
        gsap.set(lines, { scaleY: 0, transformOrigin: 'top center' });
        (lines as HTMLElement[]).forEach((line) => {
          gsap.to(line, {
            scaleY: 1,
            duration: 0.5,
            ease: 'power2.out',
            scrollTrigger: { trigger: line, start: 'top 92%', once: true },
          });
        });
      };

      // Art bg: the sticky full-bleed photo behind the masonry finally drifts —
      // a slow scrubbed parallax so the gallery slides OVER it (depth). Driven by
      // background-position, NOT a transform: #art-bg is a sticky child inside a
      // clip-path:inset(0) wrapper that would crop/fight a transform. cover means
      // the position shift never exposes a seam. The only continuous trigger in
      // this module (homeRails.ts adds two more: the pinned, scrubbed games and
      // blog rails) — desktop-only (this is the called-out mobile jank source)
      // and skipped under win-perf-mode.
      const buildArtParallax = () => {
        if (document.body.classList.contains('win-perf-mode')) return;
        const bg = document.querySelector('#art-bg');
        if (!bg) return;
        gsap.fromTo(bg,
          { backgroundPosition: 'center 38%' },
          {
            backgroundPosition: 'center 62%', ease: 'none',
            scrollTrigger: { trigger: '#art', start: 'top bottom', end: 'bottom top', scrub: 1 },
          });
      };

      // Reduced motion: no tweens at all — strip the gate so every hidden initial
      // state collapses to its visible default.
      mm.add(REDUCE, () => { root.classList.remove('home-anim'); });

      // Full desktop treatment — the connectors and the art-bg parallax.
      mm.add(FULL, () => {
        buildConnectors();
        buildArtParallax();
      });

      // Mobile: cheap once-reveals only (the connectors), no scrub / parallax.
      mm.add(MOBILE, () => {
        buildConnectors();
      });
    };

    whenReady(ready, run, {
      timeoutMs: 2500,
      // GSAP CDN never arrived — reveal everything rather than leave it hidden.
      onTimeout: () => root.classList.remove('home-anim'),
    });
  })();
}
