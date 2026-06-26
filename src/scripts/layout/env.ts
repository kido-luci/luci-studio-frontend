// ── Platform Detection ──────────────────────────────────────────────────
export const isWindows = navigator.platform.startsWith('Win') ||
	((navigator as any).userAgentData?.platform === 'Windows') ||
	(/Windows/.test(navigator.userAgent));

// ── Mobile Detection ────────────────────────────────────────────────────
// Skip the canvas particle background on mobile browsers (perf + clutter).
export const isMobile = window.matchMedia('(max-width: 768px)').matches;

// ── Global Elements ─────────────────────────────────────────────────────
export const dot = document.getElementById('cursor-dot') as HTMLElement;
export const ring = document.getElementById('cursor-ring') as HTMLElement;

export function applyWinPerfMode() {
	if (isWindows) document.body.classList.add('win-perf-mode');
}
