"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Item } from "@/lib/database.types";

export function ItemForm({
  item,
  onSubmit,
}: {
  item?: Item;
  onSubmit: (formData: FormData) => Promise<{ error?: string; success?: boolean }>;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [baseUnit, setBaseUnit] = useState<"boxes" | "pcs">(
    item?.base_unit ?? "boxes"
  );
  const [pcsPerBox, setPcsPerBox] = useState(item?.pcs_per_box ?? 1);

  const LOOSE_UNIT_OPTIONS = [
    "pcs",
    "bottles",
    "bags",
    "tubs",
    "tubes",
    "cups",
    "rolls",
    "packs",
  ];
  const showLooseUnit = baseUnit === "boxes" && pcsPerBox > 1;

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await onSubmit(formData);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/items");
      router.refresh();
    }
  }

  return (
    <form action={handleSubmit} className="space-y-5 max-w-lg">
      {error && (
        <div className="bg-danger-50 text-danger-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          SKU <span className="text-danger-500">*</span>
        </label>
        <input
          name="sku"
          required
          defaultValue={item?.sku}
          placeholder="e.g. YOG-VAN"
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Name <span className="text-danger-500">*</span>
        </label>
        <input
          name="name"
          required
          defaultValue={item?.name}
          placeholder="e.g. Vanilla Yogurt Base"
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Category
        </label>
        <input
          name="category"
          defaultValue={item?.category ?? ""}
          placeholder="e.g. Yogurt Base"
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Base Unit
          </label>
          <select
            name="base_unit"
            value={baseUnit}
            onChange={(e) => setBaseUnit(e.target.value as "boxes" | "pcs")}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="boxes">Boxes</option>
            <option value="pcs">Pieces (pcs)</option>
          </select>
          <p className="text-xs text-gray-400 mt-1">
            How this item is counted in inventory
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pcs per Box
          </label>
          <input
            name="pcs_per_box"
            type="number"
            min={1}
            value={pcsPerBox}
            onChange={(e) =>
              setPcsPerBox(parseInt(e.target.value) || 1)
            }
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <p className="text-xs text-gray-400 mt-1">
            How many individual pieces come in one box
          </p>
        </div>
      </div>

      {showLooseUnit && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Loose Unit
          </label>
          <select
            name="unit"
            defaultValue={item?.unit ?? "pcs"}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {LOOSE_UNIT_OPTIONS.map((u) => (
              <option key={u} value={u}>
                {u.charAt(0).toUpperCase() + u.slice(1)}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">
            What each piece is called (e.g., bottles, bags)
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reorder Point
          </label>
          <input
            name="reorder_point"
            type="number"
            min={0}
            step="0.5"
            defaultValue={item?.reorder_point ?? 0}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <p className="text-xs text-gray-400 mt-1">
            Flag as LOW when warehouse stock falls to this level
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Target Stock
          </label>
          <input
            name="target_stock"
            type="number"
            min={0}
            step="0.5"
            defaultValue={item?.target_stock ?? 0}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <p className="text-xs text-gray-400 mt-1">
            Ideal warehouse stock level
          </p>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : item ? "Update Item" : "Add Item"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
