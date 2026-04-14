"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const switchLocale = (newLocale: "uk" | "en") => {
    if (newLocale === locale) return;
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <div className="flex items-center gap-1 text-xs">
      <button
        onClick={() => switchLocale("uk")}
        className={`px-1.5 py-0.5 rounded transition-colors ${
          locale === "uk"
            ? "text-[#1A1A1A] font-semibold"
            : "text-[#6B6B6B] hover:text-[#C4A882]"
        }`}
      >
        UA
      </button>
      <span className="text-[#E8E4DE]">|</span>
      <button
        onClick={() => switchLocale("en")}
        className={`px-1.5 py-0.5 rounded transition-colors ${
          locale === "en"
            ? "text-[#1A1A1A] font-semibold"
            : "text-[#6B6B6B] hover:text-[#C4A882]"
        }`}
      >
        EN
      </button>
    </div>
  );
}
