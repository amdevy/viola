import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Послуги — Консультація з підбору косметики Na Golov[y]",
  description:
    "Віола Гегедош — технолог бренду Na Golov[y], надає послуги персональної консультації з підбору професійної косметики для волосся. Індивідуальний підхід, Мукачево та онлайн.",
  alternates: { canonical: "https://violamukachevo.com/poslugy" },
  keywords: [
    "консультація Na Golovy", "підбір косметики Na Golovy",
    "послуги Viola", "консультація з догляду за волоссям",
    "Na Golovy підбір", "На Голову консультація",
  ],
};

const SERVICES = [
  {
    title: "Персональна консультація з підбору догляду",
    desc: "Індивідуальний підбір засобів Na Golov[y] під ваш тип волосся, стан шкіри голови та побажання. Визначимо, які шампуні, маски та кондиціонери підійдуть саме вам.",
  },
  {
    title: "Онлайн-консультація",
    desc: "Не маєте змоги приїхати до Мукачево? Проведу консультацію онлайн — через Telegram або Instagram. Розкажу, як правильно комбінувати засоби та побудувати ефективний ритуал догляду.",
  },
  {
    title: "Підбір комплексного догляду",
    desc: "Складу повну програму догляду: від очищення до незмивних засобів і термозахисту. Усі лінійки Na Golov[y] комбінуються між собою — підберемо ідеальну схему саме для вас.",
  },
  {
    title: "Консультація зі збереження кольору",
    desc: "Якщо ви фарбуєте волосся — допоможу підібрати засоби Na Golov[y], які зберігають яскравість кольору та захищають структуру волосся після фарбування.",
  },
];

export default function PoslugyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Головна", item: "https://violamukachevo.com" },
              { "@type": "ListItem", position: 2, name: "Послуги" },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "Service",
            serviceType: "Консультація з підбору косметики для волосся",
            provider: { "@id": "https://violamukachevo.com/#business" },
            areaServed: { "@type": "Country", name: "Ukraine" },
            description: "Персональна консультація з підбору професійної косметики Na Golov[y] для догляду за волоссям. Офлайн у Мукачево та онлайн.",
          },
        ]) }}
      />

      <nav className="text-xs text-[#6B6B6B] mb-8">
        <Link href="/" className="hover:text-[#C4A882]">Головна</Link>
        <span className="mx-2">/</span>
        <span className="text-[#1A1A1A]">Послуги</span>
      </nav>

      <h1 className="font-serif text-4xl font-bold text-[#1A1A1A] mb-4">
        Послуги
      </h1>

      <p className="text-lg text-[#6B6B6B] mb-10 leading-relaxed max-w-2xl">
        Я, <strong className="text-[#1A1A1A]">Віола Гегедош</strong> — технолог бренду{" "}
        <strong className="text-[#1A1A1A]">Na Golov[y]</strong>, надаю послуги з індивідуального
        підбору професійної косметики для волосся. Допоможу обрати саме те, що потрібно вашому волоссю.
      </p>

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
          Хочете записатись на консультацію або маєте питання?
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/contacts"
            className="inline-flex items-center gap-2 bg-[#1A1A1A] text-white px-6 py-3 text-sm font-medium uppercase tracking-[0.15em] hover:bg-[#C4A882] transition-colors rounded-sm"
          >
            Зв&apos;язатися
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
