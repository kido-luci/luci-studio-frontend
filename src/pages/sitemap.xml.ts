import type { APIRoute } from 'astro';
import { postService } from '../services/posts';
import { buildPostSlug } from '../utils/blog';

const SITE_URL = 'https://luci-studio.com';

function escapeXml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

interface UrlEntry {
    loc: string;
    lastmod?: string;
    priority: string;
    changefreq: string;
    image?: { loc: string; title: string };
}

export const GET: APIRoute = async () => {
    const posts = await postService.getAll();

    const staticPages: UrlEntry[] = [
        { loc: `${SITE_URL}/`, lastmod: new Date().toISOString().split('T')[0], priority: '1.0', changefreq: 'weekly' },
        { loc: `${SITE_URL}/blog/`, lastmod: new Date().toISOString().split('T')[0], priority: '0.9', changefreq: 'daily' },
        { loc: `${SITE_URL}/videos/`, lastmod: new Date().toISOString().split('T')[0], priority: '0.5', changefreq: 'monthly' },
        { loc: `${SITE_URL}/terms/`, lastmod: '2026-05-13', priority: '0.3', changefreq: 'yearly' },
        { loc: `${SITE_URL}/privacy/`, lastmod: '2026-05-13', priority: '0.3', changefreq: 'yearly' },
    ];

    const postPages: UrlEntry[] = posts.map(post => ({
        loc: `${SITE_URL}/blog/${buildPostSlug(post.title, post.id)}/`,
        lastmod: new Date(post.updated_at).toISOString().split('T')[0],
        priority: '0.8',
        changefreq: 'monthly',
        ...(post.cover_image_url ? { image: { loc: post.cover_image_url, title: post.title } } : {}),
    }));

    // Every page exists in English (root) and Vietnamese (/vi/). Emit both as
    // separate <url> entries, each cross-linking its alternates (+ x-default → en).
    const viOf = (loc: string) => loc.replace(SITE_URL, `${SITE_URL}/vi`);

    const altLinks = (enLoc: string, viLoc: string) =>
        `\n    <xhtml:link rel="alternate" hreflang="en" href="${escapeXml(enLoc)}"/>` +
        `\n    <xhtml:link rel="alternate" hreflang="vi" href="${escapeXml(viLoc)}"/>` +
        `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(enLoc)}"/>`;

    // Only the blog section is bilingual; every other URL is English-only.
    const isBilingualLoc = (loc: string) => loc.replace(SITE_URL, '').startsWith('/blog/');

    const urlBlock = (loc: string, e: UrlEntry, alt: string) =>
        `  <url>
    <loc>${escapeXml(loc)}</loc>${e.lastmod ? `\n    <lastmod>${e.lastmod}</lastmod>` : ''}
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>${e.image ? `\n    <image:image>\n      <image:loc>${escapeXml(e.image.loc)}</image:loc>\n      <image:title>${escapeXml(e.image.title)}</image:title>\n    </image:image>` : ''}${alt}
  </url>`;

    const urls = [...staticPages, ...postPages]
        .flatMap((e) => {
            const enLoc = e.loc;
            if (!isBilingualLoc(enLoc)) {
                return [urlBlock(enLoc, e, '')]; // English-only — no vi variant, no alternates
            }
            const viLoc = viOf(enLoc);
            const alt = altLinks(enLoc, viLoc);
            return [urlBlock(enLoc, e, alt), urlBlock(viLoc, e, alt)];
        })
        .join('\n');

    return new Response(
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>`,
        { headers: { 'Content-Type': 'application/xml; charset=utf-8' } }
    );
};
