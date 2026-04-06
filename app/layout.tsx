import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { Analytics } from "@vercel/analytics/next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Купити Na Gólov[y] в Україні — Viola Salon | Мукачево",
    template: "%s — Na Gólov[y] | Viola",
  },
  description:
    "Офіційний магазин косметики Na Gólov[y] у Мукачево. Шампуні, маски, кондиціонери для збереження кольору та здоров'я волосся. Доставка Новою Поштою по всій Україні. Консультація від технолога Віоли Гегедош.",
  keywords: [
    "Na Golovy", "Na Gólov[y]", "na golovy", "na golovu",
    "на голову", "на голову косметика",
    "купити на голову", "купити na golovy", "na golovy купити",
    "шампунь Na Golovy", "маска Na Golovy", "кондиціонер Na Golovy",
    "косметика для волосся Na Golovy", "аромакосметика Na Golovy",
    "професійна косметика Мукачево", "Viola салон Мукачево", "Віола Гегедош",
  ],
  authors: [{ name: "Viola Salon" }],
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    other: [
      { rel: "manifest", url: "/site.webmanifest" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "uk_UA",
    siteName: "Viola",
    images: [
      {
        url: "/preview.jpg",
        width: 1200,
        height: 630,
        alt: "Косметика Na Gólov[y] — Viola Salon",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/preview.jpg"],
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uk" className={`${inter.variable} ${cormorant.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BeautySalon",
              "@id": "https://violamukachevo.com/#business",
              name: "Салон краси Viola",
              description: "Офіційний магазин косметики Na Gólov[y]. Технолог бренду — Віола Гегедош.",
              url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://violamukachevo.com",
              telephone: "+380500582175",
              email: "hello@viola.com.ua",
              image: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://violamukachevo.com"}/preview.jpg`,
              priceRange: "₴₴",
              address: {
                "@type": "PostalAddress",
                streetAddress: "вул. Шевченка 13А/35",
                addressLocality: "Мукачево",
                addressRegion: "Закарпатська область",
                postalCode: "89600",
                addressCountry: "UA",
              },
              geo: {
                "@type": "GeoCoordinates",
                latitude: 48.4354842,
                longitude: 22.7100357,
              },
              openingHoursSpecification: [
                {
                  "@type": "OpeningHoursSpecification",
                  dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
                  opens: "09:00",
                  closes: "19:00",
                },
              ],
              sameAs: [
                "https://www.instagram.com/viola.mukachevo",
                "https://t.me/violagegedosh",
              ],
              brand: {
                "@type": "Brand",
                name: "Na Gólov[y]",
                url: "https://www.nagolovy.pro/",
              },
            }),
          }}
        />
      </head>
      <body className="bg-[#FAFAF8] text-[#1A1A1A] antialiased flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <Analytics />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#1A1A1A",
              color: "#fff",
              borderRadius: "4px",
              fontSize: "14px",
            },
            success: {
              iconTheme: { primary: "#C4A882", secondary: "#fff" },
            },
          }}
        />
      </body>
    </html>
  );
}
