"use client";

import { useState } from "react";
import Image from "next/image";

interface ProductGalleryProps {
  images: string[];
  name: string;
}

export default function ProductGallery({ images, name }: ProductGalleryProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  const safeImages = images?.length ? images : ["/placeholder-product.jpg"];
  const active = safeImages[activeIdx];

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div
        className="relative aspect-square rounded overflow-hidden bg-[#F0EDE8] cursor-zoom-in"
        onClick={() => setZoomed(!zoomed)}
      >
        <Image
          src={active}
          alt={`${name} — фото ${activeIdx + 1}`}
          fill
          className={`object-cover transition-transform duration-500 ${
            zoomed ? "scale-150" : "scale-100"
          }`}
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>

      {/* Thumbnails */}
      {safeImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {safeImages.map((img, i) => (
            <button
              key={i}
              onClick={() => {
                setActiveIdx(i);
                setZoomed(false);
              }}
              className={`relative flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-colors ${
                activeIdx === i
                  ? "border-[#C4A882]"
                  : "border-transparent hover:border-[#E8E4DE]"
              }`}
            >
              <Image
                src={img}
                alt={`${name} — мініатюра ${i + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
