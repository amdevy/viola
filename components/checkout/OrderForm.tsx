"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { checkoutSchema, type CheckoutFormData } from "@/lib/validations";
import Input from "@/components/ui/Input";
import NovaPoshtaSelect from "./NovaPoshtaSelect";
import { useCart } from "@/hooks/useCart";
import toast from "react-hot-toast";
import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import type { NovaPoshtaCity, NovaPoshtaWarehouse } from "@/types";

export default function OrderForm() {
  const t = useTranslations("checkout");
  const router = useRouter();
  const { items, clearCart } = useCart();
  const cartTotal = useCart((s) => s.total());
  const [submitting, setSubmitting] = useState(false);
  const [, setCity] = useState<NovaPoshtaCity | null>(null);
  const [, setWarehouse] = useState<NovaPoshtaWarehouse | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { paymentMethod: "callback" },
  });

  const paymentMethod = watch("paymentMethod");

  const onSubmit = async (data: CheckoutFormData) => {
    if (items.length === 0) {
      toast.error(t("cartEmpty"));
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

      if (!res.ok) throw new Error(t("orderCreateError"));

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
    } catch {
      toast.error(t("errorGeneric"));
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[#6B6B6B]">{t("cartEmpty")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Contact info */}
      <div>
        <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-4">{t("contactInfo")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label={t("firstName")}
            placeholder={t("firstNamePlaceholder")}
            error={errors.firstName?.message}
            {...register("firstName")}
          />
          <Input
            label={t("lastName")}
            placeholder={t("lastNamePlaceholder")}
            error={errors.lastName?.message}
            {...register("lastName")}
          />
          <Input
            label={t("phone")}
            placeholder={t("phonePlaceholder")}
            type="tel"
            error={errors.phone?.message}
            {...register("phone")}
          />
          <Input
            label={t("email")}
            placeholder={t("emailPlaceholder")}
            type="email"
            error={errors.email?.message}
            {...register("email")}
          />
        </div>
      </div>

      {/* Delivery */}
      <div>
        <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-4">{t("deliverySection")}</h2>
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
        <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-4">{t("paymentSection")}</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: "callback", icon: "📞", label: t("callback"), sub: t("callbackSub") },
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
          {t("notes")}
        </label>
        <textarea
          rows={2}
          placeholder={t("notesPlaceholder")}
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
          ? t("submitting")
          : paymentMethod === "callback"
          ? t("submit")
          : t("submitPay")}
      </button>
    </form>
  );
}
