import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { whenReady } from './whenReady';

// The timeout is wall-clock time. A main thread kept busy by other work (the
// homepage's WebGL scene) fires the 30 ms poll only a few times a second, so a
// timeout counted in polls stretched "2.5 s" to many seconds. These tests jump
// performance.now() between two polls to simulate that block.
describe('whenReady', () => {
    let now = 0;
    const blockMainThread = () => {
        vi.spyOn(performance, 'now').mockImplementation(() => now);
    };

    beforeEach(() => {
        vi.useFakeTimers();
        now = 0;
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    it('runs at once when the library is already there', () => {
        const run = vi.fn();
        whenReady(() => true, run, { timeoutMs: 2500, onTimeout: () => {} });
        expect(run).toHaveBeenCalledTimes(1);
    });

    it('times out on elapsed time when a blocked main thread delays the polls', () => {
        blockMainThread();
        const run = vi.fn();
        const onTimeout = vi.fn();
        whenReady(() => false, run, { timeoutMs: 2500, onTimeout });

        vi.advanceTimersByTime(30);
        expect(onTimeout).not.toHaveBeenCalled();

        now = 3000; // the next poll comes 3 s later
        vi.advanceTimersByTime(30);
        expect(onTimeout).toHaveBeenCalledTimes(1);
        expect(run).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1000); // and it stops polling
        expect(onTimeout).toHaveBeenCalledTimes(1);
    });

    it('still runs a library that arrived during the block, however late', () => {
        blockMainThread();
        let loaded = false;
        const run = vi.fn();
        const onTimeout = vi.fn();
        whenReady(() => loaded, run, { timeoutMs: 2500, onTimeout });

        vi.advanceTimersByTime(30);
        now = 3000;
        loaded = true;
        vi.advanceTimersByTime(30);

        expect(run).toHaveBeenCalledTimes(1);
        expect(onTimeout).not.toHaveBeenCalled();
    });

    it('times out after timeoutMs of steady polling', () => {
        const onTimeout = vi.fn();
        whenReady(() => false, () => {}, { timeoutMs: 2500, onTimeout });

        vi.advanceTimersByTime(2400);
        expect(onTimeout).not.toHaveBeenCalled();
        vi.advanceTimersByTime(200);
        expect(onTimeout).toHaveBeenCalledTimes(1);
    });

    it('keeps polling without a timeout', () => {
        let loaded = false;
        const run = vi.fn();
        whenReady(() => loaded, run);

        vi.advanceTimersByTime(60_000);
        expect(run).not.toHaveBeenCalled();
        loaded = true;
        vi.advanceTimersByTime(30);
        expect(run).toHaveBeenCalledTimes(1);
    });
});
