"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function createItem(formData: FormData) {
  const supabase = await createClient();

  const baseUnit = (formData.get("base_unit") as string) || "boxes";
  const pcsPerBox = parseInt(formData.get("pcs_per_box") as string) || 1;
  const looseUnit = (formData.get("unit") as string) || "pcs";
  const unit =
    baseUnit === "boxes" && pcsPerBox > 1 ? looseUnit : baseUnit;

  const { error } = await supabase.from("items").insert({
    sku: formData.get("sku") as string,
    name: formData.get("name") as string,
    category: (formData.get("category") as string) || null,
    unit,
    base_unit: baseUnit,
    pcs_per_box: pcsPerBox,
    reorder_point: parseFloat(formData.get("reorder_point") as string) || 0,
    target_stock: parseFloat(formData.get("target_stock") as string) || 0,
  });

  if (error) return { error: error.message };

  revalidatePath("/items");
  revalidatePath("/inventory");
  return { success: true };
}

export async function updateItem(id: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const baseUnit = (formData.get("base_unit") as string) || "boxes";
  const pcsPerBox = parseInt(formData.get("pcs_per_box") as string) || 1;
  const looseUnit = (formData.get("unit") as string) || "pcs";
  const unit =
    baseUnit === "boxes" && pcsPerBox > 1 ? looseUnit : baseUnit;

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("items")
    .update({
      sku: formData.get("sku") as string,
      name: formData.get("name") as string,
      category: (formData.get("category") as string) || null,
      unit,
      base_unit: baseUnit,
      pcs_per_box: pcsPerBox,
      reorder_point: parseFloat(formData.get("reorder_point") as string) || 0,
      target_stock: parseFloat(formData.get("target_stock") as string) || 0,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/items");
  revalidatePath("/inventory");
  return { success: true };
}

export async function toggleItemActive(id: string, isActive: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("items")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/items");
  revalidatePath("/inventory");
  return { success: true };
}

export async function toggleItemFavorite(id: string, isFavorite: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("items")
    .update({ is_favorite: isFavorite })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/items");
  return { success: true };
}
