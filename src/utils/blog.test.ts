import { describe, it, expect } from 'vitest';
import {
    calculateReadTime,
    calculateReadTimeFromWordCount,
    formatDate,
    slugify,
    shortId,
    buildPostSlug,
    formatMarkdown
} from './blog';

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
    });
});
