// Shared API client utilities for the service layer.
//
// BASE_URL: PUBLIC_API_URL with any trailing slash stripped, so services can
// safely append "/endpoint" without a double-slash.
//
// cachedGetAll: dedupes concurrent build-time callers into one network
// round-trip (Astro shares module state across all pages in a single build).
// The promise is cleared on error so a transient failure doesn't poison
// subsequent retries. Content endpoints that must fail the prod build instead
// of silently rendering empty pass { failFast: FAIL_FAST }.
//
// fetchOne: single-resource GET — 404 is a known empty state (null, no log);
// other failures log, then throw (failFast) or resolve null.
//
// cachedFetchOne: fetchOne deduped by path across build-time callers (the en
// and vi routes both read every post and series). A null or failed result is
// dropped from the cache, so a retry fetches again.

const rawBaseUrl = import.meta.env.PUBLIC_API_URL || '';
export const BASE_URL = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

// Prod builds fail fast on content-fetch errors (a broken backend should fail
// the build, not ship an empty site); ALLOW_EMPTY_POSTS=1 opts out locally.
export const FAIL_FAST = import.meta.env.PROD && import.meta.env.ALLOW_EMPTY_POSTS !== '1';

export function cachedGetAll<T>(path: string, opts: { failFast?: boolean } = {}): () => Promise<T[]> {
    let promise: Promise<T[]> | null = null;
    return async () => {
        if (promise) return promise;
        promise = (async () => {
            try {
                const response = await fetch(`${BASE_URL}${path}`);
                if (!response.ok) throw new Error(`GET ${path} failed with ${response.status}`);
                const data = await response.json();
                // Go encodes a nil slice as null, so null is an empty list. Any
                // other non-array (an error object, a wrapper) is a failure.
                if (data === null) return [];
                if (!Array.isArray(data)) throw new Error(`GET ${path} returned a non-array payload`);
                return data;
            } catch (error) {
                console.error(`Failed to fetch ${path}:`, error);
                promise = null;
                if (opts.failFast) throw error;
                return [];
            }
        })();
        return promise;
    };
}

export async function fetchOne<T>(path: string, opts: { failFast?: boolean } = {}): Promise<T | null> {
    try {
        const response = await fetch(`${BASE_URL}${path}`);
        if (response.status === 404) return null;
        if (!response.ok) throw new Error(`GET ${path} failed with ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`Failed to fetch ${path}:`, error);
        if (opts.failFast) throw error;
        return null;
    }
}

const fetchOneCache = new Map<string, Promise<unknown>>();

export function cachedFetchOne<T>(path: string, opts: { failFast?: boolean } = {}): Promise<T | null> {
    const cached = fetchOneCache.get(path);
    if (cached) return cached as Promise<T | null>;
    const promise = fetchOne<T>(path, opts).then(
        (data) => {
            if (data === null) fetchOneCache.delete(path);
            return data;
        },
        (error) => {
            fetchOneCache.delete(path);
            throw error;
        },
    );
    fetchOneCache.set(path, promise);
    return promise;
}
