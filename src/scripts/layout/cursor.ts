import { isWindows, dot, ring } from './env';

// ── Custom Cursor ───────────────────────────────────────────────────────
export function initCursor() {
	let ringX = 0, ringY = 0, mouseX = 0, mouseY = 0;
	let targetRingScale = 1, ringScale = 1;
	const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

	if (isTouchDevice) {
		dot.style.display = 'none';
		ring.style.display = 'none';
	} else {
		// Windows: remove mix-blend-difference (causes full-page repaints)
		if (isWindows) {
			dot.style.mixBlendMode = 'normal';
			dot.style.backgroundColor = 'rgba(139,92,246,0.9)';
			ring.style.mixBlendMode = 'normal';
			ring.style.borderColor = 'rgba(139,92,246,0.5)';
		} else {
			// Set initial cursor colors based on theme
			const isLight = document.body.classList.contains('light-mode');
			if (isLight) {
				dot.style.backgroundColor = '#8b5cf6';
				ring.style.borderColor = 'rgba(139,92,246,0.5)';
			}
		}

		// kickRingAnim: assigned in the else branch; no-op on Windows / touch
		let kickRingAnim: () => void = () => {};

		document.addEventListener('mousemove', (e) => {
			mouseX = e.clientX; mouseY = e.clientY;
			dot.style.left = mouseX - 4 + 'px';
			dot.style.top = mouseY - 4 + 'px';
			kickRingAnim();
		});

		if (isWindows) {
			// Windows: CSS transition instead of infinite rAF loop
			ring.style.transition = 'transform 0.12s ease-out, border-color 0.3s ease, box-shadow 0.3s ease';
			document.addEventListener('mousemove', (e) => {
				ringX = e.clientX; ringY = e.clientY;
				ring.style.transform = `translate(${ringX - 20}px, ${ringY - 20}px) scale(${ringScale})`;
			});
		} else {
			// macOS/Edge: smooth rAF ring — stops when settled to avoid idle 60fps drain
			let ringRafId: number | null = null;
			const doRingAnim = () => {
				const prevX = ringX, prevY = ringY, prevScale = ringScale;
				ringX += (mouseX - ringX) * 0.12;
				ringY += (mouseY - ringY) * 0.12;
				ringScale += (targetRingScale - ringScale) * 0.15;
				const dx = Math.abs(ringX - prevX);
				const dy = Math.abs(ringY - prevY);
				const ds = Math.abs(ringScale - prevScale);
				if (dx > 0.05 || dy > 0.05 || ds > 0.001) {
					ring.style.transform = `translate(${ringX - 20}px, ${ringY - 20}px) scale(${ringScale.toFixed(3)})`;
				}
				ringRafId = (dx > 0.01 || dy > 0.01 || ds > 0.0005) ? requestAnimationFrame(doRingAnim) : null;
			};
			kickRingAnim = () => { if (!ringRafId) ringRafId = requestAnimationFrame(doRingAnim); };
		}

		document.querySelectorAll('a, button, .tilt-card, .magnetic').forEach(el => {
			el.addEventListener('mouseenter', () => {
				if (isWindows) ring.style.transform = `translate(${ringX - 20}px, ${ringY - 20}px) scale(2)`;
				else { targetRingScale = 2; kickRingAnim(); }
				ring.style.borderColor = 'rgba(139,92,246,0.8)';
				ring.style.boxShadow = '0 0 20px rgba(139,92,246,0.3)';
				dot.style.transform = 'scale(1.5)';
				dot.style.backgroundColor = '#8b5cf6';
			});
			el.addEventListener('mouseleave', () => {
				if (isWindows) ring.style.transform = `translate(${ringX - 20}px, ${ringY - 20}px) scale(1)`;
				else { targetRingScale = 1; kickRingAnim(); }
				ring.style.borderColor = isWindows ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.4)';
				ring.style.boxShadow = 'none';
				dot.style.transform = 'scale(1)';
				dot.style.backgroundColor = isWindows ? 'rgba(139,92,246,0.9)' : 'white';
			});
		});
	}
}
