import { isWindows } from './env';
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
	window.addEventListener('resize', () => { cachedScrollHeight = document.documentElement.scrollHeight; }, { passive: true });
	window.addEventListener('scroll', () => {
		if (scrollRaf) return;
		scrollRaf = true;
		requestAnimationFrame(() => {
			scrollRaf = false;
			const scrollY = window.scrollY;
			const windowHeight = window.innerHeight;
			const isLight = document.body.classList.contains('light-mode');

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

			const shouldPause = isBgPaused
				? scrollY > animationPauseThreshold - HYSTERESIS && scrollY < ctaThreshold + HYSTERESIS
				: scrollY > animationPauseThreshold + HYSTERESIS && scrollY < ctaThreshold - HYSTERESIS;

			if (shouldPause !== isBgPaused) {
				isBgPaused = shouldPause;
				if (shouldPause) {
					pauseCanvasParticles();
				} else {
					resumeCanvasParticles();
				}
			}
		});
	}, { passive: true });
}
