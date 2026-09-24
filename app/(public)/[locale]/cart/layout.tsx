import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { pageTitle } from "@/lib/seo-title";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "cart" });
  return {
    // Without it the cart inherited the home page title.
    title: pageTitle(t("title")),
    robots: { index: false, follow: false },
  };
}

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
