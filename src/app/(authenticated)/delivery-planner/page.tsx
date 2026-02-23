import { createClient } from "@/lib/supabase/server";
import { getRecentSunday, toISODate } from "@/lib/date-utils";
import { DeliveryPlannerView } from "@/components/delivery-planner-view";
import { createAdminClient } from "@/lib/supabase/admin";

export type PlannerItem = {
  id: string;
  name: string;
  category: string | null;
  baseUnit: "boxes" | "pcs";
  pcsPerBox: number;
  unit: string;
  branchCounts: Record<string, number | null>; // locationId -> qty in pcs (null = no count)
  warehouseOnHand: number; // pcs
};

export type PlannerBranch = {
  id: string;
  name: string;
  countDate: string | null;
};

export type PlannerPlanItem = {
  id: string;
  itemId: string;
  toLocationId: string;
  qty: number; // pcs
};

export type PlannerPlan = {
  id: string;
  status: "draft" | "finalized";
  weekOf: string;
  items: PlannerPlanItem[];
};

export default async function DeliveryPlannerPage() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: userProfile } = user
    ? await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()
    : { data: null };
  const userRole = (userProfile?.role as string) ?? "staff";

  // Compute this week's Sunday
  const thisWeek = getRecentSunday(new Date());
  const weekOf = toISODate(thisWeek);

  // Fetch all active items
  const { data: allItems } = await supabase
    .from("items")
    .select("id, name, category, base_unit, pcs_per_box, unit")
    .eq("is_active", true)
    .order("category")
    .order("name");

  // Fetch all branch locations
  const { data: allLocations } = await supabase
    .from("locations")
    .select("id, name, type")
    .eq("is_active", true)
    .order("name");

  const branches = (allLocations ?? []).filter((l) => l.type === "branch");

  // Fetch this week's stock counts for branches
  const { data: counts } = await supabase
    .from("stock_counts")
    .select("id, location_id, created_at, week_of")
    .eq("week_of", weekOf)
    .order("created_at", { ascending: false });

  // Deduplicate: keep latest per branch
  const countByBranch = new Map<
    string,
    { id: string; created_at: string }
  >();
  for (const count of counts ?? []) {
    if (!countByBranch.has(count.location_id)) {
      countByBranch.set(count.location_id, {
        id: count.id,
        created_at: count.created_at,
      });
    }
  }

  // Fetch count items for all relevant counts
  const countIds = Array.from(countByBranch.values()).map((c) => c.id);
  const countItemsByBranch = new Map<string, Map<string, number>>();

  if (countIds.length > 0) {
    const { data: countItems } = await supabase
      .from("stock_count_items")
      .select("stock_count_id, item_id, qty")
      .in("stock_count_id", countIds);

    // Build lookup: branchId -> (itemId -> qty)
    const countIdToBranch = new Map<string, string>();
    for (const [branchId, count] of countByBranch) {
      countIdToBranch.set(count.id, branchId);
    }

    for (const ci of countItems ?? []) {
      const branchId = countIdToBranch.get(ci.stock_count_id);
      if (!branchId) continue;
      if (!countItemsByBranch.has(branchId)) {
        countItemsByBranch.set(branchId, new Map());
      }
      countItemsByBranch.get(branchId)!.set(ci.item_id, ci.qty);
    }
  }

  // Fetch warehouse on-hand from inventory_levels
  const { data: warehouseInventory } = await supabase
    .from("inventory_levels")
    .select("item_id, on_hand")
    .eq("location_type", "warehouse");

  const warehouseOnHand = new Map<string, number>();
  for (const row of warehouseInventory ?? []) {
    warehouseOnHand.set(row.item_id, row.on_hand);
  }

  // Build planner items
  const plannerItems: PlannerItem[] = (allItems ?? []).map((item) => {
    const branchCounts: Record<string, number | null> = {};
    for (const branch of branches) {
      const branchItems = countItemsByBranch.get(branch.id);
      branchCounts[branch.id] = branchItems?.get(item.id) ?? null;
    }

    return {
      id: item.id,
      name: item.name,
      category: item.category,
      baseUnit: item.base_unit as "boxes" | "pcs",
      pcsPerBox: item.pcs_per_box,
      unit: item.unit,
      branchCounts,
      warehouseOnHand: warehouseOnHand.get(item.id) ?? 0,
    };
  });

  // Build branch data with count dates
  const plannerBranches: PlannerBranch[] = branches.map((b) => ({
    id: b.id,
    name: b.name,
    countDate: countByBranch.get(b.id)?.created_at ?? null,
  }));

  // Get or create draft plan for this week
  const adminClient = createAdminClient();

  let plan: PlannerPlan;

  const { data: existingPlan } = await supabase
    .from("delivery_plans")
    .select("*")
    .eq("week_of", weekOf)
    .eq("status", "draft")
    .maybeSingle();

  if (existingPlan) {
    const { data: planItems } = await supabase
      .from("delivery_plan_items")
      .select("*")
      .eq("plan_id", existingPlan.id);

    plan = {
      id: existingPlan.id,
      status: existingPlan.status,
      weekOf: existingPlan.week_of,
      items: (planItems ?? []).map((pi) => ({
        id: pi.id,
        itemId: pi.item_id,
        toLocationId: pi.to_location_id,
        qty: pi.qty,
      })),
    };
  } else if (user) {
    // Check for a finalized plan this week (don't create a new draft)
    const { data: finalizedPlan } = await supabase
      .from("delivery_plans")
      .select("*")
      .eq("week_of", weekOf)
      .eq("status", "finalized")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (finalizedPlan) {
      const { data: planItems } = await supabase
        .from("delivery_plan_items")
        .select("*")
        .eq("plan_id", finalizedPlan.id);

      plan = {
        id: finalizedPlan.id,
        status: finalizedPlan.status,
        weekOf: finalizedPlan.week_of,
        items: (planItems ?? []).map((pi) => ({
          id: pi.id,
          itemId: pi.item_id,
          toLocationId: pi.to_location_id,
          qty: pi.qty,
        })),
      };
    } else {
      // Create new draft
      const { data: newPlan, error } = await adminClient
        .from("delivery_plans")
        .insert({
          created_by: user.id,
          week_of: weekOf,
          status: "draft",
        })
        .select("*")
        .single();

      if (error || !newPlan) {
        plan = { id: "", status: "draft", weekOf, items: [] };
      } else {
        plan = {
          id: newPlan.id,
          status: newPlan.status,
          weekOf: newPlan.week_of,
          items: [],
        };
      }
    }
  } else {
    plan = { id: "", status: "draft", weekOf, items: [] };
  }

  const formattedWeek = new Date(weekOf + "T00:00:00").toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", year: "numeric" }
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Delivery Planner</h1>
        <p className="text-gray-500 mt-1">
          Plan weekly deliveries — week of {formattedWeek}
        </p>
      </div>

      <DeliveryPlannerView
        items={plannerItems}
        branches={plannerBranches}
        plan={plan}
        userRole={userRole}
      />
    </div>
  );
}
