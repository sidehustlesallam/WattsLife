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

## 🌱 5. Future User-First Feature & UX Enhancements

- [ ] **Guided Setup Wizard for First-Time Users:**
  - Offer a step-by-step mode that asks one plain-English question at a time, then reveals the full dashboard after the user has enough context.
  - Include "Why this matters" helper text beside each question for non-technical users.
- [ ] **Save & Compare Multiple Scenarios:**
  - Let users save named scenarios locally, such as *Budget Cabin*, *Family Winter*, and *EV Upgrade*.
  - Add a comparison table that highlights changes in panel count, battery size, generator runtime, footprint, and cost.
- [ ] **Editable Assumptions / Advanced Mode:**
  - Add an assumptions drawer where confident users can adjust panel wattage, panel area, system loss factor, battery autonomy days, energy prices, and cost multipliers.
  - Keep default assumptions locked behind simple language so new users are not overwhelmed.
- [ ] **Location-Aware Climate Lookup:**
  - Allow users to enter a postcode, ZIP code, or nearest city to prefill peak sun hours, seasonal solar multipliers, and wind exposure guidance.
  - Include a manual fallback so the app still works offline.
- [ ] **Installer-Ready Bill of Materials:**
  - Generate a plain-language parts list with solar panels, mounting type, inverter/charger class, battery rack count, generator class, safety disconnects, and monitoring hardware.
  - Keep it non-brand-specific unless users intentionally choose vendor presets later.
- [ ] **Essential Loads Priority Planner:**
  - Let users tag loads as *critical*, *comfort*, or *optional*.
  - Show a storm-mode plan that prioritizes fridge/freezer, medical equipment, comms, lighting, heating controls, water pump, and cooking.
- [ ] **Confidence Ranges & Risk Flags:**
  - Display low/typical/high estimate bands for generation, consumption, and hardware cost.
  - Add plain-language risk flags such as *roof area likely insufficient*, *generator dependency high*, *battery room heavy load*, and *wind planning risk*.
- [ ] **Grid-Connection / Fuel-Only Comparison:**
  - Compare the off-grid system against estimated grid connection cost, diesel-only operation, or hybrid generator-plus-battery alternatives.
  - Explain tradeoffs in reliability, noise, emissions, maintenance, and upfront cost.
- [ ] **Mobile Property Walkthrough Checklist:**
  - Add a field-survey checklist for users walking their site: roof photos, compass direction, shading notes, battery room dimensions, generator distance, fuel storage, and mast clearance.
  - Export the checklist alongside the spec sheet.
- [ ] **Accessibility & Plain-Language Audit:**
  - Run a dedicated WCAG pass for keyboard navigation, focus states, color contrast, screen-reader labels, and reduced-motion preferences.
  - Add a glossary for terms like kWh, kWp, SOC, COP, peak sun hours, LFP, and inverter/charger.
- [ ] **Localization & Regional Defaults:**
  - Add regional presets for UK, EU, US, and Australia with localized currency, units, climate examples, fuel terminology, and electrical guidance notes.
  - Keep all calculations transparent and editable.
- [ ] **Optional Vendor Quote Pack Export:**
  - Generate a clean installer email brief with the user's assumptions, charts, physical metaphors, site warnings, and requested quote categories.
  - Include a reminder that WattsLife is educational and should be validated by qualified professionals.

---

## 🤖 Handoff Instructions for Cursor / AI Agents

When implementing features from this roadmap:
1. Keep `app.js` pure JS without heavy bundler dependencies to preserve fast, zero-build GitHub Pages deployment.
2. Maintain the core design philosophy: **Never display pure technical data without a real-world physical metaphor.**
3. Update `agents.md` if any new state parameters or calculations are introduced.
4. Version 2.0 implementation keeps the app static and adds a user-first "best next step" recommendation, share-link copy action, and print stylesheet.
