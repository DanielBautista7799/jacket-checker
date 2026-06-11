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

The logged-in version is a separate experience from guest mode.

Users can create an account, save a profile, set a default location, and run personalized jacket checks. The personalization score is calculated under the hood and is not shown directly to the user.

Personalized Mode should feel more advanced than Guest Mode while still staying clean:

* Uses saved profile
* Uses comfort preferences
* Uses default location
* Uses forecast window
* Shows personalized reasoning
* Eventually adds style suggestions, closet items, and outfit recommendations

### Personalized User Flow

1. Login or create an account
2. Complete profile setup
3. Save default location
4. Go to personalized jacket app
5. Run a personalized forecast check
6. Receive a more tailored jacket recommendation

### Saved Profile Fields

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

### Personalized Recommendation Factors

* Forecast-based weather score
* User cold tolerance
* Rain sensitivity
* Wind sensitivity
* Usual exposure time
* Age-based warmth buffer
* Default location

### Personalized Output

The personalized version returns a simple user-facing recommendation, but the internal scoring adjusts based on the saved profile.

Example:

YES

Wear:
Water-resistant jacket

Tuned For You:

* Your profile says rain affects your comfort more than average
* Your usual time outside is medium, so the forecast window matters

Why:

* Rain is likely later
* Wind may increase

The goal is to eventually evolve the logged-in experience into a full outfit recommendation engine.

---

# Current Architecture

```text
src/
├── components/
│   ├── AppHeader.jsx
│   ├── AuthPanel.jsx
│   ├── CheckResultCard.jsx
│   ├── JacketForm.jsx
│   ├── LocationSearch.jsx
│   ├── PersonalizedJacketCheck.jsx
│   ├── ProfileForm.jsx
│   ├── ProtectedRoute.jsx
│   ├── TimeWindowSelect.jsx
│   ├── RecommendationCard.jsx
│   └── WeatherCard.jsx
│
├── context/
│   └── AuthContext.jsx
│
├── hooks/
│   ├── useAuth.js
│   ├── useBrowserLocation.js
│   ├── useLocationSearch.js
│   ├── useProfile.js
│   └── useWeather.js
│
├── lib/
│   └── supabaseClient.js
│
├── pages/
│   ├── AuthPage.jsx
│   ├── GuestPage.jsx
│   ├── PersonalizedPage.jsx
│   └── ProfilePage.jsx
│
├── utils/
│   ├── analyzeForecast.js
│   ├── calculateJacketScore.js
│   ├── calculatePersonalizedRecommendation.js
│   ├── calculateProfileModifier.js
│   ├── mapScoreToRecommendation.js
│   └── timeWindows.js
│
├── App.jsx
└── main.jsx
```

Note:

`WeatherCard.jsx` and `RecommendationCard.jsx` may remain in the project temporarily, but the main guest and personalized check flows now use `CheckResultCard.jsx` to keep the UI focused on the jacket decision instead of feeling like a weather dashboard.

---

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
* Saved user profiles
* Default location storage
* Row Level Security policies
* Profile upsert logic
* Protected personalized routes

User profile data is stored in Supabase and protected so each authenticated user can only access their own profile.

Environment variables are stored in `.env` and excluded from GitHub.

Required environment variables:

```env
VITE_WEATHER_API_KEY=YOUR_WEATHERAPI_KEY
VITE_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

`.env.example` should contain placeholder values only.

---

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
* Guest mode page
* Auth page
* Profile page
* Personalized app page
* Supabase authentication
* Supabase profile persistence
* Protected personalized routes
* Hidden personalization scoring
* Minimal signed-out navigation
* Minimal signed-in navigation
* Modular React architecture

---

# Style Mode Roadmap

Style Mode is the next major phase of the project and will be the main difference between Guest Mode and Personalized Mode.

Guest Mode should stay fast, simple, and minimal:

* Use location
* Select forecast window
* Get a YES / NO jacket recommendation
* See a quick bring-along suggestion if needed

Personalized Mode should become more advanced and tailored:

* Uses saved profile
* Uses style preferences
* Uses saved closet items
* Suggests specific jackets
* Suggests how to style the jacket
* Learns from user feedback over time
* Eventually supports jacket image uploads and AI-assisted item descriptions

The long-term goal is to evolve the project from a weather-based jacket checker into a personalized outfit recommendation system.

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

## Phase A: Style Profile MVP

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

## Phase B: Base Style Library

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

## Phase C: Style Suggestion Algorithm

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

## Phase D: Personal Closet Database

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

## Phase E: Jacket Ranking Algorithm

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

## Phase F: Outfit Generation

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

## Phase G: Feedback Loop

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

## Phase H: Image Upload MVP

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

## Phase I: AI Image Description

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

# Style Mode Implementation Order

The correct order is:

1. Add style fields to Supabase profile table
2. Update `ProfileForm.jsx` with style preferences
3. Create local `styleLibrary.js`
4. Create `generateStyleSuggestion.js`
5. Update `calculatePersonalizedRecommendation.js`
6. Update `CheckResultCard.jsx` to show Style It section in Personalized Mode
7. Add closet item table in Supabase
8. Build manual closet item form
9. Add closet item ranking algorithm
10. Add outfit generation based on closet item
11. Add feedback table and feedback buttons
12. Add Supabase image upload
13. Add AI-assisted image description
14. Add user confirmation and correction flow

---

# Immediate Next Sprint

The next sprint should be:

## Style Profile MVP + Outfit Suggestion Library

Tasks:

1. Add style fields to `profiles` table
2. Update profile form
3. Create style library
4. Generate outfit suggestion from profile + jacket type
5. Display compact personalized-only Style It section

Expected result:

Guest Mode:

```text
NO
Wear: No jacket
Bring Along: Light rain shell
```

Personalized Mode:

```text
YES
Wear: Light jacket

Style It:
Grey hoodie
Black cargos
Jordan 1s

Why:
Matches your streetwear preference and works with the forecast.
```

This will make the difference between Guest Mode and Personalized Mode obvious without making the screen cluttered.

---

# Planned Portfolio Features

## Near-Term

* Improve UI polish
* Add weather icons
* Add dynamic backgrounds based on weather conditions
* Add confidence score internally
* Add improved jacket categories
* Implement Style Profile MVP
* Add outfit suggestion library

## Medium-Term

* Style preference system
* Saved jacket inventory
* Jacket taxonomy
* Better outfit matching
* User feedback loop
* Recommendation history
* Manual closet item creation
* Supabase closet item storage

## Advanced

* Adaptive recommendation tuning
* Comfort feedback learning
* Style feedback learning
* Local caching for weather requests
* Analytics dashboard
* Style mode with outfit generation
* Supabase image upload
* AI-assisted jacket image description
* Developer-only debug panel for scoring internals

---

# Technical Concepts Demonstrated

This project demonstrates:

* React component architecture
* React Router page routing
* Custom React hooks
* Context-based authentication state
* Supabase authentication
* Supabase database persistence
* Row Level Security design
* API integration
* Browser Geolocation API
* Forecast data processing
* Time-window analysis
* State management
* Explainable decision systems
* Rule-based recommendation engines
* Coordinate-based geolocation handling
* Search/autocomplete UX
* Environment variable management
* Modular application design

Planned Style Mode concepts:

* User preference modeling
* Recommendation ranking
* Rule-based outfit generation
* Closet item scoring
* Color matching logic
* Feedback-based learning
* Image upload pipelines
* Human-in-the-loop AI correction

---

# Why This Project?

Most "Should I Wear a Jacket?" tools rely primarily on current temperature.

This project models a more realistic decision process by combining:

* Current conditions
* Forecast trends
* Time-window planning
* Rain and wind risk
* Location disambiguation
* User profile personalization
* Future closet and style preferences

The objective is to build a recommendation system that behaves closer to how a person would actually decide what to wear.

Long-term, the project should feel like:

```text
Weather app
+
Closet app
+
Style recommender
+
Personal learning system
```

But the UI should stay simple.

The complexity should live under the hood.

---

# Author

Daniel Islas
