"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "./actions";
import { ReadOnlyRedirect } from "@/components/read-only-redirect";

export default function LoginPage() {
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await signIn(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  if (!showForm) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-gray-50 px-4 py-8">
        <ReadOnlyRedirect variant="login" />
        <button
          onClick={() => setShowForm(true)}
          className="mt-6 text-xs text-gray-400 hover:text-gray-600 underline"
        >
          Owner login
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-600">Tutti Stock</h1>
          <p className="text-gray-500 mt-2">Owner Login</p>
        </div>

        <form
          action={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4"
        >
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              placeholder="Your password"
            />
          </div>

          {error && (
            <div className="bg-danger-50 text-danger-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <button
            type="button"
            onClick={() => {
              setShowForm(false);
              setError(null);
            }}
            className="w-full text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back
          </button>

          <div className="pt-2 border-t border-gray-100">
            <Link
              href="https://Tuttifruttimanagement.com"
              className="block text-center text-sm text-brand-600 hover:text-brand-700"
            >
              Go to Tuttifruttimanagement.com →
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
