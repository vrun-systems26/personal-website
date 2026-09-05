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
    setTimeout(() => boot.remove(), 700);
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

// ---------- window system: desktop icons open one window at a time ----------
const cards = document.querySelectorAll(".card");
const tbTitle = document.getElementById("tbWindowTitle");

function closeAllCards() {
  cards.forEach((c) => {
    c.classList.remove("is-open");
    c.classList.remove("is-max");
  });
  if (tbTitle) tbTitle.textContent = "desktop";
}

function openCard(name) {
  if (!name) return;
  const target = document.querySelector(`.card[data-card="${name}"]`);
  if (!target) return;
  cards.forEach((c) => c.classList.remove("is-open"));
  target.classList.add("is-open");
  const content = target.querySelector(".win-content");
  if (content) content.scrollTop = 0;
  const nameEl = target.querySelector(".win-tb-name");
  if (tbTitle) tbTitle.textContent = nameEl ? nameEl.textContent : name;
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
    closeAllCards();
  });
});

document.querySelectorAll("[data-maximize]").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    const win = btn.closest(".card");
    if (win) win.classList.toggle("is-max");
  });
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeAllCards();
});

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
