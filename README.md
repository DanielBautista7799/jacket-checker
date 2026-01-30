# 🧥 Should I Wear a Jacket?

A personalized weather-based recommendation app that determines whether you should wear a jacket — and what type — based on real-time weather data and individual user factors.

Unlike basic temperature-only tools, this app accounts for:

- Feels-like temperature
- Wind speed and wind chill
- Rain probability
- Time spent outdoors
- Personal cold tolerance
- Activity level

---

## 🚀 Live Demo
(Coming Soon)

---

## 🎯 Project Goals

This project aims to:

- Build a clean, responsive weather-based UI
- Integrate a real-time weather API
- Implement a dynamic scoring algorithm for clothing recommendations
- Personalize output based on user traits
- Practice API integration and state management in React

---

## 🧠 Core Logic Concept

The application calculates a **Jacket Score** based on multiple factors:

JacketScore =  
TemperatureFactor +  
WindFactor +  
RainFactor +  
DurationFactor +  
PersonalSensitivityFactor  

The final score maps to a recommendation category:

- No jacket
- Light jacket / hoodie
- Insulated jacket
- Waterproof shell
- Heavy winter coat

---

## 🛠 Tech Stack

- React (Vite)
- JavaScript
- Weather API (TBD: OpenWeather / WeatherAPI)
- CSS / Tailwind (TBD)
- GitHub for version control
- Vercel for deployment (planned)

---

## 📌 MVP Features

- [ ] Clean UI layout
- [ ] User input form (duration, tolerance, activity)
- [ ] Weather API integration
- [ ] Jacket scoring algorithm
- [ ] Recommendation output component
- [ ] Basic styling

---

## 🌟 Phase 2 Features

- [ ] Wind chill formula implementation
- [ ] Geolocation auto-detection
- [ ] Outfit recommendation cards with icons
- [ ] Dynamic background based on temperature
- [ ] Save user preferences (local storage)

---

## 🧪 Phase 3 (Advanced / Experimental)

- [ ] User feedback loop ("Were you comfortable?")
- [ ] Adaptive scoring adjustments
- [ ] ML-based recommendation tuning
- [ ] Analytics dashboard

---

## 📈 Why This Project?

Most "Do I need a jacket?" websites rely solely on temperature.  
This project improves upon that by modeling environmental and human variables to deliver more realistic recommendations.

It demonstrates:

- API consumption
- Conditional logic modeling
- UX personalization
- Clean component structure
- Scalable feature planning

---

## 📂 Project Structure (Planned)

src/
  components/
  hooks/
  utils/
  App.jsx
  main.jsx

---

## 👤 Author

Daniel Islas
