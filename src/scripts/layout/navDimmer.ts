import { isWindows, isMobile } from './env';
import { pauseCanvasParticles, resumeCanvasParticles } from './particles';

// ── Nav Scroll & Background Dimmer ──────────────────────────────────────
let isBgPaused = false;

// Read-only accessor so the page-visibility handler can mirror the scroll
// pause state without owning the variable (kept identical to the original
// single-script module scope where both blocks shared `isBgPaused`).
export const getIsBgPaused = () => isBgPaused;

export function initNavDimmer() {
	const nav = document.querySelector('nav') as HTMLElement;
	const bgDimmer = document.getElementById('bg-dimmer') as HTMLElement;
	const canvasBg = document.getElementById('canvas-bg') as HTMLElement | null;
	// Home page (the only page with the bottom "LET'S SHIP SOMETHING REAL"
	// CTA): the particles run ONLY behind that section, hidden everywhere
	// above it. Mirror the paused-on-load state set by startCanvasBackground.
	const isHome = !!document.getElementById('contact');
	if (isHome) isBgPaused = true;

	// Windows: disable dynamic backdrop-filter on bg-dimmer (very expensive).
	// Also clear the nav's initial inline style backdrop-filter.
	if (isWindows) {
		bgDimmer.style.backdropFilter = 'none';
		(bgDimmer.style as any).webkitBackdropFilter = 'none';
		// Override the nav's inline style blur set in the HTML attribute
		nav.style.backdropFilter = 'none';
		(nav.style as any).webkitBackdropFilter = 'none';
		nav.style.background = 'var(--nav-bg-scroll)';
	}

	let scrollRaf = false;
	let cachedScrollHeight = document.documentElement.scrollHeight;
	let lastScrollY = window.scrollY;
	window.addEventListener('resize', () => { cachedScrollHeight = document.documentElement.scrollHeight; }, { passive: true });
	window.addEventListener('scroll', () => {
		if (scrollRaf) return;
		scrollRaf = true;
		requestAnimationFrame(() => {
			scrollRaf = false;
			const scrollY = window.scrollY;
			const windowHeight = window.innerHeight;
			const isLight = document.body.classList.contains('light-mode');

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
				// Windows: solid bg, no blur — backdrop-filter on a full-width sticky
				// nav triggers a full-viewport GPU layer on every scroll event in Chrome.
				if (!isWindows) nav.style.backdropFilter = 'blur(32px)';
			} else {
				nav.style.background = 'var(--nav-bg)';
				if (!isWindows) nav.style.backdropFilter = 'blur(16px)';
			}

			const dimStart = windowHeight * 0.4;
			const dimEnd = windowHeight * 1.5;
			if (scrollY > dimStart) {
				const progress = Math.min((scrollY - dimStart) / (dimEnd - dimStart), 1);
				const dimOpacity = progress * 0.45;
				if (!isWindows) {
					bgDimmer.style.opacity = dimOpacity.toString();
				} else {
					const bgColor = isLight ? `rgba(255,255,255,${dimOpacity * 0.3})` : `rgba(0,0,0,${dimOpacity * 0.4})`;
					bgDimmer.style.backgroundColor = bgColor;
				}
			} else {
				if (!isWindows) {
					bgDimmer.style.opacity = '0';
				} else {
					bgDimmer.style.backgroundColor = isLight ? 'rgba(255,255,255,0)' : 'rgba(0,0,0,0)';
				}
			}

			const animationPauseThreshold = windowHeight * 1.1;
			const ctaThreshold = cachedScrollHeight - windowHeight * 1.5;
			const HYSTERESIS = 80;

			let shouldPause = isBgPaused;
			if (isHome) {
				// Run only inside the bottom CTA zone; paused above it. (Mobile
				// hides the canvas entirely, so leave the loop asleep there.)
				if (!isMobile) {
					shouldPause = isBgPaused
						? scrollY < ctaThreshold + HYSTERESIS
						: scrollY < ctaThreshold - HYSTERESIS;
				}
			} else {
				shouldPause = isBgPaused
					? scrollY > animationPauseThreshold - HYSTERESIS && scrollY < ctaThreshold + HYSTERESIS
					: scrollY > animationPauseThreshold + HYSTERESIS && scrollY < ctaThreshold - HYSTERESIS;
			}

			if (shouldPause !== isBgPaused) {
				isBgPaused = shouldPause;
				if (shouldPause) {
					pauseCanvasParticles();
					if (isHome && canvasBg) canvasBg.style.opacity = '0';
				} else {
					resumeCanvasParticles();
					if (isHome && canvasBg) canvasBg.style.opacity = '1';
				}
			}
		});
	}, { passive: true });
}
