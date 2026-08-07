import { describe, expect, it } from 'vitest';
import { buildLabCards } from './labCards';
import type { Project } from '../services/projects';

function project(over: Partial<Project> = {}): Project {
    return {
        id: '1',
        title: 'Thing',
        type: 'source',
        tech: [],
        links: [],
        display_order: 0,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
        ...over,
    };
}

const BARS = ['#16a394', '#3aa0ff', '#ec5a9b', '#6c4cf1'];

describe('buildLabCards', () => {
    it('splits projects by type and keeps nothing in the wrong bucket', () => {
        const { apps, sources } = buildLabCards([
            project({ id: 'a', type: 'app', title: 'App One' }),
            project({ id: 's', type: 'source', title: 'Source One' }),
        ]);
        expect(sources.map(s => s.title)).toEqual(['Source One']);
        expect(apps.map(a => a.name)).toEqual(['App One']);
    });

    it('returns empty groups for an empty input', () => {
        expect(buildLabCards([])).toEqual({ apps: [], sources: [] });
    });

    describe('source cards', () => {
        it('prefers the GitHub link over other links, whatever its position', () => {
            const [card] = buildLabCards([project({
                links: [
                    { label: 'Docs', url: 'https://example.com/docs' },
                    { label: 'Code', url: 'https://github.com/kido-luci/faldrop' },
                ],
            })]).sources;
            expect(card.url).toBe('https://github.com/kido-luci/faldrop');
            expect(card.owner).toBe('kido-luci');
            expect(card.name).toBe('faldrop');
            expect(card.preview).toBe('https://opengraph.githubassets.com/lab/kido-luci/faldrop');
            expect(card.host).toBe('github.com');
        });

        it('falls back to the first link when none is GitHub', () => {
            const [card] = buildLabCards([project({
                title: 'Some Tool',
                links: [{ label: 'Site', url: 'https://tools.example.com/x' }],
            })]).sources;
            expect(card.url).toBe('https://tools.example.com/x');
            expect(card.owner).toBeUndefined();
            expect(card.preview).toBeUndefined();
            expect(card.name).toBe('Some Tool');
            expect(card.host).toBe('tools.example.com');
        });

        it('uses the github.com host fallback when there is no link at all', () => {
            const [card] = buildLabCards([project({ links: [] })]).sources;
            expect(card.url).toBe('');
            expect(card.host).toBe('github.com');
        });

        it('strips a leading www. from the host', () => {
            const [card] = buildLabCards([project({
                links: [{ label: 'Site', url: 'https://www.example.com/x' }],
            })]).sources;
            expect(card.host).toBe('example.com');
        });
    });

    describe('app cards', () => {
        it('uses the first link and the app host fallback', () => {
            const { apps } = buildLabCards([
                project({ type: 'app', title: 'Alpha', links: [{ label: 'Open', url: 'https://alpha.example.com' }] }),
                project({ type: 'app', title: 'Beta', links: [] }),
            ]);
            expect(apps[0].host).toBe('alpha.example.com');
            expect(apps[1].host).toBe('app');
            expect(apps[1].url).toBe('');
        });

        it('prefers the logo but falls back to the cover image', () => {
            const { apps } = buildLabCards([
                project({ type: 'app', logo_url: 'logo.png', cover_image_url: 'cover.png' }),
                project({ type: 'app', cover_image_url: 'cover.png' }),
            ]);
            expect(apps[0].logo).toBe('logo.png');
            expect(apps[1].logo).toBe('cover.png');
            expect(apps[1].image).toBe('cover.png');
        });
    });

    describe('monogram', () => {
        const monogramOf = (title: string) =>
            buildLabCards([project({ title, links: [] })]).sources[0].monogram;

        it('takes the initial of each word-part, lowercased', () => {
            expect(monogramOf('Luci Studio')).toBe('ls');
            expect(monogramOf('some-cool-tool')).toBe('sct');
            expect(monogramOf('snake_case_name')).toBe('scn');
        });

        it('compresses more than three parts to first-two plus last', () => {
            expect(monogramOf('a-b-c-d')).toBe('abd');
            expect(monogramOf('one two three four five')).toBe('otf');
        });

        it('uses a single initial for a one-word name', () => {
            expect(monogramOf('Faldrop')).toBe('f');
        });

        // Only reachable when every part is filtered out — i.e. the name is nothing
        // but separators, so there is no initial to take.
        it('falls back to the first two characters when there are no word-parts', () => {
            expect(monogramOf('---')).toBe('--');
        });
    });

    it('cycles the bar colour independently per group', () => {
        const five = Array.from({ length: 5 }, (_, i) => project({ id: `s${i}`, title: `S${i}` }));
        const { sources } = buildLabCards(five);
        expect(sources.map(s => s.bar)).toEqual([...BARS, BARS[0]]);

        const mixed = buildLabCards([
            project({ id: 'a', type: 'app', title: 'A' }),
            project({ id: 's', type: 'source', title: 'S' }),
        ]);
        // Each group indexes from 0, so the first card of both takes BARS[0].
        expect(mixed.apps[0].bar).toBe(BARS[0]);
        expect(mixed.sources[0].bar).toBe(BARS[0]);
    });

    it('defaults description and tags rather than emitting undefined', () => {
        const [card] = buildLabCards([project({ description: undefined, tech: undefined as unknown as string[] })]).sources;
        expect(card.desc).toBe('');
        expect(card.tags).toEqual([]);
    });
});
