// backend/services/ai-assistant.js
// Bilingual, context-grounded GenAI companion for winter smog management

const { CITIES_DATA } = require('../data/aqi-data');

/**
 * Handles conversational queries with contextual grounding
 */
function handleAssistantChat(query, cityKey = "delhi", userProfile = {}) {
  const cityInfo = CITIES_DATA[cityKey] || CITIES_DATA["delhi"];
  const lowerQ = (query || "").toLowerCase();

  let responseText = "";
  let voiceHindi = "";
  let voiceEnglish = "";
  let quickPills = [];
  let severity = "normal";

  // Check intent / keywords:
  if (lowerQ.includes("child") || lowerQ.includes("kid") || lowerQ.includes("park") || lowerQ.includes("bacha") || lowerQ.includes("school")) {
    responseText = `🚨 **Critical Pediatric Advisory for ${cityInfo.name} (Current AQI: ${cityInfo.currentAqi}):**\n\n` +
      `**Strict Recommendation:** Do **NOT** send children to outdoor parks or outdoor sports practice today.\n\n` +
      `**Why this matters scientifically:**\n` +
      `1. Children inhale **50% more air per kilogram of body weight** than adults, meaning their developing alveoli receive a higher particulate dosage.\n` +
      `2. Strenuous outdoor play switches breathing from nasal (which filters coarse dust) to mouth breathing, sending toxic PM2.5 directly into lung bronchioles.\n` +
      `3. **Safe Alternative:** Arrange active indoor games (hopscotch on yoga mats, indoor dancing) inside a room with an air purifier or closed windows. If outdoor transit is unavoidable, fit a snug pediatric N95 mask (cloth masks offer less than 15% PM2.5 filtration).`;

    voiceEnglish = `Strict warning for ${cityInfo.name}. With AQI at ${cityInfo.currentAqi}, outdoor play is unsafe for children today. Children inhale 50 percent more air per kilogram of body weight. Please keep play indoors inside a sealed room.`;
    voiceHindi = `ध्यान दें! वर्तमान एक्यूआई ${cityInfo.currentAqi} पर बच्चों को बाहर पार्क में भेजना सुरक्षित नहीं है। बच्चों के फेफड़ों पर असर वयस्कों से दोगुना होता है। कृपया आज बच्चों को कमरे के अंदर ही सुरक्षित रखें।`;
    quickPills = ["Show Pediatric Mask Guide", "DIY Air Purifier Build", "When can they go out?"];
    severity = "high";
  }
  else if (lowerQ.includes("mask") || lowerQ.includes("scooter") || lowerQ.includes("bike") || lowerQ.includes("commute") || lowerQ.includes("travel")) {
    responseText = `🛵 **Commuter Shield Advisory for ${cityInfo.name}:**\n\n` +
      `On an open two-wheeler or bicycle in current conditions (PM2.5: ${cityInfo.pm25} µg/m³), you face **40% higher toxic dosage** than pedestrians due to direct vehicle exhaust.\n\n` +
      `**Protective Steps:**\n` +
      `• **Wear Certified N95 or N99 Masks:** Ensure headbands provide a tight seal. A beard or loose nose-bridge clip drops filtration from 95% down to under 30%.\n` +
      `• **Avoid Surgical or Cloth Masks:** Cloth and surgical masks do not create a face seal and allow ultra-fine PM2.5 to slip in freely around the cheeks.\n` +
      `• **Route Optimization:** Avoid major ring roads and diesel freight corridors during peak hours (${cityInfo.worstExposureWindow}). Use interior canopy roads or take Metro rail where possible.`;

    voiceEnglish = `For two-wheeler and open commutes, surgical masks are ineffective against PM2.5. Always wear a tightly sealed N95 mask with a nose clip, and avoid heavy diesel truck routes during peak morning and evening inversion hours.`;
    voiceHindi = `दोपहिया वाहन चालकों के लिए सलाह: साधारण कपड़ा या सर्जिकल मास्क प्रदूषण से नहीं बचाता। केवल सही फिटिंग वाला N95 या N99 मास्क पहनें और सुबह की भारी स्मॉग के दौरान मुख्य रिंग रोड से बचें।`;
    quickPills = ["Commuter Safety Checklist", "Switch to Metro Impact", "DIY Purifier"];
    severity = "medium";
  }
  else if (lowerQ.includes("daadi") || lowerQ.includes("dadi") || lowerQ.includes("elderly") || lowerQ.includes("asthma") || lowerQ.includes("saans") || lowerQ.includes("breath")) {
    responseText = `🩺 **Elderly & Asthmatic Care Protocol (AQI: ${cityInfo.currentAqi}):**\n\n` +
      `**Immediate Steps if Facing Breathing Difficulty:**\n` +
      `1. Move the person immediately to the most sealed interior room with an air cleaner running.\n` +
      `2. Administer their prescribed rescue inhaler / nebulizer with spacer as directed by their physician.\n` +
      `3. Encourage sitting upright in a high Fowler's position (never lying completely flat during respiratory distress).\n` +
      `4. Provide warm saline steam or warm water with honey/ginger to soothe bronchial spasms.\n` +
      `5. Monitor pulse oximeter: If SpO2 drops below 92% or if there is persistent chest tightness or wheezing, contact emergency medical care immediately.\n\n` +
      `**Prevention Hack:** Cold dry air triggers bronchial constriction. Ensure elderly family members wrap a warm scarf over their mouth and nose even inside drafty corridors.`;

    voiceEnglish = `If an elderly family member is struggling to breathe, move them to a closed room with an air purifier, assist with their prescribed inhaler, and check pulse oximeter oxygen levels immediately.`;
    voiceHindi = `यदि बुजुर्ग या दमा के मरीज को सांस लेने में कठिनाई हो रही है, तो उन्हें तुरंत एयर प्यूरीफायर वाले कमरे में बिठाएं, डॉक्टर द्वारा दी गई इनहेलर दवा दें, और ऑक्सीजन स्तर की जांच करें।`;
    quickPills = ["Emergency Contacts", "Bedside Air Purifier Setup", "Check Safe Ventilation Time"];
    severity = "critical";
  }
  else if (lowerQ.includes("diy") || lowerQ.includes("cheap") || lowerQ.includes("purifier") || lowerQ.includes("fan") || lowerQ.includes("sasta")) {
    responseText = `🛠️ **Building a Low-Cost High-CADR Air Purifier at Home:**\n\n` +
      `You can build a purifier matching the clean air delivery of a ₹12,000 brand-name unit for under **₹2,000 ($25)**:\n\n` +
      `**Materials Needed:**\n` +
      `• 1x Standard 16" or 20" Box Fan or Cabin Fan (₹1,000 - ₹1,400)\n` +
      `• 1x MERV 13 or HEPA Pleated Air Filter (₹800 - ₹1,100)\n` +
      `• 1x Roll of Duct tape + cardboard for front shroud\n\n` +
      `**Assembly in 3 Steps:**\n` +
      `1. Tape the filter directly to the suction (back) side of the fan. Ensure the airflow arrow points toward the fan blades.\n` +
      `2. Cut a circular cardboard ring covering the outer 10% of the fan blades and tape it to the front face (this shroud prevents vortex backflow and boosts efficiency by 30%).\n` +
      `3. Run on speed 2 in your bedroom. This will drop indoor PM2.5 by 75% within 45 minutes!`;

    voiceEnglish = `You can easily build a powerful air purifier using a basic box fan, a MERV 13 pleated filter, and duct tape. It works just as effectively as commercial purifiers for one fifth of the cost.`;
    voiceHindi = `आप घर पर ही एक साधारण बॉक्स फैन और MERV 13 या HEPA फिल्टर को डक्ट टेप से जोड़कर शानदार एयर प्यूरीफायर बना सकते हैं। यह महंगे प्यूरीफायर जितना ही असरदार है।`;
    quickPills = ["View Step-by-Step Photos", "Filter Replacement Guide", "CADR Calculator"];
    severity = "normal";
  }
  else if (lowerQ.includes("burn") || lowerQ.includes("trash") || lowerQ.includes("leaf") || lowerQ.includes("patte") || lowerQ.includes("kooda") || lowerQ.includes("fire")) {
    responseText = `🛑 **Community Alert: Open Biomass & Waste Burning:**\n\n` +
      `**Strict Warning:** Do **NOT** burn dry leaves, twigs, plastic, or household garbage.\n\n` +
      `**The Direct Damage:**\n` +
      `• 1 pile of burning damp leaves releases more toxic dioxins, carbon monoxide, and PM2.5 into breathing height than a heavy diesel truck idling for 6 hours.\n` +
      `• In winter ground-level inversion layers (currently at ${cityInfo.inversionHeight}m in ${cityInfo.name}), smoke cannot rise and lingers in your own neighbors' lungs.\n\n` +
      `**Sustainable Alternatives:**\n` +
      `1. **Mulching / Composting:** Pile dry garden leaves in a shaded corner with soil moisture to create rich organic humus for spring.\n` +
      `2. **Municipal Green Waste Collection:** Request local municipal composting pickups.\n` +
      `3. **Community Watch:** Report illegal waste burning to local municipal helplines (e.g. Green Delhi App / SAMEER CPCB portal).`;

    voiceEnglish = `Never burn dry leaves or garbage. Under winter inversion conditions, toxic smoke cannot rise and directly poisons the neighborhood air. Please compost dry leaves instead.`;
    voiceHindi = `सूखे पत्ते या कूड़ा बिल्कुल न जलाएं। सर्दियों की स्मॉग में धुआं ऊपर नहीं जा पाता और सीधे फेफड़ों में भरता है। पत्तों को गड्ढे में दबाकर खाद बनाएं।`;
    quickPills = ["Report Open Burning", "Leaf Composting Guide", "Community Pledges"];
    severity = "high";
  }
  else {
    // General context grounding answer
    responseText = `🌬️ **Haawa Saathi Assistant for ${cityInfo.name}:**\n\n` +
      `• **Current AQI:** ${cityInfo.currentAqi} (${cityInfo.category})\n` +
      `• **PM2.5 Level:** ${cityInfo.pm25} µg/m³ (WHO 24-hr safe limit is 15 µg/m³)\n` +
      `• **Inversion Status:** ${cityInfo.inversionStatus} (${cityInfo.inversionExplanation})\n\n` +
      `**Key Daily Action Items:**\n` +
      `1. **Ventilation Window:** Wait until **${cityInfo.bestVentilationWindow}** to air out living spaces. Keep windows tightly sealed right now.\n` +
      `2. **Commute Advice:** If traveling, strictly wear an N95 mask with a nose clip; avoid outdoor exercise until afternoon.\n` +
      `3. **Indoor Protection:** Run your air purifier in the bedroom and use a damp mop rather than a dry broom to avoid resuspending settled soot.`;

    voiceEnglish = `In ${cityInfo.name}, the current air quality is ${cityInfo.currentAqi}, categorized as ${cityInfo.category}. Keep windows sealed until midday solar heating clears the inversion layer.`;
    voiceHindi = `वर्तमान में ${cityInfo.name} का एक्यूआई ${cityInfo.currentAqi} है जो अत्यंत गंभीर श्रेणी में है। दोपहर तक खिड़कियां बंद रखें और बाहर निकलते समय N95 मास्क अवश्य लगाएं।`;
    quickPills = ["My Routine Today", "DIY Purifier Hacks", "Calculate PM2.5 Saved"];
    severity = "normal";
  }

  return {
    query,
    city: cityInfo.name,
    aqi: cityInfo.currentAqi,
    severity,
    response: responseText,
    audioScripts: {
      en: voiceEnglish,
      hi: voiceHindi
    },
    quickPills
  };
}

module.exports = { handleAssistantChat };
