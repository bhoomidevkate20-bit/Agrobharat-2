-- =========================================================
-- AGRO BHARAT — MIGRATION 002: subscriptions, reputation,
-- inspector credentials, payment details, order payment method
-- Run this in Supabase SQL Editor AFTER schema.sql.
-- It only ADDS things — nothing existing is dropped or changed.
-- =========================================================

-- ---------- 1. Subscription flag (Farmer / FPO / Delivery Agent) ----------
alter table profiles add column if not exists is_subscribed boolean not null default false;

-- ---------- 2. Inspector self-managed credentials ----------
-- Only meaningful when role = 'inspector'. Editable ONLY by the inspector
-- themselves — already guaranteed by the existing "owner can update own row"
-- policy on profiles, so no new policy is needed here.
alter table profiles add column if not exists certified_id text;
alter table profiles add column if not exists qualification text;

-- Public directory so an FPO (or anyone) can see an inspector's credentials.
create or replace view inspector_directory as
  select id, full_name, certified_id, qualification, location
  from profiles
  where role = 'inspector';

-- ---------- 3. FPO ↔ Field Inspector assignment ----------
-- Which inspector a given FPO has on record. Editable only by that FPO
-- (again covered by the existing owner-update policy on profiles).
alter table profiles add column if not exists field_inspector_id uuid references profiles(id);

-- ---------- 4. Receiving-payment details (Farmer / FPO / Delivery Agent) ----------
alter table profiles add column if not exists upi_id text;
alter table profiles add column if not exists payment_phone text;
alter table profiles add column if not exists qr_image_url text;

-- ---------- 5. Payment method chosen at checkout ----------
alter table orders add column if not exists payment_method text;

-- ---------- 6. Ratings & reputation (public, per completed order) ----------
create table if not exists ratings (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  rater_id uuid not null references profiles(id),
  ratee_id uuid not null references profiles(id),
  ratee_role user_role not null,
  quality numeric(2,1) check (quality between 1 and 5),
  quantity_accuracy numeric(2,1) check (quantity_accuracy between 1 and 5),
  timeliness numeric(2,1) check (timeliness between 1 and 5),
  comment text,
  created_at timestamptz default now(),
  unique (order_id, ratee_id)
);

alter table ratings enable row level security;

-- Reputation is public data per the platform's visibility matrix.
create policy "ratings: anyone can view"
  on ratings for select
  using (true);

create policy "ratings: only the buyer of a delivered order can rate it"
  on ratings for insert
  with check (
    rater_id = auth.uid()
    and exists (
      select 1 from orders o
      where o.id = order_id and o.buyer_id = auth.uid() and o.status = 'delivered'
    )
  );

-- Public, pre-aggregated reputation summary — this is what the UI reads.
create or replace view reputation_summary as
  select
    ratee_id,
    ratee_role,
    round(avg(quality), 1) as avg_quality,
    round(avg(quantity_accuracy), 1) as avg_quantity_accuracy,
    round(avg(timeliness), 1) as avg_timeliness,
    count(*) as rating_count,
    count(distinct order_id) as orders_rated
  from ratings
  group by ratee_id, ratee_role;

-- =========================================================
-- Done. No existing table, column, or policy was modified.
-- =========================================================
