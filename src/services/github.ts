// Helpers for the /lab Public Source cards.

// Parse "https://github.com/<owner>/<repo>" → { owner, repo }, else null.
// Used to build the GitHub social-preview (OG) image URL for repo cards.
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
