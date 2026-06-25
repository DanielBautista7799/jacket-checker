# JacketCheck Architecture

## System overview

```text
Browser / React SPA
        |
        | Supabase JS client
        v
Supabase Auth + Postgres + Storage + Edge Functions
        |
        +-- WeatherAPI through get-weather
        +-- Gemini/OpenAI through server-side provider modules
```

## Frontend

- React 19 with Vite 7
- React Router routes for guest, account, jacket, profile, history, and developer experiences
- Tailwind CSS 4 plus project design tokens and accessibility utilities
- Context providers for authentication, developer authorization, profile, analytics, weather, trends, wardrobe, recommendation learning, and network status

## Recommendation flow

1. User selects a location and forecast window.
2. `get-weather` returns current and hourly forecast data.
3. `analyzeForecast` derives the selected-window weather state.
4. `calculateJacketScore` creates the baseline weather score.
5. Personalized mode applies profile modifiers.
6. Protection overrides prevent warm rain or wind from producing an unsafe NO.
7. `rankClosetItems` filters to active jackets and ranks protection, profile fit, feedback learning, recent use, and diversity.
8. Style suggestions are generated from the selected owned jacket and optional internal trend rules.
9. The result is saved to history and can receive Fire, Good, or Not It feedback.

## Jacket image flow

1. Client validates MIME, extension, size, dimensions, duplicates, and filename safety.
2. Storage path uses user UUID, jacket UUID, and generated image UUID.
3. Original image is stored in the private `closet-images` bucket.
4. Database stores the private path, never a signed URL.
5. Client requests temporary signed URLs and deduplicates concurrent signing requests.
6. Replacement or deletion invalidates affected caches.

## AI analysis and embeddings

- Analysis is performed by Supabase Edge Functions, not in the browser.
- Provider registry supports Gemini, optional OpenAI, and manual fallback.
- Structured responses are validated and normalized before they reach the form.
- Embeddings are stored in `jacket_embeddings` with provider, model, dimensions, source hash, and status metadata.
- Similarity is user-isolated and optional; failure does not block jacket creation.

## Security boundaries

- Browser receives only the Supabase URL and publishable/anon key.
- Provider keys, service-role credentials, developer allowlists, and rate-limit salt stay in Supabase secrets.
- Protected Edge Functions derive the user from the verified JWT.
- Every `/dev/*` route is gated by the `get-developer-access` Edge Function before rendering. Developer analytics and trend administration independently enforce the same server-side UUID registry. `/dev/access` is the readable Owner/Admin roster and immutable grant/revoke audit view.
- Database RLS and private Storage policies remain the final data boundary.

## Production topology

- GitHub: source repository
- Netlify: static Vite build from `dist`
- Supabase: Auth, database, Storage, Edge Functions, logs
- WeatherAPI: accessed only through `get-weather`
- AI providers: accessed only through Edge Functions
