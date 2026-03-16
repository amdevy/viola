import { Metadata } from "next";
import Link from "next/link";
import ContactsForm from "./ContactsForm";

export const metadata: Metadata = {
  title: "Контакти",
  description: "Контакти салону Viola. Телефон, адреса, форма зворотного зв'язку.",
};

export default function ContactsPage() {
  return (
    <>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <nav className="text-xs text-[#6B6B6B] mb-8">
          <span>Головна</span>
          <span className="mx-2">/</span>
          <span className="text-[#1A1A1A]">Контакти</span>
        </nav>

        <h1 className="font-serif text-4xl font-bold text-[#1A1A1A] mb-12">
          Контакти
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Left — Contact info */}
          <div className="space-y-8">

            <div>
              <p className="text-[#C4A882] text-xs uppercase tracking-[0.25em] mb-1">Телефон</p>
              <a
                href="tel:+380500582175"
                className="text-2xl font-semibold text-[#1A1A1A] hover:text-[#C4A882] transition-colors"
              >
                +380 50 058 21 75
              </a>
            </div>

            <div>
              <p className="text-[#C4A882] text-xs uppercase tracking-[0.25em] mb-1">Адреса</p>
              <p className="text-[#1A1A1A] font-medium">Салон краси VIOLA</p>
              <p className="text-[#6B6B6B]">м. Мукачево, вул. Шевченка 13А/35</p>
            </div>

            <div>
              <p className="text-[#C4A882] text-xs uppercase tracking-[0.25em] mb-3">Ми у соцмережах</p>
              <div className="flex flex-col gap-2">
                <a
                  href="https://www.instagram.com/viola.mukachevo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[#1A1A1A] hover:text-[#C4A882] transition-colors text-sm"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  @viola.mukachevo
                </a>
                <a
                  href="https://t.me/violagegedosh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[#1A1A1A] hover:text-[#C4A882] transition-colors text-sm"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                  t.me/violagegedosh
                </a>
              </div>
            </div>

            <div>
              <p className="text-[#C4A882] text-xs uppercase tracking-[0.25em] mb-1">Години роботи</p>
              <p className="text-[#6B6B6B] text-sm">Пн–Сб: 9:00 – 19:00</p>
              <p className="text-[#6B6B6B] text-sm">Нд: за попереднім записом</p>
            </div>
          </div>

          {/* Right — Feedback form */}
          <div>
            <h2 className="font-semibold text-[#1A1A1A] mb-6">
              Зворотній зв&apos;язок
            </h2>
            <ContactsForm />
            <p className="text-xs text-[#6B6B6B] mt-4 leading-relaxed">
              Цей сайт захищений reCAPTCHA, до нього застосовуються{" "}
              <Link href="/privacy" className="underline hover:text-[#C4A882]">
                Політика конфіденційності
              </Link>{" "}
              та{" "}
              <a
                href="https://policies.google.com/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-[#C4A882]"
              >
                Умови обслуговування Google
              </a>
              .
            </p>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="w-full h-80 sm:h-96 mt-12 grayscale hover:grayscale-0 transition-all duration-500">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2628.0!2d22.7100357!3d48.4354842!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4739ac81d71e90c9:0x1abbd1e312a868e9!2z0JLRltC-0LvQsA!5e0!3m2!1suk!2sua!4v1"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Салон Viola на карті"
        />
      </div>
    </>
  );
}
