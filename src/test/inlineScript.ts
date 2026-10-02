import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// path, not the URL global: happy-dom replaces URL in the tests that use this.
const SRC = join(dirname(fileURLToPath(import.meta.url)), '..');

// Tests only: the body of the `<script is:inline>` in an .astro file (path
// relative to src/) that contains `marker`, so a happy-dom test can run exactly
// the code the page ships inline, e.g. `new Function(inlineScript(...))()`.
export function inlineScript(astroFile: string, marker: string): string {
    const text = readFileSync(join(SRC, astroFile), 'utf8');
    const body = [...text.matchAll(/<script is:inline>([\s\S]*?)<\/script>/g)]
        .map(m => m[1])
        .find(b => b.includes(marker));
    if (!body) throw new Error(`${astroFile} has no inline script containing "${marker}"`);
    return body;
}
