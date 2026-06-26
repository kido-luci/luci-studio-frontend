// ── Timeline Toggle ─────────────────────────────────────────────────────
export function initTimelineToggle() {
	// Expand all timeline items by default
	document.querySelectorAll('.timeline-item').forEach(item => item.classList.add('active'));
	document.querySelectorAll('.timeline-item').forEach(item => {
		item.addEventListener('click', () => {
			const isActive = item.classList.contains('active');
			document.querySelectorAll('.timeline-item').forEach(other => other.classList.remove('active'));
			if (!isActive) item.classList.add('active');
		});
	});
}

// ── Portfolio → Timeline Navigation ─────────────────────────────────────
export function initPortfolioNav() {
	document.querySelectorAll('[data-project]').forEach(card => {
		card.addEventListener('click', () => {
			const projectTitle = (card as HTMLElement).dataset.project;
			const target = document.getElementById(projectTitle || '');
			if (target) {
				target.scrollIntoView({ behavior: 'smooth', block: 'center' });
				setTimeout(() => {
					document.querySelectorAll('.timeline-item').forEach(other => other.classList.remove('active'));
					const card = target.querySelector('.timeline-item');
					if (card) card.classList.add('active');
				}, 800);
			}
		});
	});
}
