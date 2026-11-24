import { getTranslations } from "next-intl/server";
import OrderForm from "@/components/checkout/OrderForm";
import CheckoutSummary from "./CheckoutSummary";
import CartRecommendations from "@/components/shop/CartRecommendations";
import type { Metadata } from "next";
import { pageTitle } from "@/lib/seo-title";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "checkout" });
  return {
    title: pageTitle(t("title")),
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
      <h1 className="font-serif text-3xl font-bold text-foreground mb-8">
        {t("title")}
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        <div className="lg:col-span-3 space-y-6">
          <OrderForm />
          <CartRecommendations variant="checkout" limit={6} />
        </div>
        {/* In one column (phones, tablets) the order comes first: the shopper
            sees what they are buying before the form, not after the
            recommendations. From lg it is the right-hand column again. */}
        <div className="lg:col-span-2 order-first lg:order-none">
          <CheckoutSummary />
        </div>
      </div>
    </div>
  );
}
