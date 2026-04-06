import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/shop/ProductCard";
import { ProductGridSkeleton } from "@/components/ui/Skeleton";
import type { Product } from "@/types";

export const metadata: Metadata = {
  title: "Viola — Салон краси | Косметика Na Golov[y]",
  description:
    "Віола Гегедош — Експерт бренду Na Golovy. Салон краси Viola, професійна косметика, персональні консультації. Шампуні, кондиціонери, маски.",
  alternates: { canonical: "https://violamukachevo.com" },
};

const BENEFITS = [
  {
    icon: '/icons/heliconia.png',
    title: 'Натуральний склад',
    desc: 'Тільки перевірені інгредієнти без шкідливих речовин.',
  },
  {
    icon: '/icons/scientific-device.png',
    title: 'Косметика Na Golov[y]',
    desc: 'Професійні формули, розроблені Експертами бренду Na Golovy.',
  },
  {
    icon: '/icons/delivery.png',
    title: 'Швидка доставка',
    desc: 'Нова Пошта по всій Україні. Відправляємо протягом 1–3 робочих днів.',
  },
  {
    icon: '/icons/diamond.png',
    title: 'Оригінальна продукція',
    desc: 'Лише сертифікована косметика Na Golov[y] від офіційного представника бренду.',
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
      {/* Hero — Owner introduction */}
      <section className='relative min-h-[70vh] flex items-center overflow-hidden bg-[#E8E4DE]'>
        {/* Owner photo — right side on desktop, background on mobile */}
        <div className='absolute inset-0 lg:left-1/2 lg:right-0'>
          <Image
            src='/viola.JPG'
            alt='Віола Гегедош — засновниця салону Viola, Експерт бренду Na Golovy'
            fill
            className='object-cover object-[center_15%]'
            priority
            sizes='(max-width: 1024px) 100vw, 50vw'
          />
        </div>

        {/* Overlay for mobile readability */}
        <div className='absolute inset-0 bg-gradient-to-t from-[#E8E4DE] via-[#E8E4DE]/80 to-[#E8E4DE]/40 lg:hidden' />
        {/* Left half solid background on desktop */}
        <div className='absolute inset-y-0 left-0 w-1/2 bg-[#E8E4DE] hidden lg:block' />

        <div className='relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full'>
          <div className='max-w-xl'>
            <p className='font-serif text-lg sm:text-xl text-[#1A1A1A]/80 mb-2 tracking-wide'>
              Вітаю, мене звати
            </p>
            <h1 className='font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-[#1A1A1A] leading-[1.15] mb-2'>
              Віола Гегедош
            </h1>
            <p className='font-serif text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#1A1A1A] mb-6 tracking-tight'>
              Експерт бренду Na Golovy
            </p>
            <p className='text-lg text-[#1A1A1A]/75 mb-10 leading-relaxed max-w-md'>
              Тут ви можете зв'язатися зі мною для персональної консультації та
              підібрати догляд, який справді працює.
            </p>
            <div className='flex flex-wrap gap-4'>
              <Link
                href='/shop'
                className='inline-flex items-center gap-2 bg-[#1A1A1A] text-white px-8 py-4 text-sm font-medium uppercase tracking-[0.2em] hover:bg-[#C4A882] transition-all duration-300 rounded-sm'
              >
                Купити
              </Link>
              <Link
                href='/contacts'
                className='inline-flex items-center gap-2 border-2 border-[#1A1A1A] text-[#1A1A1A] px-8 py-4 text-sm font-medium uppercase tracking-[0.2em] hover:bg-[#1A1A1A] hover:text-white transition-all duration-300 rounded-sm'
              >
                Консультація
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
              Категорії магазину
            </h2>
            <p className='text-[#6B6B6B] max-w-xl mx-auto'>
              Вибери свій must-have серед найулюбленіших beauty-засобів.
              Шампунь, кондиціонер, маска — знайди те, що допоможе твоєму
              волоссю.
            </p>
          </div>
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
            {[
              {
                slug: 'shampoos',
                name: 'Шампуні',
                image: '/content/Шампунь.jpg',
              },
              {
                slug: 'conditioners',
                name: 'Кондиціонери',
                image: '/content/Кондиціонер.jpg',
              },
              {
                slug: 'masks',
                name: 'Маски',
                image: '/content/Маска 2.jpg',
              },
              {
                slug: 'leave-in',
                name: 'Незмивні засоби',
                image: '/content/Незмивні.jpg',
              },
            ].map((cat) => (
              <Link
                key={cat.slug}
                href={`/shop?category=${cat.slug}`}
                className='relative aspect-[3/4] rounded overflow-hidden flex items-end p-4 group'
              >
                <Image
                  src={cat.image}
                  alt={cat.name}
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
                Вибір наших клієнтів
              </h2>
              <p className='text-[#6B6B6B]'>
                Клієнти обирають — ми ділимося найкращим. Переглянь топові
                засоби Na Golov[y], що стали фаворитами.
              </p>
            </div>
            <Link
              href='/shop'
              className='hidden md:flex items-center gap-2 text-sm text-[#1A1A1A] hover:text-[#C4A882] transition-colors font-medium'
            >
              Всі товари
              <svg
                className='w-4 h-4'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 5l7 7-7 7'
                />
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
              Всі товари
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
                alt='Салон Viola — косметика Na Golov[y]'
                fill
                className='object-cover'
                sizes='(max-width: 1024px) 100vw, 50vw'
              />
            </div>
            <div>
              <p className='text-[#C4A882] text-xs uppercase tracking-[0.3em] mb-3'>
                Наша історія
              </p>
              <h2 className='font-serif text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-6 leading-tight'>
                Viola — салон краси, що спеціалізується на професійному догляді
                за волоссям з аромакосметикою Na Golov[y]
              </h2>
              <p className='text-[#6B6B6B] mb-4 leading-relaxed'>
                Салон &quot;Viola&quot; заснований Віолою Гегедош — експертом
                бренду Na Golov[y]. У нас можна придбати професійну косметику по
                догляду за волоссям, а також ми надаємо персональні консультації
                з індивідуального підбору засобів.
              </p>
              <p className='text-[#6B6B6B] mb-8 leading-relaxed'>
                Кожен продукт Na Golov[y] — результат глибоких досліджень і
                турботи про здоров&apos;я волосся. Формули створені без
                шкідливих компонентів та забезпечують максимальну ефективність і
                делікатний догляд.
              </p>
              <Link
                href='/about'
                className='inline-flex items-center gap-2 text-sm font-medium text-[#1A1A1A] border-b border-[#1A1A1A] pb-0.5 hover:text-[#C4A882] hover:border-[#C4A882] transition-colors'
              >
                Дізнатися більше
              </Link>
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
                  <Image
                    src={b.icon}
                    alt={b.title}
                    width={48}
                    height={48}
                    className='invert opacity-80'
                  />
                </div>
                <h3 className='font-serif text-lg font-semibold text-white mb-2'>
                  {b.title}
                </h3>
                <p className='text-sm text-white/60 leading-relaxed'>
                  {b.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Instagram CTA */}
      <section className='py-16 bg-[#FAFAF8]'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center'>
          <p className='text-[#C4A882] text-xs uppercase tracking-[0.3em] mb-3'>
            Instagram
          </p>
          <h2 className='font-serif text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-2'>
            @viola.mukachevo
          </h2>
          <p className='text-[#6B6B6B] mb-8'>
            Підписуйся та ділись своїми результатами
          </p>
          <div className='grid grid-cols-3 md:grid-cols-6 gap-2 mb-8'>
            {[
              '/instagram/IMG_3773.jpg',
              '/instagram/IMG_4255.JPG',
              '/instagram/IMG_4333.JPG',
              '/instagram/IMG_4358.JPG',
              '/instagram/IMG_4751.jpg',
              '/instagram/IMG_8563.jpg',
            ].map((src) => (
              <a
                key={src}
                href='https://www.instagram.com/viola.mukachevo'
                target='_blank'
                rel='noopener noreferrer'
                className='relative aspect-square rounded overflow-hidden block group'
              >
                <Image
                  src={src}
                  alt='Viola Instagram'
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
            Підписатися в Instagram
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
            name: 'Салон краси Viola',
            url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://violamukachevo.com',
            inLanguage: 'uk-UA',
            publisher: {
              '@id': 'https://violamukachevo.com/#business',
            },
          }),
        }}
      />
    </>
  );
}
