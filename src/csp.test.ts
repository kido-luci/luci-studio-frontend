import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// The Content-Security-Policy lives in public/_headers, which only Workers
// static assets apply: `npm run dev` and `npm run preview` serve no CSP, so a
// CDN file the policy does not allow, or an inline handler it blocks, would
// only break in production. These checks hold the policy against the source.
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SRC = join(ROOT, 'src');
const CDN_HOSTS = ['cdn.jsdelivr.net', 'cdnjs.cloudflare.com'];

function readPolicy(): Record<string, string[]> {
    const headers = readFileSync(join(ROOT, 'public/_headers'), 'utf8');
    const line = headers.split('\n').find(l => l.trim().startsWith('Content-Security-Policy:'));
    if (!line) throw new Error('public/_headers has no Content-Security-Policy');
    const policy: Record<string, string[]> = {};
    for (const directive of line.trim().slice('Content-Security-Policy:'.length).split(';')) {
        const [name, ...sources] = directive.trim().split(/\s+/);
        if (name) policy[name] = sources;
    }
    return policy;
}

// CSP source matching for the https URL sources this policy uses: the host
// must match; a source path ending in "/" allows every path under it, any other
// path must match exactly, and a source without a path allows every path.
function allows(sources: string[], url: string): boolean {
    const target = new URL(url);
    return sources.some(source => {
        if (!source.startsWith('https://')) return false;
        const { host, pathname } = new URL(source);
        if (host !== target.host) return false;
        if (pathname === '/') return true;
        return pathname.endsWith('/') ? target.pathname.startsWith(pathname) : target.pathname === pathname;
    });
}

const sourceFiles = (readdirSync(SRC, { recursive: true }) as string[])
    .map(f => join(SRC, f))
    .filter(f => /\.(astro|ts|css)$/.test(f) && !f.endsWith('.test.ts'));

// Every external script and stylesheet the .astro files load.
function externalAssets() {
    const scripts: string[] = [];
    const styles: string[] = [];
    for (const file of sourceFiles.filter(f => f.endsWith('.astro'))) {
        const text = readFileSync(file, 'utf8');
        for (const [, src] of text.matchAll(/<script\b[^>]*\bsrc="(https:\/\/[^"]+)"/g)) scripts.push(src);
        for (const [tag] of text.matchAll(/<link\b[^>]*>/g)) {
            const href = /\bhref="(https:\/\/[^"]+)"/.exec(tag)?.[1];
            if (href && /\brel="stylesheet"/.test(tag)) styles.push(href);
        }
    }
    return { scripts, styles };
}

describe('Content-Security-Policy (public/_headers)', () => {
    const policy = readPolicy();

    it('pins the CDN sources to paths instead of whole hosts', () => {
        const hostOnly = ['script-src', 'style-src'].flatMap(name =>
            (policy[name] ?? []).filter(source => {
                if (!source.startsWith('https://')) return false;
                const { host, pathname } = new URL(source);
                return CDN_HOSTS.includes(host) && pathname === '/';
            }).map(source => `${name} ${source}`));
        expect(hostOnly).toEqual([]);
    });

    it('allows every external script and stylesheet the pages load', () => {
        const { scripts, styles } = externalAssets();
        expect(scripts.length).toBeGreaterThan(0);
        expect(styles.length).toBeGreaterThan(0);
        expect(scripts.filter(url => !allows(policy['script-src'] ?? [], url))).toEqual([]);
        expect(styles.filter(url => !allows(policy['style-src'] ?? [], url))).toEqual([]);
    });

    it('blocks inline event handler attributes', () => {
        expect(policy['script-src-attr']).toEqual(["'none'"]);
    });

    it('matches no inline event handler attribute left in src', () => {
        const handlers = sourceFiles.flatMap(file =>
            [...readFileSync(file, 'utf8').matchAll(/\son[a-z]+\s*=(?!=)/g)]
                .map(m => `${relative(ROOT, file)}: ${m[0].trim()}`));
        expect(handlers).toEqual([]);
    });
});
