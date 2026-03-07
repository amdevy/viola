"use client";

import { useState, useEffect, useRef } from "react";
import type { NovaPoshtaCity, NovaPoshtaWarehouse } from "@/types";

interface NovaPoshtaSelectProps {
  onCityChange: (city: NovaPoshtaCity | null) => void;
  onWarehouseChange: (warehouse: NovaPoshtaWarehouse | null) => void;
  cityError?: string;
  warehouseError?: string;
}

export default function NovaPoshtaSelect({
  onCityChange,
  onWarehouseChange,
  cityError,
  warehouseError,
}: NovaPoshtaSelectProps) {
  const [cityQuery, setCityQuery] = useState("");
  const [cities, setCities] = useState<NovaPoshtaCity[]>([]);
  const [selectedCity, setSelectedCity] = useState<NovaPoshtaCity | null>(null);
  const [warehouses, setWarehouses] = useState<NovaPoshtaWarehouse[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<NovaPoshtaWarehouse | null>(null);
  const [cityLoading, setCityLoading] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const cityRef = useRef<HTMLDivElement>(null);

  // Search cities
  useEffect(() => {
    if (cityQuery.length < 2) {
      setCities([]);
      return;
    }
    const timer = setTimeout(async () => {
      setCityLoading(true);
      const res = await fetch(`/api/nova-poshta?type=cities&query=${encodeURIComponent(cityQuery)}`);
      const data = await res.json();
      setCities(data.data ?? []);
      setShowCityDropdown(true);
      setCityLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [cityQuery]);

  // Load warehouses when city selected
  useEffect(() => {
    if (!selectedCity) {
      setWarehouses([]);
      return;
    }
    const load = async () => {
      const res = await fetch(`/api/nova-poshta?type=warehouses&cityRef=${selectedCity.Ref}`);
      const data = await res.json();
      setWarehouses(data.data ?? []);
    };
    load();
  }, [selectedCity]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) {
        setShowCityDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectCity = (city: NovaPoshtaCity) => {
    setSelectedCity(city);
    setCityQuery(city.Description);
    setShowCityDropdown(false);
    setSelectedWarehouse(null);
    onCityChange(city);
    onWarehouseChange(null);
  };

  const selectWarehouse = (wh: NovaPoshtaWarehouse) => {
    setSelectedWarehouse(wh);
    onWarehouseChange(wh);
  };

  return (
    <div className="space-y-4">
      {/* City */}
      <div className="flex flex-col gap-1" ref={cityRef}>
        <label className="text-sm font-medium text-[#1A1A1A]">Місто</label>
        <div className="relative">
          <input
            type="text"
            placeholder="Введіть назву міста..."
            value={cityQuery}
            onChange={(e) => {
              setCityQuery(e.target.value);
              if (selectedCity && e.target.value !== selectedCity.Description) {
                setSelectedCity(null);
                onCityChange(null);
              }
            }}
            onFocus={() => cities.length > 0 && setShowCityDropdown(true)}
            className={`w-full px-4 py-3 text-sm border rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#C4A882] transition-colors ${
              cityError ? "border-[#E53E3E]" : "border-[#E8E4DE]"
            }`}
          />
          {cityLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-[#C4A882] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {showCityDropdown && cities.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border border-[#E8E4DE] rounded shadow-lg z-20 max-h-48 overflow-y-auto">
              {cities.map((city) => (
                <button
                  key={city.Ref}
                  type="button"
                  onClick={() => selectCity(city)}
                  className="w-full text-left px-4 py-2.5 text-sm text-[#1A1A1A] hover:bg-[#F0EDE8] transition-colors"
                >
                  {city.Description}
                  {city.AreaDescription && (
                    <span className="text-[#6B6B6B] ml-1">({city.AreaDescription})</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        {cityError && <p className="text-xs text-[#E53E3E]">{cityError}</p>}
      </div>

      {/* Warehouse */}
      {selectedCity && (
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[#1A1A1A]">Відділення Нової Пошти</label>
          <select
            value={selectedWarehouse?.Ref ?? ""}
            onChange={(e) => {
              const wh = warehouses.find((w) => w.Ref === e.target.value) ?? null;
              selectWarehouse(wh as NovaPoshtaWarehouse);
            }}
            className={`w-full px-4 py-3 text-sm border rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#C4A882] transition-colors ${
              warehouseError ? "border-[#E53E3E]" : "border-[#E8E4DE]"
            }`}
          >
            <option value="">Оберіть відділення...</option>
            {warehouses.map((wh) => (
              <option key={wh.Ref} value={wh.Ref}>
                {wh.Description}
              </option>
            ))}
          </select>
          {warehouseError && <p className="text-xs text-[#E53E3E]">{warehouseError}</p>}
        </div>
      )}
    </div>
  );
}
