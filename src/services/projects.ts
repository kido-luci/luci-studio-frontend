const rawBaseUrl = import.meta.env.PUBLIC_API_URL || '';
const BASE_URL = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

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
}

let getAllPromise: Promise<Project[]> | null = null;

export const projectService = {
    async getAll(): Promise<Project[]> {
        if (getAllPromise) return getAllPromise;
        getAllPromise = (async () => {
            try {
                const response = await fetch(`${BASE_URL}/projects`);
                if (!response.ok) throw new Error(`GET /projects failed with ${response.status}`);
                const data = await response.json();
                return Array.isArray(data) ? data : (data || []);
            } catch (error) {
                console.error('Failed to fetch projects:', error);
                getAllPromise = null;
                return [];
            }
        })();
        return getAllPromise;
    },
};
