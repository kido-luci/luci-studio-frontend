import { cachedGetAll } from '../lib/apiClient';

export interface SkillCategory {
    id: string;
    name: string;
    accent_color: string;
    description?: string;
    items: string[];
    wide: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

const _getAll = cachedGetAll<SkillCategory>('/skills');

export const skillsService = {
    getAll: _getAll,
};
