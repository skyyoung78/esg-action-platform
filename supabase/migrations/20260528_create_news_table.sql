create extension if not exists pgcrypto;

create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text[] not null,
  esg_category varchar(1) not null check (esg_category in ('E', 'S', 'G')),
  source text not null,
  original_url text not null unique,
  published_at timestamptz not null,
  collected_at timestamptz not null,
  created_at timestamptz default now()
);

create index if not exists idx_news_published_at on public.news (published_at desc);
create index if not exists idx_news_esg_category on public.news (esg_category);

alter table public.news enable row level security;

drop policy if exists "Public read news" on public.news;
create policy "Public read news"
on public.news
for select
to anon, authenticated
using (true);

drop policy if exists "Service role write news" on public.news;
create policy "Service role write news"
on public.news
for all
to service_role
using (true)
with check (true);
