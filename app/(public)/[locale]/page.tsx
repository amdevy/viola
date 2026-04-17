import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { createPublicClient } from "@/lib/supabase/server";
import ProductCard from "@/components/shop/ProductCard";
import { ProductGridSkeleton } from "@/components/ui/Skeleton";
import { localize, PRODUCT_I18N_FIELDS, CATEGORY_I18N_FIELDS } from "@/lib/i18n/localize";
import type { Product } from "@/types";
import type { Metadata } from "next";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://violamukachevo.com";
  const enUrl = `${siteUrl}/en`;

  return {
    title: t("homeTitle"),
    description: t("homeDescription"),
    alternates: {
      canonical: locale === "en" ? enUrl : siteUrl,
      languages: { uk: siteUrl, en: enUrl, "x-default": siteUrl },
    },
  };
}

async function getBestsellers(locale: string): Promise<Product[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("products")
    .select("*, category:categories(id,name,name_en,slug)")
    .eq("in_stock", true)
    .order("created_at", { ascending: false })
    .limit(8);

  return ((data as Product[]) ?? []).map((p) => {
    const { row } = localize(
      p as unknown as Record<string, unknown>,
      locale,
      PRODUCT_I18N_FIELDS,
    ) as unknown as { row: Product };
    if (row.category) {
      const { row: cat } = localize(
        row.category as unknown as Record<string, unknown>,
        locale,
        CATEGORY_I18N_FIELDS,
      ) as unknown as { row: typeof row.category };
      row.category = cat;
    }
    return row;
  });
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  const tc = await getTranslations({ locale, namespace: "common" });
  const tCat = await getTranslations({ locale, namespace: "categories" });
  const bestsellers = await getBestsellers(locale);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://violamukachevo.com";

  const BENEFITS = [
    { icon: '/icons/heliconia.png', title: t("benefitNatural"), desc: t("benefitNaturalDesc") },
    { icon: '/icons/scientific-device.png', title: t("benefitCosmetics"), desc: t("benefitCosmeticsDesc") },
    { icon: '/icons/delivery.png', title: t("benefitDelivery"), desc: t("benefitDeliveryDesc") },
    { icon: '/icons/diamond.png', title: t("benefitOriginal"), desc: t("benefitOriginalDesc") },
  ];

  const CATS = [
    { slug: 'shampoos', name: tCat("shampoos"), image: '/content/shampoo.jpg' },
    { slug: 'conditioners', name: tCat("conditioners"), image: '/content/conditioner.jpg' },
    { slug: 'masks', name: tCat("masks"), image: '/content/mask.jpg' },
    { slug: 'leave-in', name: tCat("leave-in"), image: '/content/leave-in.jpg' },
  ];

  return (
    <>
      {/* Hero */}
      <section className='relative min-h-[70vh] flex items-center overflow-hidden bg-[#E8E4DE]'>
        <div className='absolute inset-0 lg:left-1/2 lg:right-0'>
          <Image
            src='/viola.JPG'
            alt={t("heroAlt")}
            fill
            className='object-cover object-[center_15%]'
            priority
            sizes='(max-width: 1024px) 100vw, 50vw'
          />
        </div>
        <div className='absolute inset-0 bg-gradient-to-t from-[#E8E4DE] via-[#E8E4DE]/80 to-[#E8E4DE]/40 lg:hidden' />
        <div className='absolute inset-y-0 left-0 w-1/2 bg-[#E8E4DE] hidden lg:block' />

        <div className='relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full'>
          <div className='max-w-xl'>
            <p className='font-serif text-lg sm:text-xl text-[#1A1A1A]/80 mb-2 tracking-wide'>
              {t("greeting")}
            </p>
            <h1 className='font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-[#1A1A1A] leading-[1.15] mb-2'>
              {t("heroName")}
            </h1>
            <p className='font-serif text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#1A1A1A] mb-6 tracking-tight'>
              {t("heroRole")}
            </p>
            <p className='text-lg text-[#1A1A1A]/75 mb-10 leading-relaxed max-w-md'>
              {t("heroText")}
            </p>
            <div className='flex flex-wrap gap-4'>
              <Link
                href='/shop'
                className='inline-flex items-center gap-2 bg-[#1A1A1A] text-white px-8 py-4 text-sm font-medium uppercase tracking-[0.2em] hover:bg-[#C4A882] transition-all duration-300 rounded-sm'
              >
                {tc("shopNow")}
              </Link>
              <Link
                href='/contacts'
                className='inline-flex items-center gap-2 border-2 border-[#1A1A1A] text-[#1A1A1A] px-8 py-4 text-sm font-medium uppercase tracking-[0.2em] hover:bg-[#1A1A1A] hover:text-white transition-all duration-300 rounded-sm'
              >
                {tc("consultation")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Category cards */}
      <section className='py-16 bg-white'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center mb-10'>
            <h2 className='font-serif text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-3'>
              {t("categoriesTitle")}
            </h2>
            <p className='text-[#6B6B6B] max-w-xl mx-auto'>
              {t("categoriesText")}
            </p>
          </div>
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
            {CATS.map((cat) => (
              <Link
                key={cat.slug}
                href={`/shop?category=${cat.slug}`}
                className='relative aspect-[3/4] rounded overflow-hidden flex items-end p-4 group'
              >
                <Image
                  src={cat.image}
                  alt={
                    locale === "en"
                      ? `Na Gólov[y] ${cat.name} — buy in Ukraine`
                      : `Na Gólov[y] (На Голову) ${cat.name} — купити в Україні`
                  }
                  fill
                  className='object-cover transition-transform duration-500 group-hover:scale-105'
                  sizes='(max-width: 640px) 50vw, 25vw'
                />
                <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent' />
                <div className='relative z-10'>
                  <p className='text-white font-semibold text-lg group-hover:text-[#C4A882] transition-colors'>
                    {cat.name}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Bestsellers */}
      <section className='py-16 bg-[#FAFAF8]'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-between mb-10'>
            <div>
              <h2 className='font-serif text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-2'>
                {t("bestsellersTitle")}
              </h2>
              <p className='text-[#6B6B6B]'>
                {t("bestsellersText")}
              </p>
            </div>
            <Link
              href='/shop'
              className='hidden md:flex items-center gap-2 text-sm text-[#1A1A1A] hover:text-[#C4A882] transition-colors font-medium'
            >
              {tc("allProducts")}
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
              </svg>
            </Link>
          </div>

          {bestsellers.length > 0 ? (
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6'>
              {bestsellers.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <ProductGridSkeleton count={4} />
          )}

          <div className='text-center mt-8 md:hidden'>
            <Link
              href='/shop'
              className='inline-flex items-center gap-2 text-sm text-[#1A1A1A] hover:text-[#C4A882] transition-colors font-medium border-b border-[#1A1A1A] pb-0.5'
            >
              {tc("allProducts")}
            </Link>
          </div>
        </div>
      </section>

      {/* About / Brand story */}
      <section className='py-16 bg-white'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-12 items-center'>
            <div className='relative aspect-[4/3] rounded overflow-hidden'>
              <Image
                src='/content/IMG_6639.JPG'
                alt={t("storyAlt")}
                fill
                className='object-cover'
                sizes='(max-width: 1024px) 100vw, 50vw'
              />
            </div>
            <div>
              <p className='text-[#C4A882] text-xs uppercase tracking-[0.3em] mb-3'>
                {t("storyLabel")}
              </p>
              <h2 className='font-serif text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-6 leading-tight'>
                {t("storyTitle")}
              </h2>
              <p className='text-[#6B6B6B] mb-4 leading-relaxed'>
                {t("storyP1")}
              </p>
              <p className='text-[#6B6B6B] mb-8 leading-relaxed'>
                {t("storyP2")}
              </p>
              <div className='flex flex-wrap gap-6'>
                <Link
                  href='/about'
                  className='inline-flex items-center gap-2 text-sm font-medium text-[#1A1A1A] border-b border-[#1A1A1A] pb-0.5 hover:text-[#C4A882] hover:border-[#C4A882] transition-colors'
                >
                  {tc("learnMore")}
                </Link>
                <Link
                  href='/na-golovy'
                  className='inline-flex items-center gap-2 text-sm font-medium text-[#1A1A1A] border-b border-[#1A1A1A] pb-0.5 hover:text-[#C4A882] hover:border-[#C4A882] transition-colors'
                >
                  {tc("aboutNaGolovy")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className='py-16 bg-[#1A1A1A]'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8'>
            {BENEFITS.map((b) => (
              <div key={b.title} className='text-center'>
                <div className='flex justify-center mb-4'>
                  <Image src={b.icon} alt={b.title} width={48} height={48} className='invert opacity-80' />
                </div>
                <h3 className='font-serif text-lg font-semibold text-white mb-2'>{b.title}</h3>
                <p className='text-sm text-white/60 leading-relaxed'>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Instagram CTA */}
      <section className='py-16 bg-[#FAFAF8]'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center'>
          <p className='text-[#C4A882] text-xs uppercase tracking-[0.3em] mb-3'>Instagram</p>
          <h2 className='font-serif text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-2'>@viola.mukachevo</h2>
          <p className='text-[#6B6B6B] mb-8'>{t("instagramCta")}</p>
          <div className='grid grid-cols-3 md:grid-cols-6 gap-2 mb-8'>
            {[
              { src: '/instagram/IMG_3773.jpg', alt: 'Na Golov[y] hair care — Viola Salon' },
              { src: '/instagram/IMG_4255.JPG', alt: 'Hair coloring results at Viola Mukachevo' },
              { src: '/instagram/IMG_4333.JPG', alt: 'Professional Na Golov[y] cosmetics' },
              { src: '/instagram/IMG_4358.JPG', alt: 'Viola Hehedosh — hair care consultation' },
              { src: '/instagram/IMG_4751.jpg', alt: 'Na Golov[y] shampoos and masks — Viola Salon' },
              { src: '/instagram/IMG_8563.jpg', alt: 'Na Golov[y] aromatic cosmetics — hair care' },
            ].map((img) => (
              <a
                key={img.src}
                href='https://www.instagram.com/viola.mukachevo'
                target='_blank'
                rel='noopener noreferrer'
                className='relative aspect-square rounded overflow-hidden block group'
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className='object-cover group-hover:scale-105 transition-transform duration-300'
                  sizes='(max-width: 768px) 33vw, 16vw'
                />
                <div className='absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300' />
              </a>
            ))}
          </div>
          <a
            href='https://www.instagram.com/viola.mukachevo'
            target='_blank'
            rel='noopener noreferrer'
            className='inline-flex items-center gap-2 bg-[#1A1A1A] text-white px-6 py-3 text-sm font-medium rounded hover:bg-[#C4A882] transition-colors'
          >
            {tc("followInstagram")}
          </a>
        </div>
      </section>

      {/* JSON-LD: WebSite */}
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            '@id': 'https://violamukachevo.com/#website',
            name: locale === "en" ? "Viola Beauty Salon" : "Салон краси Viola",
            url: siteUrl,
            inLanguage: locale === "en" ? "en-US" : "uk-UA",
            publisher: { '@id': 'https://violamukachevo.com/#business' },
          }),
        }}
      />
    </>
  );
}
