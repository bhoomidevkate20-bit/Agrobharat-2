-- =========================================================
-- AGRO BHARAT — SUPABASE SCHEMA
-- Run this whole file once in: Supabase Dashboard > SQL Editor
-- =========================================================

-- ---------- 1. ENUMS ----------
create type user_role as enum ('customer', 'farmer', 'fpo', 'delivery_agent', 'inspector');
create type listing_status as enum ('draft', 'pending_inspection', 'approved', 'rejected', 'sold_out');
create type bid_status as enum ('pending', 'accepted', 'rejected', 'withdrawn');
create type order_status as enum ('placed', 'confirmed', 'out_for_delivery', 'delivered', 'cancelled');
create type delivery_status as enum ('open', 'accepted', 'picked_up', 'delivered', 'declined');

-- ---------- 2. PROFILES ----------
-- One row per auth.users row. Holds EVERYTHING (public + private);
-- column-level privacy is handled with the `public_profiles` view below.
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  role user_role not null,
  location text,
  avg_rating numeric(3,2) default 0,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "profiles: owner can read own row"
  on profiles for select
  using (auth.uid() = id);

create policy "profiles: owner can update own row"
  on profiles for update
  using (auth.uid() = id);

create policy "profiles: owner can insert own row"
  on profiles for insert
  with check (auth.uid() = id);

-- Public, column-limited view — safe to expose to any logged-in user.
-- (No phone number, no exact private data.)
create view public_profiles as
  select id, full_name, role, location, avg_rating
  from profiles;

-- Auto-create a profile row whenever someone signs up.
-- Expects role & full_name to be passed in supabase.auth.signUp() options.data
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, full_name, phone, role, location)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'New User'),
    new.raw_user_meta_data->>'phone',
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'customer'),
    new.raw_user_meta_data->>'location'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ---------- 3. LISTINGS ----------
create table listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  owner_role user_role not null check (owner_role in ('farmer', 'fpo')),
  crop_type text not null,
  quantity_kg numeric not null check (quantity_kg > 0),
  price_per_kg numeric not null check (price_per_kg > 0),
  location text not null,
  moisture_pct numeric,
  harvested_date date,
  status listing_status not null default 'pending_inspection',
  grade text,               -- set only by inspector
  expiry_date date,         -- set only by inspector
  created_at timestamptz default now()
);

alter table listings enable row level security;

-- Public marketplace: anyone signed in can see APPROVED listings.
create policy "listings: public can view approved"
  on listings for select
  using (status = 'approved' or owner_id = auth.uid());

-- Inspectors need to see everything pending inspection.
create policy "listings: inspectors view pending"
  on listings for select
  using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'inspector')
  );

create policy "listings: farmer/fpo can create own"
  on listings for insert
  with check (
    owner_id = auth.uid()
    and exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('farmer', 'fpo'))
  );

create policy "listings: owner can update own (pre-approval fields)"
  on listings for update
  using (owner_id = auth.uid());

create policy "listings: inspector can grade any listing"
  on listings for update
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'inspector'));

-- ---------- 4. BIDS (FPO <-> Farmer, FPO <-> Customer, Customer <-> Farmer) ----------
create table bids (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  bidder_id uuid not null references profiles(id) on delete cascade,
  bidder_role user_role not null,
  quantity_kg numeric not null check (quantity_kg > 0),
  offered_price_per_kg numeric not null check (offered_price_per_kg > 0),
  status bid_status not null default 'pending',
  created_at timestamptz default now()
);

alter table bids enable row level security;

create policy "bids: bidder or listing owner can view"
  on bids for select
  using (
    bidder_id = auth.uid()
    or exists (select 1 from listings l where l.id = listing_id and l.owner_id = auth.uid())
  );

create policy "bids: any authenticated non-owner can bid"
  on bids for insert
  with check (
    bidder_id = auth.uid()
    and not exists (select 1 from listings l where l.id = listing_id and l.owner_id = auth.uid())
  );

create policy "bids: bidder can withdraw, owner can accept/reject"
  on bids for update
  using (
    bidder_id = auth.uid()
    or exists (select 1 from listings l where l.id = listing_id and l.owner_id = auth.uid())
  );

-- ---------- 5. ORDERS (Customer / FPO checkout) ----------
create table orders (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id),
  buyer_id uuid not null references profiles(id),
  quantity_kg numeric not null check (quantity_kg > 0),
  product_price numeric not null,
  delivery_charge numeric not null default 40,
  total_amount numeric generated always as (product_price + delivery_charge) stored,
  delivery_address text not null,
  status order_status not null default 'placed',
  created_at timestamptz default now()
);

alter table orders enable row level security;

create policy "orders: buyer or seller can view"
  on orders for select
  using (
    buyer_id = auth.uid()
    or exists (select 1 from listings l where l.id = listing_id and l.owner_id = auth.uid())
    or exists (select 1 from deliveries d where d.order_id = orders.id and d.delivery_agent_id = auth.uid())
  );

create policy "orders: buyer can place order"
  on orders for insert
  with check (buyer_id = auth.uid());

create policy "orders: buyer or seller can update status"
  on orders for update
  using (
    buyer_id = auth.uid()
    or exists (select 1 from listings l where l.id = listing_id and l.owner_id = auth.uid())
  );

-- ---------- 6. DELIVERIES (Dispatch board) ----------
create table deliveries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  delivery_agent_id uuid references profiles(id),
  pickup_location text not null,
  dropoff_location text not null,
  weight_kg numeric not null,
  status delivery_status not null default 'open',
  created_at timestamptz default now()
);

alter table deliveries enable row level security;

create policy "deliveries: open jobs visible to all delivery agents"
  on deliveries for select
  using (
    status = 'open'
    or delivery_agent_id = auth.uid()
    or exists (select 1 from orders o where o.id = order_id and o.buyer_id = auth.uid())
  );

create policy "deliveries: seller creates delivery job on order confirm"
  on deliveries for insert
  with check (
    exists (
      select 1 from orders o join listings l on l.id = o.listing_id
      where o.id = order_id and l.owner_id = auth.uid()
    )
  );

create policy "deliveries: agent can accept/decline/update own claimed job"
  on deliveries for update
  using (status = 'open' or delivery_agent_id = auth.uid());

-- ---------- 7. HELPFUL INDEXES ----------
create index idx_listings_status on listings(status);
create index idx_listings_owner on listings(owner_id);
create index idx_bids_listing on bids(listing_id);
create index idx_orders_buyer on orders(buyer_id);
create index idx_deliveries_status on deliveries(status);

-- =========================================================
-- Done. Next: in Supabase Dashboard > Authentication > Providers,
-- make sure Email provider is ON. Copy your Project URL + anon key
-- into frontend/.env (see .env.example).
-- =========================================================
