const SYSTEM_LOSS_FACTOR = 1.2;
const PANEL_WATTS = 420;
const PANEL_AREA_M2 = 2;
const FT2_PER_M2 = 10.7639;
const GBP_RATE = 0.78;

const options = {
  climate: {
    mild: {
      label: "Mild",
      winterKwh: 12,
      summerKwh: 4,
      description: "Heat pump in modern well-insulated home"
    },
    moderate: {
      label: "Moderate",
      winterKwh: 25,
      summerKwh: 7,
      description: "Heat pump in standard insulated property"
    },
    heavy: {
      label: "Heavy",
      winterKwh: 42,
      summerKwh: 14,
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
      summerCf: 0.03
    },
    moderate: {
      label: "Open Countryside / Rolling Hills",
      summary: "Moderate potential",
      winterCf: 0.22,
      summerCf: 0.13
    },
    high: {
      label: "Exposed Coastal / Ridge",
      summary: "High potential",
      winterCf: 0.32,
      summerCf: 0.19
    }
  }
};

const state = {
  evMiles: 35,
  showers: 2,
  kettles: 6,
  climate: "moderate",
  household: "medium",
  sun: "low",
  wind: "moderate",
  season: "winter"
};

const elements = {};
let energyChart;

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  bindControls();
  updateRangeProgress();
  render();
});

function cacheElements() {
  [
    "evMiles",
    "showers",
    "kettles",
    "evMilesValue",
    "showersValue",
    "kettlesValue",
    "climateValue",
    "householdValue",
    "sunValue",
    "windValue",
    "seasonToggle",
    "seasonLabel",
    "heroDemand",
    "heroFootprint",
    "heroBalance",
    "heroBalanceBadge",
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
    "solarSeasonYield",
    "solarCapacity",
    "panelCount",
    "solarArea",
    "solarMetaphor",
    "windSeasonYield",
    "windCapacity",
    "rotorDiameter",
    "towerHeight",
    "windMetaphor",
    "batteryCapacity",
    "batteryWeight",
    "batteryDimensions",
    "batteryMetaphor",
    "generatorCapacity",
    "fuelType",
    "generatorRuntime",
    "fuelUsage",
    "generatorMetaphor",
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
  ["evMiles", "showers", "kettles"].forEach((id) => {
    elements[id].addEventListener("input", (event) => {
      state[id] = Number(event.target.value);
      updateRangeProgress();
      render();
    });
  });

  document.querySelectorAll(".selector-card").forEach((button) => {
    button.addEventListener("click", () => {
      const { group, value } = button.dataset;
      state[group] = value;
      updateSelectorGroup(group);
      render();
    });
  });

  elements.seasonToggle.addEventListener("click", () => {
    state.season = state.season === "winter" ? "summer" : "winter";
    elements.seasonToggle.setAttribute("aria-checked", String(state.season === "summer"));
    render();
  });
}

function updateSelectorGroup(group) {
  document.querySelectorAll(`[data-group="${group}"]`).forEach((button) => {
    const isActive = button.dataset.value === state[group];
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function updateRangeProgress() {
  ["evMiles", "showers", "kettles"].forEach((id) => {
    const input = elements[id];
    const min = Number(input.min);
    const max = Number(input.max);
    const value = Number(input.value);
    const percent = ((value - min) / (max - min)) * 100;
    input.style.setProperty("--progress", `${percent}%`);
  });
}

function render() {
  const model = calculateSystem();

  renderInputs(model);
  renderOverview(model);
  renderDetails(model);
  renderChart(model);
}

function calculateSystem() {
  const climate = options.climate[state.climate];
  const household = options.household[state.household];
  const sun = options.sun[state.sun];
  const wind = options.wind[state.wind];

  const evKwh = state.evMiles * 0.33;
  const showerKwh = state.showers * 2;
  const kettleKwh = state.kettles * 0.1;
  const hotWaterKwh = showerKwh + kettleKwh;
  const baseKwh = household.kwh;
  const winterClimateKwh = climate.winterKwh;
  const summerClimateKwh = climate.summerKwh;

  const winterDemand = evKwh + hotWaterKwh + winterClimateKwh + baseKwh;
  const summerDemand = evKwh + hotWaterKwh + summerClimateKwh + baseKwh;
  const activeClimateKwh = state.season === "winter" ? winterClimateKwh : summerClimateKwh;
  const activeDemand = state.season === "winter" ? winterDemand : summerDemand;

  // Off-grid equipment is sized against the selected site's winter peak profile.
  const designDemand = winterDemand;
  const designPsh = sun.psh;
  const requiredArrayKwp = (designDemand * SYSTEM_LOSS_FACTOR) / designPsh;
  const panels = Math.ceil((requiredArrayKwp * 1000) / PANEL_WATTS);
  const arrayKwp = (panels * PANEL_WATTS) / 1000;
  const areaM2 = panels * PANEL_AREA_M2;
  const areaFt2 = areaM2 * FT2_PER_M2;

  const seasonPsh = getSeasonPsh(sun.psh);
  const solarGeneration = arrayKwp * seasonPsh * 0.82;

  const turbine = getTurbineRecommendation(designDemand, state.wind);
  const windCf = state.season === "winter" ? wind.winterCf : wind.summerCf;
  const windGeneration = turbine.kw * 24 * windCf;

  const batteryKwh = designDemand * 1.5;
  const battery = getBatteryPhysicals(batteryKwh);

  const winterRenewableGeneration = (arrayKwp * sun.psh * 0.82) + (turbine.kw * 24 * wind.winterCf);
  const generator = getGeneratorRecommendation(designDemand, winterRenewableGeneration);

  const costs = getCosts(arrayKwp, turbine.kw, batteryKwh);
  const activeRenewables = solarGeneration + windGeneration;
  const balance = activeRenewables - activeDemand;

  return {
    energy: {
      evKwh,
      showerKwh,
      kettleKwh,
      hotWaterKwh,
      baseKwh,
      winterClimateKwh,
      summerClimateKwh,
      activeClimateKwh,
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
      metaphor: getSolarMetaphor(areaM2)
    },
    wind: {
      ...turbine,
      generation: windGeneration,
      condition: wind
    },
    battery: {
      kwh: batteryKwh,
      ...battery
    },
    generator,
    costs,
    balance: {
      renewableGeneration: activeRenewables,
      kwh: balance,
      ratio: activeRenewables / activeDemand
    }
  };
}

function getSeasonPsh(basePsh) {
  if (state.season === "winter") {
    return basePsh;
  }

  return Math.min(basePsh * 1.65, 7.2);
}

function getTurbineRecommendation(designDemand, windCondition) {
  if (windCondition === "sheltered") {
    return {
      kw: 0,
      rotorM: 0,
      towerM: 0,
      label: "Not recommended",
      metaphor: "Wind turbine not recommended due to low clearance."
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

function getGeneratorRecommendation(designDemand, winterRenewableGeneration) {
  const minimumKw = roundUpToHalf(Math.max(6, designDemand / 4.5));
  const fuel = minimumKw > 10 ? "Diesel" : "LPG";
  const stormDays = getWinterStormDays();
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

function getWinterStormDays() {
  const sunPenalty = { low: 9, moderate: 7, high: 5 }[state.sun];
  const windPenalty = { sheltered: 2, moderate: 0, high: -1 }[state.wind];
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
  elements.evMilesValue.textContent = state.evMiles;
  elements.showersValue.textContent = state.showers;
  elements.kettlesValue.textContent = state.kettles;

  const climate = options.climate[state.climate];
  const household = options.household[state.household];
  const sun = options.sun[state.sun];
  const wind = options.wind[state.wind];

  elements.climateValue.textContent = `${climate.label} · ${climate.winterKwh} kWh/day winter`;
  elements.householdValue.textContent = `${household.label} · ${household.kwh} kWh/day`;
  elements.sunValue.textContent = `${sun.label} · ${sun.psh.toFixed(1)} PSH`;
  elements.windValue.textContent = `${wind.label} · ${wind.summary}`;

  elements.seasonLabel.textContent = state.season === "winter"
    ? "January · Winter peak demand"
    : "July · Summer surplus check";

  elements.heroDemand.textContent = `${oneDecimal(model.energy.activeDemand)} kWh`;
  elements.heroFootprint.textContent = `${whole(model.solar.areaM2)} m²`;

  const balanceText = model.balance.kwh >= 0
    ? `+${oneDecimal(model.balance.kwh)} kWh/day`
    : `${oneDecimal(model.balance.kwh)} kWh/day`;
  elements.heroBalance.textContent = balanceText;
  elements.heroBalanceBadge.textContent = model.balance.kwh >= 0 ? "Surplus" : "Backup";
}

function renderOverview(model) {
  const seasonName = state.season === "winter" ? "January winter peak profile" : "July summer profile";

  elements.dailyDemand.textContent = `${oneDecimal(model.energy.activeDemand)} kWh/day`;
  elements.seasonDemandNote.textContent = `${seasonName}; equipment sized to ${oneDecimal(model.energy.designDemand)} kWh/day winter resilience`;

  elements.solarSummary.textContent = `${model.solar.panels} panels · ${whole(model.solar.areaM2)} m²`;
  elements.solarSummarySub.textContent = `${whole(model.solar.areaFt2)} ft² of clear roof or ground-mount surface`;

  elements.windSummary.textContent = model.wind.kw > 0 ? `${model.wind.kw} kW` : "Not recommended";
  elements.windSummarySub.textContent = model.wind.kw > 0
    ? `${model.wind.towerM}m tower with ${model.wind.rotorM}m rotor diameter`
    : "Sheltered sites usually perform poorly and can face clearance limits";

  elements.batterySummary.textContent = `${oneDecimal(model.battery.kwh)} kWh usable`;
  elements.batterySummarySub.textContent = `${model.battery.weightKg} kg estimate; ${model.battery.dimensions}`;

  elements.generatorSummary.textContent = `${oneDecimal(model.generator.kw)} kW`;
  elements.generatorSummarySub.textContent = `${model.generator.fuel}; about ${model.generator.runtimeHours} winter hours/month`;

  elements.costSummary.textContent = `${money(model.costs.totalLow)} - ${money(model.costs.totalHigh)}`;
  elements.costSummarySub.textContent = `Approx. ${gbp(model.costs.totalLow)} - ${gbp(model.costs.totalHigh)} before labor and taxes`;
}

function renderDetails(model) {
  const seasonMonth = state.season === "winter" ? "January" : "July";
  const generationRatio = model.balance.ratio * 100;

  elements.solarSeasonYield.textContent = `${seasonMonth}: ${oneDecimal(model.solar.generation)} kWh/day from ${oneDecimal(model.solar.seasonPsh)} peak sun hours`;
  elements.solarCapacity.textContent = `${oneDecimal(model.solar.arrayKwp)} kWp`;
  elements.panelCount.textContent = `${model.solar.panels} panels`;
  elements.solarArea.textContent = `${whole(model.solar.areaM2)} m² / ${whole(model.solar.areaFt2)} ft²`;
  elements.solarMetaphor.textContent = model.solar.metaphor;

  elements.windSeasonYield.textContent = model.wind.kw > 0
    ? `${seasonMonth}: about ${oneDecimal(model.wind.generation)} kWh/day at this exposure`
    : "No wind production is included for the sheltered-site recommendation";
  elements.windCapacity.textContent = model.wind.kw > 0 ? `${model.wind.kw} kW` : "Not advised";
  elements.rotorDiameter.textContent = model.wind.kw > 0 ? `${model.wind.rotorM} m` : "N/A";
  elements.towerHeight.textContent = model.wind.kw > 0 ? `${model.wind.towerM} m` : "N/A";
  elements.windMetaphor.textContent = model.wind.metaphor;

  elements.batteryCapacity.textContent = `${oneDecimal(model.battery.kwh)} kWh`;
  elements.batteryWeight.textContent = `${model.battery.weightKg} kg`;
  elements.batteryDimensions.textContent = model.battery.dimensions;
  elements.batteryMetaphor.textContent = model.battery.metaphor;

  elements.generatorCapacity.textContent = `${oneDecimal(model.generator.kw)} kW`;
  elements.fuelType.textContent = model.generator.fuel;
  elements.generatorRuntime.textContent = `${model.generator.runtimeHours} hours/month`;
  elements.fuelUsage.textContent = `${model.generator.fuelLitres} L/month`;
  elements.generatorMetaphor.textContent = model.generator.metaphor;

  elements.solarCost.textContent = `${money(model.costs.solarLow)} - ${money(model.costs.solarHigh)}`;
  elements.windCost.textContent = `${money(model.costs.windLow)} - ${money(model.costs.windHigh)}`;
  elements.batteryCost.textContent = `${money(model.costs.batteryLow)} - ${money(model.costs.batteryHigh)}`;
  elements.inverterCost.textContent = `${money(model.costs.inverterLow)} - ${money(model.costs.inverterHigh)}`;
  elements.totalCost.textContent = `${money(model.costs.totalLow)} - ${money(model.costs.totalHigh)}`;
  elements.totalCostGbp.textContent = `Approx. ${gbp(model.costs.totalLow)} - ${gbp(model.costs.totalHigh)} before project-specific design, labor, shipping, permitting, and taxes.`;

  elements.chartSummary.textContent = `Renewable balance is ${whole(generationRatio)}% of ${seasonMonth.toLowerCase()} demand with the winter-sized system.`;
}

function renderChart(model) {
  const chartData = [
    model.energy.evKwh,
    model.energy.activeClimateKwh,
    model.energy.hotWaterKwh,
    model.energy.baseKwh
  ];

  const labels = ["EV driving", "Heating / cooling", "Hot water & kettles", "Base household"];

  if (!window.Chart) {
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
              label: (context) => {
                const value = context.parsed;
                const percent = (value / model.energy.activeDemand) * 100;
                return `${context.label}: ${oneDecimal(value)} kWh (${whole(percent)}%)`;
              }
            }
          }
        }
      }
    });
    return;
  }

  energyChart.data.datasets[0].data = chartData;
  energyChart.options.plugins.tooltip.callbacks.label = (context) => {
    const value = context.parsed;
    const percent = (value / model.energy.activeDemand) * 100;
    return `${context.label}: ${oneDecimal(value)} kWh (${whole(percent)}%)`;
  };
  energyChart.update();
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

function money(value) {
  return `$${Math.round(value).toLocaleString()}`;
}

function gbp(value) {
  return `£${Math.round(value * GBP_RATE).toLocaleString()}`;
}
