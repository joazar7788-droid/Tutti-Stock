import { createClient } from "@/lib/supabase/server";
import { DeliveriesFilters } from "@/components/deliveries-filters";
import {
  DeliveriesSummary,
  type AggregatedDelivery,
} from "@/components/deliveries-summary";
import {
  DeliveriesList,
  type DeliveryTransaction,
} from "@/components/deliveries-list";

export default async function DeliveriesPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  // Get warehouse ID
  const { data: warehouse } = await supabase
    .from("locations")
    .select("id")
    .eq("type", "warehouse")
    .single();

  // Get branches for filter dropdown
  const { data: branches } = await supabase
    .from("locations")
    .select("id, name")
    .eq("type", "branch")
    .eq("is_active", true)
    .order("name");

  // Fetch TRANSFER transactions from warehouse
  let query = supabase
    .from("transactions")
    .select("id, created_at, item_id, to_location_id, qty, note")
    .eq("transaction_type", "TRANSFER")
    .order("created_at", { ascending: false });

  if (warehouse) {
    query = query.eq("from_location_id", warehouse.id);
  }
  if (params.branch) {
    query = query.eq("to_location_id", params.branch);
  }
  if (params.from) {
    query = query.gte("created_at", params.from);
  }
  if (params.to) {
    query = query.lte("created_at", params.to + "T23:59:59");
  }

  const { data: transactions } = await query;

  // Fetch items and locations for enrichment
  const { data: allItems } = await supabase
    .from("items")
    .select("id, name, sku, base_unit, pcs_per_box");

  const { data: allLocations } = await supabase
    .from("locations")
    .select("id, name");

  const itemMap = new Map(
    (allItems ?? []).map((i) => [i.id, i])
  );
  const locationMap = new Map(
    (allLocations ?? []).map((l) => [l.id, l])
  );

  // Build aggregated totals
  const aggMap = new Map<string, AggregatedDelivery>();
  const deliveryList: DeliveryTransaction[] = [];

  for (const tx of transactions ?? []) {
    const item = itemMap.get(tx.item_id);
    const branch = locationMap.get(tx.to_location_id ?? "");
    if (!item) continue;

    // Aggregate
    const existing = aggMap.get(tx.item_id);
    if (existing) {
      existing.total_qty += tx.qty;
    } else {
      aggMap.set(tx.item_id, {
        item_name: item.name,
        sku: item.sku,
        base_unit: item.base_unit as "boxes" | "pcs",
        pcs_per_box: item.pcs_per_box,
        total_qty: tx.qty,
      });
    }

    // Individual list
    deliveryList.push({
      id: tx.id,
      created_at: tx.created_at,
      item_name: item.name,
      sku: item.sku,
      base_unit: item.base_unit as "boxes" | "pcs",
      pcs_per_box: item.pcs_per_box,
      qty: tx.qty,
      branch_name: branch?.name ?? "Unknown",
      note: tx.note,
    });
  }

  const aggregated = Array.from(aggMap.values()).sort((a, b) =>
    a.item_name.localeCompare(b.item_name)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Deliveries</h1>
        <p className="text-gray-500 mt-1">
          Delivery history from warehouse to branches
        </p>
      </div>

      <DeliveriesFilters
        branches={branches ?? []}
        currentBranch={params.branch}
        currentFrom={params.from}
        currentTo={params.to}
      />

      <DeliveriesSummary aggregated={aggregated} />

      <DeliveriesList deliveries={deliveryList} />
    </div>
  );
}
