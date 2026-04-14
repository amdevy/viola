import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "success" });
  return {
    title: t("title"),
    robots: { index: false },
  };
}

export default async function SuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { locale } = await params;
  const { orderId } = await searchParams;
  const t = await getTranslations({ locale, namespace: "success" });

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-[#C6F6D5] rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-[#38A169]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="font-serif text-3xl font-bold text-[#1A1A1A] mb-3">
          {t("title")}
        </h1>
        <p className="text-[#6B6B6B] mb-2">
          {t("orderAccepted")}
        </p>
        {orderId && (
          <p className="text-sm text-[#A0A0A0] mb-6">
            {t("orderNumber")} <span className="font-mono font-medium text-[#1A1A1A]">{orderId.slice(0, 8).toUpperCase()}</span>
          </p>
        )}
        <p className="text-sm text-[#6B6B6B] mb-6">
          {t("willContact")}
        </p>
        <p className="text-sm text-[#6B6B6B] mb-8">
          {t("reviewPrompt")}{" "}
          <a
            href="https://g.page/r/CelormETodeaAQ0/review"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#C4A882] hover:underline font-medium"
          >
            {t("googleReview")}
          </a>
          {" "}{t("reviewTime")}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/shop"
            className="inline-flex items-center justify-center bg-[#1A1A1A] text-white px-8 py-3 text-sm font-medium rounded hover:bg-[#C4A882] transition-colors"
          >
            {t("continueShopping")}
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center border border-[#E8E4DE] text-[#1A1A1A] px-8 py-3 text-sm font-medium rounded hover:border-[#C4A882] transition-colors"
          >
            {t("goHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}
