// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initReveals } from './reveals';
import { inlineScript } from '../../test/inlineScript';

// The hidden start states of [data-reveal] and .reveal-word are gated on
// html.reveal-anim, added by Layout's head script. That script also starts the
// fail-open timer: module scripts (reveals.ts among them) only run once the CDN
// scripts settle, so a timer started there would start late when the CDN hangs.
// At 2.5 s the gate goes unless initReveals has taken over (html.reveal-init).
describe('reveals', () => {
    const root = document.documentElement;
    const runHeadScript = () => new Function(inlineScript('layouts/Layout.astro', "classList.add('reveal-anim')"))();
    const loadGsap = () => {
        const gsap = { registerPlugin: vi.fn(), set: vi.fn(), to: vi.fn() };
        const ScrollTrigger = { batch: vi.fn() };
        vi.stubGlobal('gsap', gsap);
        vi.stubGlobal('ScrollTrigger', ScrollTrigger);
        return { gsap, ScrollTrigger };
    };

    beforeEach(() => {
        vi.useFakeTimers();
        vi.stubGlobal('matchMedia', (media: string) => ({ matches: false, media }));
        document.body.innerHTML = `
            <div data-reveal>card</div>
            <h1 data-word-reveal><span class="reveal-word"><span>LUCI</span></span></h1>
        `;
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
        root.classList.remove('reveal-anim', 'reveal-init');
    });

    describe("Layout's head script", () => {
        it('drops the gate 2.5 s after the page starts when GSAP has not arrived', () => {
            runHeadScript();
            expect(root.classList.contains('reveal-anim')).toBe(true);

            vi.advanceTimersByTime(2400);
            expect(root.classList.contains('reveal-anim')).toBe(true);

            vi.advanceTimersByTime(200);
            expect(root.classList.contains('reveal-anim')).toBe(false);
        });

        it('drops the gate when GSAP is there but initReveals has not taken over by then', () => {
            runHeadScript();
            loadGsap(); // e.g. SplitText or Lenis still hanging, so the module hasn't run
            vi.advanceTimersByTime(2600);

            expect(root.classList.contains('reveal-anim')).toBe(false);
        });

        it('keeps the gate once initReveals has taken over', () => {
            runHeadScript();
            const { gsap } = loadGsap();
            initReveals();
            vi.advanceTimersByTime(5000);

            expect(gsap.set).toHaveBeenCalled();
            expect(root.classList.contains('reveal-init')).toBe(true);
            expect(root.classList.contains('reveal-anim')).toBe(true);
        });
    });

    describe('initReveals', () => {
        it('drops the reveal gate 2.5 s after start when GSAP never loads', () => {
            root.classList.add('reveal-anim');
            initReveals();

            vi.advanceTimersByTime(2400);
            expect(root.classList.contains('reveal-anim')).toBe(true);

            vi.advanceTimersByTime(200);
            expect(root.classList.contains('reveal-anim')).toBe(false);
        });

        it('keeps the gate and hands the reveals to GSAP when it loads in time', () => {
            root.classList.add('reveal-anim');
            initReveals();
            vi.advanceTimersByTime(300);
            const { gsap, ScrollTrigger } = loadGsap();
            vi.advanceTimersByTime(5000);

            expect(root.classList.contains('reveal-anim')).toBe(true);
            expect(ScrollTrigger.batch).toHaveBeenCalledTimes(1);
            expect(gsap.to).toHaveBeenCalledTimes(1);
        });

        it('never re-hides content the head script already showed when GSAP is late', () => {
            runHeadScript();
            vi.advanceTimersByTime(2600); // GSAP missed the 2.5 s window
            const { gsap, ScrollTrigger } = loadGsap();
            initReveals();
            vi.advanceTimersByTime(5000);

            expect(root.classList.contains('reveal-anim')).toBe(false);
            expect(gsap.set).not.toHaveBeenCalled();
            expect(ScrollTrigger.batch).not.toHaveBeenCalled();
        });
    });
});
