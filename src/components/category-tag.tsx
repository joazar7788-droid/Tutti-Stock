export const CATEGORY_CONFIG: Record<string, { label: string; className: string }> = {
  Powders: { label: "Powder", className: "bg-purple-100 text-purple-700" },
  "Ingredient Syrups": { label: "Syrup", className: "bg-blue-100 text-blue-700" },
  Toppings: { label: "Topping", className: "bg-emerald-100 text-emerald-700" },
  "Topping Sauces": { label: "Sauce", className: "bg-amber-100 text-amber-700" },
  Bobas: { label: "Boba", className: "bg-pink-100 text-pink-700" },
  Containers: { label: "Container", className: "bg-slate-100 text-slate-600" },
};

export function CategoryTag({ category }: { category: string | null }) {
  if (!category) return null;
  const config = CATEGORY_CONFIG[category];
  if (!config) return null;
  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${config.className}`}
    >
      {config.label}
    </span>
  );
}
