// Build-time GitHub stats for /lab repo cards. Fetched once per repo (deduped),
// with graceful fallback to nulls on error / rate-limit so the build never fails.
// Set GITHUB_TOKEN in the env to raise the unauthenticated 60 req/hr limit.

export interface RepoStats {
  stars: number | null;
  forks: number | null;
  issues: number | null;
  contributors: number | null;
}

const EMPTY: RepoStats = { stars: null, forks: null, issues: null, contributors: null };

const cache = new Map<string, Promise<RepoStats>>();

function headers(): Record<string, string> {
  const h: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'luci-web-blog-lab',
  };
  const token = import.meta.env.GITHUB_TOKEN;
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

// Contributor count = last page number of the paginated contributors list.
async function fetchContributors(owner: string, repo: string): Promise<number | null> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contributors?per_page=1&anon=true`,
      { headers: headers() },
    );
    if (!res.ok) return null;
    const link = res.headers.get('link');
    if (link) {
      const m = link.match(/[?&]page=(\d+)>;\s*rel="last"/);
      if (m) return parseInt(m[1], 10);
    }
    const data = await res.json();
    return Array.isArray(data) ? data.length : null;
  } catch {
    return null;
  }
}

export function getRepoStats(owner: string, repo: string): Promise<RepoStats> {
  const key = `${owner}/${repo}`.toLowerCase();
  const hit = cache.get(key);
  if (hit) return hit;

  const promise = (async (): Promise<RepoStats> => {
    try {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: headers(),
      });
      if (!res.ok) return EMPTY;
      const data = await res.json();
      const contributors = await fetchContributors(owner, repo);
      return {
        stars: typeof data.stargazers_count === 'number' ? data.stargazers_count : null,
        forks: typeof data.forks_count === 'number' ? data.forks_count : null,
        issues: typeof data.open_issues_count === 'number' ? data.open_issues_count : null,
        contributors,
      };
    } catch {
      return EMPTY;
    }
  })();

  cache.set(key, promise);
  return promise;
}

// Parse "https://github.com/<owner>/<repo>" → { owner, repo }, else null.
export function parseGitHub(url: string): { owner: string; repo: string } | null {
  try {
    const u = new URL(url);
    if (!/(^|\.)github\.com$/i.test(u.hostname)) return null;
    const parts = u.pathname.split('/').filter(Boolean);
    if (parts.length < 2) return null;
    return { owner: parts[0], repo: parts[1].replace(/\.git$/, '') };
  } catch {
    return null;
  }
}
