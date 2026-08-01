import { getTranslations } from "next-intl/server";
import type { Product } from "@/types";
import { safeJsonLd } from "@/lib/utils";

export default async function ProductFAQ({
  product,
  locale,
}: {
  product: Product;
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: "productFaq" });

  const productName = product.name;
  const categoryName = product.category?.name ?? (locale === "en" ? "this product" : "цього засобу");

  const faq = [
    { q: t("q1", { product: productName }), a: t("a1") },
    { q: t("q2", { product: productName }), a: t("a2", { product: productName }) },
    { q: t("q3"), a: t("a3") },
    { q: t("q4", { category: categoryName.toLowerCase() }), a: t("a4") },
    { q: t("q5"), a: t("a5") },
  ];

  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <section className="mt-16 pt-12 border-t border-[#E8E4DE]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(ld) }}
      />
      <h2 className="font-serif text-2xl font-bold text-[#1A1A1A] mb-2">
        {t("title")}
      </h2>
      <p className="text-sm text-[#6B6B6B] mb-8">
        {t("subtitle", { product: productName })}
      </p>
      <div className="space-y-3 max-w-3xl">
        {faq.map((item, i) => (
          <details
            key={i}
            className="group border border-[#E8E4DE] rounded bg-[#FAFAF8] overflow-hidden"
          >
            <summary className="flex items-center justify-between cursor-pointer list-none px-5 py-4 font-medium text-[#1A1A1A] hover:text-[#C4A882] transition-colors">
              <span className="pr-4 text-sm sm:text-base">{item.q}</span>
              <svg
                className="w-4 h-4 flex-shrink-0 transition-transform group-open:rotate-180"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </summary>
            <div className="px-5 pb-5 text-sm text-[#6B6B6B] leading-relaxed">
              {item.a}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
