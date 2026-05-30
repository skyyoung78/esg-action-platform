create extension if not exists pgcrypto;

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  company text not null,
  location text,
  job_type text,
  deadline date,
  apply_url text not null,
  rss_guid text not null unique,
  collected_at timestamptz not null,
  created_at timestamptz default now()
);

create index if not exists idx_jobs_deadline on public.jobs (deadline);
create index if not exists idx_jobs_created_at on public.jobs (created_at desc);

alter table public.jobs enable row level security;

drop policy if exists "Public read jobs" on public.jobs;
create policy "Public read jobs"
on public.jobs
for select
to anon, authenticated
using (true);

drop policy if exists "Service role write jobs" on public.jobs;
create policy "Service role write jobs"
on public.jobs
for all
to service_role
using (true)
with check (true);
