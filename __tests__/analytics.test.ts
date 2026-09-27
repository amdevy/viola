import { describe, it, expect, afterEach } from "vitest";
import { gaInitScript, sendGAEvent } from "@/lib/analytics";

type DataLayerWindow = Window & { dataLayer?: unknown[] };
const w = window as DataLayerWindow;

describe("Google Analytics", () => {
  afterEach(() => {
    delete w.dataLayer;
  });

  it("подія, надіслана відразу після завантаження, не губиться", () => {
    // Раніше скрипт GA вмикався після гідратації, а події з ефектів при
    // відкритті сторінки (view_item, purchase після LiqPay) викидались із
    // "GA dataLayer does not exist". Тепер снипет виконується в <head> —
    // відтворюємо саме його і шлемо подію одразу після.
    new Function(gaInitScript("G-TEST123"))();

    sendGAEvent("event", "purchase", { transaction_id: "o-1", value: 1500, currency: "UAH" });

    const commands = w.dataLayer!.map((entry) => Array.from(entry as ArrayLike<unknown>));
    expect(commands[0][0]).toBe("js");
    expect(commands[1]).toEqual(["config", "G-TEST123"]);
    // config — до події, інакше gtag не знає, куди її слати.
    expect(commands[2]).toEqual(["event", "purchase", { transaction_id: "o-1", value: 1500, currency: "UAH" }]);
  });

  it("кладе в dataLayer об'єкт arguments, як gtag, а не масив", () => {
    w.dataLayer = [];
    sendGAEvent("event", "view_item", { value: 900 });
    const entry = w.dataLayer[0];
    expect(Array.isArray(entry)).toBe(false);
    expect(Object.prototype.toString.call(entry)).toBe("[object Arguments]");
  });

  it("без GA (немає ID, немає dataLayer) нічого не робить і не падає", () => {
    expect(() => sendGAEvent("event", "view_item", {})).not.toThrow();
    expect(w.dataLayer).toBeUndefined();
  });

  it("ID у скрипті екранується", () => {
    expect(gaInitScript("G-ABC")).toContain(`gtag('config',"G-ABC");`);
    expect(gaInitScript(`x");alert(1);//`)).not.toContain(`x");alert`);
  });
});
