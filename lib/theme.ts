/**
 * The visitor's light / dark choice. How the colours switch is described at
 * the top of app/globals.css.
 *
 * No choice stored means "as the device is set": <html> then has no
 * data-theme and the CSS follows prefers-color-scheme on its own, also when
 * the phone switches to dark in the evening. A choice is stored in
 * localStorage and put on <html> as data-theme="light" | "dark".
 */

export type Theme = "light" | "dark";

const STORAGE_KEY = "theme";
const CHANGE_EVENT = "themechange";
const DARK_QUERY = "(prefers-color-scheme: dark)";

/**
 * Inline in <head>, before anything is painted: puts a stored choice back on
 * <html>, so a visitor who picked dark does not see the light page flash first.
 */
export const themeInitScript = [
  "try{",
  `var t=localStorage.getItem(${JSON.stringify(STORAGE_KEY)});`,
  'if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)',
  "}catch(e){}",
].join("");

/** The theme the page is showing right now. */
export function currentTheme(): Theme {
  const chosen = document.documentElement.getAttribute("data-theme");
  if (chosen === "light" || chosen === "dark") return chosen;
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

/** Shows `theme` and remembers it for the next visits. */
export function setTheme(theme: Theme): void {
  apply(theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Private mode or storage switched off: the choice lasts until reload.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/**
 * For useSyncExternalStore: calls back when the shown theme may have changed —
 * a choice made here or in another tab, or the device switching while no
 * choice is stored.
 */
export function subscribeTheme(onChange: () => void): () => void {
  const media = window.matchMedia(DARK_QUERY);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;
    apply(e.newValue === "light" || e.newValue === "dark" ? e.newValue : null);
    onChange();
  };
  media.addEventListener("change", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    media.removeEventListener("change", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/**
 * Sets data-theme with transitions paused for a frame: the buttons and links
 * have transition-colors, and without the pause each would fade to its new
 * colour at its own pace while the page background switches at once.
 */
function apply(theme: Theme | null): void {
  const root = document.documentElement;
  root.setAttribute("data-theme-switching", "");
  if (theme) root.setAttribute("data-theme", theme);
  else root.removeAttribute("data-theme");
  // Reading a style makes the browser apply the new colours now, while
  // transitions are still off.
  void window.getComputedStyle(root).color;
  requestAnimationFrame(() => root.removeAttribute("data-theme-switching"));
}
