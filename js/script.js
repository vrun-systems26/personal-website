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

// ---------- lidar scan (hero), the map it leaves (footer), and a small scene for each section ----------
(function () {
  const RANGE = 3.1;          // meters out to the rim
  const PERIOD = 8;           // seconds per sweep, slow on purpose
  const TRAIL = 0.8;          // radians of glow behind the beam

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

  const COLS = ["rgba(255,236,214,0.8)", "rgba(248,196,150,0.5)", "rgba(242,168,107,0.42)", "rgba(224,138,75,0.3)", "rgba(150,92,52,0.22)"];
  const ROW = 0.065; // meters between stacked dots on a wall

  function create(canvas) {
    const ctx = canvas.getContext("2d");
    const MAX = 3000;
    const FADE = PERIOD * 1.8;
    const hx = new Float32Array(MAX), hy = new Float32Array(MAX), ht = new Float32Array(MAX), hn = new Uint8Array(MAX);
    let head = 0, count = 0, total = 0;
    let W = 1, H = 1, R = 1, cx = 0, cy = 0, px = 1;
    let beam = 0, clock = 0, yaw = 0.5, tilt = 0.5, tiltT = 0.5, rx = 0, ry = 0;
    let raf = 0, visible = true, last = performance.now();
    const cursor = { on: false, x: 0, y: 0 };
    const dust = Array.from({ length: 46 }, () => [(Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6, Math.random() * 1.1, Math.random() * 6]);
    const B = [[], [], [], [], []];
    let sx = 0, sy = 0;

    function size() {
      const rc = canvas.getBoundingClientRect();
      W = Math.max(1, Math.round(rc.width)); H = Math.max(1, Math.round(rc.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      R = Math.max(1, W / 2 - 14);
      px = R / RANGE;
      cx = W / 2; cy = H * 0.5;
    }
    // world (meters, z up) to screen, viewed from above at an angle
    let st = Math.sin(tilt), ct = Math.cos(tilt), cyw = 1, syw = 0;
    function P(x, y, z) {
      const X = x - rx, Y = y - ry;
      const u = X * cyw - Y * syw, v = X * syw + Y * cyw;
      const k = 1 / (1 + v * 0.07);
      sx = cx + u * px * k; sy = cy - (v * st + z * ct) * px * k;
      return v;
    }

    function record(a) {
      const hit = cast(rx, ry, a, cursor.on ? [cursor.x, cursor.y, 0.17, 3] : null);
      if (!hit) return;
      const n = hit[0] + (Math.random() - 0.5) * 0.03;
      hx[head] = rx + Math.cos(a) * n; hy[head] = ry + Math.sin(a) * n; ht[head] = clock; hn[head] = hit[1];
      head = (head + 1) % MAX; count = Math.min(MAX, count + 1); total++;
    }
    function sweep(from, to) {
      const steps = Math.max(1, Math.ceil((to - from) / 0.005));
      for (let i = 1; i <= steps; i++) record(from + ((to - from) * i) / steps);
    }

    function draw(now) {
      if (W < 60) return; // hidden on small screens
      st = Math.sin(tilt); ct = Math.cos(tilt); cyw = Math.cos(yaw); syw = Math.sin(yaw);
      ctx.clearRect(0, 0, W, H);

      // the soft glow it all sits in
      ctx.save();
      ctx.translate(cx, cy); ctx.scale(1, st * 1.15);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 1.05);
      g.addColorStop(0, "rgba(242,168,107,0.26)");
      g.addColorStop(0.5, "rgba(242,168,107,0.08)");
      g.addColorStop(1, "rgba(242,168,107,0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, R * 1.05, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      // the rim: a brighter dotted edge with ticks every 15 degrees
      const rimN = Math.round((RANGE * px * 2 * Math.PI) / 2.8);
      for (let i = 0; i < rimN; i++) {
        const t = (i / rimN) * Math.PI * 2;
        const v = P(rx + Math.cos(t) * RANGE, ry + Math.sin(t) * RANGE, 0);
        ctx.fillStyle = `rgba(242,168,107,${0.22 - v * 0.04})`;
        ctx.fillRect(sx - 0.7, sy - 0.7, 1.4, 1.4);
      }
      ctx.fillStyle = "rgba(255,244,230,0.3)";
      for (let i = 0; i < 24; i++) {
        const t = (i / 24) * Math.PI * 2;
        for (let k = 1; k <= 2; k++) { P(rx + Math.cos(t) * (RANGE + k * 0.06), ry + Math.sin(t) * (RANGE + k * 0.06), 0); ctx.fillRect(sx - 0.6, sy - 0.6, 1.2, 1.2); }
      }
      // inner floor rings, in dots
      ctx.fillStyle = "rgba(255,244,230,0.12)";
      for (let k = 1; k <= 2; k++) {
        const rr = (RANGE * k) / 3, n = Math.round((rr * px) / 3.4);
        for (let i = 0; i < n; i++) {
          const t = (i / n) * Math.PI * 2;
          P(rx + Math.cos(t) * rr, ry + Math.sin(t) * rr, 0);
          ctx.fillRect(sx - 0.6, sy - 0.6, 1.2, 1.2);
        }
      }

      // the sweep: a fading wedge of light laid on the floor behind the beam
      for (let i = 0; i < 20; i++) {
        const a0 = beam - (TRAIL * i) / 20, a1 = beam - (TRAIL * (i + 1)) / 20;
        ctx.fillStyle = `rgba(242,168,107,${0.16 * (1 - i / 20)})`;
        ctx.beginPath();
        P(rx, ry, 0); ctx.moveTo(sx, sy);
        for (let j = 0; j <= 4; j++) { const a = a0 + ((a1 - a0) * j) / 4; P(rx + Math.cos(a) * RANGE, ry + Math.sin(a) * RANGE, 0); ctx.lineTo(sx, sy); }
        ctx.closePath(); ctx.fill();
      }

      // drifting dust
      for (const d of dust) {
        P(d[0] + rx, d[1] + ry, d[2] + 0.08 * Math.sin(now / 1400 + d[3]));
        ctx.fillStyle = `rgba(247,243,236,${0.12 + 0.1 * Math.sin(now / 900 + d[3])})`;
        ctx.fillRect(sx, sy, 1.1, 1.1);
      }

      // the point cloud: each hit stands up as a short column, hottest where the beam just passed
      for (let i = 0; i < count; i++) {
        const age = clock - ht[i];
        if (age > FADE || age < 0) continue;
        const f = age / FADE;
        const bk = f < 0.025 ? 0 : f < 0.1 ? 1 : f < 0.35 ? 2 : f < 0.65 ? 3 : 4;
        for (let z = 0; z < hn[i]; z++) {
          P(hx[i], hy[i], z * ROW);
          B[Math.min(4, bk + (z === 0 ? 1 : 0))].push(sx, sy);
        }
      }
      const dot = 1.7;
      ctx.globalCompositeOperation = "lighter";
      for (let b = 0; b < 5; b++) {
        const L = B[b];
        if (!L.length) continue;
        ctx.fillStyle = COLS[b];
        for (let k = 0; k < L.length; k += 2) ctx.fillRect(L[k] - dot / 2, L[k + 1] - dot / 2, dot, dot);
        L.length = 0;
      }
      ctx.globalCompositeOperation = "source-over";

      // Fetch in the middle, a little can of dots with the emitter on top
      P(rx, ry, 0.15);
      const halo = ctx.createRadialGradient(sx, sy, 0, sx, sy, 18);
      halo.addColorStop(0, "rgba(255,236,214,0.35)");
      halo.addColorStop(1, "rgba(242,168,107,0)");
      ctx.fillStyle = halo; ctx.fillRect(sx - 20, sy - 20, 40, 40);
      for (let z = 0; z <= 4; z++) {
        const n = 16;
        ctx.fillStyle = z === 4 ? "rgba(255,244,230,1)" : "rgba(242,168,107,0.95)";
        for (let i = 0; i < n; i++) {
          const t = (i / n) * Math.PI * 2;
          P(rx + Math.cos(t) * 0.18, ry + Math.sin(t) * 0.18, z * 0.08);
          ctx.fillRect(sx - 0.7, sy - 0.7, 1.4, 1.4);
        }
      }
      P(rx, ry, 0.34);
      const ex = sx, ey = sy;

      // the beam, out to whatever it is touching right now
      const hit = cast(rx, ry, beam, cursor.on ? [cursor.x, cursor.y, 0.17, 3] : null);
      const reach = hit ? hit[0] : RANGE;
      P(rx + Math.cos(beam) * reach, ry + Math.sin(beam) * reach, 0.16);
      const lg = ctx.createLinearGradient(ex, ey, sx, sy);
      lg.addColorStop(0, "rgba(255,244,230,0.9)");
      lg.addColorStop(1, "rgba(242,168,107,0.35)");
      ctx.strokeStyle = lg; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(sx, sy); ctx.stroke();
      if (hit) {
        const fl = ctx.createRadialGradient(sx, sy, 0, sx, sy, 9);
        fl.addColorStop(0, "rgba(255,244,230,0.95)");
        fl.addColorStop(1, "rgba(242,168,107,0)");
        ctx.fillStyle = fl; ctx.fillRect(sx - 10, sy - 10, 20, 20);
      }
      const pulse = 0.6 + 0.4 * Math.sin(now / 260);
      ctx.fillStyle = `rgba(255,244,230,${pulse})`;
      ctx.fillRect(ex - 1.3, ey - 1.3, 2.6, 2.6);

      ctx.font = '10px "Geist Mono", ui-monospace, monospace';
      ctx.fillStyle = "rgba(163,157,147,0.7)";
      ctx.textAlign = "right"; ctx.fillText(`lidar · mapping · ${total.toLocaleString("en-US")} pts`, W - 4, H - 6);
    }

    function tick(now) {
      raf = 0;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now; clock += dt;
      tilt += (tiltT - tilt) * 0.04;
      yaw += dt * (Math.PI * 2) / 110; // the whole view turns, very slowly
      const prev = beam;
      beam += (Math.PI * 2 * dt) / PERIOD;
      rx = 0.4 * Math.sin(clock * 0.045); ry = 0.3 * Math.sin(clock * 0.033 + 1);
      sweep(prev, beam);
      draw(now);
      if (visible) raf = requestAnimationFrame(tick);
    }
    const start = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } };

    size();
    // start mid-scan: lay down the last sweep and a half with the ages it would have had
    for (let a = beam - Math.PI * 3; a < beam; a += 0.005) { clock = -((beam - a) / (Math.PI * 2)) * PERIOD; record(a); }
    clock = 0;
    canvas.addEventListener("pointermove", (e) => {
      const rc = canvas.getBoundingClientRect();
      const x = e.clientX - rc.left - cx, y = e.clientY - rc.top - cy;
      const u = x / px, v = -y / (px * st);
      cursor.on = u * u + v * v < (RANGE - 0.2) * (RANGE - 0.2);
      cursor.x = rx + u * cyw + v * syw; cursor.y = ry - u * syw + v * cyw;
    });
    canvas.addEventListener("pointerleave", () => { cursor.on = false; });
    const hero = document.querySelector(".hero");
    if (hero) {
      hero.addEventListener("pointermove", (e) => {
        const rc = canvas.getBoundingClientRect();
        const ny = (e.clientY - (rc.top + rc.height / 2)) / window.innerHeight;
        tiltT = 0.5 + Math.max(-0.14, Math.min(0.2, -ny * 0.6));
      });
      hero.addEventListener("pointerleave", () => { tiltT = 0.5; });
    }
    if (reduceMotion) {
      draw(performance.now());
    } else {
      if ("IntersectionObserver" in window) {
        new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible) start(); }).observe(canvas);
      }
      start();
    }
    let rt = 0;
    window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { size(); if (reduceMotion) draw(performance.now()); }, 150); });
    return { total: () => total };
  }

  const heroCv = document.getElementById("scope");
  const hero = heroCv && heroCv.getContext ? create(heroCv) : null;

  // the footer keeps the running tally from the hero scan
  const pts = document.querySelector(".js-pts");
  if (pts) {
    const upd = () => { pts.textContent = (hero ? hero.total() : 0).toLocaleString("en-US"); };
    upd();
    if (hero && !reduceMotion) setInterval(upd, 1000);
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
      a.floor(2.4);
      const H = 0.95, r = 0.18;
      a.fill(a.circle(0, 0.001, 0, 0.4), a.cu(0.1));
      const rail = (k, y) => { const th = (k * TAU) / 3, f = 1 - (y / H) * 0.7; return [Math.cos(th) * r * f, y, Math.sin(th) * r * f]; };
      for (let k = 0; k < 3; k++) {
        a.line(rail(k, 0), rail(k, H), 0.7, 16);
        for (let y = 0; y < H - 0.14; y += 0.18) a.line(rail(k, y), rail((k + 1) % 3, y + 0.18), 0.34, 4);
      }
      const fronts = [];
      for (let i = 0; i < 3; i++) {
        const f = (t / 2.8 + i / 3) % 1, R = 0.25 + f * 2.15;
        fronts.push([R, 1 - f]);
        a.ring(0, H, 0, R, (1 - f) * 0.9);
        a.ring(0, 0.002, 0, R, (1 - f) * 0.25);
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
    }, { dust: 16, after: (t, a) => a.label("tx · 2.4 GHz", "4 nodes") }],

    // Work: a pair of gears in mesh, faces lit, teeth standing proud
    gears: [{ pitch: 0.52 }, (t, a) => {
      a.v.yaw = -0.3 + 0.18 * Math.sin(t * 0.22);
      a.floor(2.3, 2);
      const TH = 0.1;
      const gear = (cx, R, teeth, rot, hubR, spokes) => {
        const n = Math.round(R * 110), top = [], bot = [];
        for (let i = 0; i <= n; i++) {
          const th = (i / n) * TAU;
          const f = ((((th - rot) * teeth) / TAU) % 1 + 1) % 1;
          const rr = f < 0.5 ? R + 0.12 : R - 0.03;
          top.push([cx + Math.cos(th) * rr, TH, Math.sin(th) * rr]);
          bot.push([cx + Math.cos(th) * rr, -TH, Math.sin(th) * rr]);
        }
        a.fill(bot, a.cu(0.05));
        a.path(bot, 0.3, true, 3);
        a.fill(top, a.cu(0.13));
        a.path(top, 0.85, true, 2);
        for (let k = 0; k < teeth; k++) {
          const th = rot + ((k + 0.25) * TAU) / teeth;
          const x = cx + Math.cos(th) * (R + 0.12), z = Math.sin(th) * (R + 0.12);
          a.line([x, -TH, z], [x, TH, z], 0.55, 3);
        }
        a.fill(a.circle(cx, TH + 0.001, 0, hubR), "rgba(11,10,9,0.55)");
        a.ring(cx, TH, 0, hubR, 0.8);
        a.ring(cx, TH, 0, 0.07, 0.95);
        for (let k = 0; k < spokes; k++) {
          const th = rot + (k * TAU) / spokes;
          a.line([cx + Math.cos(th) * hubR, TH, Math.sin(th) * hubR], [cx + Math.cos(th) * (R - 0.14), TH, Math.sin(th) * (R - 0.14)], 0.5, 8);
        }
        a.line([cx, -0.5, 0], [cx, -TH, 0], 0.3, 5);
      };
      const rot = t * 0.45;
      const xa = -0.85, xb = -0.85 + 1.0 + 0.667 + 0.11;
      gear(xa, 1.0, 12, rot, 0.26, 5);
      gear(xb, 0.667, 8, -rot * 1.5, 0.18, 4);
      a.flare(xa + 1.06, TH, 0, 9, 0.35 + 0.15 * Math.sin(t * 3));
    }, { dust: 14, after: (t, a) => a.label("12 : 8", `${Math.round(0.45 / TAU * 60 * 10) / 10} rpm`) }],

    // Awards: a servo holding position, then sweeping; its horn leaves a fading wedge like the scan
    servo: [{ pitch: 0.42 }, (t, a) => {
      a.v.yaw = -0.6 + 0.3 * Math.sin(t * 0.28);
      a.floor(1.9, 2);
      a.box(-0.8, 0, -0.4, 0.8, 0.72, 0.4, 0.6, 0.12);
      a.box(-1.14, 0.5, -0.4, -0.8, 0.58, 0.4, 0.45, 0.08);
      a.box(0.8, 0.5, -0.4, 1.14, 0.58, 0.4, 0.45, 0.08);
      a.fill([[-0.55, 0.12, 0.401], [0.55, 0.12, 0.401], [0.55, 0.5, 0.401], [-0.55, 0.5, 0.401]], a.cu(0.09));
      a.ring(-0.97, 0.58, 0, 0.06, 0.55); a.ring(0.97, 0.58, 0, 0.06, 0.55);
      a.ring(-0.4, 0.72, 0, 0.17, 0.75);
      const ang = (s) => -Math.PI / 2 + 1.05 * Math.sin(s * 1.1);
      const o = [-0.4, 0.88, 0], L = 1.05, now = ang(t);
      // the sweep wedge behind the horn
      for (let k = 1; k <= 10; k++) {
        const a0 = ang(t - (k - 1) * 0.05), a1 = ang(t - k * 0.05);
        a.fill([o, [o[0] + Math.cos(a0) * L, 0.88, Math.sin(a0) * L], [o[0] + Math.cos(a1) * L, 0.88, Math.sin(a1) * L]], a.cu(0.16 * (1 - k / 11)));
      }
      const dx = Math.cos(now), dz = Math.sin(now), nx = -dz, nz = dx;
      const hornPts = [
        [o[0] + nx * 0.12, 0.88, o[2] + nz * 0.12], [o[0] + dx * L + nx * 0.07, 0.88, o[2] + dz * L + nz * 0.07],
        [o[0] + dx * (L + 0.07), 0.88, o[2] + dz * (L + 0.07)],
        [o[0] + dx * L - nx * 0.07, 0.88, o[2] + dz * L - nz * 0.07], [o[0] - nx * 0.12, 0.88, o[2] - nz * 0.12],
      ];
      a.fill(hornPts, a.cu(0.3));
      a.path(hornPts, 0.9, true, 1);
      for (let k = 1; k <= 4; k++) a.dot(o[0] + dx * 0.23 * k, 0.881, o[2] + dz * 0.23 * k, 1);
      a.flare(o[0], 0.9, o[2], 8, 0.5);
      for (let w = 0; w < 3; w++) {
        const pts = [];
        for (let i = 0; i <= 12; i++) { const s = i / 12; pts.push([0.8 + s * 0.7, 0.16 - s * 0.14 + w * 0.05, s * s * 0.55 - 0.05 + w * 0.02]); }
        a.path(pts, 0.35, false, 3);
      }
    }, {
      dust: 12,
      after: (t, a) => {
        const s = Math.sin(t * 1.1), ms = (1.5 + 0.5 * s).toFixed(2), deg = Math.round(s * 60);
        a.label(`pwm ${ms} ms`, `${deg > 0 ? "+" : ""}${deg}°`);
      },
    }],

    // Stack: a printer laying a vase down one layer at a time
    printer: [{ pitch: 0.34 }, (t, a) => {
      a.v.yaw = 0.4 + t * 0.1;
      a.floor(1.7, 2);
      a.fill([[-1.05, 0, -1.05], [1.05, 0, -1.05], [1.05, 0, 1.05], [-1.05, 0, 1.05]], a.cu(0.06));
      for (let x = -1; x <= 1.001; x += 0.25) for (let z = -1; z <= 1.001; z += 0.25) a.dot(x, 0, z, 0.16);
      a.path([[-1.05, 0, -1.05], [1.05, 0, -1.05], [1.05, 0, 1.05], [-1.05, 0, 1.05]], 0.4, true, 4);
      const L = 16, CYCLE = 12, u = t % CYCLE;
      const p = Math.min(1, u / 10) * L, done = Math.floor(p), frac = p - done;
      const fade = u > 11.2 ? 1 - (u - 11.2) / 0.8 : 1;
      const rad = (y) => 0.42 + 0.14 * Math.sin(y * 4.6 + 0.6);
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
      a.line([-1.25, top + 0.19, nz], [1.25, top + 0.19, nz], 0.35, 20);
      a.line([-1.25, 0, 0], [-1.25, 1.45, 0], 0.28, 14);
      a.line([1.25, 0, 0], [1.25, 1.45, 0], 0.28, 14);
    }, {
      dust: 12,
      after: (t, a) => {
        const u = t % 12, layer = Math.min(16, Math.floor(Math.min(1, u / 10) * 16) + 1);
        a.label(`layer ${String(layer).padStart(2, "0")}/16`, "215°C");
      },
    }],

    // Commits: activity rolling back into depth, the newest row lit and filled
    waterfall: [{ pitch: 0.5 }, (t, a) => {
      a.v.yaw = -0.3;
      const ROWS = 11, GAP = 0.3, scroll = t * 0.4, base = Math.floor(scroll), frac = scroll - base;
      const wave = (id, x) => {
        let y = 0.04 * Math.sin(3 * x + id);
        for (let j = 0; j < 3; j++) {
          const c = hash(id * 7 + j) * 4.6 - 2.3, h = 0.15 + 0.6 * hash(id * 13 + j);
          y += h * Math.exp(-(((x - c) / 0.16) ** 2));
        }
        return y;
      };
      for (let k = ROWS - 1; k >= 0; k--) {
        const id = base - k, d = k + frac, z = d * GAP - 1.4;
        let b = 0.95 * (1 - d / ROWS);
        if (k === 0) b *= Math.min(1, frac * 4);
        const pts = [];
        for (let x = -2.6; x <= 2.601; x += 0.05) pts.push([x, wave(id, x), z]);
        if (k <= 1) a.fill([[-2.6, 0, z], ...pts, [2.6, 0, z]], a.cu(0.1 * b));
        a.path(pts, b, false, k <= 1 ? 1 : 2);
        if (k === 1) for (let j = 0; j < 3; j++) { const c = hash(id * 7 + j) * 4.6 - 2.3; a.flare(c, wave(id, c), z, 7, 0.35 * b); }
      }
    }, { dust: 10, after: (t, a) => a.label("commits / day", "live") }],

    // Contact: a sonar dome pinging the floor; whatever the ring touches lights up and pings back
    sonar: [{ pitch: 0.6 }, (t, a) => {
      a.v.yaw = t * 0.09;
      a.floor(2.4);
      const fronts = [];
      for (let i = 0; i < 3; i++) {
        const f = (t / 3.4 + i / 3) % 1, R = 0.35 + f * 2.05;
        fronts.push([R, 1 - f]);
        const inner = a.circle(0, 0.004, 0, Math.max(0.3, R - 0.16)).reverse();
        a.fill(a.circle(0, 0.004, 0, R).concat(inner), a.cu(0.07 * (1 - f)));
        a.ring(0, 0.006, 0, R, (1 - f) * 0.95);
      }
      [[1.5, 0.8, 0.26, 0.3], [-1.3, 1.0, 0.2, 0.5], [0.3, -1.6, 0.24, 0.24], [-1.1, -1.1, 0.16, 0.36]].forEach(([x, z, s, h], i) => {
        const g = litBy(fronts, Math.hypot(x, z), 0.26);
        a.box(x - s / 2, 0, z - s / 2, x + s / 2, h, z + s / 2, 0.3 + 0.65 * g, 0.05 + 0.22 * g);
        if (g > 0.3) { a.flare(x, h, z, 8, g * 0.7); a.ring(x, 0.004, z, 0.2 + (1 - g) * 0.45, g * 0.6); }
      });
      const dome = [];
      for (let i = 0; i <= 24; i++) { const th = (i / 24) * Math.PI; dome.push([Math.cos(th) * 0.3, Math.sin(th) * 0.3, 0]); }
      a.fill(a.circle(0, 0.003, 0, 0.3), a.cu(0.14));
      for (let k = 0; k < 6; k++) {
        const yaw = (k / 6) * Math.PI;
        a.path(dome.map(([x, y]) => [x * Math.cos(yaw), y, x * Math.sin(yaw)]), 0.55, false, 2);
      }
      a.flare(0, 0.34, 0, 11, 0.5 + 0.3 * Math.sin(t * 4));
      a.dot(0, 0.34, 0, 1);
    }, { dust: 18, after: (t, a) => a.label("sonar · 40 kHz", "4 contacts") }],

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
        else a.dot(x + CELL * 0.4, 0, z + CELL * 0.4, 0.16);
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
