# 🧥 Should I Wear a Jacket?

A weather intelligence application that goes beyond temperature and provides practical jacket recommendations using current conditions, forecast trends, and environmental factors.

The goal is simple:

> Given a location and the current forecast, determine whether someone should wear a jacket and recommend the most appropriate type.

Unlike most weather applications, the recommendation engine is designed to explain its decisions rather than simply display weather data.

---

# Current Project Vision

The project is being developed in two major phases.

## Phase 1: Guest Experience (Current Focus)

The guest experience is designed to be as fast and frictionless as possible.

### User Flow

1. Search for a location
2. Select the correct location from autocomplete suggestions
3. Press "Do I Need A Jacket?"
4. Receive an explainable recommendation

No account required.

No personalization required.

No setup required.

### Current Inputs

* Location search with autocomplete
* Exact location selection using coordinates

### Current Outputs

* YES / NO jacket verdict
* Recommended jacket type
* Weather explanation
* Forecast warnings
* Temperature trend analysis

Example:

YES

Recommended:
Light Jacket

Why:

* Feels like 54°F
* Moderate wind
* Temperature expected to drop later

Forecast Watch:

* Low temperature of 43°F tonight
* Rain possible this evening

---

## Phase 2: Personalized Account Experience

The logged-in experience will focus on personalization.

Planned profile fields:

* Cold tolerance
* Body type
* Activity level
* Style preference
* Preferred jacket types
* Comfort history

Planned recommendation output:

Wear:
Black Bomber Jacket

Why:
You typically run cold and temperatures are expected to fall rapidly this evening.

Style Suggestion:
Grey hoodie
Black jeans
White sneakers

The goal is to transition from weather recommendation to outfit recommendation.

---

# Current Architecture

src/
├── components/
│   ├── JacketForm.jsx
│   ├── LocationSearch.jsx
│   ├── RecommendationCard.jsx
│   └── WeatherCard.jsx
│
├── hooks/
│   ├── useWeather.js
│   └── useLocationSearch.js
│
├── utils/
│   ├── calculateJacketScore.js
│   └── mapScoreToRecommendation.js
│
├── App.jsx
└── main.jsx

---

# Recommendation Engine

The recommendation engine evaluates multiple weather factors rather than relying solely on temperature.

Current factors:

* Feels-like temperature
* Wind speed
* Rain probability
* Daily low temperature
* Upcoming hourly forecast
* Predicted temperature drops

The engine produces:

1. Numerical score
2. Recommendation category
3. Explanation list
4. Forecast alerts

This allows the application to justify every recommendation.

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
* Current weather display
* Forecast display
* Jacket scoring engine
* Recommendation mapping engine
* Explainable recommendation output
* Modular React architecture

---

# Planned Portfolio Features

## Near-Term

* Use My Current Location
* Weather icons
* Dynamic backgrounds based on conditions
* Better forecast visualization
* Improved jacket categories

## Medium-Term

* User authentication
* Saved profiles
* Personalized recommendations
* Style preferences
* Saved jacket inventory

## Advanced

* Outfit recommendations
* Feedback system ("Were you comfortable?")
* Adaptive recommendation tuning
* Recommendation analytics dashboard

---

# Technical Concepts Demonstrated

This project demonstrates:

* React component architecture
* Custom React hooks
* API integration
* Forecast data processing
* State management
* Explainable decision systems
* Recommendation engines
* Search/autocomplete UX
* Coordinate-based geolocation handling
* Scalable application design

---

# Why This Project?

Most "Should I Wear a Jacket?" tools rely primarily on temperature.

This project attempts to model real-world decision making by combining:

* Current conditions
* Forecast trends
* Environmental factors
* Future personalization

The objective is to create a recommendation engine that behaves more like a human decision-making process than a simple temperature lookup.

---

# Author

Daniel Islas
