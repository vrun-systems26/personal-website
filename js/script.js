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
  sheet.addEventListener("close", cleanup);
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
