// Smoke check for the CI build, run after `npm run build` against
// tools/ci/fixture-api.mjs. Checks that each fixture post and its /vi/ copy
// and the fixture series page were rendered with the fixture titles, that the
// sitemap lists the posts, the series (en and vi) and the static pages, and
// that no built page carries an inline on*= event handler attribute
// (public/_headers sets script-src-attr 'none', so one would silently stop
// working in production).
//
// Usage: node tools/ci/smoke.mjs [distDir]   (default dist/client)
import fs from 'node:fs';
import path from 'node:path';
import { POSTS, SERIES } from './fixture-api.mjs';

const SITE = 'https://luci-studio.com';
const dist = path.resolve(process.argv[2] ?? 'dist/client');
const failures = [];
const fail = msg => failures.push(msg);

const read = rel => {
    const file = path.join(dist, rel);
    return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
};
const escapeHtml = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const titleTag = title => `<title>${escapeHtml(title)} | Luci Studio</title>`;
const subdirs = rel => {
    const dir = path.join(dist, rel);
    return fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name) : [];
};
// The directory under `rel` whose index.html has this page title.
const findPage = (rel, title) => subdirs(rel).find(slug => read(`${rel}/${slug}/index.html`)?.includes(titleTag(title)));

if (!fs.existsSync(dist)) {
    console.error(`smoke: ${dist} does not exist — run the build first`);
    process.exit(1);
}

const sitemap = read('sitemap.xml') ?? '';
if (!sitemap) fail('sitemap.xml is missing');

for (const post of POSTS) {
    const slug = findPage('blog', post.title);
    if (!slug) {
        fail(`no /blog/<slug>/ page has the title "${post.title}"`);
        continue;
    }
    if (!sitemap.includes(`<loc>${SITE}/blog/${slug}/</loc>`)) fail(`the sitemap does not list /blog/${slug}/`);
    const viTitle = post.translations?.vi?.title ?? post.title;
    if (!read(`vi/blog/${slug}/index.html`)?.includes(titleTag(viTitle))) {
        fail(`/vi/blog/${slug}/ is missing or lacks the title "${viTitle}"`);
    }
}

for (const series of SERIES) {
    const slug = findPage('blog/series', series.title);
    if (!slug) {
        fail(`no /blog/series/<slug>/ page has the title "${series.title}"`);
        continue;
    }
    if (!read(`vi/blog/series/${slug}/index.html`)) fail(`/vi/blog/series/${slug}/ is missing`);
    for (const loc of [`/blog/series/${slug}/`, `/vi/blog/series/${slug}/`]) {
        if (!sitemap.includes(`<loc>${SITE}${loc}</loc>`)) fail(`the sitemap does not list ${loc}`);
    }
}

for (const loc of ['/portfolio/', '/lab/', '/games/', '/license/', '/blog/series/', '/vi/blog/series/']) {
    if (!sitemap.includes(`<loc>${SITE}${loc}</loc>`)) fail(`the sitemap does not list ${loc}`);
}

// Pages that leave out `canonical` inherit the homepage's, which tells search
// engines they are duplicates of `/`.
for (const page of ['portfolio', 'lab', 'games', 'videos']) {
    const canonical = read(`${page}/index.html`)?.match(/<link rel="canonical" href="([^"]*)"/)?.[1];
    if (canonical !== `${SITE}/${page}/`) fail(`/${page}/ has canonical ${canonical ?? '(none)'}, not ${SITE}/${page}/`);
}

// Inline event handlers: scan the attributes of every tag in every page.
// Script and style bodies and comments are dropped first, so code or text that
// merely mentions "onclick=" cannot trip the check.
const TAG = /<[a-zA-Z][\w:-]*((?:\s+[^\s"'>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*)\s*\/?>/g;
const ATTR = /([^\s"'>/=]+)(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?/g;
const htmlFiles = fs.readdirSync(dist, { recursive: true }).filter(f => f.endsWith('.html'));
for (const rel of htmlFiles) {
    const html = fs.readFileSync(path.join(dist, rel), 'utf8')
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/(<(script|style)\b[^>]*>)[\s\S]*?(<\/\2>)/gi, '$1$3');
    const handlers = new Set();
    for (const [, attrs] of html.matchAll(TAG)) {
        for (const [, name] of attrs.matchAll(ATTR)) if (/^on[a-z]+$/i.test(name)) handlers.add(name.toLowerCase());
    }
    if (handlers.size) fail(`${rel} has inline event handler attributes: ${[...handlers].join(', ')}`);
}

if (!htmlFiles.length) fail('the build produced no HTML');

if (failures.length) {
    console.error(`smoke: ${failures.length} check(s) failed\n${failures.map(f => `  - ${f}`).join('\n')}`);
    process.exit(1);
}
console.log(`smoke: OK — ${POSTS.length} posts, ${SERIES.length} series, ${htmlFiles.length} pages checked`);
