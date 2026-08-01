"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Order } from "@/types";

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("orders")
      .select("*, customer:customers(*), order_items(*, product:products(*))")
      .order("created_at", { ascending: false });

    if (error) setError(error.message);
    else setOrders(data as Order[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const supabase = createClient();
    // .select() so a row count can be asserted: an update blocked by RLS
    // affects zero rows and returns NO error, which would otherwise be reported
    // to the operator as a successful status change.
    const { data, error: updateError } = await supabase
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id");

    const error =
      updateError ?? (data?.length === 1 ? null : { message: "not_permitted_or_missing" });

    if (!error) {
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: status as Order["status"] } : o))
      );
    }
    return { error };
  };

  return { orders, loading, error, updateStatus, refetch: fetchOrders };
}
