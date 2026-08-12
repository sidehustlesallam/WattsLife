# WattsLife agent handoff

## Infrastructure

- Static GitHub Pages app.
- No bundler, package manager, transpiler, or build output is required.
- Runtime files:
  - `index.html`
  - `styles.css`
  - `app.js`
- External browser dependencies are loaded by CDN in `index.html`:
  - Tailwind CSS CDN
  - Chart.js CDN
  - Google Fonts Inter

## Local validation

Use any static file server from the repository root:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

Suggested checks:

1. Move all three sliders and confirm numeric labels, dashboard cards, detail cards, and donut chart update live.
2. Click every selector card in the climate, household, sun, and wind groups.
3. Toggle Winter/Summer and verify the daily demand note, season generation estimates, and renewable balance update.
4. Resize below tablet and mobile breakpoints to verify single-column layout.
5. Test with browser devtools console open for JavaScript errors.

## Calculation model

`app.js` keeps all source assumptions in constants and option maps near the top of the file. The main flow is:

1. DOM state is stored in the `state` object.
2. `calculateSystem()` builds a complete model from state.
3. `renderInputs()`, `renderOverview()`, `renderDetails()`, and `renderChart()` update the UI.

Important behavior:

- Equipment is intentionally sized against the winter peak profile for off-grid resilience.
- The Winter/Summer toggle changes active demand and generation balance, while preserving winter-resilient equipment sizing.
- Solar panel count is rounded up to whole 420W panels.
- Battery capacity is usable LFP capacity sized at 1.5 days of winter demand.
- Generator runtime estimates model severe winter weather days where renewable output is materially reduced.

## Future changes

- Keep this project dependency-free unless a build pipeline becomes necessary.
- If adding new assumptions, define them once near the top of `app.js`.
- Maintain accessible control semantics:
  - Slider labels remain bound to inputs.
  - Selector cards maintain `aria-pressed`.
  - Season toggle maintains `role="switch"` and `aria-checked`.
- Preserve GitHub Pages compatibility by using relative local asset paths.
