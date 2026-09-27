// =========================================================
// Varun Chilukuri, portfolio interactions
// =========================================================

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- year ----------
document.querySelectorAll(".js-year").forEach((el) => (el.textContent = new Date().getFullYear()));

// ---------- blocks fade up as they arrive ----------
(function () {
  const blocks = document.querySelectorAll(".block");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    blocks.forEach((b) => b.classList.add("is-in"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.04, rootMargin: "0px 0px 8% 0px" });
  blocks.forEach((b) => io.observe(b));
})();

// ---------- menu: highlights the section you are in, folds into a toggle on phones ----------
(function () {
  const toggle = document.querySelector(".nav-toggle");
  const panel = document.getElementById("navLinks");
  if (toggle && panel) {
    const set = (open) => { toggle.setAttribute("aria-expanded", String(open)); panel.classList.toggle("is-open", open); };
    toggle.addEventListener("click", () => set(toggle.getAttribute("aria-expanded") !== "true"));
    panel.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => set(false)));
  }
  const links = document.querySelectorAll(".nav-links a[data-spy]");
  if (!links.length || !("IntersectionObserver" in window)) return;
  const targets = [["top", document.querySelector(".hero")]];
  document.querySelectorAll(".block[id]").forEach((b) => targets.push([b.id, b]));
  const byEl = new Map(targets.map(([id, el]) => [el, id]));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const id = byEl.get(e.target);
      links.forEach((a) => a.classList.toggle("is-active", a.dataset.spy === id));
    });
  }, { rootMargin: "-42% 0px -52% 0px" });
  targets.forEach(([, el]) => el && io.observe(el));
})();

// ---------- copy email ----------
document.querySelectorAll(".soc-copy[data-copy]").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const text = btn.dataset.copy;
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      const tmp = document.createElement("textarea");
      tmp.value = text;
      document.body.appendChild(tmp);
      tmp.select();
      document.execCommand("copy");
      tmp.remove();
    }
    btn.classList.add("is-copied");
    setTimeout(() => btn.classList.remove("is-copied"), 1400);
  });
});

// ---------- project sheet: rows stay compact, details open on click ----------
(function () {
  const sheet = document.getElementById("sheet");
  const body = document.getElementById("sheetBody");
  const title = document.getElementById("sheetTitle");
  const kicker = document.getElementById("sheetKicker");
  if (!sheet || !body || typeof sheet.showModal !== "function") return;
  let lastTrigger = null;

  function buildShots(container) {
    const imgs = Array.from(container.querySelectorAll("img"));
    if (!imgs.length) return;
    const main = imgs[0].cloneNode();
    main.className = "shot-main";
    container.innerHTML = "";
    container.appendChild(main);
    if (imgs.length < 2) return;
    const thumbs = document.createElement("div");
    thumbs.className = "shot-thumbs";
    imgs.forEach((img, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", `Show photo ${i + 1}: ${img.alt}`);
      if (i === 0) b.classList.add("is-on");
      b.appendChild(img.cloneNode());
      b.addEventListener("click", () => {
        main.src = img.src;
        main.alt = img.alt;
        thumbs.querySelectorAll("button").forEach((x) => x.classList.toggle("is-on", x === b));
      });
      thumbs.appendChild(b);
    });
    container.appendChild(thumbs);
  }

  function open(name, trigger) {
    const src = document.querySelector(`.details article[data-proj="${name}"]`);
    if (!src) return;
    lastTrigger = trigger || null;
    title.textContent = src.dataset.title || "";
    kicker.textContent = src.dataset.kicker || "";
    body.innerHTML = src.innerHTML;
    const shots = body.querySelector(".shots");
    if (shots) buildShots(shots);
    body.scrollTop = 0;
    sheet.showModal();
    cleaned = false;
    document.body.classList.add("sheet-open");
  }

  document.querySelectorAll("[data-open]").forEach((row) => {
    row.addEventListener("click", () => open(row.dataset.open, row));
  });
  // cleanup runs directly rather than waiting on the dialog's own close event
  let cleaned = true;
  function cleanup() {
    if (cleaned) return;
    cleaned = true;
    document.body.classList.remove("sheet-open");
    if (lastTrigger) lastTrigger.focus();
  }
  function close() {
    if (sheet.open) sheet.close();
    cleanup();
  }
  sheet.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", close));
  // clicking the dimmed backdrop (the dialog box itself, outside the inner panel) closes it
  sheet.addEventListener("click", (e) => { if (e.target === sheet) close(); });
  sheet.addEventListener("cancel", cleanup); // Esc
  sheet.addEventListener("close", () => { if (!sheet.open) cleanup(); }); // ignore a late close from the previous sheet
})();

// ---------- the name banner: type set in dots, each one on a spring ----------
(function () {
  const wrap = document.querySelector(".field");
  const canvas = document.getElementById("field");
  if (!wrap || !canvas || !canvas.getContext) return;
  const ctx = canvas.getContext("2d");

  const WORD = "VARUN";
  const K = 0.06, DAMP = 0.85, PUSH = 3;
  let W = 0, H = 0, gap = 4, radius = 60, n = 0, wordW = 0, wordX = 0;
  let hx, hy, x, y, vx, vy;
  const pointer = { x: -9999, y: -9999, active: false, last: 0 };
  let running = false, raf = 0;
  const t0 = performance.now();

  function build() {
    const rect = canvas.getBoundingClientRect();
    W = Math.max(1, Math.round(rect.width));
    H = Math.max(1, Math.round(rect.height));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    gap = H > 90 ? 4 : 3;
    radius = Math.max(44, Math.min(80, H * 0.7));

    const off = document.createElement("canvas");
    off.width = W; off.height = H;
    const o = off.getContext("2d");
    let fs = H * 1.3;
    const font = (s) => `800 ${s}px "DM Sans", sans-serif`;
    o.font = font(fs);
    let m = o.measureText(WORD);
    fs *= Math.min((W * 0.99) / (m.actualBoundingBoxLeft + m.actualBoundingBoxRight), (H * 0.98) / (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent));
    o.font = font(fs);
    m = o.measureText(WORD);
    wordW = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
    wordX = 0; // the name sits on the left edge of its box
    o.fillStyle = "#fff";
    o.fillText(WORD, wordX + m.actualBoundingBoxLeft, (H - (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent)) / 2 + m.actualBoundingBoxAscent);

    const data = o.getImageData(0, 0, W, H).data;
    const homes = [];
    for (let py = 1; py < H; py += gap) {
      for (let px = 1; px < W; px += gap) {
        if (data[(py * W + px) * 4 + 3] > 140) homes.push(px, py);
      }
    }
    n = homes.length / 2;
    hx = new Float32Array(n); hy = new Float32Array(n);
    x = new Float32Array(n); y = new Float32Array(n);
    vx = new Float32Array(n); vy = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      hx[i] = homes[i * 2]; hy[i] = homes[i * 2 + 1];
      x[i] = reduceMotion ? hx[i] : hx[i] + (Math.random() - 0.5) * 40;
      y[i] = reduceMotion ? hy[i] : hy[i] + 20 + Math.random() * 50;
    }
  }

  const COLORS = ["rgba(247,243,236,0.9)", "rgba(245,208,172,0.95)", "rgba(242,168,107,1)", "rgba(224,138,75,1)"];
  const buckets = [[], [], [], []];

  function frame(now) {
    raf = 0;
    const size = gap * 0.55;
    let mx = pointer.x, my = pointer.y, push = PUSH, rad = radius;
    if (!pointer.active || now - pointer.last > 2600) {
      const t = (now - t0) / 1000;
      // idle: a slow, gentle ghost cursor keeps the word breathing without breaking it up
      mx = wordX + wordW * (0.5 + 0.55 * Math.sin(t * 0.45));
      my = H * (0.5 + 0.35 * Math.sin(t * 0.9 + 1));
      push = PUSH * 0.35;
      rad = radius * 0.55;
    }
    const R2i = rad * rad;
    buckets.forEach((b) => (b.length = 0));
    for (let i = 0; i < n; i++) {
      const dx = x[i] - mx, dy = y[i] - my, d2 = dx * dx + dy * dy;
      if (d2 < R2i && d2 > 0.01) {
        const d = Math.sqrt(d2), f = (1 - d / rad) * push;
        vx[i] += (dx / d) * f; vy[i] += (dy / d) * f;
      }
      vx[i] = (vx[i] + (hx[i] - x[i]) * K) * DAMP;
      vy[i] = (vy[i] + (hy[i] - y[i]) * K) * DAMP;
      x[i] += vx[i]; y[i] += vy[i];
      const ox = x[i] - hx[i], oy = y[i] - hy[i], disp = ox * ox + oy * oy;
      buckets[disp < 7 ? 0 : disp < 55 ? 1 : disp < 200 ? 2 : 3].push(i);
    }
    ctx.clearRect(0, 0, W, H);
    for (let b = 0; b < 4; b++) {
      const list = buckets[b];
      if (!list.length) continue;
      ctx.fillStyle = COLORS[b];
      for (let j = 0; j < list.length; j++) {
        const i = list[j];
        ctx.fillRect(x[i] - size / 2, y[i] - size / 2, size, size);
      }
    }
    if (running) raf = requestAnimationFrame(frame);
  }

  const start = () => {
    if (reduceMotion) { frame(performance.now()); return; }
    running = true;
    if (!raf) raf = requestAnimationFrame(frame);
  };
  const stop = () => { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; };

  window.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    const px = e.clientX - r.left, py = e.clientY - r.top;
    const inside = px > -radius && px < r.width + radius && py > -radius && py < r.height + radius;
    pointer.active = inside;
    if (inside) { pointer.x = px; pointer.y = py; pointer.last = performance.now(); }
  }, { passive: true });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => (entries[0].isIntersecting ? start() : stop())).observe(canvas);
  }
  let rt = 0;
  window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { build(); start(); }, 180); });

  const ready = document.fonts && document.fonts.load ? document.fonts.load('800 100px "DM Sans"').catch(() => {}) : Promise.resolve();
  ready.then(() => { build(); start(); });
})();

// ---------- signature writes itself as you reach the bottom ----------
(function () {
  const sig = document.getElementById("sig");
  if (!sig) return;
  const strokes = Array.from(sig.querySelectorAll(".sig-stroke"));
  const lens = strokes.map((p) => p.getTotalLength());
  strokes.forEach((p, i) => {
    p.style.strokeDasharray = lens[i];
    p.style.strokeDashoffset = reduceMotion ? 0 : lens[i];
  });
  if (reduceMotion) return;
  const spans = [[0, 0.8], [0.8, 1]];
  let ticking = false;
  const update = () => {
    ticking = false;
    const r = sig.getBoundingClientRect(), vh = window.innerHeight;
    // fully written once the whole signature is on screen, and always by the bottom of the page
    const atBottom = window.scrollY + vh >= document.documentElement.scrollHeight - 4;
    const p = atBottom ? 1 : Math.min(1, Math.max(0, (vh - r.top) / (r.height + 40)));
    strokes.forEach((path, i) => {
      const [a, b] = spans[i];
      const local = Math.min(1, Math.max(0, (p - a) / (b - a)));
      path.style.strokeDashoffset = lens[i] * (1 - local);
    });
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();
})();

// ---------- music: opt-in, quiet, fades in and out ----------
// plays Blood Orange's own upload through a minimized SoundCloud embed; the credit link shows while it plays.
// browsers that won't start sound from outside the embed get a thin SoundCloud strip to tap instead.
(function () {
  const btns = Array.from(document.querySelectorAll(".music-tip"));
  const credits = Array.from(document.querySelectorAll(".music-credit"));
  if (!btns.length) return;
  const TRACK = "https://soundcloud.com/bloodorange/champagne-coast";
  const VOLUME = 35;      // quiet, sits under everything, but clearly there
  const FADE_IN = 4000;
  const FADE_OUT = 1100;
  let widget = null, frame = null, ready = null, fadeTimer = 0, checkTimer = 0, level = 0, playing = false, offered = false;

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
  function setState(on, text) {
    playing = on;
    btns.forEach((b) => {
      b.classList.toggle("is-playing", on);
      b.setAttribute("aria-pressed", String(on));
      const label = b.querySelector(".music-label");
      if (label) label.textContent = text || (on ? "now playing: Champagne Coast (click to stop)" : "recommended: play music for a better experience");
      const short = b.querySelector(".music-short");
      if (short) short.textContent = on ? "Blood Orange" : "music"; // with the credit link under it, this names the artist
    });
    if (on) credits.forEach((c) => (c.hidden = false));
  }
  const showStrip = (on) => frame && frame.classList.toggle("is-shown", on);

  // the SoundCloud embed only loads once someone asks for music
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
        frame.src = "https://w.soundcloud.com/player/?url=" + encodeURIComponent(TRACK) + "&auto_play=false&visual=false&show_artwork=false&show_comments=false&show_user=true&sharing=false&buying=false&download=false&color=%23e08a4b";
        document.body.appendChild(frame);
        widget = window.SC.Widget(frame);
        const E = window.SC.Widget.Events;
        widget.bind(E.READY, () => resolve());
        // started from the strip: take over from here, then tuck the strip away
        widget.bind(E.PLAY, () => {
          if (!frame.classList.contains("is-shown")) return;
          showStrip(false);
          setState(true);
          fadeTo(VOLUME, FADE_IN);
          verify();
        });
        // loop: start over when it ends, as long as it is still switched on
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
    try { await load(); } catch (e) { return; }
    if (!playing) return; // switched off while it was loading
    widget.setVolume(0); level = 0;
    widget.play();
    fadeTo(VOLUME, FADE_IN);
    verify();
  }
  // a moment after starting, make sure sound is really going: if the browser refused, offer the strip once,
  // and if even that can't play, say so and leave the SoundCloud link
  function verify() {
    clearTimeout(checkTimer);
    checkTimer = setTimeout(() => widget.isPaused((paused) => {
      if (!paused || !playing) return;
      clearInterval(fadeTimer); level = 0; widget.setVolume(0);
      if (!offered) {
        offered = true;
        setState(false, "tap \u25B6 on the SoundCloud strip to play");
        showStrip(true);
      } else {
        setState(false, "music couldn't start in this browser");
      }
      credits.forEach((c) => (c.hidden = false));
    }), 2500);
  }
  function stop() {
    clearTimeout(checkTimer);
    showStrip(false);
    setState(false);
    fadeTo(0, FADE_OUT, () => {
      if (playing) return; // switched back on during the fade
      if (widget) widget.pause();
      credits.forEach((c) => (c.hidden = true));
    });
  }
  btns.forEach((b) => b.addEventListener("click", () => {
    if (playing) stop();
    else if (frame && frame.classList.contains("is-shown")) stop(); // second tap while the strip is up: put it away
    else play();
  }));
})();

// ---------- hero: two solid gears turning in mesh, white faces and dark sides, lit from the upper left ----------
(function () {
  const canvas = document.getElementById("gears");
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext("2d");
  const TAU = Math.PI * 2;
  const YAW = -0.62, PITCH = 0.8; // camera: looking down at the gears from the front left
  const THICK = 0.32;              // how deep the gears are
  const SPEED = 0.32;              // radians per second for the big gear

  // two gears with the same tooth pitch, so they mesh
  const A = { R: 1, teeth: 20, h: 0.12, holes: 7 };
  const B = { R: 0.8, teeth: 16, h: 0.12, holes: 6 };
  // helical teeth: the bottom of each tooth trails the top; the pair twist in opposite hands so they still mesh
  A.twist = 0.5 * (TAU / A.teeth);
  B.twist = -A.twist * (A.R / B.R);
  const PHI = 0.95; // where B sits around A, radians
  const D = A.R + B.R + A.h * 0.35;
  A.x = -Math.cos(PHI) * D / 2; A.z = -Math.sin(PHI) * D / 2;
  B.x = A.x + Math.cos(PHI) * D; B.z = A.z + Math.sin(PHI) * D;
  // phase so a tooth of one always sits in a gap of the other where they meet
  const PHASE = ((PHI * (A.teeth + B.teeth)) / TAU + B.teeth / 2 - 0.5) * TAU / B.teeth;

  let W = 1, H = 1, S = 1, cx = 0, cy = 0, raf = 0, visible = true, last = performance.now(), rot = 0.4;
  let sx = 0, sy = 0, sz = 0;
  const cyw = Math.cos(YAW), syw = Math.sin(YAW), cp = Math.cos(PITCH), sp = Math.sin(PITCH);
  function P(x, y, z) {
    const X = x * cyw - z * syw, Z = x * syw + z * cyw;
    const Y2 = y * cp + Z * sp, Z2 = Z * cp - y * sp;
    const k = 9 / (9 + Z2);
    sx = cx + X * S * k; sy = cy - Y2 * S * k; sz = Z2;
  }

  // gear outline in world space: rounded, flat-topped teeth
  function outline(g, r) {
    const n = g.teeth * 16, pts = [];
    for (let i = 0; i < n; i++) {
      const th = (i / n) * TAU;
      const s = Math.cos(g.teeth * (th - r));
      const rr = g.R - g.h / 2 + g.h * Math.min(1, Math.max(0, 0.5 + 0.85 * s));
      pts.push([g.x + Math.cos(th) * rr, g.z + Math.sin(th) * rr, th]);
    }
    return pts;
  }
  function holes(g, r) {
    const list = [[g.x, g.z, g.R * 0.3]];
    for (let k = 0; k < g.holes; k++) {
      const a = r + (k * TAU) / g.holes;
      list.push([g.x + Math.cos(a) * g.R * 0.63, g.z + Math.sin(a) * g.R * 0.63, g.R * 0.13]);
    }
    return list;
  }

  // walls: dark, warmer where they face the light
  const LX = -0.75, LZ = -0.66;
  function wallColor(nx, nz, inner) {
    const lit = Math.max(0, nx * LX + nz * LZ);
    const v = inner ? 0.35 + 0.35 * lit : 0.45 + 0.55 * lit;
    return `rgb(${Math.round(22 + 70 * v)},${Math.round(17 + 50 * v)},${Math.round(14 + 38 * v)})`;
  }
  function quad(a, b, c, d, fill) {
    ctx.beginPath();
    P(a[0], a[1], a[2]); ctx.moveTo(sx, sy);
    P(b[0], b[1], b[2]); ctx.lineTo(sx, sy);
    P(c[0], c[1], c[2]); ctx.lineTo(sx, sy);
    P(d[0], d[1], d[2]); ctx.lineTo(sx, sy);
    ctx.closePath();
    ctx.fillStyle = fill; ctx.strokeStyle = fill; ctx.lineWidth = 0.6;
    ctx.fill(); ctx.stroke();
  }

  function twistDown(g, pt) {
    const dx = pt[0] - g.x, dz = pt[1] - g.z, c = Math.cos(-g.twist), s = Math.sin(-g.twist);
    return [g.x + dx * c - dz * s, g.z + dx * s + dz * c];
  }
  function drawGear(g, r) {
    const out = outline(g, r), hs = holes(g, r);
    // soft shadow the gear casts below itself
    P(g.x, -THICK - 0.35, g.z);
    const sh = ctx.createRadialGradient(sx, sy, 0, sx, sy, g.R * S * 1.1);
    sh.addColorStop(0, "rgba(0,0,0,0.45)"); sh.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = sh; ctx.fillRect(sx - g.R * S * 1.2, sy - g.R * S * 1.2, g.R * S * 2.4, g.R * S * 2.4);
    // outer side walls, farthest first so tooth flanks overlap correctly
    const walls = [];
    for (let i = 0; i < out.length; i++) {
      const p = out[i], q = out[(i + 1) % out.length];
      const ex = q[0] - p[0], ez = q[1] - p[1], len = Math.hypot(ex, ez) || 1;
      // the same point of the tooth, one thickness down, sits turned back by the twist
      const pb = twistDown(g, p), qb = twistDown(g, q);
      P((p[0] + q[0]) / 2, -THICK / 2, (p[1] + q[1]) / 2);
      walls.push([sz, p, q, pb, qb, wallColor(ez / len, -ex / len, false)]);
    }
    walls.sort((u, v) => v[0] - u[0]);
    for (const [, p, q, pb, qb, col] of walls) quad([p[0], 0, p[1]], [q[0], 0, q[1]], [qb[0], -THICK, qb[1]], [pb[0], -THICK, pb[1]], col);
    // inner walls of the holes (the top face covers the near halves)
    for (const [hx, hz, hr] of hs) {
      const m = Math.max(24, Math.round(hr * 90));
      for (let i = 0; i < m; i++) {
        const a0 = (i / m) * TAU, a1 = ((i + 1) / m) * TAU;
        const p = [hx + Math.cos(a0) * hr, hz + Math.sin(a0) * hr], q = [hx + Math.cos(a1) * hr, hz + Math.sin(a1) * hr];
        const am = (a0 + a1) / 2;
        quad([p[0], 0, p[1]], [q[0], 0, q[1]], [q[0], -THICK, q[1]], [p[0], -THICK, p[1]], wallColor(-Math.cos(am), -Math.sin(am), true));
      }
    }
    // the white top face, holes cut out
    ctx.beginPath();
    out.forEach((p, i) => { P(p[0], 0, p[1]); if (i) ctx.lineTo(sx, sy); else ctx.moveTo(sx, sy); });
    ctx.closePath();
    for (const [hx, hz, hr] of hs) {
      const m = Math.max(24, Math.round(hr * 90));
      for (let i = 0; i <= m; i++) { const a = (i / m) * TAU; P(hx + Math.cos(a) * hr, 0, hz + Math.sin(a) * hr); if (i) ctx.lineTo(sx, sy); else ctx.moveTo(sx, sy); }
      ctx.closePath();
    }
    P(g.x - g.R, 0, g.z - g.R); const gx0 = sx, gy0 = sy;
    P(g.x + g.R, 0, g.z + g.R);
    const face = ctx.createLinearGradient(gx0, gy0, sx, sy);
    face.addColorStop(0, "#fbf8f3"); face.addColorStop(0.55, "#efeae2"); face.addColorStop(1, "#d8d1c6");
    ctx.fillStyle = face;
    ctx.fill("evenodd");
    ctx.strokeStyle = "rgba(255,255,255,0.55)"; ctx.lineWidth = 0.8;
    ctx.stroke();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const rb = -rot * (A.teeth / B.teeth) + PHASE;
    // farther gear first
    P(A.x, 0, A.z); const za = sz;
    P(B.x, 0, B.z); const zb = sz;
    if (za > zb) { drawGear(A, rot); drawGear(B, rb); } else { drawGear(B, rb); drawGear(A, rot); }
  }

  function size() {
    const rc = canvas.getBoundingClientRect();
    W = Math.max(1, Math.round(rc.width)); H = Math.max(1, Math.round(rc.height));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // fit both gears (and their depth) inside the canvas
    S = 1; cx = 0; cy = 0;
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const g of [A, B]) {
      for (let i = 0; i < 64; i++) {
        const th = (i / 64) * TAU, rr = g.R + g.h / 2;
        for (const y of [0, -THICK]) {
          P(g.x + Math.cos(th) * rr, y, g.z + Math.sin(th) * rr);
          x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy);
        }
      }
    }
    const pad = 8;
    S = Math.min((W - pad * 2) / (x1 - x0), (H - pad * 2) / (y1 - y0));
    cx = W / 2 - ((x0 + x1) / 2) * S;
    cy = H / 2 - ((y0 + y1) / 2) * S;
  }

  function tick(now) {
    raf = 0;
    rot += (Math.min(0.05, (now - last) / 1000)) * SPEED;
    last = now;
    draw();
    if (visible) raf = requestAnimationFrame(tick);
  }
  const start = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } };

  size();
  if (reduceMotion) draw();
  else {
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible) start(); }).observe(canvas);
    }
    start();
  }
  let rt = 0;
  window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { size(); draw(); }, 150); });
})();

// ---------- a small scene for each section, plus the footer map of the room Fetch scanned ----------
(function () {
  const RANGE = 3.1;          // meters a scan reaches

  // the room, in meters: walls with a doorway, a table, a couch, a bin, chair legs
  const segs = [];
  const poly = (pts, hgt, gapAt = -1) => {
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      if (i === gapAt) {
        const m1 = [a[0] + (b[0] - a[0]) * 0.38, a[1] + (b[1] - a[1]) * 0.38];
        const m2 = [a[0] + (b[0] - a[0]) * 0.62, a[1] + (b[1] - a[1]) * 0.62];
        segs.push([a, m1, hgt], [m2, b, hgt]);
      } else segs.push([a, b, hgt]);
    }
  };
  const sc = (pts) => pts.map(([x, y]) => [x * 0.78, y * 0.78]);
  poly(sc([[-2.8, -2.0], [1.6, -2.0], [1.6, -1.25], [2.9, -1.25], [2.9, 2.2], [-0.4, 2.2], [-0.4, 1.6], [-2.8, 1.6]]), 7, 4);
  poly(sc([[0.7, 0.55], [1.55, 0.55], [1.55, 1.25], [0.7, 1.25]]), 3);
  poly(sc([[-2.75, -0.9], [-2.25, -0.9], [-2.25, 0.9], [-2.75, 0.9]]), 3);
  const circles = [[-1.75, -1.25, 0.24, 4], [0.45, 0.4, 0.05, 2], [0.45, 1.45, 0.05, 2], [1.85, 0.4, 0.05, 2], [1.85, 1.45, 0.05, 2], [2.3, -0.7, 0.16, 3]]
    .map(([x, y, r, h]) => [x * 0.78, y * 0.78, r, h]);

  // one ray: distance to the first thing it hits and how tall that thing is (in dot rows)
  function cast(ox, oy, ang, extra) {
    const dx = Math.cos(ang), dy = Math.sin(ang);
    let best = RANGE, tall = 0;
    for (const [a, b, hgt] of segs) {
      const ex = b[0] - a[0], ey = b[1] - a[1];
      const den = dx * ey - dy * ex;
      if (Math.abs(den) < 1e-9) continue;
      const t = ((a[0] - ox) * ey - (a[1] - oy) * ex) / den;
      const u = ((a[0] - ox) * dy - (a[1] - oy) * dx) / den;
      if (t > 0 && t < best && u >= 0 && u <= 1) { best = t; tall = hgt; }
    }
    const list = extra ? circles.concat([extra]) : circles;
    for (const [qx, qy, r, hgt] of list) {
      const fx = ox - qx, fy = oy - qy;
      const b = fx * dx + fy * dy, c = fx * fx + fy * fy - r * r, disc = b * b - c;
      if (disc < 0) continue;
      const t = -b - Math.sqrt(disc);
      if (t > 0 && t < best) { best = t; tall = hgt; }
    }
    return best < RANGE ? [best, tall] : null;
  }

  // ---------- section scenes: each section gets its own small robotics piece, lit like the scan ----------
  const TAU = Math.PI * 2;
  const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const SCOLS = ["rgba(255,244,230,0.95)", "rgba(250,210,170,0.8)", "rgba(242,168,107,0.7)", "rgba(224,138,75,0.5)", "rgba(150,92,52,0.32)"];
  const cu = (a) => `rgba(242,168,107,${a})`;
  const hot = (a) => `rgba(255,236,214,${a})`;

  function makeScene(canvas, opts, fn) {
    const real = canvas.getContext("2d");
    // a do-nothing context, used while measuring how much room the piece takes up
    const noop = () => {};
    const grad = { addColorStop: noop };
    const dummy = { beginPath: noop, moveTo: noop, lineTo: noop, closePath: noop, stroke: noop, fill: noop, fillRect: noop, save: noop, restore: noop, translate: noop, scale: noop, arc: noop, fillText: noop, clearRect: noop, createRadialGradient: () => grad, createLinearGradient: () => grad };
    let ctx = real;
    const B = [[], [], [], [], []];
    const v = { yaw: opts.yaw || 0, pitch: opts.pitch || 0.5 };
    const dust = Array.from({ length: opts.dust || 0 }, () => [(Math.random() - 0.5) * 4, Math.random() * 1.2, (Math.random() - 0.5) * 4, Math.random() * 6]);
    let W = 1, H = 1, scale = 1, cx = 0, cy = 0, px = 0, py = 0, pz = 0;
    let measuring = false, x0 = 0, x1 = 0, y0 = 0, y1 = 0;
    let form = 1, idx = 0; // form: 0 = empty space, 1 = fully built (driven by scroll)
    const LB = 24; // band kept clear at the bottom for the readout
    function size() {
      const rc = canvas.getBoundingClientRect();
      W = Math.max(1, Math.round(rc.width)); H = Math.max(1, Math.round(rc.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = W * dpr; canvas.height = H * dpr;
      real.setTransform(dpr, 0, 0, dpr, 0, 0);
      // run a whole cycle at unit scale and fit what it touches inside the canvas
      measuring = true; ctx = dummy; scale = 1; cx = 0; cy = 0; form = 1;
      x0 = y0 = Infinity; x1 = y1 = -Infinity;
      const keep = [v.yaw, v.pitch];
      for (let t = 0; t <= 26; t += 0.4) { fn(t, api); B.forEach((L) => (L.length = 0)); }
      [v.yaw, v.pitch] = keep;
      measuring = false; ctx = real;
      const padX = 8, padT = 8, padB = opts.after ? LB + 6 : 8;
      scale = Math.min((W - padX * 2) / (x1 - x0), (H - padT - padB) / (y1 - y0));
      cx = padX + ((W - padX * 2) - (x1 - x0) * scale) / 2 - x0 * scale;
      cy = padT + ((H - padT - padB) - (y1 - y0) * scale) / 2 - y0 * scale;
    }
    // y is up; the camera sits above and in front, looking down a little
    function P(x, y, z) {
      const c = Math.cos(v.yaw), s = Math.sin(v.yaw);
      const X = x * c - z * s, Z = x * s + z * c;
      const cp = Math.cos(v.pitch), sp = Math.sin(v.pitch);
      const Y2 = y * cp + Z * sp, Z2 = Z * cp - y * sp;
      const k = 7 / (7 + Z2);
      px = cx + X * scale * k; py = cy - Y2 * scale * k; pz = Z2;
      if (measuring) { if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py; }
    }
    const shade = (b) => b * (1 - Math.max(-0.4, Math.min(0.5, pz * 0.09)));
    function dot(x, y, z, b) {
      if (form < 1) {
        const h = hash(++idx * 1.618), lp = Math.min(1, Math.max(0, (form - h * 0.6) / 0.4));
        if (lp <= 0) return;
        const u = 1 - lp;
        x += u * (hash(idx * 3.1) - 0.5) * 1.4; y += u * u * 1.3; z += u * (hash(idx * 5.7) - 0.5) * 1.4;
        b *= lp;
      }
      P(x, y, z);
      b = shade(b);
      if (b <= 0.04) return;
      B[b >= 0.85 ? 0 : b >= 0.62 ? 1 : b >= 0.4 ? 2 : b >= 0.2 ? 3 : 4].push(px, py);
    }
    // a path through 3D points: a soft glowing stroke with brighter points riding on it
    function path(pts, b, closed, every = 2) {
      if (pts.length < 2) return;
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = cu(Math.min(0.6, b * 0.42));
      ctx.lineWidth = 1;
      ctx.beginPath();
      pts.forEach((p, i) => { P(p[0], p[1], p[2]); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); });
      if (closed) ctx.closePath();
      ctx.stroke();
      ctx.globalCompositeOperation = "source-over";
      for (let i = 0; i < pts.length; i += every) dot(pts[i][0], pts[i][1], pts[i][2], b);
    }
    function line(p, q, b, n = 12) {
      const pts = [];
      for (let i = 0; i <= n; i++) { const t = i / n; pts.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t]); }
      path(pts, b, false);
    }
    function circle(x, y, z, r, from = 0, to = TAU, n) {
      const m = n || Math.max(10, Math.round(((to - from) * r) / 0.05));
      const pts = [];
      for (let i = 0; i <= m; i++) { const t = from + ((to - from) * i) / m; pts.push([x + Math.cos(t) * r, y, z + Math.sin(t) * r]); }
      return pts;
    }
    function ring(x, y, z, r, b, from, to) { path(circle(x, y, z, r, from, to), b, from === undefined); }
    function fill(pts, style) {
      ctx.beginPath();
      pts.forEach((p, i) => { P(p[0], p[1], p[2]); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); });
      ctx.closePath();
      ctx.fillStyle = style;
      ctx.fill();
    }
    function box(x0, y0, z0, x1, y1, z1, b, face = 0) {
      if (face) {
        fill([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], cu(face));
        fill([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], cu(face * 0.7));
        fill([[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]], cu(face * 0.5));
        fill([[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], cu(face * 0.5));
      }
      const X = [x0, x1], Y = [y0, y1], Z = [z0, z1];
      for (const y of Y) for (const z of Z) line([x0, y, z], [x1, y, z], b, 8);
      for (const x of X) for (const z of Z) line([x, y0, z], [x, y1, z], b, 6);
      for (const x of X) for (const y of Y) line([x, y, z0], [x, y, z1], b, 8);
    }
    function flare(x, y, z, r, a) {
      P(x, y, z);
      const g = ctx.createRadialGradient(px, py, 0, px, py, r);
      g.addColorStop(0, hot(a));
      g.addColorStop(1, cu(0));
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = g; ctx.fillRect(px - r, py - r, r * 2, r * 2);
      ctx.globalCompositeOperation = "source-over";
    }
    function beam(p, q, a) {
      P(p[0], p[1], p[2]); const x0 = px, y0 = py;
      P(q[0], q[1], q[2]);
      const g = ctx.createLinearGradient(x0, y0, px, py);
      g.addColorStop(0, hot(a)); g.addColorStop(1, cu(a * 0.3));
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = g; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(px, py); ctx.stroke();
      ctx.globalCompositeOperation = "source-over";
    }
    // the warm pool of light the piece stands in, laid flat on the floor
    function floor(r, rings = 3) {
      P(0, 0, 0);
      ctx.save();
      ctx.translate(px, py); ctx.scale(1, Math.max(0.2, Math.sin(v.pitch)) * 1.1);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * scale);
      g.addColorStop(0, cu(0.2)); g.addColorStop(0.55, cu(0.06)); g.addColorStop(1, cu(0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, r * scale, 0, TAU); ctx.fill();
      ctx.restore();
      for (let k = 1; k <= rings; k++) {
        const rr = (r * k) / rings, n = Math.round((rr * scale * TAU) / 3.2);
        for (let i = 0; i < n; i++) { const t = (i / n) * TAU; dot(Math.cos(t) * rr, 0, Math.sin(t) * rr, k === rings ? 0.22 : 0.14); }
      }
    }
    // readouts sit in their own band under the piece; if the two would crowd, they spread to the edges
    function label(left, right) {
      ctx.font = '9.5px "Geist Mono", ui-monospace, monospace';
      const lw = left ? ctx.measureText(left).width : 0, rw = right ? ctx.measureText(right).width : 0;
      let l = Math.max(4, cx + x0 * scale), r = Math.min(W - 4, cx + x1 * scale);
      if (l + lw + 16 > r - rw) { l = 4; r = W - 4; }
      const both = !!right && l + lw + 16 <= r - rw;
      const y = H - 12;
      ctx.fillStyle = "rgba(163,157,147,0.72)";
      ctx.textAlign = "left"; if (left) ctx.fillText(left, l, y);
      ctx.textAlign = "right"; if (both) ctx.fillText(right, r, y);
    }
    const api = { v, dot, path, line, circle, ring, fill, box, flare, beam, floor, label, hot, cu };
    function draw(t, f = 1) {
      if (W < 40) return; // hidden
      form = f; idx = 0;
      ctx.clearRect(0, 0, W, H);
      if (form <= 0.001) return;
      ctx.globalAlpha = Math.pow(form, 1.5);
      ctx.save();
      if (opts.after) { ctx.beginPath(); ctx.rect(0, 0, W, H - LB); ctx.clip(); }
      fn(t, api);
      for (const d of dust) dot(d[0], d[1] + 0.06 * Math.sin(t * 0.7 + d[3]), d[2], 0.1 + 0.08 * Math.sin(t * 1.3 + d[3]));
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "lighter";
      for (let b = 0; b < 5; b++) {
        const L = B[b];
        if (!L.length) continue;
        ctx.fillStyle = SCOLS[b];
        const d = b === 0 ? 1.8 : 1.5;
        for (let k = 0; k < L.length; k += 2) ctx.fillRect(L[k] - d / 2, L[k + 1] - d / 2, d, d);
        L.length = 0;
      }
      ctx.restore();
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = form;
      if (opts.after) opts.after(t, api);
      ctx.globalAlpha = 1;
    }
    return { size, draw };
  }

  // how brightly a spot at distance d is lit by rings expanding from the middle
  const litBy = (fronts, d, w) => fronts.reduce((g, [R, s]) => Math.max(g, s * Math.exp(-(((R - d) / w) ** 2))), 0);

  const SCENES = {
    // Socials: a lattice mast broadcasting; each node flares and links up as a ring reaches it
    signal: [{ pitch: 0.3 }, (t, a) => {
      a.v.yaw = t * 0.12;
      a.floor(2.4, 0);
      const H = 0.95, r = 0.18;
      a.fill(a.circle(0, 0.001, 0, 0.4), a.cu(0.1));
      const rail = (k, y) => { const th = (k * TAU) / 3, f = 1 - (y / H) * 0.7; return [Math.cos(th) * r * f, y, Math.sin(th) * r * f]; };
      for (let k = 0; k < 3; k++) {
        a.line(rail(k, 0), rail(k, H), 0.7, 16);
        for (let y = 0; y < H - 0.2; y += 0.24) a.line(rail(k, y), rail((k + 1) % 3, y + 0.24), 0.3, 4);
      }
      const fronts = [];
      for (let i = 0; i < 3; i++) {
        const f = (t / 2.8 + i / 3) % 1, R = 0.25 + f * 2.15;
        fronts.push([R, 1 - f]);
        a.ring(0, H, 0, R, (1 - f) * 0.9);
      }
      const nodes = [[1.9, 0.7], [-1.5, 1.3], [-0.3, -2.0], [1.3, -1.5]];
      nodes.forEach(([x, z]) => {
        const g = litBy(fronts, Math.hypot(x, z), 0.28);
        a.box(x - 0.1, 0, z - 0.1, x + 0.1, 0.18, z + 0.1, 0.35 + 0.6 * g, 0.06 + 0.2 * g);
        a.line([x, 0.18, z], [x, 0.36, z], 0.5 + 0.4 * g, 5);
        if (g > 0.25) { a.beam([0, H, 0], [x, 0.36, z], g * 0.55); a.flare(x, 0.36, z, 7, g * 0.8); }
      });
      const blink = 0.55 + 0.45 * Math.sin(t * 5);
      a.flare(0, H + 0.08, 0, 10, 0.55 * blink + 0.2);
      a.dot(0, H + 0.08, 0, 1);
    }, { dust: 6 }],

    // Work: a printer laying a vase down one layer at a time
    printer: [{ pitch: 0.4 }, (t, a) => {
      a.v.yaw = 0.55; // a fixed view: only the print grows
      a.floor(1.7, 0);
      a.fill([[-1.05, 0, -1.05], [1.05, 0, -1.05], [1.05, 0, 1.05], [-1.05, 0, 1.05]], a.cu(0.06));
      for (let x = -0.875; x <= 0.876; x += 0.35) for (let z = -0.875; z <= 0.876; z += 0.35) a.dot(x, 0, z, 0.14);
      a.path([[-1.05, 0, -1.05], [1.05, 0, -1.05], [1.05, 0, 1.05], [-1.05, 0, 1.05]], 0.4, true, 4);
      const L = 16, CYCLE = 12, u = t % CYCLE;
      const p = Math.min(1, u / 10) * L, done = Math.floor(p), frac = p - done;
      const fade = u > 11.2 ? 1 - (u - 11.2) / 0.8 : 1;
      const rad = (y) => 0.52 + 0.16 * Math.sin(y * 4.2 + 0.6);
      for (let i = 0; i < done; i++) {
        const y = i * 0.075, age = (done - i) / L;
        a.ring(0, y, 0, rad(y), (0.9 - age * 0.45) * fade);
      }
      let ny = done * 0.075, nx, nz;
      if (done < L) {
        const end = frac * TAU;
        a.ring(0, ny, 0, rad(ny), 1, 0, end);
        nx = Math.cos(end) * rad(ny); nz = Math.sin(end) * rad(ny);
      } else { ny -= 0.075; nx = rad(ny); nz = 0; }
      const top = ny + 0.08;
      a.box(nx - 0.09, top + 0.12, nz - 0.09, nx + 0.09, top + 0.26, nz + 0.09, 0.7, 0.25);
      a.beam([nx, top + 0.12, nz], [nx, top, nz], 0.9);
      if (done < L) a.flare(nx, top - 0.02, nz, 9, 0.75);
      a.line([-1.1, top + 0.19, nz], [1.1, top + 0.19, nz], 0.25, 20);
    }, { dust: 6 }],

    // Footer: the same room as the flat map the scan leaves behind, with Fetch driving its route
    map: [{ pitch: 0.78 }, (t, a) => {
      a.v.yaw = 0.25 * Math.sin(t * 0.12);
      if (!MAP.ready) buildMap();
      const { cells, CELL } = MAP;
      for (const [x, z, occ] of cells) {
        if (occ) {
          const e = CELL * 0.82, top = [[x, 0.14, z], [x + e, 0.14, z], [x + e, 0.14, z + e], [x, 0.14, z + e]];
          a.fill(top, a.cu(0.24));
          a.path(top, 0.6, true, 1);
          a.dot(x + e, 0.07, z + e, 0.35); a.dot(x, 0.07, z + e, 0.35);
        }
        else a.dot(x + CELL * 0.4, 0, z + CELL * 0.4, 0.1);
      }
      const T = (t / 26) * TAU;
      const trail = [];
      for (let k = 30; k >= 0; k--) { const [x, z] = MAP.route(T - k * 0.03); trail.push([x, 0.02, z]); }
      a.path(trail, 0.7, false, 3);
      const [fx, fz] = MAP.route(T);
      a.fill(a.circle(fx, 0.18, fz, 0.13), a.cu(0.35));
      a.ring(fx, 0, fz, 0.13, 0.7); a.ring(fx, 0.18, fz, 0.13, 0.95);
      a.flare(fx, 0.2, fz, 10, 0.6);
    }, { dust: 0 }],
  };

  // occupancy grid of the room, filled in by rays cast from points along Fetch's route
  const MAP = { ready: false, CELL: 0.2, cells: [], route: (t) => [0.95 * Math.sin(t), 0.5 * Math.sin(2 * t + 0.6) - 0.2] };
  function buildMap() {
    const C = MAP.CELL, X0 = -2.4, Y0 = -1.8, NX = 24, NY = 19;
    const occ = new Uint8Array(NX * NY);
    const at = (x, y) => { const i = Math.floor((x - X0) / C), j = Math.floor((y - Y0) / C); return i >= 0 && j >= 0 && i < NX && j < NY ? j * NX + i : -1; };
    for (let k = 0; k < 24; k++) {
      const [ox, oy] = MAP.route((k / 24) * TAU);
      for (let ang = 0; ang < TAU; ang += 0.02) {
        const hit = cast(ox, oy, ang, null), d = hit ? hit[0] : RANGE;
        for (let s = 0; s < d; s += C * 0.4) { const c = at(ox + Math.cos(ang) * s, oy + Math.sin(ang) * s); if (c >= 0 && !occ[c]) occ[c] = 1; }
        if (hit) { const c = at(ox + Math.cos(ang) * (d + 0.03), oy + Math.sin(ang) * (d + 0.03)); if (c >= 0) occ[c] = 2; }
      }
    }
    // the map's y axis is the floor's z; flip so it matches the hero's view
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
      const v = occ[j * NX + i];
      if (v) MAP.cells.push([X0 + i * C, -(Y0 + (j + 1) * C), v === 2]);
    }
    const r = MAP.route;
    MAP.route = (t) => { const [x, y] = r(t); return [x, -y]; };
    MAP.ready = true;
  }

  const live = [];
  document.querySelectorAll("canvas.scene[data-scene]").forEach((cv) => {
    const def = SCENES[cv.dataset.scene];
    if (!def || !cv.getContext) return;
    const sc = makeScene(cv, Object.assign({}, def[0], def[2] || {}), def[1]);
    sc.size();
    live.push({ cv, sc, on: true, form: reduceMotion ? 1 : 0 });
  });
  if (live.length) {
    const t0 = performance.now();
    if (reduceMotion) live.forEach((l) => l.sc.draw(4));
    else {
      if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver((es) => es.forEach((e) => {
          const l = live.find((x) => x.cv === e.target);
          if (!l) return;
          l.on = e.isIntersecting;
          if (!l.on && e.boundingClientRect.top > 0) l.form = 0; // left out the bottom: start empty again
        }));
        live.forEach((l) => { l.on = false; io.observe(l.cv); });
      }
      // a scene stays empty until it scrolls past the middle of the screen, then builds itself in
      // (and comes apart again if you scroll back up); it never rests half-built
      const BUILD = 1.3;
      let last = t0;
      const ease = (x) => x * x * (3 - 2 * x);
      const loop = (now) => {
        const t = (now - t0) / 1000, dt = Math.min(0.05, (now - last) / 1000), vh = window.innerHeight;
        last = now;
        const atBottom = window.scrollY + vh >= document.documentElement.scrollHeight - 2;
        for (const l of live) {
          if (!l.on) continue;
          const want = atBottom || l.cv.getBoundingClientRect().top < vh * 0.55 ? 1 : 0;
          l.form = want ? Math.min(1, l.form + dt / BUILD) : Math.max(0, l.form - dt / BUILD);
          l.sc.draw(t, ease(l.form));
        }
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }
    let srt = 0;
    window.addEventListener("resize", () => { clearTimeout(srt); srt = setTimeout(() => live.forEach((l) => { l.sc.size(); if (reduceMotion) l.sc.draw(4); }), 150); });
  }
})();
