import { isWindows } from './env';

// ── Parallax Mousemove (throttled on Windows) ───────────────────────────
export function initParallax() {
	let parallaxFrame = false;
	document.addEventListener('mousemove', (e) => {
		if (isWindows) {
			if (parallaxFrame) return;
			parallaxFrame = true;
			requestAnimationFrame(() => {
				parallaxFrame = false;
				const mx = e.clientX / window.innerWidth;
				const my = e.clientY / window.innerHeight;
				document.querySelectorAll('[data-parallax]').forEach((el, i) => {
					const speed = (i + 1) * 0.5;
					(el as HTMLElement).style.transform = `translate(${(mx-0.5)*speed}px, ${(my-0.5)*speed}px)`;
				});
			});
		} else {
			const mx = e.clientX / window.innerWidth;
			const my = e.clientY / window.innerHeight;
			document.querySelectorAll('[data-parallax]').forEach((el, i) => {
				const speed = (i + 1) * 0.5;
				(el as HTMLElement).style.transform = `translate(${(mx-0.5)*speed}px, ${(my-0.5)*speed}px)`;
			});
		}
	});
}
