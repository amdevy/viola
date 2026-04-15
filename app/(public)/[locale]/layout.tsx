import "../../globals.css";
import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Toaster } from "react-hot-toast";
import { Analytics } from "@vercel/analytics/next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { routing } from "@/i18n/routing";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://violamukachevo.com";

  return {
    title: {
      default: t("homeTitle"),
      template: "%s — Na Gólov[y] | Viola",
    },
    description: t("homeDescription"),
    keywords: [
      "Na Golovy", "Na Gólov[y]", "na golovy", "na golovu",
      "на голову", "на голову косметика",
      "купити na golovy", "na golovy купити",
    ],
    authors: [{ name: "Viola Salon" }],
    robots: { index: true, follow: true },
    icons: {
      icon: [
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      ],
      apple: { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      other: [{ rel: "manifest", url: "/site.webmanifest" }],
    },
    openGraph: {
      type: "website",
      locale: locale === "en" ? "en_US" : "uk_UA",
      siteName: "Viola",
      images: [
        {
          url: "/preview.jpg",
          width: 1200,
          height: 630,
          alt: "Na Gólov[y] — Viola Salon",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      images: ["/preview.jpg"],
    },
    metadataBase: new URL(siteUrl),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "uk" | "en")) {
    notFound();
  }

  const messages = await getMessages();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://violamukachevo.com";

  const salonName = locale === "en" ? "Viola Beauty Salon" : "Салон краси Viola";
  const salonDesc =
    locale === "en"
      ? "Official Na Gólov[y] cosmetics store. Brand technologist — Viola Hehedosh."
      : "Офіційний магазин косметики Na Gólov[y]. Технолог бренду — Віола Гегедош.";

  return (
    <html lang={locale} className={`${inter.variable} ${cormorant.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BeautySalon",
              "@id": "https://violamukachevo.com/#business",
              name: salonName,
              description: salonDesc,
              url: siteUrl,
              telephone: "+380500582175",
              image: `${siteUrl}/preview.jpg`,
              priceRange: "₴₴",
              inLanguage: locale === "en" ? "en-US" : "uk-UA",
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
              areaServed: { "@type": "Country", name: "Ukraine" },
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
        <NextIntlClientProvider messages={messages}>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </NextIntlClientProvider>
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
