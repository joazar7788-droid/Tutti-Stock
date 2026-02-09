"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

type Branch = { id: string; name: string };

export function DeliveriesFilters({
  branches,
  currentBranch,
  currentFrom,
  currentTo,
}: {
  branches: Branch[];
  currentBranch?: string;
  currentFrom?: string;
  currentTo?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/deliveries?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="flex flex-wrap gap-3">
      <select
        value={currentBranch ?? ""}
        onChange={(e) => updateParams("branch", e.target.value)}
        className="px-4 py-2.5 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
      >
        <option value="">All Branches</option>
        {branches.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>

      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-500">From</label>
        <input
          type="date"
          value={currentFrom ?? ""}
          onChange={(e) => updateParams("from", e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-500">To</label>
        <input
          type="date"
          value={currentTo ?? ""}
          onChange={(e) => updateParams("to", e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>
    </div>
  );
}
