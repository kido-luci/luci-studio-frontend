import { cachedGetAll, FAIL_FAST } from '../lib/apiClient';
import type { LocaleOverlay } from '../i18n';

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
    translations?: LocaleOverlay | null;
}

const _getAll = cachedGetAll<SkillCategory>('/skills', { failFast: FAIL_FAST });

export const skillsService = {
    getAll: _getAll,
};
