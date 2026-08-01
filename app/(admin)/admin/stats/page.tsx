import { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  formatPrice,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  REVENUE_STATUSES,
} from "@/lib/utils";

export const metadata: Metadata = { title: "Admin — Статистика" };

// Always computed fresh: an operator who just marked an order as paid expects
// the totals to move when they open this page.
export const dynamic = "force-dynamic";

type OrderRow = {
  id: string;
  total: number;
  status: string;
  payment_type: string | null;
  created_at: string;
  customer_name: string | null;
  customer_phone: string | null;
};

type ItemRow = {
  order_id: string;
  quantity: number;
  price: number;
  products: { name: string } | null;
};

const isRevenue = (status: string) =>
  (REVENUE_STATUSES as readonly string[]).includes(status);

const sum = (rows: { total: number }[]) =>
  rows.reduce((s, r) => s + Number(r.total), 0);

/**
 * Everything is loaded in full and aggregated in JS rather than pushed into SQL.
 * At this shop's volume (tens of orders a month) that is a couple of kilobytes
 * and keeps every number in one readable place. If orders ever reach the tens of
 * thousands, move the period sums into a Postgres view.
 */
async function getStats() {
  const supabase = await createClient();

  const [ordersRes, itemsRes, customersRes, abandonedRes] = await Promise.all([
    supabase
      .from("orders")
      .select("id,total,status,payment_type,created_at,customer_name,customer_phone")
      .order("created_at", { ascending: false }),
    supabase.from("order_items").select("order_id,quantity,price,products(name)"),
    supabase.from("customers").select("id", { count: "exact", head: true }),
    supabase.from("abandoned_checkouts").select("status"),
  ]);

  const orders = (ordersRes.data ?? []) as OrderRow[];
  const items = (itemsRes.data ?? []) as unknown as ItemRow[];
  const abandoned = (abandonedRes.data ?? []) as { status: string }[];

  const active = orders.filter((o) => o.status !== "cancelled");
  const earned = orders.filter((o) => isRevenue(o.status));

  // Period boundaries, local time — "today" has to mean the operator's today.
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const since = (days: number) => {
    const d = new Date(startOfToday);
    d.setDate(d.getDate() - days + 1);
    return d;
  };

  const period = (from: Date | null) => {
    const inRange = (o: OrderRow) => !from || new Date(o.created_at) >= from;
    const a = active.filter(inRange);
    const e = earned.filter(inRange);
    const revenue = sum(e);
    return {
      orders: a.length,
      revenue,
      avg: e.length ? revenue / e.length : 0,
    };
  };

  const byStatus = Object.keys(ORDER_STATUS_LABELS).map((status) => {
    const rows = orders.filter((o) => o.status === status);
    return { status, count: rows.length, total: sum(rows) };
  });

  const byPayment = ["card", "callback"].map((type) => {
    const rows = active.filter((o) => (o.payment_type ?? "callback") === type);
    return { type, count: rows.length, total: sum(rows) };
  });

  // Product ranking counts every order that was not cancelled, including ones
  // still awaiting confirmation — hence "замовлено", not "продано".
  const activeIds = new Set(active.map((o) => o.id));
  const productTotals = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const item of items) {
    if (!activeIds.has(item.order_id)) continue;
    const name = item.products?.name ?? "— товар видалено —";
    const entry = productTotals.get(name) ?? { name, qty: 0, revenue: 0 };
    entry.qty += item.quantity;
    entry.revenue += Number(item.price) * item.quantity;
    productTotals.set(name, entry);
  }
  const topProducts = [...productTotals.values()]
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 8);

  // Grouped by phone: the same person ordering twice under "Аня" and "Анна"
  // is still one customer, and the phone is what the shop actually calls.
  const customerTotals = new Map<
    string,
    { name: string; phone: string; orders: number; total: number }
  >();
  for (const o of active) {
    const phone = o.customer_phone ?? "—";
    const entry = customerTotals.get(phone) ?? {
      name: o.customer_name ?? "—",
      phone,
      orders: 0,
      total: 0,
    };
    entry.orders += 1;
    entry.total += Number(o.total);
    customerTotals.set(phone, entry);
  }
  const topCustomers = [...customerTotals.values()]
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  const converted = abandoned.filter((a) => a.status === "ordered").length;

  return {
    totals: {
      revenue: sum(earned),
      pendingValue: sum(orders.filter((o) => o.status === "pending")),
      activeOrders: active.length,
      avgCheck: earned.length ? sum(earned) / earned.length : 0,
      customers: customersRes.count ?? 0,
    },
    periods: [
      { label: "Сьогодні", ...period(startOfToday) },
      { label: "7 днів", ...period(since(7)) },
      { label: "30 днів", ...period(since(30)) },
      { label: "За весь час", ...period(null) },
    ],
    byStatus,
    byPayment,
    topProducts,
    topCustomers,
    abandoned: {
      total: abandoned.length,
      converted,
      rate: abandoned.length ? (converted / abandoned.length) * 100 : 0,
    },
  };
}

function Card({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: string;
  hint?: string;
  href?: string;
}) {
  const inner = (
    <>
      <p className="text-xs uppercase tracking-wider text-[#6B6B6B] mb-2">{label}</p>
      <p className="text-2xl font-bold text-[#1A1A1A]">{value}</p>
      {hint && <p className="text-xs text-[#6B6B6B] mt-1.5 leading-snug">{hint}</p>}
    </>
  );
  const className =
    "block bg-white rounded border border-[#E8E4DE] p-5" +
    (href ? " hover:border-[#C4A882] transition-colors" : "");
  return href ? (
    <Link href={href} className={className}>
      {inner}
    </Link>
  ) : (
    <div className={className}>{inner}</div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded border border-[#E8E4DE]">
      <div className="px-5 py-4 border-b border-[#E8E4DE]">
        <h2 className="font-semibold text-[#1A1A1A]">{title}</h2>
      </div>
      {children}
    </div>
  );
}

const TH = "px-5 py-3 text-left text-xs uppercase tracking-wider text-[#6B6B6B] font-medium";
const TH_R = TH.replace("text-left", "text-right");
const TD = "px-5 py-3";
const TD_R = "px-5 py-3 text-right tabular-nums";
const ROW = "border-b border-[#E8E4DE] last:border-0 hover:bg-[#FAFAF8]";

export default async function AdminStats() {
  const s = await getStats();

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-[#1A1A1A] mb-6">Статистика</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card
          label="Виручка загалом"
          value={formatPrice(s.totals.revenue)}
          hint="Лише підтверджені замовлення — оплачені, в обробці, відправлені, доставлені."
        />
        <Card
          label="Очікує підтвердження"
          value={formatPrice(s.totals.pendingValue)}
          hint="Сума замовлень зі статусом «Очікує». Ще не виручка."
          href="/admin/orders?status=pending"
        />
        <Card
          label="Середній чек"
          value={formatPrice(s.totals.avgCheck)}
          hint="За підтвердженими замовленнями."
        />
        <Card
          label="Клієнтів"
          value={s.totals.customers.toString()}
          hint={`Активних замовлень: ${s.totals.activeOrders}`}
          href="/admin/customers"
        />
      </div>

      {s.totals.revenue === 0 && s.totals.pendingValue > 0 && (
        <div className="mb-8 rounded border border-[#E8E4DE] bg-[#FDF9F5] px-5 py-4 text-sm text-[#6B6B6B]">
          <span className="font-medium text-[#1A1A1A]">Виручка показує нуль не через помилку.</span>{" "}
          Усі замовлення досі мають статус «Очікує». Виручка рахується лише після того, як ви
          переведете замовлення в «Оплачено» чи далі — до того це потенційні продажі, а не гроші.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Panel title="За періодами">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E8E4DE]">
                  <th className={TH}>Період</th>
                  <th className={TH_R}>Замовлень</th>
                  <th className={TH_R}>Виручка</th>
                  <th className={TH_R}>Сер. чек</th>
                </tr>
              </thead>
              <tbody>
                {s.periods.map((p) => (
                  <tr key={p.label} className={ROW}>
                    <td className={`${TD} font-medium`}>{p.label}</td>
                    <td className={TD_R}>{p.orders}</td>
                    <td className={TD_R}>{formatPrice(p.revenue)}</td>
                    <td className={`${TD_R} text-[#6B6B6B]`}>{formatPrice(p.avg)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="За статусами">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E8E4DE]">
                  <th className={TH}>Статус</th>
                  <th className={TH_R}>Замовлень</th>
                  <th className={TH_R}>Сума</th>
                </tr>
              </thead>
              <tbody>
                {s.byStatus.map((row) => (
                  <tr key={row.status} className={ROW}>
                    <td className={TD}>
                      <span className={`font-medium ${ORDER_STATUS_COLORS[row.status] ?? ""}`}>
                        {ORDER_STATUS_LABELS[row.status]}
                      </span>
                    </td>
                    <td className={TD_R}>{row.count}</td>
                    <td className={`${TD_R} ${row.count ? "" : "text-[#A0A0A0]"}`}>
                      {formatPrice(row.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Panel title="Спосіб оплати">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E8E4DE]">
                  <th className={TH}>Спосіб</th>
                  <th className={TH_R}>Замовлень</th>
                  <th className={TH_R}>Сума</th>
                </tr>
              </thead>
              <tbody>
                {s.byPayment.map((row) => (
                  <tr key={row.type} className={ROW}>
                    <td className={`${TD} font-medium`}>
                      {row.type === "card" ? "💳 Картка" : "📞 Зворотній зв'язок"}
                    </td>
                    <td className={TD_R}>{row.count}</td>
                    <td className={TD_R}>{formatPrice(row.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Незавершені кошики">
          <div className="px-5 py-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-[#1A1A1A]">{s.abandoned.total}</p>
              <p className="text-xs text-[#6B6B6B] mt-1">Усього</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#38A169]">{s.abandoned.converted}</p>
              <p className="text-xs text-[#6B6B6B] mt-1">Дійшли до замовлення</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1A1A1A]">
                {s.abandoned.rate.toFixed(0)}%
              </p>
              <p className="text-xs text-[#6B6B6B] mt-1">Конверсія</p>
            </div>
          </div>
          <div className="px-5 pb-4">
            <Link href="/admin/abandoned" className="text-sm text-[#C4A882] hover:underline">
              Переглянути незавершені →
            </Link>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="Топ товарів">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E8E4DE]">
                  <th className={TH}>Товар</th>
                  <th className={TH_R}>Шт.</th>
                  <th className={TH_R}>Сума</th>
                </tr>
              </thead>
              <tbody>
                {s.topProducts.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-8 text-center text-[#6B6B6B]">
                      Замовлень поки немає
                    </td>
                  </tr>
                ) : (
                  s.topProducts.map((p) => (
                    <tr key={p.name} className={ROW}>
                      <td className={TD}>{p.name}</td>
                      <td className={`${TD_R} font-medium`}>{p.qty}</td>
                      <td className={`${TD_R} text-[#6B6B6B]`}>{formatPrice(p.revenue)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <p className="px-5 py-3 text-xs text-[#6B6B6B] border-t border-[#E8E4DE]">
            Враховано всі замовлення, крім скасованих — включно з тими, що ще очікують.
          </p>
        </Panel>

        <Panel title="Топ клієнтів">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E8E4DE]">
                  <th className={TH}>Клієнт</th>
                  <th className={TH_R}>Замовлень</th>
                  <th className={TH_R}>Сума</th>
                </tr>
              </thead>
              <tbody>
                {s.topCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-8 text-center text-[#6B6B6B]">
                      Клієнтів поки немає
                    </td>
                  </tr>
                ) : (
                  s.topCustomers.map((c) => (
                    <tr key={c.phone} className={ROW}>
                      <td className={TD}>
                        <span className="font-medium">{c.name}</span>
                        <span className="block text-xs text-[#6B6B6B]">{c.phone}</span>
                      </td>
                      <td className={TD_R}>{c.orders}</td>
                      <td className={`${TD_R} font-medium`}>{formatPrice(c.total)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}
