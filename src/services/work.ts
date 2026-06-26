import { cachedGetAll } from '../lib/apiClient';

export interface WorkLink {
    label: string;
    url: string;
}

export interface WorkItem {
    id: string;
    title: string;
    category: 'paid' | 'indie';
    featured: boolean;
    period: string;
    role?: string;
    company?: string;
    location?: string;
    summary?: string;
    card_description?: string;
    achievements: string[];
    tech: string[];
    links: WorkLink[];
    card_image_url?: string;
    logo_url?: string;
    display_order: number;
    created_at: string;
    updated_at: string;
}

const _getAll = cachedGetAll<WorkItem>('/work');

export const workService = {
    getAll: _getAll,
};
