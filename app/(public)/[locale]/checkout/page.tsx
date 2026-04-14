import { getTranslations } from "next-intl/server";
import OrderForm from "@/components/checkout/OrderForm";
import CheckoutSummary from "./CheckoutSummary";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "checkout" });
  return {
    title: t("title"),
    robots: { index: false },
  };
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "checkout" });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-serif text-3xl font-bold text-[#1A1A1A] mb-8">
        {t("title")}
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        <div className="lg:col-span-3">
          <OrderForm />
        </div>
        <div className="lg:col-span-2">
          <CheckoutSummary />
        </div>
      </div>
    </div>
  );
}
