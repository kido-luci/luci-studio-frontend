// ── Blueprint ambient glow (WebGL2) — homepage only ─────────────────────────
// PROTOTYPE (units.gr-inspired): a fixed, transparent, pointer-events-none
// canvas that sits UNDER the drafting grid (same z-index:0 as .bp-grid but
// earlier in the DOM, so the grid lines + CSS lamp paint over it) and renders
// three soft light sources with a tiny fragment shader:
//   1. a breathing desk-lamp halo at the sheet's top corner (matches the CSS
//      lamp anchor: left on desktop, right ≤900px),
//   2. a slow "ink drift" blob wandering mid-sheet (lissajous),
//   3. a subtle ember that lags behind the cursor.
// Raw WebGL2 — no three.js (deliberately removed from this site) — a single
// fullscreen triangle at HALF resolution (soft glow → upscaling is invisible),
// throttled to ~30fps while the pointer is idle (the blobs drift too slowly
// for the halved rate to show; saves battery on laptops).
// Dark mode composites with mix-blend-mode:screen (light added to the sheet);
// light mode flips to multiply with a darker ink colour (a wash sunk into the
// paper). Colour tracks --accent-rgb live (same contract as the tsParticles
// constellation). Runs on mobile too (touch has no fine pointer, so the idle
// throttle pins it at ~30fps); skipped on reduced-motion (the static CSS lamp
// remains), missing WebGL2, or the localStorage escape hatch bpGlow="off"
// (A/B: set + reload).

const VERT = `#version 300 es
void main() {
  vec2 v = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(v * 2.0 - 1.0, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision mediump float;
uniform vec2 uRes;
uniform float uT;
uniform vec2 uMouse;      // aspect-corrected uv (y up)
uniform vec3 uCol;        // 0..1 rgb, premultiplied against alpha below
uniform float uIntensity;
uniform float uLampX;     // 0 = top-left anchor, 1 = top-right (CSS lamp flip)
out vec4 outColor;

float blob(vec2 p, vec2 c, float r) {
  float d = length(p - c) / r;
  return exp(-d * d * 3.0);
}
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}
void main() {
  float aspect = uRes.x / uRes.y;
  vec2 uv = gl_FragCoord.xy / uRes;
  uv.x *= aspect;

  // 1 — desk-lamp halo breathing at the sheet's top corner
  vec2 lampC = vec2(uLampX * aspect, 1.04);
  float lamp = blob(uv, lampC, 0.62 + 0.05 * sin(uT * 0.21))
             * (0.8 + 0.2 * sin(uT * 0.13));

  // 2 — ink drift: one soft blob wandering the middle of the sheet
  vec2 driftC = vec2(
    aspect * (0.5 + 0.34 * sin(uT * 0.043 + 1.7)),
    0.42 + 0.27 * sin(uT * 0.031)
  );
  float drift = 0.55 * blob(uv, driftC, 0.55);

  // 3 — cursor ember (position lerped on the JS side)
  float ember = 0.5 * blob(uv, uMouse, 0.30);

  float v = (lamp + drift + ember) * uIntensity;
  // Ordered-ish dither so the soft ramps don't band on 8-bit displays.
  v += (hash(gl_FragCoord.xy + fract(uT)) - 0.5) * 0.012;
  v = max(v, 0.0);
  outColor = vec4(uCol * v, v);
}`;

/** Live accent as 0..1 rgb; falls back to the blueprint blue. */
function accentRgb(): [number, number, number] {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--accent-rgb')
    .trim();
  const parts = (raw || '27 86 255').split(/[\s,]+/).map(Number);
  if (parts.length < 3 || parts.some((n) => !isFinite(n))) return [27 / 255, 86 / 255, 1];
  return [parts[0] / 255, parts[1] / 255, parts[2] / 255];
}

export function initBpGlow() {
  const host = document.querySelector('main.bp');
  if (!host) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  try {
    if (localStorage.getItem('bpGlow') === 'off') return;
  } catch { /* private mode */ }

  // JS-created element → inline styles only (Astro scoped CSS can't reach it).
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText =
    'position:fixed;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;';
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'low-power',
  });
  if (!gl) return; // no WebGL2 → the static CSS lamp glow carries the corner

  const compile = (type: number, src: string) => {
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.warn('bpGlow shader:', gl.getShaderInfoLog(sh));
      return null;
    }
    return sh;
  };
  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return;
  const prog = gl.createProgram()!;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  const uRes = gl.getUniformLocation(prog, 'uRes');
  const uT = gl.getUniformLocation(prog, 'uT');
  const uMouse = gl.getUniformLocation(prog, 'uMouse');
  const uCol = gl.getUniformLocation(prog, 'uCol');
  const uIntensity = gl.getUniformLocation(prog, 'uIntensity');
  const uLampX = gl.getUniformLocation(prog, 'uLampX');

  // Half-resolution: the output is nothing but soft gradients, so a 0.5×
  // buffer upscaled by CSS is indistinguishable and quarters the fill cost.
  const SCALE = 0.5 * Math.min(window.devicePixelRatio || 1, 1);
  let w = 1;
  let h = 1;
  const resize = () => {
    w = Math.max(1, Math.round(window.innerWidth * SCALE));
    h = Math.max(1, Math.round(window.innerHeight * SCALE));
    canvas.width = w;
    canvas.height = h;
    gl.viewport(0, 0, w, h);
  };
  resize();
  let resizeRaf = false;
  window.addEventListener(
    'resize',
    () => {
      if (resizeRaf) return;
      resizeRaf = true;
      requestAnimationFrame(() => {
        resizeRaf = false;
        resize();
      });
    },
    { passive: true },
  );

  // Theme → blend mode, colour, strength. Dark adds light (screen); light
  // sinks a darker ink wash into the cream paper (multiply).
  const applyTheme = () => {
    const light = document.body.classList.contains('light-mode');
    const [r, g, b] = accentRgb();
    if (light) {
      canvas.style.mixBlendMode = 'multiply';
      gl.uniform3f(uCol, r * 0.5, g * 0.5, b * 0.5);
      gl.uniform1f(uIntensity, 0.1);
    } else {
      canvas.style.mixBlendMode = 'screen';
      gl.uniform3f(uCol, r, g, b);
      gl.uniform1f(uIntensity, 0.16);
    }
  };
  applyTheme();
  new MutationObserver(applyTheme).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-scheme', 'class'],
  });
  new MutationObserver(applyTheme).observe(document.body, {
    attributes: true,
    attributeFilter: ['class'],
  });

  // Lamp anchor mirrors the CSS --bp-lamp-x flip (left ≥900px, right below).
  const lampMq = window.matchMedia('(max-width: 900px)');
  const applyLamp = () => gl.uniform1f(uLampX, lampMq.matches ? 1 : 0);
  applyLamp();
  lampMq.addEventListener('change', applyLamp);

  // Idle throttle — after 3s without pointer movement, draw every ≥30ms
  // (~30fps); any movement restores full rate on the next frame. A mouseless
  // load starts throttled.
  const IDLE_AFTER = 3000;
  const IDLE_FRAME_MS = 30;
  let lastMove = -IDLE_AFTER;
  let lastDraw = 0;

  // Cursor ember target — lerped each frame so the glow trails the pointer.
  // Parked at the lamp corner (re-parked on resize/rotation, tracking the
  // ≤900px anchor flip) so it folds into the lamp until a fine pointer moves.
  // Touch devices never attach the listener → they stay parked and the idle
  // throttle above holds them at ~30fps for the whole visit.
  let parked = true;
  let tx = 0;
  let ty = 1.04;
  const park = () => {
    tx = (lampMq.matches ? 1 : 0) * (window.innerWidth / window.innerHeight);
    ty = 1.04;
  };
  park();
  let mx = tx;
  let my = ty;
  window.addEventListener('resize', () => { if (parked) park(); }, { passive: true });
  if (window.matchMedia('(pointer: fine)').matches) {
    window.addEventListener(
      'pointermove',
      (e) => {
        parked = false;
        lastMove = performance.now();
        const aspect = window.innerWidth / window.innerHeight;
        tx = (e.clientX / window.innerWidth) * aspect;
        ty = 1 - e.clientY / window.innerHeight;
      },
      { passive: true },
    );
  }

  let dead = false;
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    dead = true;
    canvas.remove(); // fall back to the CSS lamp; no restore dance needed
  });

  const dbg = { canvas, frames: 0 };
  const t0 = performance.now();
  const frame = (now: number) => {
    if (dead) return;
    requestAnimationFrame(frame);
    if (now - lastMove > IDLE_AFTER && now - lastDraw < IDLE_FRAME_MS) return;
    lastDraw = now;
    dbg.frames++;
    mx += (tx - mx) * 0.045;
    my += (ty - my) * 0.045;
    gl.uniform2f(uRes, w, h);
    gl.uniform1f(uT, (now - t0) / 1000);
    gl.uniform2f(uMouse, mx, my);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  host.prepend(canvas); // before .bp-grid → the grid lines draw over the glow
  requestAnimationFrame(frame);
  (window as any).__bpGlow = dbg; // dev/verify handle
}
