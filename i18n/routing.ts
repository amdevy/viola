import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  locales: ["uk", "en"],
  defaultLocale: "uk",
  localePrefix: "as-needed",
  alternateLinks: false, // HTML handles hreflang per-page with translation awareness — avoids HTTP header conflict for untranslated pages
});

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
