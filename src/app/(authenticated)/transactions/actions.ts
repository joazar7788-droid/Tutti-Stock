"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createDelivery(data: {
  toLocationId: string;
  items: Array<{ itemId: string; qty: number }>;
  note?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Get warehouse ID
  const { data: warehouse } = await supabase
    .from("locations")
    .select("id")
    .eq("type", "warehouse")
    .single();

  if (!warehouse) return { error: "Warehouse not found" };

  const rows = data.items.map((item) => ({
    created_by: user.id,
    transaction_type: "TRANSFER" as const,
    item_id: item.itemId,
    from_location_id: warehouse.id,
    to_location_id: data.toLocationId,
    qty: item.qty,
    note: data.note || null,
  }));

  const { error } = await supabase.from("transactions").insert(rows);

  if (error) return { error: error.message };

  revalidatePath("/inventory");
  revalidatePath("/deliveries");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function createReceive(data: {
  toLocationId: string;
  items: Array<{ itemId: string; qty: number }>;
  note?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const rows = data.items.map((item) => ({
    created_by: user.id,
    transaction_type: "RECEIVE" as const,
    item_id: item.itemId,
    to_location_id: data.toLocationId,
    qty: item.qty,
    note: data.note || null,
  }));

  const { error } = await supabase.from("transactions").insert(rows);

  if (error) return { error: error.message };

  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function createAdjustment(data: {
  locationId: string;
  itemId: string;
  qty: number;
  direction: "add" | "remove";
  reason: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const row = {
    created_by: user.id,
    transaction_type: "ADJUST" as const,
    item_id: data.itemId,
    from_location_id: data.direction === "remove" ? data.locationId : null,
    to_location_id: data.direction === "add" ? data.locationId : null,
    qty: data.qty,
    reason: data.reason,
  };

  const { error } = await supabase.from("transactions").insert(row);

  if (error) return { error: error.message };

  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  return { success: true };
}
