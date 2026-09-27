// =========================================================
// Varun Chilukuri, portfolio
// columns open side by side (stacked downward on phones) over a moving heat grid
// =========================================================

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const wideQuery = window.matchMedia("(min-width: 1100px)");
const TAU = Math.PI * 2;
document.documentElement.classList.add("js-load");

// ---------- palettes: five stops from low to high heat; accent is the text-safe colour for that page ----------
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const PAL = {
  index: { ramp: ["#1b1c20", "#303238", "#555961", "#979ba4", "#eceef1"], accent: "#e4e6ea" },
  builds: { ramp: ["#241b40", "#46308a", "#7650dc", "#b095ff", "#ebe2ff"], accent: "#c2adff" },
  awards: { ramp: ["#33260a", "#735208", "#c68a0e", "#f0c444", "#fff1bd"], accent: "#f0c444" },
  fetch: { ramp: ["#0f2b20", "#15573a", "#1f9a60", "#5fd79a", "#d6f7e6"], accent: "#6fdca5" },
  ceres: { ramp: ["#232a0e", "#4a5d16", "#83a022", "#c2dc5c", "#eff7ca"], accent: "#c2dc5c" },
  sweeper: { ramp: ["#341b07", "#763b08", "#cd6f10", "#f6a84a", "#ffe4c2"], accent: "#f6a84a" },
  arm: { ramp: ["#34101f", "#761e4b", "#c63c84", "#f18dbf", "#ffdeee"], accent: "#f39bc7" },
  eclipse: { ramp: ["#151a39", "#262f76", "#4a57c6", "#8f9bf1", "#e0e4ff"], accent: "#a3adf5" },
  maglift: { ramp: ["#350e0c", "#7a1b15", "#d2362b", "#f48b81", "#ffdedb"], accent: "#f69a91" },
  mars: { ramp: ["#30170b", "#6b2e11", "#b5561f", "#e79b6c", "#fbe2d2"], accent: "#eba47a" },
  mouse: { ramp: ["#0a2b2d", "#0f5a5e", "#16a0a4", "#63d6d8", "#d4f6f6"], accent: "#6fdadc" },
};
Object.values(PAL).forEach((p) => (p.stops = p.ramp.map(hex)));

// ---------- the heat grid ----------
const field = (function () {
  const cv = document.getElementById("field");
  const ctx = cv.getContext("2d");
  const sv = document.getElementById("sweep");
  const sctx = sv.getContext("2d");
  let sweep = null;                      // the band crossing a column right now, if any
  let G = 18, GAP = 2;                   // tile pitch and the gap between tiles
  let W = 1, H = 1, cols = 0, rows = 0, ox = 0, oy = 0;
  let eFrom, eTo, eT0, eDelay, pDelay;   // per row: the covered edge and its motion; the palette sweep
  let edgeGoal = 0, stage = { x: 0, top: 0, h: 1 };
  let palFrom = PAL.index, palTo = PAL.index, palT0 = -99;
  const stamps = [], ripples = [];
  let running = false, raf = 0, pulseT = -99;
  const T0 = performance.now();
  const now = () => (performance.now() - T0) / 1000;
  const EDGE_DUR = 0.5, PAL_DUR = 0.32, LEVELS = 40;

  const hash3 = (x, y, z) => {
    let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 1440662683)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  const hashf = (v) => { const s = Math.sin(v * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const sm = (f) => f * f * (3 - 2 * f);
  function vnoise(x, y, z) {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const xf = sm(x - xi), yf = sm(y - yi), zf = sm(z - zi);
    const l = (a, b, f) => a + (b - a) * f;
    const c = (dx, dy, dz) => hash3(xi + dx, yi + dy, zi + dz);
    return l(l(l(c(0, 0, 0), c(1, 0, 0), xf), l(c(0, 1, 0), c(1, 1, 0), xf), yf),
             l(l(c(0, 0, 1), c(1, 0, 1), xf), l(c(0, 1, 1), c(1, 1, 1), xf), yf), zf);
  }
  const ease = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

  // ----- the name, in 5x7 pixel letters, laid into the grid -----
  // two pixel faces: a bold 7x9 one when there is room, and a 5x7 one for tighter spaces and phones
  const FONTS = [
    { w: 7, h: 9, gap: 2, g: {
      V: ["11...11", "11...11", "11...11", "11...11", "11...11", ".11.11.", ".11.11.", "..111..", "...1..."],
      A: ["..111..", ".11.11.", "11...11", "11...11", "1111111", "11...11", "11...11", "11...11", "11...11"],
      R: ["111111.", "11...11", "11...11", "11...11", "111111.", "11.11..", "11..11.", "11...11", "11...11"],
      U: ["11...11", "11...11", "11...11", "11...11", "11...11", "11...11", "11...11", "11...11", ".11111."],
      N: ["11...11", "111..11", "1111.11", "11.1111", "11..111", "11...11", "11...11", "11...11", "11...11"],
    } },
    { w: 5, h: 7, gap: 1, g: {
      V: ["1...1", "1...1", "1...1", "1...1", "1...1", ".1.1.", "..1.."],
      A: [".111.", "1...1", "1...1", "11111", "1...1", "1...1", "1...1"],
      R: ["1111.", "1...1", "1...1", "1111.", "1.1..", "1..1.", "1...1"],
      U: ["1...1", "1...1", "1...1", "1...1", "1...1", "1...1", ".111."],
      N: ["1...1", "11..1", "1.1.1", "1..11", "1...1", "1...1", "1...1"],
    } },
  ];
  const NAME = "VARUN";
  FONTS.forEach((f) => { f.cw = NAME.length * (f.w + f.gap) - f.gap; });
  let nameAt = null, nameT0 = -99, nameFrom = null;   // where it sits now, and where it faded from
  function placeName() {
    // centred in the open space, snapped to the tiles, in the biggest face that fits; hidden if neither fits.
    // only tiles fully on screen and fully inside the open space count
    const c0 = Math.max(0, Math.ceil((stage.x - ox) / G)), c1 = Math.floor((W - ox) / G) - 1;
    const r0 = Math.max(0, Math.ceil((stage.top - oy) / G)), r1 = Math.min(Math.floor((H - oy) / G) - 1, Math.floor((stage.top + stage.h - oy) / G) - 1);
    const room = c1 - c0 + 1, tall = r1 - r0 + 1;
    let next = null;
    for (const f of FONTS) {
      if (room >= f.cw + 4 && tall >= f.h + 2) {
        next = { c: c0 + Math.floor((room - f.cw) / 2), r: r0 + Math.floor((tall - f.h) / 2), f };
        break;
      }
    }
    const same = (a, b) => (a && b ? a.c === b.c && a.r === b.r && a.f === b.f : a === b);
    if (same(next, nameAt)) return;
    nameFrom = nameAt; nameAt = next; nameT0 = now();
  }
  function nameHit(at, c, r) {
    if (!at) return 0;
    const f = at.f, lc = c - at.c, lr = r - at.r;
    if (lc < 0 || lr < 0 || lc >= f.cw || lr >= f.h) return 0;
    const g = Math.floor(lc / (f.w + f.gap)), gc = lc % (f.w + f.gap);
    if (gc >= f.w) return 0;
    return f.g[NAME[g]][lr][gc] === "1" ? 1 : 0;
  }
  function heatAt(x, y, t) {
    // two layers of drifting noise, plus a slow wave folded through them (in screen pixels, so tile size doesn't matter)
    const n1 = vnoise(x * 0.0045 + t * 0.045, y * 0.0045 - t * 0.02, t * 0.05);
    const n2 = vnoise(x * 0.011 + 11, y * 0.011 + t * 0.03, t * 0.09 + 5);
    const wave = 0.5 + 0.5 * Math.sin(x * 0.007 + y * 0.004 + t * 0.35 + n1 * 4);
    // mostly dark, with light only at the peaks
    return Math.pow(sm(clamp01((n1 * 0.62 + n2 * 0.23 + wave * 0.15 - 0.2) / 0.62)), 1.55);
  }

  function edgeAt(r, t) {
    const p = clamp01((t - eT0[r] - eDelay[r]) / EDGE_DUR);
    return eFrom[r] + (eTo[r] - eFrom[r]) * ease(p);
  }
  function edgeMotion(r, t) {
    const p = (t - eT0[r] - eDelay[r]) / EDGE_DUR;
    return p > 0 && p < 1 && eFrom[r] !== eTo[r] ? Math.sin(Math.PI * p) : 0;
  }
  // rows move in bands of a few, each band on its own delay, so the edge crawls in steps instead of one straight line
  function setEdge(px, animate) {
    const t = now(), seed = Math.random() * 1000;
    const lag = animate && px < edgeGoal ? 0.12 : 0;   // closing: let the column pull away first
    edgeGoal = px;
    let r = 0;
    while (r < rows) {
      const band = 1 + Math.floor(hashf(seed + r * 3.1) * 4);
      const d = animate ? lag + hashf(seed + r * 7.7 + 1) * 0.36 : 0;
      for (let k = 0; k < band && r < rows; k++, r++) {
        eFrom[r] = animate ? edgeAt(r, t) : px; eTo[r] = px; eT0[r] = t; eDelay[r] = d;
      }
    }
    kick();
  }
  // a new palette sweeps down the rows, a little unevenly
  let colors = [];
  function setPalette(key, animate) {
    const next = PAL[key] || PAL.index;
    if (next === palTo) return;
    palFrom = animate ? palTo : next; palTo = next; palT0 = now();
    const seed = Math.random() * 1000;
    for (let r = 0; r < rows; r++) pDelay[r] = (r / Math.max(1, rows)) * 0.55 + hashf(seed + r) * 0.12;
    colors = [];
    kick();
  }
  function setStage(x, top, h) { stage = { x, top, h }; placeName(); kick(); }
  function pulseName() { pulseT = now(); kick(); }

  const mixc = (a, b, f) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
  function rampAt(p, h) { const pos = h * 4, i = Math.min(3, Math.floor(pos)); return mixc(p.stops[i], p.stops[i + 1], pos - i); }
  // colour for a heat level, palette mix step, and how strongly the name is lit on that tile
  function colorFor(m, l, n) {
    const k = (n * 5 + m) * LEVELS + l;
    if (!colors[k]) {
      const h = l / (LEVELS - 1);
      let c = mixc(rampAt(palFrom, h), rampAt(palTo, h), m / 4);
      // the name reads against anything: it lifts dark tiles and darkens light ones
      // letters lift gently toward white, the same way on any colour
      if (n) c = mixc(c, [246, 246, 244], 0.3 + n * 0.1);
      colors[k] = `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
    }
    return colors[k];
  }

  function size() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    G = W < 700 ? Math.max(9, Math.min(14, Math.floor((W - 24) / (FONTS[1].cw + 4)))) : 18;
    GAP = G < 12 ? 1 : 2;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    sv.width = cv.width; sv.height = cv.height;
    sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(W / G) + 1; rows = Math.ceil(H / G) + 1;
    ox = Math.round((W - cols * G) / 2); oy = Math.round((H - rows * G) / 2);
    const keep = eTo ? edgeGoal : W;
    eFrom = new Float32Array(rows).fill(keep); eTo = new Float32Array(rows).fill(keep);
    eT0 = new Float32Array(rows); eDelay = new Float32Array(rows); pDelay = new Float32Array(rows);
    colors = [];
    nameAt = null; nameFrom = null;
    placeName();
  }

  const buckets = [];
  const off = [];
  function frame(t) {
    const palDone = t - palT0 > 0.55 + 0.12 + PAL_DUR;
    if (palDone && palFrom !== palTo) { palFrom = palTo; colors = []; }
    while (stamps.length && t - stamps[0][2] > 1) stamps.shift();
    while (ripples.length && t - ripples[0][2] > 1.4) ripples.shift();
    // the name fades between spots when the open space changes; a hover on the name makes it glow for a moment
    // out from the old spot first, then in at the new one, so the letters never overlap
    const nOff = 1 - clamp01((t - nameT0) / 0.3), nOn = clamp01((t - nameT0 - 0.3) / 0.45), pu = t - pulseT;
    const pulse = pu > 0 && pu < 2.6 ? Math.sin(Math.min(1, pu / 0.35) * Math.PI / 2) * (pu > 2 ? 1 - (pu - 2) / 0.6 : 1) : 0;
    const wakeS2 = 2 * (G * 1.7) ** 2, wakeLim = (G * 5.5) ** 2, rw = G * 1.1;
    for (const b of buckets) if (b) b.length = 0;
    off.length = 0;
    const s = G - GAP;
    for (let r = 0; r < rows; r++) {
      const y = oy + r * G, cyy = y + G / 2, e = edgeAt(r, t), glow = edgeMotion(r, t);
      const m = palFrom === palTo ? 4 : Math.round(clamp01((t - palT0 - pDelay[r]) / PAL_DUR) * 4);
      for (let c = 0; c < cols; c++) {
        const x = ox + c * G, cxx = x + G / 2;
        if (cxx < e) { off.push(x, y); continue; }
        let h = heatAt(cxx, cyy, t);
        for (let i = 0; i < stamps.length; i++) {
          const st = stamps[i], d2 = (cxx - st[0]) ** 2 + (cyy - st[1]) ** 2;
          if (d2 < wakeLim) h += 0.6 * Math.exp(-d2 / wakeS2) * Math.pow(1 - (t - st[2]), 1.5);
        }
        for (let i = 0; i < ripples.length; i++) {
          const rp = ripples[i], u = t - rp[2], d = Math.hypot(cxx - rp[0], cyy - rp[1]) - u * 460;
          if (d > -rw * 3 && d < rw * 3) h += (1 - u / 1.4) * 0.8 * Math.exp(-((d / rw) ** 2));
        }
        if (glow) { const dx = cxx - e; if (dx < G * 4) h += 0.8 * glow * Math.exp(-((dx / (G * 1.3)) ** 2)); }
        h = clamp01(h);
        let n = 0;
        const on = nameHit(nameAt, c, r) * nOn + nameHit(nameFrom, c, r) * nOff;
        if (on > 0.02) n = Math.max(1, Math.min(3, Math.round(on * (1 + pulse * 2))));
        const k = (n * 5 + m) * LEVELS + Math.round(h * (LEVELS - 1));
        (buckets[k] || (buckets[k] = [])).push(x, y);
      }
    }
    drawSweep(t, s);
    ctx.clearRect(0, 0, W, H);
    const rr = Math.min(2, s * 0.12);
    const rect = (x, y) => { if (ctx.roundRect) ctx.roundRect(x, y, s, s, rr); else ctx.rect(x, y, s, s); };
    if (off.length) {
      ctx.fillStyle = "#141416";
      ctx.beginPath();
      for (let i = 0; i < off.length; i += 2) rect(off[i], off[i + 1]);
      ctx.fill();
    }
    for (let k = 0; k < buckets.length; k++) {
      const b = buckets[k];
      if (!b || !b.length) continue;
      const l = k % LEVELS, m = Math.floor(k / LEVELS) % 5, n = Math.floor(k / (LEVELS * 5));
      ctx.fillStyle = colorFor(m, l, n);
      ctx.beginPath();
      for (let i = 0; i < b.length; i += 2) rect(b[i], b[i + 1]);
      ctx.fill();
    }
  }

  const BAND = 10, SWEEP_DUR = 0.85;
  function startSweep(x0, x1, onMove, onDone) {
    if (sweep) finishSweep();
    if (reduceMotion) { onMove(1e5); onDone(); return; }
    const me = { c0: Math.max(0, Math.round((x0 - ox) / G)), c1: Math.min(cols - 1, Math.round((x1 - ox) / G) - 1), t0: now(), seed: Math.random() * 1000, onMove, onDone };
    sweep = me;
    // if frames stall (a throttled tab), never leave the swap half done
    setTimeout(() => { if (sweep === me) finishSweep(); }, (SWEEP_DUR + 0.6) * 1000);
    kick();
  }
  function finishSweep() {
    if (!sweep) return;
    const done = sweep.onDone;
    sweep = null;
    sctx.clearRect(0, 0, W, H);
    done();
  }
  function drawSweep(t, s) {
    if (!sweep) return;
    sctx.clearRect(0, 0, W, H);
    const p = clamp01((t - sweep.t0) / SWEEP_DUR);
    const y = -BAND * G + (H + 2 * BAND * G) * ease(p);   // the band's middle, top of the screen to below the bottom
    sweep.onMove(y);
    const mid = Math.round((y - oy) / G), sd = sweep.seed, rr = Math.min(2, s * 0.12);
    for (let c = sweep.c0 - 1; c <= sweep.c1 + 1; c++) {
      const top = mid - BAND / 2 - Math.floor(hashf(sd + c * 1.3) * 3);
      const bot = mid + BAND / 2 + Math.floor(hashf(sd + c * 2.9 + 5) * 3);
      for (let r = Math.max(0, top); r <= Math.min(rows - 1, bot); r++) {
        // now and then a row pokes one tile past the column's edges
        if ((c < sweep.c0 || c > sweep.c1) && hashf(sd + r * 4.1 + c * 0.7) > 0.3) continue;
        const x = ox + c * G, yy = oy + r * G;
        const col = rampAt(palTo, clamp01(0.25 + heatAt(x + G / 2, yy + G / 2, t) * 0.75));
        sctx.fillStyle = `rgb(${col[0] | 0},${col[1] | 0},${col[2] | 0})`;
        sctx.beginPath();
        if (sctx.roundRect) sctx.roundRect(x, yy, s, s, rr); else sctx.rect(x, yy, s, s);
        sctx.fill();
      }
    }
    if (p >= 1) finishSweep();
  }

  function loop() {
    raf = 0;
    if (!running || document.hidden) return;
    frame(now());
    raf = requestAnimationFrame(loop);
  }
  function kick() {
    if (reduceMotion) { requestAnimationFrame(() => frame(8)); return; }
    if (!running || document.hidden) return;
    if (!raf) raf = requestAnimationFrame(loop);
  }
  function start() { running = true; kick(); }

  // the cursor leaves a warm wake; a click sends a ring out through the grid
  let lx = -1e4, ly = -1e4;
  if (!reduceMotion) {
    window.addEventListener("pointermove", (e) => {
      if ((e.clientX - lx) ** 2 + (e.clientY - ly) ** 2 < (G * 0.6) ** 2) return;
      lx = e.clientX; ly = e.clientY;
      stamps.push([lx, ly, now()]);
      if (stamps.length > 36) stamps.shift();
    }, { passive: true });
    cv.addEventListener("pointerdown", (e) => { ripples.push([e.clientX, e.clientY, now()]); if (ripples.length > 4) ripples.shift(); });
  }
  document.addEventListener("visibilitychange", () => { if (document.hidden) finishSweep(); else kick(); });

  size();
  return { size, setEdge, setPalette, setStage, pulseName, start, redraw: kick, sweep: startSweep, endSweep: finishSweep };
})();

// ---------- columns: which are open comes from the address, so links, back and forward all just work ----------
(function () {
  const panes = {};
  document.querySelectorAll(".pane[data-pane]").forEach((p) => (panes[p.dataset.pane] = p));
  const deck = document.getElementById("deck");
  const ROUTES = {
    "": ["index"],
    fetch: ["index", "fetch"], ceres: ["index", "ceres"], sweeper: ["index", "sweeper"],
    builds: ["index", "builds"], awards: ["index", "awards"],
    "builds/arm": ["index", "builds", "arm"], "builds/eclipse": ["index", "builds", "eclipse"],
    "builds/maglift": ["index", "builds", "maglift"], "builds/mars": ["index", "builds", "mars"],
    "builds/mouse": ["index", "builds", "mouse"],
  };
  const parse = () => ROUTES[location.hash.replace(/^#\/?/, "").replace(/\/$/, "")] || ["index"];
  const hrefFor = (stack) => "#/" + (Object.keys(ROUTES).find((k) => ROUTES[k].join() === stack.join()) || "");
  let stack = [];

  function show(p, depth, cls) {
    p._tok = (p._tok || 0) + 1;
    p.classList.remove("is-entering", "is-leaving", "is-swapping", "is-fading");
    p.hidden = false;
    p.style.clipPath = "";
    p.style.setProperty("--i", depth);
    p.style.zIndex = String(20 - depth);
    p.style.order = String(depth);
    p.scrollTop = 0;
    if (cls) {
      p.classList.add(cls);
      const tok = p._tok;
      p.addEventListener("animationend", () => { if (p._tok === tok) p.classList.remove(cls); }, { once: true });
    }
  }
  function hide(p, cls) {
    p._tok = (p._tok || 0) + 1;
    p.classList.remove("is-entering", "is-swapping");
    p.style.clipPath = "";
    if (!cls) { p.hidden = true; p.classList.remove("is-leaving", "is-fading"); return; }
    const tok = p._tok;
    p.style.zIndex = String(parseInt(p.style.zIndex || "10", 10) - 1);
    p.classList.add(cls);
    const done = () => { if (p._tok !== tok) return; p.hidden = true; p.classList.remove(cls); };
    p.addEventListener("animationend", done, { once: true });
    setTimeout(done, 700);
  }

  function paneWidth() { return panes.index.getBoundingClientRect().width; }
  function place(animate) {
    if (wideQuery.matches) {
      const edge = stack.length * paneWidth();
      field.setStage(edge, 0, window.innerHeight);
      field.setEdge(edge, animate);
    } else {
      const top = parseFloat(getComputedStyle(deck).paddingTop) || 240;
      field.setStage(0, 0, top);
      field.setEdge(0, animate);
    }
  }

  function apply(next, how) {
    const animate = how !== "instant" && !reduceMotion;
    const wide = wideQuery.matches;
    let k = 0;
    while (k < stack.length && k < next.length && stack[k] === next[k]) k++;
    const leaving = stack.slice(k), entering = next.slice(k);
    const swap = leaving.length > 0 && entering.length > 0;
    // on wide screens a sibling swap happens under a band of tiles sweeping down the column
    const band = wide && animate && swap;
    field.endSweep();
    leaving.forEach((id, j) => {
      if (band && j === 0) return;
      hide(panes[id], !animate ? null : wide ? "is-leaving" : swap ? null : "is-fading");
    });
    entering.forEach((id, j) => show(panes[id], k + j, !animate ? null : swap && j === 0 ? (band ? null : "is-swapping") : "is-entering"));
    if (band) {
      const oldP = panes[leaving[0]], newP = panes[entering[0]];
      const otok = (oldP._tok = (oldP._tok || 0) + 1), ntok = newP._tok;
      oldP.style.zIndex = String(19 - k);          // the old one waits underneath until the band has passed
      newP.style.clipPath = "inset(0 0 100% 0)";
      const r = newP.getBoundingClientRect();
      field.sweep(r.left, r.right, (y) => {
        if (newP._tok === ntok) newP.style.clipPath = `inset(0 0 ${Math.max(0, r.height - y)}px 0)`;
      }, () => {
        if (newP._tok === ntok) newP.style.clipPath = "";
        if (oldP._tok === otok) oldP.hidden = true;
      });
    }
    const before = stack;
    stack = next.slice();
    const top = stack[stack.length - 1];

    document.querySelectorAll("a[data-to]").forEach((a) => {
      const on = stack.includes(a.dataset.to);
      a.classList.toggle("is-open", on);
      if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    const h = panes[top].querySelector("h1, h2");
    document.title = top === "index" ? "Varun Chilukuri" : `${h.textContent} · Varun Chilukuri`;
    document.documentElement.style.setProperty("--accent", PAL[top].accent);
    field.setPalette(top, animate);
    place(animate && how !== "first");
    favicon(top);

    if (how === "nav") {
      if (entering.length) {
        h.focus({ preventScroll: true });
        if (!wide) panes[top].scrollIntoView({ behavior: animate ? "smooth" : "auto", block: "start" });
      } else if (leaving.length) {
        const back = panes[top].querySelector(`[data-to="${before[before.length - 1]}"]`) || panes[top].querySelector(`[data-to="${leaving[0]}"]`);
        if (back) back.focus({ preventScroll: true });
        if (!wide) panes[top].scrollIntoView({ behavior: animate ? "smooth" : "auto", block: "nearest" });
      }
    }
  }

  // the open item in a list closes its column when clicked again
  document.querySelectorAll("a[data-to]").forEach((a) => a.addEventListener("click", (e) => {
    if (stack[stack.length - 1] === a.dataset.to) {
      e.preventDefault();
      location.hash = hrefFor(stack.slice(0, -1));
    }
  }));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && stack.length > 1) location.hash = hrefFor(stack.slice(0, -1));
  });
  window.addEventListener("hashchange", () => apply(parse(), "nav"));

  let rt = 0;
  window.addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => { field.size(); place(false); field.setPalette(stack[stack.length - 1], false); field.redraw(); }, 120);
  });
  wideQuery.addEventListener("change", () => { field.size(); place(false); });

  // first paint: open straight to whatever the address says, then let the field crawl in from the right
  apply(parse(), "instant");
  field.setEdge(window.innerWidth, false);
  place(true);
  field.start();
  if (!wideQuery.matches && stack.length > 1) {
    const top = panes[stack[stack.length - 1]];
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => top.scrollIntoView({ block: "start" }));
  }

  // hovering or tapping the name lights it up in the grid
  const name = document.querySelector(".name");
  if (name) { name.addEventListener("pointerenter", field.pulseName); name.addEventListener("click", field.pulseName); }
})();

// ---------- favicon: a small grid of tiles in the open page's colours ----------
function favicon(key) {
  const link = document.getElementById("favicon");
  if (!link) return;
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const o = c.getContext("2d");
  const st = PAL[key].stops, pick = [[1, 2, 3], [2, 4, 2], [3, 2, 1]];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    const col = st[pick[i][j]];
    o.fillStyle = `rgb(${col[0]},${col[1]},${col[2]})`;
    o.beginPath();
    if (o.roundRect) o.roundRect(1 + j * 21, 1 + i * 21, 20, 20, 4); else o.rect(1 + j * 21, 1 + i * 21, 20, 20);
    o.fill();
  }
  link.href = c.toDataURL("image/png");
}

// ---------- galleries: tap a thumbnail to see it large ----------
document.querySelectorAll(".gallery").forEach((g) => {
  const main = g.querySelector(".main");
  const thumbs = g.querySelectorAll(".thumbs button");
  thumbs.forEach((b) => b.addEventListener("click", () => {
    const img = b.querySelector("img");
    main.src = img.getAttribute("src"); main.alt = img.alt;
    thumbs.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
  }));
});

// ---------- copy email / discord, with a short note ----------
const toast = (function () {
  const el = document.querySelector(".toast");
  let tm = 0;
  return (msg) => {
    if (!el) return;
    el.textContent = msg;
    el.classList.add("is-on");
    clearTimeout(tm);
    tm = setTimeout(() => el.classList.remove("is-on"), 2200);
  };
})();
document.querySelectorAll("[data-copy]").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const text = btn.dataset.copy;
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      const tmp = document.createElement("textarea");
      tmp.value = text;
      document.body.appendChild(tmp);
      tmp.select();
      try { document.execCommand("copy"); } catch (err) { /* nothing more to try */ }
      tmp.remove();
    }
    toast(btn.dataset.done || "Copied");
  });
});

// ---------- music: opt-in, quiet, fades in and out ----------
// plays Blood Orange's own upload through a minimized SoundCloud embed; the credit link shows while it plays.
// browsers that won't start sound from outside the embed get a thin SoundCloud strip to tap instead.
// once someone turns it on, it comes back on their next visit at their first click or key.
(function () {
  const btn = document.querySelector(".sound");
  const credit = document.querySelector(".now");
  const note = document.querySelector(".sound-note");
  if (!btn) return;
  const TRACK = "https://soundcloud.com/bloodorange/champagne-coast";
  const KEY = "vc-sound";
  const VOLUME = 60;
  const FADE_IN = 4000;
  const FADE_OUT = 1100;
  let widget = null, frame = null, ready = null, fadeTimer = 0, checkTimer = 0, level = 0, playing = false, offered = false;
  const remember = (on) => { try { localStorage.setItem(KEY, on ? "1" : "0"); } catch (e) { /* private mode */ } };
  const wanted = () => { try { return localStorage.getItem(KEY) === "1"; } catch (e) { return false; } };

  function fadeTo(target, ms, done) {
    clearInterval(fadeTimer);
    const from = level, steps = Math.max(1, Math.round(ms / 50));
    let i = 0;
    fadeTimer = setInterval(() => {
      i++;
      level = from + (target - from) * (i / steps);
      if (widget) widget.setVolume(Math.round(level));
      if (i >= steps) { clearInterval(fadeTimer); if (done) done(); }
    }, 50);
  }
  function say(text) { note.textContent = text || ""; note.hidden = !text; }
  function setState(on, text) {
    playing = on;
    btn.setAttribute("aria-pressed", String(on));
    btn.setAttribute("aria-label", on ? "Stop music" : "Play music: Champagne Coast by Blood Orange");
    say(text);
    if (on) credit.hidden = false;
  }
  const showStrip = (on) => frame && frame.classList.toggle("is-shown", on);

  function load() {
    if (ready) return ready;
    ready = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://w.soundcloud.com/player/api.js";
      s.onerror = reject;
      s.onload = () => {
        frame = document.createElement("iframe");
        frame.className = "sc-frame";
        frame.title = "Champagne Coast by Blood Orange on SoundCloud";
        frame.allow = "autoplay; encrypted-media";
        frame.src = "https://w.soundcloud.com/player/?url=" + encodeURIComponent(TRACK) + "&auto_play=false&visual=false&show_artwork=false&show_comments=false&show_user=true&sharing=false&buying=false&download=false&color=%23b4b8c1";
        document.body.appendChild(frame);
        widget = window.SC.Widget(frame);
        const E = window.SC.Widget.Events;
        widget.bind(E.READY, () => resolve());
        widget.bind(E.PLAY, () => {
          if (!frame.classList.contains("is-shown")) return;
          showStrip(false);
          setState(true);
          fadeTo(VOLUME, FADE_IN);
          verify();
        });
        widget.bind(E.FINISH, () => { if (playing) { widget.seekTo(0); widget.play(); } });
        widget.bind(E.ERROR, () => stop());
      };
      document.head.appendChild(s);
    });
    ready.catch(() => { ready = null; stop(); });
    return ready;
  }
  async function play() {
    setState(true);
    remember(true);
    try { await load(); } catch (e) { return; }
    if (!playing) return;
    widget.setVolume(0); level = 0;
    widget.play();
    fadeTo(VOLUME, FADE_IN);
    verify();
  }
  function verify() {
    clearTimeout(checkTimer);
    checkTimer = setTimeout(() => widget.isPaused((paused) => {
      if (!paused || !playing) return;
      clearInterval(fadeTimer); level = 0; widget.setVolume(0);
      if (!offered) {
        offered = true;
        setState(false, "tap ▶ on the SoundCloud strip to play");
        showStrip(true);
      } else {
        setState(false, "music couldn't start in this browser");
      }
      credit.hidden = false;
    }), 2500);
  }
  function stop(keep) {
    clearTimeout(checkTimer);
    showStrip(false);
    setState(false);
    if (!keep) remember(false);
    fadeTo(0, FADE_OUT, () => {
      if (playing) return;
      if (widget) widget.pause();
      credit.hidden = true;
    });
  }
  btn.addEventListener("click", () => {
    disarm();
    if (playing) stop();
    else if (frame && frame.classList.contains("is-shown")) stop();
    else play();
  });
  // turned on last time: start again on the first click or key anywhere (browsers need that first gesture)
  const arm = (e) => { if (e.target && e.target.closest && e.target.closest(".sound")) return; disarm(); if (!playing) play(); };
  function disarm() { window.removeEventListener("pointerdown", arm, true); window.removeEventListener("keydown", arm, true); }
  if (wanted()) { window.addEventListener("pointerdown", arm, true); window.addEventListener("keydown", arm, true); }
})();
