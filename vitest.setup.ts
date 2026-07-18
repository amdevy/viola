import "@testing-library/jest-dom/vitest";

// jsdom не реалізує scrollIntoView
Element.prototype.scrollIntoView = Element.prototype.scrollIntoView ?? (() => {});
