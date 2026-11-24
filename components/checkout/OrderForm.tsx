"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { createCheckoutSchema, isValidPhone, normalizePhone, type CheckoutFormData } from "@/lib/validations";
import Input from "@/components/ui/Input";
import NovaPoshtaSelect from "./NovaPoshtaSelect";
import { useCart } from "@/hooks/useCart";
import toast from "react-hot-toast";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter, Link } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { sendGAEvent } from "@/lib/analytics";
import { CARD_PAYMENT_ENABLED } from "@/lib/payment-flags";
import type { NovaPoshtaCity, NovaPoshtaWarehouse } from "@/types";
import {
  filledFieldCount,
  readCheckoutDraft,
  writeCheckoutDraft,
  type CheckoutDraft,
} from "@/lib/checkout-draft";

// The draft lives in sessionStorage, which the server cannot see. Read through
// useSyncExternalStore: hydration uses the server snapshot (no draft), so the
// HTML matches, and React re-renders with the draft right after.
const subscribeNever = () => () => {};
const noDraft = () => null;

const toDraft = (values: Partial<CheckoutFormData>): CheckoutDraft => ({
  firstName: values.firstName ?? "",
  lastName: values.lastName ?? "",
  phone: values.phone ?? "",
  email: values.email ?? "",
  notes: values.notes ?? "",
  paymentMethod: values.paymentMethod === "card" ? "card" : "callback",
  city: values.city ?? "",
  cityRef: values.cityRef ?? "",
  novaPoshtaRef: values.novaPoshtaRef ?? "",
  novaPoshtaAddress: values.novaPoshtaAddress ?? "",
});

export default function OrderForm() {
  const t = useTranslations("checkout");
  const locale = useLocale();
  const router = useRouter();
  const { items } = useCart();
  const cartTotal = useCart((s) => s.total());
  const [submitting, setSubmitting] = useState(false);
  const [, setCity] = useState<NovaPoshtaCity | null>(null);
  const [, setWarehouse] = useState<NovaPoshtaWarehouse | null>(null);

  // What the shopper typed before leaving the form (a recommended product, a
  // language switch, a reload), read once per mount. A stored card choice
  // falls back to callback when card payment is off — its tile is not
  // rendered, and an invisible choice must not stay selected.
  const draftRead = useRef<CheckoutDraft | null | undefined>(undefined);
  const readDraftOnce = useCallback(() => {
    if (draftRead.current === undefined) draftRead.current = readCheckoutDraft();
    return draftRead.current;
  }, []);
  const storedDraft = useSyncExternalStore(subscribeNever, readDraftOnce, noDraft);
  const draft = useMemo(
    () =>
      storedDraft && storedDraft.paymentMethod === "card" && !CARD_PAYMENT_ENABLED
        ? { ...storedDraft, paymentMethod: "callback" as const }
        : storedDraft,
    [storedDraft],
  );

  const schema = useMemo(
    () =>
      createCheckoutSchema({
        firstName: t("errFirstName"),
        lastName: t("errLastName"),
        phone: t("errPhone"),
        email: t("errEmail"),
        city: t("errCity"),
        warehouse: t("errWarehouse"),
        offer: t("errOffer"),
      }),
    [t]
  );

  const {
    register,
    handleSubmit,
    setValue,
    setFocus,
    watch,
    reset,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    // Порожні рядки замість undefined, щоб zod давав локалізовані min(1)-помилки
    defaultValues: {
      // Card by default (the owner's choice). When card payment is switched
      // off its tile is not rendered, so the form must not keep that invisible
      // option selected: fall back to callback.
      paymentMethod: CARD_PAYMENT_ENABLED ? "card" : "callback",
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      city: "",
      cityRef: "",
      novaPoshtaRef: "",
      novaPoshtaAddress: "",
      notes: "",
      acceptOffer: false as unknown as true,
    },
  });

  const paymentMethod = watch("paymentMethod");
  const watchedCity = watch("city");
  const watchedCityRef = watch("cityRef");
  const watchedWarehouse = watch("novaPoshtaRef");
  const shippingTrackedRef = useRef(false);

  // Apply the draft once per mount (refs survive StrictMode's second effect
  // run). acceptOffer is not part of the draft and stays unticked: the offer
  // is a consent the shopper gives anew each time.
  const draftApplied = useRef(false);
  useEffect(() => {
    if (!draft || draftApplied.current) return;
    draftApplied.current = true;
    reset({ ...draft, acceptOffer: false as unknown as true });
    sendGAEvent("event", "checkout_draft_restore", { field_count: filledFieldCount(draft) });
  }, [draft, reset]);

  // Keep the draft as the shopper types. A subscription fires on changes only,
  // never on mount, so an empty form cannot overwrite a stored draft before it
  // has been applied.
  useEffect(() => {
    const subscription = watch((values) => writeCheckoutDraft(toDraft(values)));
    return () => subscription.unsubscribe();
  }, [watch]);

  // City and branch that came back with the draft: not a new choice, so they
  // do not count as add_shipping_info. Changing either one still does.
  const restoredShipping =
    draft && draft.cityRef && draft.novaPoshtaRef ? `${draft.cityRef}|${draft.novaPoshtaRef}` : null;

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
    if (restoredShipping === `${watchedCityRef}|${watchedWarehouse}`) return;
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
  }, [watchedCity, watchedCityRef, watchedWarehouse, restoredShipping, items, cartTotal]);

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
      // Prices are deliberately not sent: the server looks each product up and
      // computes the total itself, so a tampered cart cannot change what is
      // charged.
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          email: data.email,
          city: data.city,
          cityRef: data.cityRef,
          novaPoshtaRef: data.novaPoshtaRef,
          novaPoshtaAddress: data.novaPoshtaAddress,
          paymentMethod: data.paymentMethod,
          notes: data.notes,
          locale,
          acceptOffer: data.acceptOffer,
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
        }),
      });

      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "" }));
        if (error === "product_unavailable") throw new Error(t("productUnavailable"));
        throw new Error(t("orderCreateError"));
      }

      const { orderId } = await res.json();

      if (data.paymentMethod === "callback") {
        // Only a completed order excludes the phone from recovery outreach. For
        // card orders this happens once payment settles — otherwise every
        // abandoned card payment would be counted as a conversion.
        fetch("/api/abandoned-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "ordered", phone: data.phone, orderId }),
        }).catch(() => {});

        await fetch("/api/notify-callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        });
        router.push(`/checkout/success?orderId=${orderId}`);
        return;
      }

      // Карткова оплата: сервер підписує суму із замовлення, клієнт лише
      // відправляє готову форму на LiqPay.
      const pfRes = await fetch("/api/liqpay/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      // The order itself already exists at this point — only the payment rail
      // failed. Reporting "could not create order" would be a lie that leaves a
      // pending card order nobody will ever pay, so fall back to the phone flow
      // and tell the shopper exactly that.
      if (!pfRes.ok) {
        await fetch("/api/notify-callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, reason: "card_unavailable" }),
        }).catch(() => {});

        fetch("/api/abandoned-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "ordered", phone: data.phone, orderId }),
        }).catch(() => {});

        sendGAEvent("event", "card_payment_unavailable", {
          currency: "UAH",
          value: cartTotal,
        });

        toast.error(t("cardUnavailableFallback"), { duration: 8000 });
        router.push(`/checkout/success?orderId=${orderId}`);
        return;
      }

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
    } catch (err) {
      sendGAEvent("event", "order_failed", {
        currency: "UAH",
        value: cartTotal,
        payment_type: data.paymentMethod === "callback" ? "Callback" : "Card",
        reason: err instanceof Error ? err.message : "unknown",
      });
      // Show the specific reason when we have one (e.g. an item went out of
      // stock while it sat in the cart) — a generic toast leaves the shopper
      // with no idea what to change.
      toast.error(err instanceof Error && err.message ? err.message : t("errorGeneric"));
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted">{t("cartEmpty")}</p>
      </div>
    );
  }

  return (
    // id + scroll-mt: "Continue to checkout" under the order summary scrolls
    // here and must clear the sticky header (65px). See CheckoutSummary.
    <form
      id="checkout-form"
      onSubmit={handleSubmit(onSubmit, onValidationError)}
      className="space-y-6 scroll-mt-20"
    >
      {/* Contact info */}
      <div>
        <h2 className="font-serif text-xl font-semibold text-foreground mb-4">{t("contactInfo")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label={t("firstName")}
            placeholder={t("firstNamePlaceholder")}
            autoComplete="given-name"
            error={errors.firstName?.message}
            {...register("firstName")}
          />
          <Input
            label={t("lastName")}
            placeholder={t("lastNamePlaceholder")}
            autoComplete="family-name"
            error={errors.lastName?.message}
            {...register("lastName")}
          />
          <Input
            label={t("phone")}
            placeholder={t("phonePlaceholder")}
            autoComplete="tel"
            type="tel"
            error={errors.phone?.message}
            hint={t("phoneHint")}
            {...register("phone")}
          />
          <Input
            label={t("email")}
            placeholder={t("emailPlaceholder")}
            autoComplete="email"
            type="email"
            error={errors.email?.message}
            {...register("email")}
          />
        </div>
      </div>

      {/* Delivery */}
      <div ref={deliverySectionRef}>
        <h2 className="font-serif text-xl font-semibold text-foreground mb-4">{t("deliverySection")}</h2>
        <NovaPoshtaSelect
          // Remounted when the draft arrives, so it starts from the restored
          // city and branch (it keeps its own state from mount on).
          key={draft ? "draft" : "fresh"}
          initialCity={draft?.city && draft.cityRef ? { Ref: draft.cityRef, Description: draft.city } : null}
          initialWarehouse={
            draft?.novaPoshtaRef
              ? { Ref: draft.novaPoshtaRef, Description: draft.novaPoshtaAddress }
              : null
          }
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
        <h2 className="font-serif text-xl font-semibold text-foreground mb-4">{t("paymentSection")}</h2>
        <div className={`grid gap-3 ${CARD_PAYMENT_ENABLED ? "grid-cols-2" : "grid-cols-1"}`}>
          {[
            { value: "callback", icon: "📞", label: t("callback"), sub: t("callbackSub") },
            ...(CARD_PAYMENT_ENABLED
              ? [{ value: "card", icon: "💳", label: t("card"), sub: t("cardSub") }]
              : []),
          ].map((opt) => (
            <label
              key={opt.value}
              className={`flex flex-col items-center gap-1.5 p-4 border-2 rounded cursor-pointer transition-all ${
                paymentMethod === opt.value
                  ? "border-accent bg-cream"
                  : "border-border hover:border-accent"
              }`}
            >
              <input type="radio" value={opt.value} className="sr-only" {...register("paymentMethod")} />
              <span className="text-xl">{opt.icon}</span>
              <span className="text-xs font-semibold text-foreground text-center">{opt.label}</span>
              <span className="text-[11px] text-muted text-center">{opt.sub}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="text-sm font-medium text-foreground block mb-1">
          {t("notes")}
        </label>
        <textarea
          rows={2}
          placeholder={t("notesPlaceholder")}
          className="w-full px-4 py-3 text-sm border border-border rounded bg-surface focus:outline-none focus:ring-2 focus:ring-accent resize-none"
          {...register("notes")}
        />
      </div>

      {/* Public offer acceptance — required before any payment is taken */}
      <div>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="mt-0.5 w-4 h-4 shrink-0 accent-accent"
            {...register("acceptOffer")}
          />
          <span className="text-xs text-muted leading-relaxed">
            {t.rich("offerAccept", {
              // Localized Link, so an /en shopper is not sent to the Ukrainian page.
              offer: (chunks) => (
                <Link href="/offer" target="_blank" className="text-accent hover:underline">
                  {chunks}
                </Link>
              ),
              delivery: (chunks) => (
                <Link href="/delivery" target="_blank" className="text-accent hover:underline">
                  {chunks}
                </Link>
              ),
            })}
          </span>
        </label>
        {errors.acceptOffer && (
          <p className="text-xs text-error mt-1.5" role="alert">
            {errors.acceptOffer.message}
          </p>
        )}
      </div>

      {Object.keys(errors).length > 0 && (
        <p className="text-sm text-error text-center" role="alert">
          {t("formHasErrors")}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-ink text-on-ink py-4 text-sm font-medium rounded hover:bg-accent transition-colors disabled:opacity-50 uppercase tracking-wider"
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
