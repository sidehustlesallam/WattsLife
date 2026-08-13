# WattsLife agent handoff

## Infrastructure

- Static GitHub Pages app.
- No bundler, package manager, transpiler, or build output is required.
- Runtime files:
  - `index.html`
  - `styles.css`
  - `app.js`
  - `manifest.json`
  - `sw.js`
  - `icon.svg`
- External browser dependencies are loaded by CDN in `index.html`:
  - Tailwind CSS CDN
  - Chart.js CDN
  - Google Fonts Inter
- Tests use Node's built-in `node:test` runner. There are no npm package dependencies.

## Local validation

Use any static file server from the repository root:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

Suggested checks:

1. Move all three sliders and confirm numeric labels, dashboard cards, detail cards, and donut chart update live.
2. Click every selector card in the climate, household, sun, wind, roof, and V2H groups.
3. Toggle Winter/Summer and move the January-to-July seasonal slider.
4. Try preset chips, currency/unit toggles, Sunlight Mode, Copy Link, and Export Spec Sheet.
5. Move the autonomy simulator's poor-weather-days slider.
6. Resize below tablet and mobile breakpoints to verify single-column layout.
7. Test with browser devtools console open for JavaScript errors.
8. Run `npm test`.

## Calculation model

`app.js` keeps all source assumptions in constants and option maps near the top of the file. The main flow is:

1. DOM state is stored in the `state` object.
2. `calculateSystem(inputState = state)` builds a complete model from state and can be imported by Node tests.
3. `renderInputs()`, `renderOverview()`, `renderDetails()`, and `renderChart()` update the UI.

Important behavior:

- Equipment is intentionally sized against the winter peak profile for off-grid resilience.
- The Winter/Summer toggle jumps the seasonal slider between January and July.
- The seasonal slider interpolates climate demand, heat-pump COP, solar yield, and wind capacity factor.
- Solar panel count is rounded up to whole 420W panels.
- Roof orientation and shade factors affect solar sizing and generation.
- Battery capacity is usable LFP capacity sized at 1.5 days of winter demand.
- V2H does not reduce the fixed home battery recommendation; it adds emergency reserve for storm simulation and appliance equivalents.
- Generator runtime estimates model severe winter weather days where renewable output is materially reduced.
- URL hash state is updated by `updateHash()` and read by `hydrateFromHash()`.
- Service worker caching is app-shell first and opportunistically caches CDN requests after successful network fetches.

## Future changes

- Keep this project dependency-free unless a build pipeline becomes necessary.
- If adding new assumptions, define them once near the top of `app.js`.
- If adding state fields, update `DEFAULT_STATE`, `normalizeState()`, `hydrateFromHash()`, `updateHash()`, UI synchronization, tests, and this file.
- Maintain accessible control semantics:
  - Slider labels remain bound to inputs.
  - Selector cards maintain `aria-pressed`.
  - Season toggle maintains `role="switch"` and `aria-checked`.
  - Currency, unit, preset, and theme controls maintain clear pressed/active states.
- Preserve GitHub Pages compatibility by using relative local asset paths.
