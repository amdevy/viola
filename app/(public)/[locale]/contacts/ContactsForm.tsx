"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";

export default function ContactsForm() {
  const t = useTranslations("contactForm");
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast.error(t("requiredFields"));
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/notify-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success(t("success"));
      setForm({ name: "", phone: "", email: "", message: "" });
    } catch {
      toast.error(t("error"));
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label={t("nameLabel")}
        placeholder={t("namePlaceholder")}
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
      />
      <Input
        label={t("phoneLabel")}
        placeholder={t("phonePlaceholder")}
        type="tel"
        value={form.phone}
        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
      />
      <Input
        label={t("emailLabel")}
        placeholder="example@email.com"
        type="email"
        value={form.email}
        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
      />
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-[#1A1A1A]">
          {t("messageLabel")}
        </label>
        <textarea
          placeholder={t("messagePlaceholder")}
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          rows={4}
          className="w-full px-4 py-3 text-sm border border-[#E8E4DE] rounded bg-white text-[#1A1A1A] placeholder:text-[#A0A0A0] focus:outline-none focus:ring-2 focus:ring-[#C4A882] focus:border-transparent resize-none"
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" loading={sending} className="uppercase tracking-wider">
          {t("submit")}
        </Button>
      </div>
    </form>
  );
}
