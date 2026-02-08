"use client";

export function QuantityInput({
  value,
  onChange,
  min = 1,
}: {
  value: number;
  onChange: (val: number) => void;
  min?: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-12 h-12 rounded-xl border-2 border-gray-200 bg-white text-xl font-bold hover:bg-gray-50 active:bg-gray-100 flex items-center justify-center"
      >
        -
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const v = parseInt(e.target.value);
          if (!isNaN(v) && v >= min) onChange(v);
        }}
        min={min}
        className="w-20 h-12 text-center text-lg font-semibold rounded-xl border-2 border-gray-200 focus:outline-none focus:border-brand-500"
      />
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="w-12 h-12 rounded-xl border-2 border-gray-200 bg-white text-xl font-bold hover:bg-gray-50 active:bg-gray-100 flex items-center justify-center"
      >
        +
      </button>
    </div>
  );
}
