"use client";

import { signOut } from "@/app/login/actions";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut()}
      className="text-sm text-gray-500 hover:text-gray-700 font-medium"
    >
      Sign Out
    </button>
  );
}
