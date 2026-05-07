"use client";

import { useEffect, useState, useCallback } from "react";
import { getPendingCount } from "./sync";

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
  }, [refresh]);

  return { count, refresh };
}

export function useOfflineSync(_userId: string) {
  const isOnline = useOnlineStatus();
  const { count: pendingCount } = usePendingCount();

  return {
    isOnline,
    pendingCount,
    syncing: false,
    lastSyncResult: null as string | null,
  };
}
