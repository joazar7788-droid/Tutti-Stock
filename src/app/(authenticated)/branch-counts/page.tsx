import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getRecentSunday, getSundayNWeeksAgo, toISODate } from "@/lib/date-utils";
import { BranchCountsView, type BranchCountData, type SundayDates } from "@/components/branch-counts-view";

export default async function BranchCountsPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  // Get current user's role
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: userProfile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null };
  const userRole = (userProfile?.role as string) ?? "staff";

  // Get all branch locations
  const { data: allLocations } = await supabase
    .from("locations")
    .select("id, name, type")
    .eq("is_active", true)
    .order("name");

  const branches = (allLocations ?? []).filter((l) => l.type === "branch");

  // Compute 3 Sundays: this week, last week, 2 weeks ago
  const thisWeek = getRecentSunday(new Date());
  const lastWeek = getSundayNWeeksAgo(1);
  const twoWeeksAgo = getSundayNWeeksAgo(2);

  const weekDates = [toISODate(twoWeeksAgo), toISODate(lastWeek), toISODate(thisWeek)];

  // Fetch stock counts for all 3 weeks
  const { data: counts } = await supabase
    .from("stock_counts")
    .select("id, location_id, counted_by, created_at, week_of")
    .in("week_of", weekDates)
    .order("created_at", { ascending: false });

  // Deduplicate: keep latest per branch per week
  const countsByBranchWeek = new Map<string, (typeof counts extends (infer T)[] | null ? T : never)>();
  for (const count of counts ?? []) {
    const key = `${count.location_id}:${count.week_of}`;
    if (!countsByBranchWeek.has(key)) {
      countsByBranchWeek.set(key, count);
    }
  }

  // Fetch all count items
  const allCountIds = Array.from(countsByBranchWeek.values()).map((c) => c.id);
  let countItemsMap = new Map<string, Array<{ id: string; item_id: string; qty: number }>>();
  if (allCountIds.length > 0) {
    const { data: countItems } = await supabase
      .from("stock_count_items")
      .select("id, stock_count_id, item_id, qty")
      .in("stock_count_id", allCountIds);

    for (const ci of countItems ?? []) {
      if (!countItemsMap.has(ci.stock_count_id)) {
        countItemsMap.set(ci.stock_count_id, []);
      }
      countItemsMap.get(ci.stock_count_id)!.push(ci);
    }
  }

  // Fetch deliveries (TRANSFER transactions) to branches for past 2 weeks
  // Delivery window: from twoWeeksAgo to end of this week
  const deliveryStart = toISODate(twoWeeksAgo);
  const endOfThisWeek = new Date(thisWeek);
  endOfThisWeek.setDate(endOfThisWeek.getDate() + 7);
  const deliveryEnd = toISODate(endOfThisWeek);

  const branchIds = branches.map((b) => b.id);
  let deliveriesByBranchWeek = new Map<string, Map<string, number>>();
  // Track earliest delivery date per branch+week
  let deliveryDatesByBranchWeek = new Map<string, string>();

  if (branchIds.length > 0) {
    const { data: deliveries } = await supabase
      .from("transactions")
      .select("to_location_id, item_id, qty, created_at")
      .eq("transaction_type", "TRANSFER")
      .in("to_location_id", branchIds)
      .gte("created_at", deliveryStart)
      .lt("created_at", deliveryEnd);

    // Group deliveries by branch+week and item
    for (const d of deliveries ?? []) {
      if (!d.to_location_id) continue;
      const deliveryDate = new Date(d.created_at);
      // Determine which week this delivery belongs to
      let weekKey: string;
      if (deliveryDate >= thisWeek) {
        weekKey = toISODate(thisWeek);
      } else if (deliveryDate >= lastWeek) {
        weekKey = toISODate(lastWeek);
      } else {
        weekKey = toISODate(twoWeeksAgo);
      }

      const branchWeekKey = `${d.to_location_id}:${weekKey}`;
      if (!deliveriesByBranchWeek.has(branchWeekKey)) {
        deliveriesByBranchWeek.set(branchWeekKey, new Map());
      }
      const itemMap = deliveriesByBranchWeek.get(branchWeekKey)!;
      itemMap.set(d.item_id, (itemMap.get(d.item_id) ?? 0) + d.qty);

      // Track earliest delivery date for this branch+week
      const existing = deliveryDatesByBranchWeek.get(branchWeekKey);
      if (!existing || d.created_at < existing) {
        deliveryDatesByBranchWeek.set(branchWeekKey, d.created_at);
      }
    }
  }

  // Fetch all active items
  const { data: allItems } = await supabase
    .from("items")
    .select("id, name, category, base_unit, pcs_per_box, unit")
    .eq("is_active", true)
    .order("category")
    .order("name");

  // Helper to get count data for a branch+week
  function getCountQtyMap(branchId: string, weekOf: string) {
    const key = `${branchId}:${weekOf}`;
    const count = countsByBranchWeek.get(key);
    if (!count) return null;
    const items = countItemsMap.get(count.id) ?? [];
    return {
      count,
      qtyMap: new Map(items.map((ci) => [ci.item_id, ci])),
    };
  }

  // Build branch data with historical columns
  const branchData: BranchCountData[] = branches.map((branch) => {
    const currentData = getCountQtyMap(branch.id, toISODate(thisWeek));
    const lastWeekData = getCountQtyMap(branch.id, toISODate(lastWeek));
    const twoWeeksAgoData = getCountQtyMap(branch.id, toISODate(twoWeeksAgo));

    const deliveries2wk = deliveriesByBranchWeek.get(
      `${branch.id}:${toISODate(twoWeeksAgo)}`
    );
    const deliveries1wk = deliveriesByBranchWeek.get(
      `${branch.id}:${toISODate(lastWeek)}`
    );

    const displayItems = (allItems ?? []).map((item) => {
      const currentCi = currentData?.qtyMap.get(item.id);
      return {
        stockCountItemId: currentCi?.id ?? null,
        itemId: item.id,
        itemName: item.name,
        category: item.category,
        qty: currentCi?.qty ?? 0,
        baseUnit: item.base_unit as "boxes" | "pcs",
        pcsPerBox: item.pcs_per_box,
        unit: item.unit,
        countTwoWeeksAgo: twoWeeksAgoData?.qtyMap.get(item.id)?.qty ?? null,
        deliveredTwoWeeksAgo: deliveries2wk?.get(item.id) ?? null,
        countLastWeek: lastWeekData?.qtyMap.get(item.id)?.qty ?? null,
        deliveredLastWeek: deliveries1wk?.get(item.id) ?? null,
      };
    });

    return {
      locationId: branch.id,
      locationName: branch.name,
      countId: currentData?.count.id ?? null,
      countedBy: currentData?.count.counted_by ?? null,
      countedAt: currentData?.count.created_at ?? null,
      hasCount: !!currentData,
      hasPastData:
        !!lastWeekData || !!twoWeeksAgoData || !!deliveries2wk || !!deliveries1wk,
      items: displayItems,
      // Actual dates per branch
      countDateTwoWeeksAgo: twoWeeksAgoData?.count.created_at ?? null,
      deliveryDateTwoWeeksAgo: deliveryDatesByBranchWeek.get(`${branch.id}:${toISODate(twoWeeksAgo)}`) ?? null,
      countDateLastWeek: lastWeekData?.count.created_at ?? null,
      deliveryDateLastWeek: deliveryDatesByBranchWeek.get(`${branch.id}:${toISODate(lastWeek)}`) ?? null,
      countDateThisWeek: currentData?.count.created_at ?? null,
    };
  });

  // Sunday ISO dates for fallback headers
  const sundayDates: SundayDates = {
    twoWeeksAgo: toISODate(twoWeeksAgo),
    lastWeek: toISODate(lastWeek),
    thisWeek: toISODate(thisWeek),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Branch Counts</h1>
          <p className="text-gray-500 mt-1">
            Weekly stock counts from all branches — week of{" "}
            {new Date(toISODate(thisWeek) + "T00:00:00").toLocaleDateString(
              "en-US",
              {
                month: "short",
                day: "numeric",
                year: "numeric",
              }
            )}
          </p>
        </div>
        <Link
          href="/branch-counts/new"
          className="px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700"
        >
          + Add Count
        </Link>
      </div>

      <BranchCountsView
        branches={branchData}
        allBranches={branches.map((b) => ({ id: b.id, name: b.name }))}
        currentBranch={params.branch}
        sundayDates={sundayDates}
        userRole={userRole}
      />
    </div>
  );
}
