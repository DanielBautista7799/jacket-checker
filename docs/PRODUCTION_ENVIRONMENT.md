# Production Environment Contract

## Browser variables

Configure only these two values in Netlify. They are intentionally browser-visible and must be the publishable/anon credentials protected by RLS.

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Developer access is **not** controlled by a `VITE_` flag. Do not create `VITE_ENABLE_DEV_*` variables. The browser asks the `get-developer-access` Edge Function to verify the signed-in account against the server-only UUID registry.

Never create a `VITE_` variable for provider keys, service-role credentials, database credentials, rate-limit salts, or developer authorization.

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

## Developer authorization bootstrap

These legacy allowlist secrets are temporary bootstrap inputs only:

```text
DEVELOPER_USER_IDS
DEVELOPER_EMAILS
TREND_ADMIN_USER_IDS
TREND_ADMIN_EMAILS
```

Use your currently approved email long enough to initialize the first Owner at `/dev/access`. Once `public.developer_access_registry` contains an active Owner, the registry becomes the only active authorization source and the shared access module ignores every legacy allowlist secret.

After confirming the Owner can still open `/dev/access`, remove the bootstrap secrets:

```bash
npx supabase secrets unset \
  DEVELOPER_USER_IDS \
  DEVELOPER_EMAILS \
  TREND_ADMIN_USER_IDS \
  TREND_ADMIN_EMAILS
```

Supabase provides the project URL and server credentials to hosted functions. Never place the service-role key in the frontend.

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

The normal check supports local Supabase during development. Strict mode rejects localhost and rejects any legacy `VITE_ENABLE_DEV_*` variable.

Official references:

- https://docs.netlify.com/build/configure-builds/file-based-configuration/
- https://supabase.com/docs/guides/functions/secrets
- https://supabase.com/docs/guides/database/postgres/row-level-security
