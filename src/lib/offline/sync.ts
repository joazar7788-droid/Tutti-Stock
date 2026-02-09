import { db } from "./db";
import { createClient } from "@/lib/supabase/client";

export async function cacheReferenceData() {
  const supabase = createClient();

  const [itemsRes, locsRes] = await Promise.all([
    supabase.from("items").select("id, sku, name, category, unit, base_unit, pcs_per_box, is_favorite, is_active").eq("is_active", true),
    supabase.from("locations").select("id, name, type").eq("is_active", true),
  ]);

  if (itemsRes.data) {
    await db.items.clear();
    await db.items.bulkPut(itemsRes.data);
  }

  if (locsRes.data) {
    await db.locations.clear();
    await db.locations.bulkPut(locsRes.data);
  }
}

export async function syncPendingTransactions(userId: string): Promise<{
  synced: number;
  failed: number;
  errors: string[];
}> {
  const pending = await db.pendingTransactions
    .where("synced")
    .equals(0)
    .toArray();

  if (pending.length === 0) return { synced: 0, failed: 0, errors: [] };

  const supabase = createClient();
  let synced = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const tx of pending) {
    const row = {
      created_by: userId,
      transaction_type: tx.transactionType,
      item_id: tx.itemId,
      from_location_id: tx.fromLocationId,
      to_location_id: tx.toLocationId,
      qty: tx.qty,
      note: tx.note,
      reason: tx.reason,
    };

    const { error } = await supabase.from("transactions").insert(row);

    if (error) {
      failed++;
      errors.push(`${tx.itemName}: ${error.message}`);
    } else {
      await db.pendingTransactions.update(tx.localId!, { synced: true });
      synced++;
    }
  }

  // Clean up synced transactions
  await db.pendingTransactions.where("synced").equals(1).delete();

  return { synced, failed, errors };
}

export async function getPendingCount(): Promise<number> {
  return db.pendingTransactions.where("synced").equals(0).count();
}
