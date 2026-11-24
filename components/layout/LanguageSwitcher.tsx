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
            ? "text-foreground font-semibold"
            : "text-muted hover:text-accent"
        }`}
      >
        UA
      </button>
      <span className="text-border">|</span>
      <button
        onClick={() => switchLocale("en")}
        className={`px-1.5 py-0.5 rounded transition-colors ${
          locale === "en"
            ? "text-foreground font-semibold"
            : "text-muted hover:text-accent"
        }`}
      >
        EN
      </button>
    </div>
  );
}
