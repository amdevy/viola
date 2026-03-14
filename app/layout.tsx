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
    default: "Viola — Салон краси | Косметика Na Golov[y]",
    template: "%s | Viola",
  },
  description:
    "Віола Гегедош — Експерт бренду Na Golovy. Салон краси Viola, професійна косметика, персональні консультації. Шампуні, кондиціонери, маски з доставкою по Україні.",
  keywords: ["косметика для волосся", "Na Golov[y]", "шампунь", "кондиціонер", "маска", "Viola", "салон волосся"],
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
