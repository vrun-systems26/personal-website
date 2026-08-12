// ---------- year ----------
document.querySelectorAll(".js-year").forEach((el) => {
  el.textContent = new Date().getFullYear();
});

// ---------- mobile nav ----------
const navToggle = document.getElementById("navToggle");
const mainNav = document.getElementById("mainNav");
navToggle?.addEventListener("click", () => {
  mainNav.classList.toggle("open");
});
mainNav?.querySelectorAll("a").forEach((a) => {
  a.addEventListener("click", () => mainNav.classList.remove("open"));
});

// ---------- card system: the blueprint gate opens one card at a time ----------
const gate = document.getElementById("gate");
const cards = document.querySelectorAll(".card");
const navLinks = document.querySelectorAll("[data-nav]");

function closeAllCards() {
  cards.forEach((c) => c.classList.remove("is-open"));
  navLinks.forEach((l) => l.classList.remove("active"));
  gate.setAttribute("aria-hidden", "false");
}

function openCard(name) {
  if (!name) return;
  const target = document.querySelector(`.card[data-card="${name}"]`);
  if (!target) return;
  cards.forEach((c) => c.classList.remove("is-open"));
  target.classList.add("is-open");
  target.scrollTop = 0;
  gate.setAttribute("aria-hidden", "true");
  navLinks.forEach((l) => l.classList.toggle("active", l.dataset.card === name));
}

document.querySelectorAll(".hotspot[data-card], .arm-hotspot[data-card], [data-nav][data-card]").forEach((el) => {
  el.addEventListener("click", (e) => {
    e.preventDefault();
    openCard(el.dataset.card);
  });
});

// ---------- hover a blueprint label OR the arm part itself, both light up and both click through ----------
document.querySelectorAll(".arm-hotspot[data-card]").forEach((el) => {
  const highlight = document.querySelector(`.arm-part-highlight[data-for="${el.dataset.card}"]`);
  if (!highlight) return;

  el.addEventListener("mouseenter", () => highlight.classList.add("is-active"));
  el.addEventListener("mouseleave", () => highlight.classList.remove("is-active"));
  el.addEventListener("focus", () => highlight.classList.add("is-active"));
  el.addEventListener("blur", () => highlight.classList.remove("is-active"));

  highlight.setAttribute("tabindex", "0");
  highlight.setAttribute("role", "button");
  highlight.setAttribute("aria-label", el.getAttribute("aria-label"));
  highlight.addEventListener("mouseenter", () => el.classList.add("hover-linked"));
  highlight.addEventListener("mouseleave", () => el.classList.remove("hover-linked"));
  highlight.addEventListener("focus", () => el.classList.add("hover-linked"));
  highlight.addEventListener("blur", () => el.classList.remove("hover-linked"));
  highlight.addEventListener("click", (e) => {
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

document.querySelectorAll("[data-close-all]").forEach((el) => {
  el.addEventListener("click", (e) => {
    e.preventDefault();
    closeAllCards();
  });
});

cards.forEach((card) => {
  card.addEventListener("click", (e) => {
    if (e.target === card) closeAllCards();
  });
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeAllCards();
});

// ---------- scroll reveal ----------
const revealTargets = document.querySelectorAll(
  ".project-card, .mini-card, .bin, .award-row, .about-grid, .blueprint-panels"
);
revealTargets.forEach((el) => el.setAttribute("data-reveal", ""));

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);
revealTargets.forEach((el) => revealObserver.observe(el));

// ---------- letter-by-letter heading reveal ----------
const CHAR_STAGGER_MS = 45;

function splitCharsRecursive(node, delayRef) {
  if (node.nodeType === Node.TEXT_NODE) {
    const frag = document.createDocumentFragment();
    Array.from(node.textContent).forEach((ch) => {
      if (ch === " ") {
        // a plain space, not an inline-block span - keeps this a valid line-wrap point
        frag.appendChild(document.createTextNode(" "));
        return;
      }
      const span = document.createElement("span");
      span.className = "char";
      span.textContent = ch;
      span.style.animationDelay = delayRef.i * CHAR_STAGGER_MS + "ms";
      delayRef.i++;
      frag.appendChild(span);
    });
    node.replaceWith(frag);
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    Array.from(node.childNodes).forEach((child) => splitCharsRecursive(child, delayRef));
  }
}

function animateHeading(el) {
  if (el.dataset.charSplit) return;
  el.dataset.charSplit = "true";
  el.classList.add("char-split");
  const delayRef = { i: 0 };
  Array.from(el.childNodes).forEach((child) => splitCharsRecursive(child, delayRef));
}

const heroHeading = document.querySelector(".hero-title");
if (heroHeading) setTimeout(() => animateHeading(heroHeading), 950);

const sectionHeadings = document.querySelectorAll(
  ".section-head h2, .contact-inner h2, .project-body h3, .mini-body h4, .award-row h4, .bin h4, .lede, .about-copy strong, .award-row strong"
);
const headingObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateHeading(entry.target);
        headingObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.4 }
);
sectionHeadings.forEach((el) => headingObserver.observe(el));

// ---------- live tool readouts, synced to the CSS-driven needle/slider motion ----------
(function () {
  const needle = document.querySelector(".bp-protractor-needle");
  const angleText = document.querySelector(".bp-protractor-value");
  const slider = document.querySelector(".bp-caliper-slider");
  const sliderText = document.querySelector(".bp-caliper-value");
  if (!needle && !slider) return;

  function matrixParts(el) {
    const t = getComputedStyle(el).transform;
    if (t === "none") return null;
    const m = t.match(/matrix\(([^)]+)\)/);
    if (!m) return null;
    return m[1].split(",").map(Number);
  }

  const SLIDE_RANGE = 72;
  const READING_OPEN = 68.4;
  const READING_CLOSED = 12.15;

  function tick() {
    if (needle && angleText) {
      const parts = matrixParts(needle);
      if (parts) {
        const deg = Math.round(Math.abs(Math.atan2(parts[1], parts[0]) * (180 / Math.PI)));
        angleText.textContent = deg + "°";
      }
    }
    if (slider && sliderText) {
      const parts = matrixParts(slider);
      if (parts) {
        const progress = Math.min(1, Math.max(0, -parts[4] / SLIDE_RANGE));
        const reading = READING_OPEN - progress * (READING_OPEN - READING_CLOSED);
        sliderText.textContent = reading.toFixed(2);
      }
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
