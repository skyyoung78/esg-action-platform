# news-collector

Supabase Edge Function for ESG news collection and AI summary generation.

## Required environment variables

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NAVER_CLIENT_ID`
- `NAVER_CLIENT_SECRET`
- `OPENAI_API_KEY`

## Local run

```bash
supabase functions serve news-collector --env-file .env.local
```

## Deploy

```bash
supabase functions deploy news-collector
```

## Invoke manually

```bash
# 신규 수집 (최근 7일, URL 중복 시 갱신)
supabase functions invoke news-collector

# 기존 DB 기사 백필 (original_body · student_trend_summary)
supabase functions invoke news-collector --query 'mode=backfill'
```

## Local backfill (Node, user-web)

```bash
cd user-web
# .env.local 에 SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY 필요
npm run news:backfill
```
