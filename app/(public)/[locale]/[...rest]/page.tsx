import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { pageTitle } from "@/lib/seo-title";

/**
 * Any address under a locale that no route matches — a mistyped URL, an old
 * link. Without it Next answered with its built-in 404 (black, English, no
 * header or footer) instead of ../not-found.tsx inside the shop layout.
 */
export default function CatchAllPage() {
  notFound();
}

// With two root layouts (shop and admin) Next ships a 404 as an error shell and
// the browser renders ../not-found.tsx from the payload. The title it applies
// then is this page's, not not-found's — without it the tab switched to the
// home page title a moment after load.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "notFound" });
  return { title: pageTitle(t("metaTitle")), robots: { index: false, follow: true } };
}
