"use client";

import { ItemForm } from "@/components/item-form";
import { updateItem } from "@/app/(authenticated)/items/actions";
import type { Item } from "@/lib/database.types";

export function EditItemForm({ item }: { item: Item }) {
  return (
    <ItemForm
      item={item}
      onSubmit={(formData) => updateItem(item.id, formData)}
    />
  );
}
