import { getTranslations } from "next-intl/server";
import { fetchProducts } from "@/lib/products";
import { getLatestProducts } from "@/lib/products-server";
import { getPublishedPosts } from "@/lib/blog";
import { createPublicClient } from "@/lib/supabase/server";
import { getNaGolovyContent } from "@/lib/na-golovy-content";
import { SITE } from "@/lib/site";
import { formatPrice } from "@/lib/utils";
import { htmlToMarkdown, htmlUrl, link, list, renderMdPage } from "@/lib/md/format";
import type { MdLocale } from "@/lib/md/routes";

/** The homepage: hero, category cards, bestsellers, story, benefits, posts, FAQ. */
export async function renderHome(locale: MdLocale): Promise<string> {
  const [t, tc, tCat, tf, meta] = await Promise.all([
    getTranslations({ locale, namespace: "home" }),
    getTranslations({ locale, namespace: "common" }),
    getTranslations({ locale, namespace: "categories" }),
    getTranslations({ locale, namespace: "faq" }),
    getTranslations({ locale, namespace: "meta" }),
  ]);
  const [{ products }, posts] = await Promise.all([
    fetchProducts(createPublicClient(), undefined, locale),
    getPublishedPosts(locale),
  ]);
  const isEn = locale === "en";

  const cats = ["shampoos", "conditioners", "masks", "leave-in"] as const;
  const faq = [1, 2, 3, 4, 5, 6].map((i) => `### ${tf(`q${i}`)}\n\n${tf(`a${i}`)}`);
  const benefits = [
    ["benefitNatural", "benefitNaturalDesc"],
    ["benefitCosmetics", "benefitCosmeticsDesc"],
    ["benefitDelivery", "benefitDeliveryDesc"],
    ["benefitOriginal", "benefitOriginalDesc"],
  ].map(([title, desc]) => `**${t(title)}** — ${t(desc)}`);

  const body = [
    `${t("greeting")} **${t("heroName")}** — ${t("heroRole")}.`,
    t("heroText"),
    `## ${t("categoriesTitle")}\n\n${t("categoriesText")}\n\n${list(
      cats.map((slug) => link(tCat(slug), htmlUrl(`/shop/category/${slug}`, locale))),
    )}`,
    `## ${t("bestsellersTitle")}\n\n${t("bestsellersText")}\n\n${list(
      products.slice(0, 8).map((p) => `${link(p.name, htmlUrl(`/shop/${p.slug}`, locale))} — ${formatPrice(p.price, locale)}`),
    )}\n\n${link(tc("allProducts"), htmlUrl("/shop", locale))}`,
    `## ${t("storyTitle")}\n\n${t("storyP1")}\n\n${t("storyP2")}`,
    list(benefits),
    `## ${isEn ? "Hair care advice" : "Поради по догляду"}\n\n${list(
      posts.slice(0, 3).map((p) => `${link(p.title, htmlUrl(`/blog/${p.slug}`, locale))}${p.excerpt ? ` — ${p.excerpt}` : ""}`),
    )}`,
    `## ${tf("title")}\n\n${tf("subtitle")}\n\n${faq.join("\n\n")}`,
    `## Instagram\n\n${t("instagramCta")}: ${link("@viola.mukachevo", SITE.instagram)}`,
  ].join("\n\n");

  return renderMdPage(
    {
      title: meta("homeTitle"),
      summary: meta("homeDescription"),
      canonical: htmlUrl("/", locale),
      body,
      related: [
        { text: tc("aboutNaGolovy"), url: htmlUrl("/na-golovy", locale) },
        { text: isEn ? "About Viola Hehedosh" : "Про Віолу Гегедош", url: htmlUrl("/about", locale) },
        { text: tc("consultation"), url: htmlUrl("/contacts", locale) },
      ],
    },
    locale,
  );
}

/** /na-golovy, the brand hub. */
export async function renderNaGolovy(locale: MdLocale): Promise<string> {
  const content = getNaGolovyContent(locale);
  const products = await getLatestProducts(locale, 8);
  const isEn = locale === "en";

  const body = [
    content.intro,
    `## ${content.whyTitle}\n\n${content.why.map((w) => `### ${w.title}\n\n${w.text}`).join("\n\n")}`,
    `## ${content.linesTitle}\n\n${list(
      content.lines.map((l) => `${link(l.name, htmlUrl(l.href, locale))} — ${l.desc}`),
    )}`,
    `## ${content.featuredTitle}\n\n${list(
      products.map((p) => `${link(p.name, htmlUrl(`/shop/${p.slug}`, locale))} — ${formatPrice(p.price, locale)}`),
    )}`,
    `## ${content.ctaTitle}\n\n${content.ctaText} ${link(content.ctaBtn, htmlUrl("/contacts", locale))}`,
    `## ${content.faqTitle}\n\n${content.faq
      .map((f) => {
        const more = "link" in f && f.link ? `\n\n${link(f.link.label.replace(/\s*→$/, ""), htmlUrl(f.link.href, locale))}` : "";
        return `### ${f.q}\n\n${f.a}${more}`;
      })
      .join("\n\n")}`,
  ].join("\n\n");

  return renderMdPage(
    {
      title: content.h1,
      summary: isEn
        ? "The Na Golovy (На Голову) brand: philosophy, shampoo, mask and care lines. Buy from accredited brand technologist Viola Hehedosh with delivery across Ukraine."
        : "Бренд На Голову (Na Golovy): філософія, лінійки шампунів, масок і догляду. Купити в акредитованого технолога бренду Віоли Гегедош з доставкою по Україні.",
      canonical: htmlUrl("/na-golovy", locale),
      body,
      related: [
        { text: content.shopBtn, url: htmlUrl("/shop", locale) },
        { text: isEn ? "Official brand website" : "Офіційний сайт бренду", url: SITE.brandUrl },
      ],
    },
    locale,
  );
}

export async function renderAbout(locale: MdLocale): Promise<string> {
  const [t, tc, meta] = await Promise.all([
    getTranslations({ locale, namespace: "about" }),
    getTranslations({ locale, namespace: "common" }),
    getTranslations({ locale, namespace: "meta" }),
  ]);

  const body = [
    `## ${t("brandTitle")}\n\n${link("Na Golov[y]", SITE.brandUrl)} — ${t("brandText")}`,
    `## ${t("ownerName")}\n\n${t("ownerLabel")}\n\n${t("ownerP1")}\n\n${t("ownerP2")}\n\n${t("ownerP3")}`,
    `## ${t("valuesTitle")}\n\n${[1, 2, 3, 4].map((i) => `### ${t(`value${i}Title`)}\n\n${t(`value${i}Desc`)}`).join("\n\n")}`,
    `## ${t("productLinesTitle")}\n\n${list([1, 2, 3, 4, 5].map((i) => `**${t(`line${i}Name`)}** — ${t(`line${i}Desc`)}`))}`,
    `## ${t("ctaTitle")}\n\n${t("ctaText")}`,
  ].join("\n\n");

  return renderMdPage(
    {
      title: meta("aboutTitle"),
      summary: meta("aboutDescription"),
      canonical: htmlUrl("/about", locale),
      body,
      related: [
        { text: t("bookConsultation"), url: htmlUrl("/contacts", locale) },
        { text: tc("goToShop"), url: htmlUrl("/shop", locale) },
      ],
    },
    locale,
  );
}

export async function renderPoslugy(locale: MdLocale): Promise<string> {
  const [t, tc, meta] = await Promise.all([
    getTranslations({ locale, namespace: "poslugy" }),
    getTranslations({ locale, namespace: "common" }),
    getTranslations({ locale, namespace: "meta" }),
  ]);

  const body = [
    htmlToMarkdown(t.raw("intro") as string),
    [1, 2, 3, 4].map((i) => `## ${t(`service${i}Title`)}\n\n${t(`service${i}Desc`)}`).join("\n\n"),
    `${t("ctaText")} ${link(tc("contact"), htmlUrl("/contacts", locale))}, ${link("Instagram", SITE.instagram)}.`,
  ].join("\n\n");

  return renderMdPage(
    {
      title: meta("poslugyTitle"),
      summary: meta("poslugyDescription"),
      canonical: htmlUrl("/poslugy", locale),
      body,
    },
    locale,
  );
}

export async function renderDelivery(locale: MdLocale): Promise<string> {
  const [t, meta] = await Promise.all([
    getTranslations({ locale, namespace: "delivery" }),
    getTranslations({ locale, namespace: "meta" }),
  ]);
  const raw = (key: string) => htmlToMarkdown(t.raw(key) as string);

  const body = [
    `## ${t("paymentTitle")}\n\n${list([1, 2, 3, 4].map((i) => t(`paymentP${i}`)))}\n\n${raw("paymentNote")}`,
    `## ${t("deliveryTitle")}\n\n${raw("deliveryIntro")}\n\n${t("scheduleTitle")}\n\n${list(
      [1, 2, 3].map((i) => raw(`schedule${i}`)),
    )}\n\n**${t("deliveryTime")}** ${raw("deliveryTimeText")}\n\n${t("deliveryCare")}`,
    `## ${t("carrierTitle")}\n\n${raw("carrierText")}\n\n${t("carrierCost")}`,
    `${t("questionsText")} ${link(t("contactUs"), htmlUrl("/contacts", locale))}`,
  ].join("\n\n");

  return renderMdPage(
    {
      title: meta("deliveryTitle"),
      summary: meta("deliveryDescription"),
      canonical: htmlUrl("/delivery", locale),
      body,
    },
    locale,
  );
}

export async function renderContacts(locale: MdLocale): Promise<string> {
  const [t, meta] = await Promise.all([
    getTranslations({ locale, namespace: "contacts" }),
    getTranslations({ locale, namespace: "meta" }),
  ]);

  const body = list([
    `**${t("phone")}:** ${link(SITE.phoneDisplay, `tel:${SITE.phone}`)}`,
    `**${t("address")}:** ${t("salonName")}, ${t("salonAddress")}`,
    `**${t("socialMedia")}:** ${link("@viola.mukachevo", SITE.instagram)}, ${link("t.me/violagegedosh", SITE.telegram)}`,
    `**${t("workingHours")}:** ${t("weekdays")}; ${t("sunday")}`,
  ]);

  return renderMdPage(
    {
      title: meta("contactsTitle"),
      summary: meta("contactsDescription"),
      canonical: htmlUrl("/contacts", locale),
      body,
    },
    locale,
  );
}
