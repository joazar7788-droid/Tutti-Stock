import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ItemRow } from "@/components/item-row";

export default async function ItemsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isOwner = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    isOwner = profile?.role === "owner";
  }

  const { data: items } = await supabase
    .from("items")
    .select("*")
    .order("name");

  // Sort: active first
  const sorted = (items ?? []).sort((a, b) => {
    if (a.is_active && !b.is_active) return -1;
    if (!a.is_active && b.is_active) return 1;
    return 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Items</h1>
          <p className="text-gray-500 mt-1">Manage your inventory catalog</p>
        </div>
        <Link
          href="/items/new"
          className="px-4 py-2.5 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700"
        >
          Add Item
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {sorted.map((item) => (
          <ItemRow key={item.id} item={item} isOwner={isOwner} />
        ))}
        {sorted.length === 0 && (
          <div className="p-8 text-center text-gray-400">
            No items yet. Add your first item to get started.
          </div>
        )}
      </div>
    </div>
  );
}
