import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://violamukachevo.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Каталог косметики Na Gólov[y] — купити в Україні",
  description:
    "Шампуні, маски, кондиціонери та незмивний догляд Na Gólov[y]. Офіційний продаж у салоні Viola, Мукачево. Доставка Новою Поштою по всій Україні.",
  keywords: [
    "Na Golovy каталог", "купити Na Golovy", "шампунь Na Golovy ціна",
    "маска для волосся Na Golovy", "косметика для волосся купити Україна",
  ],
  openGraph: {
    title: "Каталог косметики Na Gólov[y]",
    description: "Шампуні, маски, кондиціонери Na Gólov[y] з доставкою по Україні",
    images: ["/preview.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/preview.jpg"],
  },
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
