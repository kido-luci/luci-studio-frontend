export function calculateReadTime(content: string): string {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min`;
}

export function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

// More robust Markdown-to-HTML formatter (regex-based)
export function formatMarkdown(text: string) {
    const codeBlocks: string[] = [];
    let processedText = text;
    
    // 1. Extract code blocks and replace with placeholders
    processedText = processedText.replace(/```(.*?)\r?\n([\s\S]*?)```/gim, (_, lang, code) => {
        const index = codeBlocks.length;
        const escapedCode = code
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
        codeBlocks.push(`<div class="code-block-container"><pre><code class="language-${lang.trim()}">${escapedCode}</code></pre></div>`);
        return `__CODE_BLOCK_${index}__`;
    });

    // 2. Escape the remaining text to prevent XSS
    processedText = processedText
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    // 2. Format other elements
    processedText = processedText
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/\*\*\*(.*)\*\*\*/gim, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*)\*/gim, '<em>$1</em>')
        .replace(/!\[(.*?)\]\((.*?)\)/gim, (_, alt, url) => {
            const safeUrl = url.startsWith('javascript:') ? '#' : url;
            return `<img src="${safeUrl}" alt="${alt}" style="max-width:100%; border-radius:0.75rem; margin:1.5rem 0;" />`;
        })
        .replace(/\[(.*?)\]\((.*?)\)/gim, (_, label, url) => {
            const safeUrl = (url.startsWith('http') || url.startsWith('/') || url.startsWith('#')) ? url : '#';
            return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${label}</a>`;
        })
        .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
        .replace(/^\* (.*$)/gim, '<li>$1</li>')
        .replace(/^- (.*$)/gim, '<li>$1</li>')
        .replace(/`(.*?)`/gim, '<code>$1</code>');

    // 3. Handle paragraphs and re-insert code blocks
    return processedText
        .split(/\r?\n\s*\r?\n/g)
        .map(p => p.trim())
        .filter(p => p.length > 0)
        .map(p => {
            // If it's a code block placeholder, return the stored block
            if (p.startsWith('__CODE_BLOCK_')) {
                const index = parseInt(p.match(/\d+/)![0]);
                return codeBlocks[index];
            }
            
            // If it's another block element, return as is
            if (p.startsWith('<h') || p.startsWith('<blockquote') || p.startsWith('<li')) return p;
            
            // Otherwise, wrap in <p> and handle single newlines
            return `<p>${p.replace(/\n/g, '<br />')}</p>`;
        })
        .join('\n');
}

export function slugify(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')     // Replace spaces with -
        .replace(/[^\w-]+/g, '')  // Remove all non-word chars
        .replace(/--+/g, '-')     // Replace multiple - with single -
        .replace(/^-+/, '')       // Trim - from start of text
        .replace(/-+$/, '');      // Trim - from end of text
}
