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
//   · Colour tracks --accent-rgb live; light/dark tracks body.light-mode
//     (same MutationObserver contract the old bpGlow used).
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
const WIN_X = 3.1; // offset right
const WIN_Z = -1.0;
const OPEN_MS = 1900;
const OPEN_DELAY_MS = 500;
const IDLE_FRAME_MS = 30; // ~30fps ambient cap
// Quaternius models face -Z; the boids orient noses along +X.
const MODEL_YAW = -Math.PI / 2;
// MANUAL scales (demo-calibrated) — never Box3-normalise these armatures.
const FISH_SCALE = 0.018;
const WHALE_SCALE = 0.09;
const FISH_URLS = ['/models/fish/fish2.glb', '/models/fish/clownfish.glb'];
const WHALE_URL = '/models/fish/whale.glb';

type RGB = [number, number, number];

/** Live accent as 0..1 rgb; falls back to the blueprint blue. */
function accentRgb(): RGB {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--accent-rgb')
    .trim();
  const parts = (raw || '27 86 255').split(/[\s,]+/).map(Number);
  if (parts.length < 3 || parts.some((n) => !isFinite(n))) return [27 / 255, 86 / 255, 1];
  return [parts[0] / 255, parts[1] / 255, parts[2] / 255];
}

function mix(a: RGB, b: RGB, t: number): RGB {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}
function col(rgb: RGB): THREE.Color {
  return new THREE.Color(rgb[0], rgb[1], rgb[2]);
}
function hex(h: number): RGB {
  return [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255];
}

/** Theme palette. Dark = the approved demo look; light stays a PALE sunlit
 *  wash so the hero's dark ink text keeps AA contrast on the band. */
function palette(light: boolean, acc: RGB) {
  return light
    ? {
        fog: hex(0xc9e2ee),
        fogDensity: 0.045,
        surface: hex(0xb9d7e6),
        sky: hex(0xffffff),
        panel: hex(0x9dc0d2),
        hemiSky: hex(0xdfeef7),
        hemiGround: hex(0x9fc2d4),
        hemiIntensity: 1.6,
        sunColor: mix(hex(0xfff6dd), acc, 0.15),
        sunIntensity: 5.5,
        rays: mix(hex(0xfff3cf), acc, 0.15),
        maxDensity: 0.32,
        snow: hex(0xa8c8d8),
        fishEmissive: 0x0a141c,
      }
    : {
        fog: hex(0x06121d),
        fogDensity: 0.052,
        surface: hex(0x0e2233),
        sky: hex(0xdff2ff),
        panel: hex(0x091019),
        hemiSky: hex(0x2e5473),
        hemiGround: hex(0x03080e),
        hemiIntensity: 1.15,
        sunColor: mix(hex(0xcfe8ff), acc, 0.25),
        sunIntensity: 4.5,
        rays: mix(hex(0xbfe3ff), acc, 0.25),
        maxDensity: 0.55,
        snow: hex(0x6f8ca3),
        fishEmissive: 0x14242f,
      };
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
  const surfaceMat = new THREE.MeshStandardMaterial({ roughness: 1, metalness: 0, side: THREE.DoubleSide });
  const surface = new THREE.Mesh(new THREE.ShapeGeometry(shape, 8), surfaceMat);
  surface.rotation.x = -Math.PI / 2;
  surface.position.y = SURFACE_Y;
  surface.castShadow = true;
  surface.receiveShadow = true;
  rig.add(surface);

  // Bright sky seen through the hole.
  const skyMat = new THREE.MeshBasicMaterial({ fog: false, side: THREE.DoubleSide });
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(36, 20), skyMat);
  sky.rotation.x = Math.PI / 2;
  sky.position.set(WIN_X, SURFACE_Y + 3, WIN_Z);
  rig.add(sky);

  // Hatch doors — real occluders: the shaft grows as they swing open.
  const panelMat = new THREE.MeshStandardMaterial({ roughness: 1 });
  const mkPanel = (side: 1 | -1) => {
    const hinge = new THREE.Group();
    hinge.position.set(WIN_X + (side * WIN_W) / 2, SURFACE_Y - 0.05, WIN_Z);
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(WIN_W / 2 + 0.06, 0.06, WIN_D + 0.06), panelMat);
    leaf.position.x = (-side * WIN_W) / 4;
    leaf.castShadow = true;
    hinge.add(leaf);
    rig.add(hinge);
    return hinge;
  };
  const panelL = mkPanel(-1);
  const panelR = mkPanel(1);

  // Sun above the window, slanting the shaft down-left; hemisphere ambience.
  const sun = new THREE.DirectionalLight(0xffffff, 4.5);
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
  const hemi = new THREE.HemisphereLight(0xffffff, 0x000000, 1.15);
  scene.add(hemi);

  // ── Post: shadow-raymarched god rays (three-good-godrays).
  const composer = new EffectComposer(renderer, { frameBufferType: THREE.HalfFloatType });
  const renderPass = new RenderPass(scene, camera);
  renderPass.renderToScreen = false;
  composer.addPass(renderPass);
  let godraysPass: GodraysPass | null = null;
  const buildGodrays = (raysColor: THREE.Color, maxDensity: number) => {
    if (godraysPass) {
      composer.removePass(godraysPass);
      godraysPass.dispose();
    }
    godraysPass = new GodraysPass(sun, camera, {
      density: 1 / 64,
      maxDensity,
      distanceAttenuation: 1.6,
      color: raysColor,
      raymarchSteps: coarse ? 40 : 60,
      blur: true,
      gammaCorrection: true,
    });
    godraysPass.renderToScreen = true;
    composer.addPass(godraysPass);
  };

  // ── Marine snow.
  const SNOW = coarse ? 60 : 140;
  const snowPos = new Float32Array(SNOW * 3);
  const snowSpeed = new Float32Array(SNOW);
  for (let i = 0; i < SNOW; i++) {
    snowPos[i * 3] = -8 + Math.random() * 16;
    snowPos[i * 3 + 1] = -6 + Math.random() * 10;
    snowPos[i * 3 + 2] = -3 + Math.random() * 5;
    snowSpeed[i] = 0.05 + Math.random() * 0.12;
  }
  const snowGeo = new THREE.BufferGeometry();
  snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
  const snowMat = new THREE.PointsMaterial({
    size: 0.045,
    transparent: true,
    opacity: 0.5,
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

  let fishEmissive = 0x14242f;
  const prep = (src: THREE.Object3D, scl: number): Swimmer => {
    const inner = SkeletonUtils.clone(src);
    inner.scale.setScalar(scl); // MANUAL — see gotchas at the top
    inner.rotation.y = MODEL_YAW;
    const mats: THREE.MeshStandardMaterial[] = [];
    inner.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh && m.material && !Array.isArray(m.material)) {
        m.frustumCulled = false; // skinned bounds lag the swim animation
        m.receiveShadow = true;
        m.castShadow = false;
        const cloned = (m.material as THREE.MeshStandardMaterial).clone();
        cloned.emissive.setHex(fishEmissive);
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
        const f = prep(g.scene, FISH_SCALE * fscale[i]);
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
      whale = prep(g.scene, WHALE_SCALE);
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

  // ── Theme (light/dark + accent scheme) — mirrors the old bpGlow contract.
  let pal = palette(document.body.classList.contains('light-mode'), accentRgb());
  const applyTheme = () => {
    pal = palette(document.body.classList.contains('light-mode'), accentRgb());
    scene.fog = new THREE.FogExp2(col(pal.fog).getHex(), pal.fogDensity);
    renderer.setClearColor(col(pal.fog), 1);
    surfaceMat.color = col(pal.surface);
    skyMat.color = col(pal.sky);
    panelMat.color = col(pal.panel);
    snowMat.color = col(pal.snow);
    hemi.color = col(pal.hemiSky);
    hemi.groundColor = col(pal.hemiGround);
    hemi.intensity = pal.hemiIntensity;
    sun.color = col(pal.sunColor);
    sun.intensity = pal.sunIntensity;
    fishEmissive = pal.fishEmissive;
    for (const f of fishes) for (const m of f.mats) m.emissive.setHex(fishEmissive);
    if (whale) for (const m of whale.mats) m.emissive.setHex(fishEmissive);
    buildGodrays(col(pal.rays), pal.maxDensity);
    renderer.shadowMap.needsUpdate = true;
    if (staticMode) renderStatic();
  };

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
  const tmpQ = new THREE.Quaternion();
  const tmpV = new THREE.Vector3();
  const X_AXIS = new THREE.Vector3(1, 0, 0);
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
      tmpV.copy(v).normalize();
      tmpQ.setFromUnitVectors(X_AXIS, tmpV);
      f.root.position.copy(p);
      f.root.quaternion.copy(tmpQ);
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

  const stepSnow = (dt: number) => {
    for (let i = 0; i < SNOW; i++) {
      let y = snowPos[i * 3 + 1] - snowSpeed[i] * dt;
      if (y < -6.2) y = 4;
      snowPos[i * 3 + 1] = y;
    }
    snowGeo.attributes.position.needsUpdate = true;
  };

  /** Opening progress 0→1 (cubic in-out): the doors are shadow casters, so
   *  the shaft grows physically as they swing — nothing else to fade. */
  const applyOpen = (p: number) => {
    const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
    panelL.rotation.z = e * 1.9;
    panelR.rotation.z = -e * 1.9;
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
      if (p >= 1) {
        opened = true;
        // Casters are static from here (fish don't cast) — freeze the map.
        renderer.shadowMap.autoUpdate = false;
      }
    }
    stepFish(dt, t);
    stepSnow(dt);
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

  new MutationObserver(applyTheme).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-scheme', 'class'],
  });
  new MutationObserver(applyTheme).observe(document.body, {
    attributes: true,
    attributeFilter: ['class'],
  });

  // Dev/verify handle (same convention as the old __bpGlow): enough to drive
  // and render frames headlessly — hidden tabs never tick rAF.
  const step = (dt: number, t: number) => {
    stepFish(dt, t);
    stepSnow(dt);
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
      t0 = -1e9;
      applyOpen(1);
    },
  };
  (window as any).__oceanHero = dbg;

  layout();
  applyTheme();
  if (staticMode) {
    renderStatic();
  } else {
    applyOpen(0);
    wake();
  }
}
