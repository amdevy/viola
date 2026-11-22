import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ProductBundle, { type BundleItem } from "@/components/shop/ProductBundle";
import uk from "@/messages/uk.json";

const { addItem, openCart, toastSuccess, sendGAEvent, showAddedToCart } = vi.hoisted(() => ({
  showAddedToCart: vi.fn(),
  addItem: vi.fn(),
  openCart: vi.fn(),
  toastSuccess: vi.fn(),
  sendGAEvent: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useTranslations: (ns: string) => (key: string, values?: Record<string, unknown>) => {
    const text = ((uk as Record<string, Record<string, string>>)[ns] ?? {})[key] ?? `${ns}.${key}`;
    return text.replace(/\{(\w+)\}/g, (_, name) => String(values?.[name] ?? ""));
  },
  useLocale: () => "uk",
}));

vi.mock("@/i18n/routing", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

vi.mock("@/hooks/useCart", () => ({ useCart: () => ({ addItem, openCart }) }));
vi.mock("react-hot-toast", () => ({ default: { success: toastSuccess, error: vi.fn() } }));
vi.mock("@/components/shop/addedToCartToast", () => ({ showAddedToCart }));
vi.mock("@/lib/analytics", () => ({ sendGAEvent }));

const product = (id: string, name: string, price: number) => ({
  id,
  slug: `${id}-slug`,
  name,
  price,
  images: [`/${id}.jpg`],
  volume: "250 мл",
  summary: `Опис: ${name}.`,
});

const MASK = "Гіалуронова маска для волосся 7 зволожувачів";
const addToSet = (name: string) => `Додати до комплекту: ${name}`;
const removeFromSet = (name: string) => `Прибрати з комплекту: ${name}`;
const detailsOf = (name: string) => `Детальніше: ${name}`;

const RITUAL: BundleItem[] = [
  { product: product("shampoo", "Гіалуроновий шампунь для волосся", 1800), step: "cleanse", isMain: true },
  { product: product("conditioner", "Кондиціонер для волосся з гіалуроновою кислотою", 1050), step: "condition", isMain: false },
  { product: product("mask", "Гіалуронова маска для волосся 7 зволожувачів", 2800), step: "mask", isMain: false },
];

const texts = uk.productBundle;

describe("ProductBundle — ритуал догляду", () => {
  beforeEach(() => {
    addItem.mockClear();
    openCart.mockClear();
    toastSuccess.mockClear();
    showAddedToCart.mockClear();
    sendGAEvent.mockClear();
  });

  it("підписує кроки ритуалу й сам товар", () => {
    render(<ProductBundle kind="line" items={RITUAL} />);

    // Мобільний список і картки для десктопа рендеряться обидва.
    expect(screen.getAllByText(`${texts.stepCleanse} · ${texts.thisProduct}`)).toHaveLength(2);
    expect(screen.getAllByText(texts.stepCondition)).toHaveLength(2);
    expect(screen.getAllByText(texts.stepMask)).toHaveLength(2);
  });

  it("пише «однієї лінії» лише тоді, коли засоби справді з однієї лінії", () => {
    const { rerender } = render(<ProductBundle kind="line" items={RITUAL} />);
    expect(screen.getByText(texts.subtitle)).toBeInTheDocument();

    rerender(<ProductBundle kind="complement" items={RITUAL} />);
    expect(screen.queryByText(texts.subtitle)).toBeNull();
    expect(screen.getByText(texts.subtitleComplement)).toBeInTheDocument();

    rerender(<ProductBundle kind="curated" items={RITUAL} />);
    expect(screen.getByText(texts.subtitleCurated)).toBeInTheDocument();
  });

  it("«Купити комплект» кладе товар і вибрані засоби й каже про це, не відкриваючи кошик", () => {
    render(<ProductBundle kind="line" items={RITUAL} />);

    const buy = screen.getByRole("button", { name: texts.buyBundle });
    expect(buy).toBeDisabled();
    // Сам товар завжди в комплекті: ні галочки, ні перегляду в нього немає.
    expect(screen.queryByRole("button", { name: /Гіалуроновий шампунь/ })).toBeNull();

    fireEvent.click(screen.getAllByRole("button", { name: addToSet(MASK) })[0]);
    fireEvent.click(buy);

    expect(addItem.mock.calls.map(([item]) => item.productId)).toEqual(["shampoo", "mask"]);
    expect(openCart).not.toHaveBeenCalled();
    expect(showAddedToCart).toHaveBeenCalledWith({
      title: texts.addedToast,
      openLabel: uk.cart.openShort,
    });
    expect(sendGAEvent).toHaveBeenCalledWith("event", "bundle_add_to_cart", {
      items: ["shampoo", "mask"],
      value: 4600,
      ritual_kind: "line",
    });
  });

  it("на телефоні показує ритуал пронумерованими кроками з кнопками «Детальніше» і «Додати»", () => {
    render(<ProductBundle kind="line" items={RITUAL} />);

    const steps = screen.getAllByRole("listitem");
    expect(steps).toHaveLength(3);
    expect(steps.map((li) => li.textContent?.charAt(0))).toEqual(["1", "2", "3"]);

    // The page's own product is a compact card without buttons.
    expect(steps[0].querySelectorAll("button")).toHaveLength(0);
    const toggle = screen.getAllByRole("button", { name: addToSet(MASK) })[0];
    expect(toggle).toHaveTextContent(texts.add);
    expect(screen.getAllByRole("button", { name: detailsOf(MASK) })[0]).toHaveTextContent(texts.details);

    fireEvent.click(toggle);
    expect(screen.getAllByRole("button", { name: removeFromSet(MASK) })[0]).toHaveTextContent(texts.inSet);
  });

  it("під сумою на телефоні видно, скільки засобів у комплекті", () => {
    render(<ProductBundle kind="line" items={RITUAL} />);
    fireEvent.click(screen.getAllByRole("button", { name: addToSet(MASK) })[0]);

    expect(screen.getByText(texts.itemsCount.replace("{count}", "2"))).toBeInTheDocument();
  });

  it("галочка ставить і знімає засіб одним дотиком", () => {
    render(<ProductBundle kind="line" items={RITUAL} />);

    const [tick] = screen.getAllByRole("button", { name: addToSet(MASK) });
    expect(tick).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(tick);

    const [ticked] = screen.getAllByRole("button", { name: removeFromSet(MASK) });
    expect(ticked).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.click(ticked);
    expect(screen.getAllByRole("button", { name: addToSet(MASK) })[0]).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("дотик по засобу показує його, не забираючи зі сторінки: опис, ціна, шлях на сторінку товару", () => {
    // Раніше рядок умів лише ставити галочку — подивитись, що це за маска,
    // перед тим як додати її, не було як.
    render(<ProductBundle kind="line" items={RITUAL} />);

    fireEvent.click(screen.getAllByRole("button", { name: detailsOf(MASK) })[0]);

    const dialog = screen.getByRole("dialog", { name: MASK });
    expect(dialog).toHaveTextContent(`Опис: ${MASK}.`);
    expect(dialog).toHaveTextContent(texts.stepMask);
    expect(dialog).toHaveTextContent("2 800");
    expect(screen.getByRole("link", { name: texts.openProduct })).toHaveAttribute(
      "href",
      "/shop/mask-slug",
    );
    expect(sendGAEvent).toHaveBeenCalledWith(
      "event",
      "select_item",
      expect.objectContaining({ item_list_name: "care_ritual" }),
    );
    // Перегляд сам нічого не додає.
    expect(screen.getByRole("button", { name: texts.buyBundle })).toBeDisabled();
  });

  it("з перегляду засіб додається в комплект, і перегляд закривається", () => {
    render(<ProductBundle kind="line" items={RITUAL} />);
    fireEvent.click(screen.getAllByRole("button", { name: detailsOf(MASK) })[0]);

    fireEvent.click(screen.getByRole("button", { name: texts.addToBundle }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getAllByRole("button", { name: removeFromSet(MASK) })[0]).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: texts.buyBundle })).toBeEnabled();

    // Відкритий удруге, він пропонує вже прибрати засіб.
    fireEvent.click(screen.getAllByRole("button", { name: detailsOf(MASK) })[0]);
    expect(screen.getByRole("button", { name: texts.removeFromBundle })).toBeInTheDocument();
  });

  it("перегляд закривається кнопкою та клавішею Escape", () => {
    render(<ProductBundle kind="line" items={RITUAL} />);
    const open = () =>
      fireEvent.click(screen.getAllByRole("button", { name: detailsOf(MASK) })[0]);

    open();
    fireEvent.click(screen.getByRole("button", { name: texts.close }));
    expect(screen.queryByRole("dialog")).toBeNull();

    open();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("нічого додати, крім самого товару, — блоку немає", () => {
    const { container } = render(<ProductBundle kind="complement" items={RITUAL.slice(0, 1)} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("ProductBundle — аналітика", () => {
  const events = (name: string) =>
    sendGAEvent.mock.calls.filter(([, event]) => event === name).map(([, , params]) => params);
  const maskItem = [{ item_id: "mask", item_name: MASK, price: 2800 }];

  beforeEach(() => {
    sendGAEvent.mockClear();
  });

  it("галочка в списку: bundle_item_add / bundle_item_remove з method «list»", () => {
    render(<ProductBundle kind="line" items={RITUAL} />);

    fireEvent.click(screen.getAllByRole("button", { name: addToSet(MASK) })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: removeFromSet(MASK) })[0]);

    expect(events("bundle_item_add")).toEqual([{ method: "list", items: maskItem }]);
    expect(events("bundle_item_remove")).toEqual([{ method: "list", items: maskItem }]);
  });

  it("перегляд: select_item з item_list_id, додавання з method «quick_view», посилання на сторінку товару", () => {
    render(<ProductBundle kind="line" items={RITUAL} />);
    fireEvent.click(screen.getAllByRole("button", { name: detailsOf(MASK) })[0]);

    expect(events("select_item")).toEqual([
      expect.objectContaining({ item_list_id: "care_ritual", item_list_name: "care_ritual" }),
    ]);

    const open = screen.getByRole("link", { name: texts.openProduct });
    open.addEventListener("click", (e) => e.preventDefault());
    fireEvent.click(open);
    expect(events("select_content")).toEqual([
      { content_type: "bundle_quick_view", content_id: "open_product", item_id: "mask" },
    ]);

    fireEvent.click(screen.getByRole("button", { name: texts.addToBundle }));
    expect(events("bundle_item_add")).toEqual([{ method: "quick_view", items: maskItem }]);
  });
});
