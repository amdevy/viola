import Badge from "@/components/ui/Badge";
import type { OrderStatus } from "@/types";

const STATUS_CONFIG: Record<OrderStatus, { label: string; variant: "default" | "success" | "warning" | "error" | "accent" }> = {
  pending: { label: "Очікує", variant: "warning" },
  paid: { label: "Оплачено", variant: "success" },
  processing: { label: "Обробляється", variant: "accent" },
  shipped: { label: "Відправлено", variant: "accent" },
  delivered: { label: "Доставлено", variant: "success" },
  cancelled: { label: "Скасовано", variant: "error" },
};

export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = STATUS_CONFIG[status] ?? { label: status, variant: "default" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
