# 🧥 Should I Wear a Jacket?

A weather intelligence application that gives practical jacket recommendations using real-time weather, forecast trends, location data, and user personalization.

The goal is simple:

> Given a location and a forecast window, determine whether someone should wear a jacket, what kind of jacket makes sense, and whether they should bring a backup layer for later conditions.

Unlike basic weather apps or temperature-only jacket checkers, this project is designed around explainable recommendations. It does not just show the weather; it explains why a jacket is or is not recommended.

---

# Current Project Vision

The project is split into two separate user experiences.

## Phase 1: Guest Experience

The guest version is designed to be fast, clean, and low-friction.

Guest Mode should stay simple:

* Use current location or search for a location
* Select forecast window
* Get a YES / NO jacket recommendation
* See a quick bring-along suggestion if needed

No account required.

No saved profile required.

No personalization required.

### Guest User Flow

1. Use current location or search for a location
2. Select a forecast window
3. Press "Check Jacket"
4. Receive a single jacket verdict with explanation

### Guest Inputs

* Use My Location through browser geolocation
* Location search with autocomplete
* Exact location selection using coordinates
* Forecast window selection:

  * Right now
  * Next 2 hours
  * Next 4 hours
  * Rest of today
  * Tonight
  * Tomorrow morning

### Guest Outputs

* YES / NO jacket verdict
* Recommended jacket type
* Forecast-aware explanation
* Bring-along suggestion
* Forecast warnings
* Minimal weather evidence

Example:

NO

Wear:
No jacket

Bring Along:
Light rain shell

Why:

* Feels like 76°F right now
* Rain risk increases later
* The forecast window shows possible showers

Forecast Watch:

* Rain chance may reach 65%
* A waterproof layer may be useful later

---

## Phase 2: Personalized Account Experience

The logged-in version is a separate experience from Guest Mode and now functions as a personalized closet and style recommendation system.

Users can create an account, save a profile, set a default location, build a private jacket closet, upload jacket photos, analyze those photos with AI, and receive recommendations using items they actually own.

The personalization score and closet ranking score are calculated under the hood and are not shown directly to the user.

Personalized Mode currently includes:

* Saved comfort profile
* Saved style profile
* Default location
* Forecast-window analysis
* Personal jacket closet
* Private jacket image storage
* AI-assisted jacket recognition
* User review and correction before saving
* Weather-based closet ranking
* Personalized outfit suggestions
* Jacket images inside recommendations

### Personalized User Flow

1. Login or create an account
2. Complete comfort and style profile setup
3. Save a default location
4. Add jackets manually or upload a jacket image
5. Optionally analyze the image with AI
6. Review and correct the suggested jacket details
7. Save the confirmed item to the private closet
8. Run a personalized forecast check
9. Receive a recommendation using the best matching owned jacket
10. Receive a style suggestion built around that jacket

### Saved Profile Fields

Comfort fields:

* Display name
* Age
* Sex
* Height
* Weight
* Cold tolerance
* Rain sensitivity
* Wind sensitivity
* Usual time outside
* Default location

Style fields:

* Style preference
* Fit preference
* Preferred color
* Favorite shoes
* Default bottoms
* Style influence

### Personalized Recommendation Factors

* Forecast-based weather score
* User cold tolerance
* Rain sensitivity
* Wind sensitivity
* Usual exposure time
* Age-based warmth buffer
* Default location
* Jacket warmth rating
* Jacket rain rating
* Jacket wind rating
* Jacket formality rating
* Jacket style tags
* Preferred color
* Saved style preference
* Saved closet inventory
* Overkill penalty for jackets that are too heavy
* Previous recommendation count

### Personalized Output

The personalized version returns a simple recommendation while using a more complex internal pipeline.

Example:

YES

Wear:
Your black windbreaker

Closet Match:

* Warmth matches the selected forecast window
* Strong rain and wind protection
* Matches your saved streetwear preference

Style It:

* Black tee
* Black cargos
* Jordan 1s

Why:

* Rain is expected later
* Wind increases during the selected window
* This is the best matching jacket in your closet

The UI stays simple while the personalization, ranking, image analysis, and outfit logic remain under the hood.

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
│   ├── RecommendationCard.jsx
│   ├── TimeWindowSelect.jsx
│   └── WeatherCard.jsx
│
├── context/
│   └── AuthContext.jsx
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
│   └── useWeather.js
│
├── lib/
│   └── supabaseClient.js
│
├── pages/
│   ├── AuthPage.jsx
│   ├── ClosetPage.jsx
│   ├── GuestPage.jsx
│   ├── PersonalizedPage.jsx
│   └── ProfilePage.jsx
│
├── utils/
│   ├── analyzeForecast.js
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

`CheckResultCard.jsx` combines the verdict, selected closet item, jacket image, forecast evidence, personal reasoning, and style suggestion into one focused result.

`WeatherCard.jsx` and `RecommendationCard.jsx` may remain temporarily, but the main guest and personalized flows use `CheckResultCard.jsx`.

# Recommendation Engine

The recommendation engine evaluates current weather and forecast conditions across a selected time window.

Current factors:

* Feels-like temperature
* Wind speed
* Maximum projected wind
* Rain probability
* Hourly forecast
* Daily high and low
* Temperature drops
* Forecast window
* Precipitation risk
* User profile modifiers for logged-in users

The engine produces:

1. Numerical internal score
2. YES / NO jacket verdict
3. Jacket type
4. Explanation list
5. Forecast alerts
6. Bring-along suggestions
7. Time-window analysis

The internal score is used for decision-making but is hidden from the user.

---

# Location System

The app supports two location flows.

## Use My Location

The app uses the browser Geolocation API to request latitude and longitude from the user. If the user allows permission, those coordinates are passed directly to WeatherAPI.

This avoids ambiguous city names and allows Guest Mode to be nearly one-click.

## Location Search

The app also supports manual location search through WeatherAPI's search endpoint.

Example:

Searching "Paris" can return:

* Paris, France
* Paris, Texas, United States
* Paris, Ontario, Canada

The user selects the exact location, and the app stores the selected latitude and longitude for the weather request.

This prevents the forecast API from guessing the wrong city.

---

# Forecast Window System

The app supports time-window based recommendations.

Available windows:

* Right now
* Next 2 hours
* Next 4 hours
* Rest of today
* Tonight
* Tomorrow morning

Instead of only answering based on current conditions, the app can say things like:

* No jacket right now, but bring a rain shell because showers are expected later.
* No jacket now, but bring a light jacket because it gets chilly tonight.
* Yes, wear a windbreaker because wind increases during your selected window.

This makes the app behave more like a real decision system than a simple weather display.

---

# Authentication and Data Storage

The logged-in experience uses Supabase.

Current Supabase features:

* Email/password authentication
* User session tracking
* Saved comfort profiles
* Saved style profiles
* Default location storage
* Personal closet storage
* Private jacket image storage
* Row Level Security policies
* Storage access policies
* Profile upsert logic
* Protected personalized routes
* Supabase Edge Function for AI image analysis
* Server-side Gemini API secret storage

User profile and closet data are protected so each authenticated user can only access their own records.

Jacket images are stored in the private `closet-images` bucket using paths scoped to the authenticated user:

```text
closet-images/<user-id>/<random-file-name>
```

Temporary signed URLs are generated when images need to be displayed. Stable storage paths are saved in the database instead of expiring signed URLs.

The AI provider key is stored as a Supabase Edge Function secret:

```text
GEMINI_API_KEY
```

It must never be added as a `VITE_` environment variable because Vite variables are exposed to browser code.

Frontend environment variables are stored in `.env` and excluded from GitHub.

Required frontend environment variables:

```env
VITE_WEATHER_API_KEY=YOUR_WEATHERAPI_KEY
VITE_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

`.env.example` should contain placeholder values only.

# Current Features

Completed:

* React + Vite setup
* GitHub repository setup
* Tailwind CSS integration
* Lucide React icon integration
* WeatherAPI integration
* Forecast API integration
* Location autocomplete search
* Exact coordinate-based weather lookup
* Browser geolocation support
* Time-window forecast analysis
* Forecast-aware jacket scoring engine
* Bring-along recommendations
* Rain-aware recommendations
* Wind-aware recommendations
* Temperature-drop detection
* Explainable recommendation output
* Combined jacket result card
* React Router page separation
* Guest Mode page
* Auth page
* Profile page
* Closet page
* Personalized app page
* Supabase authentication
* Supabase profile persistence
* Protected personalized routes
* Hidden personalization scoring
* Minimal signed-out navigation
* Minimal signed-in navigation
* Comfort profile settings
* Style profile settings
* Local style library
* Rule-based outfit suggestion generation
* Personal closet database
* Manual closet item creation
* Closet item deletion
* Jacket warmth, rain, wind, and formality ratings
* Style tags and color metadata
* Weather-needs calculation
* Closet jacket ranking
* Overkill penalties
* Specific owned-jacket recommendations
* Private Supabase Storage bucket
* Private closet image upload
* Signed image URL generation
* Jacket images on closet cards
* Jacket images in personalized recommendations
* Secure Supabase Edge Function integration
* Gemini-powered multimodal jacket analysis
* Structured AI metadata extraction
* Server-side AI response validation
* Controlled jacket type, color, tag, and weather-use enums
* AI confidence indicators
* User review and correction flow
* Manual fallback when AI is unavailable
* Original AI result persistence
* Confirmed user values stored as final closet metadata
* Storage cleanup after failed database inserts
* Modular React and serverless architecture

# Style Mode Roadmap

Style Mode is the main difference between Guest Mode and Personalized Mode.

Guest Mode stays fast and minimal:

* Use location
* Select forecast window
* Get a YES / NO jacket recommendation
* See a quick bring-along suggestion if needed

Personalized Mode now includes:

* Saved comfort and style profiles
* Saved closet items
* Private jacket images
* AI-assisted jacket descriptions
* User-confirmed metadata
* Specific owned-jacket recommendations
* Color-aware outfit suggestions

The next major goal is to make the system learn from explicit user feedback over time.

---

## Style Mode Vision

The final personalized experience should combine:

* Weather forecast
* User profile
* Personal style preferences
* User closet
* Jacket weather ratings
* Color matching
* Outfit templates
* User feedback history
* Uploaded jacket images

Example future output:

YES

Wear:
Your black windbreaker

Why:
Rain is expected later and this jacket is lightweight, wind-resistant, and water-resistant.

Style it with:

* Black undershirt
* Black cargos
* Jordan 1s

Why this fits you:
You prefer streetwear, darker colors, and relaxed fits.

---

# Style Mode Architecture Plan

Style Mode should be built in phases so the project stays clean and scalable.

## Phase A: Style Profile MVP — Completed

Goal: collect style preferences from the user and use them in personalized recommendations.

Add these fields to the saved user profile:

* Style preference
* Fit preference
* Preferred colors
* Favorite shoes
* Default bottoms
* Style influence

Suggested values:

style_preference:

* streetwear
* minimal
* athletic
* smart casual
* techwear
* vintage
* skater
* outdoor

fit_preference:

* relaxed
* fitted
* oversized
* layered

preferred_colors:

* black
* white
* grey
* navy
* earth tones
* bold colors

favorite_shoes:

* Jordans
* sneakers
* boots
* loafers
* running shoes

default_bottoms:

* cargos
* jeans
* chinos
* joggers
* trousers

style_influence:

* American streetwear
* Korean casual
* Japanese minimal
* European clean
* skater
* outdoor
* athletic
* techwear

Important note:

Instead of using "nationality" directly to determine style, the app should use "style influence." This is more accurate, more flexible, and more useful. A user may like Korean casual, Japanese minimal, American streetwear, European clean, or techwear regardless of nationality.

---

## Phase B: Base Style Library — Completed

Create a local style library first before adding closet uploads.

Suggested file:

```text
src/data/styleLibrary.js
```

This library should define jacket types and outfit templates.

Example structure:

```js
export const jacketStyleLibrary = [
  {
    id: "black_windbreaker",
    type: "windbreaker",
    label: "Black windbreaker",
    warmth: 2,
    rainProtection: 4,
    windProtection: 4,
    styleTags: ["streetwear", "athletic", "techwear"],
    colors: ["black"],
    outfitIdeas: [
      {
        style: "streetwear",
        top: "black tee",
        bottoms: "cargo pants",
        shoes: "Jordan 1s",
        note: "Black-on-black keeps the fit clean and works well with a windbreaker."
      }
    ]
  }
];
```

The base library should include a short but useful set of jacket categories:

* Windbreaker
* Rain shell
* Hoodie
* Denim jacket
* Bomber jacket
* Leather jacket
* Puffer jacket
* Fleece
* Overcoat
* Heavy coat

Each item should eventually have:

* Warmth rating
* Rain protection rating
* Wind protection rating
* Formality rating
* Style tags
* Color compatibility
* Outfit templates

---

## Phase C: Style Suggestion Algorithm — Completed

Create a utility function:

```text
src/utils/generateStyleSuggestion.js
```

Purpose:

Take the jacket recommendation, weather, and profile, then return an outfit suggestion.

Input:

```js
generateStyleSuggestion({
  jacketType,
  weather,
  profile
});
```

Output:

```js
{
  outfitTitle: "Clean streetwear layer",
  top: "grey hoodie",
  bottoms: "black cargos",
  shoes: "Jordan 1s",
  colorNote: "Black and grey keeps the fit clean.",
  reason: "This matches your streetwear preference and works with cooler weather."
}
```

The personalized result card should show a compact section:

Style It:

* Grey hoodie
* Black cargos
* Jordan 1s

Why:
Matches your streetwear preference and works with the recommended jacket.

This section should only appear in Personalized Mode, not Guest Mode.

---

## Phase D: Personal Closet Database — Completed

After the base style library works, add a user closet.

Create a Supabase table:

```sql
closet_items
```

Suggested fields:

```text
id
user_id
name
category
type
color
warmth_rating
rain_rating
wind_rating
formality_rating
style_tags
image_url
user_rating
times_recommended
created_at
updated_at
```

Example closet item:

```text
Name: Black windbreaker
Type: Windbreaker
Color: Black
Warmth: 2
Rain protection: 4
Wind protection: 4
Style tags: streetwear, athletic, techwear
```

The personalized app should eventually recommend actual items from the user's closet instead of generic jacket types.

Example:

Instead of:

Wear:
Light rain jacket

Show:

Wear:
Your black windbreaker

---

## Phase E: Jacket Ranking Algorithm — Completed

Create a ranking system that compares weather needs against the user's closet.

The weather engine should produce a need profile:

```js
weatherNeeds = {
  warmthNeeded: 3,
  rainProtectionNeeded: 4,
  windProtectionNeeded: 2,
  formalityNeeded: 1
};
```

Each closet item gets scored:

```js
score =
  warmthMatch +
  rainMatch +
  windMatch +
  styleMatch +
  colorMatch +
  preferenceBoost -
  overkillPenalty;
```

Example:

Rainy 62°F day:

Black windbreaker:

* Warmth match: good
* Rain match: strong
* Wind match: strong
* Style match: strong
* Score: high

Puffer jacket:

* Warmth: too much
* Rain: okay
* Style: good
* Score: lower

The app should choose the windbreaker.

This makes the app feel intelligent because it selects the best item for the conditions, not just the warmest item.

---

## Phase F: Outfit Generation — MVP Completed

Once a jacket is selected, the app should suggest a full outfit.

Outfit components:

* Jacket
* Top / base layer
* Bottoms
* Shoes
* Optional accessory

Factors:

* Jacket color
* Weather
* User style preference
* Fit preference
* Favorite shoes
* Default bottoms
* Formality level
* Rain/wind conditions

Example logic:

```js
if (style_preference === "streetwear" && jacket.color === "black") {
  return {
    top: "black tee or grey hoodie",
    bottoms: "black cargos",
    shoes: "Jordan 1s"
  };
}
```

This should start as rule-based logic before using AI.

Rule-based logic is better for the MVP because it is reliable, explainable, and easier to debug.

---

## Phase G: Feedback Loop — Next Sprint

After a personalized style recommendation, ask:

Did this fit your style?

Options:

* Fire
* Good
* Not it

Store feedback in Supabase.

Create table:

```sql
style_feedback
```

Suggested fields:

```text
id
user_id
closet_item_id
outfit_json
rating
weather_snapshot
created_at
```

Use feedback to boost or reduce future recommendations.

Example:

If user rates cargo pants + Jordans highly, recommend that style combination more often.

If user dislikes a jacket suggestion, reduce that item or style score.

This turns the project into an adaptive recommendation system.

---

## Phase H: Image Upload MVP — Completed

After closet items work manually, add jacket image upload.

Use Supabase Storage.

Create a bucket:

```text
closet-images
```

Flow:

1. User uploads a picture of a jacket
2. Image is stored in Supabase Storage
3. User manually enters or confirms item details
4. Item is saved to `closet_items`
5. Personalized recommendations can show the image

At this stage, AI is not required.

Manual confirmation is more reliable and keeps the app free.

Example upload form fields:

* Item name
* Jacket type
* Color
* Warmth rating
* Rain protection
* Wind protection
* Style tags
* Image

---

## Phase I: AI Image Description — Completed

After manual image upload works, add optional AI-assisted item recognition.

Desired flow:

1. User uploads jacket image
2. AI analyzes the image
3. AI suggests item metadata
4. User confirms or edits the result
5. Corrected item is saved to the closet

Example AI output:

```json
{
  "name": "Black windbreaker",
  "category": "jacket",
  "color": "black",
  "warmth": 2,
  "rainProtection": 4,
  "windProtection": 4,
  "styleTags": ["streetwear", "athletic", "techwear"]
}
```

Then the app asks:

Does this look right?

* Yes, save it
* Edit details

The user correction should always be trusted over the AI output.

Free or low-cost AI options to explore later:

* Gemini API
* Hugging Face vision models
* Manual fallback if API limits are reached

Important:

Do not make image AI required for the core app. The closet and style engine should work without it.

---

# Style Mode Implementation Status

Completed:

1. Added style fields to the Supabase profile table
2. Updated `ProfileForm.jsx` with style preferences
3. Created `styleLibrary.js`
4. Created `generateStyleSuggestion.js`
5. Added personalized style suggestions
6. Added the `closet_items` Supabase table
7. Built manual closet item creation
8. Added closet item ranking
9. Added outfit generation using the selected closet item
10. Added private Supabase image storage
11. Added jacket image previews
12. Added AI-assisted image analysis
13. Added user confirmation and correction
14. Connected AI-created closet items to personalized recommendations

Remaining major steps:

1. Add style feedback storage
2. Add feedback controls to personalized recommendations
3. Convert feedback into preference weights
4. Use learned weights during closet and outfit ranking
5. Add recommendation history
6. Add caching and analytics

# Immediate Next Sprint

## Feedback and Preference-Learning System

The next sprint will allow Personalized Mode to learn from user reactions.

Planned flow:

```text
Personalized recommendation
→ User selects Fire, Good, or Not It
→ Feedback is stored in Supabase
→ Jacket, color, style, and outfit preferences receive updated weights
→ Future rankings use those weights
```

Planned tasks:

1. Create a `style_feedback` table
2. Add Row Level Security policies
3. Add feedback buttons to `CheckResultCard.jsx`
4. Save the recommended jacket, outfit, weather snapshot, and rating
5. Create a user preference-weight calculation
6. Boost combinations the user likes
7. Reduce combinations the user dislikes
8. Prevent a single rating from overpowering all future recommendations
9. Add recommendation history
10. Keep the learned score hidden from the user

Expected result:

```text
Wear:
Your black windbreaker

Style It:
Black tee
Cargos
Jordan 1s

Did this fit your style?
Fire | Good | Not It
```

The system should gradually learn the user’s actual preferences instead of relying only on the profile form.

# Planned Portfolio Features

## Near-Term

* Style feedback table
* Fire / Good / Not It feedback controls
* Learned preference weights
* Recommendation history
* Improved color-pairing rules
* Better outfit variation
* Mobile closet polish
* Improved AI retry and error states

## Medium-Term

* Adaptive jacket ranking
* Adaptive outfit ranking
* Comfort feedback learning
* Per-item preference scores
* Edit existing closet items
* Multiple images per closet item
* Tops, bottoms, and shoes in the personal closet
* Better weather and style confidence scoring
* Local weather caching

## Advanced

* Trend-aware style library updates
* Image embeddings and similarity search
* Automatic background removal
* Full wardrobe outfit generation
* Analytics dashboard
* Developer-only scoring debug panel
* Optional shopping recommendations
* Provider-swappable AI analysis

# Technical Concepts Demonstrated

This project demonstrates:

* React component architecture
* React Router page routing
* Custom React hooks
* Context-based authentication state
* Supabase authentication
* Supabase database persistence
* Row Level Security design
* Supabase Storage access control
* Private file storage
* Temporary signed URLs
* Supabase Edge Functions
* Deno-based serverless functions
* Server-side secret management
* API integration
* Multimodal image analysis
* Structured AI output
* AI response normalization
* Human-in-the-loop AI correction
* Browser Geolocation API
* Forecast data processing
* Time-window analysis
* State management
* Explainable decision systems
* Rule-based recommendation engines
* User preference modeling
* Closet item scoring
* Weather-needs modeling
* Color-aware style suggestions
* Coordinate-based geolocation handling
* Search/autocomplete UX
* Graceful AI failure handling
* Storage cleanup and error recovery
* Environment variable management
* Modular frontend and backend design

Planned learning-system concepts:

* Explicit user feedback collection
* Preference-weight updates
* Adaptive recommendation ranking
* Recommendation history
* Controlled exploration versus repeated favorites

# Why This Project?

Most “Should I Wear a Jacket?” tools rely primarily on current temperature.

This project models a more realistic decision process by combining:

* Current conditions
* Forecast trends
* Time-window planning
* Rain and wind risk
* Location disambiguation
* User comfort preferences
* User style preferences
* Personal closet inventory
* Jacket protection ratings
* Jacket images
* AI-assisted clothing recognition
* User-confirmed metadata
* Rule-based outfit generation

The app can now analyze a jacket image, let the user correct the result, save it privately, rank it against the forecast, and build an outfit suggestion around the selected item.

The long-term system is:

```text
Weather intelligence
+
Personal closet
+
Style recommender
+
Image understanding
+
Preference-learning system
```

The UI should remain simple.

The complexity should live under the hood.

# Author

Daniel Islas
