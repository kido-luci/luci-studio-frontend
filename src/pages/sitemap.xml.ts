import type { APIRoute } from 'astro';
import { postService } from '../services/posts';
import { slugify } from '../utils/blog';

const SITE_URL = 'https://luci-studio.com';

export const GET: APIRoute = async () => {
    const posts = await postService.getAll();

    const staticPages = [
        { loc: `${SITE_URL}/`, lastmod: new Date().toISOString().split('T')[0], priority: '1.0', changefreq: 'weekly' },
    ];

    const postPages = posts.map(post => ({
        loc: `${SITE_URL}/blog/${slugify(post.title)}-${post.id}`,
        lastmod: new Date(post.updated_at).toISOString().split('T')[0],
        priority: '0.8',
        changefreq: 'monthly',
    }));

    const urls = [...staticPages, ...postPages]
        .map(({ loc, lastmod, priority, changefreq }) =>
            `  <url>
    <loc>${loc}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
        )
        .join('\n');

    return new Response(
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`,
        { headers: { 'Content-Type': 'application/xml; charset=utf-8' } }
    );
};
