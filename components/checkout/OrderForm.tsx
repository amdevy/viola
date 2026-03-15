"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { checkoutSchema, type CheckoutFormData } from "@/lib/validations";
import Input from "@/components/ui/Input";
import NovaPoshtaSelect from "./NovaPoshtaSelect";
import PaymentButton from "./PaymentButton";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { NovaPoshtaCity, NovaPoshtaWarehouse } from "@/types";

export default function OrderForm() {
  const router = useRouter();
  const { items, total, clearCart } = useCart();
  const cartTotal = useCart((s) => s.total());
  const [submitting, setSubmitting] = useState(false);
  const [city, setCity] = useState<NovaPoshtaCity | null>(null);
  const [warehouse, setWarehouse] = useState<NovaPoshtaWarehouse | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { paymentMethod: "card" },
  });

  const paymentMethod = watch("paymentMethod");

  const onSubmit = async (data: CheckoutFormData) => {
    if (items.length === 0) {
      toast.error("Ваш кошик порожній");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            price: i.price,
            name: i.name,
          })),
          total: cartTotal,
        }),
      });

      if (!res.ok) throw new Error("Помилка створення замовлення");

      const { orderId } = await res.json();

      if (data.paymentMethod === "callback") {
        await fetch("/api/notify-callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            customer: {
              name: `${data.firstName} ${data.lastName}`,
              phone: data.phone,
            },
            items: items.map((i) => ({
              name: i.name,
              price: i.price,
              qty: i.quantity,
            })),
            total: cartTotal,
            notes: data.notes || null,
            city: data.city,
            novaPoshtaAddress: data.novaPoshtaAddress,
          }),
        });
        clearCart();
        router.push(`/checkout/success?orderId=${orderId}`);
        return;
      }

      const pfRes = await fetch("/api/wayforpay/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          items: items.map((i) => ({
            name: i.name,
            price: i.price,
            qty: i.quantity,
          })),
          customer: {
            name: `${data.firstName} ${data.lastName}`,
            phone: data.phone,
            email: data.email ?? "",
          },
        }),
      });

      const html = await pfRes.text();
      const div = document.createElement("div");
      div.innerHTML = html;
      document.body.appendChild(div);
      const form = div.querySelector("form");
      if (form) form.submit();
      clearCart();
    } catch (err) {
      toast.error("Виникла помилка. Спробуйте ще раз.");
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[#6B6B6B]">Ваш кошик порожній.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Contact info */}
      <div>
        <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-4">Контактні дані</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Ім'я"
            placeholder="Олена"
            error={errors.firstName?.message}
            {...register("firstName")}
          />
          <Input
            label="Прізвище"
            placeholder="Іваненко"
            error={errors.lastName?.message}
            {...register("lastName")}
          />
          <Input
            label="Телефон"
            placeholder="+380500582175"
            type="tel"
            error={errors.phone?.message}
            {...register("phone")}
          />
          <Input
            label="Email (необов'язково)"
            placeholder="email@example.com"
            type="email"
            error={errors.email?.message}
            {...register("email")}
          />
        </div>
      </div>

      {/* Delivery */}
      <div>
        <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-4">Доставка</h2>
        <NovaPoshtaSelect
          onCityChange={(c) => {
            setCity(c);
            setValue("city", c?.Description ?? "");
            setValue("cityRef", c?.Ref ?? "");
          }}
          onWarehouseChange={(w) => {
            setWarehouse(w);
            setValue("novaPoshtaRef", w?.Ref ?? "");
            setValue("novaPoshtaAddress", w?.Description ?? "");
          }}
          cityError={errors.city?.message}
          warehouseError={errors.novaPoshtaRef?.message}
        />
      </div>

      {/* Payment */}
      <div>
        <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-4">Оплата</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: "card", icon: "💳", label: "Карткою онлайн", sub: "WayForPay" },
            { value: "callback", icon: "📞", label: "Зворотній зв'язок", sub: "Ми зателефонуємо вам" },
          ].map((opt) => (
            <label
              key={opt.value}
              className={`flex flex-col items-center gap-1.5 p-4 border-2 rounded cursor-pointer transition-all ${
                paymentMethod === opt.value
                  ? "border-[#C4A882] bg-[#FDF9F5]"
                  : "border-[#E8E4DE] hover:border-[#C4A882]"
              }`}
            >
              <input type="radio" value={opt.value} className="sr-only" {...register("paymentMethod")} />
              <span className="text-xl">{opt.icon}</span>
              <span className="text-xs font-semibold text-[#1A1A1A] text-center">{opt.label}</span>
              <span className="text-[11px] text-[#6B6B6B] text-center">{opt.sub}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="text-sm font-medium text-[#1A1A1A] block mb-1">
          Коментар до замовлення (необов'язково)
        </label>
        <textarea
          rows={2}
          placeholder="Додаткові побажання..."
          className="w-full px-4 py-3 text-sm border border-[#E8E4DE] rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#C4A882] resize-none"
          {...register("notes")}
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-[#1A1A1A] text-white py-4 text-sm font-medium rounded hover:bg-[#C4A882] transition-colors disabled:opacity-50 uppercase tracking-wider"
      >
        {submitting
          ? "Оформлення..."
          : paymentMethod === "callback"
          ? "Залишити заявку"
          : "Оформити замовлення"}
      </button>
    </form>
  );
}
