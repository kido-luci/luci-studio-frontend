// Shared API client utilities for the service layer.
//
// BASE_URL: PUBLIC_API_URL with any trailing slash stripped, so services can
// safely append "/endpoint" without a double-slash.
//
// cachedGetAll: dedupes concurrent build-time callers into one network
// round-trip (Astro shares module state across all pages in a single build).
// The promise is cleared on error so a transient failure doesn't poison
// subsequent retries. Only for endpoints that are simple arrays, have no
// fail-fast/ALLOW_EMPTY_POSTS guard, and need no bespoke error handling.

const rawBaseUrl = import.meta.env.PUBLIC_API_URL || '';
export const BASE_URL = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

export function cachedGetAll<T>(path: string): () => Promise<T[]> {
    let promise: Promise<T[]> | null = null;
    return async () => {
        if (promise) return promise;
        promise = (async () => {
            try {
                const response = await fetch(`${BASE_URL}${path}`);
                if (!response.ok) throw new Error(`GET ${path} failed with ${response.status}`);
                const data = await response.json();
                return Array.isArray(data) ? data : (data || []);
            } catch (error) {
                console.error(`Failed to fetch ${path}:`, error);
                promise = null;
                return [];
            }
        })();
        return promise;
    };
}
