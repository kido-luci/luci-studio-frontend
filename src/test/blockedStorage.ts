// Tests only: make localStorage and sessionStorage throw on access, as they do
// when the browser blocks site data (Chrome "block all", Firefox or Safari
// "block all cookies"). Returns a function that puts the real ones back.
export function blockStorage(): () => void {
    const names = ['localStorage', 'sessionStorage'] as const;
    const saved = names.map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)] as const);
    for (const name of names) {
        Object.defineProperty(globalThis, name, {
            configurable: true,
            get() { throw new DOMException('The operation is insecure.', 'SecurityError'); },
        });
    }
    return () => {
        for (const [name, descriptor] of saved) {
            if (descriptor) Object.defineProperty(globalThis, name, descriptor);
            else delete (globalThis as Record<string, unknown>)[name];
        }
    };
}
