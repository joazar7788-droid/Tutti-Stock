"use client";

import Link from "next/link";
import { useUser } from "@/lib/context/user-context";

const staffActions = [
  {
    href: "/transactions/new/deliver",
    label: "Deliver to Branch",
    description: "Transfer stock from warehouse to a branch",
    icon: "🚚",
    color: "bg-blue-50 border-blue-200 hover:bg-blue-100",
  },
  {
    href: "/transactions/new/receive",
    label: "Receive Stock",
    description: "Record incoming stock to any location",
    icon: "📦",
    color: "bg-green-50 border-green-200 hover:bg-green-100",
  },
  {
    href: "/transactions/new/adjust",
    label: "Adjust Stock",
    description: "Correct stock counts or record waste",
    icon: "✏️",
    color: "bg-amber-50 border-amber-200 hover:bg-amber-100",
  },
  {
    href: "/inventory",
    label: "View Inventory",
    description: "Stock levels, edit items, and manage favorites",
    icon: "📊",
    color: "bg-purple-50 border-purple-200 hover:bg-purple-100",
  },
  {
    href: "/branch-counts",
    label: "Branch Counts",
    description: "View weekly stock counts from branches",
    icon: "📝",
    color: "bg-cyan-50 border-cyan-200 hover:bg-cyan-100",
  },
  {
    href: "/delivery-planner",
    label: "Delivery Planner",
    description: "Plan weekly deliveries based on branch counts",
    icon: "📋",
    color: "bg-orange-50 border-orange-200 hover:bg-orange-100",
  },
  {
    href: "/deliveries",
    label: "View Activity",
    description: "See all stock movements and history",
    icon: "📜",
    color: "bg-indigo-50 border-indigo-200 hover:bg-indigo-100",
  },
  {
    href: "/items/new",
    label: "Add New Item",
    description: "Add a new product to the inventory catalog",
    icon: "➕",
    color: "bg-teal-50 border-teal-200 hover:bg-teal-100",
  },
];

const ownerActions = [
  {
    href: "/reports",
    label: "Reports",
    description: "View weekly summaries and stock alerts",
    icon: "📈",
    color: "bg-brand-50 border-brand-200 hover:bg-brand-100",
  },
];

export default function DashboardPage() {
  const { isOwner, profile } = useUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Hi, {profile.full_name ?? "there"}
        </h1>
        <p className="text-gray-500 mt-1">What would you like to do?</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {staffActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`block p-6 rounded-2xl border-2 transition-colors ${action.color}`}
          >
            <div className="text-3xl mb-3">{action.icon}</div>
            <div className="font-semibold text-lg">{action.label}</div>
            <div className="text-sm text-gray-500 mt-1">
              {action.description}
            </div>
          </Link>
        ))}

        {isOwner &&
          ownerActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`block p-6 rounded-2xl border-2 transition-colors ${action.color}`}
            >
              <div className="text-3xl mb-3">{action.icon}</div>
              <div className="font-semibold text-lg">{action.label}</div>
              <div className="text-sm text-gray-500 mt-1">
                {action.description}
              </div>
            </Link>
          ))}
      </div>
    </div>
  );
}
