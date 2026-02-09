"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createAdjustment } from "@/app/(authenticated)/transactions/actions";
import { UnitToggle } from "@/components/unit-toggle";
import { toPcs } from "@/lib/unit-utils";
import type { Location, Item } from "@/lib/database.types";

export default function AdjustPage() {
  const router = useRouter();
  const [locations, setLocations] = useState<Location[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedItem, setSelectedItem] = useState("");
  const [qty, setQty] = useState(1);
  const [inputUnit, setInputUnit] = useState<"boxes" | "pcs">("pcs");
  const [direction, setDirection] = useState<"add" | "remove">("remove");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("locations").select("*").eq("is_active", true),
      supabase.from("items").select("*").eq("is_active", true).order("name"),
    ]).then(([locRes, itemRes]) => {
      if (locRes.data) setLocations(locRes.data);
      if (itemRes.data) setItems(itemRes.data);
    });
  }, []);

  const selectedItemData = items.find((i) => i.id === selectedItem);
  const pcsQty = selectedItemData
    ? toPcs(qty, inputUnit, selectedItemData.pcs_per_box)
    : qty;
  const showConversion =
    selectedItemData && inputUnit === "boxes" && selectedItemData.pcs_per_box > 1;

  function handleItemChange(itemId: string) {
    setSelectedItem(itemId);
    const item = items.find((i) => i.id === itemId);
    if (item) {
      setInputUnit(item.base_unit);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLocation || !selectedItem || !reason.trim()) return;

    setLoading(true);
    setError(null);

    const result = await createAdjustment({
      locationId: selectedLocation,
      itemId: selectedItem,
      qty: pcsQty,
      direction,
      reason: reason.trim(),
    });

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-6">
        <div className="text-6xl">✅</div>
        <h2 className="text-2xl font-bold">Adjustment Recorded!</h2>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setSuccess(false);
              setSelectedLocation("");
              setSelectedItem("");
              setQty(1);
              setInputUnit("pcs");
              setDirection("remove");
              setReason("");
            }}
            className="px-6 py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700"
          >
            Record Another
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200"
          >
            Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Adjust Stock</h1>
        <p className="text-gray-500 mt-1">
          Correct counts, record waste, breakage, or samples
        </p>
      </div>

      {error && (
        <div className="bg-danger-50 text-danger-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            <option value="">Select location...</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Item
          </label>
          <select
            value={selectedItem}
            onChange={(e) => handleItemChange(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            <option value="">Select item...</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name} ({i.sku})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Direction
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDirection("add")}
              className={`p-4 rounded-xl border-2 font-medium transition-colors ${
                direction === "add"
                  ? "border-green-500 bg-green-50 text-green-700"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              + Add Stock
            </button>
            <button
              type="button"
              onClick={() => setDirection("remove")}
              className={`p-4 rounded-xl border-2 font-medium transition-colors ${
                direction === "remove"
                  ? "border-danger-500 bg-danger-50 text-danger-700"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              - Remove Stock
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quantity
          </label>
          <div className="flex items-center gap-3">
            {selectedItemData && (
              <UnitToggle
                value={inputUnit}
                onChange={setInputUnit}
                pcsPerBox={selectedItemData.pcs_per_box}
              />
            )}
            <input
              type="number"
              value={qty}
              onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
              min={1}
              required
              className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          {showConversion && (
            <p className="text-xs text-gray-400 mt-1">
              = {pcsQty} pcs
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reason <span className="text-danger-500">*</span>
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            placeholder="e.g. Damaged in transit, count correction, samples"
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !selectedLocation || !selectedItem || !reason.trim()}
          className="w-full py-3 bg-amber-600 text-white font-semibold rounded-xl hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Submitting..." : "Record Adjustment"}
        </button>
      </form>
    </div>
  );
}
