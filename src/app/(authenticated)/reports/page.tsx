"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/context/user-context";
import { useRouter } from "next/navigation";
import { formatQty } from "@/lib/unit-utils";
import type { InventoryLevel } from "@/lib/database.types";

export default function ReportsPage() {
  const { isOwner } = useUser();
  const router = useRouter();
  const [inventory, setInventory] = useState<InventoryLevel[]>([]);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);

  useEffect(() => {
    if (!isOwner) {
      router.push("/dashboard");
      return;
    }
    const supabase = createClient();
    supabase
      .from("inventory_levels")
      .select("*")
      .eq("location_type", "warehouse")
      .then(({ data }) => {
        if (data) setInventory(data);
      });
  }, [isOwner, router]);

  const lowStock = inventory.filter((i) => i.on_hand <= i.reorder_point);

  async function handleSendReport() {
    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch("/api/weekly-report", {
        method: "POST",
        headers: { "x-cron-secret": "trigger-from-ui" },
      });
      const data = await res.json();
      if (data.success) {
        setSendResult("Report sent successfully!");
      } else {
        setSendResult(`Error: ${data.error}`);
      }
    } catch (err) {
      setSendResult("Failed to send report");
    }
    setSending(false);
  }

  if (!isOwner) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-gray-500 mt-1">Inventory overview and alerts</p>
        </div>
        <button
          onClick={handleSendReport}
          disabled={sending}
          className="px-4 py-2.5 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 disabled:opacity-50"
        >
          {sending ? "Sending..." : "Send Report Now"}
        </button>
      </div>

      {sendResult && (
        <div
          className={`px-4 py-3 rounded-xl text-sm ${
            sendResult.startsWith("Error")
              ? "bg-danger-50 text-danger-700"
              : "bg-success-50 text-success-600"
          }`}
        >
          {sendResult}
        </div>
      )}

      {/* Low Stock Alerts */}
      <div>
        <h2 className="text-lg font-semibold mb-3">
          Low Stock Alerts
          {lowStock.length > 0 && (
            <span className="ml-2 px-2 py-0.5 text-sm bg-danger-100 text-danger-700 rounded-full">
              {lowStock.length}
            </span>
          )}
        </h2>
        {lowStock.length > 0 ? (
          <div className="bg-white rounded-xl border border-danger-200 divide-y divide-gray-100">
            {lowStock.map((item) => (
              <div key={item.item_id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">{item.item_name}</div>
                  <div className="text-sm text-gray-500">{item.sku}</div>
                </div>
                <div className="text-right">
                  <div className="text-danger-700 font-bold">
                    {formatQty(item.on_hand, item.base_unit, item.pcs_per_box, item.unit)}
                  </div>
                  <div className="text-xs text-gray-400">
                    Reorder at {formatQty(item.reorder_point, item.base_unit, item.pcs_per_box, item.unit)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-success-50 text-success-600 px-4 py-3 rounded-xl text-sm">
            All stock levels are above reorder points.
          </div>
        )}
      </div>

      {/* Full Warehouse Inventory */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Warehouse Inventory</h2>
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {inventory.map((item) => (
            <div key={item.item_id} className="p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  {item.is_favorite && <span className="text-yellow-500">★</span>}
                  <span className="font-medium">{item.item_name}</span>
                </div>
                <div className="text-sm text-gray-500">
                  {item.sku} · {item.category}
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`font-mono font-semibold ${
                    item.on_hand <= item.reorder_point
                      ? "text-danger-700"
                      : ""
                  }`}
                >
                  {formatQty(item.on_hand, item.base_unit, item.pcs_per_box, item.unit)}
                </div>
                <div className="text-xs text-gray-400">
                  Target: {formatQty(item.target_stock, item.base_unit, item.pcs_per_box, item.unit)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
