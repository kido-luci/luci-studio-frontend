// Fixture API for CI builds. The static build fetches its posts, series and
// lists from PUBLIC_API_URL, and a prod build fails fast when that API is
// unreachable. CI used to build with ALLOW_EMPTY_POSTS=1 against no backend at
// all, which proved the site compiles but never rendered a post or a series
// page. This server stands in for the backend with a small fixed data set (two
// posts, one with a code block and a Vietnamese overlay, and one series) so the
// CI build renders real pages and tools/ci/smoke.mjs can check them.
//
// GET only and stateless. The other lists the build reads answer [], /profile
// answers 404 (the build treats a missing profile as empty), and
// /<resource>/<id> serves one post or series.
//
// Usage: node tools/ci/fixture-api.mjs [port]   (default 3000, listens on 127.0.0.1)
import http from 'node:http';
import { pathToFileURL } from 'node:url';

export const POSTS = [
    {
        id: '5f1c0a7e-0c1d-4e2f-9a3b-4c5d6e7f8a01',
        title: 'Fixture Post With Code',
        subtitle: 'A post that carries a fenced code block',
        content: [
            '# Fixture Post With Code',
            '',
            'A paragraph before the code.',
            '',
            '```go',
            'func main() {',
            '\tfmt.Println("hello")',
            '}',
            '```',
            '',
            'A paragraph after it.',
        ].join('\n'),
        topics: ['Go', 'Testing'],
        cover_image_url: '',
        views: 12,
        likes: 3,
        word_count: 18,
        created_at: '2026-01-10T09:00:00Z',
        updated_at: '2026-01-12T09:00:00Z',
        translations: {
            vi: {
                title: 'Bài mẫu có đoạn mã',
                subtitle: 'Một bài viết có khối mã',
                content: '# Bài mẫu có đoạn mã\n\nMột đoạn văn.\n\n```go\nfunc main() {}\n```',
            },
        },
    },
    {
        id: '7a2d1b8f-4e5f-4a6b-8c7d-9e0f1a2b3c02',
        title: 'Second Fixture Post',
        subtitle: 'Plain prose only',
        content: '# Second Fixture Post\n\nJust prose, so the lists hold more than one card.',
        topics: ['Flutter'],
        cover_image_url: '',
        views: 5,
        likes: 1,
        word_count: 12,
        created_at: '2026-01-05T09:00:00Z',
        updated_at: '2026-01-05T09:00:00Z',
        translations: null,
    },
];

export const SERIES = [
    {
        id: '9b3e2c9a-5f6a-4b7c-9d8e-0f1a2b3c4d03',
        title: 'Fixture Series',
        description: 'Both fixture posts, in reading order.',
        cover_image_url: '',
        post_ids: POSTS.map(p => p.id),
        created_at: '2026-01-11T09:00:00Z',
        updated_at: '2026-01-12T09:00:00Z',
        translations: null,
    },
];

const LISTS = {
    '/posts': POSTS,
    '/playlists': SERIES,
    '/gallery/public': [],
    '/skills': [],
    '/work': [],
    '/projects': [],
};

// The detail endpoints: a series comes back with its posts embedded, as the
// backend's GET /playlists/{id} does.
const ITEMS = {
    posts: id => POSTS.find(p => p.id === id),
    playlists: id => {
        const s = SERIES.find(x => x.id === id);
        return s && { ...s, posts: s.post_ids.map(pid => POSTS.find(p => p.id === pid)) };
    },
};

function handle(req, res) {
    const send = (status, body) => {
        res.writeHead(status, { 'content-type': 'application/json' });
        res.end(JSON.stringify(body));
    };
    if (req.method !== 'GET') return send(405, { error: 'the fixture API is read-only' });
    const pathname = new URL(req.url, 'http://fixture').pathname.replace(/\/+$/, '');
    if (pathname in LISTS) return send(200, LISTS[pathname]);
    const m = /^\/(posts|playlists)\/([^/]+)$/.exec(pathname);
    const item = m && ITEMS[m[1]](m[2]);
    if (item) return send(200, item);
    send(404, { error: 'not found' });
}

// Serve only when run directly; smoke.mjs imports the data above.
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
    const port = Number(process.argv[2] ?? 3000);
    http.createServer(handle).listen(port, '127.0.0.1', () => {
        console.log(`fixture-api listening on http://127.0.0.1:${port}`);
    });
}
