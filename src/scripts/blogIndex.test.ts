// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initBlogIndex } from './blogIndex';

// /blog filtering and pagination run entirely client-side over the post items
// the page renders, so the fixture below mirrors BlogIndexPage.astro's ids and
// data attributes. The first post is the featured one, as on the real page.
interface FixturePost { id: string; title: string; topics: string[] }

function makePosts(n: number): FixturePost[] {
    return Array.from({ length: n }, (_, i) => ({
        id: `p${i}`,
        title: i === 7 ? 'Flutter state tips' : `Post ${i}`,
        // p4 spells its topic in lower case: the topic filter ignores case.
        topics: i === 4 ? ['go'] : i % 2 === 0 ? ['Go'] : ['Flutter'],
    }));
}

function mountIndex(posts: FixturePost[]) {
    document.body.innerHTML = `
        <main class="bp-blog" data-api-url="">
            <div id="tb-count">${posts.length}</div>
            <input id="tb-search" type="text" />
            <div id="topic-filters">
                <button class="topic-btn active-filter" data-topic="all">All</button>
                <button class="topic-btn" data-topic="Go">Go</button>
                <button class="topic-btn" data-topic="Flutter">Flutter</button>
            </div>
            <button id="chips-toggle" type="button" hidden></button>
            <a id="tb-featured" href="/blog/x/" data-featured-id="${posts[0].id}"></a>
            <div id="empty-state" class="hidden"><button id="tb-clear">Clear</button></div>
            <div id="posts-grid">
                ${posts.map(p => `
                    <div class="post-item" data-id="${p.id}" data-topics='${JSON.stringify(p.topics)}'
                        data-search="${`${p.title} ${p.topics.join(' ')}`.toLowerCase()}" style="display:none">
                        <article class="tb-card"></article>
                    </div>`).join('')}
            </div>
            <div id="pagination" class="hidden" data-showing-tpl="Showing {from}–{to} of {total}" data-featured-suffix=" + featured">
                <button id="prev-btn"></button>
                <div id="page-numbers"></div>
                <button id="next-btn"></button>
                <p id="posts-count"></p>
            </div>
        </main>`;
}

const visibleIds = () => Array.from(document.querySelectorAll<HTMLElement>('.post-item'))
    .filter(el => el.style.display !== 'none')
    .map(el => el.dataset.id);
const featuredShown = () => document.getElementById('tb-featured')!.style.display !== 'none';
const postsCount = () => document.getElementById('posts-count')!.textContent;
const click = (selector: string) => document.querySelector<HTMLElement>(selector)!.click();

function search(text: string) {
    const input = document.getElementById('tb-search') as HTMLInputElement;
    input.value = text;
    input.dispatchEvent(new Event('input'));
}

describe('initBlogIndex', () => {
    beforeEach(() => {
        vi.stubGlobal('scrollTo', vi.fn());
        mountIndex(makePosts(20));
        initBlogIndex();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        document.body.innerHTML = '';
    });

    it('pages hold 9 posts, and the featured post shows only on page 1 of the default view', () => {
        expect(visibleIds()).toEqual(['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9']);
        expect(featuredShown()).toBe(true);
        expect(document.getElementById('page-numbers')!.querySelectorAll('button')).toHaveLength(3);
        expect(postsCount()).toBe('Showing 1–9 of 19 + featured');

        click('#next-btn');
        expect(visibleIds()).toEqual(['p10', 'p11', 'p12', 'p13', 'p14', 'p15', 'p16', 'p17', 'p18']);
        expect(featuredShown()).toBe(false);
        expect(postsCount()).toBe('Showing 10–18 of 19');

        click('#next-btn');
        expect(visibleIds()).toEqual(['p19']);
        expect((document.getElementById('next-btn') as HTMLButtonElement).disabled).toBe(true);
    });

    it('filters by topic, ignoring case, and drops the featured post', () => {
        click('.topic-btn[data-topic="Go"]');

        expect(visibleIds()).toEqual(['p0', 'p2', 'p4', 'p6', 'p8', 'p10', 'p12', 'p14', 'p16']);
        expect(featuredShown()).toBe(false);
        expect(document.getElementById('tb-count')!.textContent).toBe('10');
        expect(document.querySelector('.topic-btn[data-topic="Go"]')!.classList.contains('active-filter')).toBe(true);
        expect(document.querySelector('.topic-btn[data-topic="all"]')!.classList.contains('active-filter')).toBe(false);
    });

    it('filters by search text and drops the featured post', () => {
        search('  State Tips ');

        expect(visibleIds()).toEqual(['p7']);
        expect(featuredShown()).toBe(false);
        expect(document.getElementById('pagination')!.style.display).toBe('none');
    });

    it('shows the empty state when nothing matches, and Clear resets the view', () => {
        click('.topic-btn[data-topic="Flutter"]');
        search('zzz');

        expect(visibleIds()).toEqual([]);
        expect(document.getElementById('empty-state')!.classList.contains('hidden')).toBe(false);
        expect(document.getElementById('pagination')!.style.display).toBe('none');
        expect(postsCount()).toBe('');

        click('#tb-clear');
        expect(document.getElementById('empty-state')!.classList.contains('hidden')).toBe(true);
        expect((document.getElementById('tb-search') as HTMLInputElement).value).toBe('');
        expect(visibleIds()).toHaveLength(9);
        expect(featuredShown()).toBe(true);
        expect(document.querySelector('.topic-btn[data-topic="all"]')!.classList.contains('active-filter')).toBe(true);
    });
});
