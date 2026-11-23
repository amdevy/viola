import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CollapsibleIntro from "@/components/ui/CollapsibleIntro";
import uk from "@/messages/uk.json";

const { sendGAEvent } = vi.hoisted(() => ({ sendGAEvent: vi.fn() }));
vi.mock("@/lib/analytics", () => ({ sendGAEvent }));

const INTRO = "Шампуні На Голову для фарбованого волосся: колагенові, аміно-церамідні, безсульфатні.";
const FACTS = "19 товарів · від 900 грн";

// jsdom does no layout: scrollHeight and clientHeight are 0 unless stubbed.
const original = {
  scroll: Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollHeight"),
  client: Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientHeight"),
};

function stubHeights(scroll: number, client: number) {
  Object.defineProperty(HTMLElement.prototype, "scrollHeight", { configurable: true, get: () => scroll });
  Object.defineProperty(HTMLElement.prototype, "clientHeight", { configurable: true, get: () => client });
}

function renderIntro() {
  return render(
    <CollapsibleIntro moreLabel={uk.common.readMore} lessLabel={uk.common.showLess}>
      <p>{INTRO}</p>
      <p>{FACTS}</p>
    </CollapsibleIntro>,
  );
}

describe("CollapsibleIntro — вступ, згорнутий до двох рядків на телефоні", () => {
  afterEach(() => {
    if (original.scroll) Object.defineProperty(HTMLElement.prototype, "scrollHeight", original.scroll);
    if (original.client) Object.defineProperty(HTMLElement.prototype, "clientHeight", original.client);
  });

  it("згорнутий за замовчуванням, але весь текст лишається в документі", () => {
    stubHeights(120, 48);
    renderIntro();

    const toggle = screen.getByRole("button", { name: uk.common.readMore });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    const text = document.getElementById(toggle.getAttribute("aria-controls")!);
    expect(text).toHaveAttribute("data-collapsed", "true");
    // Clipped by CSS only: both paragraphs are rendered for search engines.
    expect(text).toHaveTextContent(INTRO);
    expect(text).toHaveTextContent(FACTS);
  });

  it("розгортається й згортається тією ж кнопкою", () => {
    stubHeights(120, 48);
    renderIntro();

    fireEvent.click(screen.getByRole("button", { name: uk.common.readMore }));
    const toggle = screen.getByRole("button", { name: uk.common.showLess });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(document.getElementById(toggle.getAttribute("aria-controls")!)).toHaveAttribute("data-collapsed", "false");

    fireEvent.click(toggle);
    const collapsed = screen.getByRole("button", { name: uk.common.readMore });
    expect(collapsed).toHaveAttribute("aria-expanded", "false");
    expect(document.getElementById(collapsed.getAttribute("aria-controls")!)).toHaveAttribute("data-collapsed", "true");
  });

  it("ховає кнопку, коли короткий текст і так вміщається", () => {
    stubHeights(40, 48);
    renderIntro();

    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText(INTRO)).toBeInTheDocument();
  });
});

describe("CollapsibleIntro — аналітика", () => {
  afterEach(() => {
    sendGAEvent.mockClear();
    if (original.scroll) Object.defineProperty(HTMLElement.prototype, "scrollHeight", original.scroll);
    if (original.client) Object.defineProperty(HTMLElement.prototype, "clientHeight", original.client);
  });

  it("«Читати далі» шле intro_expand з id сторінки; «Згорнути» — нічого", () => {
    stubHeights(120, 48);
    render(
      <CollapsibleIntro moreLabel={uk.common.readMore} lessLabel={uk.common.showLess} analyticsId="shampoos">
        <p>{INTRO}</p>
      </CollapsibleIntro>,
    );

    fireEvent.click(screen.getByRole("button", { name: uk.common.readMore }));
    expect(sendGAEvent.mock.calls).toEqual([
      ["event", "intro_expand", { content_type: "catalog_intro", content_id: "shampoos" }],
    ]);

    fireEvent.click(screen.getByRole("button", { name: uk.common.showLess }));
    expect(sendGAEvent).toHaveBeenCalledTimes(1);
  });

  it("на сторінці товару шле власну подію з типом блоку", () => {
    stubHeights(400, 176);
    render(
      <CollapsibleIntro
        moreLabel={uk.common.readMore}
        lessLabel={uk.common.showLess}
        analyticsId="maska-dlya-volossya-5-lipidiv"
        analyticsEvent="product_text_expand"
        analyticsContentType="ingredients"
        collapsedClassName="max-md:max-h-[11rem] max-md:overflow-hidden"
      >
        <p>{INTRO}</p>
      </CollapsibleIntro>,
    );

    const toggle = screen.getByRole("button", { name: uk.common.readMore });
    expect(document.getElementById(toggle.getAttribute("aria-controls")!)).toHaveClass("max-md:max-h-[11rem]");

    fireEvent.click(toggle);
    expect(sendGAEvent.mock.calls).toEqual([
      ["event", "product_text_expand", { content_type: "ingredients", content_id: "maska-dlya-volossya-5-lipidiv" }],
    ]);
  });

  it("без analyticsId нічого не шле", () => {
    stubHeights(120, 48);
    renderIntro();

    fireEvent.click(screen.getByRole("button", { name: uk.common.readMore }));
    expect(sendGAEvent).not.toHaveBeenCalled();
  });
});
