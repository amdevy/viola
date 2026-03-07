"use client";

import { useEffect } from "react";
import Link from "next/link";
import type { Category } from "@/types";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
}

const NAV_LINKS = [
  { href: "/shop", label: "Магазин" },
  { href: "/blog", label: "Блог" },
  { href: "/contacts", label: "Контакти" },
];

export default function MobileMenu({
  isOpen,
  onClose,
  categories,
}: MobileMenuProps) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="relative w-80 max-w-[85vw] bg-white h-full flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E4DE]">
          <span className="font-serif text-xl font-bold text-[#1A1A1A]">Меню</span>
          <button
            onClick={onClose}
            className="p-2 text-[#6B6B6B] hover:text-[#1A1A1A]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-6 py-4">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-widest text-[#6B6B6B] mb-3">Навігація</p>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className="block py-2.5 text-[#1A1A1A] hover:text-[#C4A882] transition-colors font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {categories.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-widest text-[#6B6B6B] mb-3">Категорії</p>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/shop?category=${cat.slug}`}
                  onClick={onClose}
                  className="block py-2.5 text-[#1A1A1A] hover:text-[#C4A882] transition-colors"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          )}
        </nav>

        <div className="px-6 py-4 border-t border-[#E8E4DE]">
          <p className="text-sm text-[#6B6B6B]">@viola.mukachevo</p>
        </div>
      </div>
    </div>
  );
}
