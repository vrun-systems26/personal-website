// =========================================================
// Varun Chilukuri — portfolio interactions
// =========================================================

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- year + drawing revision ----------
(function () {
  const now = new Date();
  document.querySelectorAll(".js-year").forEach((el) => (el.textContent = now.getFullYear()));
  document.querySelectorAll(".js-rev").forEach((el) => {
    el.textContent = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
})();

// ---------- local clock (San Jose) ----------
(function () {
  const el = document.getElementById("clock");
  if (!el) return;
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const tick = () => (el.textContent = fmt.format(new Date()));
  tick();
  setInterval(tick, 15000);
})();

// ---------- top bar hairline once you leave the top ----------
(function () {
  const bar = document.getElementById("topbar");
  if (!bar) return;
  const onScroll = () => bar.classList.toggle("is-scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
})();

// ---------- scroll reveals ----------
(function () {
  const items = document.querySelectorAll(".reveal");
  // grid children come in one after another rather than all at once
  document.querySelectorAll(".stack .cell, .builds .build").forEach((el, i, list) => {
    const siblings = Array.from(el.parentElement.children);
    el.style.setProperty("--stagger", `${siblings.indexOf(el) * 70}ms`);
  });
  if (reduceMotion || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.05, rootMargin: "0px 0px 8% 0px" }
  );
  items.forEach((el) => io.observe(el));
})();

// ---------- scrollspy: nav, section index numbers, project list ----------
(function () {
  if (!("IntersectionObserver" in window)) return;
  const navLinks = document.querySelectorAll(".nav a[data-spy]");
  const sections = document.querySelectorAll(".sec[id]");
  const sectionIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        sections.forEach((s) => s.classList.toggle("is-current", s === entry.target));
        navLinks.forEach((a) => a.classList.toggle("is-active", a.dataset.spy === id));
      });
    },
    { rootMargin: "-40% 0px -55% 0px" }
  );
  sections.forEach((s) => sectionIO.observe(s));

  const tocLinks = document.querySelectorAll(".sec-toc a[data-proj]");
  const projIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        tocLinks.forEach((a) => a.classList.toggle("is-active", a.dataset.proj === entry.target.id));
      });
    },
    { rootMargin: "-35% 0px -60% 0px" }
  );
  document.querySelectorAll(".proj[id]").forEach((p) => projIO.observe(p));
})();

// ---------- stat counters ----------
(function () {
  const counts = document.querySelectorAll(".count[data-to]");
  if (!counts.length) return;
  const run = (el) => {
    if (reduceMotion) { el.textContent = el.dataset.to; el.dataset.done = "1"; return; }
    const start = performance.now();
    const dur = 1300;
    const step = (t) => {
      // read the target every frame, so a live number arriving mid-count still lands
      const to = +el.dataset.to;
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(to * eased);
      if (p < 1) requestAnimationFrame(step);
      else el.dataset.done = "1";
    };
    requestAnimationFrame(step);
  };
  if (!("IntersectionObserver" in window)) { counts.forEach(run); return; }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          run(entry.target);
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.6 }
  );
  counts.forEach((el) => io.observe(el));
})();

// ---------- the name field: type set in dots, each one on a spring ----------
(function () {
  const wrap = document.querySelector(".field");
  const canvas = document.getElementById("field");
  const nodesOut = document.getElementById("fNodes");
  if (!wrap || !canvas || !canvas.getContext) return;
  const ctx = canvas.getContext("2d");

  const WORD = "VARUN";
  const K = 0.055;        // spring stiffness pulling each dot home
  const DAMP = 0.86;      // velocity kept per frame
  const PUSH = 3.4;       // how hard the cursor shoves
  let W = 0, H = 0, dpr = 1, gap = 6, radius = 110;
  let pts = [];           // flat arrays for speed
  let hx, hy, x, y, vx, vy;
  const pointer = { x: -9999, y: -9999, active: false, last: 0 };
  let running = false, visible = true, raf = 0, t0 = performance.now();

  function build() {
    const rect = canvas.getBoundingClientRect();
    W = Math.max(1, Math.round(rect.width));
    H = Math.max(1, Math.round(rect.height));
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    gap = W > 1100 ? 6 : W > 700 ? 5 : 4;
    radius = Math.max(70, Math.min(140, W * 0.1));

    // rasterize the word offscreen, then sample it on a grid
    const off = document.createElement("canvas");
    off.width = W; off.height = H;
    const o = off.getContext("2d");
    let fs = H * 1.3;
    o.font = `800 ${fs}px "Schibsted Grotesk", sans-serif`;
    let m = o.measureText(WORD);
    const inkW = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
    const inkH = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
    const scale = Math.min((W * 0.995) / inkW, (H * 0.96) / inkH);
    fs *= scale;
    o.font = `800 ${fs}px "Schibsted Grotesk", sans-serif`;
    m = o.measureText(WORD);
    const asc = m.actualBoundingBoxAscent, desc = m.actualBoundingBoxDescent;
    o.fillStyle = "#fff";
    o.fillText(WORD, m.actualBoundingBoxLeft, (H - (asc + desc)) / 2 + asc);

    const data = o.getImageData(0, 0, W, H).data;
    const homes = [];
    for (let py = Math.floor(gap / 2); py < H; py += gap) {
      for (let px = Math.floor(gap / 2); px < W; px += gap) {
        if (data[(py * W + px) * 4 + 3] > 140) homes.push(px, py);
      }
    }
    const n = homes.length / 2;
    hx = new Float32Array(n); hy = new Float32Array(n);
    x = new Float32Array(n); y = new Float32Array(n);
    vx = new Float32Array(n); vy = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      hx[i] = homes[i * 2];
      hy[i] = homes[i * 2 + 1];
      if (reduceMotion) {
        x[i] = hx[i]; y[i] = hy[i];
      } else {
        // start loosely scattered, then spring into the letters
        x[i] = hx[i] + (Math.random() - 0.5) * 70;
        y[i] = hy[i] + 30 + Math.random() * 90;
      }
    }
    pts = { n };
    if (nodesOut) nodesOut.textContent = n.toLocaleString();
    wrap.classList.add("is-live");
  }

  // four colour buckets from resting cream to hot copper
  const COLORS = [
    "rgba(236, 230, 216, 0.92)",
    "rgba(240, 206, 170, 0.95)",
    "rgba(243, 170, 110, 1)",
    "rgba(224, 138, 75, 1)",
  ];
  const buckets = [[], [], [], []];

  function frame(now) {
    raf = 0;
    const n = pts.n || 0;
    const size = Math.max(1.6, gap * 0.42);
    const R2 = radius * radius;

    // with no one moving through it, a ghost cursor keeps it breathing
    let mx = pointer.x, my = pointer.y;
    if (!pointer.active || now - pointer.last > 2600) {
      const t = (now - t0) / 1000;
      mx = W * (0.5 + 0.46 * Math.sin(t * 0.42));
      my = H * (0.5 + 0.42 * Math.sin(t * 0.97 + 1.2));
    }

    let energy = 0;
    buckets[0].length = buckets[1].length = buckets[2].length = buckets[3].length = 0;
    for (let i = 0; i < n; i++) {
      const dx = x[i] - mx, dy = y[i] - my;
      const d2 = dx * dx + dy * dy;
      if (d2 < R2 && d2 > 0.01) {
        const d = Math.sqrt(d2);
        const f = (1 - d / radius) * PUSH;
        vx[i] += (dx / d) * f;
        vy[i] += (dy / d) * f;
      }
      vx[i] = (vx[i] + (hx[i] - x[i]) * K) * DAMP;
      vy[i] = (vy[i] + (hy[i] - y[i]) * K) * DAMP;
      x[i] += vx[i];
      y[i] += vy[i];
      const ox = x[i] - hx[i], oy = y[i] - hy[i];
      const disp = ox * ox + oy * oy;
      energy += vx[i] * vx[i] + vy[i] * vy[i];
      buckets[disp < 4 ? 0 : disp < 60 ? 1 : disp < 260 ? 2 : 3].push(i);
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

    if (visible && running) raf = requestAnimationFrame(frame);
  }

  function start() {
    if (reduceMotion) { frame(performance.now()); return; }
    running = true;
    if (!raf) raf = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  window.addEventListener(
    "pointermove",
    (e) => {
      const r = canvas.getBoundingClientRect();
      const px = e.clientX - r.left, py = e.clientY - r.top;
      const inside = px > -radius && px < r.width + radius && py > -radius && py < r.height + radius;
      pointer.active = inside;
      if (inside) {
        pointer.x = px;
        pointer.y = py;
        pointer.last = performance.now();
      }
    },
    { passive: true }
  );
  canvas.addEventListener("pointerleave", () => (pointer.active = false));

  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      if (visible) start(); else stop();
    }).observe(canvas);
  }

  let resizeT = 0;
  window.addEventListener("resize", () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => { build(); start(); }, 180);
  });

  const fontReady = document.fonts && document.fonts.load
    ? document.fonts.load('800 100px "Schibsted Grotesk"').catch(() => {})
    : Promise.resolve();
  fontReady.then(() => {
    build();
    start();
  });
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

// ---------- commit heatmap: live from GitHub, saved snapshot as fallback ----------
(function () {
  const grid = document.getElementById("heatGrid");
  const months = document.getElementById("heatMonths");
  const tip = document.getElementById("heatTip");
  const totalOut = document.getElementById("actTotal");
  if (!grid || !months) return;

  const LIVE = "https://github-contributions-api.jogruber.de/v4/vrun-systems26?y=last";
  const SNAPSHOT = "data/contributions.json";
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const ordinal = (n) => {
    const s = ["th", "st", "nd", "rd"], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  function render(data) {
    const days = (data && data.contributions) || [];
    if (!days.length) return;
    if (data.total) {
      const t = data.total.lastYear ?? Object.values(data.total)[0];
      if (t != null) {
        if (totalOut) totalOut.textContent = t;
        const stat = document.getElementById("statCommits");
        if (stat) {
          stat.dataset.to = t;
          if (stat.dataset.done) stat.textContent = t;
        }
      }
    }
    grid.innerHTML = "";
    months.innerHTML = "";

    // pad the first column so every row is the same weekday (Sunday on top)
    const first = new Date(days[0].date + "T12:00:00");
    const pad = first.getDay();
    for (let i = 0; i < pad; i++) {
      const c = document.createElement("i");
      c.className = "is-pad";
      grid.appendChild(c);
    }
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

  const get = (url) => fetch(url, { cache: "no-store" }).then((r) => {
    if (!r.ok) throw new Error(r.status);
    return r.json();
  });
  get(LIVE).then(render).catch(() => get(SNAPSHOT).then(render).catch(() => {}));
})();

// ---------- signature writes itself as you scroll to it ----------
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

  // main word takes the first 80% of the run, the underline the rest
  const spans = [[0, 0.8], [0.8, 1]];
  let ticking = false;
  const update = () => {
    ticking = false;
    const r = sig.getBoundingClientRect();
    const vh = window.innerHeight;
    const p = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.32)));
    strokes.forEach((path, i) => {
      const [a, b] = spans[i] || [0, 1];
      const local = Math.min(1, Math.max(0, (p - a) / (b - a)));
      path.style.strokeDashoffset = lens[i] * (1 - local);
    });
  };
  window.addEventListener("scroll", () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  update();
})();
