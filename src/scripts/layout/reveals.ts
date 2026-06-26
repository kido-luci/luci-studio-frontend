// ── GSAP Reveals — ScrollTrigger drives both [data-reveal] and [data-word-reveal] ──
// CSS keeps the initial hidden state (no FOUC); GSAP overrides the CSS transition and
// runs the in-motion itself.
export function initReveals() {
	// Reduced motion: skip every reveal; CSS resolves the hidden states to visible.
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
	const w = window as any;
	const ready = () => w.gsap && w.ScrollTrigger;
	const run = () => {
		const { gsap, ScrollTrigger } = w;
		gsap.registerPlugin(ScrollTrigger);

		// [data-reveal]: group by variant, ScrollTrigger.batch animates each group together.
		const allReveals = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
		if (allReveals.length) {
			const groups: Record<string, HTMLElement[]> = { default: [], left: [], right: [], scale: [] };
			for (const el of allReveals) {
				const v = el.getAttribute('data-reveal') || '';
				(groups[v as keyof typeof groups] ?? groups.default).push(el);
				// Disable the CSS transition so it doesn't fight GSAP frame-by-frame
				el.style.transition = 'none';
			}
			// Guard each set: a page may have no elements for a given variant, and
			// gsap.set([]) logs a "GSAP target not found" warning. Mirrors the
			// length guards on the ScrollTrigger.batch calls below.
			if (groups.default.length) gsap.set(groups.default, { opacity: 0, y: 40 });
			if (groups.left.length)    gsap.set(groups.left,    { opacity: 0, x: -40 });
			if (groups.right.length)   gsap.set(groups.right,   { opacity: 0, x: 40 });
			if (groups.scale.length)   gsap.set(groups.scale,   { opacity: 0, scale: 0.92 });

			const batchTo = (toVars: any) => ({
				start: 'top 94%',
				once: true,
				onEnter: (els: HTMLElement[]) => {
					gsap.to(els, {
						...toVars,
						duration: 0.55,
						ease: 'power2.out',
						stagger: 0.06,
						overwrite: true,
						clearProps: 'transition'
					});
				}
			});
			if (groups.default.length) ScrollTrigger.batch(groups.default, batchTo({ opacity: 1, y: 0 }));
			if (groups.left.length)    ScrollTrigger.batch(groups.left,    batchTo({ opacity: 1, x: 0 }));
			if (groups.right.length)   ScrollTrigger.batch(groups.right,   batchTo({ opacity: 1, x: 0 }));
			if (groups.scale.length)   ScrollTrigger.batch(groups.scale,   batchTo({ opacity: 1, scale: 1 }));
		}

		// [data-word-reveal]: animate each .reveal-word > span from y:-60 up to y:0
		// within the parent's overflow:hidden mask. 0.8s delay so the hero title
		// rises as the patch overlay clears (otherwise it animates underneath).
		document.querySelectorAll<HTMLElement>('[data-word-reveal]').forEach(host => {
			const inners = host.querySelectorAll<HTMLElement>('.reveal-word > span');
			if (!inners.length) return;
			inners.forEach(s => { s.style.transition = 'none'; });
			gsap.set(inners, { y: -60, opacity: 0 });
			gsap.to(inners, {
				y: 0,
				opacity: 1,
				duration: 0.85,
				ease: 'power3.out',
				stagger: 0.12,
				delay: 0.8,
				scrollTrigger: { trigger: host, start: 'top 90%', once: true }
			});
		});
	};
	if (ready()) run();
	else {
		const id = setInterval(() => { if (ready()) { clearInterval(id); run(); } }, 30);
	}
}
