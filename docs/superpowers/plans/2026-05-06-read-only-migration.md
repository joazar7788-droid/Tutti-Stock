# Read-Only Migration to New Site — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert this app to read-only with explicit redirects to `Tuttifruttimanagement.com`, blocking all writes at three layers (UI, auth gate, server actions) while preserving owner read access to historical data.

**Architecture:**
- **UI layer** — write pages render a `ReadOnlyRedirect` component instead of forms; login page hides the form behind an "Owner login" disclosure; persistent `ReadOnlyBanner` on every authenticated page.
- **Auth/role gate** — both authenticated layouts (`(authenticated)` and `(counter)`) sign out non-owners on every request.
- **Server actions** — every write action calls a `readOnlyError()` guard that returns the redirect-message error before doing anything.

**Tech Stack:** Next.js 16 (App Router) + TypeScript, Supabase (Postgres + Auth), Tailwind v4, `@ducanh2912/next-pwa`, Dexie.js (offline IndexedDB).

**Spec reference:** [`docs/superpowers/specs/2026-05-06-read-only-migration-design.md`](../specs/2026-05-06-read-only-migration-design.md). Read this first — copy strings, role decisions, and edge cases live there.

**Verification approach:** No test framework is installed. Each task verifies by running `npm run build` (catches TS errors) and, where applicable, manual dev-server checks listed inline. Final task runs the full manual test plan from the spec.

**Constants:**
- New site URL: `https://Tuttifruttimanagement.com` (used in every redirect)
- Read-only error message: `This website no longer accepts entries. Go to Tuttifruttimanagement.com.`
- Login error: `This account cannot log in here. Go to Tuttifruttimanagement.com.`

---

## Task 1: Read-only guard helper

**Files:**
- Create: `src/lib/read-only-guard.ts`

- [ ] **Step 1: Create the helper**

Write `src/lib/read-only-guard.ts`:

```typescript
export const READ_ONLY_ERROR_MESSAGE =
  "This website no longer accepts entries. Go to Tuttifruttimanagement.com.";

export function readOnlyError(): { error: string } {
  return { error: READ_ONLY_ERROR_MESSAGE };
}
```

- [ ] **Step 2: Type-check**

Run: `npm run build`
Expected: build succeeds (no TS errors).

- [ ] **Step 3: Commit**

```bash
git add src/lib/read-only-guard.ts
git commit -m "Add read-only guard helper for write actions"
```

---

## Task 2: ReadOnlyRedirect shared component

**Files:**
- Create: `src/components/read-only-redirect.tsx`

- [ ] **Step 1: Create the component**

Write `src/components/read-only-redirect.tsx`:

```tsx
import Link from "next/link";

type Variant = "login" | "branchCount" | "default";

const COPY: Record<Variant, { heading: string; body: React.ReactNode }> = {
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
```

- [ ] **Step 2: Type-check**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/read-only-redirect.tsx
git commit -m "Add ReadOnlyRedirect component with login/branchCount/default variants"
```

---

## Task 3: ReadOnlyBanner component

**Files:**
- Create: `src/components/read-only-banner.tsx`

- [ ] **Step 1: Create the component**

Write `src/components/read-only-banner.tsx`:

```tsx
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
```

- [ ] **Step 2: Type-check**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/read-only-banner.tsx
git commit -m "Add persistent ReadOnlyBanner shown above NavBar"
```

---

## Task 4: Replace login page with redirect + collapsible owner login

**Files:**
- Modify: `src/app/login/page.tsx` (full rewrite)

- [ ] **Step 1: Rewrite the login page**

Replace the entire contents of `src/app/login/page.tsx` with:

```tsx
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
```

- [ ] **Step 2: Type-check**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Manual verification**

Run: `npm run dev`
Visit `http://localhost:3000/login`. Expected:
- See the "Do not use this website" redirect screen with the CTA button.
- Tiny "Owner login" link at the bottom.
- Clicking it reveals the existing email/password form with a "← Back" button and a "Go to Tuttifruttimanagement.com" link inside the form.

- [ ] **Step 4: Commit**

```bash
git add src/app/login/page.tsx
git commit -m "Replace login page with redirect screen and collapsible owner login"
```

---

## Task 5: Update login server action to enforce owner-only

**Files:**
- Modify: `src/app/login/actions.ts`

- [ ] **Step 1: Update the action**

Replace the contents of `src/app/login/actions.ts` with:

```typescript
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const LOGIN_ERROR =
  "This account cannot log in here. Go to Tuttifruttimanagement.com.";

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) {
    return { error: LOGIN_ERROR };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .eq("stock_access", true)
    .single();

  if (!profile || profile.role !== "owner") {
    await supabase.auth.signOut();
    return { error: LOGIN_ERROR };
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
```

- [ ] **Step 2: Type-check**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Manual verification**

Run: `npm run dev`. With dev server running:
- Submit non-owner credentials → see "This account cannot log in here..." error, not redirected.
- Submit wrong password → see same error.
- Submit valid owner credentials → redirected to `/dashboard`.

- [ ] **Step 4: Commit**

```bash
git add src/app/login/actions.ts
git commit -m "Restrict login to owner role only with explicit redirect message"
```

---

## Task 6: Add owner role gate and banner to authenticated layout

**Files:**
- Modify: `src/app/(authenticated)/layout.tsx`

- [ ] **Step 1: Update the layout**

Replace the contents of `src/app/(authenticated)/layout.tsx` with:

```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserProvider } from "@/lib/context/user-context";
import { NavBar } from "@/components/nav-bar";
import { OfflineBanner } from "@/components/offline-banner";
import { ReadOnlyBanner } from "@/components/read-only-banner";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "owner") {
    await supabase.auth.signOut();
    redirect("/login");
  }

  return (
    <UserProvider
      value={{
        userId: user.id,
        email: user.email ?? "",
        profile,
        isOwner: profile.role === "owner",
        isCounter: profile.role === "counter",
      }}
    >
      <div className="min-h-dvh flex flex-col">
        <ReadOnlyBanner />
        <NavBar />
        <OfflineBanner />
        <main className="flex-1 p-4 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </UserProvider>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Manual verification**

Run: `npm run dev` and log in as owner:
- See the red "STOP — Do not enter data..." banner above the nav bar on every authenticated page.
- Sign in as a counter (or with an existing counter cookie) → automatically signed out and bounced to `/login`.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(authenticated\)/layout.tsx
git commit -m "Gate authenticated layout to owners and render read-only banner"
```

---

## Task 7: Add owner role gate to counter layout

**Files:**
- Modify: `src/app/(counter)/layout.tsx`

- [ ] **Step 1: Update the layout**

Replace the contents of `src/app/(counter)/layout.tsx` with:

```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserProvider } from "@/lib/context/user-context";
import { SignOutButton } from "./sign-out-button";

export default async function CounterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "owner") {
    await supabase.auth.signOut();
    redirect("/login");
  }

  return (
    <UserProvider
      value={{
        userId: user.id,
        email: user.email ?? "",
        profile,
        isOwner: profile.role === "owner",
        isCounter: profile.role === "counter",
      }}
    >
      <div className="min-h-dvh flex flex-col">
        <header className="border-b border-gray-200 bg-white px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-brand-600">Tutti Stock Count</h1>
          <SignOutButton />
        </header>
        <main className="flex-1 p-4 max-w-2xl mx-auto w-full">
          {children}
        </main>
      </div>
    </UserProvider>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(counter\)/layout.tsx
git commit -m "Gate counter layout to owners as defense-in-depth for stale sessions"
```

---

## Task 8: Replace `/count` page with branch-count redirect

**Files:**
- Modify: `src/app/(counter)/count/page.tsx` (full rewrite)

- [ ] **Step 1: Replace the page**

Replace the entire contents of `src/app/(counter)/count/page.tsx` with:

```tsx
import { ReadOnlyRedirect } from "@/components/read-only-redirect";

export default function CountPage() {
  return <ReadOnlyRedirect variant="branchCount" />;
}
```

- [ ] **Step 2: Type-check**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Manual verification**

Visit `/count` while logged in as owner → see the "Do not count here" redirect screen.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(counter\)/count/page.tsx
git commit -m "Replace counter count page with branch-count redirect screen"
```

---

## Task 9: Replace `/branch-counts/new` page with branch-count redirect

**Files:**
- Modify: `src/app/(authenticated)/branch-counts/new/page.tsx` (full rewrite)

- [ ] **Step 1: Replace the page**

Replace the entire contents of `src/app/(authenticated)/branch-counts/new/page.tsx` with:

```tsx
import { ReadOnlyRedirect } from "@/components/read-only-redirect";

export default function NewBranchCountPage() {
  return <ReadOnlyRedirect variant="branchCount" />;
}
```

- [ ] **Step 2: Type-check**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Manual verification**

Visit `/branch-counts/new` → see the "Do not count here" redirect screen.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(authenticated\)/branch-counts/new/page.tsx
git commit -m "Replace manager branch-count form with redirect screen"
```

---

## Task 10: Replace transactions write pages with default redirect

**Files:**
- Modify: `src/app/(authenticated)/transactions/new/page.tsx`
- Modify: `src/app/(authenticated)/transactions/new/deliver/page.tsx`
- Modify: `src/app/(authenticated)/transactions/new/receive/page.tsx`
- Modify: `src/app/(authenticated)/transactions/new/adjust/page.tsx`

- [ ] **Step 1: Replace each page**

For each of the four files above, replace the entire contents with:

```tsx
import { ReadOnlyRedirect } from "@/components/read-only-redirect";

export default function Page() {
  return <ReadOnlyRedirect />;
}
```

- [ ] **Step 2: Type-check**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Manual verification**

Visit each of `/transactions/new`, `/transactions/new/deliver`, `/transactions/new/receive`, `/transactions/new/adjust` → all show the "Do not enter data here" redirect screen.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(authenticated\)/transactions/new/page.tsx \
        src/app/\(authenticated\)/transactions/new/deliver/page.tsx \
        src/app/\(authenticated\)/transactions/new/receive/page.tsx \
        src/app/\(authenticated\)/transactions/new/adjust/page.tsx
git commit -m "Replace all transactions/new write pages with redirect screen"
```

---

## Task 11: Replace `/items/new` with default redirect

**Files:**
- Modify: `src/app/(authenticated)/items/new/page.tsx` (full rewrite)

- [ ] **Step 1: Replace the page**

Replace the entire contents of `src/app/(authenticated)/items/new/page.tsx` with:

```tsx
import { ReadOnlyRedirect } from "@/components/read-only-redirect";

export default function NewItemPage() {
  return <ReadOnlyRedirect />;
}
```

- [ ] **Step 2: Type-check**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(authenticated\)/items/new/page.tsx
git commit -m "Replace items/new page with redirect screen"
```

---

## Task 12: Replace `/items/[id]/edit` with default redirect

**Files:**
- Modify: `src/app/(authenticated)/items/[id]/edit/page.tsx` (full rewrite)
- Note: `edit-form.tsx` lives in the same directory but is no longer referenced. Leave it on disk to avoid risky deletes; it will be unused dead code that can be cleaned up later.

- [ ] **Step 1: Replace the page**

Replace the entire contents of `src/app/(authenticated)/items/[id]/edit/page.tsx` with:

```tsx
import { ReadOnlyRedirect } from "@/components/read-only-redirect";

export default function EditItemPage() {
  return <ReadOnlyRedirect />;
}
```

- [ ] **Step 2: Type-check**

Run: `npm run build`
Expected: build succeeds. `edit-form.tsx` may produce an "unused" warning depending on lint config — acceptable.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(authenticated\)/items/\[id\]/edit/page.tsx
git commit -m "Replace items/[id]/edit page with redirect screen"
```

---

## Task 13: Replace `/delivery-planner` with default redirect

**Files:**
- Modify: `src/app/(authenticated)/delivery-planner/page.tsx` (full rewrite)
- Note: leave `/delivery-planner/sheet/[planId]/page.tsx` alone — it is read-only (only displays a printable sheet, no writes).

- [ ] **Step 1: Replace the page**

Replace the entire contents of `src/app/(authenticated)/delivery-planner/page.tsx` with:

```tsx
import { ReadOnlyRedirect } from "@/components/read-only-redirect";

export default function DeliveryPlannerPage() {
  return <ReadOnlyRedirect />;
}
```

- [ ] **Step 2: Type-check**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Manual verification**

Visit `/delivery-planner` → see redirect screen.
Visit `/delivery-planner/sheet/<some-finalized-plan-id>` → still renders the sheet (read-only is fine here).

- [ ] **Step 4: Commit**

```bash
git add src/app/\(authenticated\)/delivery-planner/page.tsx
git commit -m "Replace delivery-planner page with redirect screen (sheet view stays)"
```

---

## Task 14: Replace dashboard with single CTA card

**Files:**
- Modify: `src/app/(authenticated)/dashboard/page.tsx` (full rewrite)

- [ ] **Step 1: Replace the dashboard**

Replace the entire contents of `src/app/(authenticated)/dashboard/page.tsx` with:

```tsx
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
```

- [ ] **Step 2: Type-check**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Manual verification**

Visit `/dashboard` as owner → see banner up top, then the big "Use the new website" CTA card, then a small grid of read-only links.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(authenticated\)/dashboard/page.tsx
git commit -m "Replace dashboard tiles with CTA to new website plus read-only nav"
```

---

## Task 15: Add server-action guards to all write actions

This task touches every write action across five files. The goal: every write returns the read-only error before doing any work, so any stale tab, queued offline transaction, or direct API call cannot mutate the database.

**Files:**
- Modify: `src/app/(counter)/count/actions.ts`
- Modify: `src/app/(authenticated)/transactions/actions.ts`
- Modify: `src/app/(authenticated)/items/actions.ts`
- Modify: `src/app/(authenticated)/branch-counts/actions.ts`
- Modify: `src/app/(authenticated)/delivery-planner/actions.ts`

For each file: at the top, add `import { readOnlyError } from "@/lib/read-only-guard";` then make every write action's first line `return readOnlyError();`. Reads (functions that only `select` from Supabase and return data) are left alone. The full list of which functions are writes vs reads is given per-file below.

- [ ] **Step 1: Guard `count/actions.ts`**

In `src/app/(counter)/count/actions.ts`:
- Leave `getExistingCount` alone (read).
- Add guard as the first statement of `submitStockCount` and `updateExistingCount`.

Edit `src/app/(counter)/count/actions.ts`. After the existing `"use server";` line and imports, add:
```typescript
import { readOnlyError } from "@/lib/read-only-guard";
```

In the `updateExistingCount` function (after `export async function updateExistingCount(...) {`), insert as the very first statement inside the body:
```typescript
  return readOnlyError();
```

In the `submitStockCount` function (after `export async function submitStockCount(...) {`), insert as the very first statement inside the body:
```typescript
  return readOnlyError();
```

- [ ] **Step 2: Guard `transactions/actions.ts`**

In `src/app/(authenticated)/transactions/actions.ts`:
- All three exports (`createDelivery`, `createReceive`, `createAdjustment`) are writes.

Add the import at the top:
```typescript
import { readOnlyError } from "@/lib/read-only-guard";
```

Add `return readOnlyError();` as the first statement inside each of `createDelivery`, `createReceive`, `createAdjustment`.

- [ ] **Step 3: Guard `items/actions.ts`**

In `src/app/(authenticated)/items/actions.ts`:
- All four exports (`createItem`, `updateItem`, `toggleItemActive`, `toggleItemFavorite`) are writes.

Add the import at the top:
```typescript
import { readOnlyError } from "@/lib/read-only-guard";
```

Add `return readOnlyError();` as the first statement inside each of `createItem`, `updateItem`, `toggleItemActive`, `toggleItemFavorite`.

- [ ] **Step 4: Guard `branch-counts/actions.ts`**

In `src/app/(authenticated)/branch-counts/actions.ts`:
- All three exports (`deleteStockCount`, `submitManagerStockCount`, `updateStockCountItem`) are writes.

Add the import at the top:
```typescript
import { readOnlyError } from "@/lib/read-only-guard";
```

Add `return readOnlyError();` as the first statement inside each of `deleteStockCount`, `submitManagerStockCount`, `updateStockCountItem`.

- [ ] **Step 5: Guard `delivery-planner/actions.ts`**

In `src/app/(authenticated)/delivery-planner/actions.ts`:
- Writes: `getOrCreateDraftPlan` (creates a draft row), `addPlanItem`, `removePlanItem`, `updatePlanItem`, `finalizePlan`, `revertPlanToDraft`.
- Read: `getLatestFinalizedPlanForBranch` — leave alone.

Add the import at the top:
```typescript
import { readOnlyError } from "@/lib/read-only-guard";
```

Add `return readOnlyError();` as the first statement inside each of: `getOrCreateDraftPlan`, `addPlanItem`, `removePlanItem`, `updatePlanItem`, `finalizePlan`, `revertPlanToDraft`. Do NOT add it to `getLatestFinalizedPlanForBranch`.

- [ ] **Step 6: Type-check**

Run: `npm run build`
Expected: build succeeds. TypeScript may warn about unreachable code or unused variables in the guarded actions — those are expected and acceptable. If lint errors block the build, add `// eslint-disable-next-line @typescript-eslint/no-unused-vars` lines as needed, but prefer leaving the unused declarations as-is so the original implementation is easy to restore later.

- [ ] **Step 7: Manual verification**

Run: `npm run dev`. As the logged-in owner, open the inventory page and click the favorite (star) icon on any item. Expected: the toggle does nothing visible OR shows a console error containing `"This website no longer accepts entries..."` — the call returns the error and the row in the database is unchanged.

Optional deeper check: open browser devtools → Network tab → click any favorite/archive button on inventory or items page → inspect the server action response — the JSON should contain `error: "This website no longer accepts entries..."`.

- [ ] **Step 8: Commit**

```bash
git add src/app/\(counter\)/count/actions.ts \
        src/app/\(authenticated\)/transactions/actions.ts \
        src/app/\(authenticated\)/items/actions.ts \
        src/app/\(authenticated\)/branch-counts/actions.ts \
        src/app/\(authenticated\)/delivery-planner/actions.ts
git commit -m "Guard every write server action with read-only error"
```

---

## Task 16: Disable offline auto-sync and show one-time pending toast

**Files:**
- Modify: `src/lib/offline/hooks.ts`
- Modify: `src/components/offline-banner.tsx`

The current `useOfflineSync` hook auto-flushes pending Dexie transactions when the browser comes back online, calling `syncPendingTransactions` which inserts them via the now-guarded `transactions` server actions. With the guards in place those inserts will fail anyway, but a clearer UX is to stop auto-sync entirely and show a single explicit message about the pending entries.

- [ ] **Step 1: Strip auto-sync from `useOfflineSync`**

Replace the entire contents of `src/lib/offline/hooks.ts` with:

```typescript
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
```

Note: `_userId` is prefixed with `_` to silence the unused-parameter lint. The `cacheReferenceData` and `syncPendingTransactions` imports/calls are removed entirely — no auto-sync, no auto-cache. The Dexie file `sync.ts` is left untouched so `getPendingCount` still works.

- [ ] **Step 2: Update `OfflineBanner` to show the one-time pending message**

Replace the entire contents of `src/components/offline-banner.tsx` with:

```tsx
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
```

- [ ] **Step 3: Type-check**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 4: Manual verification**

Run: `npm run dev`, log in as owner. With browser online and no pending Dexie entries: banner is hidden. To simulate pending entries, open devtools → Application → IndexedDB → `tutti_offline` → `pendingTransactions` and add a row with `synced: 0` (or any falsy value the schema accepts). Refresh — the amber pending banner appears with the new copy. Importantly, no Network requests to `transactions` are fired.

- [ ] **Step 5: Commit**

```bash
git add src/lib/offline/hooks.ts src/components/offline-banner.tsx
git commit -m "Disable offline auto-sync; show static notice about pre-cutover queue"
```

---

## Task 17: Bump service worker / PWA cache to force refresh

**Files:**
- Modify: `next.config.ts`

The `@ducanh2912/next-pwa` plugin generates `public/sw.js`. The current config doesn't pin a cache identifier or skipWaiting flag, so installed PWAs may serve stale shells until the user manually closes/reopens the app. We add `cacheId` (changes the cache namespace, invalidates old caches) and explicit waiting flags to force activation on next launch.

- [ ] **Step 1: Update `next.config.ts`**

Replace the contents of `next.config.ts` with:

```typescript
import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  cacheId: "tutti-stock-readonly-2026-05-06",
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
  },
});

const nextConfig: NextConfig = {};

export default withPWA(nextConfig);
```

The `cacheId` change is the critical bit — it gives the new shell a different namespace so the browser treats it as a fresh deployment and discards the previous caches.

- [ ] **Step 2: Type-check**

Run: `npm run build`
Expected: build succeeds. The build emits a new `public/sw.js`. Check the file mentions the new cache id.

- [ ] **Step 3: Manual verification**

Build: `npm run build && npm start`. In a Chromium browser:
- Visit `http://localhost:3000`, then in devtools → Application → Service Workers → confirm the new SW is `activated and is running`.
- Devtools → Application → Cache Storage — confirm caches prefixed with `tutti-stock-readonly-2026-05-06-...` exist and any older caches are purged on the next load.

- [ ] **Step 4: Commit**

```bash
git add next.config.ts
git commit -m "Bump PWA cacheId and enable skipWaiting/clientsClaim for cutover"
```

---

## Task 18: Run the full test plan and verify

This task is verification only — no code changes. Step through each item from the spec's test plan and confirm the behavior. If any step fails, file it as a follow-up bug rather than fixing inline (so this plan stays scoped).

- [ ] **Step 1: Run the build clean**

```bash
npm run build
```

Expected: build succeeds with no errors.

- [ ] **Step 2: Counter bookmark flow**

Run: `npm run dev`. Open `/login` in a private/incognito window:
- See "Do not use this website" full-page screen with the CTA button. Tiny "Owner login" link in the bottom area.
- No login form visible by default.

- [ ] **Step 3: Owner login wrong password**

Click "Owner login" → enter wrong password → see "This account cannot log in here. Go to Tuttifruttimanagement.com." error.

- [ ] **Step 4: Counter credentials rejected**

Sign in with a counter test account (role='counter') → see the same explicit error → user is signed out (no session cookie set, no redirect).

- [ ] **Step 5: Owner login success**

Sign in with valid owner credentials → redirected to `/dashboard` → red "STOP — Do not enter data on this website..." banner above NavBar → big "Use the new website" CTA card visible → small grid of read-only links below.

- [ ] **Step 6: Owner navigates to write surfaces**

Visit each URL and confirm it shows the correct redirect screen:
- `/count` → branchCount variant ("Do not count here")
- `/branch-counts/new` → branchCount variant
- `/transactions/new` → default variant
- `/transactions/new/deliver`, `/receive`, `/adjust` → default variant
- `/items/new` → default variant
- `/items/<some-id>/edit` → default variant
- `/delivery-planner` → default variant

- [ ] **Step 7: Owner views read pages**

Visit `/inventory`, `/branch-counts`, `/deliveries`, `/items`, `/reports`, `/delivery-planner/sheet/<finalized-plan-id>` (if one exists) → all show their data normally with the red banner above.

- [ ] **Step 8: Stale non-owner session**

In a fresh browser, manually plant a counter user's auth cookie (or use Supabase dashboard to log in as a counter and grab the cookies). Visit `/dashboard` → automatically signed out → bounced to `/login` → sees moved screen.

- [ ] **Step 9: Server-action guard**

In devtools console with a logged-in owner, fire a direct fetch to a write action via the framework's `_next/action` endpoint, OR simpler: click the favorite star on `/inventory` and inspect Network. The response should be `{"error":"This website no longer accepts entries. Go to Tuttifruttimanagement.com."}`. Verify in Supabase dashboard that the row was NOT updated.

- [ ] **Step 10: PWA refresh**

After deploying (or with `npm run build && npm start`), open in a Chromium browser, install as PWA, then deploy a small change locally and reload — confirm the new shell activates without manual close.

- [ ] **Step 11: Offline queue toast**

Open devtools → IndexedDB → `tutti_offline` → `pendingTransactions` → add a row with `synced: 0`. Reload `/dashboard` → see the amber pending notice. No Network requests to `/transactions` are fired.

- [ ] **Step 12: Reports email cron**

Trigger the weekly-report endpoint:

```bash
curl -X POST -H "Authorization: Bearer $CRON_SECRET" \
  https://<your-deployment>/api/weekly-report
```

Expected: 200 response, email sent (check Resend dashboard or recipient inbox).

- [ ] **Step 13: Final commit (only if any docs changed)**

If you needed to amend the plan or spec during verification, commit those edits now. Otherwise this step is a no-op.

---

## Notes on what is intentionally NOT changed

- **Read pages with inline write controls** (`/inventory` favorite stars, `/branch-counts` inline edit/delete, `/items` favorite/archive toggles): UI controls remain visible. Clicking them invokes server actions that now return the read-only error. Cleaner UX would hide the controls, but the banner already makes the situation clear and the server-action guard is the source of truth — leaving them avoids touching `branch-counts-view.tsx`, `inventory-table.tsx`, `item-row.tsx`, and `nav-bar.tsx`. Out of scope for this plan.
- **`edit-form.tsx` and other unused write components**: left on disk to keep diffs reviewable. Cleanup is out of scope.
- **NavBar**: still shows links to write pages (e.g. "New Transaction"). Clicking them lands on the redirect screen, which is good enough — touching the nav can wait.
- **Weekly reports cron** (`src/app/api/weekly-report/route.ts`): unchanged; read-only and useful during the transition.
- **Database schema and RLS policies**: unchanged; defense in depth is at the application layer.
