alter table public.news
  add column if not exists original_body text,
  add column if not exists student_trend_summary text;

comment on column public.news.original_body is '기사 URL에서 수집한 원문 본문 TEXT';
comment on column public.news.student_trend_summary is '원문 기반 대학생 맞춤 ESG 트렌드 요약';
