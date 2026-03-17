import type { Metadata } from "next";

export const metadata: Metadata = {
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
  },
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
