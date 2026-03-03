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
    <div className="inline-flex gap-1 rounded-xl bg-gray-100 p-0.5 text-sm">
      <button
        type="button"
        onClick={() => onChange("boxes")}
        className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
          value === "boxes"
            ? "bg-brand-500 text-white shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        cases
      </button>
      <button
        type="button"
        onClick={() => onChange("pcs")}
        className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
          value === "pcs"
            ? "bg-brand-500 text-white shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        pcs
      </button>
    </div>
  );
}
