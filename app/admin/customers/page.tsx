"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import DataTable from "@/components/admin/DataTable";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";
import type { Customer, Order } from "@/types";
import { formatPrice } from "@/lib/utils";
import OrderStatusBadge from "@/components/admin/OrderStatusBadge";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });
    setCustomers((data as Customer[]) ?? []);
    setLoading(false);
  };

  const openCustomer = async (c: Customer) => {
    setSelected(c);
    setNotes(c.notes ?? "");
    const supabase = createClient();
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*, product:products(name))")
      .eq("customer_id", c.id)
      .order("created_at", { ascending: false });
    setOrders((data as Order[]) ?? []);
  };

  const saveNotes = async () => {
    if (!selected) return;
    setSavingNotes(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("customers")
      .update({ notes })
      .eq("id", selected.id);

    if (error) toast.error("Помилка збереження");
    else {
      toast.success("Нотатки збережено");
      setCustomers((prev) =>
        prev.map((c) => (c.id === selected.id ? { ...c, notes } : c))
      );
      setSelected((s) => (s ? { ...s, notes } : null));
    }
    setSavingNotes(false);
  };

  const totalSpent = orders.reduce((s, o) => s + Number(o.total), 0);

  const columns = [
    {
      key: "name",
      header: "Ім'я",
      render: (c: Customer) => <span className="font-medium">{c.name}</span>,
    },
    { key: "phone", header: "Телефон" },
    { key: "email", header: "Email", render: (c: Customer) => <span>{c.email ?? "—"}</span> },
    {
      key: "created_at",
      header: "Дата реєстрації",
      render: (c: Customer) => (
        <span className="text-xs text-[#6B6B6B]">
          {new Date(c.created_at).toLocaleDateString("uk-UA")}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Дії",
      render: (c: Customer) => (
        <button
          onClick={() => openCustomer(c)}
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
        <h1 className="font-serif text-2xl font-bold text-[#1A1A1A]">Клієнти</h1>
        <span className="text-sm text-[#6B6B6B]">{customers.length} клієнтів</span>
      </div>

      <DataTable
        columns={columns}
        data={customers}
        loading={loading}
        keyExtractor={(c) => c.id}
        emptyMessage="Клієнтів поки немає"
      />

      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name}
        size="xl"
      >
        {selected && (
          <div className="space-y-6">
            {/* Customer info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-[#6B6B6B] mb-1">Телефон</p>
                <p className="font-medium">{selected.phone}</p>
              </div>
              <div>
                <p className="text-xs text-[#6B6B6B] mb-1">Email</p>
                <p className="font-medium">{selected.email ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-[#6B6B6B] mb-1">Замовлень</p>
                <p className="font-medium">{orders.length}</p>
              </div>
              <div>
                <p className="text-xs text-[#6B6B6B] mb-1">Всього витрачено</p>
                <p className="font-medium text-[#C4A882]">{formatPrice(totalSpent)}</p>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-sm font-medium text-[#1A1A1A] block mb-1">
                Нотатки менеджера
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-[#E8E4DE] rounded focus:outline-none focus:ring-2 focus:ring-[#C4A882] resize-none"
                placeholder="Примітки про клієнта..."
              />
              <Button size="sm" onClick={saveNotes} loading={savingNotes} className="mt-2">
                Зберегти нотатки
              </Button>
            </div>

            {/* Order history */}
            {orders.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3">Історія замовлень</h3>
                <div className="space-y-2">
                  {orders.map((o) => (
                    <div key={o.id} className="border border-[#E8E4DE] rounded p-3 text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-xs text-[#6B6B6B]">
                          {o.id.slice(0, 8).toUpperCase()}
                        </span>
                        <div className="flex items-center gap-2">
                          <OrderStatusBadge status={o.status} />
                          <span className="font-semibold">{formatPrice(o.total)}</span>
                        </div>
                      </div>
                      <p className="text-xs text-[#6B6B6B]">
                        {new Date(o.created_at).toLocaleDateString("uk-UA")} · {o.nova_poshta_address}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
