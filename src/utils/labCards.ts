// Maps the backend `projects` entity into RepoCard props for the editorial
// cards used on both /lab and the homepage LAB section. Keeping the mapping in
// one place ensures the two surfaces stay in sync.
import { parseGitHub } from '../services/github';
import type { Project } from '../services/projects';

const BARS = ['#16a394', '#3aa0ff', '#ec5a9b', '#6c4cf1'];

// Short lowercase monogram from a repo/app name (initials of word-parts, max 3).
function monogram(name: string): string {
  const parts = name.split(/[-_\s]+/).filter(Boolean);
  let initials = parts.map((p) => p[0]).join('');
  if (initials.length > 3) initials = initials.slice(0, 2) + initials.slice(-1);
  return (initials || name.slice(0, 2)).toLowerCase();
}

function hostOf(url: string, fallback: string): string {
  try {
    if (url) return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    /* ignore malformed URLs */
  }
  return fallback;
}

export interface LabCard {
  url: string;
  name: string;
  title?: string;
  owner?: string;
  monogram: string;
  bar: string;
  logo?: string;
  preview?: string;
  image?: string;
  desc: string;
  tags: string[];
  stats?: { n: string | number; label: string }[];
  host: string;
}

// Build the two card groups. Source repos lead with their GitHub social-preview
// (OG) banner — no fetch needed, it already carries stars/forks/language. Apps
// lead with their uploaded cover image.
export function buildLabCards(projects: Project[]): { apps: LabCard[]; sources: LabCard[] } {
  const sources = projects
    .filter((p) => p.type === 'source')
    .map((p, i) => {
      const link = (p.links || []).find((l) => /github\.com/i.test(l.url)) ?? (p.links || [])[0];
      const url = link?.url ?? '';
      const gh = parseGitHub(url);
      return {
        url,
        owner: gh?.owner,
        name: gh ? gh.repo : p.title,
        title: p.title,
        monogram: monogram(gh ? gh.repo : p.title),
        bar: BARS[i % BARS.length],
        logo: p.logo_url || undefined,
        preview: gh ? `https://opengraph.githubassets.com/lab/${gh.owner}/${gh.repo}` : undefined,
        desc: p.description || '',
        tags: Array.isArray(p.tech) ? p.tech : [],
        host: hostOf(url, 'github.com'),
      };
    });

  const apps = projects
    .filter((p) => p.type === 'app')
    .map((p, i) => {
      const link = (p.links || [])[0];
      const url = link?.url ?? '';
      return {
        url,
        name: p.title,
        monogram: monogram(p.title),
        bar: BARS[i % BARS.length],
        logo: p.logo_url || p.cover_image_url || undefined,
        image: p.cover_image_url || undefined,
        desc: p.description || '',
        tags: Array.isArray(p.tech) ? p.tech : [],
        stats: [],
        host: hostOf(url, 'app'),
      };
    });

  return { apps, sources };
}
