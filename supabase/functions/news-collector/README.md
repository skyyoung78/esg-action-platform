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
supabase functions invoke news-collector
```
