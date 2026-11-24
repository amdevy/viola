"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import type { CategoryNode } from "@/lib/categories";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryNode[];
}

export default function MobileMenu({
  isOpen,
  onClose,
  categories,
}: MobileMenuProps) {
  const t = useTranslations("mobileMenu");
  const th = useTranslations("header");

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  const NAV_LINKS = [
    { href: "/shop" as const, label: th("catalog") },
    { href: "/about" as const, label: th("aboutUs") },
    { href: "/blog" as const, label: th("blog") },
    { href: "/reviews" as const, label: th("reviews") },
    { href: "/contacts" as const, label: th("contacts") },
  ];

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="relative w-80 max-w-[85vw] bg-surface h-full flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <span className="font-serif text-xl font-bold text-foreground">{t("menu")}</span>
          <button
            onClick={onClose}
            className="p-2 text-muted hover:text-foreground"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-6 py-4">
          <div className="mb-6">
            <Link
              href="/na-golovy"
              onClick={onClose}
              className="block py-2.5 text-sm font-medium text-accent hover:text-foreground transition-colors mb-4"
            >
              {th("about")}
            </Link>
            <p className="text-xs uppercase tracking-widest text-muted mb-3">{t("navigation")}</p>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className="block py-2.5 text-foreground hover:text-accent transition-colors font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {categories.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-widest text-muted mb-3">{t("categories")}</p>
              {categories.map((cat) => (
                <div key={cat.id}>
                  <Link
                    href={`/shop/category/${cat.slug}`}
                    onClick={onClose}
                    className="block py-2.5 text-foreground hover:text-accent transition-colors"
                  >
                    {cat.name}
                  </Link>
                  {cat.children.map((child) => (
                    <Link
                      key={child.id}
                      href={`/shop/category/${child.slug}`}
                      onClick={onClose}
                      className="block py-2 pl-4 text-sm text-muted hover:text-accent transition-colors"
                    >
                      {child.name}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          )}
        </nav>

        <div className="px-6 py-4 border-t border-border">
          <p className="text-sm text-muted">@viola.mukachevo</p>
        </div>
      </div>
    </div>
  );
}
