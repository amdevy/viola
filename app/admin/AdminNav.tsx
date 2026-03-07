"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Панель", exact: true },
  { href: "/admin/orders", label: "Замовлення" },
  { href: "/admin/products", label: "Товари" },
  { href: "/admin/customers", label: "Клієнти" },
];

export default function AdminNav({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <nav className="bg-[#1A1A1A] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-serif text-lg font-bold text-white">
              Viola Admin
            </Link>
            <div className="hidden md:flex items-center gap-4">
              {NAV.map((link) => {
                const active = link.exact
                  ? pathname === link.href
                  : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "text-sm transition-colors",
                      active ? "text-[#C4A882]" : "text-white/70 hover:text-white"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-white/50 hidden sm:block">{userEmail}</span>
            <Link
              href="/"
              target="_blank"
              className="text-xs text-white/50 hover:text-white transition-colors"
            >
              Сайт ↗
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm text-white/70 hover:text-white transition-colors"
            >
              Вийти
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
