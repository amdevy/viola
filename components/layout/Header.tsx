"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/hooks/useCart";
import { useCategories } from "@/hooks/useProducts";
import MobileMenu from "./MobileMenu";
import CartDrawer from "@/components/shop/CartDrawer";

const CATEGORY_ORDER: Record<string, { name: string; order: number }> = {
  shampoos:    { name: "Шампуні",          order: 1 },
  conditioners:{ name: "Кондиціонери",     order: 2 },
  masks:       { name: "Маски",            order: 3 },
  "leave-in":  { name: "Незмивні засоби",  order: 4 },
  additions:   { name: "Пілінги",          order: 5 },
};

export default function Header() {
  const { itemCount, openCart } = useCart();
  const count = useCart((s) => s.itemCount());
  const { categories } = useCategories();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Announcement Bar */}
      <div className='bg-[#1A1A1A] text-white text-center py-2 px-4 text-xs tracking-wide'>
        Безкоштовна доставка від 3000 грн.{' '}
        <Link
          href='/shop'
          className='underline hover:text-[#C4A882] transition-colors'
        >
          Перейти у магазин
        </Link>
      </div>

      <header
        className={`sticky top-0 z-40 bg-[#FAFAF8] transition-shadow duration-300 ${
          scrolled ? 'shadow-sm' : ''
        }`}
      >
        {/* Main header row */}
        <div className='border-b border-[#E8E4DE]'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='flex items-center justify-between h-20 md:h-24'>
              {/* Left: nav (desktop) */}
              <nav className='hidden md:flex items-center gap-6 flex-1'>
                <Link
                  href='/shop'
                  className='text-sm text-[#1A1A1A] hover:text-[#C4A882] transition-colors font-medium'
                >
                  Магазин
                </Link>
                <Link
                  href='/blog'
                  className='text-sm text-[#1A1A1A] hover:text-[#C4A882] transition-colors font-medium'
                >
                  Блог
                </Link>
                <Link
                  href='/contacts'
                  className='text-sm text-[#1A1A1A] hover:text-[#C4A882] transition-colors font-medium'
                >
                  Контакти
                </Link>
                <Link
                  href='/reviews'
                  className='text-sm text-[#1A1A1A] hover:text-[#C4A882] transition-colors font-medium'
                >
                  Відгуки
                </Link>
              </nav>

              {/* Center: logo + tagline */}
              <div className='flex-1 flex justify-center'>
                <Link
                  href='/'
                  className='flex flex-col items-center gap-0.5 hover:opacity-80 transition-opacity'
                >
                  <Image
                    src='/logo.png'
                    alt='Viola — Салон краси "Viola", косметика Na Golov[y]'
                    width={200}
                    height={80}
                    className='h-14 md:h-16 w-auto mix-blend-multiply'
                    priority
                  />
                  <span className='text-[10px] uppercase tracking-[0.25em] text-[#6B6B6B] font-light'>
                    Косметика Na Gólov[y]
                  </span>
                </Link>
              </div>

              {/* Right icons */}
              <div className='flex items-center gap-2 flex-1 justify-end'>
                {/* Cart */}
                <button
                  onClick={openCart}
                  className='relative p-2 text-[#1A1A1A] hover:text-[#C4A882] transition-colors'
                  aria-label='Кошик'
                >
                  <svg
                    className='w-5 h-5'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={1.5}
                      d='M2.25 3h1.386c.51 0 .955.343 1.087.836l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z'
                    />
                  </svg>
                  {mounted && count > 0 && (
                    <span className='absolute -top-0.5 -right-0.5 bg-[#C4A882] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center'>
                      {count > 9 ? '9+' : count}
                    </span>
                  )}
                </button>

                {/* Mobile menu toggle */}
                <button
                  onClick={() => setMenuOpen(true)}
                  className='md:hidden p-2 text-[#1A1A1A] hover:text-[#C4A882] transition-colors'
                  aria-label='Меню'
                >
                  <svg
                    className='w-5 h-5'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={1.5}
                      d='M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5'
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Category nav bar (desktop) */}
        {categories.length > 0 && (
          <div className='hidden md:block border-b border-[#E8E4DE] bg-white'>
            <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
              <div className='flex items-center justify-center gap-8 h-10 overflow-x-auto'>
                {[...categories]
                  .filter((cat) => cat.slug in CATEGORY_ORDER)
                  .sort((a, b) => CATEGORY_ORDER[a.slug].order - CATEGORY_ORDER[b.slug].order)
                  .map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/shop?category=${cat.slug}`}
                      className='text-xs uppercase tracking-widest text-[#1A1A1A] hover:text-[#C4A882] transition-colors whitespace-nowrap font-medium py-2'
                    >
                      {CATEGORY_ORDER[cat.slug].name}
                    </Link>
                  ))}
              </div>
            </div>
          </div>
        )}
      </header>

      <MobileMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        categories={categories}
      />
      <CartDrawer />
    </>
  );
}
