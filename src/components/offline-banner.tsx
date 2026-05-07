"use client";

import { useOfflineSync } from "@/lib/offline/hooks";
import { useUser } from "@/lib/context/user-context";

export function OfflineBanner() {
  const { userId } = useUser();
  const { isOnline, pendingCount } = useOfflineSync(userId);

  if (isOnline && pendingCount === 0) return null;

  return (
    <div className="bg-amber-100 text-amber-800 px-4 py-2 text-sm font-medium text-center">
      {!isOnline && (
        <>You&apos;re offline — this site is read-only either way</>
      )}
      {isOnline && pendingCount > 0 && (
        <>
          <strong>
            {pendingCount} {pendingCount === 1 ? "entry was" : "entries were"}{" "}
            saved offline before the switch and will not be synced.
          </strong>{" "}
          Please re-enter them at Tuttifruttimanagement.com.
        </>
      )}
    </div>
  );
}
