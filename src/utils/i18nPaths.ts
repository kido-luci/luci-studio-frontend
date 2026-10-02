// Shared getStaticPaths builders for the dynamic routes, so the English route
// (`src/pages/blog/[slug].astro`) and its Vietnamese counterpart
// (`src/pages/vi/blog/[slug].astro`) emit the SAME paths + props from one source.
// The slug is reused across locales (only the `/vi` prefix differs), so both
// route files call the same builder.
import { postService } from "../services/posts";
import { playlistService } from "../services/playlists";
import { buildPostSlug } from "./blog";

// postPaths: one path per post, props { post, related } — mirrors the original
// blog/[slug] getStaticPaths, including the fetch retry.
export async function postPaths() {
  const posts = await postService.getAll();

  // Retry per-post fetch — the build fires every detail call at once, and one
  // transient error (a dropped connection, a 5xx) should not cost the post.
  // getByID only throws in FAIL_FAST (prod) builds; there, once all 3 attempts
  // fail, the error propagates and fails the build on purpose: a post missing
  // from the build but still listed in the sitemap would be a 404 that falls
  // through to 404.astro's redirect-to-home.
  async function fetchPostWithRetry(id: string) {
    let lastErr: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await postService.getByID(id);
      } catch (err) {
        lastErr = err;
        console.error(`[getStaticPaths] post ${id} attempt ${attempt + 1}/3 failed:`, err);
        await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
      }
    }
    throw lastErr;
  }

  const results = await Promise.all(posts.map(async (summary) => {
    const post = await fetchPostWithRetry(summary.id);
    if (!post) return null;

    const related = posts
      .filter(p => p.id !== summary.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3);

    return {
      params: { slug: buildPostSlug(summary.title, summary.id) },
      props: { post, related },
    };
  }));
  return results.filter((r): r is NonNullable<typeof r> => r !== null);
}

// seriesPaths: one path per playlist, props { playlist } — mirrors the original
// blog/series/[slug] getStaticPaths, including the fetch retry and concurrency cap.
export async function seriesPaths() {
  const playlists = await playlistService.getAll();

  // Same policy as posts: getByID only throws in FAIL_FAST (prod) builds, and
  // there a series that fails all 3 attempts fails the build, because the
  // series index and blog rails would still link to the missing page.
  async function fetchPlaylistWithRetry(id: string) {
    let lastErr: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await playlistService.getByID(id);
      } catch (err) {
        lastErr = err;
        console.error(`[getStaticPaths] playlist ${id} attempt ${attempt + 1}/3 failed:`, err);
        if (attempt < 2) await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
      }
    }
    throw lastErr;
  }

  async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
    const results: R[] = new Array(items.length);
    let i = 0;
    const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (true) {
        const idx = i++;
        if (idx >= items.length) return;
        results[idx] = await fn(items[idx]);
      }
    });
    await Promise.all(workers);
    return results;
  }

  const results = await mapLimit(playlists, 4, async (summary) => {
    const playlist = await fetchPlaylistWithRetry(summary.id);
    if (!playlist) return null;
    return {
      params: { slug: buildPostSlug(summary.title, summary.id) },
      props: { playlist },
    };
  });
  return results.filter((r): r is NonNullable<typeof r> => r !== null);
}
