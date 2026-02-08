"use client";

import type { Item } from "@/lib/database.types";
import { QuantityInput } from "./quantity-input";

type CartItem = {
  item: Item;
  qty: number;
};

export function ItemCart({
  cartItems,
  onUpdateQty,
  onRemove,
}: {
  cartItems: CartItem[];
  onUpdateQty: (itemId: string, qty: number) => void;
  onRemove: (itemId: string) => void;
}) {
  return (
    <div className="space-y-3">
      {cartItems.map(({ item, qty }) => (
        <div
          key={item.id}
          className="p-4 bg-white rounded-xl border border-gray-200 flex items-center justify-between gap-3"
        >
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{item.name}</div>
            <div className="text-sm text-gray-500">
              {item.sku} · {item.unit}
            </div>
          </div>
          <QuantityInput
            value={qty}
            onChange={(val) => onUpdateQty(item.id, val)}
          />
          <button
            onClick={() => onRemove(item.id)}
            className="p-2 text-gray-400 hover:text-danger-600 transition-colors"
            aria-label={`Remove ${item.name}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      ))}

      {cartItems.length === 0 && (
        <p className="text-center text-gray-400 py-4">No items added yet</p>
      )}
    </div>
  );
}
