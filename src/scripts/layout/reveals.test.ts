// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initReveals } from './reveals';

// The hidden start states of [data-reveal] and .reveal-word are gated on
// html.reveal-anim (added by Layout's head script). When the GSAP CDN never
// arrives, initReveals must drop that class so the content shows instead of
// staying invisible.
describe('initReveals', () => {
    const root = document.documentElement;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.stubGlobal('matchMedia', (media: string) => ({ matches: false, media }));
        root.classList.add('reveal-anim');
        document.body.innerHTML = `
            <div data-reveal>card</div>
            <h1 data-word-reveal><span class="reveal-word"><span>LUCI</span></span></h1>
        `;
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
        root.classList.remove('reveal-anim');
    });

    it('drops the reveal gate 2.5 s after start when GSAP never loads', () => {
        initReveals();

        vi.advanceTimersByTime(2400);
        expect(root.classList.contains('reveal-anim')).toBe(true);

        vi.advanceTimersByTime(200);
        expect(root.classList.contains('reveal-anim')).toBe(false);
    });

    it('keeps the gate and hands the reveals to GSAP when it loads in time', () => {
        const gsap = { registerPlugin: vi.fn(), set: vi.fn(), to: vi.fn() };
        const ScrollTrigger = { batch: vi.fn() };

        initReveals();
        vi.advanceTimersByTime(300);
        vi.stubGlobal('gsap', gsap);
        vi.stubGlobal('ScrollTrigger', ScrollTrigger);
        vi.advanceTimersByTime(5000);

        expect(root.classList.contains('reveal-anim')).toBe(true);
        expect(ScrollTrigger.batch).toHaveBeenCalledTimes(1);
        expect(gsap.to).toHaveBeenCalledTimes(1);
    });
});
