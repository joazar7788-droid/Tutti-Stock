"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function getOrCreateDraftPlan(weekOf: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Try to find existing draft for this week
  const { data: existing } = await supabase
    .from("delivery_plans")
    .select("*")
    .eq("week_of", weekOf)
    .eq("status", "draft")
    .maybeSingle();

  if (existing) {
    const { data: items } = await supabase
      .from("delivery_plan_items")
      .select("*")
      .eq("plan_id", existing.id);

    return { plan: existing, items: items ?? [] };
  }

  // Create a new draft plan
  const adminClient = createAdminClient();
  const { data: plan, error } = await adminClient
    .from("delivery_plans")
    .insert({
      created_by: user.id,
      week_of: weekOf,
      status: "draft",
    })
    .select("*")
    .single();

  if (error) return { error: error.message };

  return { plan, items: [] };
}

export async function addPlanItem(
  planId: string,
  itemId: string,
  toLocationId: string,
  qty: number
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Verify plan exists
  const { data: plan } = await supabase
    .from("delivery_plans")
    .select("status")
    .eq("id", planId)
    .single();

  if (!plan) return { error: "Plan not found" };

  // Check warehouse stock vs total planned
  const { data: warehouseStock } = await supabase
    .from("inventory_levels")
    .select("on_hand")
    .eq("item_id", itemId)
    .eq("location_type", "warehouse")
    .maybeSingle();

  const warehouseOnHand = warehouseStock?.on_hand ?? 0;

  const { data: existingPlanItems } = await supabase
    .from("delivery_plan_items")
    .select("qty, to_location_id")
    .eq("plan_id", planId)
    .eq("item_id", itemId);

  // Sum already planned, excluding the current branch (since upsert replaces it)
  const alreadyPlanned = (existingPlanItems ?? [])
    .filter((pi) => pi.to_location_id !== toLocationId)
    .reduce((sum, pi) => sum + pi.qty, 0);

  if (alreadyPlanned + qty > warehouseOnHand) {
    return { error: "Exceeds available warehouse stock" };
  }

  const adminClient = createAdminClient();
  const { data: item, error } = await adminClient
    .from("delivery_plan_items")
    .upsert(
      {
        plan_id: planId,
        item_id: itemId,
        to_location_id: toLocationId,
        qty,
      },
      { onConflict: "plan_id,item_id,to_location_id" }
    )
    .select("*")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/delivery-planner");
  return { item };
}

export async function removePlanItem(planItemId: string) {
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("delivery_plan_items")
    .delete()
    .eq("id", planItemId);

  if (error) return { error: error.message };

  revalidatePath("/delivery-planner");
  return { success: true };
}

export async function updatePlanItem(planItemId: string, qty: number) {
  if (qty <= 0) return { error: "Quantity must be greater than 0" };

  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("delivery_plan_items")
    .update({ qty })
    .eq("id", planItemId);

  if (error) return { error: error.message };

  revalidatePath("/delivery-planner");
  return { success: true };
}

export async function finalizePlan(planId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Check plan has items
  const { data: items } = await supabase
    .from("delivery_plan_items")
    .select("id")
    .eq("plan_id", planId)
    .limit(1);

  if (!items || items.length === 0) {
    return { error: "Cannot finalize an empty plan" };
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("delivery_plans")
    .update({ status: "finalized" })
    .eq("id", planId)
    .eq("status", "draft");

  if (error) return { error: error.message };

  revalidatePath("/delivery-planner");
  return { success: true };
}

export async function revertPlanToDraft(planId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Check user role — only owners can revert
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "owner") {
    return { error: "Only owners can revert finalized plans" };
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("delivery_plans")
    .update({ status: "draft" })
    .eq("id", planId)
    .eq("status", "finalized");

  if (error) return { error: error.message };

  revalidatePath("/delivery-planner");
  return { success: true };
}

export async function getLatestFinalizedPlanForBranch(locationId: string) {
  const supabase = await createClient();

  // Get most recent finalized plan
  const { data: plan } = await supabase
    .from("delivery_plans")
    .select("id")
    .eq("status", "finalized")
    .order("week_of", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!plan) return { items: [] };

  // Get items for this branch from that plan
  const { data: items } = await supabase
    .from("delivery_plan_items")
    .select("item_id, qty")
    .eq("plan_id", plan.id)
    .eq("to_location_id", locationId);

  return { items: items ?? [] };
}
