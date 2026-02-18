"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function deleteStockCount(countId: string) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("stock_counts")
    .delete()
    .eq("id", countId);

  if (error) return { error: error.message };

  revalidatePath("/branch-counts");
  return { success: true };
}

export async function submitManagerStockCount(data: {
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

  // Insert the stock count header using admin client to bypass RLS
  const adminClient = createAdminClient();
  const { data: stockCount, error: countError } = await adminClient
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

  const { error: itemsError } = await adminClient
    .from("stock_count_items")
    .insert(itemRows);

  if (itemsError) {
    return { error: itemsError.message };
  }

  revalidatePath("/branch-counts");
  return { success: true };
}

export async function updateStockCountItem(
  stockCountItemId: string,
  newQty: number
) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("stock_count_items")
    .update({ qty: newQty })
    .eq("id", stockCountItemId);

  if (error) return { error: error.message };

  revalidatePath("/branch-counts");
  return { success: true };
}
