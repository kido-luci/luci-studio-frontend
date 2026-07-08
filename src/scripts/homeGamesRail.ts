// ── Home horizontal rails (pin + scrub) ─────────────────────────────────────
// Desktop enhancement shared by the games register (#games-rail) and the blog
// writing rail (#blog): pins the section and scrubs its card track sideways as
// the page scrolls (GSAP ScrollTrigger via the same CDN globals the other home
// animations poll for). Below 901px, under reduced motion, or with no CDN the
// section keeps its default CSS overflow-x swipe strip — this module only ever
// *adds* behaviour.
interface RailOpts {
	sectionId: string;
	trackSel: string;
	viewportSel: string;
	scrollRatio?: number;
}

function initRail(opts: RailOpts) {
	const section = document.getElementById(opts.sectionId);
	if (!section) return;

	let tries = 0;
	const boot = () => {
		const gsap = (window as any).gsap;
		const ScrollTrigger = (window as any).ScrollTrigger;
		if (!gsap || !ScrollTrigger) {
			if (tries++ < 100) setTimeout(boot, 80);
			return;
		}
		const track = section.querySelector(opts.trackSel) as HTMLElement | null;
		const viewport = section.querySelector(opts.viewportSel) as HTMLElement | null;
		if (!track || !viewport) return;
		gsap.registerPlugin(ScrollTrigger);

		// Distance the track must travel = its overflow past the viewport.
		// Function-valued (with invalidateOnRefresh) so resizes re-measure.
		// scrollRatio stretches the pinned scroll span relative to the travel
		// (2 = you scroll two pixels for one pixel of sideways drag) so the cards
		// glide past at a browsable pace instead of whipping by.
		const SCROLL_RATIO = opts.scrollRatio ?? 2;
		const dist = () => Math.max(0, track.scrollWidth - viewport.clientWidth);

		// Pin + scrub only while the desktop query matches. gsap.matchMedia sets the
		// whole context up when you cross above 901px and tears it down when you drop
		// below — reverting the pin/track transform and (via the cleanup) dropping
		// .is-pinned — so dragging the window across the breakpoint flips cleanly
		// between the pinned rail and the mobile vertical list instead of stranding a
		// half-pinned track. Below 901px / reduced-motion the context never runs, so
		// the section keeps its default CSS vertical list.
		const mm = gsap.matchMedia();
		mm.add('(min-width: 901px) and (prefers-reduced-motion: no-preference)', () => {
			section.classList.add('is-pinned');
			// Pre-warm the plate images one viewport before the rail pins: lazy images
			// inside a horizontally-scrubbed track otherwise never load (native lazy
			// only fires on vertical scroll). Flipping to eager here keeps the initial
			// page load light but the scrub fully painted.
			ScrollTrigger.create({
				trigger: section,
				start: 'top 160%',
				once: true,
				onEnter: () => {
					section.querySelectorAll('img[loading="lazy"]').forEach((img) => {
						(img as HTMLImageElement).loading = 'eager';
					});
				},
			});
			gsap.to(track, {
				x: () => -dist(),
				ease: 'none',
				scrollTrigger: {
					trigger: section,
					start: 'top top',
					end: () => '+=' + dist() * SCROLL_RATIO,
					scrub: true,
					pin: true,
					anticipatePin: 1,
					invalidateOnRefresh: true,
				},
			});
			// Cleanup when the query stops matching: gsap.matchMedia reverts the tween
			// and its pinned ScrollTrigger automatically; we only undo the manual DOM
			// mutations (the class, and any leftover track transform).
			return () => {
				section.classList.remove('is-pinned');
				gsap.set(track, { clearProps: 'x' });
			};
		});
	};
	boot();
}

export function initHomeGamesRail() {
	initRail({ sectionId: 'games-rail', trackSel: '.bp-rail-track', viewportSel: '.bp-rail-viewport' });
}

export function initHomeBlogRail() {
	initRail({ sectionId: 'blog', trackSel: '.bp-write-cards', viewportSel: '.bp-rail-viewport' });
}
