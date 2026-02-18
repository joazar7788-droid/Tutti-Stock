"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

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
