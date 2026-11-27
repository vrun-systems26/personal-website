// =========================================================
// v2 prototypes: shared data helpers
// every version reads the live site's real words and photos from ../js/content.js
// =========================================================

const KIT = (() => {
  const S = SITE, P = S.projects;
  const groups = { builds: S.builds, software: S.software };
  const groupOf = (id) => Object.keys(groups).find((g) => groups[g].items.some((i) => i.to === id)) || null;
  const main = S.nav[0].map((n) => n.to);

  // one record per project, with image paths that work from v2/
  const all = Object.keys(P).map((id) => ({
    id,
    group: groupOf(id) || "main",
    title: P[id].title,
    meta: P[id].meta,
    body: P[id].body,
    spec: P[id].spec,
    out: P[id].out,
    images: P[id].images.map((m) => ({ src: "" + m.src, alt: m.alt })),
    dust: (P[id].dust || []).map((s) => "" + s),
  }));
  const byId = (id) => all.find((p) => p.id === id) || null;
  const inGroup = (g) => all.filter((p) => p.group === g);

  const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  // pages live in the address: #/fetch, #/awards, #/now, #/builds, #/software
  const route = () => location.hash.replace(/^#\/?/, "").split("/").filter(Boolean).pop() || "";
  const onRoute = (fn) => { addEventListener("hashchange", () => fn(route())); fn(route()); };
  const go = (id) => { location.hash = id ? "#/" + id : "#/"; };

  // copy a contact detail and say so; each version can restyle .kit-toast
  let toastEl, toastT;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "kit-toast"; toastEl.setAttribute("role", "status");
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg; toastEl.classList.add("is-on");
    clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove("is-on"), 4000);
  }
  function copy(c) {
    const done = () => toast(c.done);
    if (navigator.clipboard) navigator.clipboard.writeText(c.copy).then(done, () => toast(c.copy)); else toast(c.copy);
  }

  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const phone = () => innerWidth < 760;

  return {
    SITE: S, name: S.name, bio: S.bio, main, groups, groupOf, all, byId, inGroup,
    awards: S.awards.items, now: S.now.items, links: S.links, copies: S.copies,
    esc, route, onRoute, go, toast, copy, reduced, phone,
  };
})();
