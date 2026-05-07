"use client";

import Link from "next/link";
import { useUser } from "@/lib/context/user-context";

const readLinks = [
  { href: "/inventory", label: "Inventory", icon: "📊" },
  { href: "/branch-counts", label: "Branch Counts", icon: "📝" },
  { href: "/deliveries", label: "Activity", icon: "📜" },
  { href: "/items", label: "Items", icon: "📦" },
  { href: "/reports", label: "Reports", icon: "📈" },
];

export default function DashboardPage() {
  const { profile } = useUser();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">
          Hi, {profile.full_name ?? "there"}
        </h1>
      </div>

      <div className="bg-white rounded-2xl border-2 border-brand-200 p-8 text-center space-y-5">
        <div className="text-5xl">🚀</div>
        <h2 className="text-2xl font-bold">Use the new website</h2>
        <p className="text-gray-600 max-w-md mx-auto">
          All data entry has moved to{" "}
          <strong>Tuttifruttimanagement.com</strong>. Click below to go there.
        </p>
        <Link
          href="https://Tuttifruttimanagement.com"
          className="inline-block py-3 px-8 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-colors"
        >
          Go to Tuttifruttimanagement.com
        </Link>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-3">
          View historical data
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {readLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block p-4 rounded-xl border border-gray-200 bg-white hover:border-gray-300 text-center"
            >
              <div className="text-2xl mb-1">{link.icon}</div>
              <div className="text-sm font-medium">{link.label}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
