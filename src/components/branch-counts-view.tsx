"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatQty } from "@/lib/unit-utils";
import { CATEGORY_CONFIG } from "@/components/category-tag";
import {
  deleteStockCount,
  updateStockCountItem,
} from "@/app/(authenticated)/branch-counts/actions";

export type BranchCountData = {
  locationId: string;
  locationName: string;
  countId: string | null;
  countedBy: string | null;
  countedAt: string | null;
  hasCount: boolean;
  hasPastData: boolean;
  items: Array<{
    stockCountItemId: string | null;
    itemId: string;
    itemName: string;
    category: string | null;
    qty: number;
    baseUnit: "boxes" | "pcs";
    pcsPerBox: number;
    unit: string;
    countTwoWeeksAgo: number | null;
    deliveredTwoWeeksAgo: number | null;
    countLastWeek: number | null;
    deliveredLastWeek: number | null;
  }>;
};

export type WeekHeaders = {
  twoWeeksAgo: string;
  lastWeek: string;
  thisWeek: string;
};

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-5 h-5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 8.25l-7.5 7.5-7.5-7.5"
      />
    </svg>
  );
}

function QtyCell({
  qty,
  baseUnit,
  pcsPerBox,
  unit,
}: {
  qty: number | null;
  baseUnit: "boxes" | "pcs";
  pcsPerBox: number;
  unit: string;
}) {
  if (qty === null) {
    return <span className="text-xs text-gray-300">&mdash;</span>;
  }
  if (qty === 0) {
    return <span className="text-xs text-gray-300">0</span>;
  }
  return (
    <span className="text-xs font-mono font-semibold">
      {formatQty(
        qty,
        baseUnit,
        pcsPerBox,
        unit !== "pcs" && unit !== "boxes" ? unit : undefined
      )}
    </span>
  );
}

function ItemsTable({
  items,
  editable,
  weekHeaders,
}: {
  items: BranchCountData["items"];
  editable: boolean;
  weekHeaders: WeekHeaders;
}) {
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  const filteredItems = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter((i) => i.itemName.toLowerCase().includes(q));
  }, [items, search]);

  const groupedItems = useMemo(() => {
    const groups = new Map<string, typeof filteredItems>();
    for (const item of filteredItems) {
      const cat = item.category ?? "Other";
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat)!.push(item);
    }
    return groups;
  }, [filteredItems]);

  async function handleSave(
    stockCountItemId: string,
    baseUnit: "boxes" | "pcs",
    pcsPerBox: number
  ) {
    setSaving(true);
    const num = parseInt(editValue, 10);
    const qty = isNaN(num) ? 0 : Math.max(0, num);
    const pcsQty =
      baseUnit === "boxes" && pcsPerBox > 1 ? qty * pcsPerBox : qty;
    await updateStockCountItem(stockCountItemId, pcsQty);
    setEditingId(null);
    setSaving(false);
  }

  async function handleZero(stockCountItemId: string) {
    setSaving(true);
    await updateStockCountItem(stockCountItemId, 0);
    setSaving(false);
  }

  function startEdit(item: BranchCountData["items"][0]) {
    if (!item.stockCountItemId) return;
    const displayQty =
      item.baseUnit === "boxes" && item.pcsPerBox > 1
        ? Math.floor(item.qty / item.pcsPerBox)
        : item.qty;
    setEditValue(String(displayQty));
    setEditingId(item.stockCountItemId);
  }

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search items..."
        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
      />

      {/* Column headers — desktop only */}
      <div className="hidden sm:grid grid-cols-[1fr_repeat(5,80px)] gap-x-1 px-2 pb-1 border-b border-gray-200">
        <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">
          Item
        </div>
        <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wide text-right">
          Count {weekHeaders.twoWeeksAgo}
        </div>
        <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wide text-right">
          Deliv. {weekHeaders.twoWeeksAgo}
        </div>
        <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wide text-right">
          Count {weekHeaders.lastWeek}
        </div>
        <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wide text-right">
          Deliv. {weekHeaders.lastWeek}
        </div>
        <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wide text-right">
          Count {weekHeaders.thisWeek}
        </div>
      </div>

      {Array.from(groupedItems.entries()).map(([cat, catItems]) => {
        const config = CATEGORY_CONFIG[cat];
        return (
          <div key={cat}>
            <div
              className={`px-4 py-2 rounded-lg text-sm font-bold ${config?.className ?? "bg-gray-100 text-gray-600"}`}
            >
              {config?.label ?? cat}
            </div>
            <div className="divide-y divide-gray-50">
              {catItems.map((item) => {
                const isEditing = editingId === item.stockCountItemId;
                return (
                  <div key={item.itemId} className="py-2 px-2">
                    {/* Desktop: grid layout with all columns */}
                    <div className="hidden sm:grid grid-cols-[1fr_repeat(5,80px)] gap-x-1 items-center">
                      <span
                        className={`text-sm truncate ${
                          item.qty === 0 &&
                          item.countLastWeek === null &&
                          item.countTwoWeeksAgo === null
                            ? "text-gray-300"
                            : ""
                        }`}
                      >
                        {item.itemName}
                      </span>
                      <div className="text-right">
                        <QtyCell
                          qty={item.countTwoWeeksAgo}
                          baseUnit={item.baseUnit}
                          pcsPerBox={item.pcsPerBox}
                          unit={item.unit}
                        />
                      </div>
                      <div className="text-right">
                        <QtyCell
                          qty={item.deliveredTwoWeeksAgo}
                          baseUnit={item.baseUnit}
                          pcsPerBox={item.pcsPerBox}
                          unit={item.unit}
                        />
                      </div>
                      <div className="text-right">
                        <QtyCell
                          qty={item.countLastWeek}
                          baseUnit={item.baseUnit}
                          pcsPerBox={item.pcsPerBox}
                          unit={item.unit}
                        />
                      </div>
                      <div className="text-right">
                        <QtyCell
                          qty={item.deliveredLastWeek}
                          baseUnit={item.baseUnit}
                          pcsPerBox={item.pcsPerBox}
                          unit={item.unit}
                        />
                      </div>
                      <div className="text-right flex items-center justify-end gap-1">
                        {isEditing && item.stockCountItemId ? (
                          <>
                            <input
                              type="number"
                              inputMode="numeric"
                              min={0}
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-14 px-1 py-0.5 text-center rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs"
                              autoFocus
                            />
                            <button
                              onClick={() =>
                                handleSave(
                                  item.stockCountItemId!,
                                  item.baseUnit,
                                  item.pcsPerBox
                                )
                              }
                              disabled={saving}
                              className="text-[10px] px-1.5 py-0.5 bg-brand-600 text-white rounded hover:bg-brand-700 disabled:opacity-50"
                            >
                              OK
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded hover:bg-gray-200"
                            >
                              X
                            </button>
                          </>
                        ) : (
                          <>
                            <span
                              className={`text-xs font-mono font-semibold ${
                                editable && item.stockCountItemId
                                  ? "cursor-pointer hover:text-brand-600"
                                  : ""
                              } ${item.qty === 0 ? "text-gray-300" : ""}`}
                              onClick={() => editable && startEdit(item)}
                            >
                              {item.qty === 0
                                ? "0"
                                : formatQty(
                                    item.qty,
                                    item.baseUnit,
                                    item.pcsPerBox,
                                    item.unit !== "pcs" &&
                                      item.unit !== "boxes"
                                      ? item.unit
                                      : undefined
                                  )}
                            </span>
                            {editable &&
                              item.stockCountItemId &&
                              item.qty > 0 && (
                                <button
                                  onClick={() =>
                                    handleZero(item.stockCountItemId!)
                                  }
                                  disabled={saving}
                                  className="text-gray-300 hover:text-danger-500 transition-colors disabled:opacity-50"
                                  title="Set to 0"
                                >
                                  <svg
                                    className="w-3.5 h-3.5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2}
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M6 18L18 6M6 6l12 12"
                                    />
                                  </svg>
                                </button>
                              )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Mobile: stacked layout */}
                    <div className="sm:hidden">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-sm flex-1 truncate ${item.qty === 0 ? "text-gray-300" : ""}`}
                        >
                          {item.itemName}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {isEditing && item.stockCountItemId ? (
                            <>
                              <input
                                type="number"
                                inputMode="numeric"
                                min={0}
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-14 px-1 py-0.5 text-center rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs"
                                autoFocus
                              />
                              <button
                                onClick={() =>
                                  handleSave(
                                    item.stockCountItemId!,
                                    item.baseUnit,
                                    item.pcsPerBox
                                  )
                                }
                                disabled={saving}
                                className="text-[10px] px-1.5 py-0.5 bg-brand-600 text-white rounded hover:bg-brand-700 disabled:opacity-50"
                              >
                                OK
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded hover:bg-gray-200"
                              >
                                X
                              </button>
                            </>
                          ) : (
                            <>
                              <span
                                className={`text-sm font-mono font-semibold ${
                                  editable && item.stockCountItemId
                                    ? "cursor-pointer hover:text-brand-600"
                                    : ""
                                } ${item.qty === 0 ? "text-gray-300" : ""}`}
                                onClick={() => editable && startEdit(item)}
                              >
                                {item.qty === 0
                                  ? "0"
                                  : formatQty(
                                      item.qty,
                                      item.baseUnit,
                                      item.pcsPerBox,
                                      item.unit !== "pcs" &&
                                        item.unit !== "boxes"
                                        ? item.unit
                                        : undefined
                                    )}
                              </span>
                              {editable &&
                                item.stockCountItemId &&
                                item.qty > 0 && (
                                  <button
                                    onClick={() =>
                                      handleZero(item.stockCountItemId!)
                                    }
                                    disabled={saving}
                                    className="text-gray-300 hover:text-danger-500 transition-colors disabled:opacity-50"
                                    title="Set to 0"
                                  >
                                    <svg
                                      className="w-3.5 h-3.5"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      strokeWidth={2}
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M6 18L18 6M6 6l12 12"
                                      />
                                    </svg>
                                  </button>
                                )}
                            </>
                          )}
                        </div>
                      </div>
                      {/* Past data on mobile */}
                      {(item.countTwoWeeksAgo !== null ||
                        item.deliveredTwoWeeksAgo !== null ||
                        item.countLastWeek !== null ||
                        item.deliveredLastWeek !== null) && (
                        <div className="flex gap-3 mt-1 text-[10px] text-gray-400">
                          {item.countTwoWeeksAgo !== null && (
                            <span>
                              C{weekHeaders.twoWeeksAgo}:{" "}
                              {item.countTwoWeeksAgo}
                            </span>
                          )}
                          {item.deliveredTwoWeeksAgo !== null && (
                            <span>
                              D{weekHeaders.twoWeeksAgo}:{" "}
                              {item.deliveredTwoWeeksAgo}
                            </span>
                          )}
                          {item.countLastWeek !== null && (
                            <span>
                              C{weekHeaders.lastWeek}: {item.countLastWeek}
                            </span>
                          )}
                          {item.deliveredLastWeek !== null && (
                            <span>
                              D{weekHeaders.lastWeek}:{" "}
                              {item.deliveredLastWeek}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function BranchCountsView({
  branches,
  allBranches,
  currentBranch,
  weekHeaders,
}: {
  branches: BranchCountData[];
  allBranches: Array<{ id: string; name: string }>;
  currentBranch?: string;
  weekHeaders: WeekHeaders;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  function toggle(key: string) {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function handleBranchFilter(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("branch", value);
    } else {
      params.delete("branch");
    }
    router.push(`/branch-counts?${params.toString()}`);
  }

  async function handleDeleteCount(countId: string) {
    setDeleting(true);
    await deleteStockCount(countId);
    setShowConfirm(false);
    setDeleting(false);
  }

  const filteredBranches = currentBranch
    ? branches.filter((b) => b.locationId === currentBranch)
    : branches;

  const isSingleBranch = !!currentBranch;

  return (
    <div className="space-y-4">
      {/* Tab-style branch filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <button
          onClick={() => handleBranchFilter("")}
          className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            !currentBranch
              ? "bg-gray-800 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          All
        </button>
        {allBranches.map((b) => (
          <button
            key={b.id}
            onClick={() => handleBranchFilter(b.id)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              currentBranch === b.id
                ? "bg-gray-800 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {b.name}
          </button>
        ))}
      </div>

      {/* Branch cards */}
      {filteredBranches.map((branch) => {
        const isOpen = isSingleBranch || openKeys.has(branch.locationId);
        const itemsInStock = branch.items.filter((i) => i.qty > 0).length;

        if (!branch.hasCount && !branch.hasPastData) {
          return (
            <div
              key={branch.locationId}
              className="bg-white rounded-xl border border-gray-200 px-4 py-4"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-lg">
                  {branch.locationName}
                </span>
                <span className="text-sm text-gray-400">
                  No count submitted this week
                </span>
              </div>
            </div>
          );
        }

        const countDate = branch.countedAt
          ? new Date(branch.countedAt).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })
          : "";

        return (
          <div
            key={branch.locationId}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden"
          >
            <button
              onClick={() => !isSingleBranch && toggle(branch.locationId)}
              className={`w-full px-4 py-4 flex items-center justify-between text-left ${
                !isSingleBranch
                  ? "hover:bg-gray-50 transition-colors cursor-pointer"
                  : "cursor-default"
              }`}
            >
              <div>
                <div className="font-semibold text-lg">
                  {branch.locationName}
                </div>
                <div className="text-sm text-gray-400 mt-0.5">
                  {branch.hasCount ? (
                    <>
                      Counted by {branch.countedBy} &middot; {countDate}{" "}
                      &middot; {itemsInStock} item
                      {itemsInStock !== 1 ? "s" : ""} in stock
                    </>
                  ) : (
                    "No count this week — showing historical data"
                  )}
                </div>
              </div>
              {!isSingleBranch && <ChevronIcon open={isOpen} />}
            </button>

            {/* Delete count button — single branch only */}
            {isSingleBranch && branch.countId && (
              <div className="px-4 pb-3 flex justify-end">
                {showConfirm ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      Delete this count?
                    </span>
                    <button
                      onClick={() => handleDeleteCount(branch.countId!)}
                      disabled={deleting}
                      className="text-xs px-3 py-1.5 bg-danger-600 text-white rounded-lg hover:bg-danger-700 disabled:opacity-50"
                    >
                      {deleting ? "Deleting..." : "Yes, delete"}
                    </button>
                    <button
                      onClick={() => setShowConfirm(false)}
                      className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowConfirm(true)}
                    className="text-xs px-3 py-1.5 text-danger-600 border border-danger-200 rounded-lg hover:bg-danger-50"
                  >
                    Delete Count
                  </button>
                )}
              </div>
            )}

            {isOpen && (
              <div className="border-t border-gray-100 px-4 py-3">
                <ItemsTable
                  items={branch.items}
                  editable={isSingleBranch}
                  weekHeaders={weekHeaders}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
