const root = document.documentElement;
const themeButton = document.querySelector("[data-theme-toggle]");

function syncTheme() {
  const dark = root.dataset.theme === "dark";
  themeButton?.setAttribute("aria-label", `Switch to ${dark ? "light" : "dark"} theme`);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#131313" : "#ffffff");
}

themeButton?.addEventListener("click", () => {
  root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
  try {
    localStorage.setItem("jl-theme", root.dataset.theme);
  } catch (_) {}
  syncTheme();
});

syncTheme();
