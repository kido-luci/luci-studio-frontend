// Web Storage access that never throws. Touching localStorage or
// sessionStorage throws a SecurityError when the browser blocks site data
// (Chrome "block all", Firefox or Safari "block all cookies"), and an uncaught
// throw during init stops everything after it in that module. Here a blocked
// read returns null and a blocked write or remove is skipped.
function guarded(area: () => Storage) {
    return {
        get(key: string): string | null {
            try { return area().getItem(key); } catch { return null; }
        },
        set(key: string, value: string): void {
            try { area().setItem(key, value); } catch { /* storage blocked */ }
        },
        remove(key: string): void {
            try { area().removeItem(key); } catch { /* storage blocked */ }
        },
    };
}

export const localStore = guarded(() => localStorage);
export const sessionStore = guarded(() => sessionStorage);
