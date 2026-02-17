"use server";

import { createClient } from "@/lib/supabase/server";

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
