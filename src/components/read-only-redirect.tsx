import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "login" | "branchCount" | "default";

const COPY: Record<Variant, { heading: string; body: ReactNode }> = {
  login: {
    heading: "Do not use this website",
    body: (
      <>
        This website is no longer in use. To do branch counts, go to{" "}
        <strong>Tuttifruttimanagement.com</strong>, tap{" "}
        <strong>&ldquo;Count Branch Stock&rdquo;</strong>, then enter your PIN.
      </>
    ),
  },
  branchCount: {
    heading: "Do not count here",
    body: (
      <>
        Branch counts must now be done on{" "}
        <strong>Tuttifruttimanagement.com</strong>. Tap the button below, then
        tap <strong>&ldquo;Count Branch Stock&rdquo;</strong> and enter your
        PIN.
      </>
    ),
  },
  default: {
    heading: "Do not enter data here",
    body: (
      <>
        All data entry must be done on{" "}
        <strong>Tuttifruttimanagement.com</strong>. Click the button below to
        go there now.
      </>
    ),
  },
};

export function ReadOnlyRedirect({
  variant = "default",
}: {
  variant?: Variant;
}) {
  const { heading, body } = COPY[variant];
  return (
    <div className="min-h-[60dvh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center space-y-5">
        <div className="text-5xl">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-900">{heading}</h1>
        <p className="text-gray-600 leading-relaxed">{body}</p>
        <Link
          href="https://Tuttifruttimanagement.com"
          className="inline-block w-full py-3 px-4 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-colors"
        >
          Go to Tuttifruttimanagement.com
        </Link>
      </div>
    </div>
  );
}
