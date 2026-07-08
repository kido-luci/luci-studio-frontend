// ── ANNEX A — GAMES REGISTER rail (homepage) ────────────────────────────────
// Desktop enhancement for the horizontal games rail: pins the section and
// scrubs the card track sideways as the page scrolls (GSAP ScrollTrigger via
// the same CDN globals the other home animations poll for). Below 901px,
// under reduced motion, or with no CDN the section keeps its default CSS
// overflow-x swipe strip — this module only ever *adds* behaviour.
export function initHomeGamesRail() {
	const section = document.getElementById('games-rail');
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
		const track = section.querySelector('.bp-rail-track') as HTMLElement | null;
		const viewport = section.querySelector('.bp-rail-viewport') as HTMLElement | null;
		if (!track || !viewport) return;
		gsap.registerPlugin(ScrollTrigger);
		section.classList.add('is-pinned');
		// Pre-warm the plate images one viewport before the rail pins: lazy
		// images inside a horizontally-scrubbed track otherwise pop in mid-drag
		// (browsers preload little horizontal distance). Flipping to eager here
		// keeps the initial page load light but the scrub fully painted.
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
		const dist = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
		gsap.to(track, {
			x: () => -dist(),
			ease: 'none',
			scrollTrigger: {
				trigger: section,
				start: 'top top',
				end: () => '+=' + dist(),
				scrub: true,
				pin: true,
				anticipatePin: 1,
				invalidateOnRefresh: true,
			},
		});
	};
	boot();
}
