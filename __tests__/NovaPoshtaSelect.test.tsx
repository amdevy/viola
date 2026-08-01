import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NovaPoshtaSelect from "@/components/checkout/NovaPoshtaSelect";
import uk from "@/messages/uk.json";
import type { NovaPoshtaCity } from "@/types";

vi.mock("next-intl", () => ({
  useTranslations: (ns: string) => {
    const dict = (uk as Record<string, Record<string, string>>)[ns] ?? {};
    return (key: string) => dict[key] ?? `${ns}.${key}`;
  },
}));

const KYIV: NovaPoshtaCity = { Ref: "kyiv-ref", Description: "Київ", DescriptionRu: "Киев", AreaDescription: "Київська" };
const KYPTI: NovaPoshtaCity = { Ref: "kypti-ref", Description: "Кипті", DescriptionRu: "Кипти", AreaDescription: "Чернігівська" };
const WAREHOUSE = { Ref: "wh-1", Description: "Відділення №1: вул. Хрещатик, 1", Number: "1", CityRef: "kyiv-ref", CityDescription: "Київ" };

function mockNovaPoshtaFetch(cities: NovaPoshtaCity[]) {
  return vi.fn(async (url: RequestInfo | URL) => {
    const u = String(url);
    if (u.includes("type=cities")) return { ok: true, json: async () => ({ data: cities }) } as Response;
    if (u.includes("type=warehouses")) return { ok: true, json: async () => ({ data: [WAREHOUSE] }) } as Response;
    throw new Error(`Unexpected fetch: ${u}`);
  });
}

describe("NovaPoshtaSelect", () => {
  const onCityChange = vi.fn();
  const onWarehouseChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("поле відділення видиме одразу, але заблоковане до вибору міста", () => {
    vi.stubGlobal("fetch", mockNovaPoshtaFetch([]));
    render(<NovaPoshtaSelect onCityChange={onCityChange} onWarehouseChange={onWarehouseChange} />);
    const warehouseInput = screen.getByPlaceholderText(uk.checkout.warehouseSelectCityFirst);
    expect(warehouseInput).toBeDisabled();
  });

  it("автовибирає місто при точному збігу, коли юзер пішов з поля без кліку", async () => {
    vi.stubGlobal("fetch", mockNovaPoshtaFetch([KYIV, KYPTI]));
    const user = userEvent.setup();
    render(<NovaPoshtaSelect onCityChange={onCityChange} onWarehouseChange={onWarehouseChange} />);

    const cityInput = screen.getByPlaceholderText(uk.checkout.cityPlaceholder);
    await user.type(cityInput, "Київ");
    await screen.findByRole("button", { name: /Київська/ }, { timeout: 3000 });

    fireEvent.blur(cityInput);
    await waitFor(() => expect(onCityChange).toHaveBeenCalledWith(KYIV));
  });

  it("автовибирає місто, якщо результат один, навіть без точного збігу", async () => {
    vi.stubGlobal("fetch", mockNovaPoshtaFetch([KYPTI]));
    const user = userEvent.setup();
    render(<NovaPoshtaSelect onCityChange={onCityChange} onWarehouseChange={onWarehouseChange} />);

    const cityInput = screen.getByPlaceholderText(uk.checkout.cityPlaceholder);
    await user.type(cityInput, "Кипт");
    await screen.findByRole("button", { name: /Чернігівська/ }, { timeout: 3000 });

    fireEvent.blur(cityInput);
    await waitFor(() => expect(onCityChange).toHaveBeenCalledWith(KYPTI));
  });

  it("не вгадує місто, коли результатів кілька і точного збігу немає", async () => {
    vi.stubGlobal("fetch", mockNovaPoshtaFetch([KYIV, KYPTI]));
    const user = userEvent.setup();
    render(<NovaPoshtaSelect onCityChange={onCityChange} onWarehouseChange={onWarehouseChange} />);

    const cityInput = screen.getByPlaceholderText(uk.checkout.cityPlaceholder);
    // 3+ characters: below that the API returns nothing, so the picker does not query.
    await user.type(cityInput, "Кип");
    await screen.findByRole("button", { name: /Київська/ }, { timeout: 3000 });

    fireEvent.blur(cityInput);
    await new Promise((r) => setTimeout(r, 50));
    expect(onCityChange).not.toHaveBeenCalledWith(KYIV);
    expect(onCityChange).not.toHaveBeenCalledWith(KYPTI);
  });

  it("після вибору міста поле відділення розблоковується і показує список", async () => {
    vi.stubGlobal("fetch", mockNovaPoshtaFetch([KYIV]));
    const user = userEvent.setup();
    render(<NovaPoshtaSelect onCityChange={onCityChange} onWarehouseChange={onWarehouseChange} />);

    const cityInput = screen.getByPlaceholderText(uk.checkout.cityPlaceholder);
    await user.type(cityInput, "Київ");
    const option = await screen.findByRole("button", { name: /Київська/ }, { timeout: 3000 });
    await user.click(option);

    const warehouseInput = await screen.findByPlaceholderText(uk.checkout.warehousePlaceholder, {}, { timeout: 3000 });
    expect(warehouseInput).toBeEnabled();

    await user.click(warehouseInput);
    const whOption = await screen.findByRole("button", { name: /Хрещатик/ }, { timeout: 3000 });
    await user.click(whOption);
    expect(onWarehouseChange).toHaveBeenCalledWith(WAREHOUSE);
  });
});
