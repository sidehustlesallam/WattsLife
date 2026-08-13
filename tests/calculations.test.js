const test = require("node:test");
const assert = require("node:assert/strict");

const {
  DEFAULT_STATE,
  calculateSystem,
  getSurvivalSimulation,
  normalizeState
} = require("../app.js");

test("default homestead profile produces finite system specs", () => {
  const model = calculateSystem(DEFAULT_STATE);

  assert.ok(Number.isFinite(model.energy.activeDemand));
  assert.ok(model.energy.activeDemand > 0);
  assert.ok(model.solar.panels > 0);
  assert.ok(model.solar.areaM2 > 0);
  assert.ok(model.battery.kwh > model.energy.designDemand);
  assert.ok(model.generator.kw >= 6);
  assert.ok(model.costs.totalHigh > model.costs.totalLow);
});

test("zero lifestyle loads do not create NaN outputs", () => {
  const model = calculateSystem({
    ...DEFAULT_STATE,
    evMiles: 0,
    showers: 0,
    kettles: 0,
    climate: "mild",
    household: "small",
    wind: "sheltered"
  });

  assert.equal(model.wind.kw, 0);
  assert.ok(Number.isFinite(model.balance.ratio));
  assert.ok(Number.isFinite(model.generator.runtimeHours));
  assert.ok(model.solar.panels > 0);
});

test("roof penalty increases required panel count", () => {
  const ideal = calculateSystem({ ...DEFAULT_STATE, roof: "ideal" });
  const shaded = calculateSystem({ ...DEFAULT_STATE, roof: "shaded" });

  assert.ok(shaded.solar.panels > ideal.solar.panels);
  assert.ok(shaded.solar.roof.penalty > ideal.solar.roof.penalty);
});

test("V2H increases survival reserve and storm state of charge", () => {
  const noV2h = calculateSystem({ ...DEFAULT_STATE, v2h: "none", stormDays: 2 });
  const largeV2h = calculateSystem({ ...DEFAULT_STATE, v2h: "large", stormDays: 2 });

  assert.ok(largeV2h.battery.reserveKwh > noV2h.battery.reserveKwh);
  assert.ok(largeV2h.survival.endSoc > noV2h.survival.endSoc);
});

test("state normalization clamps hash-derived values safely", () => {
  const normalized = normalizeState({
    evMiles: 999,
    showers: -3,
    kettles: Number.NaN,
    seasonMonth: 42,
    stormDays: 0,
    currency: "CAD",
    units: "yards"
  });

  assert.equal(normalized.evMiles, 120);
  assert.equal(normalized.showers, 0);
  assert.equal(normalized.kettles, 0);
  assert.equal(normalized.seasonMonth, 7);
  assert.equal(normalized.stormDays, 1);
  assert.equal(normalized.currency, "USD");
  assert.equal(normalized.units, "metric");
});

test("survival simulator starts generator before deep discharge", () => {
  const result = getSurvivalSimulation(4, 40, 90);

  assert.equal(result.startsWithinStorm, true);
  assert.ok(result.startDay >= 1);
  assert.ok(result.endSoc >= 0);
});
