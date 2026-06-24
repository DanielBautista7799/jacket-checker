# Deployment Guide

## Status

Deployment is the final Phase 14 checkpoint and must not begin until `npm run test:predeploy` passes.

## Planned platform

- Frontend: Netlify
- Backend/Auth/Database/Storage/Edge Functions: existing Supabase project
- Build command: `npm run build`
- Publish directory: `dist`
- Node: 22

Netlify's Vite guidance uses `npm run build` and `dist`, and React history routing requires a rewrite to `index.html`. This repository supplies that rewrite through `public/_redirects`.

## Final deployment sequence

These steps are intentionally deferred until the predeployment gate is complete.

1. Connect the GitHub repository to Netlify.
2. Confirm Netlify reads `netlify.toml`.
3. Add only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to Netlify.
4. Leave all developer route flags false or unset.
5. Create the first HTTPS Netlify URL.
6. Set the exact frontend origin in the Supabase `ALLOWED_ORIGINS` secret.
7. Verify `RATE_LIMIT_SALT`, weather, AI, and developer authorization secrets.
8. Apply pending forward migrations with `npx supabase db push` only if the migration history reports pending files.
9. Deploy the eight active Edge Functions.
10. Deploy the Netlify frontend.
11. Run Phase 13 RLS, Storage, and summary verification SQL.
12. Run `supabase/verification/phase14_production_verify.sql`.
13. Run public production smoke tests.
14. Run optional authenticated smoke tests using a disposable account.
15. Manually verify destructive account deletion with that disposable account.
16. Record results in `docs/PHASE14_LIVE_TEST_RESULTS.md`.

## Active function deployment order

```bash
npx supabase functions deploy get-weather
npx supabase functions deploy analyze-closet-item
npx supabase functions deploy analyze-wardrobe-item
npx supabase functions deploy generate-jacket-embedding
npx supabase functions deploy sync-style-trends
npx supabase functions deploy track-analytics
npx supabase functions deploy get-analytics-dashboard
npx supabase functions deploy delete-account
```

## Production smoke tests

Public:

```bash
PRODUCTION_BASE_URL=https://YOUR_SITE.netlify.app npm run test:production-smoke
```

Optional authenticated checks with a disposable account:

```bash
PRODUCTION_BASE_URL=https://YOUR_SITE.netlify.app \
RUN_AUTHENTICATED_SMOKE=true \
PRODUCTION_TEST_EMAIL=DISPOSABLE_EMAIL \
PRODUCTION_TEST_PASSWORD=DISPOSABLE_PASSWORD \
npm run test:production-smoke
```

Do not use a primary account for deletion validation.

Official references:

- https://docs.netlify.com/build/frameworks/framework-setup-guides/vite/
- https://docs.netlify.com/manage/routing/redirects/overview/
- https://docs.netlify.com/manage/routing/headers/
- https://supabase.com/docs/guides/functions/deploy
