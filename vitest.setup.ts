import "@testing-library/jest-dom/vitest";

// jsdom не реалізує scrollIntoView
Element.prototype.scrollIntoView = Element.prototype.scrollIntoView ?? (() => {});

// jsdom не реалізує matchMedia (перемикач теми в шапці питає, чи пристрій у
// темному режимі). Заглушка відповідає «ні» — як світлий пристрій.
window.matchMedia =
  window.matchMedia ??
  ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }));
