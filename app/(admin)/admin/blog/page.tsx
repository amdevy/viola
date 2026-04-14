"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";

interface BlogPost {
  id: string;
  title: string;
  title_en: string | null;
  slug: string;
  excerpt: string | null;
  excerpt_en: string | null;
  content: string | null;
  content_en: string | null;
  cover_image: string | null;
  cover_position: string | null;
  published: boolean;
  published_at: string | null;
  reading_time: number | null;
  created_at: string;
}


const EMPTY_FORM = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  reading_time: "",
  published: false,
  cover_position: "center",
  title_en: "",
  excerpt_en: "",
  content_en: "",
};

export default function AdminBlogPage() {
  const supabase = createClient();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editPost, setEditPost] = useState<BlogPost | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function fetchPosts() {
    setLoading(true);
    const { data } = await supabase
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false });
    setPosts((data as BlogPost[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchPosts();
  }, []);

  function openCreate() {
    setEditPost(null);
    setForm(EMPTY_FORM);
    setCoverPreview(null);
    setCoverFile(null);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(post: BlogPost) {
    setEditPost(post);
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt ?? "",
      content: post.content ?? "",
      reading_time: post.reading_time?.toString() ?? "",
      published: post.published,
      cover_position: post.cover_position ?? "center",
      title_en: post.title_en ?? "",
      excerpt_en: post.excerpt_en ?? "",
      content_en: post.content_en ?? "",
    });
    setCoverPreview(post.cover_image);
    setCoverFile(null);
    setError(null);
    setModalOpen(true);
  }

  function handleTitleChange(title: string) {
    setForm((f) => ({
      ...f,
      title,
      slug: editPost ? f.slug : slugify(title),
    }));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  async function uploadCover(file: File): Promise<string> {
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("blog")
      .upload(path, file, { upsert: true });
    if (error) throw new Error("Помилка завантаження фото: " + error.message);
    const { data } = supabase.storage.from("blog").getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSave() {
    if (!form.title.trim() || !form.slug.trim()) {
      setError("Заголовок та slug обов'язкові");
      return;
    }
    setSaving(true);
    setError(null);

    let coverUrl = editPost?.cover_image ?? null;
    if (coverFile) {
      try {
        coverUrl = await uploadCover(coverFile);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Помилка завантаження фото");
        setSaving(false);
        return;
      }
    }

    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      excerpt: form.excerpt.trim() || null,
      content: form.content.trim() || null,
      reading_time: form.reading_time ? parseInt(form.reading_time) : null,
      cover_image: coverUrl,
      published: form.published,
      published_at: form.published
        ? (editPost?.published_at ?? new Date().toISOString())
        : null,
      title_en: form.title_en.trim() || null,
      excerpt_en: form.excerpt_en.trim() || null,
      content_en: form.content_en.trim() || null,
    };

    if (editPost) {
      const { error } = await supabase
        .from("blog_posts")
        .update(payload)
        .eq("id", editPost.id);
      if (error) { setError(error.message); setSaving(false); return; }
    } else {
      const { error } = await supabase.from("blog_posts").insert(payload);
      if (error) { setError(error.message); setSaving(false); return; }
    }

    setSaving(false);
    setModalOpen(false);
    fetchPosts();
  }

  async function handleDelete(id: string) {
    if (!confirm("Видалити статтю?")) return;
    setDeleting(id);
    await supabase.from("blog_posts").delete().eq("id", id);
    setDeleting(null);
    setPosts((p) => p.filter((post) => post.id !== id));
  }

  async function togglePublished(post: BlogPost) {
    const published = !post.published;
    await supabase
      .from("blog_posts")
      .update({
        published,
        published_at: published ? new Date().toISOString() : null,
      })
      .eq("id", post.id);
    setPosts((p) =>
      p.map((x) => (x.id === post.id ? { ...x, published } : x))
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Блог</h1>
          <p className="text-sm text-[#6B6B6B] mt-1">{posts.length} статей</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-[#1A1A1A] text-white px-4 py-2 text-sm font-medium rounded hover:bg-[#C4A882] transition-colors"
        >
          + Нова стаття
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-[#F5F5F3] rounded animate-pulse" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 text-[#6B6B6B]">
          <p className="mb-4">Статей поки немає</p>
          <button
            onClick={openCreate}
            className="text-[#C4A882] hover:underline text-sm"
          >
            Створити першу статтю
          </button>
        </div>
      ) : (
        <div className="bg-white rounded border border-[#E8E4DE] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#FAFAF8] border-b border-[#E8E4DE]">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-[#6B6B6B]">Заголовок</th>
                <th className="text-left px-4 py-3 font-medium text-[#6B6B6B] hidden md:table-cell">Slug</th>
                <th className="text-left px-4 py-3 font-medium text-[#6B6B6B] hidden sm:table-cell">Дата</th>
                <th className="text-center px-4 py-3 font-medium text-[#6B6B6B]">Статус</th>
                <th className="text-right px-4 py-3 font-medium text-[#6B6B6B]">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E4DE]">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-[#FAFAF8]">
                  <td className="px-4 py-3">
                    <span className="font-medium text-[#1A1A1A] line-clamp-1">
                      {post.title}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#6B6B6B] hidden md:table-cell">
                    {post.slug}
                  </td>
                  <td className="px-4 py-3 text-[#6B6B6B] hidden sm:table-cell">
                    {post.published_at
                      ? new Date(post.published_at).toLocaleDateString("uk-UA")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => togglePublished(post)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                        post.published
                          ? "bg-green-100 text-green-800 hover:bg-green-200"
                          : "bg-[#F5F5F3] text-[#6B6B6B] hover:bg-[#E8E4DE]"
                      }`}
                    >
                      {post.published ? "Опубліковано" : "Чернетка"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(post)}
                        className="text-xs text-[#1A1A1A] hover:text-[#C4A882] transition-colors font-medium"
                      >
                        Редагувати
                      </button>
                      <button
                        onClick={() => handleDelete(post.id)}
                        disabled={deleting === post.id}
                        className="text-xs text-red-500 hover:text-red-700 transition-colors"
                      >
                        {deleting === post.id ? "..." : "Видалити"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-8 px-4">
          <div className="bg-white rounded-lg w-full max-w-2xl shadow-xl my-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E4DE]">
              <h2 className="text-lg font-semibold text-[#1A1A1A]">
                {editPost ? "Редагувати статтю" : "Нова стаття"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded">
                  {error}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-[#1A1A1A] mb-1">
                  Заголовок *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full border border-[#E8E4DE] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#C4A882]"
                  placeholder="Назва статті"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-xs font-medium text-[#1A1A1A] mb-1">
                  Slug *
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  className="w-full border border-[#E8E4DE] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#C4A882] font-mono"
                  placeholder="url-slug-statti"
                />
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-xs font-medium text-[#1A1A1A] mb-1">
                  Короткий опис
                </label>
                <textarea
                  value={form.excerpt}
                  onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                  rows={2}
                  className="w-full border border-[#E8E4DE] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#C4A882] resize-none"
                  placeholder="Короткий опис для картки статті"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-xs font-medium text-[#1A1A1A] mb-1">
                  Вміст
                </label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  rows={10}
                  className="w-full border border-[#E8E4DE] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#C4A882] resize-y font-mono"
                  placeholder="Текст статті (підтримується HTML)"
                />
              </div>

              {/* EN Translation */}
              <details className="border border-[#E8E4DE] rounded p-3 bg-[#FAFAF8]">
                <summary className="text-sm font-semibold text-[#1A1A1A] cursor-pointer select-none">
                  🇬🇧 English translation (optional — EN page shows UK fallback &amp; gets noindex if empty)
                </summary>
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-[#1A1A1A] mb-1">Title (EN)</label>
                    <input
                      type="text"
                      value={form.title_en}
                      onChange={(e) => setForm((f) => ({ ...f, title_en: e.target.value }))}
                      className="w-full border border-[#E8E4DE] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#C4A882]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#1A1A1A] mb-1">Excerpt (EN)</label>
                    <textarea
                      value={form.excerpt_en}
                      onChange={(e) => setForm((f) => ({ ...f, excerpt_en: e.target.value }))}
                      rows={2}
                      className="w-full border border-[#E8E4DE] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#C4A882] resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#1A1A1A] mb-1">Content (EN)</label>
                    <textarea
                      value={form.content_en}
                      onChange={(e) => setForm((f) => ({ ...f, content_en: e.target.value }))}
                      rows={10}
                      className="w-full border border-[#E8E4DE] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#C4A882] resize-y font-mono"
                    />
                  </div>
                  <p className="text-xs text-[#6B6B6B]">
                    All 3 EN fields (title, excerpt, content) must be filled for the English blog page to be indexed.
                  </p>
                </div>
              </details>

              {/* Reading time + Published */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-[#1A1A1A] mb-1">
                    Час читання (хв)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.reading_time}
                    onChange={(e) => setForm((f) => ({ ...f, reading_time: e.target.value }))}
                    className="w-full border border-[#E8E4DE] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#C4A882]"
                    placeholder="5"
                  />
                </div>
                <div className="flex items-end pb-0.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.published}
                      onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
                      className="w-4 h-4 accent-[#C4A882]"
                    />
                    <span className="text-sm text-[#1A1A1A]">Опублікувати</span>
                  </label>
                </div>
              </div>

              {/* Cover image */}
              <div>
                <label className="block text-xs font-medium text-[#1A1A1A] mb-1">Обкладинка</label>
                {coverPreview ? (
                  <div className="relative rounded overflow-hidden border border-[#E8E4DE] group">
                    <img
                      src={coverPreview}
                      alt="cover"
                      className="w-full h-40 object-cover"
                      style={{ objectPosition: form.cover_position }}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <label className="cursor-pointer bg-white text-[#1A1A1A] text-xs font-medium px-3 py-1.5 rounded hover:bg-[#C4A882] hover:text-white transition-colors">
                        Замінити
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => { setCoverPreview(null); setCoverFile(null); }}
                        className="bg-white text-red-500 text-xs font-medium px-3 py-1.5 rounded hover:bg-red-500 hover:text-white transition-colors"
                      >
                        Видалити
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${dragOver ? "border-[#C4A882] bg-[#C4A882]/5" : "border-[#E8E4DE] hover:border-[#C4A882]"}`}
                  >
                    <label className="cursor-pointer flex flex-col items-center gap-2">
                      <svg className="w-8 h-8 text-[#C4A882]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                      <span className="text-sm text-[#1A1A1A] font-medium">Перетягніть фото сюди</span>
                      <span className="text-xs text-[#6B6B6B]">або натисніть для вибору файлу</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#E8E4DE]">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
              >
                Скасувати
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-[#1A1A1A] text-white px-6 py-2 text-sm font-medium rounded hover:bg-[#C4A882] transition-colors disabled:opacity-50"
              >
                {saving ? "Збереження..." : editPost ? "Зберегти" : "Створити"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
