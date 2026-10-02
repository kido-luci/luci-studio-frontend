// ── Cover-image fallback ────────────────────────────────────────────────
// Cover <img>s marked data-hide-on-error turn transparent when they fail to
// load, so the card's own placeholder shows instead of a broken-image icon.
// This replaces their inline onerror attributes, which the CSP blocks
// (script-src-attr 'none'). error events don't bubble, so one capture-phase
// listener on the document sees them all; the sweep catches images that had
// already failed before this module ran (a lazy image that hasn't started
// loading is not `complete`, so it is left alone).
export function initCoverFallback() {
	const hide = (img: HTMLImageElement) => { img.style.opacity = '0'; };
	document.addEventListener('error', (e) => {
		const img = e.target;
		if (img instanceof HTMLImageElement && img.hasAttribute('data-hide-on-error')) hide(img);
	}, true);
	document.querySelectorAll<HTMLImageElement>('img[data-hide-on-error]').forEach((img) => {
		if (img.complete && img.naturalWidth === 0) hide(img);
	});
}
