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

      // Blog grid: the 6 cards rise as ONE diagonal gesture (top-left → bottom-
      // right) instead of 6 separate pops. Transform/opacity only — clip-path
      // would crop PostCard's hover shadow (it lives on the inner .tb-card).
      const buildBlogCurtain = (mobile: boolean) => {
        const grid = document.querySelector('#home-blog-grid');
        if (!grid) return;
        const cards = gsap.utils.toArray('#home-blog-grid > *');
        if (!cards.length) return;
        gsap.set(cards, { opacity: 0, y: mobile ? 40 : 60, scale: 0.96 });
        gsap.to(cards, {
          opacity: 1, y: 0, scale: 1,
          duration: mobile ? 0.6 : 0.8,
          ease: 'power3.out',
          // grid:'auto' infers rows/cols from layout, so the diagonal works at
          // 3-col / 2-col / 1-col without hardcoding a grid shape per breakpoint.
          stagger: { each: 0.08, grid: 'auto', from: 'start' },
          scrollTrigger: { trigger: grid, start: 'top 85%', once: true },
        });
      };

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

      const buildLabSeries = () => {
        // Lab palette: soft fade-up (no clip-mask wipe).
        const labItems = gsap.utils.toArray('.lab-palette > *');
        if (labItems.length) {
          gsap.set(labItems, { opacity: 0, y: 20 });
          ScrollTrigger.batch(labItems, {
            start: 'top 85%',
            once: true,
            onEnter: (batch: HTMLElement[]) => gsap.to(batch, {
              opacity: 1, y: 0,
              duration: 0.6, ease: 'power2.out',
              stagger: { each: 0.08, from: 'start' },
              overwrite: true, clearProps: 'transform',
            }),
          });
        }
        // Series: soft fade-up (no clip-mask wipe) — gentler than the lab cards.
        const seriesItems = gsap.utils.toArray('.series-strip > li');
        if (seriesItems.length) {
          gsap.set(seriesItems, { opacity: 0, y: 18 });
          ScrollTrigger.batch(seriesItems, {
            start: 'top 88%',
            once: true,
            onEnter: (batch: HTMLElement[]) => gsap.to(batch, {
              opacity: 1, y: 0,
              duration: 0.7, ease: 'power2.out',
              stagger: { each: 0.08, from: 'start' },
              overwrite: true, clearProps: 'transform',
            }),
          });
        }
        // Lab underline draws left→right as the header settles.
        const underline = document.querySelector('[data-lab-underline]');
        if (underline) {
          gsap.set(underline, { scaleX: 0, transformOrigin: 'left center' });
          gsap.to(underline, {
            scaleX: 1, duration: 0.7, ease: 'power3.out',
            scrollTrigger: { trigger: underline, start: 'top 90%', once: true },
          });
        }
      };

      // Art bg: the sticky full-bleed photo behind the masonry finally drifts —
      // a slow scrubbed parallax so the gallery slides OVER it (depth). Driven by
      // background-position, NOT a transform: #art-bg is a sticky child inside a
      // clip-path:inset(0) wrapper that would crop/fight a transform. cover means
      // the position shift never exposes a seam. The ONLY continuous trigger on
      // the page — desktop-only (this is the called-out mobile jank source) and
      // skipped under win-perf-mode.
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

      // Full desktop treatment — steps 2–6 register their tweens inside here.
      mm.add(FULL, () => {
        buildBlogCurtain(false);
        buildConnectors();
        buildLabSeries();
        buildArtParallax();
      });

      // Mobile: cheap once-reveals only, no scrub / parallax — steps 2,3,5.
      mm.add(MOBILE, () => {
        buildBlogCurtain(true);
        buildConnectors();
        buildLabSeries();
      });
    };

    whenReady(ready, run, {
      timeoutMs: 2500,
      // GSAP CDN never arrived — reveal everything rather than leave it hidden.
      onTimeout: () => root.classList.remove('home-anim'),
    });
  })();
}
