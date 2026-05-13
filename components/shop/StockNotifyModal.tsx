"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { sendGAEvent } from "@next/third-parties/google";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import type { Product } from "@/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

export default function StockNotifyModal({ isOpen, onClose, product }: Props) {
  const t = useTranslations("stockNotify");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);

  const reset = () => {
    setName("");
    setPhone("");
  };

  const handleClose = () => {
    if (sending) return;
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast.error(t("fillFields"));
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/notify-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          productName: product.name,
          productSlug: product.slug,
          status: product.is_coming_soon ? "coming_soon" : "out_of_stock",
        }),
      });
      if (!res.ok) throw new Error("Request failed");
      sendGAEvent("event", "notify_stock_request", {
        product_id: product.id,
        product_name: product.name,
        status: product.is_coming_soon ? "coming_soon" : "out_of_stock",
      });
      sendGAEvent("event", "generate_lead", {
        lead_source: "stock_notify",
        product_id: product.id,
        product_name: product.name,
      });
      toast.success(t("success"));
      reset();
      onClose();
    } catch {
      toast.error(t("error"));
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t("title")} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-[#6B6B6B]">
          {t("description", { product: product.name })}
        </p>
        <Input
          label={t("name")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("namePlaceholder")}
          autoComplete="name"
          required
        />
        <Input
          label={t("phone")}
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+380 50 000 00 00"
          autoComplete="tel"
          required
        />
        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={sending} className="flex-1">
            {t("submit")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="flex-1"
          >
            {t("cancel")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
