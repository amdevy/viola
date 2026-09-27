import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ProductBundle, { type BundleItem } from "@/components/shop/ProductBundle";
import uk from "@/messages/uk.json";

const { addItem, openCart, toastSuccess, sendGAEvent } = vi.hoisted(() => ({
  addItem: vi.fn(),
  openCart: vi.fn(),
  toastSuccess: vi.fn(),
  sendGAEvent: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useTranslations: (ns: string) => (key: string) =>
    ((uk as Record<string, Record<string, string>>)[ns] ?? {})[key] ?? `${ns}.${key}`,
  useLocale: () => "uk",
}));

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

vi.mock("@/hooks/useCart", () => ({ useCart: () => ({ addItem, openCart }) }));
vi.mock("react-hot-toast", () => ({ default: { success: toastSuccess, error: vi.fn() } }));
vi.mock("@/lib/analytics", () => ({ sendGAEvent }));

const product = (id: string, name: string, price: number) => ({
  id,
  name,
  price,
  images: [`/${id}.jpg`],
  volume: "250 мл",
});

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

  it("«Купити комплект» кладе товар і вибрані засоби, відкриває кошик і каже про це", () => {
    render(<ProductBundle kind="line" items={RITUAL} />);

    const buy = screen.getByRole("button", { name: texts.buyBundle });
    expect(buy).toBeDisabled();
    for (const main of screen.getAllByRole("button", { name: /Гіалуроновий шампунь/ })) {
      expect(main).toBeDisabled();
    }

    fireEvent.click(screen.getAllByRole("button", { name: /Гіалуронова маска/ })[0]);
    fireEvent.click(buy);

    expect(addItem.mock.calls.map(([item]) => item.productId)).toEqual(["shampoo", "mask"]);
    expect(openCart).toHaveBeenCalled();
    expect(toastSuccess).toHaveBeenCalledWith(texts.addedToast);
    expect(sendGAEvent).toHaveBeenCalledWith("event", "bundle_add_to_cart", {
      items: ["shampoo", "mask"],
      value: 4600,
      ritual_kind: "line",
    });
  });

  it("нічого додати, крім самого товару, — блоку немає", () => {
    const { container } = render(<ProductBundle kind="complement" items={RITUAL.slice(0, 1)} />);
    expect(container).toBeEmptyDOMElement();
  });
});
