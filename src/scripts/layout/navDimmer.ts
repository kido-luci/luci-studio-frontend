import { isWindows } from './env';

// ── Nav scroll behaviour ────────────────────────────────────────────────
// (Historically also drove a particle-canvas dimmer — that background was
// retired, so this now only styles the nav on scroll: glass bg on/off and
// hide-on-scroll-down / reveal-on-scroll-up.)
export function initNavDimmer() {
	const nav = document.querySelector('nav') as HTMLElement;

	// Windows: backdrop-filter on a full-width sticky nav re-rasterizes a
	// full-viewport GPU layer on every scroll event — clear the inline blur set
	// in the HTML attribute and use a solid scrolled bg instead.
	if (isWindows) {
		nav.style.backdropFilter = 'none';
		(nav.style as any).webkitBackdropFilter = 'none';
	}

	// Scroll-progress dimension rule along the nav's bottom edge (TopNav's
	// .bp-nav-progress). Rule scales with document scroll progress; the tick
	// tracks its leading edge. Runs before the class/style writes below so the
	// layout reads (scrollHeight/clientWidth) never follow a same-frame write.
	const progressRule = nav.querySelector('.bp-nav-progress-rule') as HTMLElement | null;
	const progressTip = nav.querySelector('.bp-nav-progress-tip') as HTMLElement | null;
	const updateProgress = (scrollY: number) => {
		if (!progressRule || !progressTip) return;
		const doc = document.documentElement;
		const max = doc.scrollHeight - window.innerHeight;
		const p = max > 0 ? Math.min(scrollY / max, 1) : 0;
		progressRule.style.transform = `scaleX(${p})`;
		progressTip.style.transform = `translateX(${p * (doc.clientWidth - 2)}px)`;
	};
	updateProgress(window.scrollY); // anchor links / restored scroll positions

	let scrollRaf = false;
	let lastScrollY = window.scrollY;
	window.addEventListener('scroll', () => {
		if (scrollRaf) return;
		scrollRaf = true;
		requestAnimationFrame(() => {
			scrollRaf = false;
			const scrollY = window.scrollY;

			updateProgress(scrollY);

			// Hide the nav on scroll-down, reveal it on scroll-up. Skipped while the
			// mobile menu is open (it lives inside the nav — hiding it would strand
			// the open dropdown), and a small delta ignores sub-pixel/bounce jitter.
			if (!nav.classList.contains('menu-open')) {
				const delta = scrollY - lastScrollY;
				if (scrollY <= 80 || delta < -4) {
					nav.classList.remove('nav-hidden');
				} else if (delta > 4) {
					nav.classList.add('nav-hidden');
				}
			}
			lastScrollY = scrollY;

			// Nav is transparent + borderless at the top; past 80px it gains the glass
			// bg and its bottom border. Both live in CSS on .nav-scrolled (see TopNav)
			// — a class toggle, not inline writes, so the top state is truly transparent
			// and the bg/border fade in cleanly.
			nav.classList.toggle('nav-scrolled', scrollY > 80);
		});
	}, { passive: true });
}
