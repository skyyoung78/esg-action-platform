create extension if not exists pgcrypto;

create table if not exists public.esg_company_grades (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  e_score numeric(5,2),
  s_score numeric(5,2),
  g_score numeric(5,2),
  overall_grade text,
  as_of_date date not null,
  source_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.esg_job_guides (
  id uuid primary key default gen_random_uuid(),
  job_name text not null unique,
  short_description text not null,
  required_skills text[] not null default '{}',
  details text,
  display_order int not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.esg_terms (
  id uuid primary key default gen_random_uuid(),
  term text not null unique,
  category text not null check (category in ('핵심용어', '공시프레임워크', 'E지표', 'S지표', 'G지표')),
  summary text not null,
  source_url text,
  is_active boolean not null default true,
  display_order int not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_esg_company_grades_active_date
  on public.esg_company_grades (is_active, as_of_date desc);

create index if not exists idx_esg_job_guides_active_order
  on public.esg_job_guides (is_active, display_order asc);

create index if not exists idx_esg_terms_active_category_order
  on public.esg_terms (is_active, category, display_order asc);

alter table public.esg_company_grades enable row level security;
alter table public.esg_job_guides enable row level security;
alter table public.esg_terms enable row level security;

drop policy if exists "Public read company grades" on public.esg_company_grades;
create policy "Public read company grades"
on public.esg_company_grades
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Public read job guides" on public.esg_job_guides;
create policy "Public read job guides"
on public.esg_job_guides
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Public read esg terms" on public.esg_terms;
create policy "Public read esg terms"
on public.esg_terms
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Service role write company grades" on public.esg_company_grades;
create policy "Service role write company grades"
on public.esg_company_grades
for all
to service_role
using (true)
with check (true);

drop policy if exists "Service role write job guides" on public.esg_job_guides;
create policy "Service role write job guides"
on public.esg_job_guides
for all
to service_role
using (true)
with check (true);

drop policy if exists "Service role write esg terms" on public.esg_terms;
create policy "Service role write esg terms"
on public.esg_terms
for all
to service_role
using (true)
with check (true);
