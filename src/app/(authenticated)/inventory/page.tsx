import { createClient } from "@/lib/supabase/server";
import { InventoryTable } from "@/components/inventory-table";
import { InventoryFilters } from "@/components/inventory-filters";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  // Fetch inventory levels — warehouse only
  let query = supabase
    .from("inventory_levels")
    .select("*")
    .eq("location_type", "warehouse");

  if (params.category) {
    query = query.eq("category", params.category);
  }
  if (params.q) {
    query = query.or(
      `item_name.ilike.%${params.q}%,sku.ilike.%${params.q}%`
    );
  }

  const { data: inventory } = await query;

  // Get category filter options
  const { data: allItems } = await supabase
    .from("items")
    .select("*");

  const uniqueCategories = [
    ...new Set(
      (allItems ?? [])
        .filter((c) => c.is_active && c.category)
        .map((c) => c.category as string)
    ),
  ].sort();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Inventory</h1>
        <p className="text-gray-500 mt-1">
          Warehouse stock levels
        </p>
      </div>

      <InventoryFilters
        categories={uniqueCategories}
        currentCategory={params.category}
        currentSearch={params.q}
      />

      <InventoryTable inventory={inventory ?? []} />
    </div>
  );
}
