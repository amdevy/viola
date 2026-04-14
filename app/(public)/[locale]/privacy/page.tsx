import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://violamukachevo.com";
  const ukUrl = `${siteUrl}/privacy`;
  const enUrl = `${siteUrl}/en/privacy`;
  return {
    title: "Політика конфіденційності — Viola Salon",
    description: "Політика конфіденційності інтернет-магазину Viola — захист та обробка персональних даних клієнтів.",
    alternates: {
      canonical: locale === "en" ? enUrl : ukUrl,
      languages: { uk: ukUrl, en: enUrl, "x-default": ukUrl },
    },
  };
}

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="font-serif text-3xl font-semibold text-[#1A1A1A] mb-8">
        Політика конфіденційності
      </h1>

      <div className="prose prose-sm max-w-none text-[#4A4A4A] space-y-6">
        <section>
          <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-3">1. Загальні положення</h2>
          <p>
            Ця Політика конфіденційності регулює порядок збору, використання та захисту персональних даних
            користувачів сайту violamukachevo.com (далі — Сайт), що належить ФОП Гегедош Віолета Валеріївна
            (далі — Продавець).
          </p>
          <p>
            Використовуючи Сайт, ви погоджуєтесь з умовами цієї Політики конфіденційності.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-3">2. Які дані ми збираємо</h2>
          <p>При оформленні замовлення ми збираємо:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Ім&apos;я та прізвище</li>
            <li>Номер телефону</li>
            <li>Адресу електронної пошти (за наявності)</li>
            <li>Адресу доставки (місто, відділення Нової Пошти)</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-3">3. Мета збору даних</h2>
          <p>Персональні дані використовуються виключно для:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Оформлення та доставки замовлень</li>
            <li>Зв&apos;язку з покупцем щодо замовлення</li>
            <li>Вирішення спорів</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-3">4. Передача даних третім особам</h2>
          <p>
            Ми не передаємо ваші персональні дані третім особам, за винятком:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Нова Пошта — для доставки замовлення</li>
            <li>WayForPay — для обробки платіжних операцій</li>
          </ul>
          <p>
            Усі партнери дотримуються власних політик конфіденційності та захищають ваші дані.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-3">5. Захист даних</h2>
          <p>
            Ми вживаємо технічних та організаційних заходів для захисту ваших персональних даних від
            несанкціонованого доступу, втрати або знищення. Доступ до даних мають лише уповноважені
            співробітники.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-3">6. Права користувача</h2>
          <p>Ви маєте право:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Отримати інформацію про збережені дані</li>
            <li>Вимагати виправлення або видалення своїх даних</li>
            <li>Відкликати згоду на обробку даних</li>
          </ul>
          <p>
            Для реалізації своїх прав зверніться до нас: <a href="tel:+380500582175" className="text-[#C4A882] hover:underline">+38 050 058 21 75</a>
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-semibold text-[#1A1A1A] mb-3">7. Зміни до Політики</h2>
          <p>
            Ми залишаємо за собою право вносити зміни до цієї Політики. Актуальна версія завжди
            доступна на цій сторінці.
          </p>
        </section>

        <p className="text-sm text-[#6B6B6B] pt-4 border-t border-[#E8E4DE]">
          Дата останнього оновлення: березень 2026 р.
        </p>
      </div>
    </div>
  );
}
