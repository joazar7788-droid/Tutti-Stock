"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formatQty } from "@/lib/unit-utils";
import { CATEGORY_CONFIG } from "@/components/category-tag";
import { PlanItemPopover } from "@/components/plan-item-popover";
import {
  addPlanItem,
  removePlanItem,
  finalizePlan,
  revertPlanToDraft,
} from "@/app/(authenticated)/delivery-planner/actions";
import Link from "next/link";
import type {
  PlannerItem,
  PlannerBranch,
  PlannerPlan,
  PlannerPlanItem,
} from "@/app/(authenticated)/delivery-planner/page";

export function DeliveryPlannerView({
  items,
  branches,
  plan: initialPlan,
  userRole,
}: {
  items: PlannerItem[];
  branches: PlannerBranch[];
  plan: PlannerPlan;
  userRole: string;
}) {
  const router = useRouter();
  const [planItems, setPlanItems] = useState<PlannerPlanItem[]>(
    initialPlan.items
  );
  const [planStatus, setPlanStatus] = useState(initialPlan.status);
  const [search, setSearch] = useState("");
  const [popoverItemId, setPopoverItemId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
    new Set()
  );

  const isDraft = planStatus === "draft";

  // Group items by category
  const categories = useMemo(() => {
    const cats: Array<{
      name: string;
      label: string;
      className: string;
      items: PlannerItem[];
    }> = [];
    const grouped = new Map<string, PlannerItem[]>();

    for (const item of items) {
      const cat = item.category ?? "Other";
      if (!grouped.has(cat)) grouped.set(cat, []);
      grouped.get(cat)!.push(item);
    }

    for (const [name, catItems] of grouped) {
      const config = CATEGORY_CONFIG[name];
      cats.push({
        name,
        label: config?.label ?? name,
        className: config?.className ?? "bg-gray-100 text-gray-700",
        items: catItems,
      });
    }
    return cats;
  }, [items]);

  // Filter by search
  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter((item) =>
          item.name.toLowerCase().includes(q)
        ),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [categories, search]);

  // Get plan items for a specific item
  const getPlanItemsForItem = useCallback(
    (itemId: string) => planItems.filter((pi) => pi.itemId === itemId),
    [planItems]
  );

  // Calculate remaining warehouse stock available for planning
  const getAvailablePcs = useCallback(
    (itemId: string) => {
      const item = items.find((i) => i.id === itemId);
      if (!item) return 0;
      const alreadyPlanned = planItems
        .filter((pi) => pi.itemId === itemId)
        .reduce((sum, pi) => sum + pi.qty, 0);
      return Math.max(0, item.warehouseOnHand - alreadyPlanned);
    },
    [items, planItems]
  );

  // Get branch name by id
  const branchNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const b of branches) map.set(b.id, b.name);
    return map;
  }, [branches]);

  // Short branch names for pills
  const shortBranchName = useCallback(
    (id: string) => {
      const name = branchNameMap.get(id) ?? "";
      // Shorten long names for pills
      if (name === "Manor Park") return "Manor";
      if (name === "Ocho Rios") return "Ocho Rios";
      return name;
    },
    [branchNameMap]
  );

  async function handleAddPlanItem(
    itemId: string,
    toLocationId: string,
    qtyPcs: number
  ) {
    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    setPlanItems((prev) => [
      ...prev,
      { id: tempId, itemId, toLocationId, qty: qtyPcs },
    ]);
    setPopoverItemId(null);

    const result = await addPlanItem(
      initialPlan.id,
      itemId,
      toLocationId,
      qtyPcs
    );
    if (result.error) {
      // Revert
      setPlanItems((prev) => prev.filter((pi) => pi.id !== tempId));
    } else if (result.item) {
      // Replace temp with real
      setPlanItems((prev) =>
        prev.map((pi) =>
          pi.id === tempId
            ? {
                id: result.item.id,
                itemId: result.item.item_id,
                toLocationId: result.item.to_location_id,
                qty: result.item.qty,
              }
            : pi
        )
      );
    }
  }

  async function handleRemovePlanItem(planItemId: string) {
    const removed = planItems.find((pi) => pi.id === planItemId);
    setPlanItems((prev) => prev.filter((pi) => pi.id !== planItemId));

    const result = await removePlanItem(planItemId);
    if (result.error && removed) {
      // Revert
      setPlanItems((prev) => [...prev, removed]);
    }
  }

  async function handleFinalize() {
    setBusy(true);
    const result = await finalizePlan(initialPlan.id);
    setBusy(false);
    if (result.error) {
      alert(result.error);
      return;
    }
    setPlanStatus("finalized");
  }

  async function handleRevertToDraft() {
    setBusy(true);
    const result = await revertPlanToDraft(initialPlan.id);
    setBusy(false);
    if (result.error) {
      alert(result.error);
      return;
    }
    setPlanStatus("draft");
    router.refresh();
  }

  function toggleCategory(name: string) {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  // Format count date for column headers
  function formatCountDate(dateStr: string | null) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  const totalPlanItems = planItems.length;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              isDraft
                ? "bg-amber-100 text-amber-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {isDraft ? "Draft" : "Finalized"}
          </span>
          {totalPlanItems > 0 && (
            <span className="text-sm text-gray-500">
              {totalPlanItems} delivery{totalPlanItems !== 1 ? " items" : " item"} planned
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {totalPlanItems > 0 && (
            <Link
              href={`/delivery-planner/sheet/${initialPlan.id}`}
              className="px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700"
            >
              Preview Delivery Sheet
            </Link>
          )}
          {isDraft && totalPlanItems > 0 && (
            <button
              onClick={handleFinalize}
              disabled={busy}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 disabled:opacity-50"
            >
              Finalize Plan
            </button>
          )}
          {!isDraft && userRole === "owner" && (
            <button
              onClick={handleRevertToDraft}
              disabled={busy}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 disabled:opacity-50"
            >
              Revert to Draft
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-80 px-4 py-2.5 pl-10 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[1100px]">
          <thead>
            <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="sticky left-0 z-10 bg-gray-50 text-left px-4 py-3 min-w-[180px]">
                Item
              </th>
              {branches.map((b) => (
                <th key={b.id} className="text-center px-2 py-3 min-w-[80px]">
                  <div>{b.name}</div>
                  {b.countDate && (
                    <div className="font-normal normal-case text-gray-400">
                      {formatCountDate(b.countDate)}
                    </div>
                  )}
                  {!b.countDate && (
                    <div className="font-normal normal-case text-gray-400">
                      No count
                    </div>
                  )}
                </th>
              ))}
              <th className="text-center px-2 py-3 min-w-[90px] bg-blue-50/50">
                Warehouse
              </th>
              <th className="text-left px-3 py-3 min-w-[200px] bg-brand-50/30">
                To Deliver
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredCategories.map((cat) => (
              <CategorySection
                key={cat.name}
                category={cat}
                branches={branches}
                branchNameMap={branchNameMap}
                shortBranchName={shortBranchName}
                getPlanItemsForItem={getPlanItemsForItem}
                collapsed={collapsedCategories.has(cat.name)}
                onToggle={() => toggleCategory(cat.name)}
                onAddClick={(itemId) => setPopoverItemId(itemId)}
                onRemovePlanItem={handleRemovePlanItem}
              />
            ))}
          </tbody>
        </table>

        {filteredCategories.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No items match your search.
          </div>
        )}
      </div>

      {/* Popover */}
      {popoverItemId && (
        <PlanItemPopover
          itemName={items.find((i) => i.id === popoverItemId)?.name ?? ""}
          baseUnit={
            items.find((i) => i.id === popoverItemId)?.baseUnit ?? "boxes"
          }
          pcsPerBox={
            items.find((i) => i.id === popoverItemId)?.pcsPerBox ?? 1
          }
          branches={branches}
          excludeBranchIds={getPlanItemsForItem(popoverItemId).map(
            (pi) => pi.toLocationId
          )}
          availablePcs={getAvailablePcs(popoverItemId)}
          onConfirm={(toLocationId, qtyPcs) =>
            handleAddPlanItem(popoverItemId, toLocationId, qtyPcs)
          }
          onClose={() => setPopoverItemId(null)}
        />
      )}
    </div>
  );
}

/* ---------- Category section ---------- */

function CategorySection({
  category,
  branches,
  branchNameMap,
  shortBranchName,
  getPlanItemsForItem,
  collapsed,
  onToggle,
  onAddClick,
  onRemovePlanItem,
}: {
  category: {
    name: string;
    label: string;
    className: string;
    items: PlannerItem[];
  };
  branches: PlannerBranch[];
  branchNameMap: Map<string, string>;
  shortBranchName: (id: string) => string;
  getPlanItemsForItem: (itemId: string) => PlannerPlanItem[];
  collapsed: boolean;
  onToggle: () => void;
  onAddClick: (itemId: string) => void;
  onRemovePlanItem: (planItemId: string) => void;
}) {
  const colSpan = branches.length + 3; // item + branches + warehouse + to-deliver

  return (
    <>
      {/* Category header */}
      <tr
        className="cursor-pointer hover:bg-gray-50"
        onClick={onToggle}
      >
        <td
          colSpan={colSpan}
          className="sticky left-0 z-10 bg-white px-4 py-2 border-t border-gray-100"
        >
          <div className="flex items-center gap-2">
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${
                collapsed ? "" : "rotate-90"
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
            <span
              className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${category.className}`}
            >
              {category.label}
            </span>
            <span className="text-xs text-gray-400">
              {category.items.length} items
            </span>
          </div>
        </td>
      </tr>

      {/* Item rows */}
      {!collapsed &&
        category.items.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            branches={branches}
            shortBranchName={shortBranchName}
            planItems={getPlanItemsForItem(item.id)}
            onAddClick={() => onAddClick(item.id)}
            onRemovePlanItem={onRemovePlanItem}
          />
        ))}
    </>
  );
}

/* ---------- Item row ---------- */

function ItemRow({
  item,
  branches,
  shortBranchName,
  planItems,
  onAddClick,
  onRemovePlanItem,
}: {
  item: PlannerItem;
  branches: PlannerBranch[];
  shortBranchName: (id: string) => string;
  planItems: PlannerPlanItem[];
  onAddClick: () => void;
  onRemovePlanItem: (planItemId: string) => void;
}) {
  return (
    <tr className="border-t border-gray-50 hover:bg-gray-50/50">
      {/* Item name (sticky) */}
      <td className="sticky left-0 z-10 bg-white px-4 py-2 text-sm font-medium text-gray-900 whitespace-nowrap">
        {item.name}
      </td>

      {/* Branch count columns */}
      {branches.map((branch) => {
        const count = item.branchCounts[branch.id];
        return (
          <td
            key={branch.id}
            className="text-center px-2 py-2 text-sm font-mono"
          >
            {count === null ? (
              <span className="text-gray-300">—</span>
            ) : count === 0 ? (
              <span className="text-danger-500 font-semibold">0</span>
            ) : (
              <span className="text-gray-700">
                {formatQty(count, item.baseUnit, item.pcsPerBox)}
              </span>
            )}
          </td>
        );
      })}

      {/* Warehouse on-hand */}
      <td className="text-center px-2 py-2 text-sm font-mono bg-blue-50/30">
        {item.warehouseOnHand === 0 ? (
          <span className="text-danger-500 font-semibold">0</span>
        ) : (
          <span className="text-gray-700 font-semibold">
            {formatQty(item.warehouseOnHand, item.baseUnit, item.pcsPerBox)}
          </span>
        )}
      </td>

      {/* To deliver column */}
      <td className="px-3 py-2 bg-brand-50/20">
        <div className="flex flex-wrap items-center gap-1">
          {planItems.map((pi) => (
            <span
              key={pi.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand-100 text-brand-700 text-xs font-medium rounded-full"
            >
              {shortBranchName(pi.toLocationId)}:{" "}
              {formatQty(pi.qty, item.baseUnit, item.pcsPerBox)}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemovePlanItem(pi.id);
                }}
                className="ml-0.5 hover:text-danger-600"
                aria-label="Remove"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </span>
          ))}
          <button
            onClick={onAddClick}
            className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-500 hover:bg-brand-100 hover:text-brand-600 transition-colors"
            aria-label="Add delivery"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );
}
