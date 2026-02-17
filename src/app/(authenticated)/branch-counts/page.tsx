import { createClient } from "@/lib/supabase/server";
import { getRecentSunday, toISODate } from "@/lib/date-utils";
import { BranchCountsView, type BranchCountData } from "@/components/branch-counts-view";

export default async function BranchCountsPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  // Get all branch locations
  const { data: allLocations } = await supabase
    .from("locations")
    .select("id, name, type")
    .eq("is_active", true)
    .order("name");

  const branches = (allLocations ?? []).filter((l) => l.type === "branch");

  // Compute current week's Sunday
  const weekOf = toISODate(getRecentSunday(new Date()));

  // Fetch all stock counts for this week
  const { data: counts } = await supabase
    .from("stock_counts")
    .select("id, location_id, counted_by, created_at, week_of")
    .eq("week_of", weekOf)
    .order("created_at", { ascending: false });

  // Deduplicate: keep latest per branch
  const latestByBranch = new Map<string, (typeof counts extends (infer T)[] | null ? T : never)>();
  for (const count of counts ?? []) {
    if (!latestByBranch.has(count.location_id)) {
      latestByBranch.set(count.location_id, count);
    }
  }

  // Fetch items for all found counts
  const countIds = Array.from(latestByBranch.values()).map((c) => c.id);

  let countItemsMap = new Map<string, Array<{ item_id: string; qty: number }>>();
  if (countIds.length > 0) {
    const { data: countItems } = await supabase
      .from("stock_count_items")
      .select("stock_count_id, item_id, qty")
      .in("stock_count_id", countIds);

    for (const ci of countItems ?? []) {
      if (!countItemsMap.has(ci.stock_count_id)) {
        countItemsMap.set(ci.stock_count_id, []);
      }
      countItemsMap.get(ci.stock_count_id)!.push(ci);
    }
  }

  // Fetch all active items for display
  const { data: allItems } = await supabase
    .from("items")
    .select("id, name, category, base_unit, pcs_per_box, unit")
    .eq("is_active", true)
    .order("category")
    .order("name");

  const itemMap = new Map(
    (allItems ?? []).map((i) => [i.id, i])
  );

  // Build branch data
  const branchData: BranchCountData[] = branches.map((branch) => {
    const count = latestByBranch.get(branch.id);
    if (!count) {
      return {
        locationId: branch.id,
        locationName: branch.name,
        countedBy: null,
        countedAt: null,
        hasCount: false,
        items: [],
      };
    }

    const countItems = countItemsMap.get(count.id) ?? [];
    const qtyMap = new Map(countItems.map((ci) => [ci.item_id, ci.qty]));

    const displayItems = (allItems ?? []).map((item) => ({
      itemId: item.id,
      itemName: item.name,
      category: item.category,
      qty: qtyMap.get(item.id) ?? 0,
      baseUnit: item.base_unit as "boxes" | "pcs",
      pcsPerBox: item.pcs_per_box,
      unit: item.unit,
    }));

    return {
      locationId: branch.id,
      locationName: branch.name,
      countedBy: count.counted_by,
      countedAt: count.created_at,
      hasCount: true,
      items: displayItems,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Branch Counts</h1>
        <p className="text-gray-500 mt-1">
          Weekly stock counts from all branches — week of{" "}
          {new Date(weekOf + "T00:00:00").toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>

      <BranchCountsView
        branches={branchData}
        allBranches={branches.map((b) => ({ id: b.id, name: b.name }))}
        currentBranch={params.branch}
      />
    </div>
  );
}
