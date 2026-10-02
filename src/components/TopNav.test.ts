// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { inlineScript } from '../test/inlineScript';

// The mobile-menu toggle is an inline script right after the nav, so the burger
// works as soon as it is parsed rather than once the CDN scripts (which hold up
// every module script) have arrived.
describe("TopNav's inline mobile-menu toggle", () => {
    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('opens and closes the menu, keeping aria-expanded in step', () => {
        document.body.innerHTML = `
            <nav class="bp-nav" data-bp-nav>
                <button type="button" class="bp-nav-burger" aria-label="Menu" aria-expanded="false"></button>
            </nav>`;
        new Function(inlineScript('components/TopNav.astro', 'bp-nav-burger'))();
        const nav = document.querySelector('[data-bp-nav]')!;
        const burger = document.querySelector<HTMLButtonElement>('.bp-nav-burger')!;

        burger.click();
        expect(nav.classList.contains('menu-open')).toBe(true);
        expect(burger.getAttribute('aria-expanded')).toBe('true');

        burger.click();
        expect(nav.classList.contains('menu-open')).toBe(false);
        expect(burger.getAttribute('aria-expanded')).toBe('false');
    });
});
