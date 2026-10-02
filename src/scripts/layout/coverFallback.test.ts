// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { initCoverFallback } from './coverFallback';

// Cover images marked data-hide-on-error go transparent when they fail, so the
// card's placeholder shows instead of a broken-image icon (this replaced their
// inline onerror attributes, which the CSP now blocks).
describe('initCoverFallback', () => {
    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('hides a marked image when it fails to load, and leaves others alone', () => {
        document.body.innerHTML = '<img data-hide-on-error alt="a"><img alt="b">';
        initCoverFallback();
        const [marked, plain] = Array.from(document.querySelectorAll('img'));

        marked.dispatchEvent(new Event('error'));
        plain.dispatchEvent(new Event('error'));

        expect(marked.style.opacity).toBe('0');
        expect(plain.style.opacity).toBe('');
    });

    it('hides a marked image that had already failed before it ran', () => {
        document.body.innerHTML = '<img data-hide-on-error alt="failed"><img data-hide-on-error alt="loaded"><img data-hide-on-error alt="pending">';
        const [failed, loaded, pending] = Array.from(document.querySelectorAll('img'));
        Object.defineProperties(failed, { complete: { value: true }, naturalWidth: { value: 0 } });
        Object.defineProperties(loaded, { complete: { value: true }, naturalWidth: { value: 1200 } });
        // A lazy image that has not started loading is not complete yet.
        Object.defineProperties(pending, { complete: { value: false }, naturalWidth: { value: 0 } });

        initCoverFallback();

        expect(failed.style.opacity).toBe('0');
        expect(loaded.style.opacity).toBe('');
        expect(pending.style.opacity).toBe('');
    });
});
