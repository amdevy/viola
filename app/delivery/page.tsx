import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Доставка та оплата — Новою Поштою по всій Україні",
  description: "Умови доставки та оплати замовлень в інтернет-магазині Viola. Нова Пошта по всій Україні. Відправляємо за 1-3 робочих дні.",
  alternates: { canonical: "https://violamukachevo.com/delivery" },
};

const PAYMENT_POINTS = [
  "Швидка обробка замовлень",
  "Без очікувань і затримок — працюємо чітко та вчасно",
  "Безпечний платіж — 100% безпечна оплата без комісії",
  "Завжди на зв'язку",
];

const SCHEDULE = [
  {
    text: (
      <>
        Замовлення, оформлені <strong>з понеділка по суботу до 15:00</strong>, відправляються{" "}
        <strong>в цей же день.</strong>
      </>
    ),
  },
  {
    text: (
      <>
        Замовлення, оформлені <strong>після 15:00</strong>, відправляються{" "}
        <strong>наступного дня вранці.</strong>
      </>
    ),
  },
  {
    text: (
      <>
        Замовлення, оформлені <strong>в суботу після 14:00 або в неділю</strong>, відправляються{" "}
        <strong>в понеділок вранці.</strong>
      </>
    ),
  },
];

export default function DeliveryPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <nav className="text-xs text-[#6B6B6B] mb-8">
        <span>Головна</span>
        <span className="mx-2">/</span>
        <span className="text-[#1A1A1A]">Доставка та оплата</span>
      </nav>

      <h1 className="font-serif text-4xl font-bold text-[#1A1A1A] mb-12">
        Доставка і оплата
      </h1>

      <div className="space-y-12">

        {/* Payment */}
        <section>
          <h2 className="font-serif text-2xl font-bold text-[#1A1A1A] mb-5 pb-2 border-b border-[#E8E4DE]">
            Оплата
          </h2>
          <ul className="space-y-3">
            {PAYMENT_POINTS.map((point) => (
              <li key={point} className="flex gap-3 text-[#6B6B6B]">
                <span className="text-[#C4A882] flex-shrink-0 mt-0.5">▶</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 bg-[#F5F2EE] border border-[#E8E4DE] rounded p-4 text-sm text-[#6B6B6B] leading-relaxed">
            Оплата здійснюється <strong className="text-[#1A1A1A]">100% передоплатою</strong> через
            платіжну систему WayForPay або банківський переказ на рахунок ФОП Гегедош Віолета Валеріївна.
          </div>
        </section>

        {/* Delivery */}
        <section>
          <h2 className="font-serif text-2xl font-bold text-[#1A1A1A] mb-5 pb-2 border-b border-[#E8E4DE]">
            Доставка
          </h2>

          <p className="text-[#6B6B6B] mb-6 leading-relaxed">
            Щоб ви точно знали,{" "}
            <strong className="text-[#1A1A1A]">коли чекати своє замовлення Na Golov[y]</strong>,
            {" "}ділюся актуальним графіком відправок:
          </p>

          <p className="font-semibold text-[#1A1A1A] mb-4">Графік відправки замовлень:</p>

          <ul className="space-y-4 mb-6">
            {SCHEDULE.map((item, i) => (
              <li key={i} className="flex gap-3 text-[#6B6B6B]">
                <span className="text-[#C4A882] flex-shrink-0 mt-0.5">▶</span>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>

          <p className="text-[#6B6B6B] mb-3">
            ⏳ <strong className="text-[#1A1A1A]">Термін доставки</strong> залежить від перевізника
            та зазвичай становить <strong className="text-[#1A1A1A]">1–3 дні.</strong>
          </p>

          <p className="text-[#6B6B6B]">
            ✨ Ви обираєте улюблені продукти — я подбаю, щоб вони швидко й акуратно дісталися до вас.
          </p>
        </section>

        {/* Nova Poshta */}
        <section>
          <h2 className="font-serif text-2xl font-bold text-[#1A1A1A] mb-5 pb-2 border-b border-[#E8E4DE]">
            Служба доставки
          </h2>
          <div className="flex items-start gap-4">
            <div className="w-1 h-full bg-[#C4A882] self-stretch rounded" />
            <div className="text-[#6B6B6B] leading-relaxed">
              <p className="mb-2">
                Доставка здійснюється по всій Україні службою{" "}
                <strong className="text-[#1A1A1A]">Нова Пошта</strong>.
              </p>
              <p>
                Вартість доставки розраховується за тарифами перевізника і оплачується Покупцем
                при отриманні або під час оформлення замовлення.
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
