# WattsLife

WattsLife is a responsive, single-page Off-Grid Energy System Calculator for non-specialist users. It turns everyday activities, such as EV driving, hot showers, tea or coffee boils, household electronics, and climate control, into approachable solar, wind, battery, generator, and hardware cost estimates.

## What it calculates

- Daily energy demand in kWh/day
- Winter-resilient solar array size, 420W panel count, and roof/ground area
- Wind turbine recommendation, rotor size, and tower height by site exposure
- LFP battery storage sized for 1.5 days of autonomy
- Auto-start generator rating, fuel type, winter runtime, and fuel use
- Hardware-only cost ranges for solar, wind, batteries, inverter/charger, and generator
- Live Chart.js demand breakdown for EV, heating/cooling, hot water, and base household loads
- January vs. July balance view for winter peak demand and summer surplus checks

## Project structure

```text
.
├── index.html   # Static single-page app markup and CDN dependencies
├── styles.css   # Responsive visual system and component styling
├── app.js       # Live state, calculations, DOM updates, and Chart.js rendering
├── README.md    # Client-facing usage and deployment guide
└── agents.md    # Future-agent implementation and infrastructure notes
```

## Run locally

No package install or build step is required.

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

You can also open `index.html` directly in a browser, but a local static server more closely matches GitHub Pages behavior.

## Deploy to GitHub Pages

1. Commit `index.html`, `styles.css`, and `app.js` to the repository.
2. In GitHub, open **Settings → Pages**.
3. Select the branch and root folder that contain `index.html`.
4. Save. GitHub Pages will serve the app as a static site.

## Calculation notes

WattsLife is designed for early-stage education and planning, not final electrical design. Key assumptions are embedded in `app.js`:

- EV driving: about `0.33 kWh / mile`
- Hot showers: about `2.0 kWh / shower`
- Kettle boils: about `0.10 kWh / boil`
- Solar panel rating: `420W`
- Solar panel area: about `2.0 m² / panel`
- Battery autonomy: `1.5 days`
- Cost assumptions:
  - Solar panels and racking: `$0.80 - $1.10 / Wp`
  - Wind turbine and mast: `$2,200 - $3,000 / kW`
  - LFP battery racks: `$250 - $350 / usable kWh`
  - Inverter/charger plus auto-start generator: `$4,500 - $7,500`

All values should be checked against local climate data, utility habits, installer quotes, building constraints, electrical codes, and permitting rules before a real system is specified.
