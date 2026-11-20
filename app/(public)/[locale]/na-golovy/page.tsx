import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { getLatestProducts } from "@/lib/products-server";
import { getNaGolovyContent } from "@/lib/na-golovy-content";
import ProductCard from "@/components/shop/ProductCard";
import ProductListGA from "@/components/shop/ProductListGA";
import { safeJsonLd } from "@/lib/utils";
import { pageTitle } from "@/lib/seo-title";
import { markdownAlternate } from "@/lib/md/format";

export const revalidate = 3600;

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://violamukachevo.com";
  const ukUrl = `${siteUrl}/na-golovy`;
  const enUrl = `${siteUrl}/en/na-golovy`;

  // Ця сторінка — хаб для чистого брендового запиту ("на голову", "na golovy",
  // "на голову бренд/сайт"). Раніше її title дублював /shop і головну
  // ("На Голову купити — …"), і три сторінки ділили між собою 1 963 покази.
  const title = pageTitle(
    locale === "en"
      ? "Na Golovy — Brand, Product Lines, Where to Buy"
      : "На Голову (Na Golovy) — бренд, лінійки, де купити",
  );

  const description =
    locale === "en"
      ? "The Na Golovy (На Голову) brand: philosophy, shampoo, mask and care lines. Buy from accredited brand technologist Viola Hehedosh with delivery across Ukraine."
      : "Бренд На Голову (Na Golovy): філософія, лінійки шампунів, масок і догляду. Купити в акредитованого технолога бренду Віоли Гегедош з доставкою по Україні.";

  return {
    title,
    description,
    keywords: locale === "en" ? [
      "Na Golovy",
      "Na Gólov[y]",
      "na golovy buy",
      "Ukrainian hair cosmetics",
      "Na Golovy brand",
      "Na Golovy technologist",
      "niche hair cosmetics Ukraine",
    ] : [
      "На Голову",
      "на голову",
      "на голову купити",
      "на голову косметика",
      "косметика на голову",
      "косметика на голову купити",
      "на голову шампунь",
      "на голову маска",
      "на голову кондиціонер",
      "на голови",
      "Na Golovy",
      "Na Gólov[y]",
      "na golovy",
      "na golovu",
      "nagolovy",
      "купити na golovy",
      "na golovy купити",
      "na golovy україна",
      "Na Golovy бренд",
      "технолог Na Golovy",
      "Віола Гегедош",
      "українська косметика для волосся бренд",
      "нішева косметика для волосся",
    ],
    alternates: {
      types: markdownAlternate("/na-golovy", locale),
      canonical: locale === "en" ? enUrl : ukUrl,
      languages: { uk: ukUrl, en: enUrl, "x-default": ukUrl },
    },
    openGraph: {
      title,
      description,
      locale: locale === "en" ? "en_US" : "uk_UA",
      images: [{ url: "/preview.jpg", width: 1200, height: 630 }],
    },
    robots: { index: true, follow: true },
  };
}

export default async function NaGolovyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tc = await getTranslations({ locale, namespace: "common" });
  const isEn = locale === "en";

  const products = await getLatestProducts(locale, 8);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://violamukachevo.com";

  const content = getNaGolovyContent(locale);

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: content.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: tc("home"), item: isEn ? `${siteUrl}/en` : siteUrl },
      {
        "@type": "ListItem",
        position: 2,
        name: "Na Gólov[y]",
        item: isEn ? `${siteUrl}/en/na-golovy` : `${siteUrl}/na-golovy`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(faqLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbLd) }}
      />

      {/* Hero */}
      <section className="bg-[#E8E4DE] py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="text-xs text-[#6B6B6B] mb-6 flex items-center gap-2">
            <Link href="/" className="hover:text-[#C4A882]">{tc("home")}</Link>
            <span>/</span>
            <span className="text-[#1A1A1A]">Na Gólov[y]</span>
          </nav>
          <p className="text-[#C4A882] text-xs uppercase tracking-[0.3em] mb-3">
            {content.eyebrow}
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-[#1A1A1A] leading-tight mb-6">
            {content.h1}
          </h1>
          <p className="text-[#1A1A1A]/70 text-lg leading-relaxed mb-8 max-w-3xl">
            {content.intro}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 bg-[#1A1A1A] text-white px-8 py-4 text-sm font-medium uppercase tracking-[0.2em] hover:bg-[#C4A882] transition-colors rounded-sm"
            >
              {content.shopBtn}
            </Link>
            <Link
              href="/contacts"
              className="inline-flex items-center gap-2 bg-white text-[#1A1A1A] px-8 py-4 text-sm font-medium uppercase tracking-[0.2em] hover:bg-[#C4A882] hover:text-white transition-colors rounded-sm"
            >
              {content.ctaBtn}
            </Link>
          </div>
        </div>
      </section>

      {/* Why */}
      <section className="py-20 bg-[#FAFAF8]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-10">
            {content.whyTitle}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {content.why.map((item) => (
              <div key={item.title}>
                <h3 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-2">
                  {item.title}
                </h3>
                <p className="text-[#6B6B6B] leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lines */}
      <section className="py-20 bg-[#F0EDE8]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-10">
            {content.linesTitle}
          </h2>
          {/* Кожна лінійка — посилання на свою категорію: хаб бренду передає
              вагу сторінкам, які й ранжуються за "на голову шампунь/маска". */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {content.lines.map((line) => (
              <Link
                key={line.name}
                href={line.href}
                className="block bg-white rounded p-6 border border-[#E8E4DE] hover:border-[#C4A882] transition-colors"
              >
                <h3 className="font-serif text-lg font-semibold text-[#1A1A1A] mb-2">
                  {line.name}
                </h3>
                <p className="text-sm text-[#6B6B6B] leading-relaxed">{line.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured products */}
      {products.length > 0 && (
        <section className="py-20 bg-[#FAFAF8]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-10">
              {content.featuredTitle}
            </h2>
            <ProductListGA products={products} listName="na_golovy_featured" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
            <div className="mt-10 text-center">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 bg-[#1A1A1A] text-white px-8 py-4 text-sm font-medium uppercase tracking-[0.2em] hover:bg-[#C4A882] transition-colors rounded-sm"
              >
                {content.shopBtn}
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Founder */}
      <section className="py-20 bg-[#E8E4DE]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative aspect-[3/4] w-full max-w-sm mx-auto rounded overflow-hidden">
              <Image
                src="/viola.JPG"
                alt={
                  isEn
                    ? "Viola Hehedosh — Na Gólov[y] brand technologist"
                    : "Віола Гегедош — технолог бренду Na Gólov[y] (На Голову)"
                }
                fill
                className="object-cover object-[center_15%]"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-4">
                {content.ctaTitle}
              </h2>
              <p className="text-[#1A1A1A]/70 text-lg leading-relaxed mb-8">
                {content.ctaText}
              </p>
              <Link
                href="/contacts"
                className="inline-flex items-center gap-2 bg-[#1A1A1A] text-white px-8 py-4 text-sm font-medium uppercase tracking-[0.2em] hover:bg-[#C4A882] transition-colors rounded-sm"
              >
                {content.ctaBtn}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-[#FAFAF8]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-10">
            {content.faqTitle}
          </h2>
          <div className="space-y-6">
            {content.faq.map((f) => (
              <div key={f.q} className="border-b border-[#E8E4DE] pb-6">
                <h3 className="font-serif text-lg font-semibold text-[#1A1A1A] mb-2">
                  {f.q}
                </h3>
                <p className="text-[#6B6B6B] leading-relaxed">{f.a}</p>
                {"link" in f && f.link && (
                  <Link
                    href={f.link.href}
                    className="inline-block mt-3 text-sm text-[#C4A882] hover:text-[#1A1A1A] transition-colors"
                  >
                    {f.link.label}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
