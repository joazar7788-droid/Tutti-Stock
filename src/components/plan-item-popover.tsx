"use client";

import { useState } from "react";
import { QuantityInput } from "@/components/quantity-input";
import { UnitToggle } from "@/components/unit-toggle";
import { toPcs, fromPcs, formatQty } from "@/lib/unit-utils";

type Branch = { id: string; name: string };

export function PlanItemPopover({
  itemName,
  baseUnit,
  pcsPerBox,
  branches,
  excludeBranchIds,
  availablePcs,
  onConfirm,
  onClose,
}: {
  itemName: string;
  baseUnit: "boxes" | "pcs";
  pcsPerBox: number;
  branches: Branch[];
  excludeBranchIds: string[];
  availablePcs: number;
  onConfirm: (toLocationId: string, qtyPcs: number) => void;
  onClose: () => void;
}) {
  const availableBranches = branches.filter(
    (b) => !excludeBranchIds.includes(b.id)
  );
  const [selectedBranch, setSelectedBranch] = useState(
    availableBranches[0]?.id ?? ""
  );
  const [qty, setQty] = useState(1);
  const [inputUnit, setInputUnit] = useState<"boxes" | "pcs">(baseUnit);

  // Calculate max in the current input unit
  const maxInUnit =
    inputUnit === "boxes" && pcsPerBox > 1
      ? availablePcs / pcsPerBox
      : availablePcs;

  function handleQtyChange(val: number) {
    // Clamp to max available
    setQty(Math.min(val, Math.max(0.5, maxInUnit)));
  }

  function handleConfirm() {
    if (!selectedBranch || qty < 0.5) return;
    const pcsQty = toPcs(qty, inputUnit, pcsPerBox);
    if (pcsQty > availablePcs) return;
    onConfirm(selectedBranch, pcsQty);
  }

  const noStock = availablePcs <= 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-xl p-5 w-[300px] space-y-4">
        <h3 className="font-semibold text-lg truncate">{itemName}</h3>

        {/* Available stock indicator */}
        <div className="text-xs text-gray-500">
          Available in warehouse:{" "}
          <span className={`font-semibold ${noStock ? "text-danger-600" : "text-gray-700"}`}>
            {formatQty(Math.max(0, availablePcs), baseUnit, pcsPerBox)}
          </span>
        </div>

        {noStock ? (
          <>
            <p className="text-sm text-danger-600">
              No remaining stock available to plan.
            </p>
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 text-sm"
            >
              Close
            </button>
          </>
        ) : availableBranches.length === 0 ? (
          <>
            <p className="text-sm text-gray-500">
              All branches already have a planned delivery for this item.
            </p>
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 text-sm"
            >
              Close
            </button>
          </>
        ) : (
          <>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Branch
              </label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              >
                {availableBranches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Quantity
                {maxInUnit > 0 && (
                  <span className="font-normal text-gray-400 ml-1">
                    (max {maxInUnit})
                  </span>
                )}
              </label>
              <div className="flex items-center gap-3">
                <QuantityInput
                  value={qty}
                  onChange={handleQtyChange}
                  min={1}
                />
                <UnitToggle
                  value={inputUnit}
                  onChange={(unit) => {
                    setInputUnit(unit);
                    // Reset qty to 1 when switching units to avoid exceeding max
                    setQty(1);
                  }}
                  pcsPerBox={pcsPerBox}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleConfirm}
                className="flex-1 py-2.5 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 text-sm"
              >
                Add
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 text-sm"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
