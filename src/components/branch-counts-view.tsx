"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
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
  // Actual dates per branch
  countDateTwoWeeksAgo: string | null;
  deliveryDateTwoWeeksAgo: string | null;
  countDateLastWeek: string | null;
  deliveryDateLastWeek: string | null;
  countDateThisWeek: string | null;
};

export type SundayDates = {
  twoWeeksAgo: string; // ISO date
  lastWeek: string;
  thisWeek: string;
};

function formatDateHeader(
  actualDate: string | null,
  fallbackIso: string
): string {
  if (actualDate) {
    const d = new Date(actualDate);
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }
  // Fallback: just month + day from the Sunday ISO date
  const d = new Date(fallbackIso + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

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

type ItemData = BranchCountData["items"][0];

function EditModal({
  item,
  onClose,
}: {
  item: ItemData;
  onClose: () => void;
}) {
  const hasBoxes = item.baseUnit === "boxes" && item.pcsPerBox > 1;
  const exactBoxes = hasBoxes ? item.qty / item.pcsPerBox : item.qty;
  const initialCases = hasBoxes && Number.isInteger(exactBoxes * 2)
    ? exactBoxes
    : hasBoxes
      ? Math.floor(exactBoxes)
      : item.qty;
  const initialLoose = hasBoxes && Number.isInteger(exactBoxes * 2)
    ? 0
    : hasBoxes
      ? item.qty - Math.floor(exactBoxes) * item.pcsPerBox
      : 0;

  const [cases, setCases] = useState(String(initialCases));
  const [loose, setLoose] = useState(String(initialLoose));
  const [saving, setSaving] = useState(false);

  const looseLabel =
    item.unit !== "pcs" && item.unit !== "boxes" ? item.unit : "pcs";

  async function handleSave() {
    if (!item.stockCountItemId) return;
    setSaving(true);
    const c = parseFloat(cases) || 0;
    const l = parseFloat(loose) || 0;
    const totalPcs = hasBoxes ? c * item.pcsPerBox + l : c;
    await updateStockCountItem(item.stockCountItemId, Math.max(0, totalPcs));
    setSaving(false);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-xl p-5 w-[280px] space-y-4">
        <div>
          <div className="font-semibold text-sm">{item.itemName}</div>
          <div className="text-xs text-gray-400 mt-0.5">Edit quantity</div>
        </div>

        <div className="flex items-center gap-2 justify-center">
          <div className="text-center">
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.5"
              value={cases}
              onChange={(e) => setCases(e.target.value)}
              className="w-16 px-2 py-2 text-center rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              autoFocus
            />
            <div className="text-xs text-gray-400 mt-1">
              {hasBoxes ? "cs" : item.baseUnit === "pcs" ? looseLabel : "boxes"}
            </div>
          </div>
          {hasBoxes && (
            <div className="text-center">
              <input
                type="number"
                inputMode="decimal"
                min={0}
                step="0.5"
                value={loose}
                onChange={(e) => setLoose(e.target.value)}
                className="w-16 px-2 py-2 text-center rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              />
              <div className="text-xs text-gray-400 mt-1">{looseLabel}</div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-gray-100 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({
  item,
  onClose,
}: {
  item: ItemData;
  onClose: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!item.stockCountItemId) return;
    setDeleting(true);
    await updateStockCountItem(item.stockCountItemId, 0);
    setDeleting(false);
    onClose();
  }

  const currentQty = formatQty(
    item.qty,
    item.baseUnit,
    item.pcsPerBox,
    item.unit !== "pcs" && item.unit !== "boxes" ? item.unit : undefined
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-xl p-5 w-[280px] space-y-4">
        <div>
          <div className="font-semibold text-sm">{item.itemName}</div>
          <div className="text-sm text-gray-500 mt-1">
            Set quantity to 0? Currently: <span className="font-mono font-semibold">{currentQty}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 py-2 bg-danger-600 text-white text-sm font-semibold rounded-xl hover:bg-danger-700 disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-gray-100 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

type BranchDates = {
  countDateTwoWeeksAgo: string | null;
  deliveryDateTwoWeeksAgo: string | null;
  countDateLastWeek: string | null;
  deliveryDateLastWeek: string | null;
  countDateThisWeek: string | null;
};

function ItemsTable({
  items,
  editable,
  branchDates,
  sundayDates,
}: {
  items: BranchCountData["items"];
  editable: boolean;
  branchDates: BranchDates;
  sundayDates: SundayDates;
}) {
  const [search, setSearch] = useState("");
  const [editingItem, setEditingItem] = useState<ItemData | null>(null);
  const [deletingItem, setDeletingItem] = useState<ItemData | null>(null);

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

  // Compute column headers from actual dates
  const headers = {
    countTwoWeeksAgo: formatDateHeader(
      branchDates.countDateTwoWeeksAgo,
      sundayDates.twoWeeksAgo
    ),
    delivTwoWeeksAgo: formatDateHeader(
      branchDates.deliveryDateTwoWeeksAgo,
      sundayDates.twoWeeksAgo
    ),
    countLastWeek: formatDateHeader(
      branchDates.countDateLastWeek,
      sundayDates.lastWeek
    ),
    delivLastWeek: formatDateHeader(
      branchDates.deliveryDateLastWeek,
      sundayDates.lastWeek
    ),
    countThisWeek: formatDateHeader(
      branchDates.countDateThisWeek,
      sundayDates.thisWeek
    ),
  };

  return (
    <div className="space-y-3">
      {editingItem && (
        <EditModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
        />
      )}
      {deletingItem && (
        <DeleteModal
          item={deletingItem}
          onClose={() => setDeletingItem(null)}
        />
      )}

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search items..."
        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
      />

      {/* Column headers — desktop only */}
      <div className="hidden sm:grid grid-cols-[1fr_repeat(5,80px)_60px] gap-x-1 px-2 pb-1 border-b border-gray-200">
        <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">
          Item
        </div>
        <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wide text-right">
          Count {headers.countTwoWeeksAgo}
        </div>
        <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wide text-right">
          Deliv. {headers.delivTwoWeeksAgo}
        </div>
        <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wide text-right">
          Count {headers.countLastWeek}
        </div>
        <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wide text-right">
          Deliv. {headers.delivLastWeek}
        </div>
        <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wide text-right">
          Count {headers.countThisWeek}
        </div>
        <div />
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
              {catItems.map((item) => (
                <div key={item.itemId} className="py-2 px-2">
                  {/* Desktop: grid layout with all columns */}
                  <div className="hidden sm:grid grid-cols-[1fr_repeat(5,80px)_60px] gap-x-1 items-center">
                    <Link
                      href={`/items/${item.itemId}/edit`}
                      className={`text-sm truncate hover:text-brand-600 hover:underline ${
                        item.qty === 0 &&
                        item.countLastWeek === null &&
                        item.countTwoWeeksAgo === null
                          ? "text-gray-300"
                          : ""
                      }`}
                    >
                      {item.itemName}
                    </Link>
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
                    <div className="text-right">
                      <span
                        className={`text-xs font-mono font-semibold ${item.qty === 0 ? "text-gray-300" : ""}`}
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
                    </div>
                    <div className="flex items-center justify-end gap-0.5">
                      {editable && item.stockCountItemId && (
                        <>
                          <button
                            onClick={() => setEditingItem(item)}
                            className="p-1 text-gray-400 hover:text-brand-600 transition-colors"
                            title="Edit quantity"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeletingItem(item)}
                            className="p-1 text-gray-400 hover:text-danger-500 transition-colors"
                            title="Delete (set to 0)"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Mobile: stacked layout */}
                  <div className="sm:hidden">
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/items/${item.itemId}/edit`}
                        className={`text-sm flex-1 truncate hover:text-brand-600 hover:underline ${item.qty === 0 ? "text-gray-300" : ""}`}
                      >
                        {item.itemName}
                      </Link>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-sm font-mono font-semibold ${item.qty === 0 ? "text-gray-300" : ""}`}
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
                        {editable && item.stockCountItemId && (
                          <span className="flex items-center gap-0.5">
                            <button
                              onClick={() => setEditingItem(item)}
                              className="p-1 text-gray-400 hover:text-brand-600 transition-colors"
                              title="Edit quantity"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setDeletingItem(item)}
                              className="p-1 text-gray-400 hover:text-danger-500 transition-colors"
                              title="Delete (set to 0)"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                              </svg>
                            </button>
                          </span>
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
                            C {headers.countTwoWeeksAgo}:{" "}
                            {item.countTwoWeeksAgo}
                          </span>
                        )}
                        {item.deliveredTwoWeeksAgo !== null && (
                          <span>
                            D {headers.delivTwoWeeksAgo}:{" "}
                            {item.deliveredTwoWeeksAgo}
                          </span>
                        )}
                        {item.countLastWeek !== null && (
                          <span>
                            C {headers.countLastWeek}: {item.countLastWeek}
                          </span>
                        )}
                        {item.deliveredLastWeek !== null && (
                          <span>
                            D {headers.delivLastWeek}:{" "}
                            {item.deliveredLastWeek}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DeleteCountButton({ countId }: { countId: string }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    await deleteStockCount(countId);
    setShowConfirm(false);
    setDeleting(false);
  }

  return (
    <div className="px-4 pb-3 flex justify-end">
      {showConfirm ? (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Delete this count?</span>
          <button
            onClick={handleDelete}
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
  );
}

export function BranchCountsView({
  branches,
  allBranches,
  currentBranch,
  sundayDates,
  userRole,
}: {
  branches: BranchCountData[];
  allBranches: Array<{ id: string; name: string }>;
  currentBranch?: string;
  sundayDates: SundayDates;
  userRole?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set());

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

        const branchDates: BranchDates = {
          countDateTwoWeeksAgo: branch.countDateTwoWeeksAgo,
          deliveryDateTwoWeeksAgo: branch.deliveryDateTwoWeeksAgo,
          countDateLastWeek: branch.countDateLastWeek,
          deliveryDateLastWeek: branch.deliveryDateLastWeek,
          countDateThisWeek: branch.countDateThisWeek,
        };

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

            {/* Delete count button — owner/manager only */}
            {isOpen && branch.countId && (userRole === "owner" || userRole === "manager") && (
              <DeleteCountButton
                countId={branch.countId}
              />
            )}

            {isOpen && (
              <div className="border-t border-gray-100 px-4 py-3">
                <ItemsTable
                  items={branch.items}
                  editable
                  branchDates={branchDates}
                  sundayDates={sundayDates}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
