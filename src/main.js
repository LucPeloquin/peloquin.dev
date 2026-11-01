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
    visualIndex: 1,
    kicker: "Computer Vision",
    title: "VALORANT Barracks Vision",
    description:
      "A research project that turns VALORANT broadcast footage into structured match data. I started with screen capture, OCR, and template matching, then explored YOLO-based detection for scores, timers, player panels, and the minimap.",
    focus: "Locating useful information in a busy broadcast overlay before extracting and matching it.",
    image: "./images/projects/broadcast-vision.webp",
    imageAlt: "Annotated VALORANT broadcast frame with numbered boxes around scores, timers, player panels, and other HUD elements.",
    caption: "Annotated broadcast frame · project research",
    tags: ["Python", "YOLOv8", "OpenCV", "OCR"],
    href: "https://github.com/LucPeloquin/VCT-UI",
  },
  {
    visualIndex: 5,
    kicker: "Marketplace Automation",
    title: "Gardeau",
    description:
      "A marketplace-monitoring product I’m developing for resale shoppers. It brings US and Japanese listings into saved searches, filters by price and size, removes duplicates, and sends matches to Discord or Telegram.",
    focus: "Turning repeated marketplace searches into one monitoring workflow. The product is in development; contact me to discuss it.",
    tags: ["Go", "SQLite", "Browser automation", "Notifications"],
  },
  {
    visualIndex: 6,
    kicker: "AI Vision",
    title: "Vagabot",
    description:
      "A persistent local AI companion to Gardeau. It combines local translation and visual matching with saved marketplace watches and Discord alerts, supporting the research and monitoring behind the product.",
    focus: "Built to run continuously, with local models and PostgreSQL-backed jobs that carry work between scans.",
    tags: ["Rust", "TypeScript", "PostgreSQL", "Local inference"],
  },
  {
    visualIndex: 7,
    defaultView: "study",
    studyLabel: "View waveform",
    imageLabel: "View pipeline diagram",
    kicker: "Senior Design · December 2023",
    title: "Automatic Music Transcription",
    description:
      "My senior capstone project for Fall 2023 to turn audio into musical notation. The team combined MT3 and ScoreTransformer processing with a JUCE interface for handling file types and producing MusicXML and MIDI output.",
    focus: "Our team focused on implementing and building on academic research in automatic music transcription.",
    image: "./images/projects/music-transcription.svg",
    imageAlt: "Illustrative team-project pipeline: audio input passes through MT3 to MIDI, then ScoreTransformer to MusicXML notation, with a JUCE interface for files and output.",
    caption: "Audio → MIDI → notation · illustrative pipeline",
    tags: ["Python", "Machine Learning", "TensorFlow", "NumPy / Librosa", "C++ / JUCE", "MusicXML / MIDI"],
  },
  {
    visualIndex: 2,
    kicker: "Adaptive image processing · 2024",
    title: "Archive Fashion Upscaler",
    description:
      "A desktop and batch-processing tool for restoring and upscaling archived fashion imagery. It combines noise reduction, upscaling, color correction, sharpening, and background removal with a final quality assessment.",
    focus: "Adapting the processing steps to each image instead of applying one preset to an entire batch.",
    tags: ["Python", "OpenCV", "U2Net", "Parallel processing"],
    href: "https://github.com/LucPeloquin/Automatic-Enhancement-of-Fashion-Imagery",
  },
  {
    visualIndex: 3,
    kicker: "Web App · 2026",
    title: "Portfolio OS",
    description:
      "An experimental portfolio inspired by the Nintendo DS, a game console from my childhood. Its dual-screen interface connects a boot sequence, physical-style controls, sound, and touch and keyboard navigation through shared application state.",
    focus: "Making several input methods feel consistent across a complete interface, with reproducible assets and automated tests.",
    tags: ["TypeScript", "Next.js", "Motion", "Web audio"],
    href: "https://github.com/LucPeloquin/flick-owens-dotdev",
  },
  {
    visualIndex: 4,
    kicker: "Browser utility · 2025",
    title: "Quick Save",
    description:
      "A browser extension that saves images, links, video, and audio with Alt-click or a context-menu action. Configurable folders and immediate feedback keep the download workflow quick, without an external data service.",
    focus: "Reducing a repeated browser task to one action while keeping the result visible.",
    tags: ["JavaScript", "Chrome APIs", "Manifest V3", "Privacy"],
    href: "https://github.com/LucPeloquin/InstaDL",
  },
  {
    visualIndex: 0,
    kicker: "Web App · 2026",
    title: "VCT Fantasy",
    description:
      "A fantasy platform for VALORANT fans to build a five-player roster, follow player projections, and compete on leaderboards. Features include an account system, roster rules, public team pages, and scheduled stats sync.",
    focus: "Creating a VALORANT fantasy experience for fans, inspired by traditional American fantasy sports.",
    image: "./images/projects/vct-fantasy-roster.svg",
    imageAlt: "VCT Fantasy roster preview showing five fictional players with silhouette portraits, roles, prices, and projected points.",
    caption: "Fantasy roster preview · fictional player data",
    tags: ["PHP", "SQL", "Data sync", "Product systems"],
    href: "https://github.com/LucPeloquin/VALORANTfantasy",
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

const scrollProgress = document.querySelector("[data-scroll-progress]");
let scrollProgressFrame = 0;

function updateScrollProgress() {
  scrollProgressFrame = 0;
  if (!scrollProgress) return;
  const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const progress = maxScroll === 0 ? 1 : Math.min(1, Math.max(0, window.scrollY / maxScroll));
  scrollProgress.style.setProperty("--scroll-progress", String(progress));
  scrollProgress.setAttribute("aria-valuenow", String(Math.round(progress * 100)));
}

function requestScrollProgressUpdate() {
  if (scrollProgressFrame) return;
  scrollProgressFrame = window.requestAnimationFrame(updateScrollProgress);
}

window.addEventListener("scroll", requestScrollProgressUpdate, { passive: true });
window.addEventListener("resize", requestScrollProgressUpdate, { passive: true });
window.addEventListener("load", requestScrollProgressUpdate, { once: true });
updateScrollProgress();

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
const projectFocus = document.querySelector("[data-project-focus]");
const projectInquiry = document.querySelector("[data-project-inquiry]");
const projectEvidence = document.querySelector("[data-project-evidence]");
const projectImage = document.querySelector("[data-project-image]");
const projectCaption = document.querySelector("[data-project-caption]");
const projectViewToggle = document.querySelector("[data-project-view-toggle]");
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

function setProjectView(showStudy) {
  const project = projects[activeProject];
  const hasImage = Boolean(project.image);
  const hasStudy = Number.isInteger(project.visualIndex);
  const showImage = hasImage && (!hasStudy || !showStudy);
  workVisualStage.dataset.projectView = showImage ? "image" : "study";
  projectEvidence.hidden = !showImage;
  workVisualCanvas.hidden = showImage;
  projectViewToggle.hidden = !hasImage || !hasStudy;
  projectViewToggle.setAttribute("aria-pressed", String(hasImage && hasStudy && showStudy));
  projectViewToggle.textContent = showImage
    ? project.studyLabel ?? "Explore 3D study"
    : project.imageLabel ?? "View project image";
}

function renderProject(index, { focus = false } = {}) {
  activeProject = (index + projects.length) % projects.length;
  const project = projects[activeProject];
  projectKicker.textContent = project.kicker;
  projectTitle.textContent = project.title;
  projectDescription.textContent = project.description;
  projectFocus.textContent = project.focus;
  projectInquiry.hidden = Boolean(project.href);
  projectInquiry.firstChild.textContent = `Ask about ${project.title} `;
  if (project.image) {
    projectImage.src = project.image;
    projectImage.alt = project.imageAlt;
    projectCaption.textContent = project.caption;
  } else {
    projectImage.removeAttribute("src");
    projectImage.alt = "";
    projectCaption.textContent = "";
  }
  setProjectView(project.defaultView === "study");
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

  projectPosters.forEach((poster) => {
    const selected = Number(poster.dataset.projectPoster) === project.visualIndex;
    poster.hidden = !selected;
    poster.classList.toggle("is-active", selected);
  });

  if (Number.isInteger(project.visualIndex)) {
    if (workVisualController) workVisualController.setProject(project.visualIndex);
    else if (workVisualStage.dataset.workVisualState !== "fallback") loadWorkVisual();
  }
  brandSystem.setActiveSection("work");

  const activeTab = projectTabs[activeProject];
  projectPanel?.setAttribute("aria-labelledby", activeTab?.id ?? "");
  if (activeTab && projectTabs[0]?.parentElement) {
    const tabList = activeTab.parentElement;
    if (tabList.scrollWidth > tabList.clientWidth) {
      tabList.scrollTo({ left: activeTab.offsetLeft - tabList.offsetLeft, behavior: prefersReducedMotion.matches ? "auto" : "smooth" });
    }
  }
  if (focus) activeTab?.focus();
}

projectViewToggle?.addEventListener("click", () => {
  setProjectView(workVisualStage.dataset.projectView !== "study");
});

// Populate the initial image without changing scroll position or the active section.
if (projectImage && projectViewToggle) {
  projectImage.src = projects[0].image;
  projectImage.alt = projects[0].imageAlt;
  projectCaption.textContent = projects[0].caption;
  setProjectView(false);
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
  if (!Number.isInteger(projects[activeProject].visualIndex)) return;
  workVisualLoading = true;
  workVisualStage.dataset.workVisualState = "loading";
  try {
    const { initWorkVisual } = await import("./work-visual.js");
    // A project may change while the renderer chunk is being fetched.
    if (!Number.isInteger(projects[activeProject].visualIndex)) return;
    workVisualController = initWorkVisual(workVisualCanvas, workVisualStage, {
      initialProject: projects[activeProject].visualIndex,
      reducedMotion: prefersReducedMotion.matches,
      theme: currentTheme(),
    });
  } catch (error) {
    console.error("Selected Work 3D visual failed to initialize", error);
    workVisualStage.dataset.workVisualState = "fallback";
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

// Manual photo gallery: buttons, arrow keys, and native touch scrolling.
const profilePhotoTrack = document.querySelector("[data-profile-photo-track]");
const profilePhotos = [...document.querySelectorAll("[data-profile-photo]")];
const profilePhotoCounter = document.querySelector("[data-profile-photo-current]");
let activeProfilePhoto = 0;
let profilePhotoScrollTimer;

if (profilePhotoTrack && profilePhotos.length > 1) {
  document.querySelector("[data-profile-photo-controls]").hidden = false;
  const updatePhotoCounter = () => {
    profilePhotoCounter.textContent = `${activeProfilePhoto + 1} / ${profilePhotos.length}`;
  };
  const showProfilePhoto = (index) => {
    activeProfilePhoto = (index + profilePhotos.length) % profilePhotos.length;
    profilePhotoTrack.scrollTo({
      left: activeProfilePhoto * profilePhotoTrack.clientWidth,
      behavior: prefersReducedMotion.matches ? "auto" : "smooth",
    });
    updatePhotoCounter();
  };
  document.querySelector("[data-profile-photo-prev]").addEventListener("click", () => showProfilePhoto(activeProfilePhoto - 1));
  document.querySelector("[data-profile-photo-next]").addEventListener("click", () => showProfilePhoto(activeProfilePhoto + 1));
  profilePhotoTrack.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    showProfilePhoto(event.key === "Home" ? 0 : event.key === "End" ? profilePhotos.length - 1 : activeProfilePhoto + (event.key === "ArrowRight" ? 1 : -1));
  });
  profilePhotoTrack.addEventListener("scroll", () => {
    window.clearTimeout(profilePhotoScrollTimer);
    profilePhotoScrollTimer = window.setTimeout(() => {
      activeProfilePhoto = Math.max(0, Math.min(profilePhotos.length - 1,
        Math.round(profilePhotoTrack.scrollLeft / Math.max(1, profilePhotoTrack.clientWidth))));
      updatePhotoCounter();
    }, 150);
  }, { passive: true });
  window.addEventListener("resize", () => {
    profilePhotoTrack.scrollTo({ left: activeProfilePhoto * profilePhotoTrack.clientWidth, behavior: "auto" });
  }, { passive: true });
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
