import Link from "next/link";

export function ReadOnlyBanner() {
  return (
    <div className="bg-red-600 text-white px-4 py-2.5 text-sm font-semibold text-center">
      <strong>STOP — Do not enter data on this website.</strong> Go to{" "}
      <Link
        href="https://Tuttifruttimanagement.com"
        className="underline hover:no-underline"
      >
        Tuttifruttimanagement.com
      </Link>{" "}
      to enter all data.
    </div>
  );
}
