import Dexie, { type EntityTable } from "dexie";

// Cached reference data
export interface CachedItem {
  id: string;
  sku: string;
  name: string;
  category: string | null;
  unit: string;
  is_favorite: boolean;
  is_active: boolean;
}

export interface CachedLocation {
  id: string;
  name: string;
  type: "warehouse" | "branch";
}

// Pending transaction (queued offline)
export interface PendingTransaction {
  localId?: number;
  createdAt: string;
  transactionType: "RECEIVE" | "TRANSFER" | "ADJUST";
  itemId: string;
  itemName: string;
  fromLocationId: string | null;
  toLocationId: string | null;
  toLocationName: string;
  qty: number;
  note: string | null;
  reason: string | null;
  synced: boolean;
}

class TuttiDB extends Dexie {
  items!: EntityTable<CachedItem, "id">;
  locations!: EntityTable<CachedLocation, "id">;
  pendingTransactions!: EntityTable<PendingTransaction, "localId">;

  constructor() {
    super("TuttiStock");
    this.version(1).stores({
      items: "id, sku, name, category, is_favorite",
      locations: "id, type",
      pendingTransactions: "++localId, synced, createdAt",
    });
  }
}

export const db = new TuttiDB();
