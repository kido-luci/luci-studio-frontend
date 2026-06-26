import { cachedGetAll } from '../lib/apiClient';
import type { LocaleOverlay } from '../i18n';

export interface ProjectLink {
    label: string;
    url: string;
}

export interface Project {
    id: string;
    title: string;
    type: 'source' | 'app';
    description?: string;
    year?: string;
    tech: string[];
    links: ProjectLink[];
    cover_image_url?: string;
    cover_image_key?: string;
    logo_url?: string;
    display_order: number;
    created_at: string;
    updated_at: string;
    translations?: LocaleOverlay | null;
}

const _getAll = cachedGetAll<Project>('/projects');

export const projectService = {
    getAll: _getAll,
};
