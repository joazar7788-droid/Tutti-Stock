"use client";

export function UnitToggle({
  value,
  onChange,
  pcsPerBox: _pcsPerBox,
}: {
  value: "boxes" | "pcs";
  onChange: (unit: "boxes" | "pcs") => void;
  pcsPerBox: number;
}) {
  return (
    <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
      <button
        type="button"
        onClick={() => onChange("boxes")}
        className={`px-3 py-1.5 font-medium transition-colors ${
          value === "boxes"
            ? "bg-brand-500 text-white"
            : "bg-white text-gray-600 hover:bg-gray-50"
        }`}
      >
        cases
      </button>
      <button
        type="button"
        onClick={() => onChange("pcs")}
        className={`px-3 py-1.5 font-medium transition-colors ${
          value === "pcs"
            ? "bg-brand-500 text-white"
            : "bg-white text-gray-600 hover:bg-gray-50"
        }`}
      >
        pcs
      </button>
    </div>
  );
}
