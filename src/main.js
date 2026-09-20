import "./style.css";
import "./brand-system.css";
import { initBrandSystem } from "./brand-system.js";
import { LOGO_ASCII } from "./generated/logo-ascii.js";

const root = document.documentElement;
const brandSystem = initBrandSystem(document.body, {
  reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  theme: root.dataset.theme === "dark" ? "dark" : "light",
});
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const bootScreen = document.querySelector("[data-boot-screen]");
const bootLogo = bootScreen?.querySelector("[data-boot-logo]");
const bootCounter = bootScreen?.querySelector("[data-boot-counter]");
const bootProgress = bootScreen?.querySelector("[data-boot-progress]");
const bootStatus = bootScreen?.querySelector("[data-boot-status]");
const bootStartedAt = performance.now();
let bootFrameId = 0;
let bootCompletionRequested = false;

if (bootLogo) bootLogo.textContent = LOGO_ASCII;

function setBootProgress(value) {
  const progress = Math.min(100, Math.max(0, value));
  if (bootCounter) bootCounter.textContent = String(Math.round(progress)).padStart(3, "0");
  if (bootProgress) bootProgress.style.transform = `scaleX(${progress / 100})`;
}

function animateBootProgress(now) {
  if (!bootScreen?.isConnected) return;
  const duration = prefersReducedMotion.matches ? 280 : 1500;
  setBootProgress(Math.min(94, ((now - bootStartedAt) / duration) * 100));
  bootFrameId = requestAnimationFrame(animateBootProgress);
}

function completeBoot() {
  if (bootCompletionRequested || !bootScreen) return;
  bootCompletionRequested = true;
  const minimumDuration = prefersReducedMotion.matches ? 240 : 1500;
  const remaining = Math.max(0, minimumDuration - (performance.now() - bootStartedAt));

  window.setTimeout(() => {
    if (bootFrameId) cancelAnimationFrame(bootFrameId);
    setBootProgress(100);
    if (bootStatus) bootStatus.textContent = "SYSTEM READY";
    bootScreen.classList.add("is-ready");

    window.setTimeout(() => {
      window.clearTimeout(window.__jlBootWatchdog);
      bootScreen.classList.add("is-exiting");
      root.classList.remove("booting");
      window.setTimeout(() => bootScreen.remove(), prefersReducedMotion.matches ? 20 : 540);
    }, prefersReducedMotion.matches ? 20 : 150);
  }, remaining);
}

if (bootScreen) bootFrameId = requestAnimationFrame(animateBootProgress);

const projects = [
  {
    kicker: "Full-stack product · 2026",
    title: "VCT Fantasy",
    description:
      "A multi-page fantasy product for professional VALORANT: authentication, constrained roster building, player projections, public teams, leaderboards, generated share cards, admin tooling, and scheduled VLR data sync.",
    tags: ["PHP", "SQL", "Data sync", "Product systems"],
    href: "https://github.com/LucPeloquin/VALORANTfantasy",
  },
  {
    kicker: "Computer vision · Evolving R&D",
    title: "Broadcast Vision",
    description:
      "An evolving vision system that converts esports broadcasts into structured match data. It began with screen capture, OCR, fuzzy matching, and weapon templates, then moved toward YOLO-based detection for scores, timers, player panels, agents, and the minimap.",
    tags: ["Python", "YOLOv8", "OpenCV", "OCR"],
    href: "https://github.com/LucPeloquin/VCT-UI",
  },
  {
    kicker: "Adaptive image processing · 2024",
    title: "Fashion Enhancer",
    description:
      "A desktop and batch-processing pipeline that inspects each fashion image before choosing its enhancement path: denoising, Lanczos upscaling, LAB and CLAHE corrections, sharpening, shadow recovery, segmentation, background removal, and final quality assessment.",
    tags: ["Python", "OpenCV", "U2Net", "Parallel processing"],
    href: "https://github.com/LucPeloquin/Automatic-Enhancement-of-Fashion-Imagery",
  },
  {
    kicker: "Experimental interface · 2026",
    title: "Portfolio OS",
    description:
      "An interactive portfolio treated as a complete interface system: a dual-screen firmware metaphor, boot sequence, physical-style controls, sound, touch and keyboard navigation, motion, state management, deterministic asset tooling, and automated tests.",
    tags: ["TypeScript", "Next.js", "Motion", "Web audio"],
    href: "https://github.com/LucPeloquin/flick-owens-dotdev",
  },
  {
    kicker: "Browser utility · 2025",
    title: "Quick Save",
    description:
      "A focused Manifest V3 extension for saving images, links, video, and audio with Alt-click or a context-menu action. It includes configurable download folders, immediate visual feedback, and no external data service.",
    tags: ["JavaScript", "Chrome APIs", "Manifest V3", "Privacy"],
    href: "https://github.com/LucPeloquin/InstaDL",
  },
  {
    kicker: "Business in development · Marketplace automation",
    title: "Gardeau",
    description:
      "A business I’m building to help people find the resale listings they care about. Gardeau brings US and Japanese marketplaces into one monitoring workflow: saved searches, price and size filters, duplicate detection, and timely Discord or Telegram alerts. A Go backend, SQLite storage, browser automation, and a web dashboard power the product as it develops.",
    tags: ["Go", "SQLite", "Browser automation", "Notifications"],
  },
];

function formatClock(zone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(new Date());
  const get = (type) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("hour")}:${get("minute")} ${get("dayPeriod")}`;
}

function updateClocks() {
  document.querySelectorAll("[data-clock]").forEach((clock) => {
    const time = formatClock(clock.dataset.zone);
    clock.querySelectorAll("[data-clock-time]").forEach((node) => {
      node.textContent = time;
    });
    clock.dateTime = new Date().toISOString();
  });
}

updateClocks();
window.setInterval(updateClocks, 15_000);
document.querySelectorAll("[data-year]").forEach((year) => {
  year.textContent = new Date().getFullYear();
});

function currentTheme() {
  return root.dataset.theme === "dark" ? "dark" : "light";
}

function syncThemeControls() {
  const nextTheme = currentTheme() === "dark" ? "light" : "dark";
  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.setAttribute("aria-label", `Switch to ${nextTheme} theme`);
  });
  document.querySelector('meta[name="theme-color"]')?.setAttribute(
    "content",
    currentTheme() === "dark" ? "#131313" : "#ffffff",
  );
}

function applyTheme(theme) {
  root.dataset.theme = theme;
  try {
    localStorage.setItem("jl-theme", theme);
  } catch (_) {}
  syncThemeControls();
  brandSystem.setTheme(theme);
  window.dispatchEvent(new CustomEvent("jl:theme", { detail: { theme } }));
}

function toggleTheme() {
  const nextTheme = currentTheme() === "dark" ? "light" : "dark";
  if (document.startViewTransition && !prefersReducedMotion.matches) {
    document.startViewTransition(() => applyTheme(nextTheme));
  } else {
    applyTheme(nextTheme);
  }
}

document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
  button.addEventListener("click", toggleTheme);
});
syncThemeControls();

const menuDialog = document.querySelector("[data-menu-dialog]");
const contactDialog = document.querySelector("[data-contact-dialog]");

function setModalQuery(value) {
  const url = new URL(window.location.href);
  if (value) url.searchParams.set("modal", value);
  else url.searchParams.delete("modal");
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

const dialogReturnFocus = new WeakMap();

function openDialog(dialog, returnFocus = document.activeElement) {
  if (!dialog || dialog.open) return;
  if (returnFocus instanceof HTMLElement) dialogReturnFocus.set(dialog, returnFocus);
  dialog.showModal();
}

function closeDialog(dialog) {
  if (dialog?.open) dialog.close();
}

document.querySelector("[data-menu-open]")?.addEventListener("click", (event) => {
  openDialog(menuDialog, event.currentTarget);
});

document.querySelector("[data-menu-close]")?.addEventListener("click", () => {
  closeDialog(menuDialog);
});

document.querySelectorAll("[data-menu-link]").forEach((control) => {
  control.addEventListener("click", () => closeDialog(menuDialog));
});

document.querySelectorAll("[data-contact-open]").forEach((button) => {
  button.addEventListener("click", () => {
    const menuWasOpen = menuDialog?.open;
    const returnFocus = menuWasOpen ? document.querySelector("[data-menu-open]") : button;
    closeDialog(menuDialog);
    window.setTimeout(() => {
      openDialog(contactDialog, returnFocus);
      setModalQuery("contact");
    }, menuWasOpen ? 120 : 0);
  });
});

document.querySelector("[data-contact-close]")?.addEventListener("click", () => {
  closeDialog(contactDialog);
});

function restoreDialogFocus(dialog) {
  const returnFocus = dialogReturnFocus.get(dialog);
  dialogReturnFocus.delete(dialog);
  if (returnFocus?.isConnected && typeof returnFocus.focus === "function") {
    window.requestAnimationFrame(() => returnFocus.focus());
  }
}

menuDialog?.addEventListener("close", () => restoreDialogFocus(menuDialog));
contactDialog?.addEventListener("close", () => {
  setModalQuery(null);
  restoreDialogFocus(contactDialog);
});

[menuDialog, contactDialog].forEach((dialog) => {
  dialog?.addEventListener("click", (event) => {
    if (event.target === dialog) closeDialog(dialog);
  });
});

if (new URL(window.location.href).searchParams.get("modal") === "contact") {
  window.requestAnimationFrame(() => openDialog(contactDialog));
}

const toast = document.querySelector("[data-toast]");
let toastTimeout;

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

document.querySelector("[data-copy-email]")?.addEventListener("click", async () => {
  const email = "lucpeloquin77@gmail.com";
  try {
    await navigator.clipboard.writeText(email);
    showToast("Email copied");
  } catch (_) {
    const textArea = document.createElement("textarea");
    textArea.value = email;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.append(textArea);
    textArea.select();
    document.execCommand("copy");
    textArea.remove();
    showToast("Email copied");
  }
});

const revealNodes = document.querySelectorAll("[data-reveal]");
if (prefersReducedMotion.matches || !("IntersectionObserver" in window)) {
  revealNodes.forEach((node) => node.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -8%", threshold: 0.08 },
  );
  revealNodes.forEach((node) => revealObserver.observe(node));
}

const githubActivity = document.querySelector("[data-github-activity]");
const githubActivityGrid = githubActivity?.querySelector("[data-github-activity-grid]");
const githubActivityStatus = githubActivity?.querySelector("[data-github-activity-status]");
const ACTIVITY_WEEKS = 20;
const ACTIVITY_DAYS = ACTIVITY_WEEKS * 7;

function utcDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function createActivityRange() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setUTCDate(today.getUTCDate() - today.getUTCDay() - (ACTIVITY_WEEKS - 1) * 7);
  return Array.from({ length: ACTIVITY_DAYS }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    return date;
  });
}

function activityLevel(count) {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4;
}

function renderGithubActivity(counts = new Map(), { loading = false } = {}) {
  if (!githubActivityGrid) return { activeDays: 0, totalPushes: 0 };
  let activeDays = 0;
  let totalPushes = 0;
  const todayKey = utcDateKey(new Date());
  const cells = createActivityRange().map((date, index) => {
    const key = utcDateKey(date);
    const count = counts.get(key) ?? 0;
    if (count > 0) activeDays += 1;
    totalPushes += count;
    const cell = document.createElement("i");
    cell.dataset.level = String(loading ? (index % 11 === 0 ? 1 : 0) : activityLevel(count));
    cell.setAttribute("aria-hidden", "true");
    cell.title = key > todayKey ? `${key} · upcoming` : `${key} · ${count} public push${count === 1 ? "" : "es"}`;
    return cell;
  });
  githubActivityGrid.replaceChildren(...cells);
  return { activeDays, totalPushes };
}

async function loadGithubActivity() {
  if (!githubActivity || !githubActivityGrid || !githubActivityStatus) return;
  renderGithubActivity(new Map(), { loading: true });
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch("https://api.github.com/users/LucPeloquin/events/public?per_page=100", {
      headers: { Accept: "application/vnd.github+json" },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
    const events = await response.json();
    const counts = new Map();
    for (const event of events) {
      if (event.type !== "PushEvent" || !event.created_at) continue;
      const key = event.created_at.slice(0, 10);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const { activeDays, totalPushes } = renderGithubActivity(counts);
    githubActivity.dataset.activityState = "ready";
    githubActivityStatus.textContent = `${activeDays} active day${activeDays === 1 ? "" : "s"} · ${totalPushes} public push${totalPushes === 1 ? "" : "es"}`;
    githubActivityGrid.setAttribute(
      "aria-label",
      `Recent public GitHub activity: ${totalPushes} pushes across ${activeDays} active days in the available event window.`,
    );
  } catch (error) {
    console.warn("GitHub activity could not be loaded", error);
    renderGithubActivity();
    githubActivity.dataset.activityState = "fallback";
    githubActivityStatus.textContent = "Live activity available on GitHub";
    githubActivityGrid.setAttribute("aria-label", "Recent activity is temporarily unavailable. Open Jean-Luc's GitHub profile for live activity.");
  } finally {
    window.clearTimeout(timeout);
  }
}

loadGithubActivity();

const aboutSection = document.querySelector("#about");
const capabilityList = document.querySelector("[data-capability-list]");
const capabilityCanvas = document.querySelector("[data-capability-canvas]");
const capabilityStages = [...document.querySelectorAll("[data-capability-stage]")];
let capabilityVisualController;
let capabilityVisualLoading = false;

async function loadCapabilityVisuals() {
  if (!capabilityList || !capabilityCanvas || capabilityVisualController || capabilityVisualLoading) return;
  capabilityVisualLoading = true;
  capabilityList.dataset.capabilityRenderState = "loading";
  try {
    const { initCapabilityVisuals } = await import("./capability-visuals.js");
    capabilityVisualController = initCapabilityVisuals(capabilityCanvas, capabilityStages, {
      reducedMotion: prefersReducedMotion.matches,
      theme: currentTheme(),
    });
  } catch (error) {
    console.error("Capability 3D visuals failed to initialize", error);
    capabilityList.dataset.capabilityRenderState = "fallback";
    capabilityList.dataset.capabilityVisible = "false";
  } finally {
    capabilityVisualLoading = false;
  }
}

if (aboutSection && capabilityCanvas && "IntersectionObserver" in window) {
  const capabilityLoadObserver = new IntersectionObserver(
    ([entry], observer) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      loadCapabilityVisuals();
    },
    { rootMargin: "700px 0px", threshold: 0 },
  );
  capabilityLoadObserver.observe(aboutSection);
} else if (capabilityCanvas) {
  loadCapabilityVisuals();
}

const projectTabs = [...document.querySelectorAll("[data-project-tab]")];
const projectPosters = [...document.querySelectorAll("[data-project-poster]")];
const projectTitle = document.querySelector("[data-project-title]");
const projectKicker = document.querySelector("[data-project-kicker]");
const projectDescription = document.querySelector("[data-project-description]");
const projectTags = document.querySelector("[data-project-tags]");
const projectLink = document.querySelector("[data-project-link]");
const projectCurrent = document.querySelector("[data-project-current]");
const projectPanel = document.querySelector("#project-panel");
const workSection = document.querySelector("#work");
const workVisualStage = document.querySelector("[data-work-visual-stage]");
const workVisualCanvas = document.querySelector("[data-work-visual-canvas]");
let activeProject = 0;
let workVisualController;
let workVisualLoading = false;

function renderProject(index, { focus = false } = {}) {
  activeProject = (index + projects.length) % projects.length;
  const project = projects[activeProject];
  projectKicker.textContent = project.kicker;
  projectTitle.textContent = project.title;
  projectDescription.textContent = project.description;
  projectTags.replaceChildren(
    ...project.tags.map((tag) => {
      const item = document.createElement("li");
      item.textContent = tag;
      return item;
    }),
  );
  projectLink.hidden = !project.href;
  if (project.href) projectLink.href = project.href;
  else projectLink.removeAttribute("href");
  projectCurrent.textContent = String(activeProject + 1).padStart(2, "0");

  projectTabs.forEach((tab, tabIndex) => {
    const selected = tabIndex === activeProject;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });

  projectPosters.forEach((poster, posterIndex) => {
    const selected = posterIndex === activeProject;
    poster.hidden = !selected;
    poster.classList.toggle("is-active", selected);
  });

  workVisualController?.setProject(activeProject);
  brandSystem.setActiveSection("work");

  const activeTab = projectTabs[activeProject];
  projectPanel?.setAttribute("aria-labelledby", activeTab?.id ?? "");
  activeTab?.scrollIntoView({ behavior: prefersReducedMotion.matches ? "auto" : "smooth", block: "nearest", inline: "center" });
  if (focus) activeTab?.focus();
}

projectTabs.forEach((tab, index) => {
  tab.addEventListener("click", () => renderProject(index));
  tab.addEventListener("keydown", (event) => {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? projectTabs.length - 1 : activeProject + (event.key === "ArrowRight" ? 1 : -1);
    renderProject(nextIndex, { focus: true });
  });
});

document.querySelector("[data-project-prev]")?.addEventListener("click", () => renderProject(activeProject - 1));
document.querySelector("[data-project-next]")?.addEventListener("click", () => renderProject(activeProject + 1));

async function loadWorkVisual() {
  if (!workVisualCanvas || !workVisualStage || workVisualController || workVisualLoading) return;
  workVisualLoading = true;
  workVisualStage.dataset.workVisualState = "loading";
  try {
    const { initWorkVisual } = await import("./work-visual.js");
    workVisualController = initWorkVisual(workVisualCanvas, workVisualStage, {
      initialProject: activeProject,
      reducedMotion: prefersReducedMotion.matches,
      theme: currentTheme(),
    });
  } catch (error) {
    console.error("Selected Work 3D visual failed to initialize", error);
    workVisualStage.dataset.workVisualState = "fallback";
    const status = workVisualStage.querySelector("[data-work-visual-status]");
    if (status) status.textContent = "CSS / FALLBACK";
  } finally {
    workVisualLoading = false;
  }
}

window.addEventListener("jl:theme", (event) => {
  capabilityVisualController?.setTheme(event.detail?.theme ?? currentTheme());
  workVisualController?.setTheme(event.detail?.theme ?? currentTheme());
});

if (workSection && workVisualStage && workVisualCanvas && "IntersectionObserver" in window) {
  const workLoadObserver = new IntersectionObserver(
    ([entry], observer) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      loadWorkVisual();
    },
    { rootMargin: "700px 0px", threshold: 0 },
  );
  workLoadObserver.observe(workSection);
} else if (workVisualStage && workVisualCanvas) {
  loadWorkVisual();
}

window.addEventListener("pagehide", (event) => {
  if (!event.persisted) {
    capabilityVisualController?.dispose();
    workVisualController?.dispose();
    brandSystem.dispose();
  }
});

const noteSlides = [...document.querySelectorAll("[data-note-slide]")];
const noteCurrent = document.querySelector("[data-note-current]");
const noteToggle = document.querySelector("[data-note-toggle]");
const principlesSection = document.querySelector("#principles");
let activeNote = 0;
let noteTimer;
let notePaused = false;
let noteInView = false;

function renderNote(index) {
  activeNote = (index + noteSlides.length) % noteSlides.length;
  noteSlides.forEach((slide, slideIndex) => {
    const selected = slideIndex === activeNote;
    slide.hidden = !selected;
    slide.classList.toggle("is-active", selected);
  });
  noteCurrent.textContent = String(activeNote + 1).padStart(2, "0");
}

function startNoteTimer() {
  window.clearInterval(noteTimer);
  if (prefersReducedMotion.matches || notePaused) return;
  noteTimer = window.setInterval(() => renderNote(activeNote + 1), 6500);
}

function syncNoteToggle() {
  if (!noteToggle) return;
  noteToggle.textContent = notePaused ? "Resume" : "Pause";
  noteToggle.setAttribute("aria-label", `${notePaused ? "Resume" : "Pause"} principles carousel`);
  noteToggle.setAttribute("aria-pressed", String(notePaused));
}

function pauseNotes() {
  notePaused = true;
  window.clearInterval(noteTimer);
  syncNoteToggle();
}

function moveNote(direction) {
  pauseNotes();
  renderNote(activeNote + direction);
}

document.querySelector("[data-note-prev]")?.addEventListener("click", () => moveNote(-1));
document.querySelector("[data-note-next]")?.addEventListener("click", () => moveNote(1));
noteToggle?.addEventListener("click", () => {
  notePaused = !notePaused;
  syncNoteToggle();
  if (notePaused) window.clearInterval(noteTimer);
  else if (noteInView) startNoteTimer();
});
syncNoteToggle();

if (principlesSection && "IntersectionObserver" in window) {
  const noteObserver = new IntersectionObserver(
    ([entry]) => {
      noteInView = entry.isIntersecting;
      if (noteInView) startNoteTimer();
      else window.clearInterval(noteTimer);
    },
    { threshold: 0.25 },
  );
  noteObserver.observe(principlesSection);
}

const artifactCanvas = document.querySelector("#artifact-canvas");
const artifactStage = document.querySelector("[data-artifact-stage]");
let artifactReady = Promise.resolve();
if (artifactCanvas && artifactStage) {
  artifactReady = import("./artifact.js")
    .then(async ({ initArtifact }) => {
      await initArtifact(artifactCanvas, artifactStage, { reducedMotion: prefersReducedMotion.matches });
    })
    .catch((error) => {
      console.error("3D artifact failed to initialize", error);
      artifactStage.dataset.artifactState = "failed";
      artifactStage.classList.remove("artifact-loading", "artifact-ready");
      artifactStage.classList.add("artifact-failed");
      const status = document.querySelector("[data-artifact-status]");
      if (status) status.textContent = "STATIC SVG";
    });
}

const pageLoaded =
  document.readyState === "complete"
    ? Promise.resolve()
    : new Promise((resolve) => window.addEventListener("load", resolve, { once: true }));

Promise.allSettled([pageLoaded, artifactReady]).then(completeBoot);
