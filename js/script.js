// =========================================================
// Varun Chilukuri, portfolio interactions
// =========================================================

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- year ----------
document.querySelectorAll(".js-year").forEach((el) => (el.textContent = new Date().getFullYear()));

// ---------- local clock (San Jose) ----------
(function () {
  const el = document.getElementById("clock");
  if (!el) return;
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles", hour: "2-digit", minute: "2-digit", hour12: false,
  });
  const tick = () => (el.textContent = fmt.format(new Date()));
  tick();
  setInterval(tick, 15000);
})();

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

// ---------- section ruler on the left edge ----------
(function () {
  const links = document.querySelectorAll(".ruler a[data-spy]");
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

// ---------- stat counters ----------
(function () {
  const counts = document.querySelectorAll(".count[data-to]");
  const run = (el) => {
    if (reduceMotion) { el.textContent = el.dataset.to; el.dataset.done = "1"; return; }
    const start = performance.now(), dur = 1200;
    const step = (t) => {
      const to = +el.dataset.to; // read each frame so a live value can land mid-count
      const p = Math.min(1, (t - start) / dur);
      el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step); else el.dataset.done = "1";
    };
    requestAnimationFrame(step);
  };
  if (!("IntersectionObserver" in window)) { counts.forEach(run); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
  }, { threshold: 0.5 });
  counts.forEach((el) => io.observe(el));
})();

// ---------- stack: each row shows what fits on one line, "+N" reveals the rest ----------
(function () {
  const rows = Array.from(document.querySelectorAll(".stack-row"));
  const setups = rows.map((row) => {
    const list = row.querySelector(".stack-items");
    const items = Array.from(list.querySelectorAll("li"));
    const more = document.createElement("button");
    more.type = "button";
    more.className = "stack-more";
    more.setAttribute("aria-expanded", "false");
    row.appendChild(more);
    const topic = row.querySelector(".stack-label").textContent;

    function fit() {
      if (row.classList.contains("is-open")) return;
      items.forEach((li) => li.classList.remove("is-extra"));
      more.hidden = false;
      let shown = Math.min(3, items.length);
      const apply = () => items.forEach((li, i) => li.classList.toggle("is-extra", i >= shown));
      apply();
      while (shown > 1 && list.scrollWidth > list.clientWidth + 1) { shown--; apply(); }
      const rest = items.length - shown;
      more.hidden = rest <= 0;
      more.textContent = `+${rest}`;
      more.setAttribute("aria-label", `Show ${rest} more in ${topic}`);
    }
    more.addEventListener("click", () => {
      const open = row.classList.toggle("is-open");
      more.setAttribute("aria-expanded", String(open));
      if (open) {
        items.forEach((li) => li.classList.remove("is-extra"));
        more.textContent = "less";
      } else {
        fit();
      }
    });
    return fit;
  });
  const fitAll = () => setups.forEach((f) => f());
  fitAll();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAll);
  let t = 0;
  window.addEventListener("resize", () => { clearTimeout(t); t = setTimeout(fitAll, 150); });
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

  let model = null;
  // the first view is the build as a spinning dot model; photos sit behind the thumbnails
  function buildShots(container, name) {
    const imgs = Array.from(container.querySelectorAll("img"));
    const main = imgs.length ? imgs[0].cloneNode() : null;
    container.innerHTML = "";
    const stage = document.createElement("div");
    stage.className = "shot-model";
    stage.innerHTML = '<canvas aria-label="3D dot model, drag to rotate"></canvas><span class="shot-hint">drag to rotate</span>';
    container.appendChild(stage);
    if (main) { main.className = "shot-main"; main.hidden = true; container.appendChild(main); }
    model = DotModels.mount(stage.querySelector("canvas"), name);
    if (!imgs.length) return;
    const thumbs = document.createElement("div");
    thumbs.className = "shot-thumbs";
    const pick = (b) => thumbs.querySelectorAll("button").forEach((x) => x.classList.toggle("is-on", x === b));
    const mb = document.createElement("button");
    mb.type = "button";
    mb.className = "thumb-3d is-on";
    mb.setAttribute("aria-label", "Show the 3D dot model");
    mb.textContent = "3D";
    mb.addEventListener("click", () => {
      stage.hidden = false; main.hidden = true; pick(mb);
      if (model) model.resume();
    });
    thumbs.appendChild(mb);
    imgs.forEach((img, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", `Show photo ${i + 1}: ${img.alt}`);
      b.appendChild(img.cloneNode());
      b.addEventListener("click", () => {
        main.src = img.src;
        main.alt = img.alt;
        main.hidden = false; stage.hidden = true; pick(b);
        if (model) model.pause();
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
    if (model) { model.stop(); model = null; }
    if (shots) buildShots(shots, name);
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
    if (model) { model.stop(); model = null; }
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
  let W = 0, H = 0, gap = 4, radius = 60, n = 0, wordW = 0;
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
    o.fillStyle = "#fff";
    o.fillText(WORD, m.actualBoundingBoxLeft, (H - (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent)) / 2 + m.actualBoundingBoxAscent);

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
      mx = wordW * (0.5 + 0.55 * Math.sin(t * 0.45));
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

// ---------- commit heatmap: live from GitHub, saved snapshot as fallback ----------
(function () {
  const grid = document.getElementById("heatGrid");
  const months = document.getElementById("heatMonths");
  const tip = document.getElementById("heatTip");
  if (!grid || !months) return;
  const LIVE = "https://github-contributions-api.jogruber.de/v4/vrun-systems26?y=last";
  const SNAPSHOT = "data/contributions.json";
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const ordinal = (n) => { const s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };

  function render(data) {
    const days = (data && data.contributions) || [];
    if (!days.length) return;
    const total = data.total && (data.total.lastYear ?? Object.values(data.total)[0]);
    if (total != null) {
      document.querySelectorAll(".js-commits").forEach((el) => (el.textContent = total));
      document.querySelectorAll(".js-commits-count").forEach((el) => {
        el.dataset.to = total;
        if (el.dataset.done) el.textContent = total;
      });
    }
    grid.innerHTML = "";
    months.innerHTML = "";
    const pad = new Date(days[0].date + "T12:00:00").getDay();
    for (let i = 0; i < pad; i++) { const c = document.createElement("i"); c.className = "is-pad"; grid.appendChild(c); }
    let lastMonth = -1;
    days.forEach((d, i) => {
      const date = new Date(d.date + "T12:00:00");
      const c = document.createElement("i");
      if (d.level > 0) c.className = "l" + Math.min(4, d.level);
      c.dataset.label = `${date.toLocaleString("en-US", { month: "long" })} ${ordinal(date.getDate())}, ${date.getFullYear()}: ${d.count} contribution${d.count === 1 ? "" : "s"}`;
      grid.appendChild(c);
      const col = Math.floor((i + pad) / 7);
      if (date.getMonth() !== lastMonth && date.getDate() <= 7) {
        const m = document.createElement("span");
        m.textContent = MONTHS[date.getMonth()];
        m.style.gridColumn = `${col + 1} / span 3`;
        months.appendChild(m);
        lastMonth = date.getMonth();
      }
    });
    const cols = Math.ceil((days.length + pad) / 7);
    grid.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
    months.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
  }

  if (tip) {
    const box = grid.closest(".activity");
    grid.addEventListener("mouseover", (e) => {
      const c = e.target;
      if (c.tagName !== "I" || !c.dataset.label) return;
      const r = c.getBoundingClientRect(), b = box.getBoundingClientRect();
      tip.textContent = c.dataset.label;
      tip.style.left = r.left - b.left + r.width / 2 + "px";
      tip.style.top = r.top - b.top + "px";
      tip.hidden = false;
    });
    grid.addEventListener("mouseleave", () => (tip.hidden = true));
  }

  const get = (url) => fetch(url, { cache: "no-store" }).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); });
  get(LIVE).then(render).catch(() => get(SNAPSHOT).then(render).catch(() => {}));
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

// ---------- music: opt-in, very quiet, fades in and out ----------
(function () {
  // one tip inline in the intro (small screens), one parked in the right column (wide screens)
  const btns = Array.from(document.querySelectorAll(".music-tip"));
  const card = document.getElementById("np");
  const closeBtn = document.getElementById("npClose");
  if (!btns.length || !card) return;
  const VIDEO = "d8NRvNm5RXk";
  const VOLUME = 25;      // quiet, sits under everything, but clearly there
  const FADE_IN = 4000;
  const FADE_OUT = 1100;
  let player = null, fadeTimer = 0, level = 0, playing = false;

  function fadeTo(target, ms, done) {
    clearInterval(fadeTimer);
    const from = level, steps = Math.max(1, Math.round(ms / 50));
    let i = 0;
    fadeTimer = setInterval(() => {
      i++;
      level = from + (target - from) * (i / steps);
      if (player && player.setVolume) player.setVolume(Math.round(level));
      if (i >= steps) { clearInterval(fadeTimer); if (done) done(); }
    }, 50);
  }
  function loadApi() {
    if (window.YT && window.YT.Player) return Promise.resolve();
    return new Promise((resolve) => {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { if (prev) prev(); resolve(); };
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(s);
    });
  }
  function setState(on) {
    playing = on;
    btns.forEach((b) => {
      b.classList.toggle("is-playing", on);
      b.setAttribute("aria-pressed", String(on));
      const label = b.querySelector(".music-label");
      if (label) label.textContent = on ? "now playing: Champagne Coast (click to stop)" : "recommended: play music for a better experience";
    });
  }
  async function play() {
    card.hidden = false;
    setState(true);
    if (player && player.playVideo) {
      player.setVolume(0); level = 0;
      player.playVideo();
      fadeTo(VOLUME, FADE_IN);
      return;
    }
    await loadApi();
    if (!playing || player) return; // stopped (or already built) while loading
    player = new YT.Player("ytPlayer", {
      videoId: VIDEO,
      width: "200",
      height: "200",
      playerVars: { autoplay: 1, loop: 1, playlist: VIDEO, controls: 0, rel: 0, playsinline: 1, disablekb: 1, iv_load_policy: 3 },
      events: {
        onReady: (e) => {
          e.target.setVolume(0); level = 0;
          if (!playing) return; // stopped before it was ready
          e.target.playVideo();
          fadeTo(VOLUME, FADE_IN);
        },
      },
    });
  }
  function stop() {
    setState(false);
    fadeTo(0, FADE_OUT, () => {
      if (player && player.pauseVideo) player.pauseVideo();
      card.hidden = true;
    });
  }
  btns.forEach((b) => b.addEventListener("click", () => (playing ? stop() : play())));
  if (closeBtn) closeBtn.addEventListener("click", stop);
})();

// ---------- pixel bots: Ceres (left column) and Fetch (right column), animating in place ----------
(function () {
  const cvC = document.getElementById("botCeres");
  const cvF = document.getElementById("botFetch");
  if (!cvC || !cvF) return;
  const cc = cvC.getContext("2d");
  const cf = cvF.getContext("2d");

  function dot(ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }
  const ease = (a) => a * a * (3 - 2 * a);
  const seg = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));

  // ----- Fetch: trash-can body, webcam, ultrasonic band, mecanum wheels; strafes side to side -----
  const F = {
    can: "#3a3530", rib: "#2b2723", hi: "#5a524b", rim: "#5a534c", rimHi: "#7d746b", inside: "#141210",
    cam: "#46464d", camTop: "#62626a", ring: "#3a6fe0", lens: "#08080a", glint: "#b7d0ff",
    band: "#141414", pcb: "#2c56c9", eye: "#cfd3d8", eyeLo: "#7d848d",
    base: "#2a2a2e", baseTop: "#4a4a52", baseLine: "#1c1c1f",
    wheel: "#f0c02c", wheelLo: "#b88f1a", roller: "#161616", axle: "#55555a",
    wires: ["#e0703a", "#3a78e0", "#c23b3b", "#d8c040"],
  };
  function drawFetch(t) {
    const ctx = cf;
    ctx.clearRect(0, 0, 40, 34);
    // 6.4s loop: roll right, pause, roll left, pause, home (mecanum, so it strafes)
    const L = 6.4, u = t % L;
    let dx, dir;
    if (u < 1.2) { dx = 3 * ease(seg(u, 0, 1.2)); dir = 1; }
    else if (u < 2.2) { dx = 3; dir = 0; }
    else if (u < 4.2) { dx = 3 - 6 * ease(seg(u, 2.2, 4.2)); dir = -1; }
    else if (u < 5.2) { dx = -3; dir = 0; }
    else { dx = -3 + 3 * ease(seg(u, 5.2, 6.4)); dir = 1; }
    const ox = 9 + Math.round(dx);
    const bob = dir && Math.floor(t * 8) % 2 ? 1 : 0;
    const phase = Math.floor(t * 10) * dir;

    ctx.globalAlpha = 0.35; dot(ctx, ox + 1, 33, 20, 1, "#000"); ctx.globalAlpha = 1;

    // wheels, diagonal rollers roll while strafing
    for (const wx of [0, 19]) {
      for (let y = 24; y <= 32; y++) {
        for (let x = 0; x < 3; x++) {
          const edge = y === 24 || y === 32;
          const r = (((x + y + phase) % 3) + 3) % 3 === 0;
          dot(ctx, ox + wx + x, y, 1, 1, edge ? F.wheelLo : r ? F.roller : F.wheel);
        }
      }
    }
    // base box
    const by = 23 - bob;
    dot(ctx, ox + 2, by, 18, 7, F.base);
    dot(ctx, ox + 2, by, 18, 1, F.baseTop);
    dot(ctx, ox + 5, by + 3, 12, 1, F.baseLine);
    dot(ctx, ox + 5, by + 5, 12, 1, F.baseLine);
    dot(ctx, ox + 1, by + 4, 1, 2, F.axle);
    dot(ctx, ox + 20, by + 4, 1, 2, F.axle);

    // trash-can body, slightly tapered, ribbed
    const top = 1 - bob;
    for (let y = 0; y < 22; y++) {
      const k = Math.floor(y / 11);
      const l = 3 + k, r = 18 - k;
      for (let x = l; x <= r; x++) {
        let c = x === l + 1 ? F.hi : (x - l) % 2 ? F.rib : F.can;
        if (y === 0) c = F.rimHi;
        else if (y === 1) c = x === l || x === r ? F.rim : F.inside;
        else if (y === 2) c = F.rim;
        dot(ctx, ox + x, top + y, 1, 1, c);
      }
    }
    // webcam clipped to the front
    const cy = top + 4;
    dot(ctx, ox + 5, cy, 12, 5, F.cam);
    dot(ctx, ox + 5, cy, 12, 1, F.camTop);
    dot(ctx, ox + 9, cy + 1, 4, 3, F.ring);
    dot(ctx, ox + 10, cy + 2, 2, 1, F.lens);
    dot(ctx, ox + 10, cy + 1, 1, 1, F.glint);
    dot(ctx, ox + 14, cy + 1, 1, 1, Math.floor(t * 2) % 4 === 0 ? "#ff5a4a" : "#6b2a24");
    dot(ctx, ox + 5, cy + 5, 1, 2, "#0b0b0b");
    dot(ctx, ox + 16, cy + 5, 1, 2, "#0b0b0b");

    // ultrasonic band: one sensor up front, one on each side
    const bY = top + 11;
    dot(ctx, ox + 3, bY + 1, 16, 2, F.band);
    dot(ctx, ox + 7, bY, 8, 4, F.pcb);
    dot(ctx, ox + 8, bY + 1, 2, 2, F.eye); dot(ctx, ox + 9, bY + 2, 1, 1, F.eyeLo);
    dot(ctx, ox + 12, bY + 1, 2, 2, F.eye); dot(ctx, ox + 13, bY + 2, 1, 1, F.eyeLo);
    dot(ctx, ox + 1, bY + 1, 2, 2, F.eye);
    dot(ctx, ox + 19, bY + 1, 2, 2, F.eye);

    // dangling jumper wires
    const w = F.wires;
    for (let j = 0; j < 5; j++) dot(ctx, ox + 9 - (j > 3 ? 1 : 0), bY + 4 + j, 1, 1, w[0]);
    for (let j = 0; j < 6; j++) dot(ctx, ox + 10, bY + 4 + j, 1, 1, w[2]);
    for (let j = 0; j < 7; j++) dot(ctx, ox + 12 + (j > 3 ? 1 : 0), bY + 4 + j, 1, 1, w[1]);
    dot(ctx, ox + 15, bY + 4, 1, 3, w[3]);

    // sonar ping out of the side it's heading toward
    if (dir) {
      const sx = dir > 0 ? ox + 21 : ox;
      const step = Math.floor(t * 9) % 4;
      const px0 = sx + dir * (2 + step * 2);
      ctx.globalAlpha = 0.85 - step * 0.2;
      dot(ctx, px0, bY + 1, 1, 2, "#8fe07a");
      dot(ctx, px0 - dir, bY, 1, 1, "#8fe07a");
      dot(ctx, px0 - dir, bY + 3, 1, 1, "#8fe07a");
      ctx.globalAlpha = 1;
    }
  }

  // ----- Ceres: low 4WD chassis, teal wheels, pan-tilt camera, rack-and-pinion soil probe -----
  const C = {
    tire: "#2bb0b8", tireLo: "#1c7f86", hub: "#141414", tread: "#135a60",
    plate: "#26262a", plateTop: "#45454c", pcb: "#b3322b", pcbHi: "#d2473d", uno: "#2a5fb0",
    acrylic: "#e6e3de", acrylicLo: "#a9a59f", cam: "#2a2a2f", camHi: "#4a4a52", lens: "#3a6fe0",
    post: "#232327", rod: "#c9c9cc", rodLo: "#8a8a8f", rack: "#2e2e33",
    stem: "#4f8a3a", leaf: "#6cbf4a", leafLo: "#4d9a34", sick: "#c9a23a", spot: "#7a5522",
    soil: "#3d2b1f", soilHi: "#5a4130", led: "#8fe07a",
  };
  function wheel(ctx, cx, cy, rot) {
    for (let y = -4; y <= 4; y++) {
      for (let x = -4; x <= 4; x++) {
        const d = x * x + y * y;
        if (d > 20) continue;
        dot(ctx, cx + x, cy + y, 1, 1, d <= 2 ? C.hub : d > 13 ? C.tireLo : C.tire);
      }
    }
    for (let k = 0; k < 3; k++) {
      const a = rot + (k * Math.PI * 2) / 3;
      dot(ctx, cx + Math.round(Math.cos(a) * 3), cy + Math.round(Math.sin(a) * 3), 1, 1, C.tread);
    }
  }
  function drawCeres(t) {
    const ctx = cc;
    ctx.clearRect(0, 0, 48, 28);
    // 9s loop: look around, find the sick leaf, box it, probe the soil
    const L = 9, u = t % L;
    const dx = u < 2.4 ? -2 * Math.sin(Math.PI * seg(u, 0, 2.4)) : 0;
    const ox = Math.round(dx);
    const rot = dx * 1.2;

    let face = 1, tilt = 0; // face: -1 left, 0 toward you, 1 right (toward the plant)
    if (u < 0.8) face = 0;
    else if (u < 1.7) face = -1;
    else if (u < 2.5) face = 0;
    else if (u >= 3.0 && u < 7.8) tilt = 1;

    let probe = 0;
    if (u >= 5.2 && u < 5.8) probe = seg(u, 5.2, 5.8);
    else if (u >= 5.8 && u < 7.0) probe = 1;
    else if (u >= 7.0 && u < 7.6) probe = 1 - seg(u, 7.0, 7.6);
    const pd = Math.round(probe * 7);

    // ground, soil, shadow
    ctx.globalAlpha = 0.35; dot(ctx, ox + 3, 27, 28, 1, "#000"); ctx.globalAlpha = 1;
    dot(ctx, 33, 26, 4, 1, C.soilHi); dot(ctx, 32, 27, 6, 1, C.soil);
    dot(ctx, 39, 26, 7, 1, C.soilHi); dot(ctx, 38, 27, 9, 1, C.soil);

    // plant with one diseased leaf
    dot(ctx, 42, 16, 1, 10, C.stem);
    dot(ctx, 39, 21, 3, 1, C.leaf); dot(ctx, 38, 20, 2, 1, C.leafLo);
    dot(ctx, 40, 17, 2, 1, C.leaf); dot(ctx, 39, 16, 2, 1, C.leafLo);
    dot(ctx, 43, 19, 3, 2, C.sick); dot(ctx, 46, 18, 1, 1, C.sick);
    dot(ctx, 44, 19, 1, 1, C.spot); dot(ctx, 45, 20, 1, 1, C.spot);
    dot(ctx, 42, 14, 1, 2, C.leaf); dot(ctx, 43, 13, 1, 1, C.leafLo);

    // soil probe on its rack (rod first, bracket over it)
    dot(ctx, ox + 34, 11 + pd, 1, 9, C.rod);
    dot(ctx, ox + 34, 19 + pd, 1, 1, C.rodLo);
    dot(ctx, ox + 32, 11, 2, 7, C.rack);
    dot(ctx, ox + 33, 12 + (pd % 2), 1, 1, "#55555c");
    dot(ctx, ox + 31, 17, 3, 2, C.post);

    // wheels + chassis
    wheel(ctx, ox + 9, 22, rot);
    wheel(ctx, ox + 25, 22, rot);
    dot(ctx, ox + 3, 17, 29, 3, C.plate);
    dot(ctx, ox + 3, 17, 29, 1, C.plateTop);
    dot(ctx, ox + 5, 15, 20, 2, C.pcb);
    dot(ctx, ox + 5, 15, 20, 1, C.pcbHi);
    dot(ctx, ox + 12, 13, 7, 2, C.uno);
    dot(ctx, ox + 23, 14, 8, 1, C.acrylic);
    dot(ctx, ox + 23, 15, 8, 2, C.acrylicLo);
    dot(ctx, ox + 25, 14, 1, 1, "#7c7873"); dot(ctx, ox + 28, 14, 1, 1, "#7c7873");
    // rat's nest of jumper wires
    [[6, 13, "#e0703a"], [7, 12, "#e0703a"], [8, 12, "#d8c040"], [9, 13, "#d8c040"], [10, 12, "#c23b3b"],
     [11, 11, "#c23b3b"], [19, 12, "#3a78e0"], [20, 13, "#3a78e0"], [21, 12, "#e8e8e8"], [5, 14, "#c23b3b"]]
      .forEach(([x, y, c]) => dot(ctx, ox + x, y, 1, 1, c));

    // pan-tilt mast + camera head
    dot(ctx, ox + 16, 7, 2, 8, C.post);
    dot(ctx, ox + 15, 10, 4, 2, "#303036");
    const hy = 2 + tilt;
    if (face === 0) {
      dot(ctx, ox + 13, hy, 8, 5, C.cam);
      dot(ctx, ox + 13, hy, 8, 1, C.camHi);
      dot(ctx, ox + 16, hy + 2, 2, 2, C.lens);
      dot(ctx, ox + 16, hy + 2, 1, 1, "#b7d0ff");
    } else {
      const bx = face > 0 ? 14 : 13;
      dot(ctx, ox + bx, hy, 7, 5, C.cam);
      dot(ctx, ox + bx, hy, 7, 1, C.camHi);
      const lx = face > 0 ? bx + 7 : bx - 1;
      dot(ctx, ox + lx, hy + 1, 1, 3, "#303036");
      dot(ctx, ox + lx, hy + 2, 1, 1, C.lens);
    }

    // looking at the leaf: marching scan dots, then a blinking detection box
    if (tilt && u < 5.2) {
      if (u < 4.0) {
        const x0 = ox + 22, y0 = hy + 3, x1 = 43, y1 = 19;
        const off = Math.floor(t * 12) % 3;
        ctx.globalAlpha = 0.6;
        for (let s = off; s < 22; s += 3) {
          const k = s / 22;
          dot(ctx, Math.round(x0 + (x1 - x0) * k), Math.round(y0 + (y1 - y0) * k), 1, 1, C.led);
        }
        ctx.globalAlpha = 1;
      } else if (Math.floor(t * 5) % 2 === 0) {
        dot(ctx, 41, 16, 7, 1, C.led); dot(ctx, 41, 22, 7, 1, C.led);
        dot(ctx, 41, 16, 1, 7, C.led); dot(ctx, 47, 16, 1, 7, C.led);
      }
    }
    // soil reading ticks up while the probe is down
    if (u >= 5.8 && u < 7.0) {
      const n = 1 + Math.floor(seg(u, 5.8, 6.8) * 3);
      for (let i = 0; i < n; i++) dot(ctx, ox + 36, 9 - i * 2, 2, 1, i === 3 ? "#5fb4ff" : C.led);
    }
  }

  const wide = window.matchMedia("(min-width: 1200px)");
  if (reduceMotion) { drawFetch(0); drawCeres(4.5); return; }
  let last = 0;
  function tick(now) {
    requestAnimationFrame(tick);
    if (!wide.matches || now - last < 70) return; // ~14 fps suits pixel art
    last = now;
    const t = now / 1000;
    drawFetch(t);
    drawCeres(t);
  }
  requestAnimationFrame(tick);
})();

// ---------- hero: a small black hole in dots, next to the headline ----------
(function () {
  const wrap = document.querySelector(".hole");
  const canvas = document.getElementById("hole");
  const hero = document.querySelector(".hero");
  if (!wrap || !canvas || !canvas.getContext) return;
  const ctx = canvas.getContext("2d");

  const N = 1400, RIN = 1.45, ROUT = 3.7;
  const r = new Float32Array(N), a = new Float32Array(N), h = new Float32Array(N), s = new Float32Array(N);
  const spawn = (i, anywhere) => {
    r[i] = anywhere ? RIN + Math.pow(Math.random(), 1.6) * (ROUT - RIN) : ROUT - Math.random() * 0.4;
    a[i] = Math.random() * Math.PI * 2;
    h[i] = (Math.random() - 0.5) * 0.09 * r[i];
    s[i] = Math.random();
  };
  for (let i = 0; i < N; i++) spawn(i, true);
  const stars = Array.from({ length: 34 }, () => [Math.random(), Math.random(), Math.random() * 6]);

  let W = 0, H = 0, S = 30, cx = 0, cy = 0;
  let tilt = 0.2, roll = -0.12, tiltT = 0.2, rollT = -0.12, boost = 1, boostT = 1;
  let raf = 0, visible = true, last = performance.now();

  function size() {
    const rect = canvas.getBoundingClientRect();
    W = Math.max(1, Math.round(rect.width)); H = Math.max(1, Math.round(rect.height));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    S = Math.min(W, H) / 8.4;
    cx = W / 2; cy = H / 2;
  }

  // colour buckets: outer embers to white-hot inner edge
  const COLS = ["rgba(150,92,52,0.55)", "rgba(224,138,75,0.8)", "rgba(242,168,107,0.95)", "rgba(250,214,178,1)", "rgba(255,244,230,1)"];
  const B = [[], [], [], [], []];
  const put = (x, y, v) => B[v < 0.3 ? 0 : v < 0.52 ? 1 : v < 0.72 ? 2 : v < 0.9 ? 3 : 4].push(x, y);

  function draw(now) {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    tilt += (tiltT - tilt) * 0.05; roll += (rollT - roll) * 0.05; boost += (boostT - boost) * 0.04;
    const st = Math.sin(tilt), ct = Math.cos(tilt);
    B.forEach((b) => (b.length = 0));
    const front = [];

    for (let i = 0; i < N; i++) {
      if (!reduceMotion) {
        a[i] += dt * boost * 1.9 * Math.pow(r[i], -1.5);
        r[i] -= dt * boost * 0.018 * (1 + s[i]);
        if (r[i] < RIN) spawn(i, false);
      }
      const X = r[i] * Math.cos(a[i]), Z = r[i] * Math.sin(a[i]);
      const sx = X * S, sy = (-Z * st + h[i] * ct) * S;
      // brighter toward the hot inner edge and on the side swinging toward you
      const heat = 1 - (r[i] - RIN) / (ROUT - RIN);
      const beam = 0.5 - 0.5 * Math.cos(a[i]) * 0.9;
      const v = Math.min(1, heat * 0.62 + beam * 0.38 + s[i] * 0.12);
      if (Z > 0) {
        // far side: hidden behind the shadow, but its light bends up and over the top
        if (sx * sx + sy * sy > S * S * 1.05) put(sx, sy, v * 0.9);
        if (i % 2 === 0) {
          const th = Math.acos(Math.max(-1, Math.min(1, X / r[i])));
          const rho = S * (1.12 + (r[i] - RIN) * 0.16);
          put(rho * Math.cos(th), -rho * Math.sin(th) * (0.92 + ct * 0.08), v * 0.95);
        }
      } else {
        front.push(sx, sy, v);
        if (i % 5 === 0) {
          const th = Math.acos(Math.max(-1, Math.min(1, X / r[i])));
          const rho = S * (1.1 + (r[i] - RIN) * 0.1);
          put(rho * Math.cos(th), rho * Math.sin(th) * 0.9, v * 0.5);
        }
      }
    }

    ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
    ctx.clearRect(0, 0, W, H);
    // faint far-off stars
    for (const [u, w, p] of stars) {
      ctx.globalAlpha = 0.18 + 0.14 * Math.sin(now / 900 + p);
      ctx.fillStyle = "#f7f3ec";
      ctx.fillRect(u * W, w * H, 1.2, 1.2);
    }
    ctx.globalAlpha = 1;
    ctx.translate(cx, cy);
    ctx.rotate(roll);
    // soft glow the whole thing sits in
    const g = ctx.createRadialGradient(0, 0, S * 0.9, 0, 0, S * 3.4);
    g.addColorStop(0, "rgba(242,168,107,0.16)");
    g.addColorStop(1, "rgba(242,168,107,0)");
    ctx.fillStyle = g;
    ctx.fillRect(-S * 4, -S * 4, S * 8, S * 8);
    const dot = 1.7;
    const paint = () => {
      for (let b = 0; b < 5; b++) {
        const L = B[b];
        if (!L.length) continue;
        ctx.fillStyle = COLS[b];
        for (let k = 0; k < L.length; k += 2) ctx.fillRect(L[k] - dot / 2, L[k + 1] - dot / 2, dot, dot);
        L.length = 0;
      }
    };
    paint();
    // the shadow, with a thin photon ring
    ctx.fillStyle = "#070605";
    ctx.beginPath(); ctx.arc(0, 0, S, 0, Math.PI * 2); ctx.fill();
    const ring = 120;
    for (let k = 0; k < ring; k++) {
      const t = (k / ring) * Math.PI * 2 + now / 2600;
      const c = -Math.cos(t);
      put(Math.cos(t) * S * 1.03, Math.sin(t) * S * 1.03, 0.55 + c * 0.4);
    }
    for (let k = 0; k < front.length; k += 3) put(front[k], front[k + 1], front[k + 2]);
    paint();

    if (!reduceMotion && visible) raf = requestAnimationFrame(draw);
  }
  const start = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(draw); } };

  // the cursor anywhere over the intro leans the disk; getting close spins it up
  if (hero) {
    hero.addEventListener("pointermove", (e) => {
      const rc = canvas.getBoundingClientRect();
      const nx = (e.clientX - (rc.left + rc.width / 2)) / window.innerWidth;
      const ny = (e.clientY - (rc.top + rc.height / 2)) / window.innerHeight;
      tiltT = 0.2 + Math.max(-0.12, Math.min(0.26, ny * 0.6));
      rollT = -0.12 + Math.max(-0.14, Math.min(0.14, nx * 0.4));
      const d = Math.hypot(e.clientX - (rc.left + rc.width / 2), e.clientY - (rc.top + rc.height / 2));
      boostT = d < rc.width * 0.55 ? 2.6 : 1;
    });
    hero.addEventListener("pointerleave", () => { tiltT = 0.2; rollT = -0.12; boostT = 1; });
  }

  size();
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible && !reduceMotion) start(); }).observe(wrap);
  }
  if (reduceMotion) draw(performance.now()); else start();
  let rt = 0;
  window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { size(); if (reduceMotion) draw(performance.now()); }, 150); });
})();

// ---------- project models: each build as a small cloud of dots you can spin ----------
const DotModels = (function () {
  const STEP = 0.045;
  function shape() {
    const P = [];
    const add = (x, y, z) => P.push(x, y, z);
    const line = (a, b, step = STEP) => {
      const d = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
      const n = Math.max(1, Math.round(d / step));
      for (let i = 0; i <= n; i++) { const t = i / n; add(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t); }
    };
    // point on a circle around an axis
    const circ = (ax, c, r, t) => {
      const u = Math.cos(t) * r, v = Math.sin(t) * r;
      return ax === "x" ? [c[0], c[1] + u, c[2] + v] : ax === "y" ? [c[0] + u, c[1], c[2] + v] : [c[0] + u, c[1] + v, c[2]];
    };
    const ring = (ax, c, r, step = STEP) => {
      const n = Math.max(8, Math.round((Math.PI * 2 * r) / step));
      for (let i = 0; i < n; i++) add(...circ(ax, c, r, (i / n) * Math.PI * 2));
    };
    const shift = (ax, c, d) => ax === "x" ? [c[0] + d, c[1], c[2]] : ax === "y" ? [c[0], c[1] + d, c[2]] : [c[0], c[1], c[2] + d];
    // cylinder along an axis: end rings, a few lengthwise lines, optional spokes
    const cyl = (ax, c, r, len, lines = 8, spokes = 0) => {
      const c0 = shift(ax, c, -len / 2), c1 = shift(ax, c, len / 2);
      ring(ax, c0, r); ring(ax, c1, r);
      for (let i = 0; i < lines; i++) { const t = (i / lines) * Math.PI * 2; line(circ(ax, c0, r, t), circ(ax, c1, r, t)); }
      for (let i = 0; i < spokes; i++) { const t = (i / spokes) * Math.PI * 2; line(c1, circ(ax, c1, r, t)); }
    };
    // tapered tube along y (cans, lampshades)
    const cone = (c, r0, r1, h, lines = 12, rings = 2) => {
      for (let k = 0; k < rings; k++) { const t = k / (rings - 1); ring("y", [c[0], c[1] + h * t, c[2]], r0 + (r1 - r0) * t); }
      for (let i = 0; i < lines; i++) { const t = (i / lines) * Math.PI * 2; line(circ("y", c, r0, t), circ("y", [c[0], c[1] + h, c[2]], r1, t)); }
    };
    const box = (c, w, hh, d, face = 0) => {
      const [x0, x1, y0, y1, z0, z1] = [c[0] - w / 2, c[0] + w / 2, c[1] - hh / 2, c[1] + hh / 2, c[2] - d / 2, c[2] + d / 2];
      const E = [[[x0, y0, z0], [x1, y0, z0]], [[x0, y1, z0], [x1, y1, z0]], [[x0, y0, z1], [x1, y0, z1]], [[x0, y1, z1], [x1, y1, z1]],
        [[x0, y0, z0], [x0, y1, z0]], [[x1, y0, z0], [x1, y1, z0]], [[x0, y0, z1], [x0, y1, z1]], [[x1, y0, z1], [x1, y1, z1]],
        [[x0, y0, z0], [x0, y0, z1]], [[x1, y0, z0], [x1, y0, z1]], [[x0, y1, z0], [x0, y1, z1]], [[x1, y1, z0], [x1, y1, z1]]];
      E.forEach(([p, q]) => line(p, q));
      if (face) for (let x = x0 + face; x < x1; x += face) for (let z = z0 + face; z < z1; z += face) add(x, y1, z);
    };
    const blob = (c, rx, ry, rz, n, minY = -Infinity) => {
      for (let i = 0; i < n; i++) {
        const y = 1 - (2 * (i + 0.5)) / n, rr = Math.sqrt(1 - y * y), t = i * 2.39996;
        const p = [c[0] + Math.cos(t) * rr * rx, c[1] + y * ry, c[2] + Math.sin(t) * rr * rz];
        if (p[1] >= minY) add(...p);
      }
    };
    return { P, add, line, ring, cyl, cone, box, blob };
  }

  const BUILD = {
    fetch(m) {
      m.box([0, 0.22, 0], 1.0, 0.26, 0.86, 0.12);
      [[-0.58, 0.3], [0.58, 0.3], [-0.58, -0.3], [0.58, -0.3]].forEach(([x, z]) => m.cyl("x", [x, 0.18, z], 0.18, 0.13, 10, 6));
      m.cone([0, 0.36, 0], 0.4, 0.46, 1.2, 22, 3);
      m.ring("y", [0, 0.98, 0], 0.475); m.ring("y", [0, 1.02, 0], 0.48);
      m.box([0, 1.3, 0.5], 0.36, 0.11, 0.08);
      m.ring("z", [0, 1.3, 0.55], 0.035);
      m.ring("z", [-0.08, 1.0, 0.5], 0.035); m.ring("z", [0.08, 1.0, 0.5], 0.035);
      m.ring("x", [-0.49, 1.0, 0], 0.03); m.ring("x", [0.49, 1.0, 0], 0.03);
    },
    ceres(m) {
      m.box([0, 0.3, 0], 0.78, 0.09, 1.2, 0.12);
      [[-0.5, 0.36], [0.5, 0.36], [-0.5, -0.36], [0.5, -0.36]].forEach(([x, z]) => m.cyl("x", [x, 0.23, z], 0.23, 0.14, 10, 6));
      m.box([0, 0.39, -0.05], 0.55, 0.06, 0.8);
      m.box([0.16, 0.44, 0.28], 0.28, 0.04, 0.24);
      m.cyl("y", [0, 0.68, -0.15], 0.03, 0.56, 4);
      m.box([0, 0.99, -0.15], 0.28, 0.13, 0.14);
      m.ring("z", [0, 0.99, -0.07], 0.04);
      m.box([0, 0.5, 0.6], 0.07, 0.34, 0.06);
      m.line([0.06, 0.66, 0.62], [0.06, 0.06, 0.62]);
      m.line([0.07, 0.06, 0.62], [0.07, -0.06, 0.62]);
      // the plant it rolls up to
      m.line([0, -0.02, 1.05], [0, 0.45, 1.05]);
      m.line([0, 0.25, 1.05], [0.14, 0.33, 1.08]); m.line([0, 0.34, 1.05], [-0.13, 0.42, 1.02]);
    },
    sweeper(m) {
      m.box([0, 0.34, 0], 0.64, 0.36, 0.58, 0.12);
      m.cyl("x", [-0.4, 0.22, 0.05], 0.22, 0.08, 10, 6);
      m.cyl("x", [0.4, 0.22, 0.05], 0.22, 0.08, 10, 6);
      m.blob([0, 0.06, -0.24], 0.06, 0.06, 0.06, 40);
      m.box([0, 0.78, -0.05], 0.3, 0.52, 0.04);
      m.ring("z", [0.07, 0.95, -0.02], 0.03);
      m.box([0, 0.08, 0.4], 0.66, 0.08, 0.14);
      for (let x = -0.3; x <= 0.31; x += 0.1) m.line([x, 0.04, 0.47], [x, -0.02, 0.52]);
    },
    arm(m) {
      m.cyl("y", [0, 0.05, 0], 0.34, 0.1, 12);
      m.cyl("y", [0, 0.16, 0], 0.24, 0.12, 10);
      m.box([-0.09, 0.32, 0], 0.04, 0.26, 0.16); m.box([0.09, 0.32, 0], 0.04, 0.26, 0.16);
      // 4-bar: two parallel links up to the elbow
      [[-0.09, 0], [0.09, 0], [-0.09, 0.12], [0.09, 0.12]].forEach(([x, dz]) => {
        [[-0.018, -0.018], [0.018, -0.018], [-0.018, 0.018], [0.018, 0.018]].forEach(([ox, oz]) => m.line([x + ox, 0.42, dz + oz], [x + ox, 1.1, 0.36 + dz + oz]));
      });
      m.cyl("x", [0, 1.12, 0.42], 0.07, 0.24, 6);
      m.box([0, 1.02, 0.8], 0.14, 0.1, 0.72, 0.06);
      m.box([0, 1.02, 0.8], 0.1, 0.06, 0.72);
      m.ring("z", [0, 0.98, 1.17], 0.1);
      [0, 2.09, 4.19].forEach((t) => {
        const bx = Math.cos(t) * 0.09, by = 0.98 + Math.sin(t) * 0.09;
        m.line([bx, by, 1.17], [bx * 1.3, by + (by - 0.98) * 0.3, 1.36]);
        m.line([bx * 1.3, by + (by - 0.98) * 0.3, 1.36], [bx * 0.5, 0.98 + (by - 0.98) * 0.5, 1.5]);
      });
    },
    eclipse(m) {
      m.cyl("y", [0, 0.03, 0], 0.36, 0.06, 12);
      m.cyl("y", [0, 0.6, 0], 0.025, 1.1, 3);
      m.cone([0, 1.02, 0], 0.52, 0.26, 0.5, 18, 3);
      m.ring("y", [0, 1.02, 0], 0.5);
      // shutter blades and the camera tucked under the shade
      for (let i = 0; i < 6; i++) { const t = (i / 6) * Math.PI * 2; m.line([Math.cos(t) * 0.1, 1.08, Math.sin(t) * 0.1], [Math.cos(t + 0.9) * 0.4, 1.08, Math.sin(t + 0.9) * 0.4]); }
      m.box([0, 1.16, 0], 0.14, 0.08, 0.1);
      m.ring("y", [0, 1.12, 0], 0.035);
    },
    maglift(m) {
      m.box([0, 0.04, 0], 0.9, 0.08, 0.9, 0.15);
      m.box([0, 0.7, 0], 0.14, 1.24, 0.14);
      for (let y = 0.1; y < 1.25; y += 0.14) { m.line([-0.07, y, 0.07], [0.07, y + 0.14, 0.07]); m.line([-0.07, y, -0.07], [0.07, y + 0.14, -0.07]); }
      m.box([0.34, 1.36, 0], 1.2, 0.1, 0.1);
      for (let x = -0.2; x < 0.9; x += 0.13) m.line([x, 1.31, 0.05], [x + 0.13, 1.41, 0.05]);
      m.box([-0.3, 1.26, 0], 0.18, 0.16, 0.16);
      m.line([0.8, 1.31, 0], [0.8, 0.6, 0]);
      m.cyl("y", [0.8, 0.55, 0], 0.13, 0.08, 10);
      m.box([0.8, 0.2, 0.05], 0.16, 0.16, 0.16);
      m.box([-0.3, 0.12, 0.3], 0.16, 0.08, 0.12);
      m.line([-0.3, 0.16, 0.3], [-0.3, 0.3, 0.3]);
    },
    mars(m) {
      m.cyl("y", [0, 0.06, 0], 0.4, 0.12, 12);
      m.box([-0.26, 0.4, 0], 0.2, 0.2, 0.2); m.box([0.26, 0.4, 0], 0.2, 0.2, 0.2);
      // herringbone reduction: two big toothed rings on the shoulder
      [-0.06, 0.06].forEach((x, k) => {
        m.ring("x", [x, 0.62, 0], 0.3);
        for (let i = 0; i < 34; i++) { const t = (i / 34) * Math.PI * 2; m.line([x, 0.62 + Math.cos(t) * 0.3, Math.sin(t) * 0.3], [x + (k ? 0.04 : -0.04), 0.62 + Math.cos(t + 0.09) * 0.34, Math.sin(t + 0.09) * 0.34], 0.03); }
      });
      m.box([0, 1.02, 0.28], 0.18, 0.72, 0.16);
      m.box([0, 1.36, 0.72], 0.14, 0.12, 0.8);
      m.cyl("x", [0, 1.36, 0.3], 0.1, 0.22, 6);
    },
    mouse(m) {
      m.blob([0, 0.02, 0], 0.4, 0.28, 0.64, 1100, 0.0);
      m.line([0, 0.27, 0.12], [0, 0.18, 0.6]);
      m.ring("x", [0, 0.29, 0.2], 0.07);
      [[-0.43, 0.1, 0.1], [-0.43, 0.1, -0.06], [-0.43, 0.2, 0.02], [-0.43, 0.0, 0.02]].forEach((c) => m.box(c, 0.03, 0.06, 0.08));
      m.ring("y", [0, 0.0, 0], 0.39);
    },
  };

  const cache = {};
  function points(name) {
    if (cache[name]) return cache[name];
    const m = shape();
    (BUILD[name] || BUILD.fetch)(m);
    const P = m.P;
    // center it and scale to a unit-ish radius
    let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9, minZ = 1e9, maxZ = -1e9;
    for (let i = 0; i < P.length; i += 3) {
      minX = Math.min(minX, P[i]); maxX = Math.max(maxX, P[i]);
      minY = Math.min(minY, P[i + 1]); maxY = Math.max(maxY, P[i + 1]);
      minZ = Math.min(minZ, P[i + 2]); maxZ = Math.max(maxZ, P[i + 2]);
    }
    const mx = (minX + maxX) / 2, my = (minY + maxY) / 2, mz = (minZ + maxZ) / 2;
    const sc = 1 / Math.max(maxX - minX, maxY - minY, maxZ - minZ) * 1.9;
    const out = new Float32Array(P.length);
    for (let i = 0; i < P.length; i += 3) { out[i] = (P[i] - mx) * sc; out[i + 1] = (P[i + 1] - my) * sc; out[i + 2] = (P[i + 2] - mz) * sc; }
    return (cache[name] = { p: out, floor: (minY - my) * sc });
  }

  const COLS = ["rgba(111,106,98,0.55)", "rgba(163,120,86,0.75)", "rgba(224,138,75,0.9)", "rgba(242,168,107,1)", "rgba(255,236,214,1)"];

  function mount(canvas, name) {
    const ctx = canvas.getContext("2d");
    const { p, floor } = points(name);
    let W = 1, H = 1, raf = 0, alive = true;
    let yaw = -0.6, pitch = 0.32, spin = 0.5, drag = null, last = performance.now();
    const B = [[], [], [], [], []];
    function size() {
      const rc = canvas.getBoundingClientRect();
      W = Math.max(1, Math.round(rc.width)); H = Math.max(1, Math.round(rc.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function frame(now) {
      raf = 0;
      if (!alive) return;
      // the sheet may not have been laid out yet when this mounted
      if (canvas.clientWidth && (canvas.clientWidth !== W || canvas.clientHeight !== H)) size();
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (!drag && !reduceMotion) { spin += (0.5 - spin) * 0.03; yaw += spin * dt; pitch += (0.32 - pitch) * 0.02; }
      const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      const R = Math.min(W, H) * 0.36, F = 4.6, ox = W / 2, oy = H / 2 + H * 0.04;
      const proj = (x, y, z) => {
        const x1 = x * cy + z * sy, z1 = -x * sy + z * cy;
        const y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp;
        const k = F / (F + z2);
        return [ox + x1 * k * R, oy - y2 * k * R, z2];
      };
      ctx.clearRect(0, 0, W, H);
      // a dotted floor ring to stand on
      ctx.fillStyle = "rgba(255,244,230,0.12)";
      for (let i = 0; i < 90; i++) {
        const t = (i / 90) * Math.PI * 2;
        const q = proj(Math.cos(t) * 0.95, floor - 0.04, Math.sin(t) * 0.95);
        ctx.fillRect(q[0] - 0.8, q[1] - 0.8, 1.6, 1.6);
      }
      for (let i = 0; i < p.length; i += 3) {
        const q = proj(p[i], p[i + 1], p[i + 2]);
        const v = 0.5 - q[2] * 0.42; // nearer is brighter
        B[v < 0.2 ? 0 : v < 0.38 ? 1 : v < 0.56 ? 2 : v < 0.8 ? 3 : 4].push(q[0], q[1]);
      }
      const d = Math.max(1.5, Math.min(2.2, W / 360));
      for (let b = 0; b < 5; b++) {
        const L = B[b];
        ctx.fillStyle = COLS[b];
        for (let k = 0; k < L.length; k += 2) ctx.fillRect(L[k] - d / 2, L[k + 1] - d / 2, d, d);
        L.length = 0;
      }
      if (!reduceMotion || drag) raf = requestAnimationFrame(frame);
    }
    const kick = () => { if (!raf && alive) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    canvas.addEventListener("pointerdown", (e) => {
      drag = { x: e.clientX, y: e.clientY, t: performance.now() };
      canvas.setPointerCapture(e.pointerId);
      kick();
    });
    canvas.addEventListener("pointermove", (e) => {
      if (!drag) return;
      const now = performance.now(), dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      yaw += dx * 0.012;
      pitch = Math.max(-0.2, Math.min(1.1, pitch + dy * 0.008));
      spin = (dx * 0.012) / Math.max(0.016, (now - drag.t) / 1000);
      spin = Math.max(-6, Math.min(6, spin));
      drag = { x: e.clientX, y: e.clientY, t: now };
      if (reduceMotion) kick();
    });
    const end = () => { drag = null; };
    canvas.addEventListener("pointerup", end);
    canvas.addEventListener("pointercancel", end);
    size();
    if (reduceMotion) frame(performance.now()); else kick();
    const onResize = () => { size(); kick(); };
    window.addEventListener("resize", onResize);
    return {
      stop() { alive = false; cancelAnimationFrame(raf); raf = 0; window.removeEventListener("resize", onResize); },
      pause() { cancelAnimationFrame(raf); raf = 0; },
      resume() { size(); kick(); },
    };
  }
  return { mount };
})();
