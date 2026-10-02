// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { initThemeManagement } from './theme';
import { blockStorage } from '../../test/blockedStorage';

// The theme and the accent scheme persist in localStorage. initThemeManagement
// runs first in Layout's module script, so if blocked storage made it throw,
// the cursor, reveals and smooth scroll after it would never start.
describe('initThemeManagement with storage blocked', () => {
    let restore = () => {};

    afterEach(() => {
        restore();
        document.body.classList.remove('light-mode');
        document.documentElement.classList.remove('light-mode');
        delete document.documentElement.dataset.scheme;
    });

    it('falls back to the default scheme instead of throwing', () => {
        restore = blockStorage();

        expect(() => initThemeManagement()).not.toThrow();
        expect(document.documentElement.dataset.scheme).toBe('ocean');
    });

    it('still toggles the theme and switches the scheme', () => {
        restore = blockStorage();
        initThemeManagement();
        const wasLight = document.body.classList.contains('light-mode');

        expect(() => window.toggleTheme!()).not.toThrow();
        expect(document.body.classList.contains('light-mode')).toBe(!wasLight);
        expect(() => window.setScheme!('ember')).not.toThrow();
        expect(document.documentElement.dataset.scheme).toBe('ember');
    });
});
