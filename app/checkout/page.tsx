import { Metadata } from "next";
import OrderForm from "@/components/checkout/OrderForm";
import CheckoutSummary from "./CheckoutSummary";

export const metadata: Metadata = {
  title: "Оформлення замовлення",
  robots: { index: false },
};

export default function CheckoutPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-serif text-3xl font-bold text-[#1A1A1A] mb-8">
        Оформлення замовлення
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        <div className="lg:col-span-3">
          <OrderForm />
        </div>
        <div className="lg:col-span-2">
          <CheckoutSummary />
        </div>
      </div>
    </div>
  );
}
