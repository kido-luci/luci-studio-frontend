// ── Canvas particle background — RETIRED ────────────────────────────────
// The drifting field of "-" (line) and "o" (bubble/ring) particles was part of
// the pre-blueprint design. The site now uses per-page drafting-grid
// backgrounds, so the particle field is switched off. These no-op stubs keep
// the API its former callers still import (canvasBackground / navDimmer /
// theme) so nothing ever draws to #canvas-bg and the loop never runs — no code
// path recreates the particles. The dead plumbing (#canvas-bg, #bg-dimmer, the
// navDimmer pause/resume branch) can be removed in a follow-up cleanup.
export const initCanvasParticles = () => {};
export const resumeCanvasParticles = () => {};
export const pauseCanvasParticles = () => {};
export const stopCanvasParticles = () => {};
