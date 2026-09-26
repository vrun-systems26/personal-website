// ---------- boot / connect sequence ----------
(function () {
  const boot = document.getElementById("bootScreen");
  const phase1 = document.getElementById("bootPhase1");
  const phase2 = document.getElementById("bootPhase2");
  if (!boot) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const waitMs = reduceMotion ? 200 : 1900;
  const motdMs = reduceMotion ? 200 : 2100;

  setTimeout(() => {
    if (phase1) phase1.hidden = true;
    if (phase2) phase2.hidden = false;
  }, waitMs);

  setTimeout(() => {
    boot.classList.add("is-hidden");
    setTimeout(() => {
      boot.remove();
      // land visitors straight in the About file, so the headline info
      // is visible immediately without requiring a click
      if (typeof openCard === "function") openCard("about");
    }, 700);
  }, waitMs + motdMs);
})();

// ---------- live clock ----------
(function () {
  const clockEl = document.getElementById("trayClock");
  if (!clockEl) return;
  function tick() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, "0");
    const m = String(now.getMinutes()).padStart(2, "0");
    clockEl.textContent = `${h}:${m}`;
  }
  tick();
  setInterval(tick, 10000);
})();

// ---------- year ----------
document.querySelectorAll(".js-year").forEach((el) => {
  el.textContent = new Date().getFullYear();
});

// ---------- window system: draggable, multiple windows open at once ----------
const cards = document.querySelectorAll(".card");
const tbWindows = document.getElementById("tbWindows");
let zTop = 100;
let cascadeCount = 0;

function nameFor(card) {
  const nameEl = card.querySelector(".win-tb-name");
  return nameEl ? nameEl.textContent : card.dataset.card;
}

function bringToFront(card) {
  zTop += 1;
  card.style.zIndex = zTop;
  cards.forEach((c) => c.querySelector(".win-titlebar")?.classList.remove("is-focused"));
  card.querySelector(".win-titlebar")?.classList.add("is-focused");
  renderTaskbar();
}

function renderTaskbar() {
  if (!tbWindows) return;
  tbWindows.innerHTML = "";
  const openCards = Array.from(cards).filter((c) => c.classList.contains("is-open"));
  const front = openCards.reduce((a, b) => ((+b.style.zIndex || 0) > (+a?.style.zIndex || 0) ? b : a), null);
  openCards.forEach((c) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "tb-win-chip" + (c === front && !c.classList.contains("is-minimized") ? " is-active" : "") + (c.classList.contains("is-minimized") ? " is-min" : "");
    chip.textContent = nameFor(c);
    chip.addEventListener("click", () => {
      if (c.classList.contains("is-minimized")) {
        c.classList.remove("is-minimized");
      }
      bringToFront(c);
    });
    tbWindows.appendChild(chip);
  });
}

function closeAllCards() {
  cards.forEach((c) => {
    c.classList.remove("is-open", "is-max", "is-minimized");
  });
  renderTaskbar();
}

function closeCard(card) {
  card.classList.remove("is-open", "is-max", "is-minimized");
  renderTaskbar();
}

function openCard(name) {
  if (!name) return;
  const target = document.querySelector(`.card[data-card="${name}"]`);
  if (!target) return;
  const alreadyOpen = target.classList.contains("is-open");
  target.classList.remove("is-minimized");
  if (!alreadyOpen) {
    target.classList.add("is-open");
    if (!target.dataset.positioned && window.innerWidth > 760) {
      const offset = (cascadeCount % 6) * 26;
      target.style.top = 46 + offset + "px";
      target.style.left = Math.max(12, window.innerWidth / 2 - 440 + offset) + "px";
      target.dataset.positioned = "1";
      cascadeCount++;
    }
    const content = target.querySelector(".win-content");
    if (content) content.scrollTop = 0;
  }
  bringToFront(target);
}

document.querySelectorAll(".d-icon[data-card]").forEach((el) => {
  el.addEventListener("click", (e) => {
    e.preventDefault();
    openCard(el.dataset.card);
  });
});

document.querySelectorAll("[data-close]").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const win = btn.closest(".card");
    if (win) closeCard(win);
  });
});

document.querySelectorAll("[data-maximize]").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const win = btn.closest(".card");
    if (win) win.classList.toggle("is-max");
  });
});

document.querySelectorAll(".win-min").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const win = btn.closest(".card");
    if (win) {
      win.classList.add("is-minimized");
      renderTaskbar();
    }
  });
});

// click anywhere on a window brings it to front
cards.forEach((card) => {
  card.addEventListener("mousedown", () => bringToFront(card));
});

// ---------- prev/next: flip through files without going back to the desktop ----------
const FILE_ORDER = ["about", "fetch", "street-sweeper", "hope", "arm", "ceres", "morebuilds", "skills", "awards", "contact"];

function navigateCard(currentCard, direction) {
  const name = currentCard.dataset.card;
  const idx = FILE_ORDER.indexOf(name);
  if (idx === -1) return;
  const nextIdx = (idx + direction + FILE_ORDER.length) % FILE_ORDER.length;
  const nextName = FILE_ORDER[nextIdx];
  const nextCard = document.querySelector(`.card[data-card="${nextName}"]`);
  if (!nextCard) return;

  // hand off this window's spot to the next file, so it feels like paging
  // through one window rather than opening a new one each time
  if (window.innerWidth > 760 && !currentCard.classList.contains("is-max")) {
    nextCard.style.top = currentCard.style.top;
    nextCard.style.left = currentCard.style.left;
    nextCard.dataset.positioned = "1";
  }
  if (currentCard.classList.contains("is-max")) nextCard.classList.add("is-max");

  closeCard(currentCard);
  openCard(nextName);
}

document.querySelectorAll("[data-nav]").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const card = btn.closest(".card");
    if (!card) return;
    navigateCard(card, btn.dataset.nav === "next" ? 1 : -1);
  });
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeAllCards();
});

// ---------- dragging windows by their title bar ----------
(function () {
  let dragCard = null;
  let startX = 0, startY = 0, startLeft = 0, startTop = 0;

  function onPointerDown(e) {
    if (window.innerWidth <= 760) return;
    const titlebar = e.target.closest(".win-titlebar");
    if (!titlebar || e.target.closest(".win-btn")) return;
    const card = titlebar.closest(".card");
    if (!card || card.classList.contains("is-max")) return;
    dragCard = card;
    const point = e.touches ? e.touches[0] : e;
    startX = point.clientX;
    startY = point.clientY;
    const rect = card.getBoundingClientRect();
    startLeft = rect.left;
    startTop = rect.top;
    card.classList.add("is-dragging");
    bringToFront(card);
    e.preventDefault();
  }

  function onPointerMove(e) {
    if (!dragCard) return;
    const point = e.touches ? e.touches[0] : e;
    const dx = point.clientX - startX;
    const dy = point.clientY - startY;
    const maxLeft = window.innerWidth - 80;
    const maxTop = window.innerHeight - 40;
    dragCard.style.left = Math.min(maxLeft, Math.max(-dragCard.offsetWidth + 100, startLeft + dx)) + "px";
    dragCard.style.top = Math.min(maxTop, Math.max(27, startTop + dy)) + "px";
  }

  function onPointerUp() {
    if (dragCard) dragCard.classList.remove("is-dragging");
    dragCard = null;
  }

  document.addEventListener("mousedown", onPointerDown);
  document.addEventListener("mousemove", onPointerMove);
  document.addEventListener("mouseup", onPointerUp);
  document.addEventListener("touchstart", onPointerDown, { passive: false });
  document.addEventListener("touchmove", onPointerMove, { passive: false });
  document.addEventListener("touchend", onPointerUp);
})();

// ---------- trash icon: a little easter egg, not a real delete ----------
(function () {
  const trash = document.querySelector(".d-icon[data-trash]");
  if (!trash) return;
  trash.addEventListener("click", (e) => {
    e.preventDefault();
    trash.classList.add("d-icon-shake");
    setTimeout(() => trash.classList.remove("d-icon-shake"), 400);
  });
})();
