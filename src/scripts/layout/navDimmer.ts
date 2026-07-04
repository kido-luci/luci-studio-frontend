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
		nav.style.background = 'var(--nav-bg-scroll)';
	}

	let scrollRaf = false;
	let lastScrollY = window.scrollY;
	window.addEventListener('scroll', () => {
		if (scrollRaf) return;
		scrollRaf = true;
		requestAnimationFrame(() => {
			scrollRaf = false;
			const scrollY = window.scrollY;

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

			if (scrollY > 80) {
				nav.style.background = 'var(--nav-bg-scroll)';
				if (!isWindows) nav.style.backdropFilter = 'blur(32px)';
			} else {
				nav.style.background = 'var(--nav-bg)';
				if (!isWindows) nav.style.backdropFilter = 'blur(16px)';
			}
		});
	}, { passive: true });
}
