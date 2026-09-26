"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  REVIEW_FILTERS,
  canLinkToProduct,
  countByFilter,
  defaultFilter,
  matchesFilter,
  type AdminReview,
  type ReviewFilter,
} from "@/lib/admin-reviews";

type ProductOption = { id: string; name: string };

export default function ReviewsManager({
  initialReviews,
  products,
  loadError,
}: {
  initialReviews: AdminReview[];
  products: ProductOption[];
  loadError: string | null;
}) {
  const [reviews, setReviews] = useState(initialReviews);
  const [filter, setFilter] = useState<ReviewFilter>(() =>
    defaultFilter(countByFilter(initialReviews)),
  );
  const [busyId, setBusyId] = useState<string | null>(null);

  const counts = countByFilter(reviews);
  const visible = reviews.filter((r) => matchesFilter(r, filter));
  const productName = new Map(products.map((p) => [p.id, p.name]));

  const save = async (review: AdminReview, patch: Partial<AdminReview>, done: string) => {
    setBusyId(review.id);
    const { error } = await createClient().from("reviews").update(patch).eq("id", review.id);
    setBusyId(null);
    if (error) {
      toast.error(`Не вдалося зберегти: ${error.message}`);
      return;
    }
    setReviews((all) => all.map((r) => (r.id === review.id ? { ...r, ...patch } : r)));
    toast.success(done);
  };

  const remove = async (review: AdminReview) => {
    if (!window.confirm(`Видалити відгук від «${review.author_name}»? Це не можна скасувати.`)) return;
    setBusyId(review.id);
    const { error } = await createClient().from("reviews").delete().eq("id", review.id);
    setBusyId(null);
    if (error) {
      toast.error(`Не вдалося видалити: ${error.message}`);
      return;
    }
    setReviews((all) => all.filter((r) => r.id !== review.id));
    toast.success("Відгук видалено");
  };

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-[#1A1A1A] mb-2">Відгуки</h1>
      <p className="text-sm text-[#6B6B6B] mb-6 max-w-3xl">
        Зірки в Google отримує товар, до якого прив&apos;язано хоча б один схвалений відгук із сайту.
        Зміни з&apos;являються на сайті протягом години.
      </p>

      {loadError && (
        <p className="mb-6 rounded border border-[#FED7D7] bg-[#FFF5F5] px-4 py-3 text-sm text-[#9B2C2C]">
          Не вдалося завантажити відгуки: {loadError}
        </p>
      )}

      <div className="flex flex-wrap gap-2 mb-6" role="tablist" aria-label="Фільтр відгуків">
        {REVIEW_FILTERS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={filter === key}
            onClick={() => setFilter(key)}
            className={cn(
              "px-4 py-2 text-sm rounded border transition-colors",
              filter === key
                ? "bg-[#1A1A1A] border-[#1A1A1A] text-white"
                : "bg-white border-[#E8E4DE] text-[#1A1A1A] hover:border-[#C4A882]",
            )}
          >
            {label} <span className="opacity-60">{counts[key]}</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="bg-white rounded border border-[#E8E4DE] px-5 py-10 text-center text-[#6B6B6B]">
          {filter === "pending" ? "Нових відгуків на модерації немає." : "Тут поки порожньо."}
        </p>
      ) : (
        <ul className="space-y-4">
          {visible.map((review) => {
            const linkable = canLinkToProduct(review);
            const busy = busyId === review.id;
            return (
              <li key={review.id} className="bg-white rounded border border-[#E8E4DE] p-5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-3">
                  <span className="text-[#C4A882] tracking-wider" aria-label={`Оцінка ${review.rating} з 5`}>
                    {"★".repeat(review.rating)}
                    <span className="text-[#E8E4DE]">{"★".repeat(5 - review.rating)}</span>
                  </span>
                  <span className="font-medium text-[#1A1A1A]">{review.author_name}</span>
                  <span className="text-xs text-[#6B6B6B]">
                    {new Date(review.created_at).toLocaleDateString("uk-UA")}
                  </span>
                  {review.approved ? (
                    <Badge variant="success">Схвалено</Badge>
                  ) : (
                    <Badge variant="warning">Очікує схвалення</Badge>
                  )}
                  {linkable ? (
                    <Badge>З сайту</Badge>
                  ) : (
                    <Badge variant="accent">Google Maps</Badge>
                  )}
                  {review.source_url && (
                    <a
                      href={review.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#C4A882] hover:underline"
                    >
                      Оригінал ↗
                    </a>
                  )}
                </div>

                <p className="text-sm text-[#1A1A1A] leading-relaxed whitespace-pre-line mb-4">{review.text}</p>

                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div className="min-w-0 flex-1 max-w-md">
                    <label htmlFor={`product-${review.id}`} className="block text-xs text-[#6B6B6B] mb-1">
                      Товар
                    </label>
                    <select
                      id={`product-${review.id}`}
                      value={review.product_id ?? ""}
                      disabled={!linkable || busy}
                      onChange={(e) => {
                        const productId = e.target.value || null;
                        save(
                          review,
                          { product_id: productId },
                          productId ? `Прив'язано до «${productName.get(productId)}»` : "Відв'язано від товару",
                        );
                      }}
                      className="w-full border border-[#E8E4DE] rounded px-3 py-2 text-sm bg-white disabled:bg-[#F5F3EF] disabled:text-[#6B6B6B]"
                    >
                      <option value="">— Не про конкретний товар —</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-[#6B6B6B]">
                      {linkable
                        ? "Прив'язуйте, лише якщо відгук саме про цей товар."
                        : "Відгук про салон із Google Maps: Google не зараховує такі в оцінку товару."}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {review.approved ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => save(review, { approved: false }, "Відгук приховано з сайту")}
                      >
                        Приховати
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled={busy}
                        onClick={() => save(review, { approved: true }, "Відгук схвалено")}
                      >
                        Схвалити
                      </Button>
                    )}
                    <Button size="sm" variant="danger" disabled={busy} onClick={() => remove(review)}>
                      Видалити
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
