"use client";

export function UnitToggle({
  value,
  onChange,
  pcsPerBox,
}: {
  value: "boxes" | "pcs";
  onChange: (unit: "boxes" | "pcs") => void;
  pcsPerBox: number;
}) {
  if (pcsPerBox <= 1) {
    return <span className="text-sm text-gray-500">pcs</span>;
  }

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
        boxes
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
