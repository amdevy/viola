import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://violamukachevo.com";
  const ukUrl = `${siteUrl}/about`;
  const enUrl = `${siteUrl}/en/about`;

  return {
    title: t("aboutTitle"),
    description: t("aboutDescription"),
    keywords: locale === "en" ? [
      "Na Golovy brand",
      "Na Gólov[y]",
      "Viola Hehedosh",
      "Ukrainian hair cosmetics brand",
      "Na Golovy technologist",
      "niche hair cosmetics Ukraine",
    ] : [
      "Na Golovy",
      "Na Gólov[y]",
      "на голову",
      "на голову бренд",
      "на голову косметика",
      "na golovy бренд",
      "Віола Гегедош",
      "технолог Na Golovy",
      "колорист Мукачево",
      "Na Golovy Україна",
      "салон Viola Мукачево",
      "професійна аромакосметика для волосся",
      "українська косметика для волосся бренд",
      "нішева косметика для волосся",
    ],
    alternates: {
      canonical: locale === "en" ? enUrl : ukUrl,
      languages: { uk: ukUrl, en: enUrl, "x-default": ukUrl },
    },
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "about" });
  const tc = await getTranslations({ locale, namespace: "common" });

  const VALUES = [
    { title: t("value1Title"), desc: t("value1Desc") },
    { title: t("value2Title"), desc: t("value2Desc") },
    { title: t("value3Title"), desc: t("value3Desc") },
    { title: t("value4Title"), desc: t("value4Desc") },
  ];

  const PRODUCT_LINES = [
    { name: t("line1Name"), desc: t("line1Desc") },
    { name: t("line2Name"), desc: t("line2Desc") },
    { name: t("line3Name"), desc: t("line3Desc") },
    { name: t("line4Name"), desc: t("line4Desc") },
    { name: t("line5Name"), desc: t("line5Desc") },
  ];

  return (
    <>
      {/* Hero */}
      <section className='bg-[#E8E4DE] py-20'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-12 items-center'>
            <div className='relative aspect-[3/4] w-full max-w-sm mx-auto lg:mx-0 lg:order-last rounded overflow-hidden'>
              <Image
                src='/brand.JPG'
                alt={t("brandAlt")}
                fill
                className='object-cover object-top'
                sizes='(max-width: 1024px) 100vw, 50vw'
              />
            </div>
            <div>
              <p className='text-[#C4A882] text-xs uppercase tracking-[0.3em] mb-3'>
                {t("brandLabel")}
              </p>
              <h1 className='font-serif text-4xl sm:text-5xl font-bold text-[#1A1A1A] leading-tight mb-6'>
                {t("brandTitle")}
              </h1>
              <p className='text-[#1A1A1A]/70 text-lg leading-relaxed mb-8'>
                <a href="https://www.nagolovy.pro/" target="_blank" rel="noopener noreferrer" className="text-[#C4A882] hover:underline">Na Golov[y]</a>{" "}
                — {t("brandText")}
              </p>
              <Link
                href='/shop'
                className='inline-flex items-center gap-2 bg-[#1A1A1A] text-white px-8 py-4 text-sm font-medium uppercase tracking-[0.2em] hover:bg-[#C4A882] transition-all duration-300 rounded-sm'
              >
                {tc("goToShop")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Owner intro */}
      <section className='py-16 bg-white'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-12 items-center'>
            <div className='relative aspect-[3/4] w-full max-w-sm mx-auto lg:mx-0 rounded overflow-hidden'>
              <Image
                src='/viola.JPG'
                alt={t("ownerAlt")}
                fill
                className='object-cover object-top'
                sizes='(max-width: 1024px) 100vw, 50vw'
              />
            </div>
            <div>
              <p className='text-[#C4A882] text-xs uppercase tracking-[0.3em] mb-3'>
                {t("ownerLabel")}
              </p>
              <h2 className='font-serif text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-4 leading-tight'>
                {t("ownerName")}
              </h2>
              <p className='text-[#6B6B6B] mb-4 leading-relaxed'>
                {t("ownerP1")}
              </p>
              <p className='text-[#6B6B6B] mb-4 leading-relaxed'>
                {t("ownerP2")}
              </p>
              <p className='text-[#6B6B6B] mb-8 leading-relaxed'>
                {t("ownerP3")}
              </p>
              <Link
                href='/contacts'
                className='inline-flex items-center gap-2 text-sm font-medium text-[#1A1A1A] border-b border-[#1A1A1A] pb-0.5 hover:text-[#C4A882] hover:border-[#C4A882] transition-colors'
              >
                {t("bookConsultation")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className='py-16 bg-[#FAFAF8]'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center mb-12'>
            <p className='text-[#C4A882] text-xs uppercase tracking-[0.3em] mb-3'>
              {t("valuesLabel")}
            </p>
            <h2 className='font-serif text-3xl sm:text-4xl font-bold text-[#1A1A1A]'>
              {t("valuesTitle")}
            </h2>
          </div>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8'>
            {VALUES.map((v) => (
              <div
                key={v.title}
                className='bg-white rounded p-6 border border-[#E8E4DE]'
              >
                <div className='w-8 h-0.5 bg-[#C4A882] mb-4' />
                <h3 className='font-serif text-lg font-semibold text-[#1A1A1A] mb-2'>
                  {v.title}
                </h3>
                <p className='text-sm text-[#6B6B6B] leading-relaxed'>
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product lines */}
      <section className='py-16 bg-white'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center mb-12'>
            <p className='text-[#C4A882] text-xs uppercase tracking-[0.3em] mb-3'>
              {t("assortmentLabel")}
            </p>
            <h2 className='font-serif text-3xl sm:text-4xl font-bold text-[#1A1A1A]'>
              {t("productLinesTitle")}
            </h2>
          </div>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
            {PRODUCT_LINES.map((line, i) => (
              <div key={line.name} className='flex gap-4'>
                <span className='font-serif text-3xl text-[#C4A882]/30 font-bold leading-none mt-1 select-none'>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 className='font-semibold text-[#1A1A1A] mb-1'>
                    {line.name}
                  </h3>
                  <p className='text-sm text-[#6B6B6B] leading-relaxed'>
                    {line.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dark CTA */}
      <section className='py-16 bg-[#1A1A1A]'>
        <div className='max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center'>
          <h2 className='font-serif text-3xl sm:text-4xl font-bold text-white mb-4'>
            {t("ctaTitle")}
          </h2>
          <p className='text-white/60 mb-8 leading-relaxed'>
            {t("ctaText")}
          </p>
          <div className='flex flex-wrap justify-center gap-4'>
            <Link
              href='/contacts'
              className='inline-flex items-center gap-2 bg-[#C4A882] text-white px-8 py-4 text-sm font-medium uppercase tracking-[0.2em] hover:bg-[#B8976E] transition-all duration-300 rounded-sm'
            >
              {tc("consultation")}
            </Link>
            <Link
              href='/shop'
              className='inline-flex items-center gap-2 border border-white/30 text-white px-8 py-4 text-sm font-medium uppercase tracking-[0.2em] hover:border-white hover:bg-white/5 transition-all duration-300 rounded-sm'
            >
              {tc("goToShop")}
            </Link>
          </div>
        </div>
      </section>

      {/* Person JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            "@id": "https://violamukachevo.com/#viola",
            name: "Віола Гегедош",
            jobTitle: locale === "en" ? "Na Gólov[y] Brand Technologist" : "Технолог бренду Na Gólov[y]",
            worksFor: { "@id": "https://violamukachevo.com/#business" },
            url: "https://violamukachevo.com/about",
            image: "https://violamukachevo.com/viola.JPG",
            telephone: "+380500582175",
            sameAs: [
              "https://www.instagram.com/viola.mukachevo",
              "https://t.me/violagegedosh",
            ],
            knowsAbout: locale === "en"
              ? ["Hair care", "Na Gólov[y] cosmetics", "Aromatic cosmetics", "Hair coloring"]
              : ["Догляд за волоссям", "Косметика Na Gólov[y]", "Аромакосметика", "Колористика"],
          }),
        }}
      />
    </>
  );
}
