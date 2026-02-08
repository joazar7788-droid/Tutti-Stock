-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

create type location_type as enum ('warehouse', 'branch');
create type user_role as enum ('owner', 'staff');
create type transaction_type as enum ('RECEIVE', 'TRANSFER', 'ADJUST');

-- ============================================
-- TABLES
-- ============================================

-- Locations: warehouse + branches
create table locations (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  type location_type not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Items: inventory catalog
create table items (
  id uuid primary key default uuid_generate_v4(),
  sku text not null unique,
  name text not null,
  category text,
  unit text not null default 'pcs',
  reorder_point integer not null default 0,
  target_stock integer not null default 0,
  is_active boolean not null default true,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Profiles: links auth.users to roles
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role user_role not null default 'staff',
  created_at timestamptz not null default now()
);

-- Transactions: the inventory ledger (append-only)
create table transactions (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  created_by uuid not null references profiles(id),
  transaction_type transaction_type not null,
  item_id uuid not null references items(id),
  from_location_id uuid references locations(id),
  to_location_id uuid references locations(id),
  qty integer not null check (qty > 0),
  note text,
  reason text,

  -- Enforce transaction type rules
  constraint valid_receive check (
    transaction_type != 'RECEIVE' or (to_location_id is not null and from_location_id is null)
  ),
  constraint valid_transfer check (
    transaction_type != 'TRANSFER' or (from_location_id is not null and to_location_id is not null)
  ),
  constraint valid_adjust check (
    transaction_type != 'ADJUST' or (
      (from_location_id is not null and to_location_id is null) or
      (from_location_id is null and to_location_id is not null)
    )
  )
);

-- ============================================
-- INDEXES
-- ============================================

create index idx_transactions_item on transactions(item_id);
create index idx_transactions_from on transactions(from_location_id);
create index idx_transactions_to on transactions(to_location_id);
create index idx_transactions_created on transactions(created_at desc);
create index idx_items_active on items(is_active) where is_active = true;

-- ============================================
-- INVENTORY VIEW (on-hand per item per location)
-- ============================================

create or replace view inventory_levels as
select
  i.id as item_id,
  i.name as item_name,
  i.sku,
  i.category,
  i.unit,
  i.reorder_point,
  i.target_stock,
  i.is_favorite,
  l.id as location_id,
  l.name as location_name,
  l.type as location_type,
  coalesce(incoming.total, 0) - coalesce(outgoing.total, 0) as on_hand
from items i
cross join locations l
left join lateral (
  select sum(t.qty) as total
  from transactions t
  where t.item_id = i.id and t.to_location_id = l.id
) incoming on true
left join lateral (
  select sum(t.qty) as total
  from transactions t
  where t.item_id = i.id and t.from_location_id = l.id
) outgoing on true
where i.is_active = true and l.is_active = true;

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger items_updated_at
  before update on items
  for each row execute function update_updated_at();
