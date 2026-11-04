// =========================================================
// Varun Chilukuri, portfolio
// pictures made of dust, with a 3D gear train to open
// =========================================================

const S = (() => {
  const P = SITE.projects, B = SITE.builds, TAU = Math.PI * 2;
  const img = (s) => s;
  const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  const icon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg>';
  const isBuild = (id) => B.items.some((i) => i.to === id);
  const parent = (id) => (isBuild(id) ? "builds" : "index");
  const href = (id) => {
    if (id === "index") return "#/";
    const b = B.items.find((i) => i.to === id);
    return b ? b.href : "#/" + id;
  };
  const titleOf = (id) => (P[id] ? P[id].title : SITE[id] ? SITE[id].title : SITE.name.join(" "));
  const rawTitle = (id) => (P[id] ? P[id].rawTitle : esc(titleOf(id)));
  const ids = () => [...SITE.nav[0].map((n) => n.to), ...B.items.map((i) => i.to)];

  const gallery = (p) => `<figure class="gallery">
    <img class="main" src="${img(p.images[0].src)}" alt="${esc(p.images[0].alt)}">
    ${p.images.length > 1 ? `<div class="thumbs">${p.images.map((m, i) => `<button type="button" aria-pressed="${i === 0}" aria-label="Photo ${i + 1}"><img src="${img(m.src)}" alt="${esc(m.alt)}" loading="lazy"></button>`).join("")}</div>` : ""}
  </figure>`;
  const meta = (p) => `<p class="meta">${esc(p.meta)}</p>`;
  const text = (p) => p.body.map((b) => `<p class="body">${esc(b)}</p>`).join("");
  const spec = (p) => (p.spec.length ? `<dl class="spec">${p.spec.map(([a, b]) => `<div><dt>${esc(a)}</dt><dd>${esc(b)}</dd></div>`).join("")}</dl>` : "");
  const out = (p) => (p.out.length ? `<p class="out">${p.out.map((o) => `<a href="${o.href}">${esc(o.label)}</a>`).join("")}</p>` : "");
  const project = (id) => { const p = P[id]; return meta(p) + gallery(p) + text(p) + spec(p) + out(p); };
  const buildsList = () => `<nav class="list" aria-label="${esc(B.title)}">${B.items.map((i) => `<a href="${i.href}" data-to="${i.to}">${esc(i.label)}</a>`).join("")}</nav>`;
  const awards = () => `<ol class="awards">${SITE.awards.items.map((a) => `<li><span class="place${a.first ? " is-first" : ""}">${esc(a.place)}</span><div><b>${esc(a.title)}</b><span class="sub">${esc(a.sub)}</span></div></li>`).join("")}</ol>`;
  const notes = () => `<ul class="notes">${SITE.now.items.map((n) => `<li><b>${n.href ? `<a class="ext" href="${n.href}">${esc(n.title)} ↗</a>` : esc(n.title)}</b><span class="sub">${esc(n.sub)}</span></li>`).join("")}</ul>`;
  const bodyOf = (id) => (id === "builds" ? buildsList() : id === "awards" ? awards() : id === "now" ? notes() : project(id));
  const closeLink = (id) => `<a class="close" href="${href(parent(id))}" aria-label="Close ${esc(titleOf(id))}">${icon}</a>`;
  const detail = (id) => `<header class="pane-head"><h2 tabindex="-1">${rawTitle(id)}</h2>${closeLink(id)}</header>${bodyOf(id)}`;
  const name = () => `<span>${esc(SITE.name[0])}</span> <em>${esc(SITE.name[1])}</em>`;
  const nav = () => SITE.nav.map((g) => `<nav class="list">${g.map((n) => `<a href="${n.href}" data-to="${n.to}">${esc(n.label)}</a>`).join("")}</nav>`).join("");
  const links = () => `<nav class="links" aria-label="Elsewhere">${SITE.links.map((l) => `<a href="${l.href}">${esc(l.label)}</a>`).join("")}${SITE.copies.map((c) => `<button type="button" data-copy="${c.copy}" data-done="${esc(c.done)}">${esc(c.label)}</button>`).join("")}</nav>`;
  const soundBtn = () => `<button type="button" class="sound" aria-pressed="false" aria-label="Sound on"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 9.5h3l4.5-4v13l-4.5-4h-3z"/></svg><span class="bars" aria-hidden="true"><i></i><i></i><i></i></span></button>`;
  const credit = () => `<a class="now" href="${SITE.credit.href}" hidden>${esc(SITE.credit.label)}</a><p class="sound-note" role="status" hidden></p>`;
  const foot = () => `<div class="foot-row">${links()}${soundBtn()}</div>${credit()}`;

  // the open page comes from the address, so links, back and forward all just work
  const current = () => { const k = location.hash.replace(/^#\/?/, "").replace(/\/$/, "").split("/").pop(); return k && (P[k] || (k === "builds" || k === "now" || k === "awards")) ? k : "index"; };
  function router(fn) {
    const run = () => {
      const id = current();
      document.querySelectorAll("a[data-to]").forEach((a) => {
        const on = a.dataset.to === id || (a.dataset.to === "builds" && isBuild(id));
        a.classList.toggle("is-open", on);
        if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
      });
      document.title = id === "index" ? SITE.name.join(" ") : `${titleOf(id)} · ${SITE.name.join(" ")}`;
      fn(id);
    };
    window.addEventListener("hashchange", run);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && current() !== "index") location.hash = href(parent(current())); });
    run();
  }
  // a modal sheet for versions that open details over the page
  function sheet(onOpen) {
    const d = document.createElement("dialog");
    d.className = "sheet";
    d.innerHTML = '<div class="sheet-in"></div>';
    document.body.appendChild(d);
    d.addEventListener("cancel", (e) => { e.preventDefault(); location.hash = href(parent(current())); });
    d.addEventListener("click", (e) => { if (e.target === d) location.hash = href(parent(current())); });
    router((id) => {
      if (id === "index") { if (d.open) d.close(); return; }
      const inner = d.firstChild;
      inner.innerHTML = detail(id);
      if (!d.open) d.showModal();
      inner.scrollTop = 0; d.scrollTop = 0;
      inner.querySelector("h2").focus({ preventScroll: true });
      if (onOpen) onOpen(id, inner);
    });
  }

  // tap a thumbnail to see it large (works for anything on the page, whenever it was drawn)
  document.addEventListener("click", (e) => {
    const b = e.target.closest && e.target.closest(".thumbs button");
    if (!b) return;
    const g = b.closest(".gallery"), m = g.querySelector(".main"), i = b.querySelector("img");
    m.src = i.getAttribute("src"); m.alt = i.alt;
    g.querySelectorAll(".thumbs button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    g.dispatchEvent(new CustomEvent("photo", { bubbles: true, detail: i.getAttribute("src") }));
  });

  document.addEventListener("click", (e) => {
    const a = e.target.closest && e.target.closest('a[href^="http"]');
    if (a) { a.target = "_blank"; a.rel = "noopener"; }
  }, true);

  // copy email / discord, with a short note
  let toastEl = null, tm = 0;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement("div"); toastEl.className = "toast"; toastEl.setAttribute("role", "status"); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add("is-on");
    clearTimeout(tm); tm = setTimeout(() => toastEl.classList.remove("is-on"), 2200);
  }
  document.addEventListener("click", async (e) => {
    const b = e.target.closest && e.target.closest("[data-copy]");
    if (!b) return;
    try { await navigator.clipboard.writeText(b.dataset.copy); } catch (err) {
      const t = document.createElement("textarea"); t.value = b.dataset.copy; document.body.appendChild(t); t.select();
      try { document.execCommand("copy"); } catch (e2) { /* nothing more to try */ }
      t.remove();
    }
    toast(b.dataset.done);
  });

  return { P, B, TAU, img, esc, icon, ids, href, parent, isBuild, titleOf, rawTitle, gallery, meta, text, spec, out, project, buildsList, awards, notes, bodyOf, closeLink, detail, name, nav, links, soundBtn, credit, foot, current, router, sheet, toast };
})();

// ---------- the page ----------
const deck = document.getElementById("deck"), cv = document.getElementById("c"), x = cv.getContext("2d");
deck.innerHTML = `<aside class="side card" id="s"><h1 class="name">${S.name()}</h1><p class="bio">${S.esc(SITE.bio)}</p>${S.nav()}<div class="foot"><div class="foot-row">${S.links()}<div class="ctl"><button type="button" class="theme" aria-label="Switch background"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 3.8a8.2 8.2 0 0 1 0 16.4z" fill="currentColor"/></svg></button>${S.soundBtn()}</div></div>${S.credit()}</div></aside><section class="pop card" id="stack" hidden></section><section class="pop card" id="pop" hidden></section>`;
const pop = document.getElementById("pop"), stack = document.getElementById("stack");
const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
const phone = () => innerWidth < 1100;   // below this the graphic gets its own section on top, with cards under it

// ---------- the dots ----------
const CAP = Math.min(250000, Math.round(Math.max(phone() ? 56000 : 115000, innerWidth * innerHeight * (phone() ? 0.17 : 0.16))));
let M = CAP;                                                 // how many are live; drops on slow machines
const px = new Float32Array(CAP), py = new Float32Array(CAP), vx = new Float32Array(CAP), vy = new Float32Array(CAP), hx = new Float32Array(CAP), hy = new Float32Array(CAP), dl = new Float32Array(CAP);
const cr = new Float32Array(CAP), cg = new Float32Array(CAP), cb = new Float32Array(CAP), tr = new Float32Array(CAP), tg = new Float32Array(CAP), tb = new Float32Array(CAP);
const big = new Uint8Array(CAP), grp = new Uint8Array(CAP), hid = new Uint8Array(CAP);
let bw = 1, bh = 1, dpr = 1, image, d32, box = { x: 0, y: 0, w: 1, h: 1 }, t0 = 0, ct0 = 0, mode = 2, spin = null, last = null, lastRaw = null;
const hexRGB = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

// the background: black, or the warm paper. dots re-ink themselves to stay readable on either
let paper = false;
try { paper = localStorage.getItem("vc-bg") === "paper"; } catch (e) { /* private mode */ }
function ink(r, g, b, out) {
  const gr = (r + g + b) / 3; r = gr + (r - gr) * 1.55; g = gr + (g - gr) * 1.55; b = gr + (b - gr) * 1.55;
  const m = Math.max(r, g, b, 1);
  const k = paper ? Math.min(1, 118 / m) : (m < 190 ? 190 / m : 255 / Math.max(m, 255));
  out[0] = Math.max(0, Math.min(255, r * k)); out[1] = Math.max(0, Math.min(255, g * k)); out[2] = Math.max(0, Math.min(255, b * k));
}
function paintTheme() {
  document.documentElement.dataset.bg = paper ? "paper" : "black";
  const meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.content = paper ? "#ebe4d4" : "#050505";
  document.querySelector('meta[name="color-scheme"]').content = paper ? "light" : "dark";
}
function setAccent(id) { document.documentElement.style.setProperty("--ac", (SITE.palette[id] || SITE.palette.index).accent); }
function recolor() {
  const o = [0, 0, 0];
  if (!lastRaw) return;
  for (let i = 0; i < CAP; i++) { const j = i * 3; ink(lastRaw[j], lastRaw[j + 1], lastRaw[j + 2], o); tr[i] = o[0]; tg[i] = o[1]; tb[i] = o[2]; }
  ct0 = performance.now();
}

function size() {
  dpr = Math.min(devicePixelRatio || 1, 2);
  // a tab loading in the background can report no size yet; never let that stop the page
  const W = cv.clientWidth || innerWidth || 800, H = cv.clientHeight || innerHeight || 600;
  bw = Math.max(1, Math.round(W * dpr)); bh = Math.max(1, Math.round(H * dpr)); cv.width = bw; cv.height = bh;
  image = x.createImageData(bw, bh); d32 = new Uint32Array(image.data.buffer);
}
// where a picture goes: fitted whole inside the space that belongs to the graphic, never under the text
function freeSpace() {
  const W = cv.clientWidth || innerWidth || 800, H = cv.clientHeight || innerHeight || 600;
  if (phone()) return { l: 10, r: W - 10, t: 10, b: H - 10 };
  const panel = document.body.classList.contains("is-open") ? pop : document.getElementById("s"), info = panel.offsetLeft + panel.offsetWidth;   // layout position, unaffected by the slide-in
  return { l: info + 28, r: W - 28, t: 28, b: H - 28 };
}
function photoBox(aspect) {
  const f = freeSpace(), aw = f.r - f.l, ah = f.b - f.t, w = Math.min(aw, ah * aspect), h = w / aspect;
  box = { x: (f.l + (aw - w) / 2) * dpr, y: (f.t + (ah - h) / 2) * dpr, w: w * dpr, h: h * dpr };
}
const deckTop = () => parseFloat(getComputedStyle(deck).paddingTop) || 300;

// a picture becomes dots: they gather on edges and colour, thinning out toward the edges of the picture
function sample(draw, ramp) {
  const cw = Math.min(1200, Math.round(box.w)), ch = Math.round(cw * (box.h / box.w));
  const c = document.createElement("canvas"); c.width = cw; c.height = ch;
  const o = c.getContext("2d", { willReadFrequently: true });
  o.fillStyle = "#000"; o.fillRect(0, 0, cw, ch); draw(o, cw, ch);
  const d = o.getImageData(0, 0, cw, ch).data, L = new Float32Array(cw * ch), B = new Float32Array(cw * ch);
  let lo = 1, hi = 0;
  for (let i = 0; i < L.length; i++) { const v = (d[i * 4] * 0.3 + d[i * 4 + 1] * 0.59 + d[i * 4 + 2] * 0.11) / 255; L[i] = v; if (v < lo) lo = v; if (v > hi) hi = v; }
  for (let v = 1; v < ch - 1; v++) for (let u = 1; u < cw - 1; u++) { const i = v * cw + u; B[i] = (L[i] * 4 + (L[i - 1] + L[i + 1] + L[i - cw] + L[i + cw]) * 2 + L[i - cw - 1] + L[i - cw + 1] + L[i + cw - 1] + L[i + cw + 1]) / 16; }
  const span = Math.max(0.05, hi - lo), pos = new Float32Array(CAP * 3), raw = new Float32Array(CAP * 3);
  let n = 0, tries = 0;
  while (n < CAP && tries < CAP * 60) {
    tries++;
    const u = 1 + (Math.random() * (cw - 4)) | 0, v = 1 + (Math.random() * (ch - 4)) | 0, i = v * cw + u;
    const l = (L[i] - lo) / span, e = Math.abs(B[i] - B[i + 2]) + Math.abs(B[i] - B[i + cw * 2]);
    const a = Math.max(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]), b0 = Math.min(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]), sat = a ? (a - b0) / a : 0;
    if (ramp) { if (Math.random() > 0.34 * Math.pow(l, 1.7) + Math.min(1, e * 7) * 0.85) continue; }
    else {
      const edge = Math.min(u, cw - u, v, ch - v) / cw, fall = Math.min(1, 0.55 + edge / 0.012);
      if (Math.random() > fall * (0.03 + 0.2 * Math.pow(l, 1.25) + Math.min(1, e * 9) * 0.9 + Math.pow(sat, 1.4) * 0.5 * (0.35 + l))) continue;
    }
    let r = d[i * 4], g = d[i * 4 + 1], bl = d[i * 4 + 2];
    if (ramp) { const t = Math.min(1, (u / cw) * 0.6 + Math.random() * 0.4), p = ramp[t < 0.5 ? 0 : 1], q = ramp[t < 0.5 ? 1 : 2], f = t < 0.5 ? t * 2 : t * 2 - 1; r = p[0] + (q[0] - p[0]) * f; g = p[1] + (q[1] - p[1]) * f; bl = p[2] + (q[2] - p[2]) * f; }
    const j = n * 3;
    pos[j] = (u + Math.random()) / cw; pos[j + 1] = (v + Math.random()) / ch; pos[j + 2] = l;
    raw[j] = r; raw[j + 1] = g; raw[j + 2] = bl;
    n++;
  }
  for (; n < CAP; n++) { const j = n * 3, k = ((Math.random() * Math.max(1, n)) | 0) * 3; pos[j] = pos[k] + (Math.random() - 0.5) * 0.004; pos[j + 1] = pos[k + 1] + (Math.random() - 0.5) * 0.004; pos[j + 2] = pos[k + 2]; raw[j] = raw[k]; raw[j + 1] = raw[k + 1]; raw[j + 2] = raw[k + 2]; }
  return { pos, raw };
}

function burst(i, rn, cx, cy) { const a = Math.atan2(py[i] - cy, px[i] - cx) + (rn - 0.5) * 0.8, f = (3 + rn * 11) * dpr; vx[i] += Math.cos(a) * f; vy[i] += Math.sin(a) * f; }
function setForm(s, m, sp) {
  g3d = null; last = s; lastRaw = s.raw; mode = m; t0 = performance.now(); spin = sp || null; hid.fill(0);
  const cx = box.x + box.w / 2, cy = box.y + box.h / 2, pos = s.pos;
  for (let i = 0; i < CAP; i++) {
    const j = i * 3, u = pos[j], v = pos[j + 1], rn = Math.random();
    hx[i] = box.x + u * box.w; hy[i] = box.y + v * box.h;
    big[i] = pos[j + 2] > 0.86 && dpr > 1 && i % 4 === 0 ? 1 : 0;
    if (m === 0) dl[i] = u * 0.7 + rn * 0.3;                                          // wind: sweeps across
    else if (m === 1) dl[i] = 0.35 + Math.hypot(u - 0.5, v - 0.5) * 1.1 + rn * 0.2;   // vortex: from the middle out
    else if (m === 2) { dl[i] = 0.1 + rn * 0.5; burst(i, rn, cx, cy); }                // burst
    else if (m === 3) dl[i] = (1 - v) * 0.75 + rn * 0.3;                              // fall: drops, then builds up from the bottom
    else dl[i] = 0.7 + rn * 0.5 + u * 0.15;                                           // ring: pulled into a circle first
    if (sp) grp[i] = Math.hypot(hx[i] - sp[0].x, hy[i] - sp[0].y) / sp[0].r <= Math.hypot(hx[i] - sp[1].x, hy[i] - sp[1].y) / sp[1].r ? 0 : 1;
  }
  recolor();
  if (still) settleNow();
}
function settleNow() { for (let i = 0; i < CAP; i++) { px[i] = hx[i]; py[i] = hy[i]; cr[i] = tr[i]; cg[i] = tg[i]; cb[i] = tb[i]; } t0 = performance.now() - 1e5; requestAnimationFrame(frame); }

// ---------- the opening image: a real 3D gear train, viewed from above at a diagonal ----------
const YAW = -0.62, PITCH = 0.6, THICK = 0.52, TOOTH = 0.095, FOCAL = 4.6, ROLL = -0.17;
const cr0 = Math.cos(ROLL), sr0 = Math.sin(ROLL);
const cyw = Math.cos(YAW), syw = Math.sin(YAW), cp = Math.cos(PITCH), sp0 = Math.sin(PITCH);
let g3d = null;
const lx = new Float32Array(CAP), ly = new Float32Array(CAP), lz = new Float32Array(CAP), nlx = new Float32Array(CAP), nlz = new Float32Array(CAP), gid = new Uint8Array(CAP);
function buildGears() {
  // the big gear sits low on the screen; the two above it each mesh with it, and not with each other
  const Rc = 1, Nc = 34, pitch = Rc / Nc;
  const mk = (n, col) => ({ n, R: n * pitch, h: TOOTH, col, twist: (Math.PI * 2 / n) * 1.0, holes: n > 30 ? 7 : n > 24 ? 6 : 5 });
  const C = mk(Nc, [226, 232, 244]), A = mk(26, [242, 150, 86]), B = mk(20, [86, 176, 240]);
  const view = (X, Z) => ({ x: X * cyw + Z * syw, z: -X * syw + Z * cyw });     // screen-aligned to world
  const cc = view(0, -0.86); C.x = cc.x; C.z = cc.z;
  const place = (g, deg) => { const D = C.R + g.R - TOOTH * 0.34, a = (deg * Math.PI) / 180, p = view(Math.cos(a) * D, -0.86 + Math.sin(a) * D); g.x = p.x; g.z = p.z; g.phi = Math.atan2(g.z - C.z, g.x - C.x); };
  place(A, 128); place(B, 50);
  const gears = [A, B, C], total = gears.reduce((s, g) => s + g.R * g.R + g.R * 0.4, 0);
  const rr = (g, th) => { const s = 0.5 + 0.5 * Math.cos(g.n * th); return g.R - g.h * 0.55 + g.h * Math.pow(s, 2.2); };
  const raw = new Float32Array(CAP * 3);
  let i = 0;
  gears.forEach((g, id) => {
    const count = g === C ? CAP - i : Math.round((CAP * (g.R * g.R + g.R * 0.4)) / total), end = i + count;
    const holeR = g.R * 0.13, holeAt = g.R * 0.6, hubR = g.R * 0.24;
    const holeC = Array.from({ length: g.holes }, (_, k) => { const a = (k * Math.PI * 2) / g.holes; return [Math.cos(a) * holeAt, Math.sin(a) * holeAt]; });
    const rings = Array.from({ length: 16 }, (_, k) => hubR * 1.1 + ((g.R * 0.86 - hubR * 1.1) * k) / 15);
    const put = (X, Y, Z, nx, nz, shade) => { if (i >= end) return; lx[i] = X; ly[i] = Y; lz[i] = Z; nlx[i] = nx; nlz[i] = nz; gid[i] = id; const j = i * 3; raw[j] = g.col[0] * shade; raw[j + 1] = g.col[1] * shade; raw[j + 2] = g.col[2] * shade; i++; };
    while (i < end) {
      const t = Math.random(), th = Math.random() * Math.PI * 2;
      if (t < 0.2) { const r = rr(g, th); put(Math.cos(th) * r, 0, Math.sin(th) * r, 0, 0, 1.12); }
      else if (t < 0.27) { const a = th - g.twist, r = rr(g, th), dr = (rr(g, th + 0.004) - r) / 0.004; let nx = Math.cos(a) * r + Math.sin(a) * dr, nz = Math.sin(a) * r - Math.cos(a) * dr; const q = Math.hypot(nx, nz) || 1; nx /= q; nz /= q; put(Math.cos(a) * r, -THICK, Math.sin(a) * r, nx, nz, 0.95); }                 // crisp tooth outline
      else if (t < 0.6) {                                                                                               // tooth flanks, winding helically down the depth
        const f = Math.random(), a = th - g.twist * f, r = rr(g, th), dr = (rr(g, th + 0.004) - r) / 0.004;
        let nx = Math.cos(a) * r - Math.sin(a) * -dr, nz = Math.sin(a) * r + Math.cos(a) * -dr; const q = Math.hypot(nx, nz) || 1; nx /= q; nz /= q;
        put(Math.cos(a) * r, -THICK * f, Math.sin(a) * r, nx, nz, 0.34 + 0.66 * Math.max(0, nx * -0.7 + nz * -0.71));
      } else if (t < 0.85) {                                                                                             // the face: fine turned rings, like a machined part
        const r = rings[(Math.random() * rings.length) | 0] + (Math.random() - 0.5) * 0.004, X = Math.cos(th) * r, Z = Math.sin(th) * r;
        if (holeC.some(([u, v]) => Math.hypot(X - u, Z - v) < holeR)) continue;
        put(X, 0, Z, 0, 0, 0.62 + 0.3 * Math.sin(th + 2.4));
      } else if (t < 0.93) {                                                                                             // bore and hole rims
        const k = (Math.random() * (g.holes + 1)) | 0, c = k < g.holes ? holeC[k] : [0, 0], hr = k < g.holes ? holeR : hubR;
        put(c[0] + Math.cos(th) * hr, 0, c[1] + Math.sin(th) * hr, 0, 0, 1.05);
      } else {                                                                                                           // inside the holes
        const k = (Math.random() * (g.holes + 1)) | 0, c = k < g.holes ? holeC[k] : [0, 0], hr = k < g.holes ? holeR : hubR;
        put(c[0] + Math.cos(th) * hr, -THICK * Math.random(), c[1] + Math.sin(th) * hr, -Math.cos(th), -Math.sin(th), 0.42);
      }
    }
  });
  // fit the whole train into the space
  let a0 = 1e9, a1 = -1e9, b0 = 1e9, b1 = -1e9;
  gears.forEach((g) => { for (let k = 0; k < 48; k++) for (const y of [0, -THICK]) { const th = (k / 48) * Math.PI * 2, r = g.R + g.h * 0.45, X0 = g.x + Math.cos(th) * r, Z0 = g.z + Math.sin(th) * r, X = X0 * cyw - Z0 * syw, Z = X0 * syw + Z0 * cyw, Y2 = y * cp + Z * sp0, Z2 = Z * cp - y * sp0, q = FOCAL / (FOCAL + Z2), rx = X * q, ry = -Y2 * q, sx = rx * cr0 - ry * sr0, sy = rx * sr0 + ry * cr0; a0 = Math.min(a0, sx); a1 = Math.max(a1, sx); b0 = Math.min(b0, sy); b1 = Math.max(b1, sy); } });
  return { gears, raw, a0, a1, b0, b1, C };
}
function showGears() {
  ++token;
  setAccent("index");
  const G = g3dBuilt || (g3dBuilt = buildGears());
  const f = freeSpace(), left = f.l, right = f.r, top = f.t, bot = f.b;
  const S2 = Math.min((right - left) / (G.a1 - G.a0), (bot - top) / (G.b1 - G.b0));
  G.S = S2 * dpr; G.ox = ((left + right) / 2 - (((G.a0 + G.a1) / 2) * S2)) * dpr; G.oy = ((top + bot) / 2 - (((G.b0 + G.b1) / 2) * S2)) * dpr;
  g3d = G; last = null; lastRaw = G.raw; spin = null; mode = 2; t0 = performance.now(); hid.fill(0);
  const rn = () => Math.random();
  for (let i = 0; i < CAP; i++) { dl[i] = 0.12 + rn() * 0.75; burst(i, rn(), G.ox, G.oy); big[i] = 0; }
  recolor();
  gearPose(performance.now() / 1000);
  if (still) settleNow();
}
let g3dBuilt = null;
const WC = 0.2;
function gearPose(t) {
  const G = g3d, rc = t * WC, F = FOCAL, tc = G.C, poses = G.gears.map((g, id) => {
    let r = rc;
    if (g !== tc) r = g.phi + Math.PI - (Math.PI - tc.n * (g.phi - rc)) / g.n;   // always a tooth in a gap where they meet
    return { c: Math.cos(r), s: Math.sin(r), x: g.x, z: g.z, front: g === tc };
  });
  // the front gear is solid: anything of the others that falls behind its body is not drawn
  const tcX = tc.x * cyw - tc.z * syw, tcZ = tc.x * syw + tc.z * cyw, occ = (tc.R - tc.h * 0.5) ** 2, slant = cp / sp0;
  for (let i = 0; i < M; i++) {
    const p = poses[gid[i]], X0 = lx[i] * p.c - lz[i] * p.s, Z0 = lx[i] * p.s + lz[i] * p.c, wx = p.x + X0, wz = p.z + Z0, y = ly[i];
    const nx0 = nlx[i], nz0 = nlz[i];
    let hide = 0;
    if (nx0 || nz0) { const nx = nx0 * p.c - nz0 * p.s, nz = nx0 * p.s + nz0 * p.c; hide = (nx * syw + nz * cyw) * cp > 0.02 ? 1 : 0; }
    const X = wx * cyw - wz * syw, Z = wx * syw + wz * cyw;
    if (!hide && !p.front) { const dx = X - tcX, z0 = Z + y * slant - tcZ, z1 = Z + (y + THICK) * slant - tcZ; if (dx * dx + z0 * z0 < occ || dx * dx + z1 * z1 < occ) hide = 1; }
    hid[i] = hide;
    const Y2 = y * cp + Z * sp0, Z2 = Z * cp - y * sp0, q = F / (F + Z2);
    const rx = X * q, ry = -Y2 * q; hx[i] = G.ox + (rx * cr0 - ry * sr0) * G.S; hy[i] = G.oy + (rx * sr0 + ry * cr0) * G.S;
  }
}

// ---------- forms and photos ----------
const cache = {};
function photo(src, cb) { if (cache[src]) return cb(cache[src]); const im = new Image(); im.onload = () => cb((cache[src] = im)); im.src = src; }
let token = 0, nextMode = 0;
function showPhoto(src, m) {
  const me = ++token;
  photo(src, (im) => { if (me !== token) return; photoBox(im.width / im.height); setForm(sample((o, w, h) => { o.drawImage(im, 0, 0, w, h); }), m === undefined ? nextMode++ % 5 : m); });
}
const rampOf = (id) => { const r = SITE.palette[id].ramp; return [hexRGB(r[2]), hexRGB(r[3]), hexRGB(r[4])]; };
function showForm(id) {
  ++token; photoBox(4 / 3);
  const ramp = rampOf(id);
  if (id === "builds") {
    // a coiled spring, seen along its length
    setForm(sample((o, w, h) => { o.strokeStyle = "#fff"; o.lineWidth = 1.8; for (let k = 0; k < 15; k++) { const cx = w * (0.14 + (k * 0.72) / 14); o.beginPath(); o.ellipse(cx, h / 2, w * 0.05, h * 0.3, 0.26, 0, S.TAU); o.stroke(); } o.lineWidth = 1; o.beginPath(); o.moveTo(w * 0.06, h * 0.5); o.lineTo(w * 0.94, h * 0.5); o.stroke(); }, ramp), 1);
  } else if (id === "now") {
    setForm(sample((o, w, h) => { o.strokeStyle = "#fff"; for (let k = 1; k <= 11; k++) { o.lineWidth = 1 + k * 0.22; o.beginPath(); o.arc(w * 0.5, h * 0.5, (k * h) / 23, 0, S.TAU); o.stroke(); } }, ramp), 1);
  } else {
    setForm(sample((o, w, h) => { o.strokeStyle = "#fff"; o.lineCap = "round"; for (let k = 0; k < 64; k++) { const a = (k * S.TAU) / 64, r0 = h * (k % 2 ? 0.14 : 0.2), r1 = h * (k % 4 === 0 ? 0.47 : k % 2 ? 0.34 : 0.4); o.lineWidth = k % 4 === 0 ? 3 : 1.5; o.beginPath(); o.moveTo(w / 2 + Math.cos(a) * r0, h / 2 + Math.sin(a) * r0); o.lineTo(w / 2 + Math.cos(a) * r1, h / 2 + Math.sin(a) * r1); o.stroke(); } o.fillStyle = "#fff"; o.beginPath(); o.arc(w / 2, h / 2, h * 0.09, 0, S.TAU); o.fill(); }, ramp), 2);
  }
}

// the pointer pushes dots aside; a click sends out a ring
let mx = -1e5, my = -1e5, shock = null;
addEventListener("pointermove", (e) => { if (e.pointerType === "touch") return; const r = cv.getBoundingClientRect(); mx = (e.clientX - r.left) * dpr; my = (e.clientY - r.top) * dpr; }, { passive: true });
cv.addEventListener("pointerdown", (e) => { const r = cv.getBoundingClientRect(); shock = { x: (e.clientX - r.left) * dpr, y: (e.clientY - r.top) * dpr, t: performance.now() }; });

let slow = 0, fl = 0;
function frame(now) {
  const el = (now - t0) / 1000, t = now / 1000, cx = box.x + box.w / 2, cy = box.y + box.h / 2, R = 62 * dpr, R2 = R * R;
  const ringR = Math.min(box.w, box.h) * 0.38, settle = el > 3.2, wob = g3d ? 0 : 0.5 * dpr, fading = now - ct0 < 1600;
  const scan = g3d ? -1e5 : box.y + ((t * 0.13) % 1.5) * box.h, sw = 1.6 * dpr, glint = paper ? 0xff1a1712 : 0xffffffff;
  const sr = shock ? ((now - shock.t) / 1000) * 900 * dpr : 0, sa = shock ? 1 - (now - shock.t) / 900 : 0;
  if (shock && sa <= 0) shock = null;
  if (g3d) gearPose(t);
  d32.fill(0);
  for (let i = 0; i < M; i++) {
    if (spin) { const g = spin[grp[i]], dx = hx[i] - g.x, dy = hy[i] - g.y; hx[i] = g.x + dx * g.c - dy * g.s; hy[i] = g.y + dx * g.s + dy * g.c; }
    let X = px[i], Y = py[i];
    if (el < dl[i]) {
      if (mode === 0) { vx[i] += 0.16 * dpr + (Math.random() - 0.4) * 0.3 * dpr; vy[i] += (Math.random() - 0.5) * 0.5 * dpr; vx[i] *= 0.985; }
      else if (mode === 1) { const a = X - cx, b = Y - cy, q = Math.hypot(a, b) + 1; vx[i] += (-b / q) * 0.5 * dpr - (a / q) * 0.14 * dpr; vy[i] += (a / q) * 0.5 * dpr - (b / q) * 0.14 * dpr; vx[i] *= 0.97; vy[i] *= 0.97; }
      else if (mode === 3) { vy[i] += 0.2 * dpr; vx[i] += (Math.random() - 0.5) * 0.1; if (Y > bh + 40) { vy[i] = 0; py[i] = bh + 40; } }
      else if (mode === 4) { const a = X - cx, b = Y - cy, q = Math.hypot(a, b) + 1, n = (ringR - q) * 0.012; vx[i] = (vx[i] + (a / q) * n * 6 - (b / q) * 0.35 * dpr) * 0.9; vy[i] = (vy[i] + (b / q) * n * 6 + (a / q) * 0.35 * dpr) * 0.9; }
      else { vx[i] *= 0.96; vy[i] *= 0.96; }
    } else {
      const k = Math.min(1, (el - dl[i]) * 1.5) * (g3d ? 0.09 : 0.055);
      vx[i] = (vx[i] + (hx[i] - X) * k) * 0.8; vy[i] = (vy[i] + (hy[i] - Y) * k) * 0.8;
    }
    const pd = (X - mx) * (X - mx) + (Y - my) * (Y - my);
    if (pd < R2 && pd > 1) { const q = Math.sqrt(pd), f = (1 - q / R) * 2.6 * dpr; vx[i] += ((X - mx) / q) * f; vy[i] += ((Y - my) / q) * f; }
    if (shock) { const a = X - shock.x, b = Y - shock.y, q = Math.hypot(a, b) + 1, gap = Math.abs(q - sr); if (gap < 34 * dpr) { const f = (1 - gap / (34 * dpr)) * sa * 3.4 * dpr; vx[i] += (a / q) * f; vy[i] += (b / q) * f; } }
    X = px[i] += vx[i]; Y = py[i] += vy[i];
    if (fading || !settle || i % 8 === 0) { cr[i] += (tr[i] - cr[i]) * 0.07; cg[i] += (tg[i] - cg[i]) * 0.07; cb[i] += (tb[i] - cb[i]) * 0.07; }
    if (hid[i]) continue;
    const dx = wob && settle ? Math.sin(hy[i] * 0.011 / dpr + t * 1.3) * wob : 0;
    const ix = (X + dx) | 0, iy = Y | 0;
    if (ix < 0 || iy < 0 || ix >= bw - 2 || iy >= bh - 2) continue;
    const col = Math.abs(Y - scan) < sw ? glint : (0xff000000 | ((cb[i] & 255) << 16) | ((cg[i] & 255) << 8) | (cr[i] & 255));
    const p = iy * bw + ix;
    d32[p] = col;
    if (big[i]) { d32[p + 1] = col; d32[p + bw] = col; }
    const sp2 = vx[i] * vx[i] + vy[i] * vy[i];
    if (sp2 > 16) { const a = (X - vx[i] * 0.6) | 0, b = (Y - vy[i] * 0.6) | 0; if (a >= 0 && b >= 0 && a < bw && b < bh) d32[b * bw + a] = col; }
  }
  x.putImageData(image, 0, 0);
  // a slower machine simply gets fewer dots rather than a choppy picture
  if (fl && now - fl < 200 && now - fl > 30) slow++; else if (slow > 0) slow -= 0.25;
  fl = now;
  if (slow > 45 && M > 26000) { M = Math.round(M * 0.8); slow = 0; }
  if (!still) requestAnimationFrame(frame);
}

// ---------- pages ----------
function route(id) {
  const open = id !== "index";
  pop.hidden = !open; stack.hidden = !(open && S.isBuild(id) && phone());
  document.body.classList.toggle("is-open", open);
  if (!open) { setTimeout(() => { if (phone()) window.scrollTo({ top: 0, behavior: "smooth" }); }, 0); showGears(); return; }
  pop.innerHTML = S.detail(id); pop.scrollTop = 0;
  if (!stack.hidden) stack.innerHTML = S.detail("builds");
  pop.classList.remove("in"); void pop.offsetWidth; pop.classList.add("in");
  setAccent(id);
  if (S.P[id]) showPhoto(S.img(S.P[id].images[0].src)); else showForm(id);
  if (phone() && booted) window.scrollTo({ top: 0, behavior: still ? "auto" : "smooth" });
}
let booted = false;
size();
for (let i = 0; i < CAP; i++) { px[i] = Math.random() * bw; py[i] = Math.random() * bh; cr[i] = cg[i] = cb[i] = paper ? 90 : 200; }
paintTheme();
document.querySelector(".theme").addEventListener("click", () => {
  paper = !paper;
  try { localStorage.setItem("vc-bg", paper ? "paper" : "black"); } catch (e) { /* private mode */ }
  paintTheme(); recolor();
  if (still) { for (let i = 0; i < CAP; i++) { cr[i] = tr[i]; cg[i] = tg[i]; cb[i] = tb[i]; } requestAnimationFrame(frame); }
});
pop.addEventListener("photo", (e) => showPhoto(e.detail));
S.router(route);
booted = true;
if (!still) requestAnimationFrame(frame);
if (!cv.clientWidth) addEventListener("load", () => { size(); route(S.current()); }, { once: true });
let rt = 0, lastW = innerWidth;
addEventListener("resize", () => { if (phone() && innerWidth === lastW) return; lastW = innerWidth; clearTimeout(rt); rt = setTimeout(() => { size(); route(S.current()); }, 160); });

// the same opt-in SoundCloud player as the live site: quiet fades, a credit while it plays,
// a thin strip if a browser needs a tap inside it, and it remembers being on for the next visit
(function () {
  const btn = document.querySelector(".sound"), cr = document.querySelector(".now"), note = document.querySelector(".sound-note");
  if (!btn) return;
  const TRACK = SITE.credit.href, KEY = "vc-sound", VOLUME = 60, FADE_IN = 4000, FADE_OUT = 1100;
  let widget = null, frame = null, ready = null, fadeTimer = 0, checkTimer = 0, level = 0, playing = false, offered = false;
  const remember = (on) => { try { localStorage.setItem(KEY, on ? "1" : "0"); } catch (e) { /* private mode */ } };
  const wanted = () => { try { return localStorage.getItem(KEY) === "1"; } catch (e) { return false; } };
  const LABEL = "Play music: Champagne Coast by Blood Orange";
  btn.setAttribute("aria-label", LABEL);
  function fadeTo(target, ms, done) {
    clearInterval(fadeTimer);
    const from = level, steps = Math.max(1, Math.round(ms / 50));
    let i = 0;
    fadeTimer = setInterval(() => { i++; level = from + (target - from) * (i / steps); if (widget) widget.setVolume(Math.round(level)); if (i >= steps) { clearInterval(fadeTimer); if (done) done(); } }, 50);
  }
  const say = (t) => { if (note) { note.textContent = t || ""; note.hidden = !t; } };
  function setState(on, t) {
    playing = on; btn.setAttribute("aria-pressed", String(on));
    btn.setAttribute("aria-label", on ? "Stop music" : LABEL);
    say(t); if (on && cr) cr.hidden = false;
  }
  const strip = (on) => frame && frame.classList.toggle("is-shown", on);
  function load() {
    if (ready) return ready;
    ready = new Promise((res, rej) => {
      const s = document.createElement("script"); s.src = "https://w.soundcloud.com/player/api.js"; s.onerror = rej;
      s.onload = () => {
        frame = document.createElement("iframe"); frame.className = "sc-frame"; frame.title = "Champagne Coast by Blood Orange on SoundCloud"; frame.allow = "autoplay; encrypted-media";
        frame.src = "https://w.soundcloud.com/player/?url=" + encodeURIComponent(TRACK) + "&auto_play=false&visual=false&show_artwork=false&show_comments=false&show_user=true&sharing=false&buying=false&download=false";
        document.body.appendChild(frame);
        widget = window.SC.Widget(frame);
        const E = window.SC.Widget.Events;
        widget.bind(E.READY, () => res());
        widget.bind(E.PLAY, () => { if (!frame.classList.contains("is-shown")) return; strip(false); setState(true); fadeTo(VOLUME, FADE_IN); verify(); });
        widget.bind(E.FINISH, () => { if (playing) { widget.seekTo(0); widget.play(); } });
        widget.bind(E.ERROR, () => stop());
      };
      document.head.appendChild(s);
    });
    ready.catch(() => { ready = null; stop(); });
    return ready;
  }
  async function play() { setState(true); remember(true); try { await load(); } catch (e) { return; } if (!playing) return; widget.setVolume(0); level = 0; widget.play(); fadeTo(VOLUME, FADE_IN); verify(); }
  function verify() {
    clearTimeout(checkTimer);
    checkTimer = setTimeout(() => widget.isPaused((paused) => {
      if (!paused || !playing) return;
      clearInterval(fadeTimer); level = 0; widget.setVolume(0);
      if (!offered) { offered = true; setState(false, "tap ▶ on the SoundCloud strip to play"); strip(true); } else setState(false, "music couldn't start in this browser");
      if (cr) cr.hidden = false;
    }), 2500);
  }
  function stop() { clearTimeout(checkTimer); strip(false); setState(false); remember(false); fadeTo(0, FADE_OUT, () => { if (playing) return; if (widget) widget.pause(); if (cr) cr.hidden = true; }); }
  btn.addEventListener("click", () => { disarm(); if (playing || (frame && frame.classList.contains("is-shown"))) stop(); else play(); });
  const arm = (e) => { if (e.target.closest && e.target.closest(".sound")) return; disarm(); if (!playing) play(); };
  function disarm() { window.removeEventListener("pointerdown", arm, true); window.removeEventListener("keydown", arm, true); }
  if (wanted()) { window.addEventListener("pointerdown", arm, true); window.addEventListener("keydown", arm, true); }
})();
