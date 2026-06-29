import { isMobile } from './env';
import { initCanvasParticles, pauseCanvasParticles, resumeCanvasParticles } from './particles';
import { getIsBgPaused } from './navDimmer';

// ── Canvas Particles Background (desktop only — skipped on mobile) ──────
export function startCanvasBackground() {
	if (!isMobile) {
		initCanvasParticles();
		// On the home page the particles live ONLY behind the bottom CTA
		// ("LET'S SHIP SOMETHING REAL") section — navDimmer fades them in on
		// scroll, so start hidden + paused. Other pages fade in immediately.
		if (document.getElementById('contact')) {
			pauseCanvasParticles();
		} else {
			document.getElementById('canvas-bg')!.style.opacity = '1';
		}
	}
}

// ── Page Visibility: pause all animations when tab is hidden ─────────
export function initPageVisibility() {
	document.addEventListener('visibilitychange', () => {
		if (isMobile) return;
		if (document.hidden) {
			pauseCanvasParticles();
		} else if (!getIsBgPaused()) {
			resumeCanvasParticles();
		}
	});
}
