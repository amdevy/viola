import "../globals.css";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

export const metadata = {
  title: "Admin — Viola",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uk" className={inter.variable}>
      <body className="bg-[#F5F3EF] text-[#1A1A1A] antialiased">
        {children}
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
