import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Замовлення оформлено",
  robots: { index: false },
};

export default function SuccessPage({
  searchParams,
}: {
  searchParams: { orderId?: string };
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-[#C6F6D5] rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-[#38A169]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="font-serif text-3xl font-bold text-[#1A1A1A] mb-3">
          Дякуємо за замовлення!
        </h1>
        <p className="text-[#6B6B6B] mb-2">
          Ваше замовлення прийнято та буде оброблено найближчим часом.
        </p>
        {searchParams.orderId && (
          <p className="text-sm text-[#A0A0A0] mb-6">
            Номер замовлення: <span className="font-mono font-medium text-[#1A1A1A]">{searchParams.orderId.slice(0, 8).toUpperCase()}</span>
          </p>
        )}
        <p className="text-sm text-[#6B6B6B] mb-8">
          Ми зв'яжемося з вами для підтвердження замовлення.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/shop"
            className="inline-flex items-center justify-center bg-[#1A1A1A] text-white px-8 py-3 text-sm font-medium rounded hover:bg-[#C4A882] transition-colors"
          >
            Продовжити покупки
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center border border-[#E8E4DE] text-[#1A1A1A] px-8 py-3 text-sm font-medium rounded hover:border-[#C4A882] transition-colors"
          >
            На головну
          </Link>
        </div>
      </div>
    </div>
  );
}
