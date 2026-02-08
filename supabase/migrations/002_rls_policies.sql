-- ============================================
-- ENABLE RLS
-- ============================================

alter table locations enable row level security;
alter table items enable row level security;
alter table transactions enable row level security;
alter table profiles enable row level security;

-- ============================================
-- HELPER: get current user's role
-- ============================================

create or replace function get_user_role()
returns user_role as $$
  select role from profiles where id = auth.uid()
$$ language sql security definer stable;

-- ============================================
-- PROFILES POLICIES
-- ============================================

create policy "Users can read own profile"
  on profiles for select
  using (id = auth.uid());

create policy "Owners can read all profiles"
  on profiles for select
  using (get_user_role() = 'owner');

create policy "Owners can update profiles"
  on profiles for update
  using (get_user_role() = 'owner');

-- ============================================
-- LOCATIONS POLICIES
-- ============================================

create policy "Authenticated can read locations"
  on locations for select
  to authenticated
  using (true);

create policy "Owners can manage locations"
  on locations for all
  using (get_user_role() = 'owner');

-- ============================================
-- ITEMS POLICIES
-- ============================================

create policy "Authenticated can read items"
  on items for select
  to authenticated
  using (true);

create policy "Authenticated can insert items"
  on items for insert
  to authenticated
  with check (true);

create policy "Owners can update items"
  on items for update
  using (get_user_role() = 'owner');

create policy "Owners can delete items"
  on items for delete
  using (get_user_role() = 'owner');

-- ============================================
-- TRANSACTIONS POLICIES
-- ============================================

create policy "Authenticated can read transactions"
  on transactions for select
  to authenticated
  using (true);

create policy "Authenticated can create transactions"
  on transactions for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "Owners can delete transactions"
  on transactions for delete
  using (get_user_role() = 'owner');

-- ============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    'staff'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
