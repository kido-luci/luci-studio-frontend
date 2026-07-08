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
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
	if (window.matchMedia('(max-width: 900px)').matches) return;

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
		// Distance the track must travel = its overflow past the viewport.
		// Function-valued (with invalidateOnRefresh) so resizes re-measure.
		// scrollRatio stretches the pinned scroll span relative to the travel
		// (2 = you scroll two pixels for one pixel of sideways drag) so the cards
		// glide past at a browsable pace instead of whipping by.
		const SCROLL_RATIO = opts.scrollRatio ?? 2;
		const dist = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
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
	};
	boot();
}

export function initHomeGamesRail() {
	initRail({ sectionId: 'games-rail', trackSel: '.bp-rail-track', viewportSel: '.bp-rail-viewport' });
}

export function initHomeBlogRail() {
	initRail({ sectionId: 'blog', trackSel: '.bp-write-cards', viewportSel: '.bp-rail-viewport' });
}
