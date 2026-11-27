// =========================================================
// v2 prototypes: the shared 3D studio, the same recipe as the Dwell worlds
// (ACES tone mapping, a soft room environment for reflections, real shadows, a coloured ground with matching fog)
//
// Realism pass (BRIEF-5): real things are never perfect. Every studio now renders through a small
// camera pipeline: contact ambient occlusion (GTAO), a touch of lens vignette, chromatic fringe and
// film grain. Pages add the rest with the helpers below: bevelled edges (rounded), uneven surfaces
// (lumpy), handling marks (grime -> roughnessMap/bumpMap), per-part colour drift (drift),
// and soft contact shadows under objects (contact).
//
// use it from a page:
//   <script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"}}</script>
//   <script type="module"> import { studio, T, canvasTex, rng } from "./studio.js"; ... </script>
// =========================================================

import * as T from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

export { T };

const PHONE = () => matchMedia("(max-width: 760px)").matches;
const REDUCED = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

// the "lens": vignette, a hair of chromatic fringe toward the corners, and moving film grain.
// Applied after tone mapping, like a real sensor, so the grain is even in the shadows.
const LensShader = {
  uniforms: { tDiffuse: { value: null }, time: { value: 0 }, grain: { value: 0.045 }, vignette: { value: 0.32 }, fringe: { value: 0.0016 }, res: { value: new T.Vector2(1, 1) } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float time, grain, vignette, fringe; uniform vec2 res; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main(){
      vec2 d = vUv - 0.5; float r2 = dot(d, d);
      vec2 off = d * fringe * r2 * 4.0;
      vec3 c = vec3(texture2D(tDiffuse, vUv + off).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - off).b);
      c *= 1.0 - vignette * smoothstep(0.08, 0.62, r2);
      vec2 px = floor(vUv * res);
      float n = h(px + fract(time) * 97.0) + h(px * 1.37 - fract(time * 1.3) * 53.0) - 1.0;
      float lum = dot(c, vec3(0.299, 0.587, 0.114));
      c += n * grain * (1.0 - lum * 0.6);
      gl_FragColor = vec4(c, 1.0);
    }`,
};

// a renderer, scene and camera that look like a photographed object on a table
// o.real (default true): render through AO + lens. o.ao: AO strength (0..1.5, default 1). o.grain, o.vignette, o.fringe.
export function studio(stage, o = {}) {
  const r = new T.WebGLRenderer({ antialias: true, alpha: o.bg === null, powerPreference: "high-performance" });
  r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = o.exposure ?? 1;
  r.outputColorSpace = T.SRGBColorSpace;
  if (o.shadows) { r.shadowMap.enabled = true; r.shadowMap.type = T.PCFSoftShadowMap; }
  stage.append(r.domElement);
  const scene = new T.Scene(), cam = new T.PerspectiveCamera(o.fov ?? 35, 1, 0.1, 400);
  if (o.bg != null) { scene.background = new T.Color(o.bg); if (o.fog) scene.fog = new T.Fog(o.bg, o.fog[0], o.fog[1]); }
  if (o.env) { const p = new T.PMREMGenerator(r); scene.environment = p.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = o.env; }

  let fx = null, ao = null, lens = null, w = 1, h = 1;
  if (o.real !== false) {
    try {
      fx = new EffectComposer(r, new T.WebGLRenderTarget(1, 1, { type: T.HalfFloatType, samples: 4 }));
      fx.addPass(new RenderPass(scene, cam));
      if (!PHONE() && (o.ao ?? 1) > 0) {
        ao = new GTAOPass(scene, cam, 1, 1);
        ao.output = GTAOPass.OUTPUT.Default;
        ao.blendIntensity = o.ao ?? 1;
        ao.updateGtaoMaterial({ radius: o.aoRadius ?? 0.35, distanceExponent: 1.4, thickness: 1.2, scale: 1, samples: 12 });
        ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 12 });
        fx.addPass(ao);
      }
      fx.addPass(new OutputPass());
      lens = new ShaderPass(LensShader);
      lens.uniforms.grain.value = o.grain ?? 0.045;
      lens.uniforms.vignette.value = o.vignette ?? 0.32;
      lens.uniforms.fringe.value = o.fringe ?? 0.0016;
      fx.addPass(lens);
    } catch (e) { fx = null; }
  }
  const t0 = performance.now();
  return {
    r, scene, cam, fx, ao, lens,
    size(W, H, d = Math.min(devicePixelRatio, 2)) {
      w = W; h = H; r.setPixelRatio(d); r.setSize(W, H); cam.aspect = W / H; cam.updateProjectionMatrix();
      if (fx) { fx.setPixelRatio(d); fx.setSize(W, H); lens.uniforms.res.value.set(W * d, H * d); }
    },
    draw() {
      if (!fx) return r.render(scene, cam);
      // grain moves at 24fps like film, and holds still when the visitor asked for less motion
      lens.uniforms.time.value = REDUCED() ? 0 : Math.floor((performance.now() - t0) / 41.7) * 0.137;
      fx.render();
    },
  };
}

// a key light that casts soft shadows, plus a cool fill and a warm rim, like a photo studio.
// Real light isn't one even blast: the key is slightly warm and falls off, the fill is cool and weak,
// and a rim from behind traces the silhouette so the object separates from the room.
export function lights(scene, o = {}) {
  const key = new T.SpotLight(o.key ?? 0xfff0dc, o.power ?? 260, 60, 0.6, 0.85, 2);
  key.position.set(...(o.at ?? [6, 10, 7])); key.target.position.set(...(o.look ?? [0, 1, 0]));
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02; key.shadow.radius = o.soft ?? 9; key.shadow.blurSamples = 16;
  const fill = new T.DirectionalLight(o.fill ?? 0x9db7d8, o.fillPower ?? 0.5); fill.position.set(-6, 5, 4);
  const rim = new T.DirectionalLight(o.rim ?? 0xffe2c4, o.rimPower ?? 0.8); rim.position.set(-2, 6, -9);
  scene.add(key, key.target, fill, rim);
  return { key, fill, rim };
}

// paint a texture on a canvas (wood grain, paper, smoked metal...) and hand it to three
export function canvasTex(w, h, paint, o = {}) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; paint(c.getContext("2d"), w, h);
  const t = new T.CanvasTexture(c); t.colorSpace = o.data ? T.NoColorSpace : T.SRGBColorSpace; t.anisotropy = 8;
  if (o.repeat) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(o.repeat, o.repeat); }
  return t;
}

// a real photo as a texture
export function photoTex(src) {
  const t = new T.TextureLoader().load(src); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; return t;
}

// seeded random, so a texture looks the same every visit
export function rng(seed = 1) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

// ease a value toward a target, frame-rate independent
export const follow = (cur, to, dt, rate = 2) => cur + (to - cur) * (1 - Math.exp(-dt * rate));

// ---------------------------------------------------------
// imperfection helpers
// ---------------------------------------------------------

// a box with real, rounded edges. Nothing machined or moulded has razor corners;
// the bevel catches a thin line of light that tells the eye "this is solid".
export function rounded(w, h, d, radius = 0.02, seg = 3) { return new RoundedBoxGeometry(w, h, d, seg, Math.min(radius, w / 2, h / 2, d / 2)); }

// a cheap smooth 3D noise for wobble
function vnoise(x, y, z) {
  const s = (a) => Math.sin(a);
  return (s(x * 1.7 + s(y * 2.3) * 1.1) + s(y * 1.9 + s(z * 2.9) * 1.3) + s(z * 2.1 + s(x * 3.1) * 0.9)) / 3;
}

// make a geometry a little uneven: hand-cut wood, cast metal, a soft rubber grip, a slumped clay pot.
// amt is in world units (0.002 for machined parts, 0.01 for wood, 0.03 for clay). freq = bumps per unit.
export function lumpy(geo, amt = 0.004, freq = 3, seed = 1) {
  const p = geo.attributes.position, n = geo.attributes.normal, k = seed * 7.13;
  if (!n) geo.computeVertexNormals();
  const N = geo.attributes.normal;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const v = vnoise(x * freq + k, y * freq - k, z * freq + k * 0.5) * amt;
    p.setXYZ(i, x + N.getX(i) * v, y + N.getY(i) * v, z + N.getZ(i) * v);
  }
  p.needsUpdate = true; geo.computeVertexNormals();
  return geo;
}

// handling marks as a data texture: roughness that varies (fingerprints, rubbed edges, a wiped patch),
// fine scratches, and dust. Use it as roughnessMap (and bumpMap at a tiny bumpScale).
// base: the material's average roughness 0..1. o.prints, o.scratches, o.dust: counts. o.seed.
export function grime(size = 1024, o = {}) {
  const R = rng(o.seed ?? 3), base = o.base ?? 0.5;
  return canvasTex(size, size, (g, W, H) => {
    const v = (x) => Math.round(Math.max(0, Math.min(1, x)) * 255);
    g.fillStyle = `rgb(${v(base)},${v(base)},${v(base)})`; g.fillRect(0, 0, W, H);
    // broad, uneven patches: no surface has the same sheen everywhere
    for (let i = 0; i < 26; i++) {
      const x = R() * W, y = R() * H, rr = (0.08 + R() * 0.25) * W, d = (R() - 0.5) * 0.18;
      const gr = g.createRadialGradient(x, y, 0, x, y, rr);
      gr.addColorStop(0, `rgba(${v(base + d)},${v(base + d)},${v(base + d)},0.55)`); gr.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
    }
    // fingerprints: whorls of slightly glossier ridges
    for (let i = 0; i < (o.prints ?? 5); i++) {
      const x = R() * W, y = R() * H, a = R() * Math.PI, sc = W / 1024;
      g.save(); g.translate(x, y); g.rotate(a); g.scale(1, 1.35);
      g.strokeStyle = `rgba(${v(base - 0.22)},${v(base - 0.22)},${v(base - 0.22)},0.35)`; g.lineWidth = 1.4 * sc;
      for (let k = 2; k < 15; k++) { g.beginPath(); g.ellipse(0, 0, k * 2.4 * sc, k * 2.1 * sc, 0, R() * 0.6, Math.PI * 2 - R() * 0.9); g.stroke(); }
      g.restore();
    }
    // fine scratches, mostly in one direction like they came from a sleeve or a bench
    const dir = R() * Math.PI;
    for (let i = 0; i < (o.scratches ?? 140); i++) {
      const x = R() * W, y = R() * H, L = (6 + R() * 60) * W / 1024, a = dir + (R() - 0.5) * 0.9;
      g.strokeStyle = `rgba(${v(base + 0.25)},${v(base + 0.25)},${v(base + 0.25)},${0.15 + R() * 0.35})`; g.lineWidth = (0.5 + R()) * W / 1024;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke();
    }
    // dust specks (rough, matte)
    for (let i = 0; i < (o.dust ?? 900); i++) {
      const s = (0.6 + R() * 1.8) * W / 1024;
      g.fillStyle = `rgba(255,255,255,${0.2 + R() * 0.5})`; g.fillRect(R() * W, R() * H, s, s);
    }
  }, { data: true, repeat: o.repeat });
}

// put grime on a standard/physical material in one call
export function wear(mat, o = {}) {
  const t = grime(o.size ?? 1024, { base: o.base ?? mat.roughness ?? 0.5, ...o });
  mat.roughnessMap = t; mat.roughness = 1; // the map now carries the value
  mat.bumpMap = t; mat.bumpScale = o.bump ?? 0.6;
  mat.needsUpdate = true;
  return mat;
}

// two parts cut from the "same" sheet never match exactly: drift a colour a little in hue, saturation and value
export function drift(hex, amt = 0.03, R = Math.random) {
  const c = new T.Color(hex), hsl = {}; c.getHSL(hsl);
  c.setHSL((hsl.h + (R() - 0.5) * amt * 0.5 + 1) % 1, Math.max(0, Math.min(1, hsl.s + (R() - 0.5) * amt * 2)), Math.max(0, Math.min(1, hsl.l + (R() - 0.5) * amt * 2)));
  return c;
}

// a soft contact shadow: a blurred dark pad right under an object, where light can't reach.
// This is the single biggest "it's sitting there, not floating" cue. Works on phones where AO is off.
export function contact(w = 1, d = 1, o = {}) {
  const t = canvasTex(256, 256, (g, W, H) => {
    const gr = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2);
    gr.addColorStop(0, `rgba(0,0,0,${o.dark ?? 0.55})`); gr.addColorStop(0.45, `rgba(0,0,0,${(o.dark ?? 0.55) * 0.45})`); gr.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
  });
  const m = new T.Mesh(new T.PlaneGeometry(w * 1.25, d * 1.25), new T.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false, color: o.tint ?? 0x000000 }));
  m.material.color.set(0xffffff); m.rotation.x = -Math.PI / 2; m.position.y = o.y ?? 0.002; m.renderOrder = -1;
  return m;
}
