const rawBaseUrl = import.meta.env.PUBLIC_API_URL || '';
const BASE_URL = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

export interface AffiliateLink {
    id: string;
    label: string;
    url: string;
    network?: string;
    name?: string;
    cta_text?: string;
    image_url?: string;
    logo_url?: string;
    is_active?: boolean;
    sort_order?: number;
    clicks?: number;
    created_at?: string;
    updated_at?: string;
}

// View-model shape consumed by AffiliateCard.astro — the props the card needs,
// already normalized (tracked redirect URL, resolved network name, alt text).
export interface AffiliateCardVM {
    url: string;
    label: string;
    network: string;
    cta: string;
    image: string;
    logo: string;
    imageAlt: string;
}

export const affiliateService = {
    // Active affiliate links for the sponsored card, fetched at build time.
    // Non-critical: any failure (endpoint not yet deployed, network, etc.) returns
    // an empty list so the blog build never fails over an affiliate fetch.
    async getActive(): Promise<AffiliateLink[]> {
        try {
            const response = await fetch(`${BASE_URL}/affiliate-links/public`);
            if (!response.ok) throw new Error(`GET /affiliate-links/public failed with ${response.status}`);
            const data = await response.json();
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('Failed to fetch affiliate links:', error);
            return [];
        }
    },

    // Tracked redirect URL for a link — the backend counts the click then 302s to
    // the real destination. base should be PUBLIC_API_URL (no trailing slash).
    trackedUrl(id: string, base: string = BASE_URL): string {
        const b = base.endsWith('/') ? base.slice(0, -1) : base;
        return `${b}/affiliate-links/${id}/go`;
    },

    // Active links mapped to AffiliateCard props — tracked URL, resolved network
    // name, and derived alt text. Used by every page that renders a sponsored
    // card so the mapping lives in one place. Empty list on any failure.
    async getCards(apiUrl: string = BASE_URL): Promise<AffiliateCardVM[]> {
        const links = await this.getActive();
        return links.map((a) => {
            const network = a.name || a.network || '';
            return {
                url: this.trackedUrl(a.id, apiUrl),
                label: a.label,
                network,
                cta: a.cta_text || '',
                image: a.image_url || '',
                logo: a.logo_url || '',
                imageAlt: network ? `${network} — ${a.label}` : a.label,
            };
        });
    },
};
