import { describe, expect, it } from 'vitest';
import { parseGitHub } from './github';

describe('parseGitHub', () => {
    it('pulls owner and repo out of a repository URL', () => {
        expect(parseGitHub('https://github.com/kido-luci/luci-studio-frontend')).toEqual({
            owner: 'kido-luci',
            repo: 'luci-studio-frontend',
        });
    });

    it('accepts the www host and a trailing path', () => {
        expect(parseGitHub('https://www.github.com/kido-luci/faldrop/tree/main/src')).toEqual({
            owner: 'kido-luci',
            repo: 'faldrop',
        });
    });

    it('strips a .git suffix', () => {
        expect(parseGitHub('https://github.com/kido-luci/faldrop.git')).toEqual({
            owner: 'kido-luci',
            repo: 'faldrop',
        });
    });

    it('tolerates a trailing slash', () => {
        expect(parseGitHub('https://github.com/kido-luci/faldrop/')).toEqual({
            owner: 'kido-luci',
            repo: 'faldrop',
        });
    });

    it('rejects a host that merely ends in the same letters', () => {
        expect(parseGitHub('https://notgithub.com/a/b')).toBeNull();
    });

    it('rejects other hosts', () => {
        expect(parseGitHub('https://gitlab.com/kido-luci/faldrop')).toBeNull();
    });

    it('rejects a URL without both an owner and a repo', () => {
        expect(parseGitHub('https://github.com/kido-luci')).toBeNull();
        expect(parseGitHub('https://github.com/')).toBeNull();
    });

    it('rejects a malformed URL instead of throwing', () => {
        expect(parseGitHub('not a url')).toBeNull();
        expect(parseGitHub('')).toBeNull();
    });
});
