import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Про бренд",
  description:
    "Віола Гегедош — Експерт бренду Na Golovy. Дізнайтесь більше про бренд професійної косметики для волосся Na Golov[y] та салон Viola.",
};

const VALUES = [
  {
    title: "Ексклюзивні рецептури",
    desc: "Кожен продукт Na Gólov[y] створений у співпраці з провідними експертами галузі. Тут ретельно підібрані інгредієнти, щоб гарантувати бездоганну ефективність та абсолютну безпеку для волосся.",
  },
  {
    title: "Універсальність та багатофункціональність",
    desc: "Один продукт Na Gólov[y] здатен замінити понад 10 звичайних засобів. Це надає безліч можливостей: від глибокого відновлення волосся до створення ідеального глянцевого сяйва.",
  },
  {
    title: "Поєднуваність та унікальний аромат",
    desc: "Усі продукти легко комбінуються між собою. Бренд використовує нішеві парфумерні композиції з багатошаровими ароматами, що поступово відкриваються на волоссі.",
  },
  {
    title: "Українське виробництво",
    desc: "Na Golov[y] — це український бренд нішевої аромакосметики, де якість та турбота про клієнта стоять на першому місці, а інновації не мають аналогів на ринку.",
  },
];

const PRODUCT_LINES = [
  { name: "Шампуні", desc: "Колагенові, аміно-церамідні, безсульфатні формули для ефективного очищення, що сприяють зміцненню та шовковистості волосся." },
  { name: "Кондиціонери", desc: "9-протеїновий догляд, аміно-цераміди з 5 екзотичними оліями. Все це активні формули, які сприяють живленню і пом'якшенню волосся." },
  { name: "Маски", desc: "Diamond Gloss, полімерна webb-маска, колагенова — дарують волоссю м'якість, еластичність і блиск по всій довжині, захищаючи кінчики від посічення." },
  { name: "Незмивний догляд", desc: "Незмивні креми-кондиціонери, спреї-термозахисти ROYAL SHINE, флюїди захищають волосся від зовнішніх впливів, роблячи його м'яким і доглянутим." },
  { name: "Тоніки та BB-креми", desc: "Мультивітамінний та гіалуроновий тоніки, ВВ-крем для волосся Шовк+18-МЕА — для ефективного кондиціонування, розгладження, надання волоссю природного сяйва." },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className='bg-[#E8E4DE] py-20'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-12 items-center'>
            <div className='relative aspect-[3/4] w-full max-w-sm mx-auto lg:mx-0 lg:order-last rounded overflow-hidden'>
              <Image
                src='/brand.JPG'
                alt='Віола Гегедош з продуктами Na Golov[y] у салоні Viola'
                fill
                className='object-cover object-top'
                sizes='(max-width: 1024px) 100vw, 50vw'
              />
            </div>
            <div>
              <p className='text-[#C4A882] text-xs uppercase tracking-[0.3em] mb-3'>
                Про бренд
              </p>
              <h1 className='font-serif text-4xl sm:text-5xl font-bold text-[#1A1A1A] leading-tight mb-6'>
                Na Golov[y] — бренд професійної нішевої аромакосметики
              </h1>
              <p className='text-[#1A1A1A]/70 text-lg leading-relaxed mb-8'>
                Бренд створений для тих, хто не йде на компроміс із якістю.
                Кожен продукт — це результат глибоких досліджень та турботи про
                здоров'я та красу волосся.
              </p>
              <Link
                href='/shop'
                className='inline-flex items-center gap-2 bg-[#1A1A1A] text-white px-8 py-4 text-sm font-medium uppercase tracking-[0.2em] hover:bg-[#C4A882] transition-all duration-300 rounded-sm'
              >
                Перейти до магазину
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
                alt='Віола Гегедош — Експерт бренду Na Golovy'
                fill
                className='object-cover object-top'
                sizes='(max-width: 1024px) 100vw, 50vw'
              />
            </div>
            <div>
              <p className='text-[#C4A882] text-xs uppercase tracking-[0.3em] mb-3'>
                Експерт бренду Na Golovy
              </p>
              <h2 className='font-serif text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-4 leading-tight'>
                Віола Гегедош
              </h2>
              <p className='text-[#6B6B6B] mb-4 leading-relaxed'>
                Як експерт бренду Na Golov[y], засновниця салону краси
                &quot;Viola&quot;, з досвідом понад 30 років, я поєдную глибокі
                знання про догляд за волоссям з пристрастю до справжньої якості.
              </p>
              <p className='text-[#6B6B6B] mb-4 leading-relaxed'>
                Мій підхід — персональна консультація та підбір догляду
                індивідуально. Кожна робота починається з діагностики волосся та
                шкіри голови, після чого ми підбираємо систему яка підходить
                саме Вам!
              </p>
              <p className='text-[#6B6B6B] mb-8 leading-relaxed'>
                Салон Viola — простір, де кожен клієнт отримує увагу,
                професійність та турботу. У нас Ви можете придбати косметику Na
                Golov[y] та отримати консультацію безпосередньо від експерту
                бренду.
              </p>
              <Link
                href='/contacts'
                className='inline-flex items-center gap-2 text-sm font-medium text-[#1A1A1A] border-b border-[#1A1A1A] pb-0.5 hover:text-[#C4A882] hover:border-[#C4A882] transition-colors'
              >
                Записатись на консультацію
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
              Наші цінності
            </p>
            <h2 className='font-serif text-3xl sm:text-4xl font-bold text-[#1A1A1A]'>
              Чому Na Golov[y]
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
              Асортимент
            </p>
            <h2 className='font-serif text-3xl sm:text-4xl font-bold text-[#1A1A1A]'>
              Лінійки продуктів
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
            Підберіть догляд для вашого волосся
          </h2>
          <p className='text-white/60 mb-8 leading-relaxed'>
            Отримайте персональну консультацію від Експерта бренду Na Golovy та
            знайдіть продукти, які справді підходять вашому волоссю.
          </p>
          <div className='flex flex-wrap justify-center gap-4'>
            <Link
              href='/contacts'
              className='inline-flex items-center gap-2 bg-[#C4A882] text-white px-8 py-4 text-sm font-medium uppercase tracking-[0.2em] hover:bg-[#B8976E] transition-all duration-300 rounded-sm'
            >
              Консультація
            </Link>
            <Link
              href='/shop'
              className='inline-flex items-center gap-2 border border-white/30 text-white px-8 py-4 text-sm font-medium uppercase tracking-[0.2em] hover:border-white hover:bg-white/5 transition-all duration-300 rounded-sm'
            >
              Магазин
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
