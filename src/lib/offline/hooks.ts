"use client";

import { useEffect, useState, useCallback } from "react";
import { getPendingCount, syncPendingTransactions, cacheReferenceData } from "./sync";

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}

export function usePendingCount() {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const c = await getPendingCount();
      setCount(c);
    } catch {
      // IndexedDB not available
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { count, refresh };
}

export function useOfflineSync(userId: string) {
  const isOnline = useOnlineStatus();
  const { count: pendingCount, refresh } = usePendingCount();
  const [syncing, setSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<string | null>(null);

  // Cache reference data when online
  useEffect(() => {
    if (isOnline) {
      cacheReferenceData().catch(() => {});
    }
  }, [isOnline]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingCount > 0 && !syncing) {
      setSyncing(true);
      syncPendingTransactions(userId)
        .then((result) => {
          if (result.synced > 0) {
            setLastSyncResult(
              `Synced ${result.synced} transaction${result.synced !== 1 ? "s" : ""}`
            );
          }
          if (result.failed > 0) {
            setLastSyncResult(
              `${result.synced} synced, ${result.failed} failed`
            );
          }
          refresh();
        })
        .catch(() => {
          setLastSyncResult("Sync failed");
        })
        .finally(() => setSyncing(false));
    }
  }, [isOnline, pendingCount, syncing, userId, refresh]);

  // Clear sync result after 5 seconds
  useEffect(() => {
    if (lastSyncResult) {
      const t = setTimeout(() => setLastSyncResult(null), 5000);
      return () => clearTimeout(t);
    }
  }, [lastSyncResult]);

  return { isOnline, pendingCount, syncing, lastSyncResult };
}
