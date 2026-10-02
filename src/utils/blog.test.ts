import { describe, it, expect } from 'vitest';
import { Window } from 'happy-dom';
import {
    calculateReadTime,
    calculateReadTimeFromWordCount,
    formatDate,
    slugify,
    shortId,
    buildPostSlug,
    formatMarkdown,
    demoteH1Headings,
} from './blog';

const IMG_STYLE = 'max-width:100%; border-radius:0.75rem; margin:1.5rem 0;';
const link = (href: string, label: string) => `<a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`;
const codeBlock = (lang: string, code: string) =>
    `<div class="code-block-container"><pre><code class="language-${lang}">${code}</code></pre></div>`;
const TABLE = '<div class="table-container"><table><thead><tr><th>a</th><th>b</th></tr></thead>' +
    '<tbody><tr><td>1</td><td>2</td></tr></tbody></table></div>';

describe('Blog Utils', () => {
    describe('calculateReadTime', () => {
        it('calculates read time for empty text', () => {
            expect(calculateReadTime('')).toBe('1 min');
        });

        it('calculates read time for small text', () => {
            expect(calculateReadTime('hello world')).toBe('1 min');
        });

        it('calculates read time for text with around 250 words', () => {
            const text = Array(250).fill('word').join(' ');
            expect(calculateReadTime(text)).toBe('2 min');
        });
    });

    describe('calculateReadTimeFromWordCount', () => {
        it('handles missing or zero count', () => {
            expect(calculateReadTimeFromWordCount(undefined)).toBe('1 min');
            expect(calculateReadTimeFromWordCount(0)).toBe('1 min');
            expect(calculateReadTimeFromWordCount(-5)).toBe('1 min');
        });

        it('calculates correct time based on 200 words per minute rule', () => {
            expect(calculateReadTimeFromWordCount(150)).toBe('1 min');
            expect(calculateReadTimeFromWordCount(200)).toBe('1 min');
            expect(calculateReadTimeFromWordCount(201)).toBe('2 min');
            expect(calculateReadTimeFromWordCount(500)).toBe('3 min');
        });
    });

    describe('formatDate', () => {
        it('formats ISO date string into readable US format', () => {
            expect(formatDate('2026-05-22T00:00:00Z')).toBe('May 22, 2026');
            expect(formatDate('2026-01-01T12:00:00Z')).toBe('Jan 1, 2026');
        });
    });

    describe('slugify', () => {
        it('converts mixed case and spaces to lowercase and kebab case', () => {
            expect(slugify('Hello World')).toBe('hello-world');
            expect(slugify('My Super Awesome Blog Post!')).toBe('my-super-awesome-blog-post');
        });

        it('handles leading and trailing spaces/dashes', () => {
            expect(slugify('  --Clean Me Up--  ')).toBe('clean-me-up');
        });

        it('replaces multiple consecutive dashes with a single dash', () => {
            expect(slugify('test--slug')).toBe('test-slug');
        });
    });

    describe('shortId', () => {
        it('removes dashes and slices the first 8 characters of UUID', () => {
            const uuid = 'a6b6a3da-b735-4976-8b5d-6360fc7ed243';
            expect(shortId(uuid)).toBe('a6b6a3da');
        });
    });

    describe('buildPostSlug', () => {
        it('joins slugified title and short ID', () => {
            const title = 'Modern Go REST API';
            const id = 'a6b6a3da-b735-4976-8b5d-6360fc7ed243';
            expect(buildPostSlug(title, id)).toBe('modern-go-rest-api-a6b6a3da');
        });
    });

    describe('formatMarkdown', () => {
        it('wraps plain text into paragraphs', () => {
            const input = 'This is a simple sentence.';
            expect(formatMarkdown(input)).toBe('<p>This is a simple sentence.</p>');
        });

        it('processes headers correctly', () => {
            expect(formatMarkdown('# Heading 1')).toBe('<h1>Heading 1</h1>');
            expect(formatMarkdown('## Heading 2')).toBe('<h2>Heading 2</h2>');
            expect(formatMarkdown('### Heading 3')).toBe('<h3>Heading 3</h3>');
        });

        it('processes inline styles (bold, italic, code)', () => {
            expect(formatMarkdown('**bold text**')).toBe('<p><strong>bold text</strong></p>');
            expect(formatMarkdown('*italic text*')).toBe('<p><em>italic text</em></p>');
            expect(formatMarkdown('***bold italic***')).toBe('<p><strong><em>bold italic</em></strong></p>');
            expect(formatMarkdown('`inline code`')).toBe('<p><code>inline code</code></p>');
        });

        it('processes list items', () => {
            expect(formatMarkdown('* Item one')).toBe('<li>Item one</li>');
            expect(formatMarkdown('- Item two')).toBe('<li>Item two</li>');
        });

        it('handles code blocks correctly and escapes HTML', () => {
            const input = '```go\npackage main\nimport "fmt"\n```';
            const result = formatMarkdown(input);
            expect(result).toContain('<code class="language-go">');
            expect(result).toContain('&quot;fmt&quot;');
            expect(result).not.toContain('package main\nimport "fmt"'); // should be encoded/escaped
        });

        it('processes images and links and applies SSRF/unsafe protection', () => {
            const input = '![alt](https://media.luci-studio.com/image.jpg)';
            expect(formatMarkdown(input)).toContain('src="https://media.luci-studio.com/image.jpg"');
            expect(formatMarkdown(input)).toContain('alt="alt"');

            // Unsafe URLs must be replaced with '#'
            const unsafeInput = '![alt](javascript:alert(1))';
            expect(formatMarkdown(unsafeInput)).toContain('src="#"');

            const linkInput = '[Luci Studio](https://luci-studio.com)';
            expect(formatMarkdown(linkInput)).toContain('href="https://luci-studio.com"');

            const unsafeLinkInput = '[Hack](javascript:void(0))';
            expect(formatMarkdown(unsafeLinkInput)).toContain('href="#"');
        });

        it('processes blockquotes and custom callouts', () => {
            const normalQuote = '> This is a standard quote.';
            expect(formatMarkdown(normalQuote)).toBe('<blockquote>This is a standard quote.</blockquote>');

            const calloutNote = '> [!NOTE]\n> Read this carefully.';
            const noteHtml = formatMarkdown(calloutNote);
            expect(noteHtml).toContain('border-left:4px solid #3b82f6');
            expect(noteHtml).toContain('background:rgba(59,130,246,0.08)');
            expect(noteHtml).toContain('Read this carefully.');

            const calloutWarning = '> [!WARNING]\n> High risk.';
            const warningHtml = formatMarkdown(calloutWarning);
            expect(warningHtml).toContain('border-left:4px solid #f59e0b');
            expect(warningHtml).toContain('High risk.');
        });

        it('escapes raw HTML outside blocks', () => {
            const input = 'Check this: <script>alert("hack")</script>';
            expect(formatMarkdown(input)).toBe('<p>Check this: &lt;script&gt;alert(&quot;hack&quot;)&lt;/script&gt;</p>');
        });

        it('gives every outbound link the safety rel pair', () => {
            const html = formatMarkdown('[buy](https://example.com)');
            expect(html).toContain('rel="noopener noreferrer"');
            expect(html).not.toContain('sponsored');
        });

        it.each([
            ['two bold runs on one line', 'Use **Go** and **Dart** together.',
                '<p>Use <strong>Go</strong> and <strong>Dart</strong> together.</p>'],
            ['two italic runs on one line', 'Keep it *visible* to tests and *invisible* to others.',
                '<p>Keep it <em>visible</em> to tests and <em>invisible</em> to others.</p>'],
            ['bold, italic and code on one line', '**Bold**, *italic* and `a*b` on one line.',
                '<p><strong>Bold</strong>, <em>italic</em> and <code>a*b</code> on one line.</p>'],
            ['italic inside bold', '**bold *and italic* text**',
                '<p><strong>bold <em>and italic</em> text</strong></p>'],
            ['emphasis markers inside code spans', 'Use `a*b` and `c*d` here.',
                '<p>Use <code>a*b</code> and <code>c*d</code> here.</p>'],
            ['bold link label next to another bold run', '[**squadron**](https://pub.dev/packages/squadron) handles **worker pools**',
                `<p>${link('https://pub.dev/packages/squadron', '<strong>squadron</strong>')} handles <strong>worker pools</strong></p>`],
            ['a star bullet with bold and italic', '*   **Parallelism** is about *doing* things at once',
                '<li>  <strong>Parallelism</strong> is about <em>doing</em> things at once</li>'],
            ['bold, italic and code in a quote', '> **Go** and *Dart* and `x*y`',
                '<blockquote><strong>Go</strong> and <em>Dart</em> and <code>x*y</code></blockquote>'],
        ])('renders emphasis and code without interleaving: %s', (_, input, expected) => {
            expect(formatMarkdown(input)).toBe(expected);
        });

        // Live posts put bold and links inside backticks; nothing else applies there.
        it.each([
            ['bold', 'Enter `**go_router**` now.',
                '<p>Enter <code><strong>go_router</strong></code> now.</p>'],
            ['bold code between two bold runs', '**Pre-load the** `**ui.Image**`**:** first.',
                '<p><strong>Pre-load the</strong> <code><strong>ui.Image</strong></code><strong>:</strong> first.</p>'],
            ['a link', 'Tiles: `[https://t.dev/{z}/{x}/{y}.png](https://t.dev/{z}/{x}/{y}.png)`',
                `<p>Tiles: <code>${link('https://t.dev/{z}/{x}/{y}.png', 'https://t.dev/{z}/{x}/{y}.png')}</code></p>`],
            ['an unsafe link', '`[x](javascript:alert(1))`',
                `<p><code>${link('#', 'x')})</code></p>`],
            ['single-star italics stay literal', '`a*b*c`', '<p><code>a*b*c</code></p>'],
            ['a *** run stays literal', '`***x***`', '<p><code>***x***</code></p>'],
            ['image syntax stays literal', '`![a](https://x.dev/i.png)`', '<p><code>![a](https://x.dev/i.png)</code></p>'],
        ])('applies only bold and links inside a code span: %s', (_, input, expected) => {
            expect(formatMarkdown(input)).toBe(expected);
        });

        it.each([
            ['text right after a fence', '```go\nfmt.Println(1)\n```\nThis sentence follows the fence.',
                `${codeBlock('go', 'fmt.Println(1)\n')}\n<p>This sentence follows the fence.</p>`],
            ['text right after a fence (CRLF)', '```go\r\nx\r\n```\r\nAfter.',
                `${codeBlock('go', 'x\r\n')}\n<p>After.</p>`],
            ['text right before a fence', 'Intro line\n```js\nlet x = 1;\n```',
                `<p>Intro line</p>\n${codeBlock('js', 'let x = 1;\n')}`],
            ['a fence opened on the line that closes the previous one', '```\na\n``````\nb\n```',
                `${codeBlock('', 'a\n')}\n${codeBlock('', 'b\n')}`],
            ['a fence between two list items', '- one\n```sh\nls\n```\n- two',
                `<li>one</li>\n${codeBlock('sh', 'ls\n')}\n<li>two</li>`],
            ['text right after a quote', '> quoted line\nThis sentence follows the quote.',
                '<blockquote>quoted line</blockquote>\n<p>This sentence follows the quote.</p>'],
            ['text right before a quote', 'Intro line\n> quoted',
                '<p>Intro line</p>\n<blockquote>quoted</blockquote>'],
            ['text right after a table', '| a | b |\n|---|---|\n| 1 | 2 |\nThis sentence follows the table.',
                `${TABLE}\n<p>This sentence follows the table.</p>`],
            ['text right before a table', 'Intro line\n| a | b |\n|---|---|\n| 1 | 2 |',
                `<p>Intro line</p>\n${TABLE}`],
        ])('ends a block at its own boundary: %s', (_, input, expected) => {
            expect(formatMarkdown(input)).toBe(expected);
        });

        it.each([
            ['javascript:', '[x](javascript:alert(1))'],
            ['mixed-case javascript:', '[x](JaVaScRiPt:alert(1))'],
            ['javascript: with a tab in the scheme', '[x](java\tscript:alert(1))'],
            ['javascript: after leading spaces', '[x](  javascript:alert(1))'],
            ['vbscript:', '[x](vbscript:msgbox(1))'],
            ['data:', '[x](data:text/html,hi)'],
            ['a scheme smuggled through a code span', '[x](`javascript`:alert(1))'],
        ])('replaces an unsafe link URL with #: %s', (_, input) => {
            expect(formatMarkdown(input)).toContain(`<a href="#" target="_blank"`);
        });

        it.each([
            ['https', 'https://luci-studio.com/blog/'],
            ['mailto', 'mailto:hi@luci-studio.com'],
            ['an anchor', '#setup'],
            ['an absolute path', '/blog/series/'],
            ['a relative path', './guide'],
        ])('keeps a safe link URL: %s', (_, url) => {
            expect(formatMarkdown(`[x](${url})`)).toBe(`<p>${link(url, 'x')}</p>`);
        });

        it.each([
            ['javascript:', '![x](javascript:alert(1))', `<p><img src="#" alt="x" style="${IMG_STYLE}" />)</p>`],
            ['data:', '![x](data:image/svg+xml,hi)', `<p><img src="#" alt="x" style="${IMG_STYLE}" /></p>`],
        ])('replaces an unsafe image URL with #: %s', (_, input, expected) => {
            expect(formatMarkdown(input)).toBe(expected);
        });

        it.each([
            ['nested brackets in an image URL',
                '![a](x[y](/ onerror=window.onerror=alert;throw[1]//) t)',
                `<p><img src="x[y](/ onerror=window.onerror=alert;throw[1]//" alt="a" style="${IMG_STYLE}" /> t)</p>`],
            ['a quote in a link URL', '[x](https://a.com/"onmouseover="alert(1))',
                `<p>${link('https://a.com/&quot;onmouseover=&quot;alert(1', 'x')})</p>`],
            ['a quote in image alt text', '![a" onerror="alert(1)](https://x.dev/i.png)',
                `<p><img src="https://x.dev/i.png" alt="a&quot; onerror=&quot;alert(1)" style="${IMG_STYLE}" /></p>`],
            ['a code span in image alt text', '![a `b` c](https://x.dev/i.png)',
                `<p><img src="https://x.dev/i.png" alt="a b c" style="${IMG_STYLE}" /></p>`],
        ])('keeps attribute values inside their attribute: %s', (_, input, expected) => {
            const html = formatMarkdown(input);
            expect(html).toBe(expected);
            // What a browser builds from it: no element may gain an event-handler attribute.
            const { document } = new Window();
            document.body.innerHTML = html;
            const handlers = [...document.body.querySelectorAll('*')]
                .flatMap(el => el.getAttributeNames().filter(name => name.startsWith('on')));
            expect(handlers).toEqual([]);
        });

        it('still nests images, code and bold inside link labels', () => {
            expect(formatMarkdown('[![alt](https://x.dev/i.png)](https://x.dev)')).toBe(
                `<p>${link('https://x.dev', `<img src="https://x.dev/i.png" alt="alt" style="${IMG_STYLE}" />`)}</p>`);
            expect(formatMarkdown('[**bold** `code`](https://x.dev)')).toBe(
                `<p>${link('https://x.dev', '<strong>bold</strong> <code>code</code>')}</p>`);
        });
    });

    describe('demoteH1Headings', () => {
        it.each([
            ['a body h1', '# Setup\ntext', '## Setup\ntext'],
            ['a # comment inside a fence', '```bash\n# comment\necho hi\n```', '```bash\n# comment\necho hi\n```'],
            ['h1s around a fence, not inside it', '# Setup\n```yaml\n# pubspec.yaml\n```\n# Next',
                '## Setup\n```yaml\n# pubspec.yaml\n```\n## Next'],
        ])('demotes %s', (_, input, expected) => {
            expect(demoteH1Headings(input)).toBe(expected);
        });

        it('leaves the fenced comment intact through the renderer', () => {
            expect(formatMarkdown(demoteH1Headings('# Setup\n```bash\n# comment\n```'))).toBe(
                `<h2>Setup</h2>\n${codeBlock('bash', '# comment\n')}`);
        });
    });

});
