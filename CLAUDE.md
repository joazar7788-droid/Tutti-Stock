# Tutti Stock System

Inventory tracking web app for a frozen yogurt business with 1 warehouse and 6 branches.

## Tech Stack

- **Next.js 16** (App Router) + TypeScript
- **Supabase** (Postgres, Auth, RLS)
- **Tailwind CSS v4**
- **Resend** for email
- **Dexie.js** for offline IndexedDB
- **@ducanh2912/next-pwa** for PWA/service worker

## Project Structure

```
src/
├── app/
│   ├── login/                    # Auth (email/password)
│   ├── api/weekly-report/        # Cron-callable report endpoint
│   └── (authenticated)/          # All protected pages
│       ├── dashboard/            # Quick action tiles
│       ├── transactions/new/     # Deliver, Receive, Adjust flows
│       ├── inventory/            # Stock levels + filters
│       ├── items/                # Item CRUD (staff add, owner edit)
│       └── reports/              # Owner-only weekly summary
├── components/                   # Shared UI components
├── lib/
│   ├── supabase/                 # Server, client, admin clients
│   ├── offline/                  # Dexie DB, sync engine, hooks
│   ├── email/                    # Report HTML template + CSV builder
│   ├── context/                  # UserProvider (role, profile)
│   └── database.types.ts         # TypeScript types for DB schema
└── middleware.ts                 # Auth session + redirects
supabase/
├── migrations/                   # Schema + RLS policies
└── seed.sql                      # Locations + sample items
```

## Key Architecture Decisions

- **Append-only ledger**: Transactions are never updated/deleted. Inventory = SUM(in) - SUM(out).
- **Offline-first**: Transactions queue to IndexedDB when offline, auto-sync on reconnect.
- **Roles**: `owner` (full access) and `staff` (add items, create transactions, view inventory).
- **No signup UI**: Owner creates accounts in Supabase dashboard.

## Database

- **Supabase project**: `pqwvpzeizfvprxolmznv`
- Tables: `locations`, `items`, `profiles`, `transactions`
- View: `inventory_levels` (computed on-hand per item per location)
- RLS enabled on all tables

## Locations

Warehouse, Loshusan, Manor Park, Sovereign, Mo-Bay, Portmore, Ocho Rios

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build (uses --webpack for PWA)
npm start            # Run production
```

## Environment Variables

See `.env.example`. Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `CRON_SECRET`, `REPORT_RECIPIENT_EMAIL`.

## Development Notes

- Build uses `--webpack` flag because PWA plugin is webpack-based (Turbopack default in Next.js 16)
- Supabase clients are untyped (no `Database` generic) to avoid strict type inference issues — types are in `database.types.ts` for reference
- Middleware warning about "proxy" convention is cosmetic — middleware still works in Next.js 16
