import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ReviewsManager from "@/app/(admin)/admin/reviews/ReviewsManager";
import type { AdminReview } from "@/lib/admin-reviews";

const { from, update, updateEq, remove, removeEq, toast } = vi.hoisted(() => {
  const updateEq = vi.fn();
  const removeEq = vi.fn();
  const update = vi.fn(() => ({ eq: updateEq }));
  const remove = vi.fn(() => ({ eq: removeEq }));
  return {
    updateEq,
    removeEq,
    update,
    remove,
    from: vi.fn(() => ({ update, delete: remove })),
    toast: { success: vi.fn(), error: vi.fn() },
  };
});

vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({ from }) }));
vi.mock("react-hot-toast", () => ({ default: toast }));

const base: AdminReview = {
  id: "",
  author_name: "",
  rating: 5,
  text: "",
  product_id: null,
  approved: true,
  source: "internal",
  source_url: null,
  created_at: "2026-09-01T10:00:00Z",
};

const reviews: AdminReview[] = [
  { ...base, id: "r-pending", author_name: "Олена", text: "Шампунь Harmony тримає колір", approved: false, product_id: "p-harmony" },
  { ...base, id: "r-unlinked", author_name: "Ірина", text: "Дуже задоволена маскою" },
  { ...base, id: "r-google", author_name: "Марія", text: "Чудовий салон", source: "google", source_url: "https://maps.google.com/x" },
];

const products = [
  { id: "p-harmony", name: "Шампунь для фарбованого волосся Harmony" },
  { id: "p-mask", name: "Маска для волосся 5 ліпідів" },
];

describe("адмінка: відгуки", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateEq.mockResolvedValue({ error: null });
    removeEq.mockResolvedValue({ error: null });
  });

  it("відкривається на відгуках, що чекають схвалення", () => {
    render(<ReviewsManager initialReviews={reviews} products={products} loadError={null} />);

    expect(screen.getByRole("tab", { name: /Очікують схвалення/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Шампунь Harmony тримає колір")).toBeInTheDocument();
    expect(screen.queryByText("Дуже задоволена маскою")).not.toBeInTheDocument();
  });

  it("«Схвалити» публікує відгук і прибирає його з черги", async () => {
    render(<ReviewsManager initialReviews={reviews} products={products} loadError={null} />);

    fireEvent.click(screen.getByRole("button", { name: "Схвалити" }));

    await waitFor(() => expect(screen.getByText("Нових відгуків на модерації немає.")).toBeInTheDocument());
    expect(from).toHaveBeenCalledWith("reviews");
    expect(update).toHaveBeenCalledWith({ approved: true });
    expect(updateEq).toHaveBeenCalledWith("id", "r-pending");
    expect(toast.success).toHaveBeenCalledWith("Відгук схвалено");
  });

  it("прив'язує відгук із сайту до товару", async () => {
    render(<ReviewsManager initialReviews={reviews} products={products} loadError={null} />);
    fireEvent.click(screen.getByRole("tab", { name: /Без товару/ }));

    fireEvent.change(screen.getByLabelText("Товар"), { target: { value: "p-mask" } });

    await waitFor(() => expect(updateEq).toHaveBeenCalledWith("id", "r-unlinked"));
    expect(update).toHaveBeenCalledWith({ product_id: "p-mask" });
    expect(toast.success).toHaveBeenCalledWith("Прив'язано до «Маска для волосся 5 ліпідів»");
  });

  it("відгук із Google Maps прив'язати до товару не можна", () => {
    render(<ReviewsManager initialReviews={reviews} products={products} loadError={null} />);
    fireEvent.click(screen.getByRole("tab", { name: /Усі/ }));

    const selects = screen.getAllByLabelText("Товар") as HTMLSelectElement[];
    const googleSelect = selects.find((s) => s.id === "product-r-google")!;
    const siteSelect = selects.find((s) => s.id === "product-r-unlinked")!;
    expect(googleSelect).toBeDisabled();
    expect(siteSelect).toBeEnabled();
  });

  it("не змінює список, якщо база відмовила", async () => {
    updateEq.mockResolvedValue({ error: { message: "permission denied" } });
    render(<ReviewsManager initialReviews={reviews} products={products} loadError={null} />);

    fireEvent.click(screen.getByRole("button", { name: "Схвалити" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Не вдалося зберегти: permission denied"));
    expect(screen.getByText("Шампунь Harmony тримає колір")).toBeInTheDocument();
  });

  it("видаляє лише після підтвердження", async () => {
    const confirm = vi.spyOn(window, "confirm");
    render(<ReviewsManager initialReviews={reviews} products={products} loadError={null} />);

    confirm.mockReturnValueOnce(false);
    fireEvent.click(screen.getByRole("button", { name: "Видалити" }));
    expect(remove).not.toHaveBeenCalled();

    confirm.mockReturnValueOnce(true);
    fireEvent.click(screen.getByRole("button", { name: "Видалити" }));
    await waitFor(() => expect(removeEq).toHaveBeenCalledWith("id", "r-pending"));
    expect(screen.queryByText("Шампунь Harmony тримає колір")).not.toBeInTheDocument();
    confirm.mockRestore();
  });
});
