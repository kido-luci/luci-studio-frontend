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

    const urls = [...staticPages, ...postPages]
        .map(({ loc, lastmod, priority, changefreq, image }) =>
            `  <url>
    <loc>${escapeXml(loc)}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>${image ? `\n    <image:image>\n      <image:loc>${escapeXml(image.loc)}</image:loc>\n      <image:title>${escapeXml(image.title)}</image:title>\n    </image:image>` : ''}
  </url>`
        )
        .join('\n');

    return new Response(
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls}\n</urlset>`,
        { headers: { 'Content-Type': 'application/xml; charset=utf-8' } }
    );
};
