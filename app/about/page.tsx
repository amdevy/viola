import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Про бренд",
  description:
    "Віола Гегедош — технолог бренду Na Golov[y]. Дізнайтесь більше про бренд професійної косметики для волосся Na Golov[y] та салон Viola.",
};

const VALUES = [
  {
    title: "Висока концентрація",
    desc: "Активні інгредієнти у максимальній концентрації — результат помітний з першого застосування.",
  },
  {
    title: "Поєднуваність",
    desc: "Всі продукти розроблені для синергії між собою — можна комбінувати під будь-який тип волосся.",
  },
  {
    title: "Збереження кольору",
    desc: "Формули розроблені колористом — захищають структуру та зберігають яскравість фарбованого волосся.",
  },
  {
    title: "Українське виробництво",
    desc: "Na Golov[y] — нішева ароматична косметика українського бренду для справжніх результатів.",
  },
];

const PRODUCT_LINES = [
  { name: "Шампуні", desc: "Колагенові, амінокерамідні, безсульфатні формули для очищення без шкоди." },
  { name: "Кондиціонери", desc: "9-протеїновий догляд, амінокераміди з екзотичними оліями, глибоке живлення." },
  { name: "Маски", desc: "Парафінотерапія, Diamond Gloss, полімерна webb-маска — відновлення та сяйво." },
  { name: "Незмивний догляд", desc: "BB-креми, термозахист, полікультурний бустер для щоденного догляду." },
  { name: "Тоніки та ампули", desc: "Мультивітамінний, гіалуроновий — концентрована поживна підтримка." },
  { name: "Догляд за шкірою голови", desc: "Пілінги з термо- та охолоджуючим ефектом для здорової шкіри голови." },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-[#E8E4DE] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-[#C4A882] text-xs uppercase tracking-[0.3em] mb-3">
                Про бренд
              </p>
              <h1 className="font-serif text-4xl sm:text-5xl font-bold text-[#1A1A1A] leading-tight mb-6">
                Na Golov[y] — професійна ніш­ева ароматична косметика
              </h1>
              <p className="text-[#1A1A1A]/70 text-lg leading-relaxed mb-8">
                Бренд створений для тих, хто не йде на компроміс із якістю. Кожен продукт —
                це результат глибоких досліджень та турботи про здоров'я та красу волосся.
              </p>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 bg-[#1A1A1A] text-white px-8 py-4 text-sm font-medium uppercase tracking-[0.2em] hover:bg-[#C4A882] transition-all duration-300 rounded-sm"
              >
                Перейти до магазину
              </Link>
            </div>
            <div className="relative aspect-[4/3] rounded overflow-hidden bg-gradient-to-br from-[#D4C5B0] to-[#C4A882]/40 flex items-center justify-center">
              <span className="font-serif text-8xl text-[#C4A882]/60 select-none">V</span>
            </div>
          </div>
        </div>
      </section>

      {/* Owner intro */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative aspect-[3/4] max-w-sm mx-auto lg:mx-0 rounded overflow-hidden">
              <Image
                src="/viola.JPG"
                alt="Віола Гегедош — технолог бренду Na Golov[y]"
                fill
                className="object-cover object-top"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div>
              <p className="text-[#C4A882] text-xs uppercase tracking-[0.3em] mb-3">
                Технолог бренду
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-4 leading-tight">
                Віола Гегедош
              </h2>
              <p className="text-[#6B6B6B] mb-4 leading-relaxed">
                Як технолог бренду Na Golov[y] та засновниця салону Viola, я поєдную
                глибокі знання про догляд за волоссям з пристрастю до справжньої якості.
              </p>
              <p className="text-[#6B6B6B] mb-4 leading-relaxed">
                Мій підхід — персональна консультація та підбір догляду, який справді
                працює саме для вашого волосся. Не шаблонні рішення, а точний догляд.
              </p>
              <p className="text-[#6B6B6B] mb-8 leading-relaxed">
                Салон Viola — простір, де кожен клієнт отримує увагу та турботу. Тут ви
                можете придбати косметику Na Golov[y] та отримати консультацію безпосередньо
                від технолога бренду.
              </p>
              <Link
                href="/contacts"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#1A1A1A] border-b border-[#1A1A1A] pb-0.5 hover:text-[#C4A882] hover:border-[#C4A882] transition-colors"
              >
                Записатись на консультацію
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-[#FAFAF8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-[#C4A882] text-xs uppercase tracking-[0.3em] mb-3">Наші цінності</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#1A1A1A]">
              Чому Na Golov[y]
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {VALUES.map((v) => (
              <div key={v.title} className="bg-white rounded p-6 border border-[#E8E4DE]">
                <div className="w-8 h-0.5 bg-[#C4A882] mb-4" />
                <h3 className="font-serif text-lg font-semibold text-[#1A1A1A] mb-2">
                  {v.title}
                </h3>
                <p className="text-sm text-[#6B6B6B] leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product lines */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-[#C4A882] text-xs uppercase tracking-[0.3em] mb-3">Асортимент</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#1A1A1A]">
              Лінійки продуктів
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PRODUCT_LINES.map((line, i) => (
              <div key={line.name} className="flex gap-4">
                <span className="font-serif text-3xl text-[#C4A882]/30 font-bold leading-none mt-1 select-none">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-semibold text-[#1A1A1A] mb-1">{line.name}</h3>
                  <p className="text-sm text-[#6B6B6B] leading-relaxed">{line.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dark CTA */}
      <section className="py-16 bg-[#1A1A1A]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-4">
            Підберіть догляд для вашого волосся
          </h2>
          <p className="text-white/60 mb-8 leading-relaxed">
            Отримайте персональну консультацію від технолога бренду Na Golov[y]
            та знайдіть продукти, які справді підходять вашому волоссю.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contacts"
              className="inline-flex items-center gap-2 bg-[#C4A882] text-white px-8 py-4 text-sm font-medium uppercase tracking-[0.2em] hover:bg-[#B8976E] transition-all duration-300 rounded-sm"
            >
              Консультація
            </Link>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 border border-white/30 text-white px-8 py-4 text-sm font-medium uppercase tracking-[0.2em] hover:border-white hover:bg-white/5 transition-all duration-300 rounded-sm"
            >
              Магазин
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
