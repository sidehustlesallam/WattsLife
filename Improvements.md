# WattsLife — Version 2.0 Feature & Architecture Roadmap

This document outlines planned improvements, feature enhancements, and creative concepts for future iterations of **WattsLife**.

---

## ⚡ 1. High-Impact Quick Wins (UX & Micro-Interactions)

- [x] **Preset User Profiles:**
  - Add single-click preset chips at the top of the inputs section:
    - 🏙️ *Off-Grid Cabin (Minimal)*
    - 🏡 *Standard Suburban Homestead (Average)*
    - ⚡ *High-Tech Power User / Daily EV (WattsLife Default)*
- [x] **Shareable System Specs (URL Hash Encoding):**
  - Encode state parameters (EV miles, heating type, climate zone) into the URL hash (e.g., `#ev=40&heat=heatpump&sun=low`).
  - Allow users to bookmark or share their custom off-grid setup link.
- [x] **Print / Export PDF Summary:**
  - Add a "Export Spec Sheet" button that formats the overview cards, cost estimates, and real-world physical metaphors into a clean 1-page PDF/print layout for installers or personal planning.
- [x] **Currency & Metric Units Toggle:**
  - Add a header toggle for **£ (GBP) / $ (USD) / € (EUR)** and **m² / ft²**.

---

## ☀️ 2. Enhanced Physics & Calculation Accuracy

- [x] **Dynamic Temperature / Seasonal Slider:**
  - Let users slide between *January (Deep Winter)* and *July (Peak Summer)* to see dynamic heat pump efficiency (COP drop in cold weather) and solar yield drop in real time.
- [x] **EV Battery Buffer & Smart Load Scheduling:**
  - Account for Vehicle-to-Home (V2H / V2G) bidirectional charging capabilities as an emergency secondary battery bank.
- [x] **3D Roof Tilt & Azimuth Estimator:**
  - Simple visual selector for roof pitch (e.g., 30° steep vs. flat ground mount) and orientation (South vs. East/West split) to show orientation penalty percentages.
- [x] **Turbine Cut-in Wind Speed Logic:**
  - Add explicit warning flags if low-wind suburban environments are selected, explaining why high turbulence/low mast height drastically reduces small wind turbine capacity factors.

---

## 🎨 3. Creative "Real-World Metaphor" Extensions

- [x] **Interactive Footprint Visualizer (SVG Canvas):**
  - Draw a dynamic top-down canvas showing the scale of the user's solar array next to standard objects (e.g., a 2-car garage, tennis court, or standard football pitch outline).
- [x] **"Days of Autonomy" Survival Simulator:**
  - An interactive mini-game/stress-test: *"What happens if there are 4 straight rainy, windless days in December?"*
  - Animates battery SOC draining hour-by-hour and shows when the auto-start generator kicks in.
- [x] **Off-Grid Appliances Equivalent Breakdown:**
  - Add a fun breakdown section showing everyday off-grid limits:
    - *"Your current battery setup can power 480 hours of Starlink internet, or 120 loads of laundry, or 1,200 espresso shots."*

---

## 🛠️ 4. Technical & Codebase Enhancements

- [x] **PWA (Progressive Web App) Support:**
  - Add a `manifest.json` and basic Service Worker so WattsLife can be saved to home screens and used completely offline without internet connection.
- [x] **Theme Customization (Dark / High Contrast Solar Mode):**
  - Add an outdoor high-contrast "Sunlight Mode" for reading phone/tablet screens outdoors while evaluating land or roof space.
- [x] **Automated Test Suite:**
  - Add basic Jest or Vitest suite to unit-test `app.js` calculation math (ensuring edge cases like 0 EV miles or extreme heat loads compute safely without NaN errors).

---

## 🤖 Handoff Instructions for Cursor / AI Agents

When implementing features from this roadmap:
1. Keep `app.js` pure JS without heavy bundler dependencies to preserve fast, zero-build GitHub Pages deployment.
2. Maintain the core design philosophy: **Never display pure technical data without a real-world physical metaphor.**
3. Update `agents.md` if any new state parameters or calculations are introduced.
4. Version 2.0 implementation keeps the app static and adds a user-first "best next step" recommendation, share-link copy action, and print stylesheet.
