import { describe, expect, it } from 'vitest';
import { buildSeriesViews } from './series';
import type { Post } from '../services/posts';
import type { Playlist } from '../services/playlists';

function post(id: string, over: Partial<Post> = {}): Post {
    return {
        id,
        title: `Post ${id}`,
        content: '',
        views: 0,
        likes: 0,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
        ...over,
    };
}

function playlist(id: string, over: Partial<Playlist> = {}): Playlist {
    return {
        id,
        title: `Series ${id}`,
        description: '',
        post_ids: [],
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
        ...over,
    };
}

describe('buildSeriesViews', () => {
    it('sums views and likes across the series members', () => {
        const posts = [
            post('a', { views: 10, likes: 1 }),
            post('b', { views: 5, likes: 2 }),
            post('c', { views: 100, likes: 50 }),
        ];
        const [view] = buildSeriesViews([playlist('s', { post_ids: ['a', 'b'] })], posts);

        expect(view.totalViews).toBe(15);
        expect(view.totalLikes).toBe(3);
    });

    it('ignores post ids that are not in the post list', () => {
        const [view] = buildSeriesViews(
            [playlist('s', { post_ids: ['a', 'missing'] })],
            [post('a', { views: 7, likes: 3 })],
        );

        expect(view.totalViews).toBe(7);
        expect(view.totalLikes).toBe(3);
    });

    it('treats a missing post_ids list as an empty series', () => {
        const [view] = buildSeriesViews(
            [{ ...playlist('s'), post_ids: undefined as unknown as string[] }],
            [post('a', { views: 9 })],
        );

        expect(view.totalViews).toBe(0);
        expect(view.totalLikes).toBe(0);
        expect(view.topics).toEqual([]);
    });

    it('ranks topics by frequency and caps them at four', () => {
        const posts = [
            post('a', { topics: ['Flutter', 'Dart', 'Go'] }),
            post('b', { topics: ['Flutter', 'Dart', 'Rust'] }),
            post('c', { topics: ['Flutter', 'Astro'] }),
        ];
        const [view] = buildSeriesViews([playlist('s', { post_ids: ['a', 'b', 'c'] })], posts);

        expect(view.topics).toHaveLength(4);
        expect(view.topics[0]).toBe('Flutter'); // 3 occurrences
        expect(view.topics[1]).toBe('Dart');    // 2 occurrences
        expect(view.topics).not.toContain('Astro'); // 1 occurrence, past the cap
    });

    it('skips empty topic strings', () => {
        const [view] = buildSeriesViews(
            [playlist('s', { post_ids: ['a'] })],
            [post('a', { topics: ['', 'Go', ''] })],
        );

        expect(view.topics).toEqual(['Go']);
    });

    it('sorts series newest-first', () => {
        const views = buildSeriesViews(
            [
                playlist('old', { created_at: '2024-03-02T00:00:00Z' }),
                playlist('new', { created_at: '2026-07-01T00:00:00Z' }),
                playlist('mid', { created_at: '2025-01-01T00:00:00Z' }),
            ],
            [],
        );

        expect(views.map((v) => v.id)).toEqual(['new', 'mid', 'old']);
    });

    it('does not mutate the playlists it is given', () => {
        const playlists = [playlist('b', { created_at: '2024-01-01T00:00:00Z' }), playlist('a')];
        const order = playlists.map((p) => p.id);

        buildSeriesViews(playlists, []);

        expect(playlists.map((p) => p.id)).toEqual(order);
    });

    it('derives the year from created_at', () => {
        const [view] = buildSeriesViews([playlist('s', { created_at: '2025-11-30T23:00:00Z' })], []);

        expect(view.year).toBe(new Date('2025-11-30T23:00:00Z').getFullYear());
    });

    it('keeps the original playlist fields', () => {
        const [view] = buildSeriesViews(
            [playlist('s', { title: 'Flutter deep dives', description: 'A tour', cover_image_url: '/c.jpg' })],
            [],
        );

        expect(view.title).toBe('Flutter deep dives');
        expect(view.description).toBe('A tour');
        expect(view.cover_image_url).toBe('/c.jpg');
    });
});
