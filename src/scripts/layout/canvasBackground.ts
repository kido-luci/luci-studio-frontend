import { isMobile } from './env';
import { initCanvasParticles, pauseCanvasParticles, resumeCanvasParticles } from './particles';
import { getIsBgPaused } from './navDimmer';

// ── Canvas Particles Background (desktop only — skipped on mobile) ──────
export function startCanvasBackground() {
	if (!isMobile) {
		document.getElementById('canvas-bg')!.style.opacity = '1';
		initCanvasParticles();
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
