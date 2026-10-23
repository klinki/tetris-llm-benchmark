// Two-state theme toggle: system default, or a stored override opposite to it.
const root = document.documentElement;
const media = matchMedia("(prefers-color-scheme: dark)");
const rendered = () => root.dataset.theme ?? (media.matches ? "dark" : "light");

function apply(theme) {
  if (theme) root.dataset.theme = theme;
  else delete root.dataset.theme;
}

document.querySelector(".theme-toggle")?.addEventListener("click", () => {
  const target = rendered() === "dark" ? "light" : "dark";
  const system = media.matches ? "dark" : "light";
  const stored = target === system ? null : target;
  try {
    if (stored) localStorage.setItem("theme", stored);
    else localStorage.removeItem("theme");
  } catch {
    // Storage can be blocked; the theme still applies for this page view.
  }
  apply(stored);
});

addEventListener("storage", (event) => {
  if (event.key === "theme") apply(event.newValue);
});
