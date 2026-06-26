import { isWindows } from './env';

// ── Card Tilt (disabled on Windows — 3D compositing is costly) ──────────
export function initTilt() {
	if (!isWindows) {
		document.querySelectorAll('.tilt-card').forEach((card) => {
			const el = card as HTMLElement;
			el.addEventListener('mousemove', (e) => {
				const rect = el.getBoundingClientRect();
				const x = (e as MouseEvent).clientX - rect.left;
				const y = (e as MouseEvent).clientY - rect.top;
				const cx = rect.width / 2, cy = rect.height / 2;
				const rx = ((y - cy) / cy) * -8;
				const ry = ((x - cx) / cx) * 8;
				el.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.02)`;
			});
			el.addEventListener('mouseleave', () => { el.style.transform = ''; });
		});
	} else {
		// Windows: simple scale hover instead of 3D tilt
		document.querySelectorAll('.tilt-card').forEach((card) => {
			const el = card as HTMLElement;
			el.addEventListener('mouseenter', () => { el.style.transform = 'scale(1.02)'; });
			el.addEventListener('mouseleave', () => { el.style.transform = ''; });
		});
	}
}
