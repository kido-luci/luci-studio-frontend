import type { Post } from '../services/posts';
import type { Playlist } from '../services/playlists';

export interface SeriesView extends Playlist {
  /** Sum of views across every post in the series. */
  totalViews: number;
  /** Sum of likes across every post in the series. */
  totalLikes: number;
  /** Up-to-4 most common topics across the series' posts (for tag pills). */
  topics: string[];
  /** Year the series was created (for the thumbnail pill). */
  year: number;
}

/**
 * Build the view-model for the Series cards shared by /blog/series, the home
 * page strip, and the /blog list strip. Aggregates per-series stats + topics
 * from the already-fetched post list (zero extra network cost) and sorts
 * newest-first. Callers can `.slice()` the result for a limited strip.
 */
export function buildSeriesViews(playlists: Playlist[], posts: Post[]): SeriesView[] {
  const byId = new Map(posts.map((p) => [p.id, p]));
  return [...playlists]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map((p) => {
      let totalViews = 0;
      let totalLikes = 0;
      const topicCounts = new Map<string, number>();
      for (const id of p.post_ids ?? []) {
        const post = byId.get(id);
        if (!post) continue;
        totalViews += post.views ?? 0;
        totalLikes += post.likes ?? 0;
        for (const t of post.topics ?? []) {
          if (t) topicCounts.set(t, (topicCounts.get(t) ?? 0) + 1);
        }
      }
      const topics = [...topicCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([t]) => t);
      return { ...p, totalViews, totalLikes, topics, year: new Date(p.created_at).getFullYear() };
    });
}
