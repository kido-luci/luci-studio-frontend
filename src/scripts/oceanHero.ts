// ── Ocean hero (three.js) — homepage only ───────────────────────────────────
// The demo-approved underwater band behind the hero (rough look-test signed
// off 2026-07-24): a rectangular sky window offset RIGHT — a REAL hole in the
// shadow-casting surface — opens once on load; three-good-godrays raymarches
// the shadow map so the light shaft literally streams through the hole and
// grows as the doors part; Quaternius fish cross the shaft and light up
// because the directional light actually hits them there. A whale silhouette
// drifts through the deep fog. Spec: workspace docs/specs/home-ocean-hero.md.
//
// Community sources (deliberately used instead of hand-rolled effects):
//   · god rays — three-good-godrays (zlib) on pmndrs `postprocessing` (zlib)
//   · fish/whale — Quaternius "Animated Fish" pack, CC0, via poly.pizza
//     (public/models/fish/{clownfish,fish2,whale}.glb, swim animations)
// Version pin: three@0.179.1 (postprocessing peers <0.180, godrays <=0.182).
//
// Contracts shared with the rest of the page:
//   · html.ocean-on is set by the cheap head probe (WebGL2 present, no
//     oceanHero="off"); this module DEMOTES it (removes the class) if real
//     init fails or the GL context dies, which restores the CSS fallback
//     (constellation corner + hero ring diagram).
//   · The band is THEME-INDEPENDENT (user decision 2026-07-24): the fixed
//     demo palette renders identically in light and dark mode, and the hero
//     text keeps contrast via local --bp-* overrides in HomePage.astro.
//   · Reduced motion: one static frame, doors already open, no loop.
//   · Idle budget: ~30fps cap after the opening; paused when the tab is
//     hidden or the band scrolls offscreen; the shadow map stops re-rendering
//     once the doors finish opening (static casters — fish don't cast).
// Hard-won gotchas encoded below:
//   · Quaternius armatures nest x100 node scales — Box3-based normalisation
//     reads garbage; model scales are MANUAL (from the approved demo).
//   · Empty pixels through the composer double-encode the raw clear colour —
//     the fogged BackSide sphere stands in for the background.
//   · A page loaded in a hidden tab measures 0x0 — re-layout on every wake.

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { EffectComposer, RenderPass } from 'postprocessing';
import { GodraysPass } from 'three-good-godrays';

const SURFACE_Y = 3.6;
const WIN_W = 3.4; // window rect, world units (x)
const WIN_D = 1.9; // window rect depth (z)
const WIN_X = 3.7; // offset right
const WIN_Z = -1.0;
const OPEN_MS = 1900;
const OPEN_DELAY_MS = 500;
const IDLE_FRAME_MS = 30; // ~30fps ambient cap
// Model facing is PER-SPECIES in this pack (verified by posing + eyeballing,
// 2026-07-24): the school fish (Fish2/ClownFish) face +Z, the whale faces
// -Z. Each yaw turns that species' nose onto +X for the boids.
const SCHOOL_YAW = Math.PI / 2; // +Z nose → +X
const WHALE_YAW = -Math.PI / 2; // -Z nose → +X
// MANUAL scales (demo-calibrated) — never Box3-normalise these armatures.
const FISH_SCALE = 0.018;
const WHALE_SCALE = 0.09;
const FISH_URLS = ['/models/fish/fish2.glb', '/models/fish/clownfish.glb'];
const WHALE_URL = '/models/fish/whale.glb';

// ── Fixed palette — the EXACT approved-demo constants. The band is theme-
// INDEPENDENT by the user's decision (2026-07-24): same deep-ocean look in
// light and dark mode, no accent tracking (accent-mixing the sun/rays was
// what made the integrated colours drift from the demo). The hero text keeps
// contrast via local --bp-* token overrides in HomePage.astro instead.
const FOG = 0x06121d;
const FOG_DENSITY = 0.052;
const SURFACE_COLOR = 0x0e2233;
const SKY_COLOR = 0xdff2ff;
const SKY_DIM = 0x21333f; // window before the light wells up (open progress 0)
const HEMI_SKY = 0x2e5473;
const HEMI_GROUND = 0x03080e;
const HEMI_INTENSITY = 1.15;
const SUN_COLOR = 0xcfe8ff;
const SUN_INTENSITY = 4.5;
const RAYS_COLOR = 0xbfe3ff;
const RAYS_MAX_DENSITY = 0.55;
const SNOW_COLOR = 0x6f8ca3;
const FISH_EMISSIVE = 0x14242f;

/** Soft radial sprite texture (asset-free) for the window's light bleed. */
function glowTexture(): THREE.CanvasTexture {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 128;
  const ctx = cv.getContext('2d')!;
  const g = ctx.createRadialGradient(64, 64, 2, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,0.85)');
  g.addColorStop(0.4, 'rgba(255,255,255,0.22)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(cv);
}

export function initOceanHero(): void {
  const wrap = document.querySelector<HTMLElement>('.bp-ocean');
  const canvas = wrap?.querySelector('canvas');
  if (!wrap || !canvas) return;

  const off = () => document.documentElement.classList.remove('ocean-on');

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const FISH_COUNT = coarse ? 10 : 26;

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false, // fog + rays hide aliasing; saves fill
      alpha: false,
      powerPreference: 'low-power',
      stencil: false,
      depth: false, // the composer owns the depth buffer
    });
  } catch {
    off(); // head probe passed but real context creation failed → CSS fallback
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  // The only caster (the holed surface) never moves and the shaft SHAPE is
  // constant, so the shadow map is rendered on demand (init + resize) via
  // needsUpdate, never per-frame.
  renderer.shadowMap.autoUpdate = false;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 2, 0.1, 80);
  camera.position.set(0, -1.2, 9);
  camera.lookAt(0.6, 1.0, 0);

  // Backdrop: fogged shell standing in for the clear colour (see gotchas).
  const backdrop = new THREE.Mesh(
    new THREE.SphereGeometry(45, 24, 16),
    new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide, fog: true }),
  );
  backdrop.castShadow = backdrop.receiveShadow = false;
  scene.add(backdrop);

  // ── Rig: everything tied to the window position (shifted on narrow view).
  const rig = new THREE.Group();
  scene.add(rig);

  // Water surface with a REAL hole — it is the shadow caster, so light only
  // gets through the window rectangle.
  const shape = new THREE.Shape();
  shape.moveTo(-45, -25);
  shape.lineTo(45, -25);
  shape.lineTo(45, 25);
  shape.lineTo(-45, 25);
  shape.closePath();
  const holePath = new THREE.Path();
  const hx = WIN_X;
  const hy = -WIN_Z; // geometry y maps to world -z after the -90° X rotation
  holePath.moveTo(hx - WIN_W / 2, hy - WIN_D / 2);
  holePath.lineTo(hx + WIN_W / 2, hy - WIN_D / 2);
  holePath.lineTo(hx + WIN_W / 2, hy + WIN_D / 2);
  holePath.lineTo(hx - WIN_W / 2, hy + WIN_D / 2);
  holePath.closePath();
  shape.holes.push(holePath);
  const surfaceMat = new THREE.MeshStandardMaterial({ color: SURFACE_COLOR, roughness: 1, metalness: 0, side: THREE.DoubleSide });
  const surface = new THREE.Mesh(new THREE.ShapeGeometry(shape, 8), surfaceMat);
  surface.rotation.x = -Math.PI / 2;
  surface.position.y = SURFACE_Y;
  surface.castShadow = true;
  surface.receiveShadow = true;
  rig.add(surface);

  // Bright sky seen through the hole.
  const skyMat = new THREE.MeshBasicMaterial({ color: SKY_COLOR, fog: false, side: THREE.DoubleSide });
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(36, 20), skyMat);
  sky.rotation.x = Math.PI / 2;
  sky.position.set(WIN_X, SURFACE_Y + 3, WIN_Z);
  rig.add(sky);

  // Soft light bleed at the aperture — additive halo so the window reads as a
  // glowing underwater light source, not a hard-edged white cut-out. Sits just
  // under the surface, sized a touch past the hole; brightness follows the
  // opening (applyOpen).
  const glowMat = new THREE.SpriteMaterial({
    map: glowTexture(),
    color: SKY_COLOR,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
    fog: false,
    opacity: 0,
  });
  const glow = new THREE.Sprite(glowMat);
  glow.position.set(WIN_X, SURFACE_Y - 0.2, WIN_Z);
  glow.scale.set(WIN_W * 1.35, WIN_D * 1.7, 1); // hugs the window, no big cloud
  rig.add(glow);

  // No mechanical lid. Every hinged flap, under this oblique upper-right sun,
  // leans over its own aperture as it swings and shadows it for most of the
  // motion — the light "popped" on at the end instead of opening. Instead the
  // shaft EMERGES like sun breaking through: the surface hole is the only
  // occluder (constant rectangular shaft shape); applyOpen ramps the shaft
  // intensity, the sun, and the window brightness up together. Reads as light
  // welling up through the sky window — which is the whole idea.

  // Sun above the window, slanting the shaft down-left; hemisphere ambience.
  const sun = new THREE.DirectionalLight(SUN_COLOR, SUN_INTENSITY);
  sun.position.set(WIN_X + 3.2, SURFACE_Y + 8, WIN_Z + 0.3);
  sun.target.position.set(WIN_X - 4.4, SURFACE_Y - 10, WIN_Z);
  sun.castShadow = true;
  sun.shadow.mapSize.set(coarse ? 1024 : 2048, coarse ? 1024 : 2048);
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 45;
  sun.shadow.camera.left = -14;
  sun.shadow.camera.right = 14;
  sun.shadow.camera.top = 10;
  sun.shadow.camera.bottom = -16;
  sun.shadow.bias = -0.0004;
  rig.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight(HEMI_SKY, HEMI_GROUND, HEMI_INTENSITY);
  scene.add(hemi);

  // ── Post: shadow-raymarched god rays (three-good-godrays). multisampling
  // (WebGL2 MSAA on the render target) cleans the hard bright-window edge —
  // renderer antialias is ignored once the composer owns the buffer.
  const composer = new EffectComposer(renderer, {
    frameBufferType: THREE.HalfFloatType,
    multisampling: coarse ? 2 : 4,
  });
  const renderPass = new RenderPass(scene, camera);
  renderPass.renderToScreen = false;
  composer.addPass(renderPass);
  // Base params reused every applyOpen call — setParams spreads over DEFAULTS,
  // so the full set must be re-sent each time (only maxDensity varies).
  const GODRAYS_BASE = {
    density: 1 / 64,
    distanceAttenuation: 1.6,
    color: new THREE.Color(RAYS_COLOR),
    raymarchSteps: coarse ? 40 : 60,
    blur: true,
    gammaCorrection: true,
  };
  const godraysPass = new GodraysPass(sun, camera, { ...GODRAYS_BASE, maxDensity: RAYS_MAX_DENSITY });
  godraysPass.renderToScreen = true;
  composer.addPass(godraysPass);

  // ── Marine snow: faint organic detritus for depth. STRICTLY below the
  // water surface (SNOW_TOP) so none appear "in the sky" above the window,
  // drifting slowly with a gentle sideways sway (not straight-down rain).
  const SNOW = coarse ? 50 : 90;
  const SNOW_TOP = SURFACE_Y - 0.8; // 2.8 — never breaches the surface
  const SNOW_BOTTOM = -6.2;
  const snowPos = new Float32Array(SNOW * 3);
  const snowSpeed = new Float32Array(SNOW);
  const snowPhase = new Float32Array(SNOW);
  for (let i = 0; i < SNOW; i++) {
    snowPos[i * 3] = -8 + Math.random() * 16;
    snowPos[i * 3 + 1] = SNOW_BOTTOM + Math.random() * (SNOW_TOP - SNOW_BOTTOM);
    snowPos[i * 3 + 2] = -3 + Math.random() * 5;
    snowSpeed[i] = 0.02 + Math.random() * 0.05; // slow sink
    snowPhase[i] = Math.random() * Math.PI * 2;
  }
  const snowGeo = new THREE.BufferGeometry();
  snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
  const snowMat = new THREE.PointsMaterial({
    color: SNOW_COLOR,
    size: 0.04,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
    sizeAttenuation: true,
  });
  scene.add(new THREE.Points(snowGeo, snowMat));

  // ── Fish school (boids corridor crossing the shaft) + deep-fog whale.
  const fishGroup = new THREE.Group();
  scene.add(fishGroup);
  type Swimmer = { root: THREE.Group; mixer: THREE.AnimationMixer | null; mats: THREE.MeshStandardMaterial[] };
  const fishes: Swimmer[] = [];
  let whale: Swimmer | null = null;
  let whaleX = 4;

  const fpos: THREE.Vector3[] = [];
  const fvel: THREE.Vector3[] = [];
  const fscale: number[] = [];
  const fphase: number[] = [];
  for (let i = 0; i < FISH_COUNT; i++) {
    fpos.push(
      new THREE.Vector3(-5 + Math.random() * 10, -3.0 + Math.random() * 2.6, -2.2 + Math.random() * 2.6),
    );
    fvel.push(new THREE.Vector3(0.4 + Math.random() * 0.3, 0, 0));
    fscale.push(0.75 + Math.random() * 0.55);
    fphase.push(Math.random() * Math.PI * 2);
  }

  const prep = (src: THREE.Object3D, scl: number, yaw: number): Swimmer => {
    const inner = SkeletonUtils.clone(src);
    inner.scale.setScalar(scl); // MANUAL — see gotchas at the top
    inner.rotation.y = yaw; // per-species (SCHOOL_YAW / WHALE_YAW)
    const mats: THREE.MeshStandardMaterial[] = [];
    inner.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh && m.material && !Array.isArray(m.material)) {
        m.frustumCulled = false; // skinned bounds lag the swim animation
        m.receiveShadow = true;
        m.castShadow = false;
        const cloned = (m.material as THREE.MeshStandardMaterial).clone();
        cloned.emissive.setHex(FISH_EMISSIVE);
        m.material = cloned;
        mats.push(cloned);
      }
    });
    const root = new THREE.Group();
    root.add(inner);
    return { root, mixer: null, mats };
  };

  const loader = new GLTFLoader();
  Promise.all(FISH_URLS.map((u) => loader.loadAsync(u)))
    .then((gltfs) => {
      for (let i = 0; i < FISH_COUNT; i++) {
        const g = gltfs[i % 3 === 2 ? 1 : 0]; // ~2/3 fish2, 1/3 clownfish
        const f = prep(g.scene, FISH_SCALE * fscale[i], SCHOOL_YAW);
        if (g.animations.length) {
          f.mixer = new THREE.AnimationMixer(f.root);
          f.mixer.clipAction(g.animations[0]).play();
          f.mixer.timeScale = 0.9 + Math.random() * 0.6;
          f.mixer.update(Math.random() * 2); // desync the school
        }
        fishes.push(f);
        fishGroup.add(f.root);
      }
      if (staticMode) renderStatic();
    })
    .catch(() => {
      // Model fetch failed → the scene still reads (window/rays/snow); the
      // shaft simply has no school. Deliberate: no cone stand-ins this time.
    });

  loader
    .loadAsync(WHALE_URL)
    .then((g) => {
      whale = prep(g.scene, WHALE_SCALE, WHALE_YAW);
      whale.root.rotation.y = Math.PI; // prep leaves the nose on +X; drift is -X
      whale.root.position.set(whaleX, -0.9, -7.5);
      if (g.animations.length) {
        whale.mixer = new THREE.AnimationMixer(whale.root);
        whale.mixer.clipAction(g.animations[0]).play();
        whale.mixer.timeScale = 0.45;
      }
      scene.add(whale.root);
      if (staticMode) renderStatic();
    })
    .catch(() => {}); // whale is garnish — skip silently

  // ── Fixed atmosphere (theme-independent): fog + clear colour, set once.
  scene.fog = new THREE.FogExp2(FOG, FOG_DENSITY);
  renderer.setClearColor(new THREE.Color(FOG), 1);

  // ── Layout: on narrow viewports pull the rig (window+sun+doors) toward the
  // centre and widen the fov so the right-offset window stays in frame.
  const layout = () => {
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    if (w <= 0 || h <= 0) return; // hidden-tab gotcha: innerWidth can be 0
    const aspect = w / h;
    composer.setSize(w, h);
    camera.aspect = aspect;
    camera.fov = aspect < 0.8 ? 62 : 50;
    camera.updateProjectionMatrix();
    rig.position.x = aspect < 1.05 ? -(1.05 - aspect) * 2.6 : 0;
    fishGroup.position.x = rig.position.x * 0.55; // corridor follows, half-strength
    renderer.shadowMap.needsUpdate = true;
  };

  // ── Per-frame state (temps preallocated — zero-alloc loop).
  const tmpV = new THREE.Vector3();
  const attractor = new THREE.Vector3();

  const stepFish = (dt: number, t: number) => {
    // Attractor loops an ellipse whose x-range crosses the shaft corridor.
    const a = t * 0.07;
    attractor.set(0.4 + 3.2 * Math.cos(a), -1.5 + 0.9 * Math.sin(a * 1.7), -0.7 + 1.1 * Math.sin(a * 0.9));
    for (let i = 0; i < fishes.length; i++) {
      const p = fpos[i];
      const v = fvel[i];
      tmpV.copy(attractor).sub(p).multiplyScalar(0.12 * dt);
      v.add(tmpV);
      for (let j = 0; j < fishes.length; j++) {
        if (j === i) continue;
        tmpV.copy(p).sub(fpos[j]);
        const d2 = tmpV.lengthSq();
        if (d2 < 0.5 && d2 > 1e-6) v.add(tmpV.multiplyScalar((0.8 * dt) / (d2 * 8 + 0.1)));
      }
      v.x += Math.sin(t * 0.9 + fphase[i]) * 0.02 * dt;
      v.y += Math.cos(t * 0.7 + fphase[i] * 1.3) * 0.05 * dt;
      const speed = v.length();
      const cl = Math.max(0.35, Math.min(0.95, speed));
      if (speed > 1e-4) v.multiplyScalar(cl / speed);
      p.addScaledVector(v, dt);

      const f = fishes[i];
      f.root.position.copy(p);
      // Yaw/pitch only, NEVER shortest-arc quaternions: setFromUnitVectors
      // picks an arbitrary rotation axis near the 180° case, which rolled
      // fish belly-up whenever they swam toward -X. This keeps world-up up.
      f.root.rotation.set(
        0,
        Math.atan2(-v.z, v.x),
        Math.atan2(v.y, Math.hypot(v.x, v.z)),
        'YZX',
      );
      if (f.mixer) f.mixer.update(dt);
    }
    if (whale) {
      whaleX -= dt * 0.14;
      if (whaleX < -11) whaleX = 11;
      whale.root.position.x = whaleX;
      whale.root.position.y = -0.9 + Math.sin(t * 0.13) * 0.3;
      if (whale.mixer) whale.mixer.update(dt);
    }
  };

  const stepSnow = (dt: number, t: number) => {
    for (let i = 0; i < SNOW; i++) {
      let y = snowPos[i * 3 + 1] - snowSpeed[i] * dt;
      if (y < SNOW_BOTTOM) y = SNOW_TOP; // respawn below the surface, never above
      snowPos[i * 3 + 1] = y;
      snowPos[i * 3] += Math.sin(t * 0.3 + snowPhase[i]) * 0.06 * dt; // gentle sway
    }
    snowGeo.attributes.position.needsUpdate = true;
  };

  /** Opening progress 0→1: light WELLS UP through the sky window. smootherstep
   *  (slow → bloom → settle) ramps the shaft intensity, the sun, and the
   *  window brightness together — a soft dawn breaking through, not a hard
   *  switch. The shaft SHAPE is constant (the surface hole is the occluder);
   *  only its strength animates, so the shadow map never needs re-rendering. */
  const skyDim = new THREE.Color(SKY_DIM);
  const skyBright = new THREE.Color(SKY_COLOR);
  const applyOpen = (p: number) => {
    const e = p * p * (3 - 2 * p);
    godraysPass.setParams({ ...GODRAYS_BASE, maxDensity: e * RAYS_MAX_DENSITY });
    sun.intensity = e * SUN_INTENSITY;
    skyMat.color.copy(skyDim).lerp(skyBright, e);
    glowMat.opacity = e * 0.24;
  };

  // ── Static path (reduced motion): open pose, fish scattered, one frame.
  const staticMode = reduce;
  const renderStatic = () => {
    applyOpen(1);
    stepFish(0.016, 7);
    renderer.shadowMap.needsUpdate = true;
    composer.render(0.016);
  };

  // ── Lifecycle: pause when offscreen or tab hidden; die on context loss.
  let dead = false;
  let inView = true;
  let tabVisible = document.visibilityState !== 'hidden';
  let rafOn = false;
  let last = 0;
  let prev = 0;
  let opened = staticMode;
  let t0 = -1;

  const frame = (now: number) => {
    if (dead || !inView || !tabVisible) {
      rafOn = false;
      return;
    }
    requestAnimationFrame(frame);
    if (t0 < 0) {
      t0 = now;
      prev = now;
    }
    if (opened && now - last < IDLE_FRAME_MS) return; // ~30fps ambient cap
    last = now;
    const dt = Math.min(0.05, (now - prev) / 1000);
    prev = now;
    const t = (now - t0) / 1000;
    if (!opened) {
      const p = Math.min(1, Math.max(0, (now - t0 - OPEN_DELAY_MS) / OPEN_MS));
      applyOpen(p);
      if (p >= 1) opened = true;
    }
    stepFish(dt, t);
    stepSnow(dt, t);
    composer.render(dt);
    dbg.frames++;
  };

  const wake = () => {
    if (dead || staticMode || rafOn || !inView || !tabVisible) return;
    rafOn = true;
    prev = performance.now(); // avoid a dt jump after a pause
    requestAnimationFrame(frame);
  };

  canvas.addEventListener('webglcontextlost', () => {
    dead = true;
    off(); // CSS fallback (constellation + ring) comes back
  });

  // Re-run layout() on wake paths (hidden-tab 0x0 load — see gotchas).
  new IntersectionObserver((entries) => {
    inView = entries[0].isIntersecting;
    layout();
    wake();
    if (staticMode && inView) renderStatic();
  }).observe(wrap);
  document.addEventListener('visibilitychange', () => {
    tabVisible = document.visibilityState !== 'hidden';
    layout();
    wake();
    if (staticMode && tabVisible) renderStatic();
  });

  let resizeRaf = false;
  window.addEventListener(
    'resize',
    () => {
      if (resizeRaf) return;
      resizeRaf = true;
      requestAnimationFrame(() => {
        resizeRaf = false;
        layout();
        if (staticMode) renderStatic();
      });
    },
    { passive: true },
  );

  // (No theme/accent observers: the band is deliberately theme-independent —
  // the fixed demo palette renders identically in light and dark mode.)

  // Dev/verify handle (same convention as the old __bpGlow): enough to drive
  // and render frames headlessly — hidden tabs never tick rAF.
  const step = (dt: number, t: number) => {
    stepFish(dt, t);
    stepSnow(dt, t);
  };
  const dbg = {
    fish: FISH_COUNT,
    fishes,
    frames: 0,
    renderer,
    scene,
    camera,
    composer,
    staticMode,
    layout,
    applyOpen,
    step,
    openNow: () => {
      // NOT t0=-1e9: the loop re-seeds any t0<0, which would re-close the
      // doors on the next tick. Mark opened and pose the end state directly.
      opened = true;
      if (t0 < 0) t0 = 0;
      applyOpen(1);
      renderer.shadowMap.needsUpdate = true;
    },
  };
  (window as any).__oceanHero = dbg;

  layout();
  if (staticMode) {
    renderStatic();
  } else {
    applyOpen(0);
    wake();
  }
}
