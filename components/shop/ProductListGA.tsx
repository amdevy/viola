"use client";

import { useEffect } from "react";
import { sendGAEvent } from "@next/third-parties/google";
import type { Product } from "@/types";

export default function ProductListGA({
  products,
  listName,
}: {
  products: Product[];
  listName: string;
}) {
  useEffect(() => {
    if (!products.length) return;
    sendGAEvent("event", "view_item_list", {
      item_list_name: listName,
      items: products.slice(0, 20).map((p, idx) => ({
        item_id: p.id,
        item_name: p.name,
        item_category: p.category?.name ?? undefined,
        item_list_name: listName,
        price: p.price,
        index: idx,
      })),
    });
  }, [products, listName]);

  return null;
}
