import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/shop/ProductCard";
import { ProductGridSkeleton } from "@/components/ui/Skeleton";
import type { Product } from "@/types";

export const metadata: Metadata = {
  title: "Viola — Професійна косметика для волосся",
  description:
    "Відкрий для себе Viola — преміальну косметику для волосся. Шампуні, кондиціонери, маски для всіх типів волосся.",
};

const BENEFITS = [
  {
    icon: "🌿",
    title: "Натуральний склад",
    desc: "Тільки перевірені інгредієнти без шкідливих речовин.",
  },
  {
    icon: "🔬",
    title: "Професійна формула",
    desc: "Розроблено разом із трихологами та стилістами.",
  },
  {
    icon: "🚚",
    title: "Швидка доставка",
    desc: "Нова Пошта по всій Україні. Від 1500 грн — безкоштовно.",
  },
  {
    icon: "💎",
    title: "Гарантія якості",
    desc: "Повернення протягом 14 днів без зайвих питань.",
  },
];

async function getBestsellers(): Promise<Product[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*, category:categories(id,name,slug)")
    .eq("in_stock", true)
    .order("created_at", { ascending: false })
    .limit(8);
  return (data as Product[]) ?? [];
}

export default async function HomePage() {
  const bestsellers = await getBestsellers();

  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-[#1A1A1A]">
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent z-10" />
        {/* Placeholder hero bg */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A1A] via-[#2D2D2D] to-[#3D3530]" />

        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="max-w-2xl">
            <p className="text-[#C4A882] text-xs uppercase tracking-[0.3em] mb-4 font-medium">
              Новинка сезону
            </p>
            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.1] mb-6">
              Краса починається з волосся
            </h1>
            <p className="text-lg text-white/80 mb-10 leading-relaxed max-w-xl">
              Profesійна косметика для волосся Viola. Натуральні інгредієнти,
              перевірені технологами. Для кожного типу волосся.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 bg-[#C4A882] text-white px-8 py-4 text-sm font-medium uppercase tracking-widest hover:bg-[#A8875E] transition-colors rounded"
              >
                Перейти до магазину
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 border border-white/40 text-white px-8 py-4 text-sm font-medium uppercase tracking-widest hover:bg-white/10 transition-colors rounded"
              >
                Про бренд
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Category cards */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-3">
              Категорії магазину
            </h2>
            <p className="text-[#6B6B6B] max-w-xl mx-auto">
              Обери свій must-have. Шампунь, кондиціонер, маска — знайди те, що справді допоможе твоєму волоссю.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { slug: "shampoos", name: "Шампуні", color: "from-[#2D2D2D] to-[#1A1A1A]" },
              { slug: "conditioners", name: "Кондиціонери", color: "from-[#3D3530] to-[#2D2520]" },
              { slug: "masks", name: "Маски", color: "from-[#2D3530] to-[#1D2520]" },
              { slug: "leave-in", name: "Незмивний догляд", color: "from-[#302D35] to-[#201D25]" },
            ].map((cat) => (
              <Link
                key={cat.slug}
                href={`/shop?category=${cat.slug}`}
                className={`relative aspect-[3/4] rounded overflow-hidden bg-gradient-to-b ${cat.color} flex items-end p-4 group`}
              >
                <div className="relative z-10">
                  <p className="text-white font-semibold text-lg group-hover:text-[#C4A882] transition-colors">
                    {cat.name}
                  </p>
                </div>
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Bestsellers */}
      <section className="py-16 bg-[#FAFAF8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-2">
                Вибір наших клієнтів
              </h2>
              <p className="text-[#6B6B6B]">
                Клієнти обирають — ми ділимося найкращим.
              </p>
            </div>
            <Link
              href="/shop"
              className="hidden md:flex items-center gap-2 text-sm text-[#1A1A1A] hover:text-[#C4A882] transition-colors font-medium"
            >
              Всі товари
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {bestsellers.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {bestsellers.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <ProductGridSkeleton count={4} />
          )}

          <div className="text-center mt-8 md:hidden">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-sm text-[#1A1A1A] hover:text-[#C4A882] transition-colors font-medium border-b border-[#1A1A1A] pb-0.5"
            >
              Всі товари
            </Link>
          </div>
        </div>
      </section>

      {/* About / Brand story */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="aspect-[4/3] rounded overflow-hidden bg-gradient-to-br from-[#E8E4DE] to-[#D4C5B0] flex items-center justify-center">
              <span className="font-serif text-6xl text-[#C4A882] opacity-50">V</span>
            </div>
            <div>
              <p className="text-[#C4A882] text-xs uppercase tracking-[0.3em] mb-3">Наша історія</p>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-6 leading-tight">
                Viola — це любов до здорового волосся
              </h2>
              <p className="text-[#6B6B6B] mb-4 leading-relaxed">
                Ми створили Viola, щоб кожна жінка могла мати доступ до
                справжньої професійної косметики. Наші формули розроблені
                разом із трихологами та перевірені тисячами клієнтів.
              </p>
              <p className="text-[#6B6B6B] mb-8 leading-relaxed">
                Кожен продукт — це результат глибоких досліджень та турботи
                про здоров'я волосся. Без шкідливих речовин, з максимальною
                ефективністю.
              </p>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#1A1A1A] border-b border-[#1A1A1A] pb-0.5 hover:text-[#C4A882] hover:border-[#C4A882] transition-colors"
              >
                Дізнатися більше
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-[#1A1A1A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {BENEFITS.map((b) => (
              <div key={b.title} className="text-center">
                <div className="text-4xl mb-4">{b.icon}</div>
                <h3 className="font-serif text-lg font-semibold text-white mb-2">{b.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Instagram CTA */}
      <section className="py-16 bg-[#FAFAF8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-[#C4A882] text-xs uppercase tracking-[0.3em] mb-3">Instagram</p>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-2">
            @viola.mukachevo
          </h2>
          <p className="text-[#6B6B6B] mb-8">
            Підписуйся та ділись своїми результатами
          </p>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded overflow-hidden bg-gradient-to-br from-[#E8E4DE] to-[#D4C5B0]"
              />
            ))}
          </div>
          <a
            href="https://www.instagram.com/viola.mukachevo"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#1A1A1A] text-white px-6 py-3 text-sm font-medium rounded hover:bg-[#C4A882] transition-colors"
          >
            Підписатися в Instagram
          </a>
        </div>
      </section>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Viola",
            url: process.env.NEXT_PUBLIC_SITE_URL,
            logo: `${process.env.NEXT_PUBLIC_SITE_URL}/logo.png`,
            sameAs: ["https://www.instagram.com/viola.mukachevo"],
          }),
        }}
      />
    </>
  );
}
