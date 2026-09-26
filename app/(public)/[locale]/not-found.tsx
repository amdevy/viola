import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import TrackedLink from "@/components/ui/TrackedLink";
import { getCategoryTree } from "@/lib/categories-server";
import { pageTitle } from "@/lib/seo-title";

// Rendered inside the locale layout, so the visitor keeps the header, the
// footer and the category menu. Reached both from notFound() in the product,
// category and blog pages and from [...rest] for addresses nothing matches.

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: await getLocale(), namespace: "notFound" });
  return {
    title: pageTitle(t("metaTitle")),
    robots: { index: false, follow: true },
  };
}

export default async function NotFound() {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "notFound" });
  // Same cached call as the layout's menu: only categories that have products.
  const categories = await getCategoryTree(locale);

  const sections = [
    ...categories.map((c) => ({ href: `/shop/category/${c.slug}`, label: c.name })),
    { href: "/na-golovy", label: t("brand") },
    { href: "/blog", label: t("blog") },
  ];

  return (
    <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center">
      <p
        aria-hidden="true"
        className="font-serif text-8xl sm:text-9xl font-bold leading-none text-[#C4A882] mb-6"
      >
        404
      </p>
      <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-4 text-balance">
        {t("title")}
      </h1>
      <p className="text-[#6B6B6B] leading-relaxed max-w-xl mx-auto mb-10">{t("text")}</p>

      <div className="flex flex-wrap justify-center gap-3 mb-14">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 bg-[#1A1A1A] text-white px-8 py-4 text-sm font-medium uppercase tracking-[0.2em] hover:bg-[#C4A882] transition-colors rounded-sm"
        >
          {t("toCatalog")}
        </Link>
        <TrackedLink
          href="https://t.me/violagegedosh"
          target="_blank"
          rel="noopener noreferrer"
          eventName="telegram_consultation"
          eventParams={{ source: "not_found" }}
          className="inline-flex items-center gap-2 border border-[#1A1A1A] text-[#1A1A1A] px-8 py-4 text-sm font-medium uppercase tracking-[0.2em] hover:bg-[#1A1A1A] hover:text-white transition-colors rounded-sm"
        >
          {t("askTechnologist")}
        </TrackedLink>
      </div>

      <p className="text-xs uppercase tracking-[0.3em] text-[#6B6B6B] mb-4">{t("popular")}</p>
      <nav aria-label={t("popular")} className="flex flex-wrap justify-center gap-2">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="px-4 py-2 text-sm rounded border border-[#E8E4DE] bg-white text-[#1A1A1A] hover:border-[#C4A882] hover:text-[#C4A882] transition-colors"
          >
            {s.label}
          </Link>
        ))}
      </nav>
    </section>
  );
}
