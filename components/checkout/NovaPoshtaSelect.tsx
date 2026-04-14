"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("checkout");
  const [cityQuery, setCityQuery] = useState("");
  const [cities, setCities] = useState<NovaPoshtaCity[]>([]);
  const [selectedCity, setSelectedCity] = useState<NovaPoshtaCity | null>(null);
  const [warehouses, setWarehouses] = useState<NovaPoshtaWarehouse[]>([]);
  const [warehouseQuery, setWarehouseQuery] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState<NovaPoshtaWarehouse | null>(null);
  const [cityLoading, setCityLoading] = useState(false);
  const [warehouseLoading, setWarehouseLoading] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showWarehouseDropdown, setShowWarehouseDropdown] = useState(false);
  const cityRef = useRef<HTMLDivElement>(null);
  const warehouseRef = useRef<HTMLDivElement>(null);

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
      setWarehouseQuery("");
      return;
    }
    const load = async () => {
      setWarehouseLoading(true);
      const res = await fetch(`/api/nova-poshta?type=warehouses&cityRef=${selectedCity.Ref}`);
      const data = await res.json();
      setWarehouses(data.data ?? []);
      setWarehouseLoading(false);
    };
    load();
  }, [selectedCity]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) {
        setShowCityDropdown(false);
      }
      if (warehouseRef.current && !warehouseRef.current.contains(e.target as Node)) {
        setShowWarehouseDropdown(false);
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
        <label className="text-sm font-medium text-[#1A1A1A]">{t("city")}</label>
        <div className="relative">
          <input
            type="text"
            placeholder={t("cityPlaceholder")}
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
        <div className="flex flex-col gap-1" ref={warehouseRef}>
          <label className="text-sm font-medium text-[#1A1A1A]">{t("warehouse")}</label>
          <div className="relative">
            <input
              type="text"
              placeholder={warehouseLoading ? t("warehouseLoading") : t("warehousePlaceholder")}
              value={selectedWarehouse ? selectedWarehouse.Description : warehouseQuery}
              onChange={(e) => {
                setWarehouseQuery(e.target.value);
                if (selectedWarehouse) {
                  setSelectedWarehouse(null);
                  onWarehouseChange(null);
                }
                setShowWarehouseDropdown(true);
              }}
              onFocus={() => !selectedWarehouse && setShowWarehouseDropdown(true)}
              readOnly={warehouseLoading}
              className={`w-full px-4 py-3 text-sm border rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#C4A882] transition-colors ${
                warehouseError ? "border-[#E53E3E]" : "border-[#E8E4DE]"
              }`}
            />
            {warehouseLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-[#C4A882] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {selectedWarehouse && (
              <button
                type="button"
                onClick={() => {
                  setSelectedWarehouse(null);
                  setWarehouseQuery("");
                  onWarehouseChange(null);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B6B] hover:text-[#1A1A1A]"
              >
                ✕
              </button>
            )}

            {showWarehouseDropdown && !selectedWarehouse && warehouses.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-[#E8E4DE] rounded shadow-lg z-20 max-h-60 overflow-y-auto">
                {warehouses
                  .filter((wh) =>
                    warehouseQuery.length === 0 ||
                    wh.Description.toLowerCase().includes(warehouseQuery.toLowerCase())
                  )
                  .map((wh) => (
                    <button
                      key={wh.Ref}
                      type="button"
                      onClick={() => {
                        selectWarehouse(wh);
                        setWarehouseQuery("");
                        setShowWarehouseDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-[#1A1A1A] hover:bg-[#F0EDE8] transition-colors"
                    >
                      {wh.Description}
                    </button>
                  ))}
              </div>
            )}
          </div>
          {warehouseError && <p className="text-xs text-[#E53E3E]">{warehouseError}</p>}
        </div>
      )}
    </div>
  );
}
