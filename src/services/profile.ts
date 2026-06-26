import { BASE_URL } from '../lib/apiClient';
import type { LocaleOverlay } from '../i18n';

export interface ProfileFact { label: string; value: string; }
export interface ProfileStat { number: number; suffix: string; label: string; sub: string; }
export interface ProfileLink { label: string; url: string; }

export interface Profile {
    hero_tagline: string;
    stat_pills: string[];
    tech_marquee: string[];
    bio_paragraphs: string[];
    story_facts: ProfileFact[];
    story_photo_url: string;
    story_location: string;
    portfolio_stats: ProfileStat[];
    contact_email: string;
    contact_phone: string;
    copyright: string;
    social_links: ProfileLink[];
    updated_at: string;
    translations?: LocaleOverlay | null;
}

let getProfilePromise: Promise<Profile | null> | null = null;

export const profileService = {
    async getProfile(): Promise<Profile | null> {
        if (getProfilePromise) return getProfilePromise;
        getProfilePromise = (async () => {
            try {
                const response = await fetch(`${BASE_URL}/profile`);
                if (!response.ok) throw new Error(`GET /profile failed with ${response.status}`);
                return await response.json();
            } catch (error) {
                console.error('Failed to fetch profile:', error);
                getProfilePromise = null;
                return null;
            }
        })();
        return getProfilePromise;
    },
};
