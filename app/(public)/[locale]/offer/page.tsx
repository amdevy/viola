import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://violamukachevo.com";
  const ukUrl = `${siteUrl}/offer`;
  const enUrl = `${siteUrl}/en/offer`;
  return {
    title: "Публічна оферта — Viola Salon Мукачево",
    description: "Публічна оферта інтернет-магазину Viola — умови купівлі-продажу косметики Na Golov[y].",
    alternates: {
      canonical: locale === "en" ? enUrl : ukUrl,
      languages: { uk: ukUrl, en: enUrl, "x-default": ukUrl },
    },
  };
}

export default function OfferPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-serif text-4xl font-bold text-[#1A1A1A] mb-8">Публічна оферта</h1>

      <p className="text-[#6B6B6B] mb-6 leading-relaxed">
        Цей договір є публічною офертою (відповідно до ст. 641 Цивільного кодексу України){" "}
        <strong className="text-[#1A1A1A]">ФОП Гегедош Віолета Валеріївна</strong> (далі —{" "}
        <strong>Продавець</strong>) та визначає умови купівлі-продажу товарів через інтернет-магазин{" "}
        <strong>violamukachevo.com</strong> (далі — <strong>Інтернет-магазин</strong>).
      </p>

      <div className="bg-[#F5F2EE] border border-[#E8E4DE] rounded p-5 mb-10 text-sm leading-relaxed">
        <p className="font-semibold text-[#1A1A1A] mb-3 flex items-center gap-2">
          <span className="text-[#C4A882]">◆</span> Реквізити Продавця:
        </p>
        <p className="text-[#1A1A1A]">ФОП Гегедош Віолета Валеріївна</p>
        <p className="text-[#6B6B6B]">ЄДРПОУ: 2904009787</p>
        <p className="text-[#6B6B6B]">
          IBAN: UA633052990000026003033609274 в АТ КБ &quot;ПРИВАТБАНК&quot;
        </p>
        <p className="text-[#6B6B6B]">Адреса: м. Мукачево, вул. Шевченка 13А/35</p>
        <p className="text-[#6B6B6B]">Салон краси VIOLA</p>
        <p className="text-[#6B6B6B]">Телефон: +380 50 058 21 75</p>
        <p className="text-[#6B6B6B]">Сайт: violamukachevo.com</p>
      </div>

      <div className="space-y-10 text-sm leading-relaxed">

        <section>
          <h2 className="font-serif text-2xl font-bold text-[#1A1A1A] mb-4 pb-2 border-b border-[#E8E4DE]">
            1. Загальні положення
          </h2>
          <p className="text-[#6B6B6B] mb-2">
            1.1. Продавець здійснює продаж товарів через Інтернет-магазин за адресою: violamukachevo.com.
          </p>
          <p className="text-[#6B6B6B]">
            1.2. Замовляючи товар, Покупець підтверджує свою згоду з умовами цього Договору.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-bold text-[#1A1A1A] mb-4 pb-2 border-b border-[#E8E4DE]">
            2. Порядок оформлення замовлення
          </h2>
          <p className="text-[#6B6B6B] mb-2">
            2.1. Покупець оформлює замовлення самостійно на сайті Інтернет-магазину.
          </p>
          <p className="text-[#6B6B6B] mb-2">
            2.2. Покупець, який вперше купує косметику, зобов&apos;язаний пройти попередню консультацію
            у майстра, звернувшись через Instagram або Telegram. У разі відсутності такого контакту
            Продавець має право зателефонувати Покупцеві та провести консультацію перед підтвердженням
            замовлення.
          </p>
          <p className="text-[#6B6B6B]">
            2.3. Продавець має право не підтвердити замовлення у разі відсутності товару на складі.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-bold text-[#1A1A1A] mb-4 pb-2 border-b border-[#E8E4DE]">
            3. Оплата товару
          </h2>
          <p className="text-[#6B6B6B] mb-2">
            3.1. Оплата здійснюється <strong className="text-[#1A1A1A]">100% передоплатою</strong>{" "}
            через доступні платіжні сервіси або банківський переказ.
          </p>
          <p className="text-[#6B6B6B]">
            3.2. Замовлення передається до відправлення лише після підтвердження оплати.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-bold text-[#1A1A1A] mb-4 pb-2 border-b border-[#E8E4DE]">
            4. Доставка товару
          </h2>
          <p className="text-[#6B6B6B] mb-2">
            4.1. Доставка здійснюється по всій території України службою Нова Пошта.
          </p>
          <p className="text-[#6B6B6B] mb-2">
            4.2. Відправлення замовлення здійснюється протягом 1–3 робочих днів після підтвердження оплати.
          </p>
          <p className="text-[#6B6B6B]">
            4.3. Вартість доставки визначається відповідно до тарифів перевізника і оплачується Покупцем.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-bold text-[#1A1A1A] mb-4 pb-2 border-b border-[#E8E4DE]">
            5. Повернення та обмін товару
          </h2>
          <p className="text-[#6B6B6B] mb-2">
            5.1. Згідно з{" "}
            <strong className="text-[#1A1A1A]">Постановою КМУ №172 від 19.03.1994</strong>,
            косметичні засоби не підлягають поверненню або обміну.
          </p>
          <p className="text-[#6B6B6B] mb-3">5.2. Але ми дбаємо про вашу довіру, тому:</p>
          <ul className="space-y-2 mb-3">
            {[
              <>перед оплатою чи підписанням отримання <strong className="text-[#1A1A1A]">уважно огляньте товар</strong>;</>,
              <>якщо упаковка пошкоджена, або зовнішній вигляд вас не влаштовує —{" "}<strong className="text-[#1A1A1A]">не відкривайте пакування</strong> та відразу поверніть товар кур&apos;єру або на пошті;</>,
              <><strong className="text-[#1A1A1A]">претензії щодо зовнішнього вигляду приймаються лише в момент доставки</strong>.</>,
            ].map((item, i) => (
              <li key={i} className="flex gap-3 text-[#6B6B6B]">
                <span className="text-[#C4A882] mt-0.5 flex-shrink-0">▶</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-[#6B6B6B]">
            5.3. У випадку проблем — напишіть у{" "}
            <a
              href="https://t.me/violagegedosh"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#C4A882] hover:underline font-medium"
            >
              Telegram
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-bold text-[#1A1A1A] mb-4 pb-2 border-b border-[#E8E4DE]">
            6. Відповідальність сторін
          </h2>
          <p className="text-[#6B6B6B] mb-2">
            6.1. Продавець не несе відповідальності за затримку або ненадання послуг у разі виникнення
            форс-мажорних обставин.
          </p>
          <p className="text-[#6B6B6B]">
            6.2. Покупець несе відповідальність за достовірність наданої при замовленні інформації.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-bold text-[#1A1A1A] mb-4 pb-2 border-b border-[#E8E4DE]">
            7. Інші умови
          </h2>
          <p className="text-[#6B6B6B] mb-2">
            7.1. Продавець має право вносити зміни до цієї оферти без попереднього погодження з Покупцем.
          </p>
          <p className="text-[#6B6B6B]">
            7.2. Актуальна версія договору завжди доступна за посиланням на сайті.
          </p>
        </section>

      </div>

      <div className="mt-10 pt-6 border-t border-[#E8E4DE] text-sm text-[#6B6B6B] space-y-1">
        <p className="flex items-center gap-2">
          <span className="text-[#C4A882]">◆</span>
          Дата останнього оновлення: <strong className="text-[#1A1A1A]">17.03.2026</strong>
        </p>
        <p className="flex items-center gap-2">
          <span className="text-[#C4A882]">◆</span>
          Цей договір має юридичну силу відповідно до законодавства України.
        </p>
      </div>
    </div>
  );
}
