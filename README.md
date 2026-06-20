# 🧥 Should I Wear a Jacket?

A weather intelligence and personal wardrobe recommendation application that answers a practical question:

> Should I wear a jacket for the place and time window I care about?

The application combines real-time weather, hourly forecast trends, location data, user comfort preferences, personal style preferences, private closet inventory, AI-assisted clothing analysis, recommendation history, and explicit user feedback.

The goal is to keep the user experience simple while the recommendation logic remains explainable and personalized under the hood.

---

# Current Product

The application has two intentionally separate experiences:

1. **Guest Mode**
2. **Personalized Account Mode**

Guest Mode is fast and low-friction.

Personalized Mode uses saved profile information, owned jackets, style preferences, recommendation history, and feedback learning.

---

# Guest Mode

Guest Mode does not require an account.

## Guest Flow

1. Search for a location or use browser geolocation
2. Select a forecast window
3. Press **Check Jacket**
4. Receive a YES or NO recommendation
5. Review a short forecast-aware explanation

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

It does not display full jacket rankings or detailed closet-style recommendations.

It may still say that an optional light layer, hoodie, windbreaker, or rain shell could be useful if forecast conditions justify it.

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
- Personal jacket closet
- Private jacket images
- AI-assisted jacket analysis
- User-confirmed metadata
- Forecast-aware closet ranking
- Top-three owned jacket matches
- Rule-based outfit styling
- Fire / Good / Not It feedback
- Recommendation history
- Learned item preference scores
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
5. Review and correct AI-generated metadata
6. Save the jacket to the private closet
7. Choose a location
8. Choose a forecast window
9. Run a personalized check
10. Receive a YES or NO decision
11. Review the top owned-jacket matches when the result is YES
12. Submit Fire, Good, or Not It feedback
13. Review previous recommendations in History

---

# Personalized Location Behavior

The saved profile location is used as the default selection.

The user can still:

- Search for a different location
- Use browser current location
- Return to the saved default location

This allows the application to work when the user is traveling or away from their normal location.

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

## Style Fields

- Style preference
- Fit preference
- Preferred color
- Favorite shoes
- Default bottoms
- Style influence

Example style preferences include:

- Streetwear
- Minimal
- Athletic
- Smart casual
- Techwear
- Vintage
- Skater
- Outdoor

Example style influences include:

- American streetwear
- Korean casual
- Japanese minimal
- European clean
- Skater
- Outdoor
- Athletic
- Techwear

The project uses **style influence** rather than nationality because style preference is not determined by nationality.

---

# Personal Closet

Authenticated users can maintain a private jacket closet.

## Current Closet Features

- Add jacket manually
- Upload a private jacket image
- Analyze an image with AI
- Review AI suggestions before saving
- Correct AI-generated fields
- Edit existing closet items
- Replace an existing image
- Delete closet items
- View private signed images
- Use saved jackets in recommendations

## Current Jacket Metadata

- Name
- Category
- Type
- Primary color
- Secondary color
- Warmth rating
- Rain protection rating
- Wind protection rating
- Formality rating
- Style tags
- Weather-use tags
- Description
- AI confidence
- Original AI result
- User-confirmed values
- Recommendation preference score
- Times recommended
- Image storage path
- Created and updated timestamps

---

# AI-Assisted Jacket Analysis

The application uses a Supabase Edge Function to send jacket images to Gemini.

The Gemini API key is stored as a Supabase Edge Function secret:

```text
GEMINI_API_KEY
```

The key is read server-side:

```ts
Deno.env.get("GEMINI_API_KEY")
```

The key is never exposed to the React frontend.

## AI Flow

1. User selects an image
2. Frontend converts the image to Base64
3. Frontend calls the Supabase Edge Function
4. Edge Function sends the image to Gemini
5. Gemini returns structured jacket metadata
6. Edge Function validates and normalizes the response
7. User reviews and corrects the result
8. Confirmed values are saved

## AI Output

The normalized analysis can include:

- Name
- Category
- Jacket type
- Primary color
- Secondary color
- Warmth rating
- Rain rating
- Wind rating
- Formality rating
- Style tags
- Description
- Weather-use tags
- Confidence values

## AI Reliability

The Edge Function now handles:

- Temporary Gemini overload
- Retryable 429 and 5xx responses
- Incomplete JSON
- Markdown-wrapped JSON
- Invalid model output
- Missing candidates
- Manual-entry fallback
- Input validation
- Image type validation
- Image-size limits

AI analysis is optional.

The core closet and recommendation systems work without it.

---

# Recommendation Engine

The recommendation engine evaluates the selected forecast window rather than only current temperature.

## Weather Factors

- Feels-like temperature
- Current temperature
- Hourly forecast
- Daily high and low
- Rain probability
- Wind speed
- Maximum projected wind
- Temperature drop
- Selected forecast window
- Current weather condition

## Personalized Factors

- Cold tolerance
- Rain sensitivity
- Wind sensitivity
- Age-based warmth adjustment
- Usual time outside
- Saved style preference
- Preferred color
- Jacket warmth rating
- Jacket rain rating
- Jacket wind rating
- Jacket formality rating
- Jacket style tags
- Overkill penalty
- Previous feedback
- Per-item recommendation score

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
9. Ranked closet matches
10. Style suggestion

Internal scores remain hidden from normal users.

---

# YES and NO Result Rules

## NO

When the final decision is NO:

- Full closet rankings are hidden
- Jacket detail cards are hidden
- Feedback controls are hidden
- A small optional layer may appear
- Forecast warnings may still appear
- The result remains visually lightweight

## YES

When the final decision is YES:

- The best owned jacket is selected
- Up to three ranked closet matches are shown
- The user can select an alternate ranked jacket
- The selected jacket image is displayed
- Match reasoning is displayed
- A style suggestion is displayed
- Feedback controls are available

---

# Closet Ranking

The closet-ranking system compares weather needs with each owned jacket.

Example need profile:

```js
{
  warmthNeeded: 3,
  rainProtectionNeeded: 4,
  windProtectionNeeded: 2,
  formalityNeeded: 1
}
```

Each jacket can receive scores for:

- Warmth match
- Rain match
- Wind match
- Style match
- Color match
- Learned preference boost
- Previous recommendation score
- Overkill penalty

The engine ranks all valid jackets and returns the strongest matches.

A jacket that is too heavy can rank lower than a lighter jacket even when it offers more total protection.

---

# Top-Three Recommendation Flow

For YES results, Personalized Mode displays up to three owned jackets.

The user can:

- View the current best match
- Select another top-ranked option
- See the selected jacket image
- Review match reasons
- Submit feedback on the active option

If fewer than three jackets are available, the interface displays only the available matches.

---

# Style Suggestions

The application currently uses a local rule-based style library.

The selected jacket is combined with the user profile to suggest:

- Top or base layer
- Bottoms
- Shoes
- Optional accessory
- Color note
- Reason for the outfit

Rule-based outfit generation is used because it is:

- Reliable
- Explainable
- Fast
- Easy to debug
- Independent of external AI availability

Example:

```text
Style It

Grey hoodie
Black cargos
Jordan 1s
```

The style section is shown only in Personalized Mode.

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
- Scores are not capped
- Not It immediately reduces the current jacket score
- Not It removes the current jacket from the active result
- The next-ranked jacket becomes active
- Feedback remains connected to recommendation history
- Internal scores remain hidden

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
- Outfit snapshot
- Created timestamp
- Associated feedback

Users can delete a history entry.

Deleting a history entry:

- Removes the recommendation record
- Removes associated feedback
- Reverses the feedback score from the jacket
- Updates shared state immediately

---

# Caching Architecture

The application uses shared React context providers instead of separate page-level data copies.

## Providers

```text
AuthContext
WeatherContext
ProfileContext
ClosetContext
RecommendationLearningContext
```

## Cached Data

- Profile
- Closet items
- Signed image URLs
- Recommendation history
- Feedback
- Weather responses

## Cache Behavior

- Cached content appears immediately
- Background refresh retrieves current Supabase data
- Multiple pages share one live state
- Duplicate requests are deduplicated
- Add/edit/delete actions update the shared cache
- Feedback updates are reflected across pages
- Signed image URLs are refreshed
- Stale recommendation images are synchronized with current closet state

## Storage Choices

- Profile, closet, and learning data use local browser storage
- Weather responses use short-lived session caching
- Signed URLs use in-memory TTL caching
- Stable image paths are saved in the database
- Expiring signed URLs are not stored as permanent database values

---

# Authentication and Data Security

The application uses Supabase email/password authentication.

## Current Security Features

- Protected routes
- Row Level Security
- User-scoped profile rows
- User-scoped closet rows
- User-scoped feedback rows
- User-scoped recommendation history
- Private Storage bucket
- User-scoped Storage paths
- Temporary signed image URLs
- Edge Function secret storage
- Environment files excluded from Git
- Service-role key excluded from frontend
- Gemini key excluded from frontend

## Private Image Path

```text
closet-images/<user-id>/<random-file-name>
```

## Frontend Environment Variables

Current frontend environment variables:

```env
VITE_WEATHER_API_KEY=YOUR_WEATHERAPI_KEY
VITE_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

`VITE_SUPABASE_URL` and the Supabase anon/publishable key are designed for browser use.

`VITE_WEATHER_API_KEY` is still browser-visible and is the next architecture/security task.

## Server-Side Secret

```text
GEMINI_API_KEY
```

The WeatherAPI key will later move to:

```text
WEATHER_API_KEY
```

inside Supabase secrets.

---

# Location System

The application currently supports:

## Manual Search

WeatherAPI location autocomplete returns exact location options.

## Browser Geolocation

The browser Geolocation API retrieves coordinates.

## Default Personalized Location

The saved profile location is preselected in Personalized Mode.

The user can still choose another location without modifying the saved default.

---

# Current Architecture

```text
src/
├── components/
│   ├── AppHeader.jsx
│   ├── AuthPanel.jsx
│   ├── CheckResultCard.jsx
│   ├── ClosetItemCard.jsx
│   ├── ClosetItemForm.jsx
│   ├── JacketForm.jsx
│   ├── LocationSearch.jsx
│   ├── PersonalizedJacketCheck.jsx
│   ├── ProfileForm.jsx
│   ├── ProtectedRoute.jsx
│   ├── RecommendationFeedback.jsx
│   ├── TimeWindowSelect.jsx
│   └── ...
│
├── context/
│   ├── AuthContext.jsx
│   ├── ClosetContext.jsx
│   ├── ProfileContext.jsx
│   ├── RecommendationLearningContext.jsx
│   └── WeatherContext.jsx
│
├── data/
│   └── styleLibrary.js
│
├── hooks/
│   ├── useAuth.js
│   ├── useBrowserLocation.js
│   ├── useClosetImageAnalysis.js
│   ├── useClosetItems.js
│   ├── useLocationSearch.js
│   ├── useProfile.js
│   ├── useRecommendationLearning.js
│   └── useWeather.js
│
├── lib/
│   └── supabaseClient.js
│
├── pages/
│   ├── AuthPage.jsx
│   ├── ClosetPage.jsx
│   ├── GuestPage.jsx
│   ├── HistoryPage.jsx
│   ├── PersonalizedPage.jsx
│   └── ProfilePage.jsx
│
├── utils/
│   ├── analyzeForecast.js
│   ├── buildPreferenceModel.js
│   ├── calculateJacketScore.js
│   ├── calculatePersonalizedRecommendation.js
│   ├── calculateProfileModifier.js
│   ├── generateStyleSuggestion.js
│   ├── mapScoreToRecommendation.js
│   ├── normalizeClosetAnalysis.js
│   ├── rankClosetItems.js
│   ├── timeWindows.js
│   └── uploadClosetImage.js
│
├── App.jsx
└── main.jsx

supabase/
├── config.toml
└── functions/
    ├── deno.json
    └── analyze-closet-item/
        └── index.ts
```

---

# Current Database Areas

The application currently uses Supabase data for:

## Profiles

Stores comfort, style, and default-location preferences.

## Closet Items

Stores user-owned jacket metadata and stable private image paths.

## Style Feedback

Stores Fire, Good, or Not It ratings associated with recommendation history.

## Recommendation History

Stores decisions, selected jackets, weather snapshots, outfit snapshots, and time windows.

## Storage

The private `closet-images` bucket stores uploaded jacket images.

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

Build command:

```bash
npm run build
```

Development command:

```bash
npm run dev
```

The project currently builds successfully.

---

# Current Completed Features

- React and Vite setup
- Tailwind CSS
- Lucide React
- React Router
- Guest Mode
- Personalized Mode
- Separate authenticated and guest experiences
- WeatherAPI current weather
- Two-day forecast
- Hourly forecast processing
- Location autocomplete
- Browser geolocation
- Coordinate-based weather lookup
- Four forecast windows
- Forecast-aware YES / NO logic
- Rain-aware recommendations
- Wind-aware recommendations
- Temperature-drop detection
- Optional backup layers
- Minimal NO results
- Full YES results
- Comfort profile
- Style profile
- Default location
- Alternate personalized locations
- Supabase authentication
- Protected routes
- Profile persistence
- Private closet database
- Manual jacket creation
- Jacket editing
- Image replacement
- Jacket deletion
- Private image uploads
- Signed image URLs
- Signed image URL caching
- AI-assisted jacket analysis
- Structured Gemini output
- AI normalization
- AI retry handling
- Manual AI fallback
- User-confirmed AI values
- Closet ranking
- Weather-needs calculation
- Overkill penalties
- Top-three owned jacket recommendations
- Selected-jacket image display
- Rule-based outfit generation
- Fire / Good / Not It feedback
- Delta-only feedback changes
- Immediate Not It fallback
- Recommendation history
- History deletion
- Feedback score reversal
- Shared profile cache
- Shared closet cache
- Shared feedback/history cache
- Weather cache
- Background refresh
- Request deduplication
- No automatic personalized recommendation on load
- Route-level code splitting
- Environment files excluded from Git
- Gemini secret stored server-side

---

# Current Known Limitation

The WeatherAPI key is still used as:

```env
VITE_WEATHER_API_KEY
```

This means it is visible to the browser.

The next architecture task is to move forecast and location-search requests behind Supabase Edge Functions and store:

```text
WEATHER_API_KEY
```

as a Supabase secret.

This change should preserve the current weather response shape and all recommendation behavior.

---

# Local Setup

## Install

```bash
npm install
```

## Environment

Create:

```text
.env
```

Current variables:

```env
VITE_WEATHER_API_KEY=YOUR_WEATHERAPI_KEY
VITE_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
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

# Edge Function Setup

## Gemini Secret

```bash
npx supabase secrets set GEMINI_API_KEY=YOUR_REAL_KEY
```

## Deploy Jacket Analysis

```bash
npx supabase functions deploy analyze-closet-item
```

## Confirm Secrets

```bash
npx supabase secrets list
```

This should display secret names without exposing their full values.

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

Scan staged files:

```bash
git grep --cached -n -I -E \
'GEMINI_API_KEY|SERVICE_ROLE|service_role|SUPABASE_SECRET|DATABASE_URL|DB_PASSWORD|PRIVATE_KEY|BEGIN RSA|ghp_|github_pat_|sk-[A-Za-z0-9]|AIza[A-Za-z0-9_-]+'
```

Environment variable names are safe.

Actual secret values are not.

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
