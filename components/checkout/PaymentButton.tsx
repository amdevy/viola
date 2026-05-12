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
      const res = await fetch("/api/liqpay/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, items, customer }),
      });

      if (!res.ok) throw new Error("Помилка ініціалізації платежу");

      const { data, signature, action } = await res.json();

      const form = document.createElement("form");
      form.method = "POST";
      form.action = action;
      form.acceptCharset = "utf-8";

      const dataInput = document.createElement("input");
      dataInput.type = "hidden";
      dataInput.name = "data";
      dataInput.value = data;
      form.appendChild(dataInput);

      const sigInput = document.createElement("input");
      sigInput.type = "hidden";
      sigInput.name = "signature";
      sigInput.value = signature;
      form.appendChild(sigInput);

      document.body.appendChild(form);
      form.submit();
    } catch {
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
