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

1. Confirm `npm run test:predeploy` passes locally.
2. Push the final source to GitHub.
3. Connect the GitHub repository to Netlify.
4. Confirm Netlify reads `netlify.toml`.
5. Add only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to Netlify.
6. Confirm no legacy `VITE_ENABLE_DEV_*` variables exist in Netlify.
7. Create the first HTTPS Netlify URL.
8. Set the exact frontend origin in the Supabase `ALLOWED_ORIGINS` secret.
9. Keep your current approved email in `DEVELOPER_EMAILS` temporarily for first-owner bootstrap.
10. Apply pending forward migrations with `npx supabase db push`.
11. Deploy all ten active Edge Functions, including both developer-access functions.
12. Start the app locally or open the deployed site, sign in with the approved account, and open **Account → Developer tools → Access**.
13. Select **Initialize owner registry**.
14. Confirm the roster shows your account as **Owner · Active**.
15. Remove the four legacy developer/trend allowlist secrets.
16. Refresh `/dev/access` and confirm access remains available from the database registry.
17. Deploy or redeploy the Netlify frontend after the final backend configuration is verified.
18. Run Phase 13 RLS, Storage, and summary verification SQL.
19. Run `supabase/verification/developer_access_registry_verify.sql`.
20. Run `supabase/verification/phase14_production_verify.sql`.
21. Run public production smoke tests.
22. Run optional authenticated smoke tests using a disposable account.
23. Manually verify destructive account deletion with that disposable account.
24. Record results in `docs/PHASE14_LIVE_TEST_RESULTS.md`.

## Active function deployment order

```bash
npx supabase functions deploy get-weather
npx supabase functions deploy analyze-closet-item
npx supabase functions deploy analyze-wardrobe-item
npx supabase functions deploy generate-jacket-embedding
npx supabase functions deploy sync-style-trends
npx supabase functions deploy track-analytics
npx supabase functions deploy get-analytics-dashboard
npx supabase functions deploy get-developer-access
npx supabase functions deploy manage-developer-access
npx supabase functions deploy delete-account
```

## Remove bootstrap allowlists

After Owner initialization succeeds:

```bash
npx supabase secrets unset \
  DEVELOPER_USER_IDS \
  DEVELOPER_EMAILS \
  TREND_ADMIN_USER_IDS \
  TREND_ADMIN_EMAILS
```

The registry remains the source of truth. Future access changes happen from `/dev/access`.

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
- https://supabase.com/docs/guides/auth/managing-user-data
