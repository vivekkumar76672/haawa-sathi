// backend/services/routine-generator.js
// Generates personalized, low-emission daily routines optimized against smog inversion cycles

function generateRoutine(options) {
  const {
    city = "delhi",
    familyMembers = ["kids", "elderly", "adults"],
    hasAsthma = true,
    commuteMode = "two_wheeler",
    homeType = "apartment"
  } = options;

  const hasKids = familyMembers.includes("kids");
  const hasElderly = familyMembers.includes("elderly");

  const timeline = [
    {
      time: "06:00 - 07:30 AM",
      period: "Early Morning Inversion Trap",
      aqiRange: "410 - 450 (Hazardous)",
      riskLevel: "CRITICAL",
      tagColor: "red",
      activity: "Wake up & Morning Routine",
      recommendations: [
        "KEEP WINDOWS & BALCONY DOORS FULLY SEALED. Cold boundary layer traps toxic PM2.5 right at ground level.",
        hasAsthma ? "⚠️ High Risk: Keep prescribed bronchodilator / inhaler accessible; perform saline gargle and warm steam." : "Perform warm saline steam inhalation to clear upper airway passages.",
        "Strictly avoid morning balcony strolls or outdoor jogging — deep breathing during peak inversion increases alveolar deposition by 300%."
      ],
      lowEmissionTip: "Avoid using electric coil space heaters that scorch settled indoor dust. Use oil-filled radiators or wear thermal base layers."
    },
    {
      time: "07:30 - 09:30 AM",
      period: "Morning School Run & Office Commute",
      aqiRange: "390 - 430 (Severe)",
      riskLevel: "HIGH",
      tagColor: "orange",
      activity: hasKids ? "School Bus / Drop & Work Commute" : "Work Commute",
      recommendations: [
        commuteMode === "two_wheeler"
          ? "🚨 CRITICAL: Two-wheeler riders face 40% higher toxic dosage due to direct exhaust plumes. Wear an ear-loop/head-strap certified N95 or N99 mask with airtight nose clip. Consider switching to Metro rail or pooled AC transit."
          : "In private cars/cabs, keep AC strictly on INTERNAL RECIRCULATION mode (never fresh air intake on congested arterial roads).",
        hasKids ? "Children's lungs have smaller airways: Ensure children wear pediatric N95 masks while waiting at bus stops. Urge schools to suspend outdoor morning assemblies." : "Avoid walking along congested intersections where diesel idling is concentrated."
      ],
      lowEmissionTip: "Turn off vehicle engine at red lights exceeding 20 seconds. Idling wastes 1.5L of fuel/hour and emits dense ultra-fine soot."
    },
    {
      time: "10:00 AM - 12:00 PM",
      period: "Mid-Morning Transition",
      aqiRange: "330 - 370 (Very Poor)",
      riskLevel: "MODERATE_HIGH",
      tagColor: "amber",
      activity: "Work & Home Maintenance",
      recommendations: [
        "Dusting protocol: STRICTLY AVOID dry sweeping with brooms which re-suspends coarse PM10. Use a damp microfiber mop.",
        "In kitchen: Turn on the exhaust hood before turning on gas burners. Avoid heavy deep frying or smoking oil without continuous extraction."
      ],
      lowEmissionTip: "Switch off standby appliances and delay heavy washing machine cycles to balance grid power demand."
    },
    {
      time: "12:30 PM - 03:00 PM",
      period: "Optimal Inversion Breakout Window",
      aqiRange: "270 - 295 (Lowest Daily Peak)",
      riskLevel: "OPTIMAL_SAFE_WINDOW",
      tagColor: "emerald",
      activity: "Ventilation, Essential Errands & Walking",
      recommendations: [
        "✅ BEST VENTILATION WINDOW: Solar heating has elevated the planetary boundary layer to ~600m. Open opposite-facing windows for 20-30 minutes to purge indoor CO2 accumulation and stale bio-effluents.",
        "If you must step out for groceries, bank visits, or essential outdoor errands, DO IT NOW during this window.",
        hasElderly ? "Elderly family members can take a gentle sunbath in a protected courtyard or balcony during these warm hours." : "Ideal window for a brisk outdoor walk with a well-fitted mask."
      ],
      lowEmissionTip: "Run rooftop solar equipment or sun-dry laundry instead of electric tumble dryers."
    },
    {
      time: "03:30 - 06:00 PM",
      period: "Late Afternoon Preparation",
      aqiRange: "310 - 360 (Very Poor)",
      riskLevel: "MODERATE",
      tagColor: "amber",
      activity: "School Return & Home Sealing",
      recommendations: [
        "SEAL WINDOWS AGAIN: As the sun sets, surface temperatures plummet and inversion capping begins to reform.",
        "Turn on bedroom DIY/HEPA air cleaners on medium-high speed to scrub indoor air before evening bedtime.",
        "Hydrate: Drink warm tulsi/ginger water or jaggery tea to soothe particulate-irritated pharyngeal lining."
      ],
      lowEmissionTip: "Encourage children to play indoor board games or read rather than high-exertion evening outdoor park games."
    },
    {
      time: "06:30 - 09:30 PM",
      period: "Evening Peak Traffic & Inversion Collapse",
      aqiRange: "400 - 440 (Hazardous)",
      riskLevel: "HIGH",
      tagColor: "red",
      activity: "Evening Return Commute & Dinner",
      recommendations: [
        "Evening rush hour coincides with nocturnal boundary layer collapse. Do not roll down windows in traffic.",
        "Cooking: Ensure doors to bedrooms are closed while preparing dinner to prevent indoor particulate migration."
      ],
      lowEmissionTip: "Opt for batch pressure-cooking or induction cooktops to eliminate indoor combustion byproducts."
    },
    {
      time: "09:30 - 11:30 PM",
      period: "Night Air Protection & Sleep Sanctuary",
      aqiRange: "420 - 450 (Hazardous)",
      riskLevel: "CRITICAL_INDOOR",
      tagColor: "purple",
      activity: "Sleep Preparation",
      recommendations: [
        "Create a 'Clean Air Bedroom Sanctuary': Focus air cleaning where you spend 8 hours breathing. Place air cleaner 1 meter away from the head of the bed.",
        "Check window seals for drafts using the tissue-paper hack (if tissue flutters at window frame edges, tape it or place rolled towels along the sills).",
        "Keep bedroom door closed with air purifier running on silent/auto mode throughout the night."
      ],
      lowEmissionTip: "Never burn mosquito coils or incense (agarbatti) in closed rooms — 1 mosquito coil emits particulate matter equivalent to ~75-100 cigarettes."
    }
  ];

  return {
    city,
    headline: `Customized Winter Smog Shield Routine for ${city.toUpperCase()}`,
    riskSummary: "Hazardous morning and nocturnal ground-level inversion traps detected. Protect morning commutes and leverage the 12:30 PM - 03:00 PM solar dispersion window.",
    timeline,
    familyAdvisory: {
      hasAsthma,
      hasKids,
      hasElderly,
      specialNotices: [
        hasAsthma ? "Asthma Alert: Cold air + PM2.5 triggers bronchospasm. Wear a silk/cotton scarf over your N95 to warm inhaled air." : null,
        hasKids ? "Pediatric Shield: Keep children's outdoor physical activity limited to zero until AQI drops below 200." : null,
        hasElderly ? "Cardiac Warning: Extreme PM2.5 elevates blood viscosity and micro-clotting. Monitor BP and oxygen saturation." : null
      ].filter(Boolean)
    }
  };
}

module.exports = { generateRoutine };
