import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ThemeToggle from "@/components/layout/ThemeToggle";
import { currentTheme, themeInitScript } from "@/lib/theme";
import uk from "@/messages/uk.json";

vi.mock("next-intl", () => ({
  useTranslations: (ns: string) => (key: string) =>
    ((uk as Record<string, Record<string, string>>)[ns] ?? {})[key] ?? `${ns}.${key}`,
}));

const ga = vi.hoisted(() => ({ sendGAEvent: vi.fn() }));
vi.mock("@/lib/analytics", () => ga);

const root = document.documentElement;

beforeEach(() => {
  localStorage.clear();
  root.removeAttribute("data-theme");
  ga.sendGAEvent.mockClear();
});

describe("скрипт у <head>", () => {
  it("повертає збережену темну тему до першого малювання", () => {
    localStorage.setItem("theme", "dark");
    new Function(themeInitScript)();
    expect(root.getAttribute("data-theme")).toBe("dark");
  });

  it("без вибору нічого не ставить — тему визначає пристрій", () => {
    new Function(themeInitScript)();
    expect(root.hasAttribute("data-theme")).toBe(false);
  });

  it("ігнорує сміття у сховищі", () => {
    localStorage.setItem("theme", "purple");
    new Function(themeInitScript)();
    expect(root.hasAttribute("data-theme")).toBe(false);
  });
});

describe("перемикач теми", () => {
  it("на світлому пристрої вмикає темну тему і запам'ятовує її", async () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button", { name: "Темна тема" });
    expect(button).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(button);

    expect(root.getAttribute("data-theme")).toBe("dark");
    expect(localStorage.getItem("theme")).toBe("dark");
    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(ga.sendGAEvent).toHaveBeenCalledWith("event", "theme_change", { theme: "dark" });
  });

  it("другий дотик повертає світлу", async () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button", { name: "Темна тема" });
    await userEvent.click(button);
    await userEvent.click(button);

    expect(root.getAttribute("data-theme")).toBe("light");
    expect(localStorage.getItem("theme")).toBe("light");
    expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it("підхоплює вибір, зроблений в іншій вкладці", () => {
    render(<ThemeToggle />);
    act(() => {
      localStorage.setItem("theme", "dark");
      window.dispatchEvent(new StorageEvent("storage", { key: "theme", newValue: "dark" }));
    });
    expect(currentTheme()).toBe("dark");
    expect(screen.getByRole("button", { name: "Темна тема" })).toHaveAttribute("aria-pressed", "true");
  });
});
