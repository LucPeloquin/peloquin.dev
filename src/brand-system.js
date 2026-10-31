const BRAND_ROOT = "/brand/vct22";

const sectionTreatments = new Map([
  ["top", { pattern: null, glyph: "reticle" }],
  ["career-highlights", { pattern: null, glyph: [] }],
  ["about", { pattern: null, glyph: "horizon-sphere" }],
  ["work", { pattern: null, glyph: [] }],
  ["experience", { pattern: null, glyph: [] }],
  ["principles", { pattern: null, glyph: "orbital-loops" }],
  ["profile", { pattern: null, glyph: ["segmented-cross", "plus-marker"] }],
  ["closing", { pattern: null, glyph: "inward-chevrons" }],
]);

function addSectionTreatment(section, id, treatment) {
  if (!section || section.dataset.brandSection) return;
  section.classList.add("brand-section");
  section.dataset.brandSection = id;

  const light = document.createElement("span");
  if (treatment.pattern) {
    light.className = `brand-light-field brand-light-${treatment.pattern.replace("light-", "").replace("grain-", "")}`;
    light.setAttribute("aria-hidden", "true");
    light.style.setProperty("--brand-light-image", `url(${BRAND_ROOT}/masks/${treatment.pattern}.svg)`);
  }
  const glyphNames = Array.isArray(treatment.glyph) ? treatment.glyph : [treatment.glyph];
  const glyphs = glyphNames.map((name, index) => {
    const glyph = document.createElement("span");
    glyph.className = `brand-section-glyph${index ? " brand-section-glyph-secondary" : ""}`;
    glyph.style.setProperty("--brand-glyph-image", `url(${BRAND_ROOT}/glyphs/${name}.svg)`);
    glyph.setAttribute("aria-hidden", "true");
    return glyph;
  });

  section.prepend(...(treatment.pattern ? [light] : []), ...glyphs);
}

export function initBrandSystem(root = document.body, { reducedMotion = false, theme = "light" } = {}) {
  const scope = root?.querySelector ? root : document.body;
  const sections = [...scope.querySelectorAll("main > section")];
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

  // Track the section at the reading position even when long role details are
  // expanded, and keep navigation useful when reduced motion is enabled.
  let activeSectionFrame = 0;
  const readActiveSection = () => {
    activeSectionFrame = 0;
    const marker = Math.min(window.innerHeight * 0.34, 240);
    const visible = sections.find((section) => {
      const rect = section.getBoundingClientRect();
      return rect.top <= marker && rect.bottom > marker;
    });
    const visibleId = visible?.dataset?.brandSection || visible?.id;
    if (visibleId && visibleId !== activeSection) setActiveSection(visibleId);
  };
  updateActiveSection = () => {
    if (!activeSectionFrame) activeSectionFrame = requestAnimationFrame(readActiveSection);
  };
  window.addEventListener("scroll", updateActiveSection, { passive: true });
  window.addEventListener("resize", updateActiveSection, { passive: true });
  window.addEventListener("hashchange", updateActiveSection, { passive: true });
  updateActiveSection();

  setTheme(theme);

  return {
    setTheme,
    setActiveSection,
    dispose() {
      if (disposed) return;
      disposed = true;
      if (activeSectionFrame) cancelAnimationFrame(activeSectionFrame);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (updateActiveSection) {
        window.removeEventListener("scroll", updateActiveSection);
        window.removeEventListener("resize", updateActiveSection);
        window.removeEventListener("hashchange", updateActiveSection);
      }
      sectionLinks.forEach((link) => link.removeEventListener("click", onSectionLinkClick));
      sections.forEach((section) => {
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
