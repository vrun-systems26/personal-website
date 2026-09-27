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
    // Escape or a tap anywhere else closes the menu
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") { set(false); toggle.focus(); }
    });
    document.addEventListener("click", (e) => {
      if (toggle.getAttribute("aria-expanded") === "true" && !panel.contains(e.target) && !toggle.contains(e.target)) set(false);
    });
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
      links.forEach((a) => {
        const on = a.dataset.spy === id;
        a.classList.toggle("is-active", on);
        if (on) a.setAttribute("aria-current", "location"); else a.removeAttribute("aria-current");
      });
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

// ---------- words set in dots, each dot on a spring (the name, and the section titles) ----------
function dotWord(canvas, WORD, opts = {}) {
  if (!canvas || !canvas.getContext) return null;
  const ctx = canvas.getContext("2d");
  const K = 0.06, DAMP = 0.85, PUSH = opts.push || 3;
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
    radius = opts.radius ? opts.radius(H) : Math.max(44, Math.min(80, H * 0.7));

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
  ready.then(() => { if (opts.beforeBuild) opts.beforeBuild(); build(); start(); });
  return { build, start };
}
dotWord(document.getElementById("field"), "VARUN");

// ---------- section titles: the same dots as the name, smaller, with a gentler cursor ----------
(function () {
  document.querySelectorAll(".block-head > span:first-child").forEach((span) => {
    const cv = document.createElement("canvas");
    cv.className = "dot-title";
    cv.setAttribute("aria-hidden", "true");
    span.classList.add("dot-title-text"); // the real words stay for screen readers and search
    span.parentNode.insertBefore(cv, span);
    const text = span.textContent.trim();
    // size the canvas so the word fills its height, like the name fills its box
    const fit = () => {
      const fs = parseFloat(getComputedStyle(span.parentNode).fontSize) || 40;
      const h = Math.round(fs * 0.98);
      const o = document.createElement("canvas").getContext("2d");
      o.font = `800 ${h}px "DM Sans", sans-serif`;
      const m = o.measureText(text);
      const scale = (h * 0.98) / (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent);
      cv.style.width = Math.ceil((m.actualBoundingBoxLeft + m.actualBoundingBoxRight) * scale / 0.99) + 6 + "px";
      cv.style.height = h + "px";
    };
    dotWord(cv, text, { push: 1.6, radius: (H) => Math.max(16, H * 0.45), beforeBuild: fit });
    let rt = 0;
    window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(fit, 60); });
  });
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
      if (short) short.textContent = on ? "stop" : "music"; // the credit under the bar names the artist
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

// ---------- hero: two solid helical gears turning in mesh, a light copper tint with a border ----------
(function () {
  const canvas = document.getElementById("gears");
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext("2d");
  const TAU = Math.PI * 2;
  const YAW = -0.62, PITCH = 0.8; // camera: looking down at the gears from the front left
  const THICK = 0.3;               // how deep the gears are
  const SPEED = 0.26;              // radians per second for the big gear

  // same tooth pitch on both, so they mesh
  const A = { R: 1, teeth: 28, h: 0.15, holes: 6 };
  const B = { R: 22 / 28, teeth: 22, h: 0.15, holes: 5 };
  // helical: each tooth winds a full pitch down the face; the pair wind in opposite hands
  A.twist = 1.0 * (TAU / A.teeth);
  B.twist = -A.twist * (A.R / B.R);
  const PHI = 0.95; // where B sits around A
  const D = A.R + B.R + A.h * 0.3;
  A.x = -Math.cos(PHI) * D / 2; A.z = -Math.sin(PHI) * D / 2;
  B.x = A.x + Math.cos(PHI) * D; B.z = A.z + Math.sin(PHI) * D;
  // phase so a tooth of one always sits in a gap of the other where they meet
  const PHASE = ((PHI * (A.teeth + B.teeth)) / TAU + B.teeth / 2 - 0.5) * TAU / B.teeth;

  let W = 1, H = 1, S = 1, cx = 0, cy = 0, raf = 0, visible = true, last = performance.now(), rot = 0.4;
  let sx = 0, sy = 0;
  const cyw = Math.cos(YAW), syw = Math.sin(YAW), cp = Math.cos(PITCH), sp = Math.sin(PITCH);
  function P(x, y, z) {
    const X = x * cyw - z * syw, Z = x * syw + z * cyw;
    const Y2 = y * cp + Z * sp, Z2 = Z * cp - y * sp;
    const k = 9 / (9 + Z2);
    sx = cx + X * S * k; sy = cy - Y2 * S * k;
  }

  // tooth profile: a wide rounded root tapering to a narrow point, curved all the way.
  // samples start at the gear's own angle, so they turn with it instead of sliding over the teeth
  function outline(g, r) {
    const n = g.teeth * 12, pts = [];
    for (let i = 0; i < n; i++) {
      const th = r + (i / n) * TAU;
      const s = 0.5 + 0.5 * Math.cos(g.teeth * (th - r));
      const rr = g.R - g.h * 0.55 + g.h * Math.pow(s, 2.2);
      pts.push([g.x + Math.cos(th) * rr, g.z + Math.sin(th) * rr]);
    }
    return pts;
  }
  function holes(g, r) {
    const list = [[g.x, g.z, g.R * 0.24, r]];
    for (let k = 0; k < g.holes; k++) {
      const a = r + (k * TAU) / g.holes;
      list.push([g.x + Math.cos(a) * g.R * 0.58, g.z + Math.sin(a) * g.R * 0.58, g.R * 0.16, a]);
    }
    return list;
  }
  // solid gears in a light copper tint; only the edges you can actually see are drawn
  const TOP = "rgb(58,44,31)";      // light copper over the page, for the top face
  const BODY = "rgb(43,33,24)";     // a shade darker for the sides
  const EDGE = "rgba(246,178,120,0.85)";
  const EDGE_2 = "rgba(246,178,120,0.5)";
  const SLICES = 30; // the body is stacked from thin slices, bottom up; each covers what is hidden behind it

  // one level of the gear: the outline turned by the twist at depth f (0 = top, 1 = bottom), straight holes cut out
  function level(g, out, hs, f) {
    const y = -THICK * f, a = -g.twist * f, c = Math.cos(a), s = Math.sin(a);
    ctx.beginPath();
    out.forEach((pt, i) => {
      const dx = pt[0] - g.x, dz = pt[1] - g.z;
      P(g.x + dx * c - dz * s, y, g.z + dx * s + dz * c);
      if (i) ctx.lineTo(sx, sy); else ctx.moveTo(sx, sy);
    });
    ctx.closePath();
    for (const [hx, hz, hr, a0] of hs) {
      for (let i = 0; i <= 40; i++) { const t = a0 + (i / 40) * TAU; P(hx + Math.cos(t) * hr, y, hz + Math.sin(t) * hr); if (i) ctx.lineTo(sx, sy); else ctx.moveTo(sx, sy); }
      ctx.closePath();
    }
  }
  // a tooth tip at depth f
  function tip(g, pt, f) {
    const a = -g.twist * f, c = Math.cos(a), s = Math.sin(a), dx = pt[0] - g.x, dz = pt[1] - g.z;
    P(g.x + dx * c - dz * s, -THICK * f, g.z + dx * s + dz * c);
  }

  function drawGear(g, r) {
    const out = outline(g, r), hs = holes(g, r);
    ctx.lineJoin = "round";
    // the bottom edge first; the slices above hide whatever part of it is out of sight
    level(g, out, hs, 1);
    ctx.fillStyle = BODY; ctx.fill("evenodd");
    ctx.strokeStyle = EDGE_2; ctx.lineWidth = 2.4; ctx.stroke();
    for (let s = SLICES - 1; s >= 0; s--) {
      const f = s / SLICES, f0 = (s + 1) / SLICES;
      // the edge running down each tooth tip, one slice at a time, so the next slice hides the back ones
      ctx.beginPath();
      for (let k = 0; k < g.teeth; k++) {
        tip(g, out[k * 12], f0); ctx.moveTo(sx, sy);
        tip(g, out[k * 12], f); ctx.lineTo(sx, sy);
      }
      ctx.strokeStyle = EDGE_2; ctx.lineWidth = 1.6; ctx.stroke();
      level(g, out, hs, f);
      ctx.fillStyle = s ? BODY : TOP;
      ctx.fill("evenodd");
    }
    // the top face's border
    level(g, out, hs, 0);
    ctx.strokeStyle = EDGE; ctx.lineWidth = 1.3;
    ctx.stroke();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const rb = -rot * (A.teeth / B.teeth) + PHASE;
    // the farther gear (higher on screen) first; fixed for this camera, so the order never swaps
    P(A.x, 0, A.z); const ya = sy;
    P(B.x, 0, B.z); const yb = sy;
    if (ya < yb) { drawGear(A, rot); drawGear(B, rb); } else { drawGear(B, rb); drawGear(A, rot); }
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
    const pad = Math.min(W, H) * 0.07;
    S = Math.min((W - pad * 2) / (x1 - x0), (H - pad * 2) / (y1 - y0));
    cx = W / 2 - ((x0 + x1) / 2) * S;
    cy = H / 2 - ((y0 + y1) / 2) * S;
  }

  function tick(now) {
    raf = 0;
    rot += Math.min(0.05, (now - last) / 1000) * SPEED;
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

// ---------- a small scene for each section ----------
// drawn like the hero gears: see-through shapes with a light copper tint and a light copper border
(function () {
  const TAU = Math.PI * 2;
  const cu = (a) => `rgba(246,178,120,${a})`;
  const hot = cu;

  function makeScene(canvas, opts, fn) {
    const real = canvas.getContext("2d");
    // a do-nothing context, used while measuring how much room the piece takes up
    const noop = () => {};
    const grad = { addColorStop: noop };
    const dummy = { beginPath: noop, moveTo: noop, lineTo: noop, closePath: noop, stroke: noop, fill: noop, fillRect: noop, save: noop, restore: noop, translate: noop, scale: noop, arc: noop, fillText: noop, clearRect: noop, createRadialGradient: () => grad, createLinearGradient: () => grad };
    let ctx = real;
    const v = { yaw: opts.yaw || 0, pitch: opts.pitch || 0.5 };
    let W = 1, H = 1, scale = 1, cx = 0, cy = 0, px = 0, py = 0;
    let measuring = false, x0 = 0, x1 = 0, y0 = 0, y1 = 0;
    function size() {
      const rc = canvas.getBoundingClientRect();
      W = Math.max(1, Math.round(rc.width)); H = Math.max(1, Math.round(rc.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = W * dpr; canvas.height = H * dpr;
      real.setTransform(dpr, 0, 0, dpr, 0, 0);
      // run a whole cycle at unit scale and fit what it touches inside the canvas
      measuring = true; ctx = dummy; scale = 1; cx = 0; cy = 0;
      x0 = y0 = Infinity; x1 = y1 = -Infinity;
      const keep = [v.yaw, v.pitch];
      for (let t = 0; t <= 26; t += 0.4) fn(t, api);
      [v.yaw, v.pitch] = keep;
      measuring = false; ctx = real;
      const pad = 8;
      scale = Math.min((W - pad * 2) / (x1 - x0), (H - pad * 2) / (y1 - y0));
      cx = pad + ((W - pad * 2) - (x1 - x0) * scale) / 2 - x0 * scale;
      cy = pad + ((H - pad * 2) - (y1 - y0) * scale) / 2 - y0 * scale;
    }
    // y is up; the camera sits above and in front, looking down a little
    function P(x, y, z) {
      const c = Math.cos(v.yaw), s = Math.sin(v.yaw);
      const X = x * c - z * s, Z = x * s + z * c;
      const cp = Math.cos(v.pitch), sp = Math.sin(v.pitch);
      const Y2 = y * cp + Z * sp, Z2 = Z * cp - y * sp;
      const k = 7 / (7 + Z2);
      px = cx + X * scale * k; py = cy - Y2 * scale * k;
      if (measuring) { if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py; }
    }
    function trace(pts, closed) {
      pts.forEach((p, i) => { P(p[0], p[1], p[2]); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); });
      if (closed) ctx.closePath();
    }
    // an edge through 3D points; b is how strong it is
    function path(pts, b, closed) {
      if (pts.length < 2 || b <= 0.01) return;
      ctx.beginPath();
      trace(pts, closed);
      ctx.strokeStyle = cu(Math.min(0.9, 0.12 + b * 0.72));
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    function line(p, q, b) { path([p, q], b, false); }
    function circle(x, y, z, r, from = 0, to = TAU, n) {
      const m = n || Math.max(10, Math.round(((to - from) * r) / 0.05));
      const pts = [];
      for (let i = 0; i <= m; i++) { const t = from + ((to - from) * i) / m; pts.push([x + Math.cos(t) * r, y, z + Math.sin(t) * r]); }
      return pts;
    }
    function ring(x, y, z, r, b, from, to) { path(circle(x, y, z, r, from, to), b, from === undefined); }
    function fill(pts, style) {
      ctx.beginPath();
      trace(pts, true);
      ctx.fillStyle = style;
      ctx.fill();
    }
    // a see-through box: tinted faces, every edge outlined
    function box(x0, y0, z0, x1, y1, z1, b, face = 0) {
      if (face) {
        const faces = [
          [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]],
          [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]],
          [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]],
          [[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]],
          [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]],
        ];
        for (const f of faces) fill(f, cu(face * 0.45));
      }
      const X = [x0, x1], Y = [y0, y1], Z = [z0, z1];
      for (const y of Y) for (const z of Z) line([x0, y, z], [x1, y, z], b);
      for (const x of X) for (const z of Z) line([x, y0, z], [x, y1, z], b);
      for (const x of X) for (const y of Y) line([x, y, z0], [x, y, z1], b);
    }
    // a small lit point: a tinted disc with its border
    function flare(x, y, z, r, a) {
      if (a <= 0.02) return;
      P(x, y, z);
      ctx.beginPath(); ctx.arc(px, py, Math.max(2.5, r * 0.4), 0, TAU);
      ctx.fillStyle = cu(a * 0.3); ctx.fill();
      ctx.strokeStyle = cu(Math.min(0.9, a)); ctx.lineWidth = 1.2; ctx.stroke();
    }
    function beam(p, q, a) { line(p, q, a); }
    // the floor the piece stands on: a flat tinted plate with a border
    function floor(r) {
      const pts = circle(0, 0, 0, r, 0, TAU, 72);
      fill(pts, cu(0.04));
      path(pts, 0.14, true);
    }
    const dot = (x, y, z) => P(x, y, z);
    const api = { v, dot, path, line, circle, ring, fill, box, flare, beam, floor, hot, cu };
    function draw(t, f = 1) {
      if (W < 40) return; // hidden
      ctx.clearRect(0, 0, W, H);
      if (f <= 0.001) return;
      // builds in by fading up and settling into place
      ctx.save();
      ctx.globalAlpha = Math.pow(f, 1.5);
      ctx.translate(0, (1 - f) * 16);
      ctx.lineJoin = "round";
      fn(t, api);
      ctx.restore();
    }
    return { size, draw };
  }

  // how brightly a spot at distance d is lit by rings expanding from the middle
  const litBy = (fronts, d, w) => fronts.reduce((g, [R, s]) => Math.max(g, s * Math.exp(-(((R - d) / w) ** 2))), 0);

  const SCENES = {
    // Socials: a lattice mast broadcasting; each node lights up as a ring reaches it
    signal: [{ pitch: 0.3 }, (t, a) => {
      a.v.yaw = t * 0.12;
      a.floor(2.4);
      const H = 0.95, r = 0.18;
      a.fill(a.circle(0, 0.001, 0, 0.4), a.cu(0.1));
      a.ring(0, 0.001, 0, 0.4, 0.5);
      const rail = (k, y) => { const th = (k * TAU) / 3, f = 1 - (y / H) * 0.7; return [Math.cos(th) * r * f, y, Math.sin(th) * r * f]; };
      for (let k = 0; k < 3; k++) {
        a.line(rail(k, 0), rail(k, H), 0.8);
        for (let y = 0; y < H - 0.2; y += 0.24) a.line(rail(k, y), rail((k + 1) % 3, y + 0.24), 0.4);
      }
      const fronts = [];
      for (let i = 0; i < 3; i++) {
        const f = (t / 2.8 + i / 3) % 1, R = 0.25 + f * 2.15;
        fronts.push([R, 1 - f]);
        const pts = a.circle(0, H, 0, R);
        a.fill(pts, a.cu((1 - f) * 0.05));
        a.path(pts, (1 - f) * 0.8, true);
      }
      const nodes = [[1.9, 0.7], [-1.5, 1.3], [-0.3, -2.0], [1.3, -1.5]];
      nodes.forEach(([x, z]) => {
        const g = litBy(fronts, Math.hypot(x, z), 0.28);
        a.box(x - 0.1, 0, z - 0.1, x + 0.1, 0.18, z + 0.1, 0.45 + 0.5 * g, 0.12 + 0.25 * g);
        a.line([x, 0.18, z], [x, 0.36, z], 0.5 + 0.4 * g);
        if (g > 0.25) { a.beam([0, H, 0], [x, 0.36, z], g * 0.6); a.flare(x, 0.36, z, 9, g); }
      });
      a.flare(0, H + 0.08, 0, 11, 0.55 + 0.35 * Math.sin(t * 5));
    }],

    // Work: a printer laying a vase down one layer at a time
    printer: [{ pitch: 0.4 }, (t, a) => {
      a.v.yaw = 0.55; // a fixed view: only the print grows
      a.floor(1.7);
      const bed = [[-1.05, 0, -1.05], [1.05, 0, -1.05], [1.05, 0, 1.05], [-1.05, 0, 1.05]];
      a.fill(bed, a.cu(0.08));
      a.path(bed, 0.5, true);
      const L = 16, CYCLE = 12, u = t % CYCLE;
      const p = Math.min(1, u / 10) * L, done = Math.floor(p), frac = p - done;
      const fade = u > 11.2 ? 1 - (u - 11.2) / 0.8 : 1;
      const rad = (y) => 0.52 + 0.16 * Math.sin(y * 4.2 + 0.6);
      for (let i = 0; i < done; i++) {
        const y = i * 0.075, age = (done - i) / L, pts = a.circle(0, y, 0, rad(y));
        a.fill(pts, a.cu(0.035 * fade));
        a.path(pts, (0.85 - age * 0.4) * fade, true);
      }
      let ny = done * 0.075, nx, nz;
      if (done < L) {
        const end = frac * TAU;
        a.ring(0, ny, 0, rad(ny), 1, 0, end);
        nx = Math.cos(end) * rad(ny); nz = Math.sin(end) * rad(ny);
      } else { ny -= 0.075; nx = rad(ny); nz = 0; }
      const top = ny + 0.08;
      a.box(nx - 0.09, top + 0.12, nz - 0.09, nx + 0.09, top + 0.26, nz + 0.09, 0.8, 0.3);
      a.beam([nx, top + 0.12, nz], [nx, top, nz], 0.9);
      if (done < L) a.flare(nx, top - 0.02, nz, 8, 0.8);
      a.line([-1.1, top + 0.19, nz], [1.1, top + 0.19, nz], 0.35);
    }],

  };

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
