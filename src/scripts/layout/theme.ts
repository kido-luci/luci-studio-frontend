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

// ── Color Scheme (accent palette) ─────────────────────────────────────────
// Orthogonal to light/dark. A scheme only swaps the --accent-rgb var on <html>;
// everything accent-driven follows via the CSS cascade, so no canvas/cursor
// re-init is needed (unlike toggleTheme, which flips canvas opacity + cursor base).
const SCHEMES = ['violet', 'ocean', 'ember', 'forest', 'rose', 'mono'] as const;
type Scheme = (typeof SCHEMES)[number];
const DEFAULT_SCHEME: Scheme = 'violet';

const isScheme = (v: string | null): v is Scheme =>
	!!v && (SCHEMES as readonly string[]).includes(v);

// Reflect the active scheme on the picker swatches (.scheme-dot[data-scheme]).
const syncSchemeUI = (scheme: string) => {
	document.querySelectorAll<HTMLElement>('.scheme-dot').forEach((d) => {
		d.setAttribute('aria-checked', String(d.dataset.scheme === scheme));
	});
};

const initScheme = (): Scheme => {
	const saved = localStorage.getItem('scheme');
	const scheme = isScheme(saved) ? saved : DEFAULT_SCHEME;
	document.documentElement.dataset.scheme = scheme;
	return scheme;
};

const setScheme = (name: string) => {
	if (!isScheme(name)) return;
	document.documentElement.dataset.scheme = name;
	localStorage.setItem('scheme', name);
	syncSchemeUI(name);
};

export function initThemeManagement() {
	// Apply theme immediately to prevent flash
	const currentTheme = initTheme();
	const currentScheme = initScheme();

	// Expose toggle function globally for button click
	(window as any).toggleTheme = () => {
		toggleTheme();
		// Re-trigger scroll logic to update nav background immediately
		window.dispatchEvent(new Event('scroll'));
	};
	(window as any).setScheme = setScheme;
	syncSchemeUI(currentScheme);
}
