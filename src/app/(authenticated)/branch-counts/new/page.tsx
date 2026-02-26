"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CategoryTag, CATEGORY_CONFIG } from "@/components/category-tag";
import { formatQty } from "@/lib/unit-utils";
import { getRecentSunday, toISODate } from "@/lib/date-utils";
import { useUser } from "@/lib/context/user-context";
import { submitManagerStockCount } from "@/app/(authenticated)/branch-counts/actions";
import type { Item, Location } from "@/lib/database.types";

type Step = "branch" | "items" | "review" | "success";

export default function NewBranchCountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile } = useUser();
  const preselectedBranch = searchParams.get("branch");

  const [step, setStep] = useState<Step>(preselectedBranch ? "items" : "branch");
  const [branches, setBranches] = useState<Location[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(
    preselectedBranch
  );
  const [counterName, setCounterName] = useState(
    profile.full_name ?? ""
  );
  const [caseQty, setCaseQty] = useState<Map<string, number>>(new Map());
  const [looseQty, setLooseQty] = useState<Map<string, number>>(new Map());
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    const num = parseFloat(value);
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

  async function handleSubmit() {
    if (!selectedBranch) return;

    setLoading(true);
    setError(null);

    const weekOf = toISODate(getRecentSunday(new Date()));
    const allItems = items.map((item) => {
      const cases = caseQty.get(item.id) ?? 0;
      const loose = looseQty.get(item.id) ?? 0;
      const pcsQty =
        item.base_unit === "boxes" && item.pcs_per_box > 1
          ? cases * item.pcs_per_box + loose
          : cases;
      return { itemId: item.id, qty: pcsQty };
    });

    const result = await submitManagerStockCount({
      locationId: selectedBranch,
      countedBy: counterName,
      weekOf,
      items: allItems,
    });

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setStep("success");
      setLoading(false);
    }
  }

  // Success screen
  if (step === "success") {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-6">
        <div className="text-6xl">✅</div>
        <h2 className="text-2xl font-bold">Stock Count Submitted!</h2>
        <p className="text-gray-500">
          {itemsWithQty.length} item{itemsWithQty.length !== 1 ? "s" : ""}{" "}
          counted at {selectedBranchName}
        </p>
        <p className="text-sm text-gray-400">Counted by {counterName}</p>
        <div className="flex gap-3">
          <button
            onClick={() => router.push("/branch-counts")}
            className="px-6 py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700"
          >
            Back to Branch Counts
          </button>
          <button
            onClick={() => {
              setStep("branch");
              setSelectedBranch(null);
              setCaseQty(new Map());
              setLooseQty(new Map());
              setSearch("");
              setSelectedCategory(null);
              setError(null);
            }}
            className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200"
          >
            Add Another Count
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Add Branch Count</h1>
        <p className="text-gray-500 mt-1">
          Submit a stock count for a branch
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
          <h2 className="text-lg font-semibold">Select branch</h2>

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
              Counted by
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
            onClick={() => setStep("items")}
            disabled={!selectedBranch || !counterName.trim()}
            className="w-full py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
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
              onClick={() => setStep("branch")}
              className="text-sm text-brand-600 font-medium"
            >
              Change branch
            </button>
          </div>

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
                      inputMode="decimal"
                      min={0}
                      step="0.5"
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
                          inputMode="decimal"
                          min={0}
                          step="0.5"
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
              {loading ? "Submitting..." : "Submit Count"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
