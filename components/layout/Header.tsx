"use client";

import { useState, useEffect, useRef } from 'react';
import { flushSync } from "react-dom";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { useCart } from "@/hooks/useCart";
import { useHasMounted } from "@/hooks/useCartQuantity";
import { showsBottomNav } from "@/lib/mobile-nav";
import type { CategoryNode } from "@/lib/categories";
import MobileMenu from "./MobileMenu";
import MobileBottomNav from "./MobileBottomNav";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeToggle from "./ThemeToggle";
import CartDrawer from "@/components/shop/CartDrawer";
import SearchOverlay from "@/components/search/SearchOverlay";
import { readSearchMarker, type SearchMarker } from "@/lib/search-session";

export default function Header({ categories }: { categories: CategoryNode[] }) {
  const { openCart } = useCart();
  const count = useCart((s) => s.itemCount());
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  // Set when Back reopened the search (see below); null when a tap opened it.
  const [restoredSearch, setRestoredSearch] = useState<SearchMarker | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const mounted = useHasMounted();
  const t = useTranslations("header");
  // On phones the cart and the menu live in the bottom bar. Where that bar is
  // shown the header hides its own, so neither appears twice on one screen;
  // on the order form, which has no bar, they stay here.
  const inBottomBar = showsBottomNav(usePathname());

  // flushSync so the search field is in the page before this handler returns:
  // iOS raises the keyboard only for a focus() made inside the tap itself, and
  // a search that opens without the keyboard needs a second tap at the field.
  const openSearch = () => {
    flushSync(() => {
      setRestoredSearch(null);
      setSearchOpen(true);
    });
    searchInputRef.current?.focus();
  };

  // After Back/Forward the search is open exactly when the history entry
  // carries the "return to the search" mark that leaving for a result put
  // there (lib/search-session.ts). popstate rather than a pathname change:
  // /shop → /shop?search=… → Back keeps the pathname, and at popstate time
  // usePathname still reports the page being left. Read in the handler only,
  // so the server HTML and the first render never depend on history.
  useEffect(() => {
    const onPopState = () => {
      const marker = readSearchMarker();
      setRestoredSearch(marker);
      setSearchOpen(marker !== null);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={`sticky top-0 z-40 bg-background transition-shadow duration-300 ${scrolled ? 'shadow-sm' : ''}`}
      >
        {/* Main header row */}
        <div className='border-b border-border'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='flex items-center justify-between h-16 md:h-24'>
              {/* Left nav */}
              <div className='flex flex-1 justify-end'>
                {/* Phones: the theme switch sits on the left, across the logo
                    from the language switch. Without the bottom bar (the order
                    form) the header keeps its own cart and menu on the right,
                    so the language switch moves here too, to balance them and
                    keep the logo centred. */}
                <div className='mr-auto flex items-center gap-1 md:hidden'>
                  {!inBottomBar && <LanguageSwitcher />}
                  <ThemeToggle />
                </div>
                <nav className='hidden md:flex items-center gap-7 justify-end'>
                  {[
                    { href: '/shop' as const, label: t("catalog") },
                    { href: '/contacts' as const, label: t("contacts") },
                    { href: '/about' as const, label: t("aboutUs") },
                  ].map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      className='text-xs text-foreground hover:text-accent transition-colors font-medium whitespace-nowrap'
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </div>

              {/* Center: logo */}
              <Link
                href='/'
                className='flex flex-col items-center gap-0.5 hover:opacity-80 transition-opacity'
              >
                <Image
                  src='/logo.png'
                  alt={t("logoAlt")}
                  width={200}
                  height={80}
                  className='h-9 md:h-16 w-auto mix-blend-multiply dark:invert dark:mix-blend-screen'
                  priority
                />
                {/* Below 360px the tagline would push a full header row (switch,
                    cart, menu) past the screen edge. */}
                <span className={`text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-muted font-light whitespace-nowrap ${inBottomBar ? '' : 'max-[359px]:hidden'}`}>
                  {t("cosmetics")}
                </span>
              </Link>

              {/* Right: right nav + cart + mobile menu */}
              <div className='flex items-center flex-1'>
                <nav className='hidden md:flex items-center gap-5 mr-3'>
                  {[
                    { href: '/na-golovy' as const, label: t("about") },
                    { href: '/reviews' as const, label: t("reviews") },
                    { href: '/blog' as const, label: t("blog") },
                    { href: '/contacts' as const, label: t("whereToConsult") },
                  ].map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      className='text-xs text-foreground hover:text-accent transition-colors font-medium whitespace-nowrap'
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
                <div className='ml-auto flex items-center gap-1'>
                  <div className={inBottomBar ? undefined : 'hidden md:block'}>
                    <LanguageSwitcher />
                  </div>
                  <button
                    onClick={() => openCart("header")}
                    className={`relative p-2 text-foreground hover:text-accent transition-colors ${inBottomBar ? 'hidden md:block' : ''}`}
                    aria-label={t("cart")}
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
                      <span className='absolute -top-0.5 -right-0.5 bg-accent text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center'>
                        {count > 9 ? '9+' : count}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setMenuOpen(true)}
                    className={`p-2 text-foreground hover:text-accent transition-colors ${inBottomBar ? 'hidden' : 'md:hidden'}`}
                    aria-label={t("menu")}
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
        </div>

        {/* Category nav bar (desktop).
            Links point at /shop/category/<slug>, not /shop?category=<slug>:
            the former is the canonical, content-bearing page, and sitewide nav
            is the strongest internal link a page can get. */}
        {categories.length > 0 && (
          <div className='hidden md:block border-b border-border bg-surface'>
            <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
              <div className='relative flex items-center justify-center gap-8 h-10'>
                {/* Theme switch for tablets and desktops, across the row from
                    the search: the row above is full at 1024px. */}
                <div className='absolute left-0 top-1/2 -translate-y-1/2'>
                  <ThemeToggle />
                </div>
                {/* Search for tablets and desktops. It sits in this row because
                    the row above has no room left at 1024px; on phones search
                    is in the bottom bar, next to the thumb (MobileBottomNav). */}
                <button
                  type='button'
                  onClick={openSearch}
                  aria-label={t("search")}
                  className='absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1.5 p-2 text-xs uppercase tracking-widest font-medium text-foreground hover:text-accent transition-colors'
                >
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' strokeWidth={1.75} viewBox='0 0 24 24' aria-hidden='true'>
                    <path strokeLinecap='round' strokeLinejoin='round' d='M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z' />
                  </svg>
                  <span className='hidden xl:inline'>{t("search")}</span>
                </button>
                {categories.map((cat) => (
                  <div key={cat.id} className='relative group h-full flex items-center'>
                    <Link
                      href={`/shop/category/${cat.slug}`}
                      className='text-xs uppercase tracking-widest text-foreground hover:text-accent transition-colors whitespace-nowrap font-medium py-2 flex items-center gap-1'
                    >
                      {cat.name}
                      {cat.children.length > 0 && (
                        <svg className='w-2.5 h-2.5' fill='none' stroke='currentColor' strokeWidth={2} viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' d='M19 9l-7 7-7-7' />
                        </svg>
                      )}
                    </Link>
                    {cat.children.length > 0 && (
                      <div className='absolute top-full left-1/2 -translate-x-1/2 pt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50'>
                        <div className='bg-surface border border-border rounded shadow-sm py-2 min-w-[220px]'>
                          {cat.children.map((child) => (
                            <Link
                              key={child.id}
                              href={`/shop/category/${child.slug}`}
                              className='block px-4 py-2 text-xs text-foreground hover:text-accent hover:bg-background transition-colors whitespace-nowrap'
                            >
                              {child.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
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
      <MobileBottomNav onSearch={openSearch} onMenu={() => setMenuOpen(true)} />
      {searchOpen && (
        <SearchOverlay
          onClose={() => setSearchOpen(false)}
          categories={categories}
          inputRef={searchInputRef}
          restored={restoredSearch}
        />
      )}
    </>
  );
}
