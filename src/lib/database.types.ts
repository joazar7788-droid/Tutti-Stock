export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      locations: {
        Row: {
          id: string;
          name: string;
          type: "warehouse" | "branch";
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: "warehouse" | "branch";
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: "warehouse" | "branch";
          is_active?: boolean;
          created_at?: string;
        };
      };
      items: {
        Row: {
          id: string;
          sku: string;
          name: string;
          category: string | null;
          unit: string;
          reorder_point: number;
          target_stock: number;
          is_active: boolean;
          is_favorite: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sku: string;
          name: string;
          category?: string | null;
          unit?: string;
          reorder_point?: number;
          target_stock?: number;
          is_active?: boolean;
          is_favorite?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sku?: string;
          name?: string;
          category?: string | null;
          unit?: string;
          reorder_point?: number;
          target_stock?: number;
          is_active?: boolean;
          is_favorite?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          role: "owner" | "staff";
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          role?: "owner" | "staff";
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          role?: "owner" | "staff";
          created_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          created_at: string;
          created_by: string;
          transaction_type: "RECEIVE" | "TRANSFER" | "ADJUST";
          item_id: string;
          from_location_id: string | null;
          to_location_id: string | null;
          qty: number;
          note: string | null;
          reason: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          created_by: string;
          transaction_type: "RECEIVE" | "TRANSFER" | "ADJUST";
          item_id: string;
          from_location_id?: string | null;
          to_location_id?: string | null;
          qty: number;
          note?: string | null;
          reason?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          created_by?: string;
          transaction_type?: "RECEIVE" | "TRANSFER" | "ADJUST";
          item_id?: string;
          from_location_id?: string | null;
          to_location_id?: string | null;
          qty?: number;
          note?: string | null;
          reason?: string | null;
        };
      };
    };
    Views: {
      inventory_levels: {
        Row: {
          item_id: string;
          item_name: string;
          sku: string;
          category: string | null;
          unit: string;
          reorder_point: number;
          target_stock: number;
          is_favorite: boolean;
          location_id: string;
          location_name: string;
          location_type: "warehouse" | "branch";
          on_hand: number;
        };
      };
    };
    Functions: {
      get_user_role: {
        Args: Record<string, never>;
        Returns: "owner" | "staff";
      };
    };
    Enums: {
      location_type: "warehouse" | "branch";
      user_role: "owner" | "staff";
      transaction_type: "RECEIVE" | "TRANSFER" | "ADJUST";
    };
  };
};

// Convenience type aliases
export type Location = Database["public"]["Tables"]["locations"]["Row"];
export type Item = Database["public"]["Tables"]["items"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
export type TransactionInsert = Database["public"]["Tables"]["transactions"]["Insert"];
export type InventoryLevel = Database["public"]["Views"]["inventory_levels"]["Row"];
