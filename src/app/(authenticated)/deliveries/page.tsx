import { createClient } from "@/lib/supabase/server";
import { DeliveriesFilters } from "@/components/deliveries-filters";
import {
  DeliveriesList,
  type ActivityGroup,
} from "@/components/deliveries-list";

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string; from?: string; to?: string; type?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  // Get locations for filter dropdown and enrichment
  const { data: allLocations } = await supabase
    .from("locations")
    .select("id, name, type")
    .eq("is_active", true)
    .order("name");

  const branches = (allLocations ?? []).filter((l) => l.type === "branch");
  const locationMap = new Map(
    (allLocations ?? []).map((l) => [l.id, l])
  );

  // Fetch transactions (all types or filtered)
  let query = supabase
    .from("transactions")
    .select("id, created_at, transaction_type, item_id, from_location_id, to_location_id, qty, note, reason")
    .order("created_at", { ascending: false });

  if (params.type === "TRANSFER") {
    query = query.eq("transaction_type", "TRANSFER");
  } else if (params.type === "RECEIVE") {
    query = query.eq("transaction_type", "RECEIVE");
  } else if (params.type === "ADJUST") {
    query = query.eq("transaction_type", "ADJUST");
  }

  if (params.branch) {
    query = query.or(`to_location_id.eq.${params.branch},from_location_id.eq.${params.branch}`);
  }
  if (params.from) {
    query = query.gte("created_at", params.from);
  }
  if (params.to) {
    query = query.lte("created_at", params.to + "T23:59:59");
  }

  const { data: transactions } = await query;

  // Fetch items for enrichment
  const { data: allItems } = await supabase
    .from("items")
    .select("id, name, sku, base_unit, pcs_per_box");

  const itemMap = new Map(
    (allItems ?? []).map((i) => [i.id, i])
  );

  // Group transactions into batches
  const groupMap = new Map<string, ActivityGroup>();

  for (const tx of transactions ?? []) {
    const item = itemMap.get(tx.item_id);
    if (!item) continue;

    const key = `${tx.created_at}|${tx.transaction_type}|${tx.from_location_id ?? ""}|${tx.to_location_id ?? ""}`;

    if (!groupMap.has(key)) {
      const fromLoc = locationMap.get(tx.from_location_id ?? "");
      const toLoc = locationMap.get(tx.to_location_id ?? "");
      const type = tx.transaction_type as "RECEIVE" | "TRANSFER" | "ADJUST";

      let title: string;
      if (type === "TRANSFER") {
        title = `Delivery to ${toLoc?.name ?? "Unknown"}`;
      } else if (type === "RECEIVE") {
        title = `Received at ${toLoc?.name ?? "Unknown"}`;
      } else if (tx.reason) {
        title = tx.reason;
      } else {
        const locName = toLoc?.name ?? fromLoc?.name ?? "Unknown";
        title = `Adjustment at ${locName}`;
      }

      groupMap.set(key, {
        key,
        title,
        type,
        date: tx.created_at,
        items: [],
      });
    }

    groupMap.get(key)!.items.push({
      item_name: item.name,
      qty: tx.qty,
      base_unit: item.base_unit as "boxes" | "pcs",
      pcs_per_box: item.pcs_per_box,
      note: tx.note,
    });
  }

  const groups = Array.from(groupMap.values());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Activity</h1>
        <p className="text-gray-500 mt-1">
          All stock movements — deliveries, receipts, and adjustments
        </p>
      </div>

      <DeliveriesFilters
        branches={branches}
        currentBranch={params.branch}
        currentFrom={params.from}
        currentTo={params.to}
        currentType={params.type}
      />

      <DeliveriesList groups={groups} />
    </div>
  );
}
