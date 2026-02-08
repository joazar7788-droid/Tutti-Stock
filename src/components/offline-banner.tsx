"use client";

import { useOfflineSync } from "@/lib/offline/hooks";
import { useUser } from "@/lib/context/user-context";

export function OfflineBanner() {
  const { userId } = useUser();
  const { isOnline, pendingCount, syncing, lastSyncResult } = useOfflineSync(userId);

  if (isOnline && pendingCount === 0 && !lastSyncResult) return null;

  return (
    <div
      className={`px-4 py-2 text-sm font-medium text-center ${
        !isOnline
          ? "bg-amber-100 text-amber-800"
          : syncing
          ? "bg-blue-100 text-blue-800"
          : lastSyncResult
          ? "bg-green-100 text-green-800"
          : pendingCount > 0
          ? "bg-amber-100 text-amber-800"
          : ""
      }`}
    >
      {!isOnline && (
        <>
          You&apos;re offline — transactions will sync when connected
          {pendingCount > 0 && ` (${pendingCount} pending)`}
        </>
      )}
      {isOnline && syncing && "Syncing transactions..."}
      {isOnline && !syncing && lastSyncResult && lastSyncResult}
      {isOnline && !syncing && !lastSyncResult && pendingCount > 0 && (
        <>{pendingCount} transaction{pendingCount !== 1 ? "s" : ""} pending sync</>
      )}
    </div>
  );
}
