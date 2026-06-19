create extension if not exists pgcrypto;

create table if not exists public.volunteers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  esg_category varchar(1) not null check (esg_category in ('E', 'S')),
  hours text not null default '미정',
  location text not null default '미정',
  capacity text,
  benefit text,
  description text,
  image_url text,
  target_outlink_url text not null,
  is_1365 boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.volunteer_click_logs (
  id bigserial primary key,
  volunteer_id uuid references public.volunteers(id) on delete set null,
  clicked_at timestamptz not null default now(),
  user_agent text
);

create index if not exists idx_volunteers_active_category
  on public.volunteers (esg_category, deleted_at, created_at desc);

create index if not exists idx_volunteer_click_logs_volunteer
  on public.volunteer_click_logs (volunteer_id, clicked_at desc);

alter table public.volunteers enable row level security;
alter table public.volunteer_click_logs enable row level security;

drop policy if exists "Public read active volunteers" on public.volunteers;
create policy "Public read active volunteers"
on public.volunteers
for select
to anon, authenticated
using (deleted_at is null);

drop policy if exists "Service role write volunteers" on public.volunteers;
create policy "Service role write volunteers"
on public.volunteers
for all
to service_role
using (true)
with check (true);

drop policy if exists "Public insert click logs" on public.volunteer_click_logs;
create policy "Public insert click logs"
on public.volunteer_click_logs
for insert
to anon, authenticated
with check (true);

drop policy if exists "Service role read click logs" on public.volunteer_click_logs;
create policy "Service role read click logs"
on public.volunteer_click_logs
for select
to service_role
using (true);
