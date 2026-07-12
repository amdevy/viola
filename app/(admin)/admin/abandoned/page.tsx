"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import DataTable from "@/components/admin/DataTable";
import Modal from "@/components/ui/Modal";
import { formatPrice } from "@/lib/utils";

interface AbandonedItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface AbandonedCheckout {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  items: AbandonedItem[];
  item_count: number;
  total: number;
  city: string | null;
  np_address: string | null;
  status: "pending" | "ordered";
  created_at: string;
  updated_at: string;
}

export default function AdminAbandonedPage() {
  const [rows, setRows] = useState<AbandonedCheckout[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AbandonedCheckout | null>(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("abandoned_checkouts")
      .select("*")
      .order("created_at", { ascending: false });
    setRows((data as AbandonedCheckout[]) ?? []);
    setLoading(false);
  };

  const pending = rows.filter((r) => r.status === "pending");
  const ordered = rows.filter((r) => r.status === "ordered");
  const started = pending.length + ordered.length;
  const abandonRate = started > 0 ? Math.round((pending.length / started) * 100) : 0;
  const pendingValue = pending.reduce((s, r) => s + Number(r.total), 0);

  const columns = [
    {
      key: "name",
      header: "Ім'я",
      render: (r: AbandonedCheckout) => (
        <span className="font-medium">{r.name || "—"}</span>
      ),
    },
    { key: "phone", header: "Телефон" },
    {
      key: "item_count",
      header: "Товарів",
      render: (r: AbandonedCheckout) => <span>{r.item_count}</span>,
    },
    {
      key: "total",
      header: "Сума",
      render: (r: AbandonedCheckout) => (
        <span className="font-semibold">{formatPrice(r.total)}</span>
      ),
    },
    {
      key: "created_at",
      header: "Почав оформлення",
      render: (r: AbandonedCheckout) => (
        <span className="text-xs text-[#6B6B6B]">
          {new Date(r.created_at).toLocaleString("uk-UA", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Дії",
      render: (r: AbandonedCheckout) => (
        <button
          onClick={() => setSelected(r)}
          className="text-xs text-[#C4A882] hover:underline"
        >
          Детальніше
        </button>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl font-bold text-[#1A1A1A]">
          Незавершені замовлення
        </h1>
        <span className="text-sm text-[#6B6B6B]">{pending.length} незавершених</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="border border-[#E8E4DE] rounded p-4">
          <p className="text-xs text-[#6B6B6B] mb-1">Не завершили</p>
          <p className="text-2xl font-bold text-[#1A1A1A]">{pending.length}</p>
        </div>
        <div className="border border-[#E8E4DE] rounded p-4">
          <p className="text-xs text-[#6B6B6B] mb-1">Завершили</p>
          <p className="text-2xl font-bold text-[#38A169]">{ordered.length}</p>
        </div>
        <div className="border border-[#E8E4DE] rounded p-4">
          <p className="text-xs text-[#6B6B6B] mb-1">% кидання</p>
          <p className="text-2xl font-bold text-[#E53E3E]">{abandonRate}%</p>
        </div>
        <div className="border border-[#E8E4DE] rounded p-4">
          <p className="text-xs text-[#6B6B6B] mb-1">Сума в очікуванні</p>
          <p className="text-2xl font-bold text-[#C4A882]">{formatPrice(pendingValue)}</p>
        </div>
      </div>

      <p className="text-xs text-[#6B6B6B] mb-4">
        Клієнти, які ввели телефон на оформленні, але не підтвердили замовлення.
        Можна передзвонити їм вручну. «% кидання» рахується від усіх, хто дійшов до
        цього кроку.
      </p>

      <DataTable
        columns={columns}
        data={pending}
        loading={loading}
        keyExtractor={(r) => r.id}
        emptyMessage="Поки немає незавершених замовлень"
      />

      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name || "Незавершене замовлення"}
        size="lg"
      >
        {selected && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-[#6B6B6B] mb-1">Телефон</p>
                <a
                  href={`tel:${selected.phone}`}
                  className="font-medium text-[#C4A882] hover:underline"
                >
                  {selected.phone}
                </a>
              </div>
              <div>
                <p className="text-xs text-[#6B6B6B] mb-1">Email</p>
                <p className="font-medium">{selected.email ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-[#6B6B6B] mb-1">Місто</p>
                <p className="font-medium">{selected.city ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-[#6B6B6B] mb-1">Відділення</p>
                <p className="font-medium">{selected.np_address ?? "—"}</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3">Кошик</h3>
              <div className="space-y-2">
                {selected.items.map((it, idx) => (
                  <div
                    key={`${it.productId}-${idx}`}
                    className="flex items-center justify-between border border-[#E8E4DE] rounded p-3 text-sm"
                  >
                    <span>
                      {it.name} × {it.quantity}
                    </span>
                    <span className="font-semibold">
                      {formatPrice(it.price * it.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#E8E4DE]">
                <span className="text-sm font-semibold">Разом</span>
                <span className="text-sm font-bold text-[#C4A882]">
                  {formatPrice(selected.total)}
                </span>
              </div>
            </div>

            <p className="text-xs text-[#6B6B6B]">
              Почав оформлення:{" "}
              {new Date(selected.created_at).toLocaleString("uk-UA")}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
