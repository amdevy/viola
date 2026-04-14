"use client";

import { useState } from "react";
import { useOrders } from "@/hooks/useOrders";
import DataTable from "@/components/admin/DataTable";
import OrderStatusBadge from "@/components/admin/OrderStatusBadge";
import { formatPrice } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types";
import toast from "react-hot-toast";

const STATUSES: { value: string; label: string }[] = [
  { value: "", label: "Всі" },
  { value: "pending", label: "Очікують" },
  { value: "paid", label: "Оплачені" },
  { value: "processing", label: "Обробляються" },
  { value: "shipped", label: "Відправлені" },
  { value: "delivered", label: "Доставлені" },
  { value: "cancelled", label: "Скасовані" },
];

const ALL_STATUSES: { value: OrderStatus; label: string }[] = [
  { value: "pending", label: "Очікує" },
  { value: "paid", label: "Оплачено" },
  { value: "processing", label: "Обробляється" },
  { value: "shipped", label: "Відправлено" },
  { value: "delivered", label: "Доставлено" },
  { value: "cancelled", label: "Скасовано" },
];

export default function AdminOrdersPage() {
  const { orders, loading, updateStatus } = useOrders();
  const [statusFilter, setStatusFilter] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = statusFilter
    ? orders.filter((o) => o.status === statusFilter)
    : orders;

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);
    const { error } = await updateStatus(orderId, newStatus);
    if (error) toast.error("Помилка оновлення статусу");
    else toast.success("Статус оновлено");
    setUpdating(null);
  };

  const columns = [
    {
      key: "id",
      header: "ID",
      render: (o: Order) => (
        <button
          onClick={() => setExpanded(expanded === o.id ? null : o.id)}
          className="font-mono text-xs text-[#C4A882] hover:text-[#A8875E] transition-colors text-left"
        >
          {o.id.slice(0, 8).toUpperCase()}
          <span className="ml-1 text-[10px]">{expanded === o.id ? "▲" : "▼"}</span>
        </button>
      ),
    },
    {
      key: "customer_name",
      header: "Клієнт",
      render: (o: Order) => (
        <div>
          <p className="font-medium">{o.customer_name}</p>
          <p className="text-xs text-[#6B6B6B]">{o.customer_phone}</p>
        </div>
      ),
    },
    {
      key: "nova_poshta_address",
      header: "Доставка",
      render: (o: Order) => (
        <div className="max-w-xs">
          <p className="text-xs text-[#6B6B6B]">{o.city}</p>
          <p className="text-xs text-[#6B6B6B] truncate">{o.nova_poshta_address}</p>
        </div>
      ),
    },
    {
      key: "total",
      header: "Сума",
      render: (o: Order) => (
        <span className="font-semibold">{formatPrice(o.total)}</span>
      ),
    },
    {
      key: "status",
      header: "Статус",
      render: (o: Order) => <OrderStatusBadge status={o.status} />,
    },
    {
      key: "actions",
      header: "Дії",
      render: (o: Order) => (
        <select
          value={o.status}
          disabled={updating === o.id}
          onChange={(e) => handleStatusChange(o.id, e.target.value)}
          className="text-xs border border-[#E8E4DE] rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-[#C4A882] disabled:opacity-50"
        >
          {ALL_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: "created_at",
      header: "Дата",
      render: (o: Order) => (
        <span className="text-xs text-[#6B6B6B]">
          {new Date(o.created_at).toLocaleDateString("uk-UA")}
        </span>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl font-bold text-[#1A1A1A]">Замовлення</h1>
        <span className="text-sm text-[#6B6B6B]">{filtered.length} замовлень</span>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => setStatusFilter(s.value)}
            className={`px-3 py-1.5 text-xs rounded border transition-colors ${
              statusFilter === s.value
                ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                : "bg-white text-[#1A1A1A] border-[#E8E4DE] hover:border-[#C4A882]"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        keyExtractor={(o) => o.id}
        emptyMessage="Замовлень не знайдено"
        expandedRow={{
          id: expanded,
          render: (o: Order) => {
            const items = (o as any).order_items ?? [];
            if (items.length === 0) return <p className="text-xs text-[#6B6B6B]">Товари не знайдено</p>;
            return (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-[#1A1A1A] mb-2 uppercase tracking-wider">Товари:</p>
                {items.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-[#1A1A1A]">
                      {item.product?.name ?? "—"}
                      <span className="text-[#6B6B6B] ml-2">× {item.quantity}</span>
                    </span>
                    <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            );
          },
        }}
      />
    </div>
  );
}
