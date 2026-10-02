// ── Platform Detection ──────────────────────────────────────────────────
export const isWindows = navigator.platform.startsWith('Win') ||
	((navigator as any).userAgentData?.platform === 'Windows') ||
	(/Windows/.test(navigator.userAgent));

// ── Global Elements ─────────────────────────────────────────────────────
export const dot = document.getElementById('cursor-dot') as HTMLElement;
export const ring = document.getElementById('cursor-ring') as HTMLElement;

export function applyWinPerfMode() {
	if (isWindows) document.body.classList.add('win-perf-mode');
}
