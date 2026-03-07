import ProductCard from "./ProductCard";
import { ProductGridSkeleton } from "@/components/ui/Skeleton";
import type { Product } from "@/types";

interface ProductGridProps {
  products: Product[];
  loading?: boolean;
}

export default function ProductGrid({ products, loading }: ProductGridProps) {
  if (loading) return <ProductGridSkeleton count={6} />;

  if (!products.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <svg className="w-12 h-12 text-[#C4A882] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <p className="text-[#1A1A1A] font-medium">Товарів не знайдено</p>
        <p className="text-sm text-[#6B6B6B] mt-1">Спробуйте змінити фільтри</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
