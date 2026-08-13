const SYSTEM_LOSS_FACTOR = 1.2;
const PANEL_WATTS = 420;
const PANEL_AREA_M2 = 2;
const FT2_PER_M2 = 10.7639;

const CURRENCIES = {
  USD: { symbol: "$", rate: 1, label: "USD" },
  GBP: { symbol: "£", rate: 0.78, label: "GBP" },
  EUR: { symbol: "€", rate: 0.92, label: "EUR" }
};

const MONTHS = {
  1: { label: "January", short: "Jan", progress: 0 },
  2: { label: "February", short: "Feb", progress: 0.16 },
  3: { label: "March", short: "Mar", progress: 0.34 },
  4: { label: "April", short: "Apr", progress: 0.52 },
  5: { label: "May", short: "May", progress: 0.68 },
  6: { label: "June", short: "Jun", progress: 0.86 },
  7: { label: "July", short: "Jul", progress: 1 }
};

const options = {
  climate: {
    mild: {
      label: "Mild",
      winterKwh: 12,
      summerKwh: 4,
      winterCop: 2.4,
      summerCop: 4.2,
      description: "Heat pump in modern well-insulated home"
    },
    moderate: {
      label: "Moderate",
      winterKwh: 25,
      summerKwh: 7,
      winterCop: 2.1,
      summerCop: 3.7,
      description: "Heat pump in standard insulated property"
    },
    heavy: {
      label: "Heavy",
      winterKwh: 42,
      summerKwh: 14,
      winterCop: 1,
      summerCop: 2.4,
      description: "Electric resistive / AC in harsh seasonal weather"
    }
  },
  household: {
    small: { label: "Small", kwh: 8, description: "1-2 occupants" },
    medium: { label: "Medium", kwh: 14, description: "3-4 occupants" },
    large: { label: "Large", kwh: 22, description: "5+ occupants" }
  },
  sun: {
    low: { label: "Low Sun / Overcast", psh: 2.2, description: "UK / Northern Europe" },
    moderate: { label: "Moderate Sun", psh: 3.6, description: "Central Europe / Mid-US" },
    high: { label: "High Sun", psh: 5.2, description: "Southern Europe / Sunbelt US" }
  },
  wind: {
    sheltered: {
      label: "Sheltered / Urban / Suburban",
      summary: "Low wind potential",
      winterCf: 0.05,
      summerCf: 0.03,
      cutInWarning: "Small turbines often need clean wind above roughly 3 m/s. Buildings, trees, and short masts can make suburban output collapse."
    },
    moderate: {
      label: "Open Countryside / Rolling Hills",
      summary: "Moderate potential",
      winterCf: 0.22,
      summerCf: 0.13,
      cutInWarning: "Moderate wind can help winter resilience, but confirm a clear mast location before buying hardware."
    },
    high: {
      label: "Exposed Coastal / Ridge",
      summary: "High potential",
      winterCf: 0.32,
      summerCf: 0.19,
      cutInWarning: "High exposure is promising for winter output; verify planning rules, setbacks, and storm-rated mast design."
    }
  },
  roof: {
    ideal: {
      label: "Ideal south-facing roof",
      factor: 1,
      penalty: 0,
      metaphor: "Best-case roof or ground mount: every panel works like it has a front-row seat to the sun."
    },
    eastwest: {
      label: "East / West split",
      factor: 0.86,
      penalty: 14,
      metaphor: "East/west roofs spread generation across the day but need extra panels to match a south-facing array."
    },
    flat: {
      label: "Flat / shallow roof",
      factor: 0.78,
      penalty: 22,
      metaphor: "Flat roofs need tilt frames and spacing; think fewer panels per roof lane, like leaving aisles in a parking lot."
    },
    shaded: {
      label: "Partial shade",
      factor: 0.65,
      penalty: 35,
      metaphor: "Partial shade behaves like putting a cloud over part of the array every day; expect a meaningfully larger system."
    }
  },
  v2h: {
    none: {
      label: "No V2H emergency battery",
      usableKwh: 0,
      metaphor: "Your EV is treated as a daily load only."
    },
    standard: {
      label: "V2H ready EV",
      usableKwh: 30,
      metaphor: "If plugged in, your EV adds an emergency reserve about the size of a compact home battery cabinet."
    },
    large: {
      label: "Large bidirectional EV",
      usableKwh: 55,
      metaphor: "If plugged in, your EV behaves like a second battery rack for storm survival and smart load shifting."
    }
  }
};

const presets = {
  cabin: {
    label: "Off-Grid Cabin",
    evMiles: 10,
    showers: 1,
    kettles: 3,
    climate: "mild",
    household: "small",
    sun: "moderate",
    wind: "sheltered",
    roof: "ideal",
    v2h: "none",
    seasonMonth: 1,
    stormDays: 4
  },
  homestead: {
    label: "Suburban Homestead",
    evMiles: 35,
    showers: 2,
    kettles: 6,
    climate: "moderate",
    household: "medium",
    sun: "low",
    wind: "moderate",
    roof: "ideal",
    v2h: "none",
    seasonMonth: 1,
    stormDays: 4
  },
  power: {
    label: "Power User + EV",
    evMiles: 80,
    showers: 4,
    kettles: 10,
    climate: "heavy",
    household: "large",
    sun: "moderate",
    wind: "high",
    roof: "eastwest",
    v2h: "standard",
    seasonMonth: 1,
    stormDays: 5
  }
};

const DEFAULT_STATE = {
  evMiles: 35,
  showers: 2,
  kettles: 6,
  climate: "moderate",
  household: "medium",
  sun: "low",
  wind: "moderate",
  roof: "ideal",
  v2h: "none",
  seasonMonth: 1,
  stormDays: 4,
  currency: "USD",
  units: "metric",
  sunlightMode: false,
  preset: "homestead"
};

const state = { ...DEFAULT_STATE };
const elements = {};
let energyChart;
let lastHash = "";

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    cacheElements();
    hydrateFromHash();
    bindControls();
    syncControlsFromState();
    updateRangeProgress();
    render();
    registerServiceWorker();
  });
}

function cacheElements() {
  [
    "evMiles",
    "showers",
    "kettles",
    "seasonMonth",
    "stormDays",
    "evMilesValue",
    "showersValue",
    "kettlesValue",
    "seasonMonthValue",
    "stormDaysValue",
    "climateValue",
    "householdValue",
    "sunValue",
    "windValue",
    "roofValue",
    "v2hValue",
    "seasonToggle",
    "seasonLabel",
    "seasonPhysicsNote",
    "themeToggle",
    "shareButton",
    "printButton",
    "shareStatus",
    "pwaStatus",
    "heroDemand",
    "heroFootprint",
    "heroBalance",
    "heroBalanceBadge",
    "heroAdvice",
    "dailyDemand",
    "seasonDemandNote",
    "solarSummary",
    "solarSummarySub",
    "windSummary",
    "windSummarySub",
    "batterySummary",
    "batterySummarySub",
    "generatorSummary",
    "generatorSummarySub",
    "costSummary",
    "costSummarySub",
    "userAdviceTitle",
    "userAdvice",
    "solarSeasonYield",
    "solarCapacity",
    "panelCount",
    "solarArea",
    "solarMetaphor",
    "roofPenaltyNote",
    "windSeasonYield",
    "windCapacity",
    "rotorDiameter",
    "towerHeight",
    "windMetaphor",
    "windCutInNote",
    "windWarning",
    "batteryCapacity",
    "batteryWeight",
    "batteryDimensions",
    "batteryMetaphor",
    "v2hMetaphor",
    "generatorCapacity",
    "fuelType",
    "generatorRuntime",
    "fuelUsage",
    "generatorMetaphor",
    "footprintSummary",
    "footprintArea",
    "footprintMetaphor",
    "solarFootprintRect",
    "solarFootprintText",
    "survivalSoc",
    "generatorStart",
    "reserveIncluded",
    "socFill",
    "survivalNarrative",
    "starlinkHours",
    "laundryLoads",
    "espressoShots",
    "applianceNarrative",
    "solarCost",
    "windCost",
    "batteryCost",
    "inverterCost",
    "totalCost",
    "totalCostGbp",
    "chartSummary"
  ].forEach((id) => {
    elements[id] = document.getElementById(id);
  });
}

function bindControls() {
  ["evMiles", "showers", "kettles", "seasonMonth", "stormDays"].forEach((id) => {
    elements[id]?.addEventListener("input", (event) => {
      state[id] = Number(event.target.value);
      if (id === "seasonMonth") {
        state.preset = "custom";
      }
      updateRangeProgress();
      render();
    });
  });

  document.querySelectorAll(".selector-card").forEach((button) => {
    button.addEventListener("click", () => {
      const { group, value } = button.dataset;
      state[group] = value;
      state.preset = "custom";
      syncControlsFromState();
      render();
    });
  });

  document.querySelectorAll(".preset-chip").forEach((button) => {
    button.addEventListener("click", () => {
      applyPreset(button.dataset.preset);
      render();
    });
  });

  document.querySelectorAll("[data-currency]").forEach((button) => {
    button.addEventListener("click", () => {
      state.currency = button.dataset.currency;
      syncControlsFromState();
      render();
    });
  });

  document.querySelectorAll("[data-units]").forEach((button) => {
    button.addEventListener("click", () => {
      state.units = button.dataset.units;
      syncControlsFromState();
      render();
    });
  });

  elements.seasonToggle?.addEventListener("click", () => {
    state.seasonMonth = getSeasonMode() === "winter" ? 7 : 1;
    state.preset = "custom";
    syncControlsFromState();
    updateRangeProgress();
    render();
  });

  elements.themeToggle?.addEventListener("click", () => {
    state.sunlightMode = !state.sunlightMode;
    syncControlsFromState();
    render();
  });

  elements.shareButton?.addEventListener("click", copyShareLink);
  elements.printButton?.addEventListener("click", () => window.print());

  window.addEventListener("hashchange", () => {
    if (window.location.hash === lastHash) {
      return;
    }
    hydrateFromHash();
    syncControlsFromState();
    updateRangeProgress();
    render();
  });
}

function hydrateFromHash() {
  if (typeof window === "undefined" || !window.location.hash) {
    return;
  }

  const params = new URLSearchParams(window.location.hash.slice(1));
  const numericKeys = ["evMiles", "showers", "kettles", "seasonMonth", "stormDays"];
  const aliases = {
    ev: "evMiles",
    sh: "showers",
    kt: "kettles",
    month: "seasonMonth",
    storm: "stormDays",
    cur: "currency",
    unit: "units",
    theme: "sunlightMode"
  };

  params.forEach((value, rawKey) => {
    const key = aliases[rawKey] || rawKey;
    if (!(key in state)) {
      return;
    }

    if (numericKeys.includes(key)) {
      state[key] = clamp(Number(value), getMin(key), getMax(key));
      return;
    }

    if (key === "sunlightMode") {
      state.sunlightMode = value === "sun";
      return;
    }

    state[key] = value;
  });

  state.preset = params.get("preset") || inferPreset();
}

function updateHash() {
  if (typeof window === "undefined" || !window.history?.replaceState) {
    return;
  }

  const params = new URLSearchParams({
    ev: String(state.evMiles),
    sh: String(state.showers),
    kt: String(state.kettles),
    climate: state.climate,
    household: state.household,
    sun: state.sun,
    wind: state.wind,
    roof: state.roof,
    v2h: state.v2h,
    month: String(state.seasonMonth),
    storm: String(state.stormDays),
    cur: state.currency,
    unit: state.units,
    theme: state.sunlightMode ? "sun" : "auto",
    preset: state.preset
  });
  lastHash = `#${params.toString()}`;
  window.history.replaceState(null, "", lastHash);
}

function syncControlsFromState() {
  ["evMiles", "showers", "kettles", "seasonMonth", "stormDays"].forEach((id) => {
    if (elements[id]) {
      elements[id].value = state[id];
    }
  });

  ["climate", "household", "sun", "wind", "roof", "v2h"].forEach(updateSelectorGroup);

  document.querySelectorAll(".preset-chip").forEach((button) => {
    button.classList.toggle("active", button.dataset.preset === state.preset);
  });

  document.querySelectorAll("[data-currency]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.currency === state.currency));
  });

  document.querySelectorAll("[data-units]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.units === state.units));
  });

  elements.seasonToggle?.setAttribute("aria-checked", String(getSeasonMode() === "summer"));
  elements.themeToggle?.setAttribute("aria-pressed", String(state.sunlightMode));
  document.body.classList.toggle("sunlight-mode", state.sunlightMode);
}

function updateSelectorGroup(group) {
  document.querySelectorAll(`[data-group="${group}"]`).forEach((button) => {
    const isActive = button.dataset.value === state[group];
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function updateRangeProgress() {
  ["evMiles", "showers", "kettles", "seasonMonth", "stormDays"].forEach((id) => {
    const input = elements[id];
    if (!input) {
      return;
    }
    const min = Number(input.min);
    const max = Number(input.max);
    const value = Number(input.value);
    const percent = ((value - min) / (max - min)) * 100;
    input.style.setProperty("--progress", `${percent}%`);
  });
}

function applyPreset(presetName) {
  const preset = presets[presetName];
  if (!preset) {
    return;
  }

  Object.assign(state, preset, {
    currency: state.currency,
    units: state.units,
    sunlightMode: state.sunlightMode,
    preset: presetName
  });
  syncControlsFromState();
  updateRangeProgress();
}

function render() {
  const model = calculateSystem(state);

  renderInputs(model);
  renderOverview(model);
  renderDetails(model);
  renderChart(model);
  updateHash();
}

function calculateSystem(inputState = state) {
  const safeState = normalizeState(inputState);
  const climate = options.climate[safeState.climate];
  const household = options.household[safeState.household];
  const sun = options.sun[safeState.sun];
  const wind = options.wind[safeState.wind];
  const roof = options.roof[safeState.roof];
  const v2h = options.v2h[safeState.v2h];
  const month = MONTHS[safeState.seasonMonth];

  const evKwh = safeState.evMiles * 0.33;
  const showerKwh = safeState.showers * 2;
  const kettleKwh = safeState.kettles * 0.1;
  const hotWaterKwh = showerKwh + kettleKwh;
  const baseKwh = household.kwh;
  const winterClimateKwh = climate.winterKwh;
  const summerClimateKwh = climate.summerKwh;
  const activeClimateKwh = interpolate(winterClimateKwh, summerClimateKwh, month.progress);
  const activeCop = interpolate(climate.winterCop, climate.summerCop, month.progress);

  const winterDemand = evKwh + hotWaterKwh + winterClimateKwh + baseKwh;
  const summerDemand = evKwh + hotWaterKwh + summerClimateKwh + baseKwh;
  const activeDemand = evKwh + hotWaterKwh + activeClimateKwh + baseKwh;

  const designDemand = winterDemand;
  const designPsh = sun.psh * roof.factor;
  const requiredArrayKwp = (designDemand * SYSTEM_LOSS_FACTOR) / designPsh;
  const panels = Math.ceil((requiredArrayKwp * 1000) / PANEL_WATTS);
  const arrayKwp = (panels * PANEL_WATTS) / 1000;
  const areaM2 = panels * PANEL_AREA_M2;
  const areaFt2 = areaM2 * FT2_PER_M2;

  const seasonPsh = getSeasonPsh(sun.psh, roof.factor, month.progress);
  const solarGeneration = arrayKwp * seasonPsh * 0.82;

  const turbine = getTurbineRecommendation(designDemand, safeState.wind);
  const windCf = interpolate(wind.winterCf, wind.summerCf, month.progress);
  const windGeneration = turbine.kw * 24 * windCf;

  const batteryKwh = designDemand * 1.5;
  const reserveKwh = batteryKwh + v2h.usableKwh;
  const battery = getBatteryPhysicals(batteryKwh);

  const winterRenewableGeneration = (arrayKwp * designPsh * 0.82) + (turbine.kw * 24 * wind.winterCf);
  const generator = getGeneratorRecommendation(designDemand, winterRenewableGeneration, safeState);

  const costs = getCosts(arrayKwp, turbine.kw, batteryKwh);
  const activeRenewables = solarGeneration + windGeneration;
  const balance = activeRenewables - activeDemand;
  const survival = getSurvivalSimulation(safeState.stormDays, activeDemand, reserveKwh);
  const equivalents = getApplianceEquivalents(reserveKwh);
  const advice = getAdvice({ balance, turbine, roof, generator, safeState });

  return {
    state: safeState,
    month,
    energy: {
      evKwh,
      showerKwh,
      kettleKwh,
      hotWaterKwh,
      baseKwh,
      winterClimateKwh,
      summerClimateKwh,
      activeClimateKwh,
      activeCop,
      activeDemand,
      winterDemand,
      summerDemand,
      designDemand
    },
    solar: {
      requiredArrayKwp,
      arrayKwp,
      panels,
      areaM2,
      areaFt2,
      designPsh,
      seasonPsh,
      generation: solarGeneration,
      metaphor: getSolarMetaphor(areaM2),
      roof
    },
    wind: {
      ...turbine,
      generation: windGeneration,
      condition: wind
    },
    battery: {
      kwh: batteryKwh,
      reserveKwh,
      v2h,
      ...battery
    },
    generator,
    costs,
    survival,
    equivalents,
    advice,
    balance: {
      renewableGeneration: activeRenewables,
      kwh: balance,
      ratio: activeRenewables / activeDemand
    }
  };
}

function normalizeState(inputState) {
  const normalized = { ...DEFAULT_STATE, ...inputState };
  normalized.evMiles = clamp(Number(normalized.evMiles), 0, 120);
  normalized.showers = clamp(Number(normalized.showers), 0, 8);
  normalized.kettles = clamp(Number(normalized.kettles), 0, 20);
  normalized.seasonMonth = clamp(Math.round(Number(normalized.seasonMonth)), 1, 7);
  normalized.stormDays = clamp(Math.round(Number(normalized.stormDays)), 1, 7);
  normalized.climate = options.climate[normalized.climate] ? normalized.climate : DEFAULT_STATE.climate;
  normalized.household = options.household[normalized.household] ? normalized.household : DEFAULT_STATE.household;
  normalized.sun = options.sun[normalized.sun] ? normalized.sun : DEFAULT_STATE.sun;
  normalized.wind = options.wind[normalized.wind] ? normalized.wind : DEFAULT_STATE.wind;
  normalized.roof = options.roof[normalized.roof] ? normalized.roof : DEFAULT_STATE.roof;
  normalized.v2h = options.v2h[normalized.v2h] ? normalized.v2h : DEFAULT_STATE.v2h;
  normalized.currency = CURRENCIES[normalized.currency] ? normalized.currency : DEFAULT_STATE.currency;
  normalized.units = normalized.units === "imperial" ? "imperial" : "metric";
  normalized.sunlightMode = Boolean(normalized.sunlightMode);
  return normalized;
}

function getSeasonPsh(basePsh, roofFactor, progress) {
  return Math.min(basePsh * (1 + 0.65 * progress) * roofFactor, 7.2);
}

function getSeasonMode() {
  return Number(state.seasonMonth) >= 5 ? "summer" : "winter";
}

function getTurbineRecommendation(designDemand, windCondition) {
  if (windCondition === "sheltered") {
    return {
      kw: 0,
      rotorM: 0,
      towerM: 0,
      label: "Not recommended",
      metaphor: "Wind turbine not recommended due to low clearance.",
      warningLevel: "high"
    };
  }

  let kw;
  if (windCondition === "moderate") {
    kw = designDemand < 45 ? 3 : designDemand < 75 ? 5 : 10;
  } else {
    kw = designDemand < 35 ? 3 : designDemand < 70 ? 5 : 10;
  }

  const dimensions = {
    3: {
      rotorM: 3.5,
      towerM: 10,
      metaphor: "~3.5m rotor diameter on a 10m (33ft) tower. Height of a typical 2-story house."
    },
    5: {
      rotorM: 4.8,
      towerM: 15,
      metaphor: "~4.8m rotor diameter on a 15m (50ft) tower. Height of a 3-story building or mature oak tree."
    },
    10: {
      rotorM: 7.2,
      towerM: 18,
      metaphor: "~7.2m rotor diameter on an 18m (59ft) tower. Similar to a small farm-scale turbine above a 4-story building."
    }
  };

  return {
    kw,
    label: `${kw} kW turbine`,
    warningLevel: windCondition === "moderate" ? "medium" : "low",
    ...dimensions[kw]
  };
}

function getBatteryPhysicals(kwh) {
  if (kwh < 30) {
    return {
      weightKg: Math.round(Math.max(200, kwh * 8.4)),
      dimensions: "90 × 65 × 65 cm",
      metaphor: "Takes up the space of a small under-counter beverage fridge (~200kg)."
    };
  }

  if (kwh <= 75) {
    return {
      weightKg: Math.round(Math.max(450, kwh * 7.2)),
      dimensions: "185 × 80 × 75 cm",
      metaphor: "Takes up the space of a full-sized household refrigerator (~450kg)."
    };
  }

  const rackCount = Math.max(2, Math.ceil(kwh / 45));
  return {
    weightKg: Math.round(Math.max(800, kwh * 8.8)),
    dimensions: `200 × ${rackCount * 60} × 70 cm`,
    metaphor: "Requires a dedicated utility rack wall, similar to 2 full-height server cabinets (~800kg+)."
  };
}

function getGeneratorRecommendation(designDemand, winterRenewableGeneration, safeState) {
  const minimumKw = roundUpToHalf(Math.max(6, designDemand / 4.5));
  const fuel = minimumKw > 10 ? "Diesel" : "LPG";
  const stormDays = getWinterStormDays(safeState);
  const stormRenewableKwh = winterRenewableGeneration * 0.3;
  const stormShortfallKwh = Math.max(0, designDemand - stormRenewableKwh);
  const runtimeHours = Math.max(2, Math.ceil((stormShortfallKwh * stormDays) / (minimumKw * 0.75)));
  const litresPerHour = fuel === "Diesel" ? minimumKw * 0.31 : minimumKw * 0.48;
  const fuelLitres = Math.ceil(runtimeHours * litresPerHour);

  return {
    kw: minimumKw,
    fuel,
    runtimeHours,
    fuelLitres,
    stormDays,
    metaphor: `Sized to bulk-charge the LFP bank and cover household loads across about ${stormDays} severe winter weather days per month.`
  };
}

function getWinterStormDays(safeState) {
  const sunPenalty = { low: 9, moderate: 7, high: 5 }[safeState.sun];
  const windPenalty = { sheltered: 2, moderate: 0, high: -1 }[safeState.wind];
  return Math.min(12, Math.max(4, sunPenalty + windPenalty));
}

function getCosts(arrayKwp, windKw, batteryKwh) {
  const solarLow = arrayKwp * 1000 * 0.8;
  const solarHigh = arrayKwp * 1000 * 1.1;
  const windLow = windKw * 2200;
  const windHigh = windKw * 3000;
  const batteryLow = batteryKwh * 250;
  const batteryHigh = batteryKwh * 350;
  const inverterLow = 4500;
  const inverterHigh = 7500;

  return {
    solarLow,
    solarHigh,
    windLow,
    windHigh,
    batteryLow,
    batteryHigh,
    inverterLow,
    inverterHigh,
    totalLow: solarLow + windLow + batteryLow + inverterLow,
    totalHigh: solarHigh + windHigh + batteryHigh + inverterHigh
  };
}

function getSurvivalSimulation(stormDays, activeDemand, reserveKwh) {
  const usedKwh = stormDays * activeDemand;
  const remainingKwh = Math.max(0, reserveKwh - usedKwh);
  const endSoc = reserveKwh === 0 ? 0 : clamp((remainingKwh / reserveKwh) * 100, 0, 100);
  const triggerAfterDays = reserveKwh === 0 ? 0 : (reserveKwh * 0.8) / activeDemand;
  const startsWithinStorm = triggerAfterDays <= stormDays;
  const startDay = Math.max(1, Math.floor(triggerAfterDays) + 1);
  const startHour = Math.max(1, Math.round((triggerAfterDays % 1) * 24));

  return {
    endSoc,
    remainingKwh,
    startsWithinStorm,
    startDay,
    startHour,
    usedKwh
  };
}

function getApplianceEquivalents(reserveKwh) {
  return {
    starlinkHours: Math.floor(reserveKwh / 0.075),
    laundryLoads: Math.floor(reserveKwh / 1.2),
    espressoShots: Math.floor(reserveKwh / 0.05)
  };
}

function getAdvice({ balance, turbine, roof, generator, safeState }) {
  if (roof.penalty >= 30) {
    return {
      title: "Check shade before buying panels",
      body: "Your roof selection adds a large solar penalty. A shade survey or ground-mount option may save more money than oversizing hardware."
    };
  }

  if (safeState.wind === "sheltered") {
    return {
      title: "Prioritize solar and batteries",
      body: "Small wind is unlikely to help much on this site. Put the next design effort into solar placement, battery space, and generator integration."
    };
  }

  if (balance < 0) {
    return {
      title: "Plan for generator support",
      body: `The selected month still shows a shortfall. Make the auto-start ${generator.fuel} generator part of the core design, not an afterthought.`
    };
  }

  if (turbine.kw >= 5) {
    return {
      title: "Verify tower permissions early",
      body: "Your wind recommendation is physically visible. Confirm planning rules, setbacks, and neighbor impact before pricing the turbine."
    };
  }

  return {
    title: "Site fit looks balanced",
    body: "The renewable mix covers the selected month on paper. Next, confirm roof space, inverter location, and battery ventilation with an installer."
  };
}

function getSolarMetaphor(areaM2) {
  if (areaM2 < 30) {
    return "Equivalent to a 1-car driveway.";
  }

  if (areaM2 <= 65) {
    return "Equivalent to a standard 2-car garage roof.";
  }

  return "Requires a large barn roof or ground-mounted array (size of half a tennis court).";
}

function renderInputs(model) {
  setText("evMilesValue", state.evMiles);
  setText("showersValue", state.showers);
  setText("kettlesValue", state.kettles);
  setText("seasonMonthValue", model.month.label);
  setText("stormDaysValue", state.stormDays);

  const climate = options.climate[state.climate];
  const household = options.household[state.household];
  const sun = options.sun[state.sun];
  const wind = options.wind[state.wind];
  const roof = options.roof[state.roof];
  const v2h = options.v2h[state.v2h];

  setText("climateValue", `${climate.label} · ${oneDecimal(model.energy.activeClimateKwh)} kWh/day now`);
  setText("householdValue", `${household.label} · ${household.kwh} kWh/day`);
  setText("sunValue", `${sun.label} · ${sun.psh.toFixed(1)} base PSH`);
  setText("windValue", `${wind.label} · ${wind.summary}`);
  setText("roofValue", `${roof.label} · ${roof.penalty}% penalty`);
  setText("v2hValue", v2h.label);
  setText("seasonLabel", `${model.month.label} · ${getSeasonMode() === "summer" ? "Summer surplus check" : "Winter stress profile"}`);
  setText("seasonPhysicsNote", `Estimated heat-pump COP: ${oneDecimal(model.energy.activeCop)}; solar yield uses ${oneDecimal(model.solar.seasonPsh)} effective peak sun hours after roof penalty.`);
  setText("windWarning", wind.cutInWarning);

  setText("heroDemand", `${oneDecimal(model.energy.activeDemand)} kWh`);
  setText("heroFootprint", formatArea(model.solar.areaM2));

  const balanceText = model.balance.kwh >= 0
    ? `+${oneDecimal(model.balance.kwh)} kWh/day`
    : `${oneDecimal(model.balance.kwh)} kWh/day`;
  setText("heroBalance", balanceText);
  setText("heroBalanceBadge", model.balance.kwh >= 0 ? "Surplus" : "Backup");
  setText("heroAdvice", model.advice.body);
}

function renderOverview(model) {
  setText("dailyDemand", `${oneDecimal(model.energy.activeDemand)} kWh/day`);
  setText(
    "seasonDemandNote",
    `${model.month.label} profile; equipment sized to ${oneDecimal(model.energy.designDemand)} kWh/day winter resilience`
  );

  setText("solarSummary", `${model.solar.panels} panels · ${formatArea(model.solar.areaM2)}`);
  setText("solarSummarySub", `${formatArea(model.solar.areaM2, true)} of clear roof or ground-mount surface`);

  setText("windSummary", model.wind.kw > 0 ? `${model.wind.kw} kW` : "Not recommended");
  setText(
    "windSummarySub",
    model.wind.kw > 0
      ? `${model.wind.towerM}m tower with ${model.wind.rotorM}m rotor diameter`
      : "Sheltered sites usually perform poorly and can face clearance limits"
  );

  setText("batterySummary", `${oneDecimal(model.battery.kwh)} kWh usable`);
  setText("batterySummarySub", `${model.battery.weightKg} kg estimate; ${model.battery.dimensions}`);

  setText("generatorSummary", `${oneDecimal(model.generator.kw)} kW`);
  setText("generatorSummarySub", `${model.generator.fuel}; about ${model.generator.runtimeHours} winter hours/month`);

  setText("costSummary", `${money(model.costs.totalLow)} - ${money(model.costs.totalHigh)}`);
  setText("costSummarySub", `Hardware-only estimate in ${CURRENCIES[state.currency].label}; before labor and taxes`);
  setText("userAdviceTitle", model.advice.title);
  setText("userAdvice", model.advice.body);
}

function renderDetails(model) {
  const generationRatio = model.balance.ratio * 100;

  setText("solarSeasonYield", `${model.month.label}: ${oneDecimal(model.solar.generation)} kWh/day from ${oneDecimal(model.solar.seasonPsh)} effective peak sun hours`);
  setText("solarCapacity", `${oneDecimal(model.solar.arrayKwp)} kWp`);
  setText("panelCount", `${model.solar.panels} panels`);
  setText("solarArea", formatArea(model.solar.areaM2, true));
  setText("solarMetaphor", model.solar.metaphor);
  setText("roofPenaltyNote", model.solar.roof.metaphor);

  setText(
    "windSeasonYield",
    model.wind.kw > 0
      ? `${model.month.label}: about ${oneDecimal(model.wind.generation)} kWh/day at this exposure`
      : "No wind production is included for the sheltered-site recommendation"
  );
  setText("windCapacity", model.wind.kw > 0 ? `${model.wind.kw} kW` : "Not advised");
  setText("rotorDiameter", model.wind.kw > 0 ? `${model.wind.rotorM} m` : "N/A");
  setText("towerHeight", model.wind.kw > 0 ? `${model.wind.towerM} m` : "N/A");
  setText("windMetaphor", model.wind.metaphor);
  setText("windCutInNote", model.wind.condition.cutInWarning);

  setText("batteryCapacity", `${oneDecimal(model.battery.kwh)} kWh`);
  setText("batteryWeight", `${model.battery.weightKg} kg`);
  setText("batteryDimensions", model.battery.dimensions);
  setText("batteryMetaphor", model.battery.metaphor);
  setText("v2hMetaphor", `${model.battery.v2h.metaphor} Total emergency reserve for the simulator: ${oneDecimal(model.battery.reserveKwh)} kWh.`);

  setText("generatorCapacity", `${oneDecimal(model.generator.kw)} kW`);
  setText("fuelType", model.generator.fuel);
  setText("generatorRuntime", `${model.generator.runtimeHours} hours/month`);
  setText("fuelUsage", `${model.generator.fuelLitres} L/month`);
  setText("generatorMetaphor", model.generator.metaphor);

  renderFootprint(model);
  renderSurvival(model);
  renderEquivalents(model);

  setText("solarCost", `${money(model.costs.solarLow)} - ${money(model.costs.solarHigh)}`);
  setText("windCost", `${money(model.costs.windLow)} - ${money(model.costs.windHigh)}`);
  setText("batteryCost", `${money(model.costs.batteryLow)} - ${money(model.costs.batteryHigh)}`);
  setText("inverterCost", `${money(model.costs.inverterLow)} - ${money(model.costs.inverterHigh)}`);
  setText("totalCost", `${money(model.costs.totalLow)} - ${money(model.costs.totalHigh)}`);
  setText("totalCostGbp", `Approx. ${money(model.costs.totalLow)} - ${money(model.costs.totalHigh)} before project-specific design, labor, shipping, permitting, and taxes.`);
  setText("chartSummary", `Renewable balance is ${whole(generationRatio)}% of ${model.month.label.toLowerCase()} demand with the winter-sized system.`);
}

function renderFootprint(model) {
  const garageM2 = 30;
  const halfCourtM2 = 130;
  const scale = Math.sqrt(Math.min(model.solar.areaM2, 260) / halfCourtM2);
  const width = clamp(218 * scale, 70, 230);
  const height = clamp(152 * scale, 54, 170);
  const x = 542 - width / 2;
  const y = 126 - height / 2;

  if (elements.solarFootprintRect) {
    elements.solarFootprintRect.setAttribute("x", x);
    elements.solarFootprintRect.setAttribute("y", y);
    elements.solarFootprintRect.setAttribute("width", width);
    elements.solarFootprintRect.setAttribute("height", height);
  }

  if (elements.solarFootprintText) {
    elements.solarFootprintText.setAttribute("x", 542);
    elements.solarFootprintText.textContent = `${whole(model.solar.areaM2)} m²`;
  }

  const garageCount = model.solar.areaM2 / garageM2;
  setText("footprintSummary", `Your array is about ${oneDecimal(garageCount)} standard 2-car garage roofs.`);
  setText("footprintArea", formatArea(model.solar.areaM2, true));
  setText("footprintMetaphor", model.solar.metaphor);
}

function renderSurvival(model) {
  const survival = model.survival;
  setText("survivalSoc", `${whole(survival.endSoc)}%`);
  setText(
    "generatorStart",
    survival.startsWithinStorm ? `Day ${survival.startDay}, hour ${survival.startHour}` : "Not needed"
  );
  setText(
    "reserveIncluded",
    model.battery.v2h.usableKwh > 0 ? `Home + EV (${oneDecimal(model.battery.reserveKwh)} kWh)` : "Home battery only"
  );

  if (elements.socFill) {
    elements.socFill.style.width = `${survival.endSoc}%`;
  }

  const narrative = survival.startsWithinStorm
    ? `After ${state.stormDays} poor-weather days, the reserve would pass the 20% trigger point, so the auto-start generator protects the battery before deep discharge.`
    : `After ${state.stormDays} poor-weather days, the reserve stays above the 20% generator trigger point on paper.`;
  setText("survivalNarrative", narrative);
}

function renderEquivalents(model) {
  setText("starlinkHours", whole(model.equivalents.starlinkHours));
  setText("laundryLoads", whole(model.equivalents.laundryLoads));
  setText("espressoShots", whole(model.equivalents.espressoShots));
  setText(
    "applianceNarrative",
    `These equivalents use the combined emergency reserve (${oneDecimal(model.battery.reserveKwh)} kWh), so V2H increases the everyday safety margin when the vehicle is home and plugged in.`
  );
}

function renderChart(model) {
  const chartData = [
    model.energy.evKwh,
    model.energy.activeClimateKwh,
    model.energy.hotWaterKwh,
    model.energy.baseKwh
  ];

  const labels = ["EV driving", "Heating / cooling", "Hot water & kettles", "Base household"];

  if (typeof window === "undefined" || !window.Chart) {
    return;
  }

  if (!energyChart) {
    const ctx = document.getElementById("energyChart");
    energyChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels,
        datasets: [{
          data: chartData,
          backgroundColor: ["#6ee7f9", "#77f2a1", "#f8d36b", "#8db7ff"],
          borderColor: "rgba(7, 17, 15, 0.9)",
          borderWidth: 4,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "68%",
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              boxWidth: 12,
              boxHeight: 12,
              color: getComputedStyle(document.documentElement).getPropertyValue("--muted-strong").trim(),
              font: {
                family: "Inter",
                weight: "700"
              }
            }
          },
          tooltip: {
            callbacks: {
              label: tooltipLabel(model)
            }
          }
        }
      }
    });
    return;
  }

  energyChart.data.datasets[0].data = chartData;
  energyChart.options.plugins.tooltip.callbacks.label = tooltipLabel(model);
  energyChart.update();
}

function tooltipLabel(model) {
  return (context) => {
    const value = context.parsed;
    const percent = (value / model.energy.activeDemand) * 100;
    return `${context.label}: ${oneDecimal(value)} kWh (${whole(percent)}%)`;
  };
}

function copyShareLink() {
  updateHash();
  const url = window.location.href;
  const done = () => setText("shareStatus", "Share link copied. Your exact setup is encoded in the URL.");
  const fail = () => setText("shareStatus", "Copy failed. You can still copy the URL from the browser address bar.");

  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(url).then(done).catch(fail);
    return;
  }

  fail();
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || window.location.protocol === "file:") {
    setText("pwaStatus", "Offline support is available when served over http(s).");
    return;
  }

  navigator.serviceWorker.register("sw.js")
    .then(() => setText("pwaStatus", "Offline support is ready after this first successful load."))
    .catch(() => setText("pwaStatus", "Offline support could not be registered in this browser."));
}

function inferPreset() {
  const comparableKeys = ["evMiles", "showers", "kettles", "climate", "household", "sun", "wind", "roof", "v2h"];
  const match = Object.entries(presets).find(([, preset]) => comparableKeys.every((key) => preset[key] === state[key]));
  return match ? match[0] : "custom";
}

function getMin(key) {
  return {
    evMiles: 0,
    showers: 0,
    kettles: 0,
    seasonMonth: 1,
    stormDays: 1
  }[key] ?? 0;
}

function getMax(key) {
  return {
    evMiles: 120,
    showers: 8,
    kettles: 20,
    seasonMonth: 7,
    stormDays: 7
  }[key] ?? Number.MAX_SAFE_INTEGER;
}

function interpolate(start, end, progress) {
  return start + (end - start) * progress;
}

function clamp(value, min, max) {
  if (Number.isNaN(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, value));
}

function roundUpToHalf(value) {
  return Math.ceil(value * 2) / 2;
}

function oneDecimal(value) {
  return Number(value).toLocaleString(undefined, {
    maximumFractionDigits: 1,
    minimumFractionDigits: value < 10 && value % 1 !== 0 ? 1 : 0
  });
}

function whole(value) {
  return Math.round(value).toLocaleString();
}

function money(value, currency = state.currency) {
  const config = CURRENCIES[currency] || CURRENCIES.USD;
  return `${config.symbol}${Math.round(value * config.rate).toLocaleString()}`;
}

function formatArea(areaM2, includeAlt = false) {
  const metric = `${whole(areaM2)} m²`;
  const imperial = `${whole(areaM2 * FT2_PER_M2)} ft²`;
  if (includeAlt) {
    return state.units === "metric" ? `${metric} / ${imperial}` : `${imperial} / ${metric}`;
  }
  return state.units === "metric" ? metric : imperial;
}

function setText(id, value) {
  if (elements[id]) {
    elements[id].textContent = value;
  }
}

if (typeof module !== "undefined") {
  module.exports = {
    CURRENCIES,
    DEFAULT_STATE,
    MONTHS,
    options,
    presets,
    calculateSystem,
    getSeasonPsh,
    getTurbineRecommendation,
    getSurvivalSimulation,
    normalizeState
  };
}
