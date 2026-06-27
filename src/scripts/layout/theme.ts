import { isMobile, isWindows, dot, ring } from './env';
import { initCanvasParticles } from './particles';

// ── Theme Management ────────────────────────────────────────────────────
// Initialize theme from localStorage or system preference
const initTheme = () => {
	const savedTheme = localStorage.getItem('theme');
	const theme = savedTheme || 'light';

	if (theme === 'light') {
		document.body.classList.add('light-mode');
	}
	return theme;
};

// Theme toggle function
const toggleTheme = () => {
	const isLight = document.body.classList.toggle('light-mode');
	document.documentElement.classList.toggle('light-mode', isLight);
	localStorage.setItem('theme', isLight ? 'light' : 'dark');

	if (!isMobile) {
		document.getElementById('canvas-bg')!.style.opacity = '1';
		initCanvasParticles();
	}
	// Update cursor colors for non-Windows
	if (!isWindows && dot && ring) {
		if (isLight) {
			dot.style.backgroundColor = 'var(--accent)';
			ring.style.borderColor = 'rgb(var(--accent-rgb) / 0.5)';
		} else {
			dot.style.backgroundColor = 'white';
			ring.style.borderColor = 'rgba(255,255,255,0.4)';
		}
	}
};

export function initThemeManagement() {
	// Apply theme immediately to prevent flash
	const currentTheme = initTheme();

	// Expose toggle function globally for button click
	(window as any).toggleTheme = () => {
		toggleTheme();
		// Re-trigger scroll logic to update nav background immediately
		window.dispatchEvent(new Event('scroll'));
	};
}
