alter table public.news
  add column if not exists week_start date;

create index if not exists idx_news_week_start on public.news (week_start desc, published_at desc);

comment on column public.news.week_start is 'KST 기준 해당 주 월요일 (주간 뉴스 묶음용)';
