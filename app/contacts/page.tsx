import { Metadata } from "next";
import Link from "next/link";
import ContactsForm from "./ContactsForm";

export const metadata: Metadata = {
  title: "Контакти",
  description: "Контакти салону Viola. Телефон, адреса, форма зворотного зв'язку.",
};

const CONTACT = {
  phone: "+380 50 058 21 75",
  address: "м. Мукачево, вул. Шевченка 13А",
};

export default function ContactsPage() {
  return (
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
        <div className="space-y-10">
          <div>
            <h2 className="font-semibold text-[#1A1A1A] mb-2">
              Зателефонувати нам
            </h2>
            <a
              href={`tel:${CONTACT.phone.replace(/\s/g, "")}`}
              className="text-[#1A1A1A] hover:text-[#C4A882] transition-colors"
            >
              {CONTACT.phone}
            </a>
          </div>

          <div>
            <h2 className="font-semibold text-[#1A1A1A] mb-2">
              Адреса офісу
            </h2>
            <p className="text-[#1A1A1A] leading-relaxed">{CONTACT.address}</p>
          </div>
        </div>

        {/* Right — Feedback form */}
        <div>
          <h2 className="font-semibold text-[#1A1A1A] mb-6">
            Зворотній зв'язок
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
  );
}
