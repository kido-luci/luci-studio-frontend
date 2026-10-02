// ── Lenis smooth scroll — PROTOTYPE (units.gr-inspired) ─────────────────────
// Lenis animates the NATIVE window scroll (wheel intercepted, scrollTop tweened
// per frame), so everything listening to real scroll events — navDimmer,
// ScrollTrigger, the progress rule — keeps working unchanged. Touch input is
// left native by default (syncTouch:false), so mobile scrolling is untouched.
// Gated on reduced-motion; window.Lenis arrives via the deferred CDN tag in
// Layout.astro, so poll for it like the GSAP inits do (giving up after 6 s).
import { whenReady } from '../whenReady';

export function initSmoothScroll() {
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
	const boot = () => {
		const Lenis = (window as any).Lenis;
		const lenis = new Lenis({ autoRaf: true });
		(window as any).__lenis = lenis; // dev/verify handle
		// Nudge ScrollTrigger on lenis scroll (recommended pairing; cheap even
		// though native scroll events already reach it).
		const ST = () => (window as any).ScrollTrigger;
		whenReady(ST, () => lenis.on('scroll', ST().update), { timeoutMs: 6000 });
	};
	whenReady(() => (window as any).Lenis, boot, { timeoutMs: 6000 });
}
