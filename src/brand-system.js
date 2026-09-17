const BRAND_ROOT = "/brand/vct22";

const sectionTreatments = new Map([
  ["top", { pattern: "light-convergence", glyph: ["reticle", "radial-burst"] }],
  ["about", { pattern: "light-radial", glyph: "horizon-sphere" }],
  ["work", { pattern: "light-diagonal", glyph: "corner-brackets" }],
  ["principles", { pattern: "grain-purple", glyph: "orbital-loops" }],
  ["profile", { pattern: "light-convergence", glyph: ["segmented-cross", "plus-marker"] }],
  ["closing", { pattern: "light-radial", glyph: "inward-chevrons" }],
]);

function addSectionTreatment(section, id, treatment) {
  if (!section || section.querySelector(".brand-light-field")) return;
  section.classList.add("brand-section");
  section.dataset.brandSection = id;

  const light = document.createElement("span");
  light.className = `brand-light-field brand-light-${treatment.pattern.replace("light-", "").replace("grain-", "")}`;
  light.setAttribute("aria-hidden", "true");
  light.style.setProperty("--brand-light-image", `url(${BRAND_ROOT}/masks/${treatment.pattern}.svg)`);

  const glyphNames = Array.isArray(treatment.glyph) ? treatment.glyph : [treatment.glyph];
  const glyphs = glyphNames.map((name, index) => {
    const glyph = document.createElement("span");
    glyph.className = `brand-section-glyph${index ? " brand-section-glyph-secondary" : ""}`;
    glyph.style.setProperty("--brand-glyph-image", `url(${BRAND_ROOT}/glyphs/${name}.svg)`);
    glyph.setAttribute("aria-hidden", "true");
    return glyph;
  });

  section.prepend(light, ...glyphs);
}

export function initBrandSystem(root = document.body, { reducedMotion = false, theme = "light" } = {}) {
  const scope = root?.querySelector ? root : document.body;
  const sections = [...scope.querySelectorAll("main > section")];
  const observedSections = [];
  let updateActiveSection;
  let disposed = false;
  let activeSection = "top";
  const sectionLinks = [...scope.querySelectorAll('.desktop-nav a[href^="#"], .site-menu a[href^="#"]')];

  sections.forEach((section) => {
    const id = section.id || (section.classList.contains("closing") ? "closing" : "section");
    const treatment = sectionTreatments.get(id);
    if (treatment) addSectionTreatment(section, id, treatment);
  });

  const setState = () => {
    scope.dataset.brandMotion = reducedMotion || document.hidden ? "static" : "active";
    scope.dataset.brandActiveSection = activeSection;
    scope.dataset.brandTheme = theme;
  };

  const setActiveSection = (id) => {
    if (!sectionTreatments.has(id)) return;
    activeSection = id;
    sections.forEach((section) => {
      section.dataset.brandActive = String(section.dataset.brandSection === id);
    });
    sectionLinks.forEach((link) => {
      const selected = link.getAttribute("href") === `#${id}`;
      link.dataset.brandActive = String(selected);
      if (selected) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    setState();
  };

  const setTheme = (nextTheme) => {
    theme = nextTheme === "dark" ? "dark" : "light";
    setState();
  };

  const onSectionLinkClick = (event) => {
    const id = event.currentTarget.getAttribute("href")?.slice(1);
    if (id) setActiveSection(id);
  };
  sectionLinks.forEach((link) => link.addEventListener("click", onSectionLinkClick));

  const onVisibilityChange = () => setState();
  document.addEventListener("visibilitychange", onVisibilityChange, { passive: true });
  setActiveSection("top");

  if ("IntersectionObserver" in window && !reducedMotion) {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const visibleId = visible?.target?.dataset?.brandSection || visible?.target?.id;
        if (visibleId) setActiveSection(visibleId);
      },
      { rootMargin: "-18% 0px -55%", threshold: [0.08, 0.3, 0.6] },
    );
    sections.forEach((section) => {
      observer.observe(section);
      observedSections.push(section);
    });
    scope.__jlBrandObserver = observer;
  } else if (!reducedMotion) {
    updateActiveSection = () => {
      const marker = window.innerHeight * 0.34;
      const visible = sections
        .map((section) => ({ section, rect: section.getBoundingClientRect() }))
        .filter(({ rect }) => rect.top <= marker && rect.bottom >= marker)
        .sort((a, b) => Math.abs(a.rect.top - marker) - Math.abs(b.rect.top - marker))[0];
      const visibleId = visible?.section?.dataset?.brandSection || visible?.section?.id;
      if (visibleId) setActiveSection(visibleId);
    };
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection, { passive: true });
    window.addEventListener("hashchange", updateActiveSection, { passive: true });
    updateActiveSection();
  }

  setTheme(theme);

  return {
    setTheme,
    setActiveSection,
    dispose() {
      if (disposed) return;
      disposed = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (updateActiveSection) {
        window.removeEventListener("scroll", updateActiveSection);
        window.removeEventListener("resize", updateActiveSection);
        window.removeEventListener("hashchange", updateActiveSection);
      }
      sectionLinks.forEach((link) => link.removeEventListener("click", onSectionLinkClick));
      scope.__jlBrandObserver?.disconnect();
      delete scope.__jlBrandObserver;
      observedSections.forEach((section) => {
        section.querySelector(".brand-light-field")?.remove();
        section.querySelectorAll(".brand-section-glyph").forEach((glyph) => glyph.remove());
        delete section.dataset.brandSection;
        delete section.dataset.brandActive;
      });
      sectionLinks.forEach((link) => {
        delete link.dataset.brandActive;
        link.removeAttribute("aria-current");
      });
      delete scope.dataset.brandMotion;
      delete scope.dataset.brandActiveSection;
      delete scope.dataset.brandTheme;
    },
  };
}
