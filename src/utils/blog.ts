export function calculateReadTime(content: string): string {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min`;
}

export function calculateReadTimeFromWordCount(wordCount?: number): string {
    if (!wordCount || wordCount < 1) return '1 min';
    return `${Math.ceil(wordCount / 200)} min`;
}

export function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

// Gradient cover fallback shown behind the real image (visible if it's missing/fails).
// Keyed by topic tag; falls back to the brand violet pair.
export function coverGradient(tag: string): string {
    const map: Record<string, [string, string]> = {
        Flutter: ['#2a6fdb', '#5b8def'], Dart: ['#0a8f86', '#1bbba8'], 'Claude Code': ['#d2693f', '#e89a6b'],
        'Firebase Test Lab': ['#df942b', '#f3c45e'], 'Share Links': ['#3b82c4', '#62a8e0'],
        'State Management': ['#6d4bd8', '#9b7cf0'], 'Google Map': ['#2e9e5b', '#5bc47f'],
        'Project Structure': ['#5147c9', '#867cf0'], 'Router Generator': ['#7b54d6', '#a98ef0'],
        'Offline First': ['#1f8a8a', '#37bcae'], 'Dependency Injection': ['#8a4fd0', '#b07ce8'],
        AI: ['#d2693f', '#e89a6b'], Go: ['#0a8f86', '#1bbba8'],
    };
    const [a, b] = map[tag] ?? ['#5147c9', '#867cf0'];
    return `radial-gradient(circle at 78% 20%, rgba(255,255,255,.22), transparent 46%), linear-gradient(135deg, ${a}, ${b})`;
}

const CALLOUT_STYLES: Record<string, { color: string; bg: string; label: string }> = {
    NOTE:      { color: '#3b82f6', bg: 'rgba(59,130,246,0.08)',  label: 'ℹ Note' },
    TIP:       { color: '#10b981', bg: 'rgba(16,185,129,0.08)',  label: '💡 Tip' },
    IMPORTANT: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', label: '⚡ Important' },
    WARNING:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', label: '⚠️ Warning' },
    CAUTION:   { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',  label: '🚫 Caution' },
    AFFILIATE: { color: '#0ea5e9', bg: 'rgba(14,165,233,0.08)', label: '🔗 Affiliate disclosure' },
};

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

const UNSAFE_URL = /^(javascript|data|vbscript|file):/i;
const SAFE_LANGUAGE = /[^A-Za-z0-9_+-]/g;

function safeImgSrc(url: string): string {
    return UNSAFE_URL.test(url) ? '#' : url;
}

function safeLinkHref(url: string): string {
    if (UNSAFE_URL.test(url)) return '#';
    return (url.startsWith('http') || url.startsWith('/') || url.startsWith('#')) ? url : '#';
}

// Affiliate / sponsored link domains. A markdown link to one of these hosts
// (or any subdomain) renders with rel="sponsored" — required by Google for
// paid/affiliate links. Empty by default: add networks when one is joined,
// e.g. 'amzn.to', 'amazon.com', 'accesstrade.vn'.
export const AFFILIATE_DOMAINS: string[] = [];

// Exported + domains param defaulted so tests can inject a list without
// mutating the module-level config.
export function isAffiliateUrl(url: string, domains: string[] = AFFILIATE_DOMAINS): boolean {
    if (domains.length === 0) return false;
    let host: string;
    try {
        host = new URL(url, 'https://luci-studio.com').hostname.toLowerCase();
    } catch { return false; }
    return domains.some(d => host === d || host.endsWith('.' + d));
}

// rel for an outbound markdown link. Affiliate links additionally get
// "sponsored nofollow"; everything else keeps the existing safety pair.
function linkRel(url: string): string {
    return isAffiliateUrl(url)
        ? 'sponsored nofollow noopener noreferrer'
        : 'noopener noreferrer';
}

function applyInlineMarkdown(text: string): string {
    return text
        .replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/gim, '<em>$1</em>')
        .replace(/`(.*?)`/gim, '<code>$1</code>')
        .replace(/!\[(.*?)\]\((.*?)\)/gim, (_, alt, url) => {
            return `<img src="${safeImgSrc(url)}" alt="${alt}" style="max-width:100%; border-radius:0.75rem; margin:1.5rem 0;" />`;
        })
        .replace(/\[(.*?)\]\((.*?)\)/gim, (_, label, url) => {
            return `<a href="${safeLinkHref(url)}" target="_blank" rel="${linkRel(url)}">${label}</a>`;
        });
}

function parseTableRow(line: string): string[] {
    return line
        .trim()
        .replace(/^\|/, '')
        .replace(/\|[ \t]*$/, '')
        .split('|')
        .map(c => c.trim());
}

export function formatMarkdown(text: string) {
    const codeBlocks: string[] = [];
    const blockquotes: string[] = [];
    const tables: string[] = [];
    let processedText = text;

    // 1. Extract fenced code blocks → placeholders (escape content inside)
    processedText = processedText.replace(/```(.*?)\r?\n([\s\S]*?)```/gim, (_, lang, code) => {
        const index = codeBlocks.length;
        const safeLang = escapeHtml(lang.trim().replace(SAFE_LANGUAGE, ''));
        codeBlocks.push(
            `<div class="code-block-container"><pre><code class="language-${safeLang}">${escapeHtml(code)}</code></pre></div>`
        );
        return `__CODE_BLOCK_${index}__`;
    });

    // 2. Extract blockquotes/callouts BEFORE HTML escaping so `>` is still raw.
    //    Matches one or more consecutive `> ...` lines (including blank `>` lines).
    processedText = processedText.replace(/^((?:>[^\n]*\n?)+)/gim, (match) => {
        const lines = match.split('\n').filter(l => /^>/.test(l));
        const contents = lines.map(l => l.replace(/^>\s?/, ''));

        const firstLineMatch = contents[0]?.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION|AFFILIATE)\]\s*(.*)?$/i);
        const calloutType = firstLineMatch?.[1]?.toUpperCase();
        const index = blockquotes.length;

        if (calloutType && CALLOUT_STYLES[calloutType]) {
            const { color, bg } = CALLOUT_STYLES[calloutType];
            const inlineRest = firstLineMatch?.[2]?.trim() ?? '';
            const remainingLines = contents.slice(1).join('\n').trim();
            const rawBody = [inlineRest, remainingLines].filter(Boolean).join('\n');
            const body = applyInlineMarkdown(escapeHtml(rawBody));
            blockquotes.push(
                `<div style="border-left:4px solid ${color};background:${bg};padding:0.875rem 1.25rem;border-radius:0 0.5rem 0.5rem 0;margin:1.5rem 0;">` +
                `<div style="font-size:0.95rem;">${body}</div>` +
                `</div>`
            );
        } else {
            const body = applyInlineMarkdown(escapeHtml(contents.join('\n').trim()));
            blockquotes.push(`<blockquote>${body}</blockquote>`);
        }

        return `__BLOCKQUOTE_${index}__\n`;
    });

    // 3. Extract GFM tables → placeholders. Header row, separator row (dashes /
    //    optional colons for alignment), then zero or more body rows. Pipes must
    //    lead and trail each row. Done before HTML escaping so `|` stays raw.
    processedText = processedText.replace(
        /^[ \t]*\|.+\|[ \t]*\r?\n[ \t]*\|[ \t]*:?-+:?[ \t]*(?:\|[ \t]*:?-+:?[ \t]*)*\|[ \t]*\r?\n(?:[ \t]*\|.*\|[ \t]*\r?\n?)*/gim,
        (match) => {
            const rows = match.trim().split(/\r?\n/);
            const aligns = parseTableRow(rows[1]).map(s => {
                const left = s.startsWith(':');
                const right = s.endsWith(':');
                if (left && right) return 'center';
                if (right) return 'right';
                if (left) return 'left';
                return '';
            });
            const cell = (c: string) => applyInlineMarkdown(escapeHtml(c));
            const attr = (i: number) => (aligns[i] ? ` style="text-align:${aligns[i]}"` : '');

            const thead = '<thead><tr>' +
                parseTableRow(rows[0]).map((c, i) => `<th${attr(i)}>${cell(c)}</th>`).join('') +
                '</tr></thead>';
            const tbody = '<tbody>' +
                rows.slice(2).map(r =>
                    '<tr>' + parseTableRow(r).map((c, i) => `<td${attr(i)}>${cell(c)}</td>`).join('') + '</tr>'
                ).join('') +
                '</tbody>';

            const index = tables.length;
            tables.push(`<div class="table-container"><table>${thead}${tbody}</table></div>`);
            return `\n__TABLE_${index}__\n`;
        }
    );

    // 4. Escape HTML in the remaining text
    processedText = escapeHtml(processedText);

    // 5. Apply block + inline markdown
    processedText = processedText
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/\*\*\*(.*)\*\*\*/gim, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*)\*/gim, '<em>$1</em>')
        .replace(/!\[(.*?)\]\((.*?)\)/gim, (_, alt, url) => {
            return `<img src="${safeImgSrc(url)}" alt="${alt}" style="max-width:100%; border-radius:0.75rem; margin:1.5rem 0;" />`;
        })
        .replace(/\[(.*?)\]\((.*?)\)/gim, (_, label, url) => {
            return `<a href="${safeLinkHref(url)}" target="_blank" rel="${linkRel(url)}">${label}</a>`;
        })
        .replace(/^\* (.*$)/gim, '<li>$1</li>')
        .replace(/^- (.*$)/gim, '<li>$1</li>')
        .replace(/`(.*?)`/gim, '<code>$1</code>');

    // 6. Wrap paragraphs and re-insert extracted blocks
    return processedText
        .split(/\r?\n\s*\r?\n/g)
        .map(p => p.trim())
        .filter(p => p.length > 0)
        .map(p => {
            if (p.startsWith('__CODE_BLOCK_')) {
                return codeBlocks[parseInt(p.match(/\d+/)![0])];
            }
            if (p.startsWith('__BLOCKQUOTE_')) {
                return blockquotes[parseInt(p.match(/\d+/)![0])];
            }
            if (p.startsWith('__TABLE_')) {
                return tables[parseInt(p.match(/\d+/)![0])];
            }
            if (p.startsWith('<h') || p.startsWith('<li')) return p;
            return `<p>${p.replace(/\n/g, '<br />')}</p>`;
        })
        .join('\n');
}

export function slugify(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

export function shortId(id: string): string {
    return id.replace(/-/g, '').slice(0, 8);
}

export function buildPostSlug(title: string, id: string): string {
    return `${slugify(title)}-${shortId(id)}`;
}
