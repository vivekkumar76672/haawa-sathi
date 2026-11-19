// backend/services/impact-engine.js
// Scientific calculations for particulate inhalation dosage and Berkeley Earth cigarette equivalence

/**
 * Calculates direct health dosage saved and community impact metrics
 * based on user profile and routine adjustments.
 */
function calculateImpact(data) {
  const {
    cityAqi = 418,
    pm25Outdoor = 362.4, // µg/m³
    indoorReductionPercent = 75, // e.g. using DIY or HEPA purifier + sealed room
    n95Used = true, // 95% filtration efficiency for particulate matter
    commuteMode = "two_wheeler", // "two_wheeler", "metro", "carpool", "walk"
    avoidedPeakHours = true,
    familyProfile = { kids: 1, elderly: 1, adults: 2, asthmatic: true }
  } = data;

  // 1. Berkeley Earth Cigarette Equivalence Benchmark:
  // 1 cigarette ≈ 22 µg/m³ of PM2.5 in a 24-hour breathing volume (standard adult breathing ~15 m³/day)
  const outdoorCigaretteEquiv24hr = (pm25Outdoor / 22.0);

  // 2. Baseline Inhalation vs Protected Inhalation (in Micrograms of PM2.5):
  // Normal resting inhalation rate: ~0.5 m³/hour.
  // Active/traffic commute inhalation rate: ~1.2 m³/hour due to elevated respiratory effort.
  const hoursIndoor = 18;
  const hoursCommute = 2;
  const hoursOutdoorErrands = 4;

  // Outdoor baseline (unprotected)
  const baselineIndoorExposure = hoursIndoor * 0.5 * (pm25Outdoor * 0.8); // leaky home has ~80% of outdoor PM2.5
  const baselineCommuteExposure = hoursCommute * 1.4 * (pm25Outdoor * 1.25); // on-road PM2.5 is ~25% higher due to tailpipes
  const baselineErrandsExposure = hoursOutdoorErrands * 0.8 * pm25Outdoor;
  const totalBaselineIntake = baselineIndoorExposure + baselineCommuteExposure + baselineErrandsExposure; // in µg

  // Protected with Haawa Saathi recommendations:
  // IAQ Hack: sealed room + DIY/HEPA purifier drops indoor PM2.5 by indoorReductionPercent (e.g. 75%)
  const protectedIndoorPM25 = pm25Outdoor * (1 - (indoorReductionPercent / 100));
  const protectedIndoorExposure = hoursIndoor * 0.5 * protectedIndoorPM25;

  // Commute optimization:
  let commuteFilterFactor = 1.0;
  if (n95Used) commuteFilterFactor *= 0.15; // well-fitted N95 blocks >85-95% PM2.5
  if (commuteMode === "metro") commuteFilterFactor *= 0.5; // air-conditioned/filtered train cars
  if (avoidedPeakHours) commuteFilterFactor *= 0.75; // avoids ground-level toxic peak

  const protectedCommuteExposure = hoursCommute * (commuteMode === "metro" ? 0.7 : 1.2) * (pm25Outdoor * commuteFilterFactor);

  // Outdoor chores shifted to midday optimal inversion window (PM2.5 typically 35% lower)
  const middayOutdoorPM25 = pm25Outdoor * 0.65;
  const protectedErrandsExposure = hoursOutdoorErrands * 0.6 * (n95Used ? middayOutdoorPM25 * 0.2 : middayOutdoorPM25);

  const totalProtectedIntake = protectedIndoorExposure + protectedCommuteExposure + protectedErrandsExposure;
  const pm25MicrogramsAvoided = Math.max(0, totalBaselineIntake - totalProtectedIntake);

  // Cigarettes equivalent avoided today per adult:
  // Total baseline intake / (22 µg/m³ * 15 m³) vs protected intake
  const baselineCigarettes = (totalBaselineIntake / (22 * 15));
  const protectedCigarettes = (totalProtectedIntake / (22 * 15));
  const cigarettesAvoided = Math.max(0, (baselineCigarettes - protectedCigarettes));

  // Cumulative family protection (children breathe 50% more air per kg of body mass, lungs developing)
  const familyTotalMultiplier = (familyProfile.adults || 2) * 1.0 + (familyProfile.kids || 0) * 1.3 + (familyProfile.elderly || 0) * 1.1;
  const familyMicrogramsSaved = Math.round(pm25MicrogramsAvoided * familyTotalMultiplier);
  const familyCigarettesAvoided = (cigarettesAvoided * familyTotalMultiplier).toFixed(1);

  // Community & Carbon / Emission savings:
  // Shifting 1 two-wheeler or car trip to metro/carpooling saves ~0.42 kg CO2 and ~18g of direct PM2.5 + NOx tailpipe emissions.
  const communityMetrics = {
    co2KgSavedPerWeek: (commuteMode === "metro" || commuteMode === "carpool") ? 18.5 : 4.2,
    tailpipeParticulateSavedGrams: (commuteMode === "metro" ? 420 : 95),
    treesEquivalentBenefit: (commuteMode === "metro" ? 1.2 : 0.3)
  };

  return {
    rawMetrics: {
      pm25Outdoor,
      totalBaselineIntakeMicrograms: Math.round(totalBaselineIntake),
      totalProtectedIntakeMicrograms: Math.round(totalProtectedIntake),
      pm25MicrogramsAvoided: Math.round(pm25MicrogramsAvoided),
      outdoorCigaretteEquiv24hr: outdoorCigaretteEquiv24hr.toFixed(1),
      cigarettesAvoidedIndividual: cigarettesAvoided.toFixed(1),
      familyCigarettesAvoided,
      familyMicrogramsSaved
    },
    relatableExplanation: {
      headline: `Today, Haawa Saathi helped your household avoid inhaling ${familyMicrogramsSaved.toLocaleString()} µg of toxic particulate matter.`,
      cigaretteEquivalence: `That is equivalent to sparing your family the passive smoke of ${familyCigarettesAvoided} cigarettes today alone.`,
      alveoliProtection: `By sealing your main bedroom and shifting school/errand commutes away from the 7-9 AM morning inversion trap, you reduced deep alveolar lung deposition by ${Math.round((pm25MicrogramsAvoided / totalBaselineIntake) * 100)}%.`
    },
    communityImpact: communityMetrics
  };
}

module.exports = { calculateImpact };
