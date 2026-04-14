import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://violamukachevo.com";
  const ukUrl = `${siteUrl}/delivery`;
  const enUrl = `${siteUrl}/en/delivery`;

  return {
    title: t("deliveryTitle"),
    description: t("deliveryDescription"),
    alternates: {
      canonical: locale === "en" ? enUrl : ukUrl,
      languages: { uk: ukUrl, en: enUrl, "x-default": ukUrl },
    },
  };
}

export default async function DeliveryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "delivery" });
  const tc = await getTranslations({ locale, namespace: "common" });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://violamukachevo.com";

  const PAYMENT_POINTS = [t("paymentP1"), t("paymentP2"), t("paymentP3"), t("paymentP4")];
  const SCHEDULE = [t.raw("schedule1"), t.raw("schedule2"), t.raw("schedule3")];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: tc("home"), item: locale === "en" ? `${siteUrl}/en` : siteUrl },
              { "@type": "ListItem", position: 2, name: t("breadcrumb") },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: locale === "en" ? [
              {
                "@type": "Question",
                name: "How is payment made?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Payment is made by 100% prepayment via WayForPay payment system or bank transfer to FOP Hehedosh Violeta Valeriivna.",
                },
              },
              {
                "@type": "Question",
                name: "Which delivery service ships orders?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Delivery is carried out across Ukraine by Nova Poshta. Delivery cost is calculated according to the carrier's rates.",
                },
              },
              {
                "@type": "Question",
                name: "How fast are orders shipped?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Orders placed Monday to Saturday before 3:00 PM are shipped the same day. After 3:00 PM — the next morning. Orders on Saturday after 2:00 PM or Sunday are shipped Monday morning.",
                },
              },
              {
                "@type": "Question",
                name: "How long does delivery take?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Delivery time depends on the carrier and usually takes 1–3 days.",
                },
              },
            ] : [
              {
                "@type": "Question",
                name: "Як здійснюється оплата?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Оплата здійснюється 100% передоплатою через платіжну систему WayForPay або банківський переказ на рахунок ФОП Гегедош Віолета Валеріївна.",
                },
              },
              {
                "@type": "Question",
                name: "Якою службою доставки відправляються замовлення?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Доставка здійснюється по всій Україні службою Нова Пошта. Вартість доставки розраховується за тарифами перевізника.",
                },
              },
              {
                "@type": "Question",
                name: "Як швидко відправляється замовлення?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Замовлення, оформлені з понеділка по суботу до 15:00, відправляються в цей же день. Після 15:00 — наступного дня вранці. Замовлення в суботу після 14:00 або в неділю відправляються в понеділок вранці.",
                },
              },
              {
                "@type": "Question",
                name: "Скільки часу займає доставка?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Термін доставки залежить від перевізника та зазвичай становить 1–3 дні.",
                },
              },
            ],
          },
        ]) }}
      />
      <nav className="text-xs text-[#6B6B6B] mb-8">
        <Link href="/" className="hover:text-[#C4A882]">{tc("home")}</Link>
        <span className="mx-2">/</span>
        <span className="text-[#1A1A1A]">{t("breadcrumb")}</span>
      </nav>

      <h1 className="font-serif text-4xl font-bold text-[#1A1A1A] mb-12">
        {t("title")}
      </h1>

      <div className="space-y-12">

        {/* Payment */}
        <section>
          <h2 className="font-serif text-2xl font-bold text-[#1A1A1A] mb-5 pb-2 border-b border-[#E8E4DE]">
            {t("paymentTitle")}
          </h2>
          <ul className="space-y-3">
            {PAYMENT_POINTS.map((point) => (
              <li key={point} className="flex gap-3 text-[#6B6B6B]">
                <span className="text-[#C4A882] flex-shrink-0 mt-0.5">▶</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <div
            className="mt-5 bg-[#F5F2EE] border border-[#E8E4DE] rounded p-4 text-sm text-[#6B6B6B] leading-relaxed"
            dangerouslySetInnerHTML={{ __html: t.raw("paymentNote") }}
          />
        </section>

        {/* Delivery */}
        <section>
          <h2 className="font-serif text-2xl font-bold text-[#1A1A1A] mb-5 pb-2 border-b border-[#E8E4DE]">
            {t("deliveryTitle")}
          </h2>

          <p
            className="text-[#6B6B6B] mb-6 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: t.raw("deliveryIntro") }}
          />

          <p className="font-semibold text-[#1A1A1A] mb-4">{t("scheduleTitle")}</p>

          <ul className="space-y-4 mb-6">
            {SCHEDULE.map((html, i) => (
              <li key={i} className="flex gap-3 text-[#6B6B6B]">
                <span className="text-[#C4A882] flex-shrink-0 mt-0.5">▶</span>
                <span dangerouslySetInnerHTML={{ __html: html }} />
              </li>
            ))}
          </ul>

          <p className="text-[#6B6B6B] mb-3">
            ⏳ <strong className="text-[#1A1A1A]">{t("deliveryTime")}</strong>{" "}
            <span dangerouslySetInnerHTML={{ __html: t.raw("deliveryTimeText") }} />
          </p>

          <p className="text-[#6B6B6B]">
            ✨ {t("deliveryCare")}
          </p>
        </section>

        {/* Nova Poshta */}
        <section>
          <h2 className="font-serif text-2xl font-bold text-[#1A1A1A] mb-5 pb-2 border-b border-[#E8E4DE]">
            {t("carrierTitle")}
          </h2>
          <div className="flex items-start gap-4">
            <div className="w-1 h-full bg-[#C4A882] self-stretch rounded" />
            <div className="text-[#6B6B6B] leading-relaxed">
              <p
                className="mb-2"
                dangerouslySetInnerHTML={{ __html: t.raw("carrierText") }}
              />
              <p>{t("carrierCost")}</p>
            </div>
          </div>
        </section>

      </div>

      <div className="mt-12 pt-8 border-t border-[#E8E4DE] text-center">
        <p className="text-[#6B6B6B] text-sm">
          {t("questionsText")}{" "}
          <Link href="/contacts" className="text-[#C4A882] hover:underline font-medium">
            {t("contactUs")}
          </Link>
        </p>
      </div>
    </div>
  );
}
