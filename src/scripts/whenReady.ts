// Deferred-CDN poll: GSAP & friends arrive via CDN <script> tags in Layout, so
// module scripts poll for the globals before wiring animations. `run` fires
// immediately when `ready()` is already truthy. Callers that must fail open if
// the CDN never arrives pass `timeoutMs` + `onTimeout` (e.g. un-hide content).
// timeoutMs is wall-clock time: a busy main thread (the homepage's WebGL scene)
// delays the polls but cannot stretch the wait. Each poll checks `ready()`
// first, so a library that arrives during a long block still runs.
export function whenReady(
    ready: () => unknown,
    run: () => void,
    opts: { timeoutMs?: number; onTimeout?: () => void } = {},
): void {
    if (ready()) {
        run();
        return;
    }
    const start = performance.now();
    const id = setInterval(() => {
        if (ready()) {
            clearInterval(id);
            run();
        } else if (opts.timeoutMs !== undefined && performance.now() - start >= opts.timeoutMs) {
            clearInterval(id);
            opts.onTimeout?.();
        }
    }, 30);
}
