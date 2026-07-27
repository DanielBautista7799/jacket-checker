# 🧥 Should I Wear a Jacket?

A weather intelligence and personal wardrobe recommendation application that answers a practical question:

> Should I wear a jacket for the place and time window I care about?

The application combines live weather, hourly forecast trends, location data, user comfort preferences, personal style preferences, a private jacket wardrobe, AI-assisted jacket analysis, visual similarity, recommendation history, explicit user feedback, curated style-trend guidance, privacy-safe analytics, and production security controls.

The goal is to keep the user experience simple while the recommendation logic remains explainable, secure, and personalized under the hood.

---

# Live Application

The completed production application is available at:

**[https://jacketchecker.netlify.app/](https://jacketchecker.netlify.app/)**

The public Guest Mode can be used without an account. Personalized wardrobe recommendations, saved profiles, recommendation history, feedback learning, and private jacket management require authentication.

Mobile APP:
Currently Under Construction 

---

# Project Status

- Begin App implementation with aim to create a widget on IOS
- Product implementation: complete through Phase 15
- Phase 14 production-readiness work: complete
- Phase 14.9.5 Storm Glass interface: complete and deployed
- Deployment status: live in production
- Frontend hosting: Netlify
- Permanent production URL: [https://jacketchecker.netlify.app/](https://jacketchecker.netlify.app/)
- Backend, authentication, database, storage, and Edge Functions: Supabase
- Production deployment and live verification: complete
- Phase 15 documentation and portfolio polish: complete

Jacket Checker is a completed, deployed production project. The public application, authenticated workflows, Supabase services, private Storage system, Edge Functions, security controls, and production configuration are represented in this final README.

Production-readiness and live-verification records are maintained in:

```text
docs/PHASE14_LIVE_TEST_RESULTS.md
```

---

# Current Product

The application has two intentionally separate experiences:

1. **Guest Mode**
2. **Personalized Account Mode**

Guest Mode is fast and low-friction.

Personalized Mode uses saved profile information, owned jackets, style preferences, forecast context, recommendation history, learned feedback, visual similarity, and curated style-trend rules.

## Storm Glass Interface

The application uses one cohesive **Storm Glass** design system across guest and authenticated experiences. The visual layer is intentionally atmospheric and premium without changing the weather, recommendation, authentication, wardrobe, feedback, history, analytics, or Supabase data flows.

The interface includes:

- Complete light and dark Storm Glass themes with restrained blue, cyan, and violet atmosphere
- A floating glass desktop navigation shell
- A compact signed-in mobile bottom navigation
- A recommendation-first hierarchy with large YES or NO typography
- Image-forward jacket cards
- Forecast strips and concise weather metrics
- Purpose-specific skeleton, inline, auth, and wardrobe-analysis loading states
- Consistent focus rings, touch targets, reduced-motion behavior, and responsive layouts
- One restrained animated recommendation border rather than effects on every card
- A bottom-left theme switcher that remembers the selected mode across visits

Typography is bundled locally through npm:

- **Manrope Variable** for navigation, body copy, controls, labels, and metadata
- **Space Grotesk Variable** for recommendation decisions, temperatures, and major headings

The component foundation is shadcn-compatible and uses Radix Slot only where composition is needed. Lucide React remains the only general interface icon system. The redesign adds no runtime font CDN, no third-party visual script, no `eval`, no `new Function`, and no CSP `unsafe-eval` requirement.

The initial theme follows the saved browser preference when available and otherwise respects the operating-system color preference. Switching modes stores only the theme name in local browser storage; it does not send theme data to Supabase or analytics.

The implementation details and file map are documented in:

```text
docs/STORM_GLASS_UI_IMPLEMENTATION.md
```

---

# Guest Mode

Guest Mode does not require an account.

## Guest Flow

1. Search for a location or use browser geolocation
2. Select a forecast window
3. Press **Check Jacket**
4. Receive a YES or NO recommendation
5. Review a concise forecast-aware explanation

## Guest Location Options

- Search with location autocomplete
- Select an exact city result
- Use browser current location
- Use latitude and longitude internally to avoid ambiguous city names

For example, a search for `Paris` can distinguish between:

- Paris, France
- Paris, Texas
- Paris, Ontario

## Forecast Windows

The current forecast-window options are:

- Right now
- Rest of today
- Tomorrow
- Tomorrow night

## Guest Output

The result includes:

- YES or NO
- Jacket type when a jacket is recommended
- Minimal explanation
- Forecast warnings
- Optional backup layer when useful
- Current weather evidence

### NO behavior

A NO result stays intentionally minimal.

It does not display jacket rankings, profile diagnostics, or detailed wardrobe-style recommendations.

It may still say that an optional light layer, hoodie, windbreaker, or rain shell could be useful when rain, wind, or a temperature drop justifies it.

### YES behavior

A YES result includes the type of jacket that best matches the selected forecast window.

Examples:

- Light jacket
- Hoodie
- Windbreaker
- Rain jacket
- Medium jacket
- Insulated jacket
- Heavy coat

---

# Personalized Account Mode

Personalized Mode is a separate authenticated experience.

It combines:

- Saved comfort profile
- Saved style profile
- Saved default location
- Alternate location selection
- Browser current location
- Private owned-jacket wardrobe
- Multiple private images per jacket
- AI-assisted jacket analysis
- Manual analysis fallback
- User-confirmed metadata
- Forecast-aware owned-jacket ranking
- Up to three ranked jacket matches
- Visual similarity and duplicate warnings
- Rule-based style suggestions
- Curated style-trend guidance
- Fire / Good / Not It feedback
- Recommendation history
- Context-aware preference learning
- Privacy-safe analytics controls
- Secure account deletion
- Shared application caching

A recommendation is not generated automatically when the page loads.

The user must choose a location and forecast window, then press:

```text
Run Personalized Check
```

---

# Personalized Flow

1. Create an account or log in
2. Complete the comfort and style profile
3. Save a default location
4. Add jackets manually or with AI assistance
5. Upload one or more private jacket images
6. Review and correct AI-generated metadata
7. Save the jacket to the private wardrobe
8. Choose a location
9. Choose a forecast window
10. Run a personalized check
11. Receive a YES or NO decision
12. Review the best owned jacket and alternatives when the result is YES
13. Submit Fire, Good, or Not It feedback
14. Review previous recommendations in History

---

# Personalized Location Behavior

The saved profile location is used as the default selection.

The user can still:

- Search for a different location
- Use browser current location
- Return to the saved default location

This allows the application to work when the user is traveling or away from the normal location.

Changing the location clears the previous recommendation.

Changing the forecast window also clears the previous recommendation.

---

# Saved Profile

## Comfort Fields

- Display name
- Age
- Sex
- Height
- Weight
- Cold tolerance
- Rain sensitivity
- Wind sensitivity
- Usual time outside
- Default location

## Style and Privacy Fields

- Style preference
- Fit preference
- Preferred color
- Favorite shoes
- Default bottoms
- Style influence
- Style-trend opt-in
- Trend influence level
- Anonymous analytics preference

Example style preferences include:

- Streetwear
- Minimal
- Athletic
- Smart casual
- Techwear
- Vintage
- Skater
- Outdoor

The project uses **style influence** rather than nationality because style preference is not determined by nationality.

Trend influence can be disabled, subtle, or balanced. Trend rules are curated internally and do not scrape live social-media feeds.

---

# Personal Jacket Wardrobe

Authenticated users can maintain a private wardrobe of owned jackets.

The broader data model preserves some legacy non-jacket records, but the active MVP is jacket-only. New unsupported non-jacket records are blocked, and recommendation ranking considers only active jacket records.

## Current Jacket Features

- Add a jacket manually
- Upload multiple private jacket images
- Analyze an image with AI
- Choose an available AI provider
- Fall back to manual entry
- Review AI suggestions before saving
- Correct AI-generated fields
- Edit existing jackets
- Archive and restore jackets
- Mark favorites
- Set a primary image
- Reorder images
- Replace an existing image
- Delete images
- Delete jackets
- View private signed images
- Generate jacket embeddings
- Detect likely duplicates
- View similar owned jackets
- Use saved jackets in recommendations

## Current Jacket Metadata

- Name
- Category
- Subtype
- Primary color
- Secondary color
- Materials
- Fit
- Warmth rating
- Rain protection rating
- Wind protection rating
- Formality rating
- Style tags
- Weather-use tags
- Description
- Favorite state
- Archive state
- AI provider and model
- AI confidence
- Original AI result
- User-confirmed values
- Recommendation preference score
- Times recommended
- Stable image storage paths
- Embedding status and source hash
- Created and updated timestamps

---

# AI-Assisted Jacket Analysis

The application uses a Supabase Edge Function to analyze jacket images server-side.

The provider architecture supports:

- Gemini
- Optional OpenAI
- Manual entry fallback

Provider keys are stored as Supabase Edge Function secrets and are never exposed to the React frontend.

Examples of server-side secret names include:

```text
GEMINI_API_KEY
OPENAI_API_KEY
```

Only secrets for configured providers are required.

## AI Flow

1. User selects an image
2. Frontend validates the image
3. Frontend converts the image to Base64 for analysis
4. Frontend calls the `analyze-wardrobe-item` Edge Function
5. The Edge Function authenticates the caller
6. The selected provider returns structured jacket metadata
7. Shared validation and normalization sanitize the result
8. The user reviews and corrects the result
9. Confirmed values are saved

## AI Output

The normalized analysis can include:

- Name
- Category
- Jacket subtype
- Primary color
- Secondary color
- Materials
- Fit
- Warmth rating
- Rain rating
- Wind rating
- Formality rating
- Style tags
- Description
- Weather-use tags
- Confidence values

## AI Reliability

The provider layer handles:

- Temporary provider overload
- Retryable 429 and 5xx responses
- Timeouts
- Incomplete JSON
- Markdown-wrapped JSON
- Invalid model output
- Missing candidates
- Provider-specific errors
- Manual-entry fallback
- Input validation
- Image type validation
- Image-size limits
- Safe client-facing error messages

AI analysis is optional.

The core wardrobe and recommendation systems continue to work without it.

---

# Visual Intelligence

Jacket embeddings add private visual and descriptive similarity features.

The embedding system stores metadata such as:

- Provider
- Model
- Dimensions
- Source hash
- Status
- Attempt count
- Generated timestamp
- Safe error message

Visual intelligence supports:

- Duplicate warnings before saving
- Similar-owned-jacket results
- Embedding backfill
- Stale embedding detection
- Provider configuration checks
- Nonblocking failure behavior
- Near-duplicate diversity adjustments in recommendation alternatives

Embedding failure never blocks jacket creation or the main weather recommendation.

---

# Recommendation Engine

The recommendation engine evaluates the selected forecast window rather than only current temperature.

## Weather Factors

- Feels-like temperature
- Current temperature
- Hourly forecast
- Forecast low and high
- Rain probability
- Precipitation condition
- Wind speed
- Maximum projected wind
- Temperature drop
- Selected forecast window
- Forecast coverage

## Personalized Factors

- Cold tolerance
- Rain sensitivity
- Wind sensitivity
- Age-based warmth adjustment
- Usual time outside
- Saved style preference
- Preferred color
- Favorite jacket state
- Jacket warmth rating
- Jacket rain rating
- Jacket wind rating
- Jacket style tags
- Weather-protection deficiencies
- Overkill penalty
- Previous feedback
- Context-specific learning
- Recent recommendation rotation
- Visual near-duplicate adjustment

## Internal Output

The engine produces:

1. Base weather score
2. Profile modifier
3. YES or NO decision
4. Recommended jacket category
5. Explanation list
6. Forecast alerts
7. Optional backup-layer suggestions
8. Weather-needs profile
9. Ranked jacket matches
10. Confidence summary
11. Style suggestion
12. Sanitized developer diagnostics

Internal scores and diagnostic details remain hidden from normal users.

---

# YES and NO Result Rules

## NO

When the final decision is NO:

- Full jacket rankings are hidden
- Jacket detail cards are hidden
- Feedback controls are hidden
- A small optional layer may appear
- Forecast warnings may still appear
- The result remains visually lightweight

## YES

When the final decision is YES:

- The best owned jacket is selected
- Up to three ranked jacket matches are shown
- The user can select an alternate ranked jacket
- The selected jacket image is displayed
- Match reasoning is displayed
- A style suggestion is displayed
- Trend guidance may be displayed when enabled
- Feedback controls are available

---

# Jacket Ranking

The jacket-ranking system compares forecast needs with each eligible owned jacket.

Example need profile:

```js
{
  warmthNeeded: 3,
  rainNeeded: 4,
  windNeeded: 2
}
```

Each jacket can receive adjustments for:

- Warmth match
- Rain match
- Wind match
- Weather-safety level
- Style match
- Color match
- Favorite bonus
- Stored preference score
- Context-specific feedback learning
- Exploration bonus
- Recent-use penalty
- Overkill penalty
- Protection-deficit penalty
- Near-duplicate diversity penalty

The engine ranks valid jackets and returns the strongest matches.

A jacket that is too heavy can rank lower than a lighter jacket even when it offers more total protection. A jacket with inadequate rain or wind protection cannot outrank a safer option only because of style preference.

Archived jackets, explicitly excluded jackets, invalid records, and non-jacket records do not participate in ranking.

---

# Top-Three Recommendation Flow

For YES results, Personalized Mode displays up to three owned jackets.

The user can:

- View the current best match
- Select another top-ranked option
- See the selected jacket image
- Review match reasons
- Submit feedback on the active option
- Open similar-jacket information

If fewer than three eligible jackets are available, the interface displays only the available matches.

---

# Style Suggestions and Trends

The application uses a local rule-based style library plus curated internal trend rules.

The selected jacket can be combined with the user profile to suggest:

- Top or base layer direction
- Bottoms direction
- Shoes direction
- Color strategy
- Fit direction
- Weather note
- Optional trend note

Rule-based guidance is used because it is:

- Reliable
- Explainable
- Fast
- Easy to test
- Independent of external AI availability
- Restricted to broad styling guidance rather than claiming the user owns exact pieces

Trend rules are filtered by:

- Selected style
- Season
- Forecast climate tags
- Jacket subtype
- Jacket color family
- Fit
- Materials
- Previous trend feedback

Trend guidance is jacket-focused. It does not include shopping links, prices, retailer recommendations, affiliate links, or live external trend scraping.

---

# Feedback Learning

After a personalized jacket recommendation, the user can rate it:

- Fire
- Good
- Not It

## Feedback Weights

```text
Fire: +2
Good: +1
Not It: -1
```

## Feedback Rules

- Running a recommendation does not automatically alter preference scores
- A score changes only when feedback is submitted
- Changing an existing rating applies only the score difference
- Not It removes the current jacket from the active result
- The next-ranked jacket becomes active when available
- Learning can consider jacket, subtype, color, style tags, weather context, and forecast window
- Recent recommendations may receive a rotation penalty
- Feedback remains connected to recommendation history
- Internal scores remain hidden
- Learned preferences can be reset without deleting jackets or history

Example:

```text
Fire → Good
```

The score changes by `-1`, not by another full Good value.

---

# Recommendation History

Authenticated users have a History page.

History stores:

- Decision
- Selected jacket
- Jacket color
- Summary
- Forecast window
- Weather snapshot
- Style snapshot
- Learning context
- Created timestamp
- Associated feedback

Users can delete a history entry.

Deleting a history entry:

- Removes the recommendation record
- Removes associated feedback through database relationships
- Updates shared state immediately
- Rebuilds the preference model from the remaining data

---

# Privacy-Safe Analytics

The application includes first-party product analytics with an allowlisted event catalog.

Analytics can measure:

- Guest and personalized page use
- Weather-check success or failure
- Wardrobe actions
- AI-analysis outcomes
- Embedding outcomes
- Feedback actions
- History actions
- Cache behavior
- Safe error categories
- Developer dashboard use

Analytics metadata is sanitized before submission.

The system blocks or omits:

- Email addresses
- Passwords or tokens
- Authorization headers
- Exact coordinates
- Raw city search text
- Image paths and signed URLs
- AI prompts and raw provider responses
- Embedding vectors
- Stack traces
- Private free-form location data

Guest analytics use an anonymous session UUID. Authenticated analytics are user-scoped. Analytics failure never blocks the core recommendation flow.

---

# Caching Architecture

The application uses shared React context providers instead of separate page-level data copies.

## Providers

```text
NetworkStatusContext
AuthContext
ProfileContext
AnalyticsContext
WeatherContext
StyleTrendContext
WardrobeContext
RecommendationLearningContext
```

## Cached Data

- Authentication session state
- Profile
- Wardrobe items
- Wardrobe images
- Signed image URLs
- Embedding metadata
- Recommendation history
- Feedback
- Style-trend rules and feedback
- Weather responses
- Analytics queue and anonymous session state

## Cache Behavior

- Cached content can appear immediately
- Background refresh retrieves current Supabase data
- Multiple pages share one live state
- Duplicate requests are deduplicated
- Add, edit, archive, restore, and delete actions update shared state
- Feedback updates are reflected across pages
- Signed image URLs are refreshed
- Broken signed images can retry or fall back safely
- Cache state is cleared on sign-out and account deletion

## Storage Choices

- Stable database records store object paths, not signed URLs
- Weather responses use short-lived caching
- Signed URLs use in-memory caching and refresh
- Anonymous analytics session IDs use session storage
- User-facing preferences may use browser storage where appropriate
- Expiring signed URLs are never stored as permanent database values

---

# Authentication and Data Security

The application uses Supabase email/password authentication.

## Current Security Features

- One shared Supabase browser client
- Protected routes
- Timeout-safe session restoration
- Expired-session recovery
- Cache clearing on sign-out
- Row Level Security
- User-scoped profile rows
- User-scoped wardrobe rows
- User-scoped image rows
- User-scoped feedback rows
- User-scoped recommendation history
- User-scoped embedding rows
- Private Storage bucket
- User-scoped Storage paths
- Temporary signed image URLs
- Edge Function secret storage
- Service-role key excluded from frontend
- Weather and AI keys excluded from frontend
- Shared Edge Function CORS and preflight handling
- `x-application-name` CORS compatibility
- HTTP method restrictions
- JSON body-size validation
- Request IDs
- Sanitized errors
- Security headers
- Safe security logging
- Hashed server-side rate limiting
- Server-side developer authorization
- No production stack traces

## Private Image Path

Images use generated UUID filenames under user- and jacket-scoped paths:

```text
closet-images/<user-id>/<jacket-id>/<generated-uuid>.<extension>
```

Uploaded filenames are not used as permanent Storage object names.

## Secure Account Deletion

The Profile page contains a separate danger-zone workflow.

The deletion flow:

1. Authenticates the caller
2. Requires the exact phrase `DELETE MY ACCOUNT`
3. Uses the authenticated token as the deletion target
4. Deletes private jacket images
5. Hard-deletes the Supabase Auth account
6. Allows database cascades to remove account-owned rows
7. Clears client caches
8. Signs the browser out

The client never submits a selectable target user ID.

---

# Frontend Environment Variables

The frontend uses only browser-safe Supabase values:

```env
VITE_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY
```

Do not place any of the following in a `VITE_` variable:

- Weather provider keys
- Gemini keys
- OpenAI keys
- Supabase service-role keys
- Database passwords
- Developer allowlists
- Rate-limit salts

Weather, AI, analytics administration, account deletion, and other protected operations run through Supabase Edge Functions.

---

# Location and Weather System

The application supports:

## Manual Search

The `get-weather` Edge Function performs server-side location autocomplete and returns exact location options.

## Browser Geolocation

The browser Geolocation API retrieves coordinates after permission is granted. Coordinates are sent to the weather function for the requested forecast and are not included in analytics metadata.

## Default Personalized Location

The saved profile location is preselected in Personalized Mode.

The user can still choose another location without modifying the saved default.

## Server-Side Weather Secret

The weather provider key is stored as a Supabase secret:

```text
WEATHER_API_KEY
```

The weather key is no longer required in the browser environment.

---

# Current Architecture

```text
src/
├── assets/
├── components/
│   ├── AccountPanel.jsx
│   ├── AppHeader.jsx
│   ├── AuthPanel.jsx
│   ├── CheckResultCard.jsx
│   ├── DeleteAccountPanel.jsx
│   ├── JacketForm.jsx
│   ├── LocationSearch.jsx
│   ├── PersonalizedJacketCheck.jsx
│   ├── ProfileForm.jsx
│   ├── ProtectedRoute.jsx
│   ├── RecommendationCard.jsx
│   ├── RecommendationFeedback.jsx
│   ├── SimilarJacketsPanel.jsx
│   ├── WardrobeImage.jsx
│   ├── WardrobeItemCard.jsx
│   ├── WardrobeItemForm.jsx
│   ├── WeatherCard.jsx
│   └── ui/
│       ├── Alert.jsx
│       ├── AppErrorBoundary.jsx
│       ├── Button.jsx
│       ├── Card.jsx
│       ├── ErrorState.jsx
│       ├── LoadingState.jsx
│       └── ...
├── config/
│   ├── aiConfig.js
│   ├── analyticsConfig.js
│   ├── recommendationConfig.js
│   ├── trendConfig.js
│   ├── uploadSecurityConfig.js
│   └── visualIntelligenceConfig.js
├── context/
│   ├── AnalyticsContext.jsx
│   ├── AuthContext.jsx
│   ├── NetworkStatusContext.jsx
│   ├── ProfileContext.jsx
│   ├── RecommendationLearningContext.jsx
│   ├── StyleTrendContext.jsx
│   ├── WardrobeContext.jsx
│   └── WeatherContext.jsx
├── data/
│   ├── defaultTrendRules.js
│   ├── recommendationTestScenarios.js
│   ├── styleLibrary.js
│   ├── styleSuggestionLibrary.js
│   └── wardrobeOptions.js
├── hooks/
│   ├── useAccountDeletion.js
│   ├── useAnalytics.js
│   ├── useAuth.js
│   ├── useBrowserLocation.js
│   ├── useJacketEmbeddings.js
│   ├── useJacketSimilarity.js
│   ├── useLocationSearch.js
│   ├── useNetworkStatus.js
│   ├── useProfile.js
│   ├── useRecommendationLearning.js
│   ├── useStyleTrends.js
│   ├── useWardrobeImageAnalysis.js
│   ├── useWardrobeImages.js
│   ├── useWardrobeItems.js
│   └── useWeather.js
├── lib/
│   └── supabaseClient.js
├── pages/
│   ├── AuthPage.jsx
│   ├── DeveloperAnalyticsPage.jsx
│   ├── DeveloperScoringPage.jsx
│   ├── DeveloperTrendsPage.jsx
│   ├── GuestPage.jsx
│   ├── HistoryPage.jsx
│   ├── PersonalizedPage.jsx
│   ├── ProfilePage.jsx
│   └── WardrobePage.jsx
├── styles/
│   ├── tokens.css
│   └── utilities.css
├── utils/
│   ├── analyticsEvents.js
│   ├── analyzeForecast.js
│   ├── applyTrendRules.js
│   ├── buildPreferenceModel.js
│   ├── buildRecommendationDiagnostics.js
│   ├── calculateJacketScore.js
│   ├── calculatePersonalizedRecommendation.js
│   ├── generateStyleSuggestion.js
│   ├── jacketEmbeddingApi.js
│   ├── rankClosetItems.js
│   ├── sanitizeAnalyticsPayload.js
│   ├── validateJacketImageFile.js
│   ├── wardrobeImageStorage.js
│   └── ...
├── App.jsx
├── index.css
└── main.jsx

supabase/
├── config.toml
├── functions/
│   ├── _shared/
│   │   ├── ai/
│   │   └── security/
│   ├── analyze-closet-item/
│   ├── analyze-wardrobe-item/
│   ├── delete-account/
│   ├── generate-jacket-embedding/
│   ├── get-analytics-dashboard/
│   ├── get-developer-access/
│   ├── manage-developer-access/
│   ├── manage-password/
│   ├── get-weather/
│   ├── sync-style-trends/
│   └── track-analytics/
├── migrations/
└── verification/
```

---

# Application Routes

## Public

```text
/
/auth
```

## Protected

```text
/app
/profile
/wardrobe
/history
```

`/closet` redirects to `/wardrobe` for compatibility.

## Developer Routes

```text
/dev/access
/dev/scoring
/dev/trends
/dev/analytics
```

Developer routes are hidden from the normal primary navigation and require server-side authorization for every account. Approved administrators see a **Developer tools** entry inside the Account dropdown, which opens the Access, Scoring, Trends, and Analytics panels. `/dev/access` shows the active and revoked roster plus the append-only grant/revoke audit history. Unapproved accounts are redirected before any developer page renders.

---

# Current Database Areas

The application uses Supabase data for:

## Profiles

Stores comfort, style, trend, analytics, and default-location preferences.

## Wardrobe Items

Stores owned jacket metadata and stable private image relationships.

## Wardrobe Images

Stores private image object paths, ordering, and primary-image state.

## Recommendation History

Stores decisions, selected jackets, weather snapshots, style snapshots, learning context, and time windows.

## Style Feedback

Stores Fire, Good, or Not It ratings associated with recommendation history.

## Jacket Embeddings

Stores user-isolated embedding vectors and generation metadata.

## Style Trend Rules and Feedback

Stores curated trend rules and user feedback used to adjust rule selection.

## Privacy-Safe Analytics

Stores allowlisted events and safe aggregate data for the developer dashboard.

## Edge Rate Limits

Stores only hashed rate-limit scopes and time buckets. Raw IP addresses are not persisted.

## Developer Access Registry

Stores the UUID-based Owner/Admin authorization state and a server-only append-only access audit log. Browser roles have no direct table grants.

## Storage

The private `closet-images` bucket stores uploaded jacket images.

---

# Active Supabase Edge Functions

```text
get-weather
analyze-closet-item
analyze-wardrobe-item
generate-jacket-embedding
sync-style-trends
track-analytics
get-analytics-dashboard
get-developer-access
manage-developer-access
manage-password
delete-account
```

All active functions use shared security modules for CORS, request IDs, method restrictions, input validation, authentication where required, sanitized errors, security headers, rate limiting, and safe logging.

---

# Build and Performance

The project uses Vite production builds.

Current build optimizations include:

- Route-level lazy loading
- React Suspense
- Manual vendor chunks
- Separate React bundle
- Separate Supabase bundle
- Separate icon bundle
- Production asset hashing
- Long-lived immutable asset caching
- SPA route fallback for Netlify

Build command:

```bash
npm run build
```

Development command:

```bash
npm run dev
```

Preview command:

```bash
npm run preview
```

---

# Testing and Quality Assurance

The repository includes:

- Recommendation regression scenarios
- Phase 10 provider checks
- Phase 11 trend checks
- Phase 12 analytics and accessibility checks
- Phase 13 security and reliability checks
- Phase 14 production-readiness checks
- Vitest unit and component tests
- Playwright desktop and mobile tests
- Production smoke-test configuration
- Secret scanning
- Client-environment auditing
- Project security auditing
- Supabase schema checks
- Recursive Edge Function contract checks
- Production configuration validation
- Production bundle validation

## Main Commands

```bash
npm run lint
npm run test:recommendations
npm run test:phase10
npm run test:phase11
npm run test:phase12
npm run test:phase13
npm run test:phase14
npm run test:unit
npm run test:security
npm run test:e2e
npm run test:all
npm run test:production-config
npm run test:production-config:strict
npm run test:production-build
npm run test:predeploy
npm run test:production-smoke
```

Install the Chromium browser once before local Playwright testing:

```bash
npx playwright install chromium
```

## Phase 14 Predeployment Gate

```bash
npm run test:predeploy
```

This gate runs the full local validation sequence before deployment.

It was used as the final local release gate for the production deployment and remains available for future releases. Any future production update should continue to pass the predeployment gate, manual checklist, production-environment checks, live SQL checks, and production smoke tests before it is considered complete.

---

# Production Readiness Files

Phase 14 adds or maintains:

```text
.nvmrc
.env.example
netlify.toml
public/_headers
public/_redirects
playwright.production.config.js
scripts/verify-production-config.mjs
scripts/check-production-build.mjs
scripts/test-phase14.mjs
tests/e2e/production-smoke.spec.js
supabase/verification/phase14_production_verify.sql
docs/CURRENT_STATE_AUDIT.md
docs/ARCHITECTURE.md
docs/PRODUCTION_ENVIRONMENT.md
docs/DEPLOYMENT.md
docs/PRODUCTION_TEST_CHECKLIST.md
docs/SECURITY_OVERVIEW.md
docs/INCIDENT_RESPONSE.md
docs/KNOWN_LIMITATIONS.md
docs/PHASE14_LIVE_TEST_RESULTS.md
```

Node 22 is pinned in `.nvmrc` for local and Netlify consistency.

---

# Local Setup

## Requirements

- Node.js 20.19 or newer
- Node.js 22 recommended and pinned by `.nvmrc`
- npm
- A configured Supabase project
- Supabase CLI for database and Edge Function work
- Docker only when serving Supabase locally

## Select the Pinned Node Version

With `nvm` installed:

```bash
nvm install
nvm use
```

## Install

```bash
npm install
```

## Environment

Create:

```text
.env
```

Use only browser-safe values:

```env
VITE_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY
```

Do not commit `.env`.

The repository should include only placeholder values in:

```text
.env.example
```

## Start Development

```bash
npm run dev
```

## Production Build

```bash
npm run build
```

---

# Supabase Secret Setup

The exact required secret set depends on the enabled providers and developer-access configuration.

Common production secrets include:

```text
ALLOWED_ORIGINS
RATE_LIMIT_SALT
WEATHER_API_KEY
GEMINI_API_KEY
OPENAI_API_KEY
```

Developer authorization is stored in `public.developer_access_registry` after first-owner initialization. A temporary `DEVELOPER_EMAILS` or `DEVELOPER_USER_IDS` secret may be used only to bootstrap the first Owner. Once `/dev/access` shows an active Owner, remove all legacy developer and trend-admin allowlist secrets.

Example commands:

```bash
npx supabase secrets set ALLOWED_ORIGINS=https://YOUR_DEPLOYED_DOMAIN
npx supabase secrets set RATE_LIMIT_SALT="$(openssl rand -hex 32)"
npx supabase secrets set WEATHER_API_KEY=YOUR_REAL_KEY
npx supabase secrets set GEMINI_API_KEY=YOUR_REAL_KEY
npx supabase secrets set DEVELOPER_EMAILS=YOUR_APPROVED_EMAIL
```

After **Initialize owner registry** succeeds in `/dev/access`:

```bash
npx supabase secrets unset DEVELOPER_USER_IDS DEVELOPER_EMAILS TREND_ADMIN_USER_IDS TREND_ADMIN_EMAILS
```

Only set `OPENAI_API_KEY` when the OpenAI provider is enabled.

Confirm secret names without exposing full values:

```bash
npx supabase secrets list
```

---

# Edge Function Deployment

The active Edge Functions are deployed to the production Supabase project.

The following is the forward deployment sequence for future function updates:

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
npx supabase functions deploy manage-password --no-verify-jwt
npx supabase functions deploy delete-account
```

After changing an Edge Function, redeploy only the affected function unless a shared module change requires all dependent functions to be redeployed.

---

# Production Security Headers

The Netlify publish output includes:

- Content Security Policy
- Frame blocking
- MIME-sniffing protection
- Referrer Policy
- Permissions Policy
- HSTS
- Immutable caching for generated assets

The source file is:

```text
public/_headers
```

React deep-link support is configured through:

```text
public/_redirects
```

---

# Git Secret Safety

Before pushing:

```bash
git status
git diff --cached --stat
git diff --cached --name-status
```

Confirm environment files are ignored:

```bash
git check-ignore -v .env .env.local
```

Confirm only `.env.example` is tracked:

```bash
git ls-files | grep -E '(^|/)\.env($|\.)'
```

Run the project security checks:

```bash
npm run test:security
```

Environment variable names are safe.

Actual secret values are not.

---

# Current Completed Features

- Live Netlify production deployment at [jacketchecker.netlify.app](https://jacketchecker.netlify.app/)
- React and Vite setup
- Tailwind CSS
- Lucide React
- React Router
- Guest Mode
- Personalized Mode
- Separate authenticated and guest experiences
- Server-side weather access
- Two-day forecast processing
- Hourly forecast processing
- Location autocomplete
- Browser geolocation
- Coordinate-based weather lookup
- Four forecast windows
- Forecast-aware YES / NO logic
- Rain protection overrides
- Wind protection overrides
- Temperature-drop detection
- Optional backup layers
- Minimal NO results
- Full YES results
- Comfort profile
- Style profile
- Trend and analytics preferences
- Default location
- Alternate personalized locations
- Supabase authentication
- Protected routes
- Profile persistence
- Private jacket wardrobe
- Manual jacket creation
- Jacket editing
- Jacket archiving and restoration
- Favorite jackets
- Multiple jacket images
- Primary-image selection
- Image reordering and replacement
- Private image uploads
- Signed image URLs
- Signed image URL caching and retry
- AI-assisted jacket analysis
- Provider registry
- Gemini provider
- Optional OpenAI provider
- Manual fallback
- Structured AI output
- AI normalization and schema validation
- AI retry handling
- User-confirmed AI values
- Jacket embeddings
- Similarity matching
- Duplicate warnings
- Embedding backfill
- Forecast-aware jacket ranking
- Weather-needs calculation
- Safety tiers
- Overkill penalties
- Protection-deficit penalties
- Near-duplicate diversity adjustments
- Top-three owned jacket recommendations
- Selected-jacket image display
- Rule-based style suggestions
- Curated style-trend rules
- Trend feedback
- Fire / Good / Not It feedback
- Delta-only feedback changes
- Immediate Not It fallback
- Context-aware learning
- Recent-use rotation
- Recommendation history
- History deletion
- Shared profile cache
- Shared wardrobe cache
- Shared feedback/history cache
- Weather cache
- Background refresh
- Request deduplication
- Privacy-safe analytics
- Developer analytics dashboard
- Developer scoring diagnostics
- Developer trend diagnostics
- Secure account deletion
- Offline detection
- Accessible offline banner
- Route-level error boundaries
- Safe client errors
- No automatic personalized recommendation on load
- Route-level code splitting
- Environment files excluded from Git
- Server secrets excluded from frontend
- Hashed rate limiting
- Security headers
- Automated security audits
- Phase 10–14 validation scripts
- Unit and component tests
- Desktop and mobile Playwright coverage
- Production configuration and build checks

---

# Current Known Limitations

- Recommendations depend on weather-provider accuracy
- Browser location requires permission
- AI jacket analysis can be wrong and should be reviewed
- Manual entry remains necessary when providers are unavailable
- Style suggestions are broad guidance and do not know the user’s complete outfit inventory
- Style trends are internally curated rather than live-scraped
- Guest history is not persisted
- Visual similarity depends on successful embedding generation
- The current recommendation inventory remains jacket-only

---

# Future Enhancements

The following are intentionally outside the finished jacket MVP:

- Full wardrobe recommendation inventory for tops, bottoms, shoes, and accessories
- Full outfit generation from owned wardrobe pieces
- Multiple generated outfit alternatives
- Automatic background removal
- External live trend ingestion
- Shopping recommendations
- Retailer links
- Product pricing
- Affiliate links
- Expanded analytics dashboards
- Additional provider experimentation

These items are not required to call the current Jacket Checker MVP complete.

---

# Current Product Principle

The interface should remain simple.

The complexity should remain under the hood.

The application should answer:

```text
Do I need a jacket?
```

Then, for authenticated users:

```text
Which jacket that I own is the best choice?
```

And finally:

```text
How should I style it?
```

---

# Author

Daniel Islas

---

# Account Recovery and Credential Management

JacketCheck supports complete email/password account maintenance through Supabase Auth.

## Signed-out recovery

The authentication page includes:

- Forgot password
- Privacy-safe forgotten-email assistance
- Generic recovery responses that do not reveal whether an account exists
- A dedicated `/auth/reset-password` route for secure recovery links

Password reset emails redirect to:

```text
https://jacketchecker.netlify.app/auth/reset-password
```

## Signed-in account security

The Profile page includes an Account Security section where users can:

- See their current sign-in email
- Change their password after verifying the current password
- Request an email-address change
- Complete Supabase email confirmations without changing the underlying user UUID

## Password policy

All JacketCheck signup and password-change forms require:

- At least 6 characters
- Uppercase and lowercase letters
- A number
- A symbol

## Server-enforced password policy

Password mutations use defense in depth:

1. The browser validates the six-character uppercase/lowercase/number/symbol rule for immediate feedback.
2. `manage-password` validates the same rule inside a Supabase Edge Function before JacketCheck signup, signed-in password changes, or recovery resets reach Supabase Auth.
3. The hosted Supabase Auth project is configured with the same native policy so direct Auth API requests cannot bypass the requirement.

The Edge Function also:

- Rate-limits signup and password-update attempts
- Requires the current authenticated user for signed-in changes
- Requires the current password for normal password changes
- Requires a JWT authenticated through the Supabase recovery flow for password resets
- Never logs current or new password values

Deploy and configure the policy with:

```bash
npx supabase functions deploy manage-password --no-verify-jwt

export SUPABASE_PROJECT_REF="achnzeuvmqymguiqepji"
read -s SUPABASE_ACCESS_TOKEN
export SUPABASE_ACCESS_TOKEN
npm run security:password-policy:configure
npm run security:password-policy:verify
unset SUPABASE_ACCESS_TOKEN SUPABASE_PROJECT_REF
```

`SUPABASE_ACCESS_TOKEN` is a personal access token for the Supabase Management API. It is used only in the local terminal for this one configuration operation and must never be committed, placed in Netlify, or exposed to browser code.

---

# Phase 15: Final Documentation and Portfolio Completion

Phase 15 closes the project by aligning the repository documentation with the completed production application.

## Completed Phase 15 Work

- Updated the README to reflect the final deployed product rather than a pending deployment
- Added the permanent production URL
- Preserved the complete guest, authenticated, wardrobe, recommendation, AI, security, testing, and deployment documentation
- Recorded the final architecture, active Edge Functions, environment boundaries, and production workflow
- Distinguished completed MVP scope from optional future expansion
- Prepared the repository to serve as a portfolio and interview reference

## Portfolio Summary

Jacket Checker is a production full-stack web application that converts live and forecast weather data into an explainable YES or NO jacket decision. Authenticated users can maintain a private image-based jacket wardrobe, receive ranked recommendations from jackets they own, review styling guidance, and improve future results through explicit feedback.

The project demonstrates:

- React and Vite application architecture with responsive, accessible UI design
- Supabase authentication, PostgreSQL data modeling, Row Level Security, private Storage, and Edge Functions
- Server-side weather, AI-analysis, embedding, analytics, account-security, and account-deletion workflows
- A deterministic recommendation and ranking engine that balances weather safety, comfort, style, and learned preferences
- Privacy-safe analytics, sanitized error handling, rate limiting, security headers, secret isolation, and production access controls
- Automated unit, component, regression, security, configuration, build, and Playwright browser testing
- Netlify production deployment with SPA routing, immutable asset caching, and production security configuration

## Final Outcome

The finished application answers three progressively personalized questions:

```text
Do I need a jacket?
Which jacket that I own is the best choice?
How should I style it?
```

The production application is permanently available at:

**[https://jacketchecker.netlify.app/](https://jacketchecker.netlify.app/)**

The jacket-focused MVP is complete. Items listed under **Future Enhancements** are optional expansion opportunities and are not unfinished requirements.

<!-- IOS_FREE_FINALIZATION_START -->
## iOS app status

Jacket Checker includes a completed Capacitor iOS implementation with native foreground location, safe-area handling, status-bar integration, authentication deep links, password recovery callbacks, and modern scene lifecycle support.

The permanent public version is available at **https://jacketchecker.netlify.app/**. The iOS project can be run in the simulator or installed on the owner's iPhone through Xcode with a free Apple Account. TestFlight and App Store distribution are intentionally excluded because they require paid Apple Developer Program membership.

Final validation:

```bash
npm run project:final:check
```

Complete instructions are in `docs/IOS_FREE_INSTALL_AND_FINALIZATION.md`.
<!-- IOS_FREE_FINALIZATION_END -->

# iOS Application

Jacket Checker also includes a Capacitor-based iOS application built from the same React and Vite codebase as the production web app.

## Completed iOS Work

- Capacitor iOS project
- Native iPhone simulator support
- Successful installation and testing on a physical iPhone
- Native foreground location access
- Native status-bar integration
- iOS safe-area handling
- Custom authentication callback scheme
- Signup confirmation, password recovery, and email-change deep links
- Warm-launch and cold-launch authentication handling
- Modern `UIScene` lifecycle support
- Session restoration after the app is closed and reopened
- Privacy and Support routes shared with the production web application
- Release simulator builds and iOS-specific readiness checks

## Current Distribution

The permanent public version remains:

**[https://jacketchecker.netlify.app/](https://jacketchecker.netlify.app/)**

The native iOS project can be run in the simulator or installed on a personal iPhone through Xcode using a free Apple Personal Team.

Free Personal Team installations are intended for personal testing. Their provisioning profiles expire after seven days, so the app must periodically be rebuilt and reinstalled through Xcode.

TestFlight and App Store distribution are intentionally deferred because they require enrollment in the paid Apple Developer Program.

Future App Store deployment is documented in:

```text
docs/APPLE_APP_STORE_FUTURE_DEPLOYMENT.md
```

The iOS application does not replace the Netlify deployment. Both clients use the same Supabase backend, authentication system, private data model, Edge Functions, and production security controls.

---
