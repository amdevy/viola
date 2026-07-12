"use client";

import { useEffect, useState, useCallback } from "react";

const STORAGE_KEY = "viola_liked_products_v1";

function readStored(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function writeStored(set: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {
    // ignore
  }
}

export function useProductLike(productId: string, initialCount: number) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const stored = readStored();
    setLiked(stored.has(productId));
  }, [productId]);

  const toggle = useCallback(async () => {
    if (pending) return;
    const next = !liked;
    setPending(true);
    setLiked(next);
    setCount((c) => Math.max(0, c + (next ? 1 : -1)));

    const stored = readStored();
    if (next) stored.add(productId);
    else stored.delete(productId);
    writeStored(stored);

    try {
      const res = await fetch("/api/products/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          action: next ? "like" : "unlike",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (typeof data?.likes_count === "number") {
          setCount(data.likes_count);
        }
      } else {
        // revert optimistic update on failure
        setLiked(!next);
        setCount((c) => Math.max(0, c + (next ? -1 : 1)));
        const reverted = readStored();
        if (next) reverted.delete(productId);
        else reverted.add(productId);
        writeStored(reverted);
      }
    } catch {
      // network failure — keep optimistic state, will reconcile on reload
    } finally {
      setPending(false);
    }
  }, [productId, liked, pending]);

  return { liked, count, toggle, pending };
}
