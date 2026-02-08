import Link from "next/link";

const transactionTypes = [
  {
    href: "/transactions/new/deliver",
    label: "Deliver to Branch",
    description: "Transfer items from the warehouse to a branch",
    icon: "🚚",
    color: "bg-blue-50 border-blue-200 hover:bg-blue-100",
  },
  {
    href: "/transactions/new/receive",
    label: "Receive Stock",
    description: "Record incoming stock (supplier delivery, return, etc.)",
    icon: "📦",
    color: "bg-green-50 border-green-200 hover:bg-green-100",
  },
  {
    href: "/transactions/new/adjust",
    label: "Adjust Stock",
    description: "Correct counts, record waste, breakage, or samples",
    icon: "✏️",
    color: "bg-amber-50 border-amber-200 hover:bg-amber-100",
  },
];

export default function NewTransactionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">New Transaction</h1>
        <p className="text-gray-500 mt-1">What type of stock movement?</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {transactionTypes.map((type) => (
          <Link
            key={type.href}
            href={type.href}
            className={`block p-6 rounded-2xl border-2 transition-colors ${type.color}`}
          >
            <div className="text-3xl mb-3">{type.icon}</div>
            <div className="font-semibold text-lg">{type.label}</div>
            <div className="text-sm text-gray-500 mt-1">{type.description}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
