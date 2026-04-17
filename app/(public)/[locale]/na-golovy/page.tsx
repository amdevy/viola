import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { createPublicClient } from "@/lib/supabase/server";
import { localize, PRODUCT_I18N_FIELDS, CATEGORY_I18N_FIELDS } from "@/lib/i18n/localize";
import ProductCard from "@/components/shop/ProductCard";
import type { Product } from "@/types";

export const revalidate = 3600;

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://violamukachevo.com";
  const ukUrl = `${siteUrl}/na-golovy`;
  const enUrl = `${siteUrl}/en/na-golovy`;

  const title =
    locale === "en"
      ? "Na Gólov[y] — Buy from Brand Technologist in Ukraine | Viola"
      : "Na Gólov[y] купити в Україні — Магазин технолога бренду Viola";

  const description =
    locale === "en"
      ? "Na Golovy (На Голову) — Ukrainian niche aromatic hair cosmetics. Buy shampoos, conditioners, masks from accredited brand technologist Viola Hehedosh. Delivery across Ukraine."
      : "Na Golovy (На Голову) — українська нішева аромакосметика для волосся. Купити шампуні, кондиціонери, маски на голову у акредитованого технолога бренду Віоли Гегедош. Доставка по Україні.";

  return {
    title,
    description,
    keywords: [
      "Na Golovy", "Na Gólov[y]", "na golovy", "na golovu",
      "на голову", "на голови", "на голову косметика",
      "косметика на голову", "купити na golovy", "na golovy купити",
      "на голову купити", "косметика на голову купити", "na golovy україна",
    ],
    alternates: {
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

async function getFeatured(locale: string): Promise<Product[]> {
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

export default async function NaGolovyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tc = await getTranslations({ locale, namespace: "common" });
  const isEn = locale === "en";

  const products = await getFeatured(locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://violamukachevo.com";

  const content = isEn
    ? {
        eyebrow: "Na Gólov[y] Brand",
        h1: "Na Gólov[y] — Buy from Brand Technologist in Ukraine",
        intro:
          "Na Golovy (На Голову) is a Ukrainian niche brand of professional aromatic hair cosmetics, founded by colorist Nataliya Holovchenko. Formulas are developed specifically to preserve hair color and maintain hair health. Viola is a store run by Viola Hehedosh — an accredited Na Golovy brand technologist. Buy the full product line with delivery across Ukraine and get personal expert consultation.",
        whyTitle: "Why buy Na Gólov[y] at Viola",
        why: [
          {
            title: "Accredited brand technologist",
            text: "Na Golovy is sold exclusively through accredited masters and salons. Viola Hehedosh is an accredited Na Golovy brand technologist — you buy directly from an expert, with 100% authentic products.",
          },
          {
            title: "Brand technologist consultation",
            text: "Viola Hehedosh is an accredited Na Golovy technologist. Get personal recommendations: which shampoo, mask, or leave-in to choose for your hair type — free of charge, online or in salon.",
          },
          {
            title: "Nova Poshta delivery across Ukraine",
            text: "We ship within 1-3 business days to any city. Payment by card, cash on delivery, or online via WayForPay.",
          },
          {
            title: "Color protection & concentration",
            text: "Na Golovy formulas contain a high concentration of active ingredients — you use less product per application and the entire line is combinable for a complete care ritual.",
          },
        ],
        linesTitle: "Na Gólov[y] product lines",
        lines: [
          { name: "Shampoos", desc: "Collagen, amino-ceramide, sulfate-free, hyaluronic, chelating — for every hair type and goal." },
          { name: "Conditioners", desc: "9-protein complex, exotic oils, amino acids — deep nourishment and detangling." },
          { name: "Masks", desc: "Paraffin therapy, Diamond Gloss, polypeptide web, collagen — intensive reconstruction and shine." },
          { name: "Leave-in care", desc: "BB creams, silk, thermal protection sprays with ceramides and trehalose." },
          { name: "Tonics & ampoules", desc: "Multivitamin, hyaluronic — boosters for scalp health and hair density." },
          { name: "Scalp care", desc: "Peels with thermal and cooling effect, sebo-balancing formulas for sensitive scalp." },
        ],
        featuredTitle: "Popular Na Gólov[y] products",
        ctaTitle: "Need help choosing?",
        ctaText: "Book a free consultation with Na Gólov[y] brand technologist Viola Hehedosh.",
        ctaBtn: "Contact us",
        shopBtn: "Browse all products",
        faqTitle: "Frequently asked questions",
        faq: [
          {
            q: "Where can I buy Na Golovy in Ukraine?",
            a: "Na Golovy is sold only through accredited masters and salons. Viola is an official online store with nationwide Nova Poshta delivery. Avoid marketplaces — there is a high risk of counterfeits.",
          },
          {
            q: "How is Na Golovy different from mass-market cosmetics?",
            a: "Na Golovy is professional niche cosmetics with a high concentration of active ingredients. Formulas are designed to protect color and combine across lines for personalized care.",
          },
          {
            q: "Can I get a personal product recommendation?",
            a: "Yes — Viola Hehedosh, the accredited brand technologist, provides free online consultations. Write to Telegram or Instagram with a photo of your hair and describe your concerns.",
          },
          {
            q: "How long does delivery take?",
            a: "Orders are shipped within 1-3 business days via Nova Poshta. Delivery typically takes 1-3 days to any city in Ukraine.",
          },
        ],
      }
    : {
        eyebrow: "Бренд Na Gólov[y]",
        h1: "Na Gólov[y] купити в Україні — Магазин технолога бренду",
        intro:
          "Na Golovy (На Голову) — українська нішева косметика для волосся, заснована колористом Наталією Головченко. Формули розроблені спеціально для збереження кольору та здоров'я волосся. Viola — це магазин від Віоли Гегедош, акредитованого технолога бренду Na Golovy. Купити повну лінійку з доставкою по всій Україні та отримати персональну експертну консультацію.",
        whyTitle: "Чому купувати Na Gólov[y] в Viola",
        why: [
          {
            title: "Акредитований технолог бренду",
            text: "Na Golovy продається виключно через акредитованих майстрів та салони. Віола Гегедош — акредитований технолог бренду Na Golovy, тож ви купуєте безпосередньо у експерта. 100% оригінальна продукція, жодних підробок.",
          },
          {
            title: "Консультація технолога бренду",
            text: "Віола Гегедош — акредитований технолог Na Golovy. Отримайте персональні рекомендації: який шампунь, маску або незмивний догляд обрати для вашого типу волосся. Безкоштовно, онлайн або в салоні.",
          },
          {
            title: "Доставка Новою Поштою по Україні",
            text: "Відправляємо за 1-3 робочих дні в будь-яке місто. Оплата карткою, післяплата або онлайн через WayForPay.",
          },
          {
            title: "Захист кольору і висока концентрація",
            text: "Формули Na Golovy містять високу концентрацію активних компонентів — на одне застосування витрачається менше продукту, а вся лінійка комбінується між собою для повноцінного догляду.",
          },
        ],
        linesTitle: "Лінійки Na Gólov[y]",
        lines: [
          { name: "Шампуні", desc: "Колагенові, аміноцерамідні, безсульфатні, гіалуронові, хелатуючі — для кожного типу волосся та цілі." },
          { name: "Кондиціонери", desc: "Комплекс 9 протеїнів, екзотичні олії, амінокислоти — глибоке живлення і легке розчісування." },
          { name: "Маски", desc: "Парафінотерапія, Diamond Gloss, поліпептидна павутина, колаген — інтенсивне відновлення і блиск." },
          { name: "Незмивний догляд", desc: "BB креми, шовк, термозахист-спреї з церамідами та трегалозою." },
          { name: "Тоніки та ампули", desc: "Мультивітамінні, гіалуронові — бустери для здоров'я шкіри голови та густоти волосся." },
          { name: "Догляд за шкірою голови", desc: "Пілінги з термо- та охолоджувальним ефектом, себобалансуючі формули для чутливої шкіри." },
        ],
        featuredTitle: "Популярні товари Na Gólov[y]",
        ctaTitle: "Потрібна допомога з вибором?",
        ctaText: "Запишіться на безкоштовну консультацію до технолога бренду Na Gólov[y] Віоли Гегедош.",
        ctaBtn: "Зв'язатися з нами",
        shopBtn: "Переглянути всі товари",
        faqTitle: "Часті запитання",
        faq: [
          {
            q: "Де купити Na Golovy в Україні?",
            a: "Na Golovy продається тільки через акредитованих майстрів та салони. Viola — офіційний інтернет-магазин з доставкою Новою Поштою по всій Україні. Уникайте маркетплейсів — там високий ризик підробок.",
          },
          {
            q: "Чим Na Golovy відрізняється від мас-маркету?",
            a: "Na Golovy — професійна нішева косметика з високою концентрацією активних компонентів. Формули розроблені для захисту кольору і комбінуються між лінійками для персоналізованого догляду.",
          },
          {
            q: "Чи можна отримати персональну рекомендацію продукту?",
            a: "Так — Віола Гегедош, акредитований технолог бренду, проводить безкоштовні онлайн-консультації. Напишіть у Telegram або Instagram з фото волосся та описом проблеми.",
          },
          {
            q: "Скільки займає доставка?",
            a: "Замовлення відправляються за 1-3 робочих дні Новою Поштою. Доставка зазвичай займає 1-3 дні в будь-яке місто України.",
          },
        ],
      };

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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {content.lines.map((line) => (
              <div
                key={line.name}
                className="bg-white rounded p-6 border border-[#E8E4DE]"
              >
                <h3 className="font-serif text-lg font-semibold text-[#1A1A1A] mb-2">
                  {line.name}
                </h3>
                <p className="text-sm text-[#6B6B6B] leading-relaxed">{line.desc}</p>
              </div>
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
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
