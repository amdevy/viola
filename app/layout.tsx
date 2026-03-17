import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { Analytics } from "@vercel/analytics/next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import "./globals.css";

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
    "Na Golovy", "Na Gólov[y]", "на голови косметика", "купити на голови",
    "косметика для волосся купити", "шампунь Na Golovy", "маска для волосся Na Golovy",
    "аромакосметика для волосся", "професійна косметика Мукачево",
    "Viola салон Мукачево", "Віола Гегедош", "косметика для збереження кольору",
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
    <html lang="uk" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              name: "Viola Salon",
              description: "Офіційний магазин косметики Na Gólov[y]. Технолог бренду — Віола Гегедош.",
              url: process.env.NEXT_PUBLIC_SITE_URL,
              telephone: "+380500582175",
              email: "hello@viola.com.ua",
              address: {
                "@type": "PostalAddress",
                streetAddress: "вул. Шевченка 13А/35",
                addressLocality: "Мукачево",
                addressCountry: "UA",
              },
              geo: {
                "@type": "GeoCoordinates",
                latitude: 48.4354842,
                longitude: 22.7100357,
              },
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
      <body className="bg-[#FAFAF8] text-[#1A1A1A] antialiased">
        <Header />
        <main>{children}</main>
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
