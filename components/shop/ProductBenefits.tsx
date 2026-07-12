import { getTranslations } from "next-intl/server";

export default async function ProductBenefits({
  benefits,
  locale,
}: {
  benefits: string[];
  locale: string;
}) {
  if (!benefits || benefits.length === 0) return null;

  const t = await getTranslations({ locale, namespace: "product" });

  return (
    <div className="mt-6 pt-6 border-t border-[#E8E4DE]">
      <p className="text-xs uppercase tracking-widest text-[#6B6B6B] mb-3">
        {t("benefitsTitle")}
      </p>
      <ul className="space-y-2">
        {benefits.map((b, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-[#1A1A1A] leading-relaxed">
            <svg
              className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#C4A882]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
