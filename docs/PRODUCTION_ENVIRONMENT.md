# Production Environment Contract

## Browser variables

Configure these two values in Netlify. They are intentionally browser-visible and must be the publishable/anon credentials protected by RLS.

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Keep these false or omit them in production:

```text
VITE_ENABLE_DEV_SCORING
VITE_ENABLE_DEV_TRENDS
VITE_ENABLE_DEV_ANALYTICS
```

Never create a `VITE_` variable for provider keys, service-role credentials, database credentials, rate-limit salts, or developer allowlists.

## Supabase Edge Function secrets

Verify the secrets used by the active functions. Exact required provider keys depend on the provider choices enabled in the project.

Core production secrets:

```text
ALLOWED_ORIGINS
RATE_LIMIT_SALT
WEATHER_API_KEY
```

AI/provider secrets and optional overrides:

```text
GEMINI_API_KEY
OPENAI_API_KEY
JACKET_ANALYSIS_PROVIDER
JACKET_ANALYSIS_MODEL
JACKET_GEMINI_ANALYSIS_MODEL
JACKET_OPENAI_ANALYSIS_MODEL
JACKET_EMBEDDING_PROVIDER
JACKET_EMBEDDING_MODEL
```

Developer authorization:

```text
DEVELOPER_USER_IDS
DEVELOPER_EMAILS
TREND_ADMIN_USER_IDS
TREND_ADMIN_EMAILS
```

Supabase provides the project URL and keys to hosted functions. Do not place the service-role key in the frontend.

## Allowed origins

Before function deployment, set `ALLOWED_ORIGINS` to the exact HTTPS frontend origin. Multiple origins are comma-separated. Do not include paths or a trailing slash.

## Local files

- `.env.example` is committed and contains placeholders only.
- `.env`, `.env.local`, `.env.production`, and `.env.production.local` are private.
- Supabase function secret files are private and must remain ignored by Git.

## Validation

```bash
npm run test:production-config
npm run test:production-config:strict
```

The normal check supports local Supabase during development. Strict mode rejects localhost and enabled developer route flags.

Official references:

- https://docs.netlify.com/build/configure-builds/file-based-configuration/
- https://supabase.com/docs/guides/functions/secrets
