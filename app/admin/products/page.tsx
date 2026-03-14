"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import DataTable from "@/components/admin/DataTable";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { formatPrice, slugify } from "@/lib/utils";
import toast from "react-hot-toast";
import Image from "next/image";
import type { Product, Category } from "@/types";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    price: "",
    compare_price: "",
    volume: "",
    description: "",
    category_id: "",
    in_stock: true,
    images: [] as string[],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const supabase = createClient();
    const [p, c] = await Promise.all([
      supabase.from("products").select("*, category:categories(id,name,slug)").order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("name"),
    ]);
    setProducts((p.data as Product[]) ?? []);
    setCategories((c.data as Category[]) ?? []);
    setLoading(false);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", slug: "", price: "", compare_price: "", volume: "", description: "", category_id: "", in_stock: true, images: [] });
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      slug: p.slug,
      price: String(p.price),
      compare_price: p.compare_price ? String(p.compare_price) : "",
      volume: p.volume ?? "",
      description: p.description ?? "",
      category_id: p.category_id ?? "",
      in_stock: p.in_stock,
      images: p.images ?? [],
    });
    setShowModal(true);
  };

  const uploadFile = async (file: File) => {
    setImageUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from("products").upload(path, file);
    if (error) {
      toast.error("Помилка завантаження зображення");
      setImageUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("products").getPublicUrl(path);
    setForm((f) => ({ ...f, images: [...f.images, publicUrl] }));
    setImageUploading(false);
    toast.success("Зображення завантажено");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    await uploadFile(file);
  };

  const handleSave = async () => {
    if (!form.name || !form.slug || !form.price) {
      toast.error("Заповніть обов'язкові поля");
      return;
    }
    setSaving(true);
    const supabase = createClient();

    const payload = {
      name: form.name,
      slug: form.slug,
      price: Number(form.price),
      compare_price: form.compare_price ? Number(form.compare_price) : null,
      volume: form.volume || null,
      description: form.description || null,
      category_id: form.category_id || null,
      in_stock: form.in_stock,
      images: form.images,
    };

    const { error } = editing
      ? await supabase.from("products").update(payload).eq("id", editing.id)
      : await supabase.from("products").insert(payload);

    if (error) {
      toast.error("Помилка збереження: " + error.message);
    } else {
      toast.success(editing ? "Товар оновлено" : "Товар додано");
      setShowModal(false);
      loadData();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Видалити товар?")) return;
    setDeleting(id);
    const supabase = createClient();
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast.error("Помилка видалення");
    else {
      toast.success("Товар видалено");
      setProducts((p) => p.filter((x) => x.id !== id));
    }
    setDeleting(null);
  };

  const columns = [
    {
      key: "image",
      header: "Фото",
      render: (p: Product) =>
        p.images?.[0] ? (
          <div className="relative w-10 h-12 rounded overflow-hidden bg-[#F0EDE8]">
            <Image src={p.images[0]} alt={p.name} fill className="object-cover" sizes="40px" />
          </div>
        ) : (
          <div className="w-10 h-12 rounded bg-[#F0EDE8] flex items-center justify-center text-[#C4A882] text-xs">
            Фото
          </div>
        ),
    },
    {
      key: "name",
      header: "Назва",
      render: (p: Product) => (
        <div>
          <p className="font-medium text-[#1A1A1A]">{p.name}</p>
          <p className="text-xs text-[#6B6B6B]">{p.volume}</p>
        </div>
      ),
    },
    {
      key: "price",
      header: "Ціна",
      render: (p: Product) => (
        <div>
          <p className="font-semibold">{formatPrice(p.price)}</p>
          {p.compare_price && (
            <p className="text-xs text-[#A0A0A0] line-through">{formatPrice(p.compare_price)}</p>
          )}
        </div>
      ),
    },
    {
      key: "category",
      header: "Категорія",
      render: (p: Product) => (
        <span className="text-sm text-[#6B6B6B]">{p.category?.name ?? "—"}</span>
      ),
    },
    {
      key: "in_stock",
      header: "Наявність",
      render: (p: Product) => (
        <span className={`text-xs font-medium ${p.in_stock ? "text-[#38A169]" : "text-[#E53E3E]"}`}>
          {p.in_stock ? "В наявності" : "Немає"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Дії",
      render: (p: Product) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => openEdit(p)}
            className="text-xs text-[#C4A882] hover:underline"
          >
            Редагувати
          </button>
          <button
            onClick={() => handleDelete(p.id)}
            disabled={deleting === p.id}
            className="text-xs text-[#E53E3E] hover:underline disabled:opacity-50"
          >
            Видалити
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl font-bold text-[#1A1A1A]">Товари</h1>
        <Button onClick={openCreate} size="sm">+ Додати товар</Button>
      </div>

      <DataTable
        columns={columns}
        data={products}
        loading={loading}
        keyExtractor={(p) => p.id}
        emptyMessage="Товарів поки немає"
      />

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? "Редагувати товар" : "Новий товар"}
        size="xl"
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Назва *"
              value={form.name}
              onChange={(e) => setForm((f) => ({
                ...f,
                name: e.target.value,
                slug: f.slug || slugify(e.target.value),
              }))}
            />
            <Input
              label="Slug *"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            />
            <Input
              label="Ціна (грн) *"
              type="number"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            />
            <Input
              label="Стара ціна (грн)"
              type="number"
              value={form.compare_price}
              onChange={(e) => setForm((f) => ({ ...f, compare_price: e.target.value }))}
            />
            <Input
              label="Об'єм (наприклад, 250ml)"
              value={form.volume}
              onChange={(e) => setForm((f) => ({ ...f, volume: e.target.value }))}
            />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-[#1A1A1A]">Категорія</label>
              <select
                value={form.category_id}
                onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
                className="w-full px-4 py-3 text-sm border border-[#E8E4DE] rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#C4A882]"
              >
                <option value="">Без категорії</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[#1A1A1A]">Опис</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full px-4 py-3 text-sm border border-[#E8E4DE] rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#C4A882] resize-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="in_stock"
              checked={form.in_stock}
              onChange={(e) => setForm((f) => ({ ...f, in_stock: e.target.checked }))}
              className="accent-[#C4A882]"
            />
            <label htmlFor="in_stock" className="text-sm text-[#1A1A1A]">В наявності</label>
          </div>

          {/* Image upload */}
          <div>
            <label className="text-sm font-medium text-[#1A1A1A] block mb-2">Зображення</label>
            {form.images.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {form.images.map((img, i) => (
                  <div key={i} className="relative w-16 h-20 rounded overflow-hidden bg-[#F0EDE8] group">
                    <Image src={img} alt="" fill className="object-cover" sizes="64px" />
                    <button
                      onClick={() => setForm((f) => ({ ...f, images: f.images.filter((_, j) => j !== i) }))}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 text-white text-xs flex items-center justify-center transition-opacity"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${dragOver ? "border-[#C4A882] bg-[#C4A882]/5" : "border-[#E8E4DE] hover:border-[#C4A882]"}`}
            >
              {imageUploading ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-2 border-[#C4A882] border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-[#6B6B6B]">Завантаження...</span>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center gap-2">
                  <svg className="w-8 h-8 text-[#C4A882]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  <span className="text-sm text-[#1A1A1A] font-medium">Перетягніть фото сюди</span>
                  <span className="text-xs text-[#6B6B6B]">або натисніть для вибору файлу</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={imageUploading}
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-4 pt-4 border-t border-[#E8E4DE]">
          <Button onClick={handleSave} loading={saving} className="flex-1">
            {editing ? "Зберегти" : "Додати"}
          </Button>
          <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">
            Скасувати
          </Button>
        </div>
      </Modal>
    </div>
  );
}
