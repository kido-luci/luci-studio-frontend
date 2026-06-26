// ── Count-up Counters (IntersectionObserver) ────────────────────────────
export function initCounters() {
	const counterIo = new IntersectionObserver((entries) => {
		entries.forEach(e => {
			if (!e.isIntersecting) return;
			const el = e.target as HTMLElement;
			const target = parseInt(el.dataset.count || '0');
			const suffix = el.dataset.suffix || '';
			const dur = 1800;
			const start = performance.now();
			const tick = (now: number) => {
				const p = Math.min((now - start) / dur, 1);
				const eased = 1 - Math.pow(1 - p, 4);
				el.textContent = Math.round(eased * target) + suffix;
				if (p < 1) requestAnimationFrame(tick);
			};
			requestAnimationFrame(tick);
			counterIo.unobserve(el);
		});
	}, { threshold: 0.5 });
	document.querySelectorAll('[data-count]').forEach(el => counterIo.observe(el));
}
