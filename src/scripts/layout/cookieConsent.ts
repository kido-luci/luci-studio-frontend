// ── Cookie consent banner (gated by COOKIE_BANNER_ENABLED) ──────────────
// Dormant infrastructure: while the flag is off the banner isn't rendered,
// so consentPanel is null and this whole block stays inert. AdSense was
// removed; this only shows and stores a consent choice and can be reused.
export function initCookieConsent() {
	const consentPanel = document.getElementById('cookie-consent') as HTMLElement | null;
	if (consentPanel) {
		const COOKIE_CONSENT_KEY = 'luci_cookie_consent';

		const getCookieConsent = () => {
			try {
				return localStorage.getItem(COOKIE_CONSENT_KEY);
			} catch {
				return null;
			}
		};

		const showCookieConsent = () => {
			consentPanel.classList.add('show');
		};

		const hideCookieConsent = () => {
			consentPanel.classList.remove('show');
		};

		const setCookieConsent = (choice: 'accepted' | 'rejected') => {
			try {
				localStorage.setItem(COOKIE_CONSENT_KEY, choice);
			} catch {}
			hideCookieConsent();
		};

		const initialCookieConsent = getCookieConsent();
		if (!initialCookieConsent) {
			setTimeout(showCookieConsent, 1000);
		}

		consentPanel.querySelectorAll('[data-cookie-choice]').forEach(button => {
			button.addEventListener('click', () => {
				const choice = (button as HTMLElement).dataset.cookieChoice;
				if (choice === 'accepted' || choice === 'rejected') setCookieConsent(choice);
			});
		});

		document.addEventListener('click', event => {
			const trigger = (event.target as HTMLElement | null)?.closest('[data-cookie-settings]');
			if (!trigger) return;
			event.preventDefault();
			showCookieConsent();
		});
	}
}
