"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [hovered, setHovered] = useState(false);
  const router = useRouter();
  const { addItem, openCart } = useCart();

  const primaryImage = product.images?.[0]?.trim() || "/placeholder-product.png";
  const secondaryImage = product.images?.[1]?.trim() || primaryImage;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: primaryImage,
      quantity: 1,
      volume: product.volume ?? undefined,
    });
    toast.success(`${product.name} додано до кошика`);
    openCart();
  };

  const discount = product.compare_price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : null;

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(`/shop/${product.slug}`)}
      onKeyDown={(e) => { if (e.key === "Enter") router.push(`/shop/${product.slug}`); }}
      className="group flex flex-col cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image container */}
      <div className="relative aspect-[3/4] overflow-hidden rounded bg-[#F0EDE8] mb-3">
        <Image
          src={hovered ? secondaryImage : primaryImage}
          alt={product.name}
          fill
          className="object-cover transition-all duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          onError={(e) => {
            e.currentTarget.src = "/placeholder-product.png";
          }}
        />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {discount && (
            <span className="bg-[#C4A882] text-white text-[10px] font-bold px-2 py-0.5 rounded">
              -{discount}%
            </span>
          )}
          {!product.in_stock && (
            <span className="bg-[#1A1A1A] text-white text-[10px] font-bold px-2 py-0.5 rounded">
              Немає в наявності
            </span>
          )}
        </div>

        {/* Quick add buttons */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex">
          <button
            onClick={handleAddToCart}
            disabled={!product.in_stock}
            className="flex-1 bg-[#1A1A1A] text-white text-xs font-medium py-3 hover:bg-[#C4A882] transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
          >
            {product.in_stock ? "В кошик" : "Немає"}
          </button>
          <a
            href="https://t.me/violagegedosh"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex-1 bg-[#C4A882] text-white text-xs font-medium py-3 text-center hover:bg-[#b89970] transition-colors uppercase tracking-wider"
          >
            Консультація
          </a>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 flex-1">
        <h3 className="text-sm font-medium text-[#1A1A1A] line-clamp-2 group-hover:text-[#C4A882] transition-colors">
          {product.name}
        </h3>
        {product.volume && (
          <p className="text-xs text-[#6B6B6B]">{product.volume}</p>
        )}
        <div className="flex items-center gap-2 mt-auto pt-1">
          <span className="text-sm font-semibold text-[#1A1A1A]">
            {formatPrice(product.price)}
          </span>
          {product.compare_price && (
            <span className="text-xs text-[#A0A0A0] line-through">
              {formatPrice(product.compare_price)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
