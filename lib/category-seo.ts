// Long-form, technologist-voiced SEO content rendered below the product grid on
// category pages. Purpose: give thin category pages enough depth to rank for
// high-volume Ukrainian queries (e.g. "на голову шампунь", "шампунь на голову")
// and to earn FAQ rich results. Keyed by category slug, then locale.
//
// Only categories with an entry get the extra block; others fall back to the
// short intro paragraph already on the page (no regression). Add new categories
// (masks next — "na golovy hair mask" is trending) by extending CATEGORY_SEO.

export interface CategorySeoSection {
  heading: string;
  body: string[];
}

export interface CategorySeoFaq {
  q: string;
  a: string;
}

export interface CategorySeo {
  sections: CategorySeoSection[];
  faq: CategorySeoFaq[];
}

const CATEGORY_SEO: Record<string, Record<string, CategorySeo>> = {
  shampoos: {
    uk: {
      sections: [
        {
          heading: "Як обрати шампунь На Голову (Na Gólov[y])",
          body: [
            "Шампунь На Голову — це не просто засіб для очищення, а перший крок професійного догляду. Формули Na Gólov[y] мають високу концентрацію активних компонентів, тому працюють делікатно й економно: на одне миття витрачається помітно менше продукту, ніж у мас-маркеті. Уся лінійка комбінується між собою, тож шампунь легко доповнити кондиціонером, маскою та незмивним доглядом того ж бренду.",
            "Головний принцип вибору — орієнтуватися на стан шкіри голови та довжини одночасно. Фарбованому волоссю потрібен захист кольору, сухому й пошкодженому — живлення та відновлення ліпідного бар'єру, жирній шкірі голови — м'яке себорегулювання без пересушування. Якщо ви вагаєтесь, технолог бренду Віола Гегедош безкоштовно підбере шампунь під ваш тип волосся у Telegram чи Instagram.",
          ],
        },
        {
          heading: "Шампуні Na Gólov[y] за типом волосся",
          body: [
            "Для фарбованого волосся: шампунь Harmony та гіалуроновий шампунь м'яко очищують і подовжують стійкість кольору, не вимиваючи пігмент. Це базовий вибір, якщо ви регулярно оновлюєте фарбування або тонування.",
            "Для сухого й пошкодженого волосся: колагеновий та аміноцерамідний шампуні, а також шампунь з 5 екзотичними оліями відновлюють еластичність, розгладжують кутикулу і повертають блиск довжинам після укладок гарячими інструментами.",
            "Для жирної та чутливої шкіри голови: себобалансувальний шампунь і крем-шампунь для чутливої шкіри регулюють роботу сальних залоз, заспокоюють подразнення й подовжують відчуття свіжості між миттями.",
            "Безсульфатні та щоденні варіанти: у лінійці є м'які безсульфатні формули для делікатного щоденного очищення, а також мультивітамінний тонізувальний шампунь для густоти й сили волосся.",
          ],
        },
        {
          heading: "Чому купувати шампунь На Голову у технолога бренду",
          body: [
            "Na Gólov[y] продається виключно через акредитованих майстрів і салони — саме тому купувати варто у перевіреного джерела, а не на маркетплейсах, де високий ризик підробок. Viola — офіційний магазин Віоли Гегедош, акредитованого технолога бренду, тож ви отримуєте 100% оригінальний продукт і персональну консультацію з підбору. Доставка Новою Поштою по всій Україні за 1–3 робочі дні.",
          ],
        },
      ],
      faq: [
        {
          q: "Який шампунь На Голову обрати для фарбованого волосся?",
          a: "Для фарбованого волосся підійде шампунь Harmony або гіалуроновий шампунь Na Gólov[y] — вони м'яко очищують і зберігають стійкість кольору. Для точного підбору напишіть технологу бренду з описом вашого типу волосся.",
        },
        {
          q: "Чи є у Na Gólov[y] безсульфатні шампуні?",
          a: "Так, у лінійці Na Gólov[y] є безсульфатні формули для делікатного щоденного очищення, а також м'які шампуні для чутливої шкіри голови.",
        },
        {
          q: "Скільки витрачається шампуню за одне миття?",
          a: "Завдяки високій концентрації активних компонентів шампуні Na Gólov[y] витрачаються економно — для миття достатньо невеликої кількості, тож флакон служить довше за звичайний мас-маркет.",
        },
        {
          q: "Де купити шампунь На Голову в Україні?",
          a: "Шампуні На Голову (Na Gólov[y]) можна купити в офіційному магазині Viola у акредитованого технолога бренду з доставкою Новою Поштою по всій Україні. Уникайте маркетплейсів через ризик підробок.",
        },
      ],
    },
    en: {
      sections: [
        {
          heading: "How to choose a Na Gólov[y] shampoo",
          body: [
            "A Na Gólov[y] shampoo is the first step of professional hair care, not just cleansing. The formulas contain a high concentration of active ingredients, so they work gently and economically — you use noticeably less product per wash than with mass-market brands. The entire line is combinable, so a shampoo pairs easily with a matching conditioner, mask, and leave-in care.",
            "Choose based on your scalp condition and hair length together: color-treated hair needs color protection, dry and damaged hair needs nourishment and lipid-barrier repair, and an oily scalp needs gentle sebum control without over-drying. If you are unsure, brand technologist Viola Hehedosh will recommend a shampoo for your hair type free of charge via Telegram or Instagram.",
          ],
        },
        {
          heading: "Na Gólov[y] shampoos by hair type",
          body: [
            "Color-treated hair: the Harmony shampoo and the hyaluronic shampoo cleanse gently and extend color retention without stripping pigment — the go-to choice if you refresh your color regularly.",
            "Dry and damaged hair: the collagen and amino-ceramide shampoos, plus the 5 exotic oils shampoo, restore elasticity, smooth the cuticle, and bring back shine after heat styling.",
            "Oily and sensitive scalp: the sebo-balancing shampoo and the sensitive-scalp cream shampoo regulate oil, soothe irritation, and keep hair fresh longer between washes.",
            "Sulfate-free and daily options: the range includes mild sulfate-free formulas for gentle daily cleansing and a multivitamin toning shampoo for density and strength.",
          ],
        },
        {
          heading: "Why buy a Na Gólov[y] shampoo from the brand technologist",
          body: [
            "Na Gólov[y] is sold exclusively through accredited masters and salons, so buy from a verified source rather than marketplaces where counterfeits are common. Viola is the official store of Viola Hehedosh, an accredited brand technologist — you get a 100% authentic product and a personal product-selection consultation, with Nova Poshta delivery across Ukraine in 1–3 business days.",
          ],
        },
      ],
      faq: [
        {
          q: "Which Na Gólov[y] shampoo is best for color-treated hair?",
          a: "For color-treated hair, choose the Harmony shampoo or the hyaluronic Na Gólov[y] shampoo — they cleanse gently and preserve color retention. For an exact match, message the brand technologist with your hair type.",
        },
        {
          q: "Does Na Gólov[y] have sulfate-free shampoos?",
          a: "Yes, the Na Gólov[y] range includes sulfate-free formulas for gentle daily cleansing, as well as mild shampoos for a sensitive scalp.",
        },
        {
          q: "How much shampoo is used per wash?",
          a: "Thanks to the high concentration of active ingredients, Na Gólov[y] shampoos are economical — a small amount is enough per wash, so a bottle lasts longer than typical mass-market products.",
        },
        {
          q: "Where can I buy Na Gólov[y] shampoo in Ukraine?",
          a: "Na Gólov[y] shampoos are available at the official Viola store from an accredited brand technologist, with Nova Poshta delivery across Ukraine. Avoid marketplaces due to the risk of counterfeits.",
        },
      ],
    },
  },
};

export function getCategorySeo(slug: string, locale: string): CategorySeo | null {
  const byLocale = CATEGORY_SEO[slug];
  if (!byLocale) return null;
  return byLocale[locale] ?? byLocale.uk ?? null;
}
