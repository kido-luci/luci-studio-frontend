import { useTranslations, type Locale } from '../i18n';

export function calculateReadTime(content: string, locale: Locale = 'en'): string {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} ${useTranslations(locale)('readtime.unit')}`;
}

export function calculateReadTimeFromWordCount(wordCount?: number, locale: Locale = 'en'): string {
    const unit = useTranslations(locale)('readtime.unit');
    if (!wordCount || wordCount < 1) return `1 ${unit}`;
    return `${Math.ceil(wordCount / 200)} ${unit}`;
}

// Convenience helper: prefer word_count when available (cheaper), fall back to
// full-content estimation. Replaces the repeated ternary in post→card mappings.
export function readTimeFor(p: { word_count?: number; content?: string }, locale: Locale = 'en'): string {
    return p.word_count
        ? calculateReadTimeFromWordCount(p.word_count, locale)
        : calculateReadTime(p.content || '', locale);
}

export function formatDate(dateStr: string, _locale: Locale = 'en'): string {
    // Dates are UI chrome → always English format, even on /vi/ pages (only post
    // title/content is localized). The locale param is kept for call-site compat.
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
    IMPORTANT: { color: 'var(--accent)', bg: 'rgb(var(--accent-rgb) / 0.08)', label: '⚡ Important' },
    WARNING:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', label: '⚠️ Warning' },
    CAUTION:   { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',  label: '🚫 Caution' },
};

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// An href/src may be http(s) or mailto, or carry no scheme at all (a relative path,
// `//host`, `?query`, `#anchor`); anything else becomes '#'. Browsers skip control
// characters and spaces when reading a scheme (`java\tscript:`), so drop them first.
const SAFE_SCHEME = /^(https?|mailto):/i;
const ANY_SCHEME = /^[a-z][a-z0-9+.-]*:/i;
const SAFE_LANGUAGE = /[^A-Za-z0-9_+-]/g;

function safeUrl(url: string): string {
    const probe = url.replace(/[\u0000-\u0020\u007f]/g, '');
    return ANY_SCHEME.test(probe) && !SAFE_SCHEME.test(probe) ? '#' : url;
}

// rel for every outbound markdown link. The site runs no affiliate or sponsored
// links, so there is no "sponsored" case to branch on — just the safety pair
// that keeps target="_blank" from leaking the opener and the referrer.
const OUTBOUND_REL = 'noopener noreferrer';

// Inline HTML that later rules must not read into (code spans, images, links) is
// parked behind a token — its index between two private-use characters, which no
// rule matches and escapeHtml leaves alone — and put back once every rule has run.
const TOKEN = /\uE000(\d+)\uE001/g;

function park(store: string[], html: string): string {
    return `\uE000${store.push(html) - 1}\uE001`;
}

// Recursive: a link's label can itself hold a parked code span or image.
function unpark(store: string[], text: string): string {
    return text.replace(TOKEN, (_, i) => unpark(store, store[Number(i)]));
}

// An attribute value: parked HTML flattened to its text, then quotes and angle
// brackets escaped. The text has been through escapeHtml already, so `&` is left alone.
function attrValue(store: string[], text: string): string {
    return unpark(store, text)
        .replace(/<[^>]*>/g, '')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// Lazy, so `**Go** and **Dart**` stays two bold runs instead of one with a stray
// italic inside it.
function applyEmphasis(text: string): string {
    return text
        .replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/gim, '<em>$1</em>');
}

// Runs on escaped text whose code spans are already parked. Images and links are
// parked as soon as they are built, so no later rule rewrites inside their
// attributes or pairs an emphasis marker across them.
function applyInlineMarkdown(text: string, store: string[]): string {
    return applyEmphasis(text
        .replace(/!\[(.*?)\]\((.*?)\)/gim, (_, alt, url) => park(store,
            `<img src="${safeUrl(attrValue(store, url))}" alt="${attrValue(store, alt)}" style="max-width:100%; border-radius:0.75rem; margin:1.5rem 0;" />`))
        .replace(/\[(.*?)\]\((.*?)\)/gim, (_, label, url) => park(store,
            `<a href="${safeUrl(attrValue(store, url))}" target="_blank" rel="${OUTBOUND_REL}">${applyEmphasis(label)}</a>`)));
}

function parseTableRow(line: string): string[] {
    return line
        .trim()
        .replace(/^\|/, '')
        .replace(/\|[ \t]*$/, '')
        .split('|')
        .map(c => c.trim());
}

// A fenced code block: ``` and an info string, then everything up to the next ```.
// Shared with demoteH1Headings so both agree on where each fence starts and ends.
const FENCE = /```(.*?)\r?\n([\s\S]*?)```/gim;

export function formatMarkdown(text: string) {
    const codeBlocks: string[] = [];
    const blockquotes: string[] = [];
    const tables: string[] = [];
    const inline: string[] = [];
    // The token delimiters must never come from the post itself.
    let processedText = text.replace(/[\uE000\uE001]/g, '');

    // 1. Extract fenced code blocks → placeholders (escape content inside). Each
    //    placeholder is a paragraph of its own, so a line right before or after the
    //    fence still starts a block of its own.
    processedText = processedText.replace(FENCE, (_, lang, code) => {
        const index = codeBlocks.length;
        const safeLang = escapeHtml(lang.trim().replace(SAFE_LANGUAGE, ''));
        codeBlocks.push(
            `<div class="code-block-container"><pre><code class="language-${safeLang}">${escapeHtml(code)}</code></pre></div>`
        );
        return `\n\n__CODE_BLOCK_${index}__\n\n`;
    });

    //    Then park inline code spans, so no later rule reads inside them.
    processedText = processedText.replace(/`(.*?)`/g, (_, code) => park(inline, `<code>${escapeHtml(code)}</code>`));

    // 2. Extract blockquotes/callouts BEFORE HTML escaping so `>` is still raw.
    //    Matches one or more consecutive `> ...` lines (including blank `>` lines).
    processedText = processedText.replace(/^((?:>[^\n]*\n?)+)/gim, (match) => {
        const lines = match.split('\n').filter(l => /^>/.test(l));
        const contents = lines.map(l => l.replace(/^>\s?/, ''));

        const firstLineMatch = contents[0]?.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(.*)?$/i);
        const calloutType = firstLineMatch?.[1]?.toUpperCase();
        const index = blockquotes.length;

        if (calloutType && CALLOUT_STYLES[calloutType]) {
            const { color, bg } = CALLOUT_STYLES[calloutType];
            const inlineRest = firstLineMatch?.[2]?.trim() ?? '';
            const remainingLines = contents.slice(1).join('\n').trim();
            const rawBody = [inlineRest, remainingLines].filter(Boolean).join('\n');
            const body = applyInlineMarkdown(escapeHtml(rawBody), inline);
            blockquotes.push(
                `<div style="border-left:4px solid ${color};background:${bg};padding:0.875rem 1.25rem;border-radius:0 0.5rem 0.5rem 0;margin:1.5rem 0;">` +
                `<div style="font-size:0.95rem;">${body}</div>` +
                `</div>`
            );
        } else {
            const body = applyInlineMarkdown(escapeHtml(contents.join('\n').trim()), inline);
            blockquotes.push(`<blockquote>${body}</blockquote>`);
        }

        return `\n\n__BLOCKQUOTE_${index}__\n\n`;
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
            const cell = (c: string) => applyInlineMarkdown(escapeHtml(c), inline);
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
            return `\n\n__TABLE_${index}__\n\n`;
        }
    );

    // 4. Escape HTML in the remaining text
    processedText = escapeHtml(processedText);

    // 5. Apply block + inline markdown. List markers go before emphasis, so a
    //    `* ` bullet is never read as an emphasis delimiter.
    processedText = applyInlineMarkdown(processedText
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^\* (.*$)/gim, '<li>$1</li>')
        .replace(/^- (.*$)/gim, '<li>$1</li>'), inline);

    // 6. Wrap paragraphs, re-insert extracted blocks, then the parked inline HTML
    return unpark(inline, processedText
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
        .join('\n'));
}

// The post page shows the title as its own h1, so a body `# Heading` is demoted to
// `## `. Fenced code is skipped, so a shell or YAML `# comment` keeps its single `#`.
export function demoteH1Headings(markdown: string): string {
    return markdown.replace(new RegExp(`${FENCE.source}|^#\\s`, 'gm'), m => (m.startsWith('```') ? m : '## '));
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

// DM Serif Display has no glyphs for the Vietnamese block U+1EA0–U+1EF1 (ạ ả ấ ẫ ế ệ ớ ợ …),
// so those letters fall back to Georgia mid-word. Titles containing them need a VN-capable serif.
export function needsVietnameseSerif(text: string): boolean {
    return /[Ạ-ự]/.test(text);
}
