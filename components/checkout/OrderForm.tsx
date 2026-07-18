"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { createCheckoutSchema, isValidPhone, normalizePhone, type CheckoutFormData } from "@/lib/validations";
import Input from "@/components/ui/Input";
import NovaPoshtaSelect from "./NovaPoshtaSelect";
import { useCart } from "@/hooks/useCart";
import toast from "react-hot-toast";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "@/i18n/routing";
import { sendGAEvent } from "@next/third-parties/google";
import type { NovaPoshtaCity, NovaPoshtaWarehouse } from "@/types";

export default function OrderForm() {
  const t = useTranslations("checkout");
  const router = useRouter();
  const { items } = useCart();
  const cartTotal = useCart((s) => s.total());
  const [submitting, setSubmitting] = useState(false);
  const [, setCity] = useState<NovaPoshtaCity | null>(null);
  const [, setWarehouse] = useState<NovaPoshtaWarehouse | null>(null);

  const schema = useMemo(
    () =>
      createCheckoutSchema({
        firstName: t("errFirstName"),
        lastName: t("errLastName"),
        phone: t("errPhone"),
        email: t("errEmail"),
        city: t("errCity"),
        warehouse: t("errWarehouse"),
      }),
    [t]
  );

  const {
    register,
    handleSubmit,
    setValue,
    setFocus,
    watch,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    // Порожні рядки замість undefined, щоб zod давав локалізовані min(1)-помилки
    defaultValues: {
      paymentMethod: "callback",
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      city: "",
      cityRef: "",
      novaPoshtaRef: "",
      novaPoshtaAddress: "",
      notes: "",
    },
  });

  const paymentMethod = watch("paymentMethod");
  const watchedCity = watch("city");
  const watchedWarehouse = watch("novaPoshtaRef");
  const shippingTrackedRef = useRef(false);

  // Capture an in-progress checkout once the phone is valid, so we can measure
  // how many shoppers start the form but never submit. Debounced; keeps the
  // latest state per phone. Marked 'ordered' on successful submit (see below).
  const watchedPhone = watch("phone");
  const watchedFirstName = watch("firstName");
  const watchedLastName = watch("lastName");
  const watchedEmail = watch("email");
  const watchedAddress = watch("novaPoshtaAddress");

  useEffect(() => {
    if (items.length === 0) return;
    const phone = normalizePhone(watchedPhone || "");
    if (!isValidPhone(phone)) return;
    const timer = setTimeout(() => {
      fetch("/api/abandoned-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "capture",
          phone,
          name: [watchedFirstName, watchedLastName].filter(Boolean).join(" ").trim() || null,
          email: watchedEmail || null,
          city: watchedCity || null,
          npAddress: watchedAddress || null,
          items: items.map((i) => ({
            productId: i.productId,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
          })),
          total: cartTotal,
        }),
      }).catch(() => {});
    }, 1200);
    return () => clearTimeout(timer);
  }, [watchedPhone, watchedFirstName, watchedLastName, watchedEmail, watchedCity, watchedAddress, items, cartTotal]);

  useEffect(() => {
    if (items.length === 0) return;
    sendGAEvent("event", "begin_checkout", {
      currency: "UAH",
      value: cartTotal,
      items: items.map((i) => ({
        item_id: i.productId,
        item_name: i.name,
        price: i.price,
        quantity: i.quantity,
      })),
    });
    // Only fire once when checkout form mounts with items
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!watchedCity || !watchedWarehouse || shippingTrackedRef.current) return;
    if (items.length === 0) return;
    shippingTrackedRef.current = true;
    sendGAEvent("event", "add_shipping_info", {
      currency: "UAH",
      value: cartTotal,
      shipping_tier: "Nova Poshta",
      items: items.map((i) => ({
        item_id: i.productId,
        item_name: i.name,
        price: i.price,
        quantity: i.quantity,
      })),
    });
  }, [watchedCity, watchedWarehouse, items, cartTotal]);

  const deliverySectionRef = useRef<HTMLDivElement>(null);

  const FIELD_ORDER: (keyof CheckoutFormData)[] = [
    "firstName",
    "lastName",
    "phone",
    "email",
    "city",
    "cityRef",
    "novaPoshtaRef",
    "novaPoshtaAddress",
  ];
  // Поля НП не зареєстровані як інпути — до них скролимо секцією
  const NP_FIELDS: (keyof CheckoutFormData)[] = ["city", "cityRef", "novaPoshtaRef", "novaPoshtaAddress"];

  const onValidationError = (formErrors: Record<string, { message?: string } | undefined>) => {
    const failedFields = Object.keys(formErrors).filter((k) => formErrors[k]);
    if (failedFields.length === 0) return;
    sendGAEvent("event", "form_validation_error", {
      form_name: "checkout",
      fields: failedFields.join(","),
      field_count: failedFields.length,
    });
    const first = FIELD_ORDER.find((f) => failedFields.includes(f));
    if (!first) return;
    if (NP_FIELDS.includes(first)) {
      deliverySectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      setFocus(first);
    }
  };

  const onSubmit = async (data: CheckoutFormData) => {
    if (items.length === 0) {
      toast.error(t("cartEmpty"));
      return;
    }
    sendGAEvent("event", "add_payment_info", {
      currency: "UAH",
      value: cartTotal,
      payment_type: data.paymentMethod === "callback" ? "Callback" : "Card",
      items: items.map((i) => ({
        item_id: i.productId,
        item_name: i.name,
        price: i.price,
        quantity: i.quantity,
      })),
    });
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

      // This phone completed an order — exclude it from abandonment tracking.
      fetch("/api/abandoned-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ordered", phone: data.phone }),
      }).catch(() => {});

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
      router.push(`/checkout/success?orderId=${orderId}`);
      return;

      /* LiqPay card payment — disabled, awaiting MonoPay integration
      if (data.paymentMethod === "card") {
        const pfRes = await fetch("/api/liqpay/checkout", {
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

        if (!pfRes.ok) throw new Error(t("orderCreateError"));

        const { data: lpData, signature, action } = await pfRes.json();

        const form = document.createElement("form");
        form.method = "POST";
        form.action = action;
        form.acceptCharset = "utf-8";

        const dataInput = document.createElement("input");
        dataInput.type = "hidden";
        dataInput.name = "data";
        dataInput.value = lpData;
        form.appendChild(dataInput);

        const sigInput = document.createElement("input");
        sigInput.type = "hidden";
        sigInput.name = "signature";
        sigInput.value = signature;
        form.appendChild(sigInput);

        document.body.appendChild(form);
        form.submit();
      }
      */
    } catch (err) {
      sendGAEvent("event", "order_failed", {
        currency: "UAH",
        value: cartTotal,
        payment_type: data.paymentMethod === "callback" ? "Callback" : "Card",
        reason: err instanceof Error ? err.message : "unknown",
      });
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
    <form onSubmit={handleSubmit(onSubmit, onValidationError)} className="space-y-6">
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
            hint={t("phoneHint")}
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
      <div ref={deliverySectionRef}>
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
        <div className="grid grid-cols-1 gap-3">
          {[
            { value: "callback", icon: "📞", label: t("callback"), sub: t("callbackSub") },
            // Card payment temporarily disabled — pending MonoPay integration
            // { value: "card", icon: "💳", label: t("card"), sub: t("cardSub") },
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

      {Object.keys(errors).length > 0 && (
        <p className="text-sm text-[#E53E3E] text-center" role="alert">
          {t("formHasErrors")}
        </p>
      )}

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
