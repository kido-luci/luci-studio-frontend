// Deferred-CDN poll: GSAP & friends arrive via CDN <script> tags in Layout, so
// module scripts poll for the globals before wiring animations. `run` fires
// immediately when `ready()` is already truthy. Callers that must fail open if
// the CDN never arrives pass `timeoutMs` + `onTimeout` (e.g. un-hide content).
// (Layout.astro's is:inline scripts keep their own copy — they can't import.)
export function whenReady(
    ready: () => unknown,
    run: () => void,
    opts: { timeoutMs?: number; onTimeout?: () => void } = {},
): void {
    if (ready()) {
        run();
        return;
    }
    let waited = 0;
    const id = setInterval(() => {
        if (ready()) {
            clearInterval(id);
            run();
        } else if (opts.timeoutMs !== undefined && (waited += 30) >= opts.timeoutMs) {
            clearInterval(id);
            opts.onTimeout?.();
        }
    }, 30);
}
