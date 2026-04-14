import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://violamukachevo.com";
  const ukUrl = `${siteUrl}/terms`;
  const enUrl = `${siteUrl}/en/terms`;
  return {
    title: "Умови використання сайту — Viola Salon",
    description: "Умови використання сайту та інтернет-магазину Viola — права та обов'язки сторін, політика повернення.",
    alternates: {
      canonical: locale === "en" ? enUrl : ukUrl,
      languages: { uk: ukUrl, en: enUrl, "x-default": ukUrl },
    },
  };
}

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="font-serif text-3xl font-semibold text-[#1A1A1A] mb-8">
        Умови використання
      </h1>

      <div className="prose prose-sm max-w-none text-[#4A4A4A] space-y-6">
        <section>
          <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-3">1. Загальні положення</h2>
          <p>
            Ці Умови використання регулюють відносини між ФОП Гегедош Віолета Валеріївна (далі — Продавець)
            та користувачами сайту violamukachevo.com (далі — Сайт).
          </p>
          <p>
            Використовуючи Сайт, ви підтверджуєте, що ознайомились з цими Умовами та погоджуєтесь з ними.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-3">2. Замовлення та оплата</h2>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Оформлення замовлення є офертою на укладення договору купівлі-продажу</li>
            <li>Оплата здійснюється у гривнях (UAH) через платіжну систему WayForPay або за реквізитами</li>
            <li>Після підтвердження оплати замовлення передається у обробку</li>
            <li>Ціни на товари можуть змінюватись без попереднього повідомлення</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-3">3. Доставка</h2>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Доставка здійснюється Новою Поштою по всій Україні</li>
            <li>Терміни відправлення: 1–3 робочих дні після підтвердження оплати</li>
            <li>Вартість доставки сплачує покупець за тарифами Нової Пошти</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-3">4. Повернення та обмін</h2>
          <p>
            Згідно з Постановою КМУ №172 від 19.03.1994, косметичні засоби належної якості поверненню та обміну не підлягають.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-3">5. Права інтелектуальної власності</h2>
          <p>
            Усі матеріали Сайту (тексти, фотографії, логотипи) є власністю Продавця або бренду Na Gólov[y]
            та захищені авторським правом. Копіювання без дозволу заборонено.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-3">6. Обмеження відповідальності</h2>
          <p>
            Продавець не несе відповідальності за збитки, спричинені неправильним використанням товару,
            затримками доставки з вини перевізника або обставинами непереборної сили.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-3">7. Контакти</h2>
          <p>
            З питань щодо замовлень та умов звертайтесь:
          </p>
          <ul className="list-none space-y-1 ml-2">
            <li>📞 <a href="tel:+380500582175" className="text-[#C4A882] hover:underline">+38 050 058 21 75</a></li>
          </ul>
        </section>

        <p className="text-sm text-[#6B6B6B] pt-4 border-t border-[#E8E4DE]">
          Дата останнього оновлення: березень 2026 р.
        </p>
      </div>
    </div>
  );
}
