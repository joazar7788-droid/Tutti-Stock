import { createClient } from "@/lib/supabase/server";
import { DeliverySheetView } from "@/components/delivery-sheet-view";
import { redirect } from "next/navigation";

export default async function DeliverySheetPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const { planId } = await params;
  const supabase = await createClient();

  // Fetch plan
  const { data: plan } = await supabase
    .from("delivery_plans")
    .select("*")
    .eq("id", planId)
    .single();

  if (!plan) redirect("/delivery-planner");

  // Fetch plan items with item + location details
  const { data: rawItems } = await supabase
    .from("delivery_plan_items")
    .select("qty, item_id, to_location_id")
    .eq("plan_id", planId);

  if (!rawItems || rawItems.length === 0) {
    redirect("/delivery-planner");
  }

  // Fetch item details
  const itemIds = [...new Set(rawItems.map((r) => r.item_id))];
  const { data: itemsData } = await supabase
    .from("items")
    .select("id, name, category, base_unit, pcs_per_box")
    .in("id", itemIds);

  const itemMap = new Map(
    (itemsData ?? []).map((i) => [i.id, i])
  );

  // Fetch location details
  const locationIds = [...new Set(rawItems.map((r) => r.to_location_id))];
  const { data: locationsData } = await supabase
    .from("locations")
    .select("id, name")
    .in("id", locationIds);

  const locationMap = new Map(
    (locationsData ?? []).map((l) => [l.id, l.name])
  );

  // Group by branch, sorted by branch name
  const groupedByBranch = new Map<
    string,
    Array<{
      itemName: string;
      category: string | null;
      qty: number;
      baseUnit: "boxes" | "pcs";
      pcsPerBox: number;
    }>
  >();

  for (const raw of rawItems) {
    const item = itemMap.get(raw.item_id);
    if (!item) continue;

    const branchName = locationMap.get(raw.to_location_id) ?? "Unknown";
    if (!groupedByBranch.has(branchName)) {
      groupedByBranch.set(branchName, []);
    }
    groupedByBranch.get(branchName)!.push({
      itemName: item.name,
      category: item.category,
      qty: raw.qty,
      baseUnit: item.base_unit as "boxes" | "pcs",
      pcsPerBox: item.pcs_per_box,
    });
  }

  // Sort branches alphabetically, sort items within each branch by category then name
  const branchGroups = Array.from(groupedByBranch.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([branchName, items]) => ({
      branchName,
      items: items.sort((a, b) => {
        const catA = a.category ?? "";
        const catB = b.category ?? "";
        if (catA !== catB) return catA.localeCompare(catB);
        return a.itemName.localeCompare(b.itemName);
      }),
    }));

  return (
    <DeliverySheetView weekOf={plan.week_of} branchGroups={branchGroups} />
  );
}
