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

document.querySelectorAll(".hotspot[data-card], .figure-hotspot[data-card], [data-nav][data-card]").forEach((el) => {
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
    const words = node.textContent.split(" ");
    words.forEach((word, i) => {
      if (i > 0) frag.appendChild(document.createTextNode(" "));
      if (word === "") return;
      // each word's letters are grouped in a nowrap span - adjacent inline-block
      // letter spans otherwise give the browser a break opportunity mid-word
      const wordWrap = document.createElement("span");
      wordWrap.className = "char-word";
      Array.from(word).forEach((ch) => {
        const span = document.createElement("span");
        span.className = "char";
        span.textContent = ch;
        span.style.animationDelay = delayRef.i * CHAR_STAGGER_MS + "ms";
        delayRef.i++;
        wordWrap.appendChild(span);
      });
      frag.appendChild(wordWrap);
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

// ---------- focus mode: engaging one plate quiets its neighbours ----------
(function () {
  const gateEl = document.getElementById("gate");
  if (!gateEl) return;
  let engaged = 0;
  const focusOn = () => {
    engaged++;
    gateEl.classList.add("is-focusing");
  };
  const focusOff = () => {
    engaged = Math.max(0, engaged - 1);
    if (engaged === 0) gateEl.classList.remove("is-focusing");
  };
  document.querySelectorAll(".figure-hotspot[data-card]").forEach((el) => {
    el.addEventListener("mouseenter", focusOn);
    el.addEventListener("mouseleave", focusOff);
    el.addEventListener("focus", focusOn);
    el.addEventListener("blur", focusOff);
  });
})();

// ---------- the figure tilts gently toward the cursor (desktop, motion-safe) ----------
(function () {
  const gateEl = document.getElementById("gate");
  const wrap = document.getElementById("figureWrap");
  if (!gateEl || !wrap) return;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (reduceMotion || !isFinePointer) return;

  gateEl.addEventListener("mousemove", (e) => {
    const rect = gateEl.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    wrap.querySelector(".vitruvian").style.transform = `rotateY(${px * 5}deg) rotateX(${py * -5}deg)`;
  });
  gateEl.addEventListener("mouseleave", () => {
    wrap.querySelector(".vitruvian").style.transform = "rotateY(0deg) rotateX(0deg)";
  });
})();
