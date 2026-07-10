import { BASE_URL } from '../lib/apiClient';

// Admin-managed Google AdSense config, baked in at build time. `enabled` is the
// global switch (false until the AdSense account is approved and turned on in
// /admin/ads); `units` are the manual ad slots keyed by placement.
export interface AdUnit {
    id: string;
    name: string;
    slot_id: string;
    placement: string;
    format: string;
    sort_order?: number;
}

export interface AdsConfig {
    enabled: boolean;
    publisher_id: string;
    units: AdUnit[];
}

const DISABLED: AdsConfig = { enabled: false, publisher_id: '', units: [] };

// Module-level cache: one GET /ads/config per build (Astro shares module state
// across all pages in a single build). Not cachedGetAll — the payload is an
// object, not an array.
let configPromise: Promise<AdsConfig> | null = null;

export const adsService = {
    // AdSense config for the static build. Non-critical: any failure (endpoint
    // not yet deployed, network, malformed payload) returns the disabled shape
    // so the blog build never fails — and renders zero ad markup.
    async getConfig(): Promise<AdsConfig> {
        if (configPromise) return configPromise;
        configPromise = (async () => {
            try {
                const response = await fetch(`${BASE_URL}/ads/config`);
                if (!response.ok) throw new Error(`GET /ads/config failed with ${response.status}`);
                const data = await response.json();
                if (!data || data.enabled !== true || !data.publisher_id) return DISABLED;
                return {
                    enabled: true,
                    publisher_id: String(data.publisher_id),
                    units: Array.isArray(data.units) ? data.units : [],
                };
            } catch (error) {
                console.error('Failed to fetch ads config:', error);
                configPromise = null;
                return DISABLED;
            }
        })();
        return configPromise;
    },
};
