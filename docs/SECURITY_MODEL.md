# JacketCheck security model

## Browser-safe configuration

Only these values belong in Vite environment variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- optional developer-route feature flags

Weather, Gemini, OpenAI, Supabase service-role, developer allowlists, and rate-limit salt remain Supabase Edge Function secrets.

## Data isolation

User-owned database rows rely on Supabase Row Level Security and `auth.uid()` ownership checks. Private jacket images use the `closet-images` bucket and user/jacket/image path segments. Edge Functions re-check authentication and ownership before expensive or destructive operations.

## Server-only operations

The service-role key is used only inside Edge Functions for aggregate analytics, rate-limit buckets, trend administration, and account deletion. It must never appear in frontend code, logs, screenshots, or repository files.

## Abuse controls

Edge Functions use hashed rate-limit scopes. Raw IP addresses are not stored. Rate-limit database failures fail open so availability is preserved, while validation, authentication, and ownership checks still apply.

## Account deletion

The delete-account function derives the target user from the verified access token, removes private Storage objects, then deletes the Auth user. Foreign-key cascades remove account-linked rows.
