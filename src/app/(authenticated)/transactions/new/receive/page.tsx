"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LocationPicker } from "@/components/location-picker";
import { ItemPicker } from "@/components/item-picker";
import { ItemCart } from "@/components/item-cart";
import { createReceive } from "@/app/(authenticated)/transactions/actions";
import type { Location, Item } from "@/lib/database.types";

type Step = "location" | "items" | "quantities" | "review";

export default function ReceivePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("location");
  const [locations, setLocations] = useState<Location[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [quantities, setQuantities] = useState<Map<string, number>>(new Map());
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("locations").select("*").eq("is_active", true),
      supabase.from("items").select("*").eq("is_active", true),
    ]).then(([locRes, itemRes]) => {
      if (locRes.data) setLocations(locRes.data);
      if (itemRes.data) setItems(itemRes.data);
    });
  }, []);

  const selectedLocationName = locations.find((l) => l.id === selectedLocation)?.name;

  const cartItems = Array.from(selectedItemIds)
    .map((id) => {
      const item = items.find((i) => i.id === id);
      if (!item) return null;
      return { item, qty: quantities.get(id) ?? 1 };
    })
    .filter(Boolean) as Array<{ item: Item; qty: number }>;

  function handleToggleItem(itemId: string) {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
        quantities.delete(itemId);
      } else {
        next.add(itemId);
        quantities.set(itemId, 1);
      }
      return next;
    });
  }

  function handleUpdateQty(itemId: string, qty: number) {
    setQuantities((prev) => new Map(prev).set(itemId, qty));
  }

  function handleRemove(itemId: string) {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
    setQuantities((prev) => {
      const next = new Map(prev);
      next.delete(itemId);
      return next;
    });
  }

  async function handleSubmit() {
    if (!selectedLocation || cartItems.length === 0) return;

    setLoading(true);
    setError(null);

    const result = await createReceive({
      toLocationId: selectedLocation,
      items: cartItems.map((ci) => ({ itemId: ci.item.id, qty: ci.qty })),
      note: note || undefined,
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
        <h2 className="text-2xl font-bold">Stock Received!</h2>
        <p className="text-gray-500">
          {cartItems.length} item{cartItems.length !== 1 ? "s" : ""} received at{" "}
          {selectedLocationName}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setSuccess(false);
              setStep("location");
              setSelectedLocation(null);
              setSelectedItemIds(new Set());
              setQuantities(new Map());
              setNote("");
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
        <h1 className="text-2xl font-bold">Receive Stock</h1>
        <p className="text-gray-500 mt-1">Record incoming inventory</p>
      </div>

      <div className="flex gap-2">
        {(["location", "items", "quantities", "review"] as Step[]).map((s, i) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full ${
              (["location", "items", "quantities", "review"] as Step[]).indexOf(step) >= i
                ? "bg-green-500"
                : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      {error && (
        <div className="bg-danger-50 text-danger-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {step === "location" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Where is the stock being received?</h2>
          <LocationPicker
            locations={locations}
            selected={selectedLocation}
            onSelect={(id) => {
              setSelectedLocation(id);
              setStep("items");
            }}
          />
        </div>
      )}

      {step === "items" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Select items for {selectedLocationName}
            </h2>
            <button onClick={() => setStep("location")} className="text-sm text-brand-600 font-medium">
              Change location
            </button>
          </div>
          <ItemPicker items={items} selectedIds={selectedItemIds} onToggle={handleToggleItem} />
          {selectedItemIds.size > 0 && (
            <button
              onClick={() => setStep("quantities")}
              className="w-full py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700"
            >
              Set Quantities ({selectedItemIds.size} items)
            </button>
          )}
        </div>
      )}

      {step === "quantities" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Set quantities</h2>
            <button onClick={() => setStep("items")} className="text-sm text-brand-600 font-medium">
              Add more items
            </button>
          </div>
          <ItemCart cartItems={cartItems} onUpdateQty={handleUpdateQty} onRemove={handleRemove} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Supplier delivery #123"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <button
            onClick={() => setStep("review")}
            className="w-full py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700"
          >
            Review
          </button>
        </div>
      )}

      {step === "review" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Review & Confirm</h2>
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Receiving at</span>
              <span className="font-medium">{selectedLocationName}</span>
            </div>
            {note && (
              <div className="flex justify-between">
                <span className="text-gray-500">Note</span>
                <span className="font-medium">{note}</span>
              </div>
            )}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {cartItems.map(({ item, qty }) => (
              <div key={item.id} className="px-4 py-3 flex justify-between">
                <span>{item.name}</span>
                <span className="font-semibold">{qty} {item.unit}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep("quantities")} className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200">
              Back
            </button>
            <button onClick={handleSubmit} disabled={loading} className="flex-1 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50">
              {loading ? "Submitting..." : "Confirm Receipt"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
