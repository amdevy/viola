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
  conditioners: {
    uk: {
      sections: [
        {
          heading: "Навіщо потрібен кондиціонер На Голову (Na Gólov[y])",
          body: [
            "Шампунь очищує, але залишає кутикулу відкритою — саме тому волосся після миття плутається, електризується і втрачає блиск. Кондиціонер закриває лусочки назад, вирівнює поверхню волосини й повертає їй здатність відбивати світло. Без цього кроку догляд не завершений, і навіть найдорожчий шампунь працює вполовину сили.",
            "Кондиціонери Na Gólov[y] мають високу концентрацію активних компонентів, тому наносяться тонким шаром і не обтяжують. Уся лінійка комбінується між собою: кондиціонер можна брати як пару до свого шампуню, а раз на тиждень підсилювати маскою того ж бренду.",
          ],
        },
        {
          heading: "Як обрати кондиціонер під свій тип волосся",
          body: [
            "Для фарбованого волосся: кондиціонер HARMONY створений у парі з однойменним шампунем і подовжує стійкість кольору, не вимиваючи пігмент. Це базовий вибір, якщо ви регулярно оновлюєте фарбування або тонування.",
            "Для пошкодженого й пористого волосся: кондиціонер з 9 протеїнами та кондиціонер з 11 амінокислотами відбудовують білкову структуру зсередини. Їх варто брати після освітлення, хімічних процедур або тривалого використання гарячих інструментів.",
            "Для сухого волосся й ламких кінчиків: колагеновий, аміно-церамідний з 5 екзотичними оліями, шоколадний з 5 оліями та кондиціонер з олією інка-інчі живлять і повертають еластичність. Вони помітно розгладжують довжини та полегшують розчісування.",
            "Для тонкого волосся й жирної шкіри голови: міцелярний кондиціонер і кондиціонер з екстрактом чорниці працюють делікатно, не залишаючи ваги біля коренів. Кондиціонер з трегалозою додатково утримує вологу в спеку та в опалювальний сезон, а мультивітамінний тонізує й додає щільності.",
          ],
        },
        {
          heading: "Як правильно наносити кондиціонер",
          body: [
            "Кондиціонер наносять на підсушене рушником волосся, відступаючи від коренів: середина довжини і кінчики потребують його найбільше, а шкіра голови — ні. Витримайте одну-дві хвилини й ретельно змийте прохолодною водою — саме прохолодна допомагає кутикулі закритися.",
            "Типова помилка — брати забагато продукту. Через високу концентрацію активів Na Gólov[y] на середню довжину вистачає кількості з монету, і флакон служить помітно довше за мас-маркет. Якщо волосся швидко втрачає свіжість, справа найчастіше не в кондиціонері, а в тому, що його наносили надто близько до коренів.",
          ],
        },
      ],
      faq: [
        {
          q: "Чи можна користуватися кондиціонером щодня?",
          a: "Так. Кондиціонери Na Gólov[y] розроблені для використання після кожного миття — вони не накопичуються у волоссі й не обтяжують його за умови нанесення по довжині, а не на корені.",
        },
        {
          q: "Чим кондиціонер відрізняється від маски?",
          a: "Кондиціонер працює на поверхні: закриває кутикулу, розгладжує і полегшує розчісування після кожного миття. Маска діє глибше й довше, тому її застосовують раз або двічі на тиждень. Найкращий результат дає поєднання обох.",
        },
        {
          q: "Який кондиціонер обрати для фарбованого волосся?",
          a: "Кондиціонер для фарбованого волосся HARMONY — він створений саме для збереження кольору та працює в парі з шампунем HARMONY. Для точного підбору напишіть технологу бренду Віолі Гегедош.",
        },
        {
          q: "Де купити кондиціонер На Голову в Україні?",
          a: "Кондиціонери На Голову (Na Gólov[y]) продаються виключно через акредитованих технологів і салони. Viola — офіційний магазин Віоли Гегедош, тож ви отримуєте оригінальний продукт із доставкою Новою Поштою за 1–3 робочі дні.",
        },
      ],
    },
    en: {
      sections: [
        {
          heading: "Why a Na Gólov[y] conditioner matters",
          body: [
            "Shampoo cleanses but leaves the cuticle open, which is why hair tangles and loses shine right after washing. A conditioner closes those scales back down, smooths the surface and restores the hair's ability to reflect light. Skip it and even the best shampoo works at half strength.",
            "Na Gólov[y] conditioners carry a high concentration of active ingredients, so a thin layer is enough and nothing weighs the hair down. The whole range is designed to combine — pair a conditioner with your shampoo and reinforce it weekly with a mask from the same line.",
          ],
        },
        {
          heading: "Choosing a conditioner for your hair type",
          body: [
            "Colour-treated hair: the HARMONY conditioner is built as a pair to the HARMONY shampoo and extends colour retention without stripping pigment.",
            "Damaged and porous hair: the 9-protein and 11-amino-acid conditioners rebuild the protein structure from within — the choice after bleaching, chemical services or heavy heat styling.",
            "Dry hair and brittle ends: collagen, amino-ceramide with 5 exotic oils, chocolate with 5 oils, and inca inchi oil nourish and restore elasticity, visibly smoothing the lengths.",
            "Fine hair and oily scalp: the micellar and blueberry conditioners work gently without adding weight at the roots, while trehalose holds moisture through heat and heating season.",
          ],
        },
        {
          heading: "How to apply it properly",
          body: [
            "Apply to towel-dried hair, starting away from the roots — the mid-lengths and ends need it, the scalp does not. Leave for one to two minutes and rinse thoroughly with cool water, which helps the cuticle close.",
            "The common mistake is using too much. Because the actives are concentrated, a coin-sized amount covers medium-length hair, and the bottle lasts noticeably longer than mass-market alternatives.",
          ],
        },
      ],
      faq: [
        {
          q: "Can I use conditioner every day?",
          a: "Yes. Na Gólov[y] conditioners are made for use after every wash — they do not build up as long as you apply them along the lengths rather than at the roots.",
        },
        {
          q: "What is the difference between a conditioner and a mask?",
          a: "A conditioner works on the surface after every wash. A mask acts deeper and is used once or twice a week. Using both gives the best result.",
        },
        {
          q: "Which conditioner suits colour-treated hair?",
          a: "The HARMONY conditioner, made specifically to preserve colour and designed to work with the HARMONY shampoo.",
        },
        {
          q: "Where can I buy Na Gólov[y] conditioner in Ukraine?",
          a: "Only through accredited brand technologists and salons. Viola is the official store of technologist Viola Hehedosh, with Nova Poshta delivery across Ukraine in 1–3 business days.",
        },
      ],
    },
  },
  masks: {
    uk: {
      sections: [
        {
          heading: "Що дає маска для волосся Na Gólov[y]",
          body: [
            "Маска — це найглибший рівень домашнього догляду. На відміну від кондиціонера, який працює на поверхні кутикули, маска встигає проникнути в кортекс і відновити те, що волосся втратило під час фарбування, освітлення чи укладок гарячими інструментами. Саме тому одна маска на тиждень часто дає більше, ніж зміна шампуню.",
            "У лінійці Na Gólov[y] дванадцять масок, і вони не дублюють одна одну: кожна закриває свою задачу — зволоження, білкове відновлення, живлення ліпідами, блиск або ущільнення. Це дозволяє чергувати їх під стан волосся, а не шукати одну універсальну.",
          ],
        },
        {
          heading: "Яку маску обрати під свою задачу",
          body: [
            "Сухість і зневоднення: гіалуронова маска з 7 зволожувачами та маска екстразволоження повертають воді здатність утримуватися в волосині. Це вибір після літа, моря або опалювального сезону.",
            "Пошкодження після фарбування й освітлення: колагенова маска, амінокислотна маска-компрес і поліпептидна павутинна маска працюють з білковою структурою та відновлюють міцність. Їх варто вводити курсом, а не одноразово.",
            "Тьмяність і відсутність блиску: маска діамантовий блиск і маска ламінація вирівнюють поверхню волосини так, що вона починає віддзеркалювати світло. Ефект помітний одразу після першого застосування.",
            "Ламкість і втрата еластичності: маска з 5 ліпідами, шоколадне обгортання з 5 оліями та термомаска відновлюють ліпідний бар'єр. Термомаска працює під теплом — її активність зростає від температури, тож її зручно робити під рушником або шапочкою.",
            "Ослаблене й тонке волосся: WOW-маска та мультивітамінна тонізувальна маска додають щільності й тонусу, не обтяжуючи довжини.",
          ],
        },
        {
          heading: "Як застосовувати маску, щоб вона працювала",
          body: [
            "Маску наносять на чисте, добре віджате волосся — на мокрому вона розбавляється водою і не проникає всередину. Розподіліть по довжині, відступивши від коренів, і витримайте від п'яти до п'ятнадцяти хвилин залежно від маски.",
            "Довше не означає краще: після того як активи спрацювали, подальше очікування нічого не додає. Натомість регулярність вирішує все — одна маска щотижня протягом місяця дає більше, ніж три маски за один вечір.",
            "Якщо волосся сильно пошкоджене, маску можна поєднувати з кондиціонером того ж бренду: спершу маска, потім короткий кондиціонер для закриття кутикули. Уся лінійка Na Gólov[y] сумісна між собою.",
          ],
        },
      ],
      faq: [
        {
          q: "Як часто робити маску для волосся?",
          a: "Зазвичай раз або двічі на тиждень. Для сильно пошкодженого волосся перші два-три тижні можна частіше, далі — на підтримку. Щоденне використання маски не потрібне: активи не встигають витрачатися.",
        },
        {
          q: "Чи можна наносити маску на корені?",
          a: "Не потрібно. Маска працює з довжинами та кінчиками, а на коренях лише пришвидшує засалювання. Відступайте два-три сантиметри від шкіри голови.",
        },
        {
          q: "Чи потрібен кондиціонер, якщо я роблю маску?",
          a: "Так. Маска відновлює структуру, кондиціонер закриває кутикулу після кожного миття. Вони вирішують різні задачі, і в лінійці Na Gólov[y] розраховані на спільне використання.",
        },
        {
          q: "Яка маска На Голову найкраща для фарбованого волосся?",
          a: "Після фарбування волосся втрачає і білок, і вологу, тому найчастіше радять чергувати колагенову або амінокислотну маску зі зволожувальною гіалуроновою. Точну схему підбере технолог бренду під ваш стан волосся.",
        },
      ],
    },
    en: {
      sections: [
        {
          heading: "What a Na Gólov[y] hair mask does",
          body: [
            "A mask is the deepest level of home care. Unlike a conditioner, which works on the cuticle surface, a mask reaches the cortex and restores what colouring, bleaching and heat styling took away. One mask a week often does more than switching shampoo.",
            "The line holds twelve masks and they do not duplicate each other — hydration, protein repair, lipid nourishment, shine and density each have their own. That lets you rotate by condition instead of hunting for a single universal product.",
          ],
        },
        {
          heading: "Choosing a mask for your goal",
          body: [
            "Dryness and dehydration: the hyaluronic mask with 7 humectants and the extra-hydration mask restore the hair's ability to hold water — the choice after summer, sea or heating season.",
            "Damage from colouring and bleaching: the collagen mask, the amino-acid compress mask and the polypeptide web mask rebuild protein structure and strength. Use them as a course, not once.",
            "Dullness: the Diamond Gloss mask and the lamination mask smooth the surface until it reflects light again, with a result visible after the first use.",
            "Brittleness: the 5-lipid mask, the chocolate wrap with 5 oils and the thermal mask rebuild the lipid barrier. The thermal mask activates with heat, so it works best under a towel or cap.",
            "Weak, fine hair: the WOW mask and the multivitamin toning mask add density and tone without weighing the lengths down.",
          ],
        },
        {
          heading: "How to use a mask so it works",
          body: [
            "Apply to clean, well-squeezed hair — on soaking hair the mask dilutes and never penetrates. Spread along the lengths, away from the roots, and leave for five to fifteen minutes depending on the mask.",
            "Longer is not better: once the actives have worked, waiting adds nothing. Regularity is what decides the result — one mask a week for a month beats three in one evening.",
          ],
        },
      ],
      faq: [
        {
          q: "How often should I use a hair mask?",
          a: "Once or twice a week. For badly damaged hair you can go more often for the first two or three weeks, then drop back to maintenance.",
        },
        {
          q: "Should a mask go on the roots?",
          a: "No. A mask works on the lengths and ends; at the roots it only speeds up greasiness. Stay two to three centimetres away from the scalp.",
        },
        {
          q: "Do I still need a conditioner if I use a mask?",
          a: "Yes. A mask restores structure, a conditioner closes the cuticle after every wash. They solve different problems and are designed to be used together.",
        },
        {
          q: "Which mask is best for colour-treated hair?",
          a: "Colouring costs hair both protein and moisture, so alternating a collagen or amino-acid mask with the hydrating hyaluronic one is the usual advice. The brand technologist can set the exact schedule for your hair.",
        },
      ],
    },
  },
  "leave-in": {
    uk: {
      sections: [
        {
          heading: "Незмивний догляд Na Gólov[y] — навіщо він потрібен",
          body: [
            "Усе, що змивається, працює лише кілька хвилин. Незмивний догляд лишається на волоссі до наступного миття й захищає його там, де відбувається найбільше пошкоджень: під феном, під праскою, на сонці та під час розчісування вологого волосся. Для фарбованого волосся це ще й захист кольору від вимивання.",
            "У лінійці вісімнадцять засобів — це найбільша категорія Na Gólov[y]. Вони поділені на п'ять родин: BB-креми, флюїди DIAMOND ELIXIR, тоніки, крем-кондиціонери VELVET CREAM, термозахисні спреї ROYAL SHINE і текстурувальні спреї. Кожна родина закриває свій етап, і разом вони складаються в повний догляд без обтяження.",
          ],
        },
        {
          heading: "Що обрати під свою задачу",
          body: [
            "Термозахист перед феном і праскою: спреї ROYAL SHINE із церамідами, гідролізованим шовком або трегалозою. Це обов'язковий крок, якщо ви користуєтесь гарячими інструментами частіше ніж раз на тиждень — без нього жодне відновлення не встигає за пошкодженням.",
            "Щоденне живлення довжин: BB-креми — фосфоліпідний бустер, вітамінний коктейль і шовк із 18-MEA. Вони працюють як крем для обличчя, тільки для волосся: тонкий шар, який лишається на день.",
            "Блиск і гладкість кінчиків: флюїди DIAMOND ELIXIR з кокосовою олією, макадамією або жожоба. Наносяться на самі кінчики, прибирають пухнастість і не залишають жирної плівки.",
            "Легке розчісування без ваги: крем-кондиціонери VELVET CREAM з амінокислотами, гідролізованим шовком або трегалозою. Підходять тонкому волоссю, якому звичайний незмивний догляд здається важким.",
            "Зволоження і тонус: гіалуроновий та мультивітамінний тоніки працюють на рівні шкіри голови й довжин, освіжаючи волосся між миттями.",
            "Об'єм і форма укладки: текстурувальні спреї з вітаміном F і ніацинамідом, колагеном, протеїнами або трегалозою дають рухливу фіксацію без склеювання.",
          ],
        },
        {
          heading: "Як наносити незмивний догляд",
          body: [
            "Більшість засобів наносять на вологе волосся одразу після миття, перед сушінням — саме тоді кутикула ще відкрита й приймає активи. Термозахист обов'язково наносять до фена, а не після: після нагрівання він уже нічого не захищає.",
            "Флюїди й олії — виняток: їх додають на сухе волосся в кінці укладки, лише на кінчики. Якщо нанести їх на корені або на вологе волосся, з'явиться відчуття ваги.",
            "Кількість вирішує все. Через високу концентрацію активів Na Gólov[y] на середню довжину вистачає одного-двох пшиків або краплі розміром з горошину. Надлишок незмивного догляду — найчастіша причина того, що волосся здається брудним уже наступного дня.",
          ],
        },
      ],
      faq: [
        {
          q: "Чи обтяжує незмивний догляд волосся?",
          a: "Ні, якщо дотримуватись кількості й наносити по довжині, а не на корені. Формули Na Gólov[y] концентровані, тож потрібно помітно менше продукту, ніж у мас-маркеті. Для тонкого волосся найлегші варіанти — крем-кондиціонери VELVET CREAM і тоніки.",
        },
        {
          q: "Чи потрібен термозахист, якщо я сушу волосся холодним повітрям?",
          a: "На холодному режимі — ні. Але щойно ви користуєтесь феном у теплому режимі, праскою або плойкою, термозахист стає обов'язковим: волосся починає втрачати білок уже від 150 градусів.",
        },
        {
          q: "Скільки незмивних засобів можна поєднувати?",
          a: "Зазвичай двох достатньо: термозахист перед сушінням і флюїд або крем на кінчики після. Уся лінійка Na Gólov[y] сумісна між собою, тож комбінувати можна вільно — обмежує лише кількість продукту, а не сумісність.",
        },
        {
          q: "Чи змивається незмивний догляд звичайним шампунем?",
          a: "Так, звичайного миття достатньо — засоби не накопичуються у волоссі. Якщо ви користуєтесь стайлінгом щодня, раз на два тижні можна додати глибоке очищення.",
        },
      ],
    },
    en: {
      sections: [
        {
          heading: "Why leave-in care matters",
          body: [
            "Anything you rinse out works for a few minutes. Leave-in care stays until the next wash and protects hair exactly where damage happens: under the dryer, under the iron, in the sun and while combing wet hair. For coloured hair it also shields the pigment from washing out.",
            "Eighteen products make this the largest Na Gólov[y] category, split into families: BB creams, DIAMOND ELIXIR fluids, tonics, VELVET CREAM leave-in conditioners, ROYAL SHINE heat protection sprays and texturising sprays. Each covers one step, and together they form a full routine without weight.",
          ],
        },
        {
          heading: "What to choose",
          body: [
            "Heat protection: ROYAL SHINE sprays with ceramides, hydrolysed silk or trehalose. Non-negotiable if you use hot tools more than once a week — without it no repair keeps pace with the damage.",
            "Daily nourishment: BB creams — phospholipid booster, vitamin cocktail, and silk with 18-MEA. They work like a face cream for hair: a thin layer that stays all day.",
            "Shine and smooth ends: DIAMOND ELIXIR fluids with coconut, macadamia or jojoba oil, applied to the ends only.",
            "Weightless detangling: VELVET CREAM leave-in conditioners with amino acids, hydrolysed silk or trehalose — for fine hair that finds ordinary leave-ins heavy.",
            "Hydration and tone: the hyaluronic and multivitamin tonics refresh both scalp and lengths between washes.",
            "Volume and hold: texturising sprays with vitamin F and niacinamide, collagen, proteins or trehalose give movable hold without stiffness.",
          ],
        },
        {
          heading: "How to apply it",
          body: [
            "Most products go on damp hair right after washing, before drying, while the cuticle is still open. Heat protection always goes on before the dryer — applied afterwards it protects nothing.",
            "Fluids and oils are the exception: add them to dry hair at the end of styling, on the ends only.",
            "Amount decides the result. Because the actives are concentrated, one or two sprays or a pea-sized drop covers medium-length hair. Too much leave-in is the most common reason hair looks dirty the next day.",
          ],
        },
      ],
      faq: [
        {
          q: "Will leave-in care weigh my hair down?",
          a: "Not if you keep to the amount and apply along the lengths rather than the roots. The formulas are concentrated, so you need noticeably less than mass-market products.",
        },
        {
          q: "Do I need heat protection if I air-dry?",
          a: "On a cold setting, no. As soon as you use a warm dryer, a straightener or a curling iron it becomes essential — hair starts losing protein from around 150°C.",
        },
        {
          q: "How many leave-in products can I combine?",
          a: "Two is usually enough: heat protection before drying, then a fluid or cream on the ends. The whole range is designed to combine.",
        },
        {
          q: "Does leave-in care wash out with normal shampoo?",
          a: "Yes, a normal wash is enough — these products do not build up. If you style daily, add a deep-cleansing wash every couple of weeks.",
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
