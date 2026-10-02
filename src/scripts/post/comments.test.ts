// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initComments } from './comments';
import { blockStorage } from '../../test/blockedStorage';

// The post page's comment thread. The commenter JWT is the security-relevant
// part (where it may come from, when it is dropped) and comment text is the XSS
// boundary, so both are pinned here alongside the composer behaviour. Tokens
// are hand-made (unsigned — the page never verifies the signature) and every
// request goes to a stubbed fetch.
const API = 'http://api.test';

const b64url = (s: string) => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const makeJwt = (claims: Record<string, unknown>) =>
    `${b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))}.${b64url(JSON.stringify(claims))}.sig`;
const nowSec = () => Math.floor(Date.now() / 1000);
const validToken = (sub = 'u1') => makeJwt({ sub, name: 'Alice', role: 'user', exp: nowSec() + 3600 });
const expiredToken = () => makeJwt({ sub: 'u1', name: 'Alice', role: 'user', exp: nowSec() - 60 });

function mountPage() {
    document.body.innerHTML = `
        <main data-post-id="p1" data-api-url="${API}">
            <div id="sign-in-prompt"><button id="google-sign-in-btn" type="button">Sign in</button></div>
            <div id="logged-in-area" class="hidden">
                <img id="user-avatar" alt="" style="display:none" />
                <div id="user-avatar-fallback" style="display:none"></div>
                <span id="user-name"></span>
                <form id="comment-form">
                    <div id="comment-input" contenteditable="true" data-empty="true"></div>
                    <button id="fmt-bold" type="button" class="fmt-btn">B</button>
                    <span id="char-count"></span>
                    <button id="sign-out-btn" type="button">Sign out</button>
                    <button type="submit">Submit</button>
                </form>
            </div>
            <span id="comment-count-badge" style="display:none"></span>
            <button id="sort-toggle" type="button"><span id="sort-label"></span></button>
            <div id="comment-list"><div id="comments-loading"><p>Loading…</p></div></div>
            <button id="load-more-comments" type="button" style="display:none"></button>
        </main>`;
}

function res(body: unknown, status = 200, headers: Record<string, string> = {}) {
    return {
        ok: status >= 200 && status < 300,
        status,
        headers: { get: (k: string) => headers[k] ?? null },
        json: async () => body,
        text: async () => '',
    };
}

function comment(over: Record<string, unknown> = {}) {
    return {
        id: 'c1',
        content: 'hello',
        created_at: new Date().toISOString(),
        user_id: 'u2',
        user: { id: over.user_id ?? 'u2', name: 'Bob' },
        likes: 2,
        dislikes: 0,
        ...over,
    };
}

function stubApi(list: unknown[], react: () => unknown = () => res({ user_reaction: 'like', likes: 3, dislikes: 0 })) {
    const fetchMock = vi.fn(async (url: string) => {
        if (url.startsWith(`${API}/posts/p1/comments?`)) {
            return res(list, 200, { 'X-Total-Count': String(list.length), 'X-Has-More': 'false' });
        }
        if (url.endsWith('/react')) return react();
        throw new Error(`unexpected fetch ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
}

function placeCaretAtEnd(el: HTMLElement) {
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(range);
}

function paste(el: HTMLElement, text: string) {
    const event = new Event('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'clipboardData', { value: { getData: (type: string) => (type === 'text/plain' ? text : '') } });
    el.dispatchEvent(event);
    return event;
}

const flush = () => new Promise(resolve => setTimeout(resolve, 0));
const isHidden = (id: string) => document.getElementById(id)!.classList.contains('hidden');

describe('initComments', () => {
    beforeEach(() => {
        localStorage.clear();
        history.replaceState(null, '', '/blog/post/');
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
        document.body.innerHTML = '';
    });

    describe('the commenter token', () => {
        it('stores a valid token from the URL fragment and strips it from the URL', () => {
            const token = validToken();
            history.replaceState(null, '', `/blog/post/?ref=x#user_token=${token}&tab=2`);
            stubApi([]);
            mountPage();
            initComments();

            expect(localStorage.getItem('user_token')).toBe(token);
            expect(location.search).toBe('?ref=x');
            expect(location.hash).toBe('#tab=2');
            expect(isHidden('logged-in-area')).toBe(false);
        });

        it('ignores a token passed in the query string', () => {
            history.replaceState(null, '', `/blog/post/?user_token=${validToken()}`);
            stubApi([]);
            mountPage();
            initComments();

            expect(localStorage.getItem('user_token')).toBeNull();
            expect(isHidden('sign-in-prompt')).toBe(false);
        });

        it('rejects an expired token from the fragment, but still strips it', () => {
            history.replaceState(null, '', `/blog/post/#user_token=${expiredToken()}`);
            stubApi([]);
            mountPage();
            initComments();

            expect(localStorage.getItem('user_token')).toBeNull();
            expect(location.hash).toBe('');
            expect(isHidden('logged-in-area')).toBe(true);
        });
    });

    // Blocked site data makes the token read throw; the thread must still load
    // (signed out) instead of sticking on "Loading…".
    it('still loads the thread, signed out, when storage is blocked', async () => {
        const fetchMock = stubApi([comment()]);
        mountPage();
        const restore = blockStorage();
        try {
            expect(() => initComments()).not.toThrow();
            await flush();
        } finally {
            restore();
        }

        expect(fetchMock).toHaveBeenCalled();
        expect(document.querySelector('[data-comment-id="c1"]')).not.toBeNull();
        expect(document.getElementById('comments-loading')).toBeNull();
        expect(isHidden('sign-in-prompt')).toBe(false);
    });

    it('renders a hostile name and comment body as text', async () => {
        stubApi([comment({
            user: { name: '<img src=x onerror=alert(1)>' },
            content: '<script>alert(1)</script> **bold**',
        })]);
        mountPage();
        initComments();
        await flush();

        const list = document.getElementById('comment-list')!;
        expect(list.querySelector('script')).toBeNull();
        expect(list.querySelector('img')).toBeNull();
        expect(list.textContent).toContain('<img src=x onerror=alert(1)>');
        expect(list.textContent).toContain('<script>alert(1)</script>');
        expect(list.querySelector('strong')?.textContent).toBe('bold');
    });

    describe('reactions', () => {
        it('reverts the optimistic count when the request fails', async () => {
            localStorage.setItem('user_token', validToken());
            stubApi([comment()], () => res({}, 500));
            mountPage();
            initComments();
            await flush();

            const btn = document.querySelector<HTMLButtonElement>('.react-btn[data-rtype="like"]')!;
            btn.click();
            expect(btn.querySelector('.like-count')!.textContent).toBe('3');
            await flush();
            expect(btn.querySelector('.like-count')!.textContent).toBe('2');
            expect(btn.disabled).toBe(false);
        });

        it('clears the token and shows the sign-in prompt on a 401', async () => {
            localStorage.setItem('user_token', validToken());
            stubApi([comment()], () => res({}, 401));
            mountPage();
            initComments();
            await flush();

            document.querySelector<HTMLButtonElement>('.react-btn[data-rtype="like"]')!.click();
            await flush();
            expect(localStorage.getItem('user_token')).toBeNull();
            expect(isHidden('sign-in-prompt')).toBe(false);
            expect(isHidden('logged-in-area')).toBe(true);
        });
    });

    it("shows the recall button only on the signed-in user's own comments", async () => {
        localStorage.setItem('user_token', validToken('u1'));
        stubApi([comment({ id: 'c1', user_id: 'u1' }), comment({ id: 'c2', user_id: 'u2' })]);
        mountPage();
        initComments();
        await flush();

        expect(document.querySelector('[data-comment-id="c1"] .recall-btn')).not.toBeNull();
        expect(document.querySelector('[data-comment-id="c2"] .recall-btn')).toBeNull();
    });

    it('shows no recall button when signed out', async () => {
        stubApi([comment({ id: 'c1', user_id: 'u1' })]);
        mountPage();
        initComments();
        await flush();

        expect(document.querySelector('.recall-btn')).toBeNull();
    });

    describe('the composers', () => {
        // Both composers must paste plain text only, turn Enter into a <br>, and
        // keep their character counter and empty-placeholder flag current.
        function exerciseComposer(input: HTMLElement, counter: HTMLElement) {
            expect(counter.textContent).toBe('0/500');

            placeCaretAtEnd(input);
            const pasted = paste(input, '<b>hi</b>');
            expect(pasted.defaultPrevented).toBe(true);
            expect(input.querySelector('b')).toBeNull();
            expect(input.textContent).toBe('<b>hi</b>');
            expect(counter.textContent).toBe('9/500');
            expect(input.dataset.empty).toBe('false');

            placeCaretAtEnd(input);
            const enter = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
            input.dispatchEvent(enter);
            expect(enter.defaultPrevented).toBe(true);
            expect(input.querySelector('br')).not.toBeNull();

            input.textContent = 'x'.repeat(500);
            input.dispatchEvent(new Event('input'));
            expect(counter.textContent).toBe('500/500');

            input.textContent = '';
            input.dispatchEvent(new Event('input'));
            expect(input.dataset.empty).toBe('true');
        }

        it('work in the main composer', async () => {
            localStorage.setItem('user_token', validToken());
            stubApi([]);
            mountPage();
            initComments();
            await flush();

            exerciseComposer(document.getElementById('comment-input')!, document.getElementById('char-count')!);
        });

        it('work in the reply composer', async () => {
            localStorage.setItem('user_token', validToken());
            stubApi([comment()]);
            mountPage();
            initComments();
            await flush();

            document.querySelector<HTMLButtonElement>('[data-comment-id="c1"] .reply-btn')!.click();
            exerciseComposer(
                document.querySelector<HTMLElement>('.reply-input')!,
                document.querySelector<HTMLElement>('.reply-char-count')!,
            );
        });
    });
});
