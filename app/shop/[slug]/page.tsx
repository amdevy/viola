import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProductGallery from "@/components/shop/ProductGallery";
import ProductCard from "@/components/shop/ProductCard";
import AddToCartButton from "./AddToCartButton";
import { formatPrice, HAIR_TYPES } from "@/lib/utils";
import type { Product } from "@/types";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getProduct(slug: string): Promise<Product | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*, category:categories(id,name,slug)")
    .eq("slug", slug)
    .single();
  return (data as Product) ?? null;
}

async function getRelated(product: Product): Promise<Product[]> {
  if (!product.category_id) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*, category:categories(id,name,slug)")
    .eq("category_id", product.category_id)
    .neq("id", product.id)
    .eq("in_stock", true)
    .limit(4);
  return (data as Product[]) ?? [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Товар не знайдено" };

  return {
    title: product.name,
    description: product.description ?? `Купити ${product.name} з доставкою по Україні`,
    openGraph: {
      title: product.name,
      description: product.description ?? "",
      images: product.images?.[0] ? [{ url: product.images[0] }] : [],
    },
  };
}

const TABS = [
  { id: "description", label: "Опис" },
  { id: "ingredients", label: "Склад" },
  { id: "how_to_use", label: "Застосування" },
];

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const related = await getRelated(product);
  const hairTypeLabels = HAIR_TYPES.filter((h) =>
    product.hair_type?.includes(h.value)
  ).map((h) => h.label);

  const discount = product.compare_price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "UAH",
      availability: product.in_stock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="text-xs text-[#6B6B6B] mb-8 flex items-center gap-2">
          <a href="/" className="hover:text-[#C4A882]">Головна</a>
          <span>/</span>
          <a href="/shop" className="hover:text-[#C4A882]">Магазин</a>
          {product.category && (
            <>
              <span>/</span>
              <a href={`/shop?category=${product.category.slug}`} className="hover:text-[#C4A882]">
                {product.category.name}
              </a>
            </>
          )}
          <span>/</span>
          <span className="text-[#1A1A1A]">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Gallery */}
          <ProductGallery images={product.images ?? []} name={product.name} />

          {/* Details */}
          <div>
            {product.category && (
              <p className="text-[#C4A882] text-xs uppercase tracking-widest mb-2">
                {product.category.name}
              </p>
            )}
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-2">
              {product.name}
            </h1>

            {product.volume && (
              <p className="text-sm text-[#6B6B6B] mb-4">{product.volume}</p>
            )}

            {/* Price */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl font-bold text-[#1A1A1A]">
                {formatPrice(product.price)}
              </span>
              {product.compare_price && (
                <span className="text-base text-[#A0A0A0] line-through">
                  {formatPrice(product.compare_price)}
                </span>
              )}
              {discount && (
                <span className="bg-[#C4A882] text-white text-xs font-bold px-2 py-1 rounded">
                  -{discount}%
                </span>
              )}
            </div>

            {/* Hair types */}
            {hairTypeLabels.length > 0 && (
              <div className="mb-6">
                <p className="text-xs uppercase tracking-widest text-[#6B6B6B] mb-2">
                  Підходить для
                </p>
                <div className="flex flex-wrap gap-2">
                  {hairTypeLabels.map((label) => (
                    <span
                      key={label}
                      className="bg-[#F0EDE8] text-[#1A1A1A] text-xs px-3 py-1.5 rounded"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Manufacturer */}
            <p className="text-sm text-[#6B6B6B] mb-6">
              Виробник: <span className="font-semibold text-[#1A1A1A]">Na Gólov[y]</span>
            </p>

            {/* Add to cart */}
            <AddToCartButton product={product} />

            {/* Trust badges */}
            <div className="mt-6 pt-6 border-t border-[#E8E4DE] grid grid-cols-3 gap-4 text-center">
              {[
                { icon: "🚚", text: "Доставка\nНова Пошта" },
                { icon: "📦", text: "Відправляємо\nза 1–3 дні" },
                { icon: "✓", text: "Оригінальна\nпродукція" },
              ].map((b) => (
                <div key={b.text}>
                  <div className="text-lg mb-1">{b.icon}</div>
                  <p className="text-xs text-[#6B6B6B] whitespace-pre-line">{b.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-16">
          <ProductTabs product={product} />
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="font-serif text-2xl font-bold text-[#1A1A1A] mb-8">
              Схожі товари
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

function ProductTabs({ product }: { product: Product }) {
  const tabs = [
    { id: "description", label: "Опис", content: product.description },
    { id: "ingredients", label: "Склад", content: product.ingredients },
    { id: "how_to_use", label: "Застосування", content: product.how_to_use },
  ].filter((t) => t.content);

  if (tabs.length === 0) return null;

  return (
    <div>
      <div className="border-b border-[#E8E4DE]">
        <div className="flex gap-8" id="product-tabs">
          {tabs.map((tab, i) => (
            <a
              key={tab.id}
              href={`#tab-${tab.id}`}
              className={`text-sm font-medium py-3 border-b-2 -mb-px transition-colors ${
                i === 0
                  ? "border-[#1A1A1A] text-[#1A1A1A]"
                  : "border-transparent text-[#6B6B6B] hover:text-[#1A1A1A]"
              }`}
            >
              {tab.label}
            </a>
          ))}
        </div>
      </div>
      <div className="py-6 prose prose-sm max-w-none text-[#1A1A1A]">
        {tabs[0]?.content && (
          <p className="text-[#6B6B6B] leading-relaxed whitespace-pre-line">
            {tabs[0].content}
          </p>
        )}
      </div>
    </div>
  );
}
