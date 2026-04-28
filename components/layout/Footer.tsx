"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export default function Footer() {
  const t = useTranslations("footer");
  const tc = useTranslations("categories");
  const th = useTranslations("header");

  return (
    <footer className='bg-[#1A1A1A] text-white'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-8'>
          {/* Brand */}
          <div className='md:col-span-1'>
            <h3 className='font-serif text-2xl font-bold text-white mb-3'>
              Viola
            </h3>
            <p className='text-sm text-[#A0A0A0] leading-relaxed mb-4'>
              {t("description")}
            </p>
            <div className='flex gap-3'>
              <a
                href='https://www.instagram.com/viola.mukachevo'
                target='_blank'
                rel='noopener noreferrer'
                className='w-8 h-8 bg-white/10 hover:bg-[#C4A882] rounded flex items-center justify-center transition-colors'
                aria-label='Instagram'
              >
                <svg
                  className='w-4 h-4'
                  fill='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path d='M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z' />
                </svg>
              </a>
              <a
                href='https://t.me/violagegedosh'
                target='_blank'
                rel='noopener noreferrer'
                className='w-8 h-8 bg-white/10 hover:bg-[#C4A882] rounded flex items-center justify-center transition-colors'
                aria-label='Telegram'
              >
                <svg
                  className='w-4 h-4'
                  fill='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path d='M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z' />
                </svg>
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className='text-sm font-semibold uppercase tracking-widest text-white mb-4'>
              {t("shop")}
            </h4>
            <ul className='space-y-2'>
              {[
                { href: '/shop' as const, label: t("shop") },
                { href: '/na-golovy' as const, label: "Na Gólov[y]" },
                { href: '/shop?category=shampoos' as const, label: tc("shampoos") },
                { href: '/shop?category=conditioners' as const, label: tc("conditioners") },
                { href: '/shop?category=masks' as const, label: tc("masks") },
                { href: '/shop?category=leave-in' as const, label: tc("leavein-care") },
                { href: '/shop?category=styling-brushes' as const, label: tc("styling-brushes") },
                { href: '/shop?category=additions' as const, label: tc("additions") },
                { href: '/shop?category=gift-sets' as const, label: tc("gift-sets") },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className='text-sm text-[#A0A0A0] hover:text-[#C4A882] transition-colors'
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className='text-sm font-semibold uppercase tracking-widest text-white mb-4'>
              {t("information")}
            </h4>
            <ul className='space-y-2'>
              {[
                { href: '/about' as const, label: t("aboutBrand") },
                { href: '/poslugy' as const, label: t("services") },
                { href: '/blog' as const, label: th("blog") },
                { href: '/reviews' as const, label: th("reviews") },
                { href: '/contacts' as const, label: t("contacts") },
                { href: '/delivery' as const, label: t("deliveryPayment") },
                { href: '/offer' as const, label: t("publicOffer") },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className='text-sm text-[#A0A0A0] hover:text-[#C4A882] transition-colors'
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className='text-sm font-semibold uppercase tracking-widest text-white mb-4'>
              {t("contacts")}
            </h4>
            <ul className='space-y-2 text-sm text-[#A0A0A0]'>
              <li>
                <a
                  href='tel:+380500582175'
                  className='text-[#A0A0A0] hover:text-[#C4A882] transition-colors'
                >
                  +380 50 058 21 75
                </a>
              </li>
              <li className='mt-4'>
                <p className='text-xs text-[#6B6B6B]'>{t("workingHours")}</p>
              </li>
            </ul>
          </div>
        </div>

        <div className='border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2'>
          <p className='text-xs text-[#6B6B6B]'>
            {t("allRights", { year: new Date().getFullYear() })}
          </p>
          <a
            href='https://t.me/AndriiMatt'
            target='_blank'
            rel='noopener noreferrer'
            className='text-xs text-[#6B6B6B] hover:text-[#C4A882] transition-colors'
          >
            {t("developedBy")}
          </a>
          <div className='flex gap-4'>
            <Link
              href='/privacy'
              className='text-xs text-[#6B6B6B] hover:text-[#C4A882] transition-colors'
            >
              {t("privacyPolicy")}
            </Link>
            <Link
              href='/terms'
              className='text-xs text-[#6B6B6B] hover:text-[#C4A882] transition-colors'
            >
              {t("termsOfUse")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
