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

### Guest User Flow

1. Use current location or search for a location
2. Select a forecast window
3. Press "Do I Need A Jacket?"
4. Receive a single jacket verdict with explanation

No account required.

No saved profile required.

No personalization required.

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
* Weather breakdown
* Time-window preview

Example:

NO

Current Recommendation:
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

### Personalized User Flow

1. Login or create an account
2. Complete profile setup
3. Save default location
4. Go to personalized jacket app
5. Run a personalized forecast check

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

The personalized version still returns a simple user-facing recommendation, but the internal scoring adjusts based on the saved profile.

Example:

YES

Recommended:
Water-resistant jacket

Why:

* Rain is likely later
* Wind may increase
* Your profile says rain affects your comfort more than average
* Your usual time outside is medium, so the forecast window matters

The goal is to eventually evolve the logged-in experience into a full outfit recommendation engine.

---

# Current Architecture

```text
src/
├── components/
│   ├── AppHeader.jsx
│   ├── AuthPanel.jsx
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

This avoids ambiguous city names and allows the guest mode to be nearly one-click.

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
* WeatherAPI integration
* Forecast API integration
* Location autocomplete search
* Exact coordinate-based weather lookup
* Browser geolocation support
* Time-window forecast analysis
* Current weather display
* Forecast window preview
* Forecast-aware jacket scoring engine
* Bring-along recommendations
* Rain-aware recommendations
* Wind-aware recommendations
* Temperature-drop detection
* Explainable recommendation output
* React Router page separation
* Guest mode page
* Auth page
* Profile page
* Personalized app page
* Supabase authentication
* Supabase profile persistence
* Protected personalized routes
* Hidden personalization scoring
* Modular React architecture

---

# Planned Portfolio Features

## Near-Term

* Improve UI polish
* Add weather icons
* Add dynamic backgrounds based on weather conditions
* Add better forecast visualization
* Add confidence score internally
* Add improved jacket categories

## Medium-Term

* Style preference system
* Saved jacket inventory
* Jacket taxonomy
* Better outfit matching
* User feedback loop
* Recommendation history

## Advanced

* Adaptive recommendation tuning
* Comfort feedback learning
* Local caching for weather requests
* Analytics dashboard
* Style mode with outfit generation
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

The objective is to build a recommendation system that behaves closer to how a person would actually decide what to wear.

---

# Author

Daniel Islas
