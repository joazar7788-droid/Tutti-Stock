import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditItemForm } from "./edit-form";

export default async function EditItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "owner") redirect("/dashboard");

  const { data: item } = await supabase
    .from("items")
    .select("*")
    .eq("id", id)
    .single();

  if (!item) redirect("/items");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Item</h1>
        <p className="text-gray-500 mt-1">{item.name}</p>
      </div>
      <EditItemForm item={item} />
    </div>
  );
}
