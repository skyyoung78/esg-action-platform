alter table public.news
  add column if not exists original_snippet text;

comment on column public.news.original_snippet is '네이버 API 등에서 수집한 기사 원문 요약/발췌';
