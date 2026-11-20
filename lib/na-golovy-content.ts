/**
 * The copy of /na-golovy, per locale. Lives outside the page so the markdown
 * version (lib/md) renders the very same text instead of a second copy.
 */
export function getNaGolovyContent(locale: string) {
  const isEn = locale === "en";
  return isEn
    ? {
        eyebrow: "Na Gólov[y] Brand",
        h1: "Na Golovy — Ukrainian Professional Hair Cosmetics Brand",
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
            text: "We ship within 1-3 business days to any city. Pay online by card via LiqPay, or request a call back and we will confirm the order with you.",
          },
          {
            title: "Color protection & concentration",
            text: "Na Golovy formulas contain a high concentration of active ingredients — you use less product per application and the entire line is combinable for a complete care ritual.",
          },
        ],
        linesTitle: "Na Gólov[y] product lines",
        lines: [
          { name: "Shampoos", href: "/shop/category/shampoos", desc: "Collagen, amino-ceramide, sulfate-free, hyaluronic, chelating — for every hair type and goal." },
          { name: "Conditioners", href: "/shop/category/conditioners", desc: "9-protein complex, exotic oils, amino acids — deep nourishment and detangling." },
          { name: "Masks", href: "/shop/category/masks", desc: "Paraffin therapy, Diamond Gloss, polypeptide web, collagen — intensive reconstruction and shine." },
          { name: "Leave-in care", href: "/shop/category/leave-in", desc: "BB creams, silk, thermal protection sprays with ceramides and trehalose." },
          { name: "Tonics & ampoules", href: "/shop/category/leave-in", desc: "Multivitamin, hyaluronic — boosters for scalp health and hair density." },
          { name: "Scalp care", href: "/shop/category/peeling-shampoos", desc: "Peels with thermal and cooling effect, sebo-balancing formulas for sensitive scalp." },
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
            link: {
              href: "/blog/de-kupyty-na-glovy-v-ukrayini-ofitsiynyy-prodazh",
              label: "Read more: where to buy Na Golovy in Ukraine →",
            },
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
        h1: "На Голову (Na Golovy) — український бренд професійної косметики для волосся",
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
            text: "Відправляємо за 1-3 робочих дні в будь-яке місто. Оплата карткою онлайн через LiqPay або зворотний дзвінок — ми підтвердимо замовлення з вами.",
          },
          {
            title: "Захист кольору і висока концентрація",
            text: "Формули Na Golovy містять високу концентрацію активних компонентів — на одне застосування витрачається менше продукту, а вся лінійка комбінується між собою для повноцінного догляду.",
          },
        ],
        linesTitle: "Лінійки Na Gólov[y]",
        lines: [
          { name: "Шампуні", href: "/shop/category/shampoos", desc: "Колагенові, аміноцерамідні, безсульфатні, гіалуронові, хелатуючі — для кожного типу волосся та цілі." },
          { name: "Кондиціонери", href: "/shop/category/conditioners", desc: "Комплекс 9 протеїнів, екзотичні олії, амінокислоти — глибоке живлення і легке розчісування." },
          { name: "Маски", href: "/shop/category/masks", desc: "Парафінотерапія, Diamond Gloss, поліпептидна павутина, колаген — інтенсивне відновлення і блиск." },
          { name: "Незмивний догляд", href: "/shop/category/leave-in", desc: "BB креми, шовк, термозахист-спреї з церамідами та трегалозою." },
          { name: "Тоніки та ампули", href: "/shop/category/leave-in", desc: "Мультивітамінні, гіалуронові — бустери для здоров'я шкіри голови та густоти волосся." },
          { name: "Догляд за шкірою голови", href: "/shop/category/peeling-shampoos", desc: "Пілінги з термо- та охолоджувальним ефектом, себобалансуючі формули для чутливої шкіри." },
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
            link: {
              href: "/blog/de-kupyty-na-glovy-v-ukrayini-ofitsiynyy-prodazh",
              label: "Докладніше: де купити Na Golovy в Україні →",
            },
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
}
