// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { inlineScript } from '../test/inlineScript';

// Cover images marked data-hide-on-error go transparent when they fail, so the
// card's placeholder shows instead of a broken-image icon. The listener is an
// inline script in Layout's <head>: it must be in place before any <img> is
// parsed, without waiting for the CDN scripts that hold up the module scripts.
describe("Layout's inline cover-image fallback", () => {
    beforeAll(() => {
        new Function(inlineScript('layouts/Layout.astro', 'data-hide-on-error'))();
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('hides a marked image that fails to load, as its old onerror did', () => {
        document.body.innerHTML = '<img data-hide-on-error alt="cover"><img alt="other">';
        const [cover, other] = Array.from(document.querySelectorAll('img'));

        cover.dispatchEvent(new Event('error'));
        other.dispatchEvent(new Event('error'));

        expect(cover.style.opacity).toBe('0');
        expect(other.style.opacity).toBe('');
    });
});
