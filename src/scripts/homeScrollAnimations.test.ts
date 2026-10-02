// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initHomeScrollAnimations } from './homeScrollAnimations';
import { inlineScript } from '../test/inlineScript';

// The homepage's connector lines start hidden under html.home-anim, which
// HomePage's head script adds together with a 2.5 s fail-open timer; a GSAP
// that arrives after that must not hide them again.
describe('home-anim', () => {
    const root = document.documentElement;
    const runHeadScript = () => new Function(inlineScript('components/pages/HomePage.astro', "classList.add('home-anim')"))();

    beforeEach(() => {
        vi.useFakeTimers();
        document.body.innerHTML = '<span data-connector></span>';
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
        root.classList.remove('home-anim', 'bp-home', 'ocean-on');
    });

    it("HomePage's head script drops the gate 2.5 s in when GSAP has not arrived", () => {
        runHeadScript();

        vi.advanceTimersByTime(2400);
        expect(root.classList.contains('home-anim')).toBe(true);

        vi.advanceTimersByTime(200);
        expect(root.classList.contains('home-anim')).toBe(false);
    });

    it('a late GSAP leaves the shown content alone', () => {
        runHeadScript();
        vi.advanceTimersByTime(2600); // GSAP missed the 2.5 s window
        const matchMedia = vi.fn(() => ({ add: vi.fn() }));
        vi.stubGlobal('gsap', { registerPlugin: vi.fn(), matchMedia, utils: { toArray: () => [] }, set: vi.fn(), to: vi.fn() });
        vi.stubGlobal('ScrollTrigger', {});
        initHomeScrollAnimations();
        vi.advanceTimersByTime(5000);

        expect(matchMedia).not.toHaveBeenCalled();
        expect(root.classList.contains('home-anim')).toBe(false);
    });
});
