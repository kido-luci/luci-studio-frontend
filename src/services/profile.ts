import { fetchOne, FAIL_FAST } from '../lib/apiClient';
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
    // Build-time cached, and fails the prod build on fetch errors like the other
    // content services. A 404 (no profile yet) resolves null; a null result or a
    // failure is not cached, so a later caller fetches again.
    async getProfile(): Promise<Profile | null> {
        if (getProfilePromise) return getProfilePromise;
        getProfilePromise = fetchOne<Profile>('/profile', { failFast: FAIL_FAST }).then(
            (profile) => {
                if (!profile) getProfilePromise = null;
                return profile;
            },
            (error) => {
                getProfilePromise = null;
                throw error;
            },
        );
        return getProfilePromise;
    },
};
