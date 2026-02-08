"use client";

import { ItemForm } from "@/components/item-form";
import { createItem } from "@/app/(authenticated)/items/actions";

export default function NewItemPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Add New Item</h1>
        <p className="text-gray-500 mt-1">Add a new product to the inventory catalog</p>
      </div>
      <ItemForm onSubmit={createItem} />
    </div>
  );
}
