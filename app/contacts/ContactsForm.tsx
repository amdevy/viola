"use client";

import { useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";

export default function ContactsForm() {
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
      toast.error("Заповніть обов'язкові поля (Ім'я та Email)");
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
      toast.success("Повідомлення надіслано");
      setForm({ name: "", phone: "", email: "", message: "" });
    } catch {
      toast.error("Помилка. Спробуйте ще раз.");
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Ім'я *"
        placeholder="Введіть ім'я"
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
      />
      <Input
        label="Телефон"
        placeholder="Телефон"
        type="tel"
        value={form.phone}
        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
      />
      <Input
        label="Email *"
        placeholder="example@email.com"
        type="email"
        value={form.email}
        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
      />
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-[#1A1A1A]">
          Повідомлення
        </label>
        <textarea
          placeholder="Повідомлення"
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          rows={4}
          className="w-full px-4 py-3 text-sm border border-[#E8E4DE] rounded bg-white text-[#1A1A1A] placeholder:text-[#A0A0A0] focus:outline-none focus:ring-2 focus:ring-[#C4A882] focus:border-transparent resize-none"
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" loading={sending} className="uppercase tracking-wider">
          Надіслати
        </Button>
      </div>
    </form>
  );
}
