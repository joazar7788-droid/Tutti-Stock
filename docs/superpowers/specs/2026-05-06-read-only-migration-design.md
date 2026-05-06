# Read-Only Migration to New Site

**Status:** Approved
**Date:** 2026-05-06

## Context

Production is moving from this app to a new system at `Tuttifruttimanagement.com`. To make the cutover smooth, this app becomes read-only with clear redirects pointing users to the new site. The most important user group to redirect is counter employees, who do branch counts on autopilot from saved bookmarks.

## Goals

1. Prevent any new writes to the old database from any source (UI, stale tabs, queued offline transactions, direct API calls).
2. Make the redirect to the new site unmistakable, especially for counter employees.
3. Preserve owner read access to historical data (inventory, transactions, branch counts, deliveries, reports) during the transition.
4. Keep the weekly reports email cron running.

## Non-goals

- Migrating data to the new system (handled separately).
- Maintaining feature parity between old and new app.
- Permanently sunsetting the old app (that decision is later).

## User experience

### Counter / staff opens old bookmark → `/login`
Sees a "We've moved" full-page screen with a prominent button linking to `Tuttifruttimanagement.com`. Small, discreet "Owner login" link in a corner. No login form is visible by default. They have no way to authenticate.

### Owner clicks "Owner login"
Login form expands. They submit credentials. The login server action validates the password AND fetches the profile to check `role === 'owner'`. If anything fails (wrong password, non-owner role, missing profile), they get a generic "Invalid credentials" error and are signed out — no leaking which check failed.

### Owner logged in
Sees normal navigation. A persistent dismiss-less banner sits at the top of every authenticated page:

> Read-only mode — please use [Tuttifruttimanagement.com](https://Tuttifruttimanagement.com) to enter data.

Read pages render normally:
- `/inventory` — stock levels
- `/branch-counts` — history list
- `/transactions` — history list (if exists)
- `/deliveries` — history list
- `/items` — items list
- `/reports` — owner-only weekly summary
- `/dashboard` — see "Dashboard" below

### Owner clicks any write surface
Instead of a form, they see a full-page `ReadOnlyRedirect` component with the message and a CTA button to the new site. Applies to:
- `/transactions/new` (deliver, receive, adjust)
- `/branch-counts/new`
- `/items/new`
- `/items/[id]/edit` (if it exists)
- `/delivery-planner` (if it has writes)
- Any other write surface discovered during implementation

### Dashboard
The current dashboard's quick-action tiles all link to write pages. Replace them with a single large CTA card pointing to `Tuttifruttimanagement.com`. Read-only navigation (Inventory, Reports, etc.) remains accessible via the nav bar.

### Stale session for a non-owner
Counter/staff who still have a valid session cookie from before the cutover hit the authenticated layout, which checks `role === 'owner'`. If not an owner, the layout signs them out and redirects to `/login`, where they see the moved screen.

## Architecture

### Defense in depth (three layers)

1. **UI layer** — Write pages no longer exist visually; they render `<ReadOnlyRedirect />` instead of forms. Login page hides the form behind an "Owner login" disclosure.
2. **Auth/role gate** — The authenticated layout checks role on every request. Non-owners are signed out and bounced to `/login`.
3. **Server actions** — Every server action that writes (`branch-counts/actions.ts`, `transactions/actions.ts`, `items/actions.ts`, `delivery-planner` actions if any) starts with a guard that returns the redirect-message error before doing anything else. Catches stale tabs, offline queue replay, direct API calls.

### Components and changes

#### New shared component: `ReadOnlyRedirect`
- Lives in `src/components/read-only-redirect.tsx`.
- Renders a centered card: heading "We've moved", body text explaining the migration, CTA button labeled "Open Tuttifruttimanagement.com" linking to `https://Tuttifruttimanagement.com`.
- Used by the login page's default state and by every write page.

#### New shared component: `ReadOnlyBanner`
- Lives in `src/components/read-only-banner.tsx`.
- Persistent, dismiss-less, full-width strip rendered above `<NavBar />` in the authenticated layout.
- Text: `Read-only mode — please use Tuttifruttimanagement.com to enter data.` with the URL as a link.

#### `src/app/login/page.tsx`
- Default render: full-page `<ReadOnlyRedirect />` with a small "Owner login" link/button in a corner (e.g. bottom-right).
- Click reveals the existing login form (in a modal, drawer, or inline disclosure — implementation choice during build).

#### `src/app/login/actions.ts`
- After `signInWithPassword` succeeds, fetch the profile and check `role === 'owner'`.
- If not owner (or profile missing), call `signOut()` and return the same generic invalid-credentials error.
- No information leak about which check failed.

#### `src/app/(authenticated)/layout.tsx`
- After loading the profile, if `profile.role !== 'owner'`, sign the user out and redirect to `/login`.
- Render `<ReadOnlyBanner />` above `<NavBar />`.

#### `src/app/(authenticated)/dashboard/page.tsx`
- Replace existing action tiles with a single large CTA card linking to the new site.

#### Write pages
Replace each page's body with `<ReadOnlyRedirect />`:
- `src/app/(authenticated)/transactions/new/page.tsx`
- `src/app/(authenticated)/branch-counts/new/page.tsx`
- `src/app/(authenticated)/items/new/page.tsx`
- `src/app/(authenticated)/items/[id]/edit/page.tsx` (if it exists — verify during implementation)
- `src/app/(authenticated)/delivery-planner/page.tsx`

Keep the file routes — replacing content is enough; deleting routes risks breaking shared layouts and bookmarked URLs.

#### Server-action guards
Add a small helper (e.g. `src/lib/read-only-guard.ts`) that returns a standard error: `{ error: "This app is read-only. Please use Tuttifruttimanagement.com to enter data." }`. Call it at the top of every write action in:
- `src/app/(authenticated)/branch-counts/actions.ts`
- `src/app/(authenticated)/transactions/actions.ts`
- `src/app/(authenticated)/items/actions.ts` (if writes exist)
- `src/app/(authenticated)/delivery-planner/actions.ts` (if writes exist)
- Any other action files discovered during implementation

#### Service worker / PWA
- Bump the service worker version (or the cache key) in `next.config.ts` (or the `next-pwa` config) to force installed PWAs to fetch the new shell on next launch.
- Verify `skipWaiting` and `clientsClaim` behavior — the new shell should activate without requiring a manual app close/reopen.

#### Offline IndexedDB queue (Dexie)
- Disable the sync engine entirely (`src/lib/offline/sync.ts`) — no auto-sync, no manual sync.
- On authenticated layout mount, if Dexie has queued unsynced transactions, show a one-time toast: `N entries are pending from before the switch — please re-enter them on Tuttifruttimanagement.com.`
- Do not auto-flush the queue. The server-action guard would reject those writes anyway, but a quiet failure is worse UX than a clear toast.

## What stays unchanged

- The weekly reports email cron (`src/app/api/weekly-report/route.ts`) — keep running. It's read-only and useful during the transition.
- Read pages: inventory, transactions list, branch counts list, deliveries list, items list, reports.
- Database schema and RLS policies — no changes needed; defense in depth is at the application layer.
- Auth provider (Supabase) — no changes.

## Edge cases

- **Stale Supabase session for non-owner:** Caught by the layout role check. Signed out, redirected to `/login`.
- **Stale browser tab with form already loaded:** UI is gone (replaced with redirect screen) but if anything older is cached, the server-action guard rejects the submission.
- **Direct API call / curl with valid token:** Server-action guard rejects.
- **Counter PWA install:** Service worker bump forces refresh. If they're offline when the bump lands, they see stale UI until next online launch — server-action guard still protects the database.
- **Owner accidentally lands on a write URL via old bookmark:** Sees `<ReadOnlyRedirect />`, clear next step.

## Test plan

- Counter logs in via saved bookmark → sees moved screen, no login form.
- Owner clicks "Owner login" → form appears → wrong password → generic error.
- Counter (test account with `role='counter'`) submits valid credentials → generic error, signed out.
- Owner submits valid credentials → reaches dashboard → sees banner → sees CTA card.
- Owner navigates to `/branch-counts/new` directly → sees redirect screen.
- Owner navigates to `/transactions/new` → sees redirect screen.
- Owner navigates to `/inventory` → data loads normally with banner above.
- Stale non-owner session: open `/dashboard` with a counter cookie → bounced to `/login`, signed out.
- Server-action guard: call a write action via direct fetch with valid owner session → returns the read-only error, no DB write.
- Service worker: install PWA, deploy, relaunch PWA → sees new shell.
- Offline queue: pre-seed Dexie with a queued transaction, log in as owner → toast appears once, sync engine does not run.
- Reports cron: trigger weekly-report endpoint → email still sends.
