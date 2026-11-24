"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import type { NovaPoshtaCity, NovaPoshtaWarehouse } from "@/types";

interface NovaPoshtaSelectProps {
  onCityChange: (city: NovaPoshtaCity | null) => void;
  onWarehouseChange: (warehouse: NovaPoshtaWarehouse | null) => void;
  cityError?: string;
  warehouseError?: string;
  /**
   * A city and branch to start from (the checkout draft restored after the
   * shopper came back to the form). Read once, on mount: the parent remounts
   * this component (key) to apply a different start. The parent's form already
   * holds the same values, so nothing is reported back through the callbacks.
   */
  initialCity?: { Ref: string; Description: string } | null;
  initialWarehouse?: { Ref: string; Description: string } | null;
}

export default function NovaPoshtaSelect({
  onCityChange,
  onWarehouseChange,
  cityError,
  warehouseError,
  initialCity = null,
  initialWarehouse = null,
}: NovaPoshtaSelectProps) {
  const t = useTranslations("checkout");
  const [cityQuery, setCityQuery] = useState(initialCity?.Description ?? "");
  const [cities, setCities] = useState<NovaPoshtaCity[]>([]);
  const [selectedCity, setSelectedCity] = useState<NovaPoshtaCity | null>(() =>
    initialCity
      ? { Ref: initialCity.Ref, Description: initialCity.Description, DescriptionRu: "", AreaDescription: "" }
      : null,
  );
  const [warehouses, setWarehouses] = useState<NovaPoshtaWarehouse[]>([]);
  const [warehouseQuery, setWarehouseQuery] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState<NovaPoshtaWarehouse | null>(() =>
    initialCity && initialWarehouse
      ? {
          Ref: initialWarehouse.Ref,
          Description: initialWarehouse.Description,
          Number: "",
          CityRef: initialCity.Ref,
          CityDescription: initialCity.Description,
        }
      : null,
  );
  const [cityLoading, setCityLoading] = useState(false);
  const [warehouseLoading, setWarehouseLoading] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showWarehouseDropdown, setShowWarehouseDropdown] = useState(false);
  const cityRef = useRef<HTMLDivElement>(null);
  const warehouseRef = useRef<HTMLDivElement>(null);
  const commitCityRef = useRef<() => void>(() => {});

  // Search cities
  useEffect(() => {
    // Matches the minimum the API enforces — below it the route returns an
    // empty list, so a shorter query would only render an empty dropdown.
    if (cityQuery.length < 3) {
      setCities([]);
      return;
    }
    // The field shows a chosen city (picked from the list, or restored from
    // the draft): nothing to search, and the list must not pop open again
    // 400 ms later. Typing changes the text and clears the choice, so a real
    // edit still searches.
    if (selectedCity && cityQuery === selectedCity.Description) return;
    const timer = setTimeout(async () => {
      setCityLoading(true);
      const res = await fetch(`/api/nova-poshta?type=cities&query=${encodeURIComponent(cityQuery)}`);
      const data = await res.json();
      setCities(data.data ?? []);
      setShowCityDropdown(true);
      setCityLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [cityQuery, selectedCity]);

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
        commitCityRef.current();
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

  // Якщо юзер надрукував місто, але не клікнув у списку — вибираємо збіг за нього
  useEffect(() => {
    commitCityRef.current = () => {
      if (selectedCity || cities.length === 0) return;
      const q = cityQuery.trim().toLowerCase();
      const exact = cities.find((c) => c.Description.toLowerCase() === q);
      const pick = exact ?? (cities.length === 1 ? cities[0] : null);
      if (pick) selectCity(pick);
    };
  });

  return (
    <div className="space-y-4">
      {/* City */}
      <div className="flex flex-col gap-1" ref={cityRef}>
        <label className="text-sm font-medium text-foreground">{t("city")}</label>
        <div className="relative">
          <input
            type="text"
            autoComplete="off"
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
            onBlur={() => commitCityRef.current()}
            className={`w-full px-4 py-3 text-sm border rounded bg-surface focus:outline-none focus:ring-2 focus:ring-accent transition-colors ${
              cityError ? "border-error" : "border-border"
            }`}
          />
          {cityLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {showCityDropdown && cities.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-surface border border-border rounded shadow-lg z-20 max-h-48 overflow-y-auto">
              {cities.map((city) => (
                <button
                  key={city.Ref}
                  type="button"
                  onClick={() => selectCity(city)}
                  className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-panel transition-colors"
                >
                  {city.Description}
                  {city.AreaDescription && (
                    <span className="text-muted ml-1">({city.AreaDescription})</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        {cityError && <p className="text-xs text-error">{cityError}</p>}
      </div>

      {/* Warehouse — видиме завжди, щоб юзер бачив другий крок доставки */}
      <div className="flex flex-col gap-1" ref={warehouseRef}>
        <label className="text-sm font-medium text-foreground">{t("warehouse")}</label>
        <div className="relative">
          <input
            type="text"
            autoComplete="off"
            disabled={!selectedCity}
            placeholder={
              !selectedCity
                ? t("warehouseSelectCityFirst")
                : warehouseLoading
                ? t("warehouseLoading")
                : t("warehousePlaceholder")
            }
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
              className={`w-full px-4 py-3 text-sm border rounded bg-surface focus:outline-none focus:ring-2 focus:ring-accent transition-colors disabled:bg-[#F7F5F2] dark:disabled:bg-panel disabled:cursor-not-allowed ${
                warehouseError ? "border-error" : "border-border"
              }`}
            />
            {warehouseLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
              >
                ✕
              </button>
            )}

            {showWarehouseDropdown && !selectedWarehouse && warehouses.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-surface border border-border rounded shadow-lg z-20 max-h-60 overflow-y-auto">
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
                      className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-panel transition-colors"
                    >
                      {wh.Description}
                    </button>
                  ))}
              </div>
            )}
          </div>
          {warehouseError && <p className="text-xs text-error">{warehouseError}</p>}
        </div>
    </div>
  );
}
