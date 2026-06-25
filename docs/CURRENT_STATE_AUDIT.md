# Phase 14 Current-State Audit

## Audit scope

The audit covered the uploaded root configuration, React source tree, test suite, Supabase migrations, verification SQL, Edge Function shared modules, and active-function inventory.

## Confirmed application routes

| Route | Access | Purpose |
|---|---|---|
| `/` | Public | Fast guest jacket check |
| `/auth` | Public | Sign in and account creation |
| `/app` | Authenticated | Personalized jacket check |
| `/profile` | Authenticated | Comfort, style, location, trend, analytics, and account settings |
| `/wardrobe` | Authenticated | Private owned-jacket management |
| `/closet` | Redirect | Legacy redirect to `/wardrobe` |
| `/history` | Authenticated | Recommendation history and learning reset |
| `/dev/scoring` | Authenticated + build flag | Recommendation diagnostics |
| `/dev/trends` | Authenticated + build flag | Trend diagnostics and administration |
| `/dev/analytics` | Authenticated + build flag | Privacy-safe analytics dashboard |

Unknown routes redirect to `/`.

## Provider order

The React provider tree is:

1. `NetworkStatusProvider`
2. `AuthProvider`
3. `DeveloperAccessProvider`
4. `ProfileProvider`
5. `AnalyticsProvider`
6. `WeatherProvider`
7. `StyleTrendProvider`
8. `WardrobeProvider`
9. `RecommendationLearningProvider`

This order is retained because downstream providers consume authentication and profile state.

## Active Edge Functions

- `get-weather`
- `analyze-closet-item`
- `analyze-wardrobe-item`
- `generate-jacket-embedding`
- `sync-style-trends`
- `track-analytics`
- `get-analytics-dashboard`
- `get-developer-access`
- `delete-account`

## Confirmed production controls

- One shared Supabase browser client
- Browser requests identify the application with `x-application-name`
- Centralized Edge Function CORS, request IDs, authentication, developer access, safe errors, security headers, logging, JSON validation, and rate limiting
- Private `closet-images` Storage bucket
- Signed image URLs instead of public URLs
- UUID image paths
- Upload MIME, extension, size, dimension, and duplicate validation
- Jacket-only recommendation ranking
- Privacy-safe analytics metadata allowlist
- Protected account deletion using the authenticated caller
- Route-level and application-level error boundaries
- Online/offline state and accessible status messaging

## Verified predeployment blocker fixed by this package

The uploaded source imports these files but did not include them:

- `src/components/ui/Alert.jsx`
- `src/components/ui/ErrorState.jsx`

Both are supplied as complete new files in the Phase 14 package. No existing application component was partially patched.

## Files intentionally left unchanged

The recommendation engine, profile logic, wardrobe context, weather context, AI providers, embedding logic, analytics context, database migrations, and existing Edge Functions are not rewritten by Phase 14. The production sprint adds configuration, validation, documentation, and the two missing UI dependencies only.

## Predeployment risks

| Risk | Control |
|---|---|
| Nested React routes return 404 on refresh | `public/_redirects` SPA rewrite |
| Development flags enabled in production | Environment validator and Netlify defaults |
| Secrets included in browser bundle | Existing audits plus production bundle scanner |
| Missing security headers | `_headers`, Phase 14 structural test, live smoke test |
| Production build contains local URLs or source maps | Production build validator |
| Live backend configuration differs from source | Phase 13 and Phase 14 SQL verification |
| Destructive account deletion test uses a real account | Disposable-account-only checklist |
| Optional AI or analytics outage blocks recommendations | Existing safe-failure design and reliability checklist |

## Audit conclusion

The application architecture is suitable for a Netlify-hosted Vite SPA with Supabase providing Auth, Postgres, Storage, and Edge Functions. Deployment remains pending until the full predeployment gate passes.
