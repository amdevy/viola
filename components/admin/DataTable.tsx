"use client";

import { ReactNode } from "react";
import { Skeleton } from "@/components/ui/Skeleton";

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  keyExtractor: (row: T) => string;
}

export default function DataTable<T>({
  columns,
  data,
  loading,
  emptyMessage = "Дані відсутні",
  keyExtractor,
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded border border-[#E8E4DE]">
      <table className="w-full text-sm">
        <thead className="bg-[#F0EDE8]">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-left text-xs uppercase tracking-wider text-[#6B6B6B] font-medium ${col.className ?? ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-[#E8E4DE]">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <Skeleton className="h-4 w-full" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-10 text-center text-[#6B6B6B]"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={keyExtractor(row)}
                className="hover:bg-[#FAFAF8] transition-colors"
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3 ${col.className ?? ""}`}>
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
