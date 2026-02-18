"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function getExistingCount(locationId: string, weekOf: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: count } = await supabase
    .from("stock_counts")
    .select("id, counted_by, created_at")
    .eq("location_id", locationId)
    .eq("week_of", weekOf)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!count) return { count: null };

  const { data: items } = await supabase
    .from("stock_count_items")
    .select("item_id, qty")
    .eq("stock_count_id", count.id);

  const hoursSince =
    (Date.now() - new Date(count.created_at).getTime()) / (1000 * 60 * 60);

  return {
    count: {
      id: count.id,
      countedBy: count.counted_by,
      createdAt: count.created_at,
      editable: hoursSince <= 12,
      items: items ?? [],
    },
  };
}

export async function updateExistingCount(data: {
  countId: string;
  countedBy: string;
  items: Array<{ itemId: string; qty: number }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Verify count exists, belongs to user, and is within 12 hours
  const { data: count } = await supabase
    .from("stock_counts")
    .select("id, created_at, submitted_by")
    .eq("id", data.countId)
    .single();

  if (!count) return { error: "Count not found" };
  if (count.submitted_by !== user.id) return { error: "Not your count" };

  const hoursSince =
    (Date.now() - new Date(count.created_at).getTime()) / (1000 * 60 * 60);
  if (hoursSince > 12) {
    return { error: "Edit window has passed (12 hours)." };
  }

  // Use admin client for delete+re-insert to bypass RLS
  const adminClient = createAdminClient();

  // Update counted_by on the header
  await adminClient
    .from("stock_counts")
    .update({ counted_by: data.countedBy })
    .eq("id", data.countId);

  // Delete old items, re-insert new ones
  await adminClient
    .from("stock_count_items")
    .delete()
    .eq("stock_count_id", data.countId);

  const itemRows = data.items.map((item) => ({
    stock_count_id: data.countId,
    item_id: item.itemId,
    qty: item.qty,
  }));

  const { error } = await adminClient
    .from("stock_count_items")
    .insert(itemRows);

  if (error) return { error: error.message };
  return { success: true };
}

export async function submitStockCount(data: {
  locationId: string;
  countedBy: string;
  weekOf: string;
  items: Array<{ itemId: string; qty: number }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Check for existing count this branch + week
  const { data: existing } = await supabase
    .from("stock_counts")
    .select("id")
    .eq("location_id", data.locationId)
    .eq("week_of", data.weekOf)
    .limit(1);

  if (existing && existing.length > 0) {
    return {
      error:
        "A count has already been submitted for this branch this week.",
    };
  }

  // Insert the stock count header
  const { data: stockCount, error: countError } = await supabase
    .from("stock_counts")
    .insert({
      location_id: data.locationId,
      counted_by: data.countedBy,
      submitted_by: user.id,
      week_of: data.weekOf,
    })
    .select("id")
    .single();

  if (countError) {
    return { error: countError.message };
  }

  // Insert all item rows (including zeros)
  const itemRows = data.items.map((item) => ({
    stock_count_id: stockCount.id,
    item_id: item.itemId,
    qty: item.qty,
  }));

  const { error: itemsError } = await supabase
    .from("stock_count_items")
    .insert(itemRows);

  if (itemsError) {
    return { error: itemsError.message };
  }

  return { success: true };
}
