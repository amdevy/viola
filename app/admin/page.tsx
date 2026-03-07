import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";

export const metadata: Metadata = { title: "Admin — Dashboard" };

async function getDashboardStats() {
  const supabase = await createClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [ordersRes, revenueRes, customersRes, pendingRes] = await Promise.all([
    supabase
      .from("orders")
      .select("id", { count: "exact" })
      .gte("created_at", today.toISOString()),
    supabase
      .from("orders")
      .select("total")
      .eq("status", "paid")
      .gte("created_at", today.toISOString()),
    supabase
      .from("customers")
      .select("id", { count: "exact" })
      .gte("created_at", today.toISOString()),
    supabase
      .from("orders")
      .select("id", { count: "exact" })
      .eq("status", "pending"),
  ]);

  const todayRevenue = (revenueRes.data ?? []).reduce((s, o) => s + Number(o.total), 0);

  return {
    todayOrders: ordersRes.count ?? 0,
    todayRevenue,
    newCustomers: customersRes.count ?? 0,
    pendingOrders: pendingRes.count ?? 0,
  };
}

async function getRecentOrders() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("id,status,customer_name,total,created_at")
    .order("created_at", { ascending: false })
    .limit(5);
  return data ?? [];
}

const STATUS_COLORS: Record<string, string> = {
  pending: "text-yellow-600",
  paid: "text-green-600",
  processing: "text-blue-600",
  shipped: "text-purple-600",
  delivered: "text-green-700",
  cancelled: "text-red-600",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Очікує",
  paid: "Оплачено",
  processing: "Обробляється",
  shipped: "Відправлено",
  delivered: "Доставлено",
  cancelled: "Скасовано",
};

export default async function AdminDashboard() {
  const [stats, recentOrders] = await Promise.all([
    getDashboardStats(),
    getRecentOrders(),
  ]);

  const STAT_CARDS = [
    {
      label: "Замовлень сьогодні",
      value: stats.todayOrders.toString(),
      href: "/admin/orders",
      icon: "📦",
    },
    {
      label: "Виручка сьогодні",
      value: formatPrice(stats.todayRevenue),
      href: "/admin/orders",
      icon: "💰",
    },
    {
      label: "Нові клієнти",
      value: stats.newCustomers.toString(),
      href: "/admin/customers",
      icon: "👤",
    },
    {
      label: "Очікують обробки",
      value: stats.pendingOrders.toString(),
      href: "/admin/orders?status=pending",
      icon: "⏳",
    },
  ];

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-[#1A1A1A] mb-6">Панель управління</h1>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STAT_CARDS.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-white rounded border border-[#E8E4DE] p-5 hover:border-[#C4A882] transition-colors group"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-[#6B6B6B] mb-2">{card.label}</p>
                <p className="text-2xl font-bold text-[#1A1A1A]">{card.value}</p>
              </div>
              <span className="text-2xl">{card.icon}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded border border-[#E8E4DE]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E4DE]">
          <h2 className="font-semibold text-[#1A1A1A]">Останні замовлення</h2>
          <Link href="/admin/orders" className="text-sm text-[#C4A882] hover:underline">
            Всі замовлення →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E8E4DE]">
                {["ID", "Клієнт", "Сума", "Статус", "Дата"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs uppercase tracking-wider text-[#6B6B6B] font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-[#6B6B6B]">
                    Замовлень поки немає
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-[#E8E4DE] last:border-0 hover:bg-[#FAFAF8]">
                    <td className="px-5 py-3 font-mono text-xs text-[#6B6B6B]">
                      {order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-5 py-3 font-medium">{order.customer_name}</td>
                    <td className="px-5 py-3">{formatPrice(order.total)}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium ${STATUS_COLORS[order.status] ?? ""}`}>
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[#6B6B6B]">
                      {new Date(order.created_at).toLocaleDateString("uk-UA")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
