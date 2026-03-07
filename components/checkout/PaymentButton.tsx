"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";

interface PaymentButtonProps {
  orderId: string;
  items: { name: string; price: number; qty: number }[];
  customer: { name: string; phone: string; email: string };
  disabled?: boolean;
}

export default function PaymentButton({
  orderId,
  items,
  customer,
  disabled,
}: PaymentButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/wayforpay/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, items, customer }),
      });

      if (!res.ok) throw new Error("Помилка ініціалізації платежу");

      const html = await res.text();
      const div = document.createElement("div");
      div.innerHTML = html;
      document.body.appendChild(div);
      const form = div.querySelector("form");
      if (form) form.submit();
    } catch (err) {
      toast.error("Помилка підключення до платіжної системи");
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePay}
      loading={loading}
      disabled={disabled}
      className="w-full"
      size="lg"
    >
      Оплатити карткою
    </Button>
  );
}
