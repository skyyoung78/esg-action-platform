# jobs-collector

Supabase Edge Function for Saramin RSS job collection.

## Required environment variables

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Local run

```bash
supabase functions serve jobs-collector --env-file .env.local
```

## Deploy

```bash
supabase functions deploy jobs-collector
```

## Invoke manually

```bash
supabase functions invoke jobs-collector
```
