"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useUser } from "@/lib/context/user-context";
import { signOut } from "@/app/login/actions";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/transactions/new", label: "New Transaction" },
  { href: "/inventory", label: "Inventory" },
  { href: "/branch-counts", label: "Branch Counts" },
  { href: "/delivery-planner", label: "Planner" },
  { href: "/deliveries", label: "Activity" },
];

const ownerLinks = [
  { href: "/reports", label: "Reports" },
];

export function NavBar() {
  const { isOwner, profile } = useUser();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const allLinks = isOwner ? [...navLinks, ...ownerLinks] : navLinks;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link href="/dashboard" className="text-xl font-bold text-brand-600">
            Tutti Stock
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {allLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith(link.href)
                    ? "bg-brand-50 text-brand-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <span className="text-sm text-gray-500">
              {profile.full_name ?? "User"}
              {isOwner && (
                <span className="ml-1 text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">
                  Owner
                </span>
              )}
            </span>
            <form action={signOut}>
              <button
                type="submit"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Sign Out
              </button>
            </form>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {menuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 space-y-1">
            {allLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`block px-3 py-3 rounded-lg text-base font-medium ${
                  pathname.startsWith(link.href)
                    ? "bg-brand-50 text-brand-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-gray-200 pt-3 mt-3 px-3 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {profile.full_name ?? "User"}
              </span>
              <form action={signOut}>
                <button
                  type="submit"
                  className="text-sm text-brand-600 font-medium"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
