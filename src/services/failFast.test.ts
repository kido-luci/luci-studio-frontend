import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The content services a prod build reads must fail the build on a fetch error
// instead of shipping an empty /lab or /portfolio. FAIL_FAST is read once at
// module load, so each test stubs a prod env and imports fresh modules.
describe('content services in a prod build', () => {
    beforeEach(() => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.stubEnv('PROD', true);
        vi.stubEnv('ALLOW_EMPTY_POSTS', '');
        vi.resetModules();
    });

    afterEach(() => {
        vi.unstubAllEnvs();
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    const failing = () => vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    it('projects rejects on a 500', async () => {
        failing();
        const { projectService } = await import('./projects');
        await expect(projectService.getAll()).rejects.toThrow('500');
    });

    it('skills rejects on a 500', async () => {
        failing();
        const { skillsService } = await import('./skills');
        await expect(skillsService.getAll()).rejects.toThrow('500');
    });

    it('work rejects on a 500', async () => {
        failing();
        const { workService } = await import('./work');
        await expect(workService.getAll()).rejects.toThrow('500');
    });

    it('profile rejects on a 500', async () => {
        failing();
        const { profileService } = await import('./profile');
        await expect(profileService.getProfile()).rejects.toThrow('500');
    });

    // The CI fixture API answers /profile with 404; a missing profile is empty.
    it('profile still resolves null on a 404', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));
        const { profileService } = await import('./profile');
        await expect(profileService.getProfile()).resolves.toBeNull();
    });

    it('profile fetches once across callers', async () => {
        const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ copyright: 'x' }) });
        vi.stubGlobal('fetch', fetchMock);
        const { profileService } = await import('./profile');

        await Promise.all([profileService.getProfile(), profileService.getProfile()]);
        await profileService.getProfile();

        expect(fetchMock).toHaveBeenCalledTimes(1);
    });
});
