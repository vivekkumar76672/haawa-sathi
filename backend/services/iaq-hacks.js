// backend/services/iaq-hacks.js
// Curated, evidence-backed indoor air quality (IAQ) hacks and sustainable alternatives

const IAQ_HACKS = [
  {
    id: "diy_purifier",
    category: "DIY & Budget Protection",
    title: "DIY Corsi-Rosenthal Box Fan Purifier",
    hindiTitle: "कम लागत वाला DIY बॉक्स-फैन एयर प्यूरीफायर",
    badge: "Saves ₹8,000 - ₹15,000 ($100-$180)",
    summary: "Build a high-CADR air cleaner using a standard household fan and a MERV 13 / HEPA pleated filter.",
    equipmentNeeded: [
      "1x 16-inch or 20-inch box fan (₹1,000 - ₹1,400 / $18)",
      "1x or 2x MERV 13 or H11/H13 pleated air filter (₹800 - ₹1,200 / $12)",
      "1x Roll of duct tape or packing tape (₹80 / $1)",
      "Scrap cardboard for the shroud ring"
    ],
    scienceExplanation: "Commercial purifiers cost ₹10,000+ primarily for fancy plastic shells and WiFi apps. Clean Air Delivery Rate (CADR) is simply Fan Airflow (CFM) × Filter Efficiency (%). A box fan with a MERV 13 filter moves 250-300 CFM of air, filtering out 85%+ of PM2.5 on each pass at a fraction of the cost.",
    steps: [
      "Place the filter flat against the suction (rear) side of the fan. Ensure the airflow arrow on the filter points in the direction of the airflow (towards the fan).",
      "Tape all 4 edges tightly with duct tape to prevent dirty air bypass.",
      "Cut a circular cardboard ring ('shroud') matching the fan blade radius and tape it to the front face. This eliminates blade-tip vortex backflow, boosting CADR by 30% and reducing noise.",
      "Turn fan on Speed 2. Your room's PM2.5 will drop by 70-80% within 40 minutes."
    ],
    costComparison: {
      commercialHEPA: "₹9,000 - ₹18,000",
      diyBuild: "₹1,800 - ₹2,400",
      cadrOutput: "Equivalent to 280 m³/hr"
    }
  },
  {
    id: "ventilation_timing",
    category: "Smart Aeration & CO2 Flushing",
    title: "The Inversion-Aligned 'Flush & Seal' Protocol",
    hindiTitle: "विंटर इन्वर्जन के अनुसार 'फ्लश और सील' वेंटिलेशन",
    badge: "Prevents Toxic CO2 Lethargy",
    summary: "How to flush indoor CO2 and stale air without flooding your living space with toxic smog.",
    equipmentNeeded: ["Mobile phone timer or clock", "Exhaust fan (optional)"],
    scienceExplanation: "Sealing a bedroom with 3 people overnight causes CO2 to climb above 2,500 ppm, causing morning brain fog, headaches, and grogginess. However, opening windows at 7:00 AM brings in peak hazardous PM2.5. The scientific solution is the 'Midday Solar Flush'.",
    steps: [
      "Keep all exterior windows and balconies firmly closed between 6:00 PM and 11:30 AM.",
      "Between 12:30 PM and 02:30 PM (when sunlight lifts the planetary inversion layer and wind speeds increase), open windows on opposite sides of the apartment.",
      "Run your ceiling fan on high for exactly 20 minutes to achieve 2-3 full room air changes.",
      "Firmly re-seal windows at 03:00 PM before ambient surface temperatures drop and smog traps close.",
      "Turn your air cleaner on high for 30 minutes after sealing to scrub any residual dust."
    ],
    costComparison: {
      commercialHEPA: "Free",
      diyBuild: "0 Cost",
      cadrOutput: "Drops indoor CO2 from 2,400 ppm to 750 ppm"
    }
  },
  {
    id: "damp_dusting",
    category: "Zero-Cost Cleaning Habits",
    title: "Damp Microfiber Mop vs Dry Broom Rule",
    hindiTitle: "सूखे झाड़ू की जगह गीला पोछा तकनीक",
    badge: "Stops 90% Particulate Resuspension",
    summary: "Dry brooms aerosolize settled toxic heavy metals and soot right back into your breathing zone.",
    equipmentNeeded: ["Microfiber cloth or mop", "Bucket of water with mild soap"],
    scienceExplanation: "When toxic outdoor soot settles onto floors, dry sweeping re-aerosolizes coarse PM10 and fine PM2.5 into breathing height (1 to 1.5 meters). Microfiber contains split microscopic poly-fibers with static attraction that trap particles in liquid without air suspension.",
    steps: [
      "Strictly ban dry straw or plastic brooms inside closed rooms during high-AQI days.",
      "Always use a damp (wrung-out) microfiber cloth or flat mop.",
      "Wipe window sills, door frames, and bed headboards first, moving top-to-bottom.",
      "Rinse mop head in a bucket between rooms so particulate matter is carried away down the drain rather than spread around."
    ],
    costComparison: {
      commercialHEPA: "₹150 (Microfiber)",
      diyBuild: "₹0 using old cotton rags",
      cadrOutput: "Prevents ~400 µg/m³ indoor dust spikes"
    }
  },
  {
    id: "kitchen_shield",
    category: "Cooking & Combustion Safety",
    title: "The Tadka / Searing Particulate Shield",
    hindiTitle: "रसोई के धुएं और तड़के से बचाव",
    badge: "Cuts Indoor Cooking Spikes by 85%",
    summary: "Indian, Asian, and high-heat searing can spike indoor PM2.5 over 1,000 µg/m³ inside closed winter homes.",
    equipmentNeeded: ["Kitchen exhaust fan or range hood", "Pan lids", "Induction cooktop (optional)"],
    scienceExplanation: "Heating cooking oils (mustard, sunflower, ghee) to smoke points releases acrolein, polycyclic aromatic hydrocarbons (PAHs), and ultra-fine carbon aerosols. In winter, with windows closed, this toxic smoke permeates bedrooms.",
    steps: [
      "Always start the kitchen exhaust fan 2 minutes BEFORE heating oil, not after smoke appears.",
      "Close doors leading from the kitchen into bedrooms and living spaces during cooking.",
      "Always use a tight-fitting splatter screen or lid when frying or adding spices to hot oil.",
      "Whenever possible, switch from open flame LPG to an induction cooktop, which eliminates carbon monoxide and NO2 combustion gas."
    ],
    costComparison: {
      commercialHEPA: "Free habit change",
      diyBuild: "₹0",
      cadrOutput: "Eliminates 1,200 µg/m³ kitchen surge"
    }
  },
  {
    id: "clean_heating",
    category: "Heating Alternatives",
    title: "Safe Winter Warmth: Radiators & Heat Blankets",
    hindiTitle: "सर्दियों में सुरक्षित गर्माहट: हीटर और कंबल विकल्प",
    badge: "Zero Indoor Fire Hazard & Zero Smoke",
    summary: "Eliminate open coil heaters, unvented biomass, and coal angithis that release lethal carbon monoxide.",
    equipmentNeeded: ["Oil-filled radiator (OFR)", "Electric heated under-blanket", "Hot water bottles"],
    scienceExplanation: "Glowing wire coil heaters burn settled dust and desiccate the air to <25% humidity, drying out bronchial cilia and making lungs twice as susceptible to PM2.5 infection. Open coal/wood angithis in sealed rooms cause tragic carbon monoxide asphyxiation every winter.",
    steps: [
      "Never use coal, wood, or charcoal inside any enclosed room, even for a few minutes.",
      "Replace glowing element heaters with Oil-Filled Radiators (OFR) or Mica panel heaters. They warm air gently without scorching dust or depleting oxygen.",
      "Use electric heated under-blankets (consume only 40-60W of power vs 2000W room heaters) for ultra-efficient, targeted warmth while sleeping.",
      "Use classic rubber hot water bottles under bed quilts for zero-power, soothing warmth."
    ],
    costComparison: {
      commercialHEPA: "Saves 70% electricity bill",
      diyBuild: "Safe & Zero Emissions",
      cadrOutput: "0 Carbon Monoxide & 0 Dust Scorching"
    }
  },
  {
    id: "plants_reality_check",
    category: "Science Fact Check",
    title: "The Houseplants vs HEPA Reality Check",
    hindiTitle: "घर के पौधे बनाम एयर प्यूरीफायर: वैज्ञानिक सच",
    badge: "Debunking Clean Air Myths",
    summary: "Why relying on Snake Plants or Areca Palms will not protect your family from severe winter PM2.5.",
    equipmentNeeded: ["Scientific literacy", "True HEPA filtration"],
    scienceExplanation: "The famous 1989 NASA clean air study evaluated plants in tiny, airtight 1-cubic-meter sealed chambers against volatile organic gases (VOCs) over 24 hours. In a real real-world bedroom with air leaks, you would need between 600 and 1,000 indoor plants to equal the CADR of ONE single basic HEPA or box-fan purifier! Plants do not filter solid particulate PM2.5.",
    steps: [
      "Keep plants for aesthetics and humidity, but never depend on them as air purifiers during severe smog.",
      "Avoid over-watering indoor potted plants in winter; damp potting soil in sealed rooms breeds mold spores and Aspergillus, further inflaming asthmatic airways.",
      "Pair indoor greenery with active mechanical filtration (DIY box-fan or True HEPA) for real particulate capture."
    ],
    costComparison: {
      commercialHEPA: "Science-based clarity",
      diyBuild: "Prioritizes proven solutions",
      cadrOutput: "Prevents false sense of security"
    }
  }
];

module.exports = { IAQ_HACKS };
