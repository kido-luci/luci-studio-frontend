// ── Magnetic Buttons ────────────────────────────────────────────────────
export function initMagnetic() {
	document.querySelectorAll('.magnetic').forEach((btn) => {
		const el = btn as HTMLElement;
		el.addEventListener('mousemove', (e) => {
			const rect = el.getBoundingClientRect();
			const x = (e as MouseEvent).clientX - rect.left - rect.width / 2;
			const y = (e as MouseEvent).clientY - rect.top - rect.height / 2;
			el.style.transform = `translate(${x * 0.35}px, ${y * 0.35}px)`;
		});
		el.addEventListener('mouseleave', () => { el.style.transform = ''; });
	});
}
