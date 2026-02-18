"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { CategoryTag, CATEGORY_CONFIG } from "@/components/category-tag";
import { formatQty } from "@/lib/unit-utils";
import { isCountDay, getRecentSunday, toISODate } from "@/lib/date-utils";
import {
  submitStockCount,
  getExistingCount,
  updateExistingCount,
} from "./actions";
import { signOut } from "@/app/login/actions";
import type { Item, Location } from "@/lib/database.types";

type Step = "branch" | "items" | "review" | "success";

type ExistingCount = {
  id: string;
  countedBy: string;
  createdAt: string;
  editable: boolean;
  items: Array<{ item_id: string; qty: number }>;
};

export default function CountPage() {
  const [step, setStep] = useState<Step>("branch");
  const [branches, setBranches] = useState<Location[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [counterName, setCounterName] = useState("");
  const [caseQty, setCaseQty] = useState<Map<string, number>>(new Map());
  const [looseQty, setLooseQty] = useState<Map<string, number>>(new Map());
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingCount, setExistingCount] = useState<ExistingCount | null>(
    null
  );
  const [checkingExisting, setCheckingExisting] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase
        .from("locations")
        .select("*")
        .eq("is_active", true)
        .eq("type", "branch")
        .order("name"),
      supabase
        .from("items")
        .select("*")
        .eq("is_active", true)
        .order("category")
        .order("name"),
    ]).then(([locRes, itemRes]) => {
      if (locRes.data) setBranches(locRes.data);
      if (itemRes.data) setItems(itemRes.data);
    });
  }, []);

  const selectedBranchName = branches.find(
    (l) => l.id === selectedBranch
  )?.name;

  const categories = useMemo(() => {
    const cats = new Set(items.map((i) => i.category).filter(Boolean));
    return Array.from(cats) as string[];
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedCategory && item.category !== selectedCategory) return false;
      if (search) {
        const q = search.toLowerCase();
        return item.name.toLowerCase().includes(q);
      }
      return true;
    });
  }, [items, search, selectedCategory]);

  const itemsWithQty = useMemo(() => {
    return items.filter((item) => {
      const cases = caseQty.get(item.id) ?? 0;
      const loose = looseQty.get(item.id) ?? 0;
      return cases > 0 || loose > 0;
    });
  }, [items, caseQty, looseQty]);

  // Group items by category for review
  const reviewGroups = useMemo(() => {
    const groups = new Map<string, typeof itemsWithQty>();
    for (const item of itemsWithQty) {
      const cat = item.category ?? "Other";
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat)!.push(item);
    }
    return groups;
  }, [itemsWithQty]);

  function handleMapChange(
    setter: typeof setCaseQty,
    itemId: string,
    value: string
  ) {
    const num = parseInt(value, 10);
    setter((prev) => {
      const next = new Map(prev);
      if (isNaN(num) || value === "") {
        next.delete(itemId);
      } else {
        next.set(itemId, Math.max(0, num));
      }
      return next;
    });
  }

  async function handleNext() {
    if (!selectedBranch || !counterName.trim()) return;

    setCheckingExisting(true);
    setError(null);

    const weekOf = toISODate(getRecentSunday(new Date()));
    const result = await getExistingCount(selectedBranch, weekOf);

    setCheckingExisting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.count) {
      if (!result.count.editable) {
        // Past 12 hours — locked
        setError(
          "A count was already submitted for this branch this week and the 12-hour edit window has passed. It can no longer be edited."
        );
        return;
      }

      // Within 12 hours — load for editing
      setExistingCount(result.count);
      setCounterName(result.count.countedBy || counterName);

      // Pre-fill quantities from existing count
      const newCaseQty = new Map<string, number>();
      const newLooseQty = new Map<string, number>();
      for (const ci of result.count.items) {
        const item = items.find((i) => i.id === ci.item_id);
        if (!item || ci.qty === 0) continue;
        if (item.base_unit === "boxes" && item.pcs_per_box > 1) {
          newCaseQty.set(ci.item_id, Math.floor(ci.qty / item.pcs_per_box));
          const remainder = ci.qty % item.pcs_per_box;
          if (remainder > 0) newLooseQty.set(ci.item_id, remainder);
        } else {
          newCaseQty.set(ci.item_id, ci.qty);
        }
      }
      setCaseQty(newCaseQty);
      setLooseQty(newLooseQty);
    } else {
      // No existing count — fresh form
      setExistingCount(null);
    }

    setStep("items");
  }

  async function handleSubmit() {
    if (!selectedBranch) return;

    setLoading(true);
    setError(null);

    const weekOf = toISODate(getRecentSunday(new Date()));
    const allItems = items.map((item) => {
      const cases = caseQty.get(item.id) ?? 0;
      const loose = looseQty.get(item.id) ?? 0;
      // Convert to total pcs for storage
      const pcsQty =
        item.base_unit === "boxes" && item.pcs_per_box > 1
          ? cases * item.pcs_per_box + loose
          : cases;
      return { itemId: item.id, qty: pcsQty };
    });

    let result;
    if (existingCount) {
      result = await updateExistingCount({
        countId: existingCount.id,
        countedBy: counterName,
        items: allItems,
      });
    } else {
      result = await submitStockCount({
        locationId: selectedBranch,
        countedBy: counterName,
        weekOf,
        items: allItems,
      });
    }

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setStep("success");
      setLoading(false);
    }
  }

  function formatTimeAgo(dateStr: string): string {
    const hours = Math.floor(
      (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60)
    );
    if (hours < 1) return "less than an hour ago";
    if (hours === 1) return "1 hour ago";
    return `${hours} hours ago`;
  }

  function formatEditDeadline(dateStr: string): string {
    const deadline = new Date(
      new Date(dateStr).getTime() + 12 * 60 * 60 * 1000
    );
    return deadline.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  // Day restriction check — temporarily disabled for testing
  // if (!isCountDay()) {
  //   return (
  //     <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
  //       <div className="text-5xl">📅</div>
  //       <h2 className="text-xl font-bold">Not a count day</h2>
  //       <p className="text-gray-500 max-w-sm">
  //         Stock counts can be submitted on <strong>Sundays</strong> and{" "}
  //         <strong>Mondays</strong>. Please come back then.
  //       </p>
  //     </div>
  //   );
  // }

  // Success screen
  if (step === "success") {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-6">
        <div className="text-6xl">✅</div>
        <h2 className="text-2xl font-bold">
          {existingCount ? "Stock Count Updated!" : "Stock Count Submitted!"}
        </h2>
        <p className="text-gray-500">
          {itemsWithQty.length} item{itemsWithQty.length !== 1 ? "s" : ""}{" "}
          counted at {selectedBranchName}
        </p>
        <p className="text-sm text-gray-400">Counted by {counterName}</p>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setStep("branch");
              setSelectedBranch(null);
              setCounterName("");
              setCaseQty(new Map());
              setLooseQty(new Map());
              setSearch("");
              setSelectedCategory(null);
              setError(null);
              setExistingCount(null);
            }}
            className="px-6 py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700"
          >
            Start New Count
          </button>
          <button
            onClick={() => signOut()}
            className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Weekly Stock Count</h1>
        <p className="text-gray-500 mt-1">
          Count the items at your branch
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex gap-2">
        {(["branch", "items", "review"] as Step[]).map((s, i) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full ${
              (["branch", "items", "review"] as Step[]).indexOf(step) >= i
                ? "bg-brand-500"
                : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      {error && (
        <div className="bg-danger-50 text-danger-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Step 1: Select branch + enter name */}
      {step === "branch" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Select your branch</h2>

          <div className="grid grid-cols-2 gap-3">
            {branches.map((branch) => (
              <button
                key={branch.id}
                onClick={() => setSelectedBranch(branch.id)}
                className={`p-4 rounded-xl border-2 text-left font-medium transition-colors ${
                  selectedBranch === branch.id
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                {branch.name}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your name
            </label>
            <input
              type="text"
              value={counterName}
              onChange={(e) => setCounterName(e.target.value)}
              placeholder="e.g. Keisha"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <button
            onClick={handleNext}
            disabled={!selectedBranch || !counterName.trim() || checkingExisting}
            className="w-full py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {checkingExisting ? "Checking..." : "Next"}
          </button>
        </div>
      )}

      {/* Step 2: Enter quantities */}
      {step === "items" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Count items at {selectedBranchName}
            </h2>
            <button
              onClick={() => {
                setStep("branch");
                setExistingCount(null);
                setCaseQty(new Map());
                setLooseQty(new Map());
              }}
              className="text-sm text-brand-600 font-medium"
            >
              Change branch
            </button>
          </div>

          {/* Edit banner */}
          {existingCount && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-sm">
              A count was already submitted{" "}
              {formatTimeAgo(existingCount.createdAt)} by{" "}
              <strong>{existingCount.countedBy}</strong>. You can edit it until{" "}
              <strong>{formatEditDeadline(existingCount.createdAt)}</strong>.
            </div>
          )}

          {/* Search */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items..."
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />

          {/* Category filter pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === null
                  ? "bg-gray-800 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All
            </button>
            {categories.map((cat) => {
              const config = CATEGORY_CONFIG[cat];
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() =>
                    setSelectedCategory(isActive ? null : cat)
                  }
                  className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    isActive
                      ? config?.className ?? "bg-gray-800 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {config?.label ?? cat}
                </button>
              );
            })}
          </div>

          {/* Item list */}
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {filteredItems.map((item) => {
              const hasLoose =
                item.base_unit === "boxes" && item.pcs_per_box > 1;
              const looseLabel = item.unit || "pcs";
              return (
                <div
                  key={item.id}
                  className="px-4 py-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="font-medium truncate">
                      {item.name}
                    </span>
                    <CategoryTag category={item.category} />
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={caseQty.get(item.id) ?? ""}
                      onChange={(e) =>
                        handleMapChange(setCaseQty, item.id, e.target.value)
                      }
                      placeholder="0"
                      className="w-14 px-2 py-1.5 text-center rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                    />
                    <span className="text-xs text-gray-400">
                      {item.base_unit === "pcs" ? (item.unit || "pcs") : "cs"}
                    </span>
                    {hasLoose && (
                      <>
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          value={looseQty.get(item.id) ?? ""}
                          onChange={(e) =>
                            handleMapChange(
                              setLooseQty,
                              item.id,
                              e.target.value
                            )
                          }
                          placeholder="0"
                          className="w-14 px-2 py-1.5 text-center rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                        />
                        <span className="text-xs text-gray-400">
                          {looseLabel}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => setStep("review")}
            className="w-full py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700"
          >
            Review Count ({itemsWithQty.length} items)
          </button>
        </div>
      )}

      {/* Step 3: Review */}
      {step === "review" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Review & Submit</h2>

          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Branch</span>
              <span className="font-medium">{selectedBranchName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Counted by</span>
              <span className="font-medium">{counterName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Items with stock</span>
              <span className="font-medium">{itemsWithQty.length}</span>
            </div>
            {existingCount && (
              <div className="flex justify-between">
                <span className="text-gray-500">Mode</span>
                <span className="font-medium text-amber-600">
                  Editing existing count
                </span>
              </div>
            )}
          </div>

          {itemsWithQty.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              No items counted. All items will be recorded as 0.
            </div>
          ) : (
            <div className="space-y-4">
              {Array.from(reviewGroups.entries()).map(([cat, groupItems]) => (
                <div key={cat}>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    {cat}
                  </h3>
                  <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                    {groupItems.map((item) => {
                      const cases = caseQty.get(item.id) ?? 0;
                      const loose = looseQty.get(item.id) ?? 0;
                      const hasLoose =
                        item.base_unit === "boxes" && item.pcs_per_box > 1;
                      const totalPcs = hasLoose
                        ? cases * item.pcs_per_box + loose
                        : cases;
                      return (
                        <div
                          key={item.id}
                          className="px-4 py-2.5 flex justify-between"
                        >
                          <span className="text-sm">{item.name}</span>
                          <span className="text-sm font-mono font-semibold">
                            {formatQty(
                              totalPcs,
                              item.base_unit,
                              item.pcs_per_box,
                              item.unit
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep("items")}
              className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 disabled:opacity-50"
            >
              {loading
                ? existingCount
                  ? "Updating..."
                  : "Submitting..."
                : existingCount
                  ? "Update Count"
                  : "Submit Count"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
