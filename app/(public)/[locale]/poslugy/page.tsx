import { getTranslations, setRequestLocale } from "next-intl/server";
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
  const ukUrl = `${siteUrl}/poslugy`;
  const enUrl = `${siteUrl}/en/poslugy`;

  return {
    title: t("poslugyTitle"),
    description: t("poslugyDescription"),
    alternates: {
      canonical: locale === "en" ? enUrl : ukUrl,
      languages: { uk: ukUrl, en: enUrl, "x-default": ukUrl },
    },
    keywords: [
      "консультація Na Golovy", "підбір косметики Na Golovy",
      "послуги Viola", "консультація з догляду за волоссям",
      "Na Golovy підбір", "На Голову консультація",
    ],
  };
}

export default async function PoslugyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "poslugy" });
  const tc = await getTranslations({ locale, namespace: "common" });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://violamukachevo.com";

  const SERVICES = [
    { title: t("service1Title"), desc: t("service1Desc") },
    { title: t("service2Title"), desc: t("service2Desc") },
    { title: t("service3Title"), desc: t("service3Desc") },
    { title: t("service4Title"), desc: t("service4Desc") },
  ];

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
            "@type": "Service",
            serviceType: locale === "en"
              ? "Hair cosmetics consultation"
              : "Консультація з підбору косметики для волосся",
            provider: { "@id": "https://violamukachevo.com/#business" },
            areaServed: { "@type": "Country", name: "Ukraine" },
            description: locale === "en"
              ? "Personal consultation for selecting professional Na Golov[y] hair cosmetics. Offline in Mukachevo and online."
              : "Персональна консультація з підбору професійної косметики Na Golov[y] для догляду за волоссям. Офлайн у Мукачево та онлайн.",
          },
        ]) }}
      />

      <nav className="text-xs text-[#6B6B6B] mb-8">
        <Link href="/" className="hover:text-[#C4A882]">{tc("home")}</Link>
        <span className="mx-2">/</span>
        <span className="text-[#1A1A1A]">{t("breadcrumb")}</span>
      </nav>

      <h1 className="font-serif text-4xl font-bold text-[#1A1A1A] mb-4">
        {t("title")}
      </h1>

      <p
        className="text-lg text-[#6B6B6B] mb-10 leading-relaxed max-w-2xl"
        dangerouslySetInnerHTML={{ __html: t.raw("intro") }}
      />

      <div className="space-y-8">
        {SERVICES.map((s) => (
          <section key={s.title} className="border-b border-[#E8E4DE] pb-8 last:border-b-0">
            <h2 className="font-serif text-xl font-bold text-[#1A1A1A] mb-3">
              {s.title}
            </h2>
            <p className="text-[#6B6B6B] leading-relaxed">
              {s.desc}
            </p>
          </section>
        ))}
      </div>

      <div className="mt-12 bg-[#F5F2EE] border border-[#E8E4DE] rounded p-6 text-center">
        <p className="text-[#6B6B6B] mb-4">
          {t("ctaText")}
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/contacts"
            className="inline-flex items-center gap-2 bg-[#1A1A1A] text-white px-6 py-3 text-sm font-medium uppercase tracking-[0.15em] hover:bg-[#C4A882] transition-colors rounded-sm"
          >
            {tc("contact")}
          </Link>
          <a
            href="https://www.instagram.com/viola.mukachevo"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border-2 border-[#1A1A1A] text-[#1A1A1A] px-6 py-3 text-sm font-medium uppercase tracking-[0.15em] hover:bg-[#1A1A1A] hover:text-white transition-colors rounded-sm"
          >
            Instagram
          </a>
        </div>
      </div>
    </div>
  );
}
