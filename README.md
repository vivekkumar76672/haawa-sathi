# Haawa Saathi (हवा साथी) 🌬️
### GenAI-Powered Smog Defense, Routine Planner & Clean Air Companion

**Haawa Saathi** is an intelligent assistant designed to help families, commuters, and communities navigate severe winter smog and urban air pollution. Grounded in atmospheric physics and epidemiological models, it transforms abstract AQI numbers into actionable, low-emission daily routines, low-cost indoor air quality (IAQ) hacks, and transparent health dosage metrics.

---

## 🌟 Key Features

1. **Atmospheric Inversion Grounding**:
   - Real-time AQI, PM2.5, PM10, and $NO_2$ pollutant breakdown.
   - Ground-level boundary inversion layer tracking (180m trap vs midday solar lift).
   - Real-time **Optimal Safe Air Window** (e.g. 12:30 PM - 03:30 PM) for safe ventilation and outdoor errands.

2. **Personalized Low-Emission Routine Planner**:
   - Adapts to household vulnerability profiles (toddlers, elderly, asthmatics).
   - Commute mode optimization: shifts high-exposure two-wheeler routes, flags AC recirculation modes, and reduces deep lung particulate deposition.
   - Low-emission daily tips (anti-idling, avoiding coil space heaters, solar drying).

3. **IAQ Hacks & DIY Purifier Hub**:
   - **Interactive DIY Box-Fan CADR Calculator**: Compare Corsi-Rosenthal builds (~₹2,100 / $25) with commercial ₹15,000+ HEPA units.
   - **The "Flush & Seal" Ventilation Timing**: Purge CO2 during solar inversion lift without flooding rooms with PM2.5.
   - **Wet Mopping vs Dry Sweeping**: Stop re-suspending settled toxic heavy metals.
   - **Kitchen Shield**: Extract cooking oil particulates before they enter sleeping areas.
   - **Plant Reality Check**: Debunking the 1,000-plant myth and focusing on proven mechanical filtration.

4. **Multimodal Vision Room & Filter Auditor**:
   - Inspects air purifier filter saturation (clean white vs soot-cake black).
   - Identifies sliding window draft leaks and air changes per hour (ACH).
   - Detects airflow bottlenecks (e.g. purifiers jammed against walls).
   - Supports live user photo uploads or interactive preset scenarios.

5. **Direct Health & Community Impact Calculator**:
   - Berkeley Earth Cigarette Equivalence Model ($22\ \mu g/m^3\ \text{PM}_{2.5} \approx 1\text{ cigarette/day}$).
   - Micrograms of toxic PM2.5 kept out of alveolar lung tissue.
   - Community emission reductions (tailpipe particulate and $CO_2$ saved via carpooling and Metro rail).

6. **Bilingual AI Voice Assistant**:
   - Context-aware conversational guidance in **English** and **Hindi (हिंदी)**.
   - Real-time speech narration using the Web Speech API.
   - Quick guidance for pediatric safety, elderly breathlessness, and anti-biomass burning alternatives.

---

## 🚀 Getting Started

The project is zero-dependency (uses standard Node.js built-ins) so it runs instantly without downloading bulky node_modules:

```bash
cd "C:\Users\vivek\.gemini\antigravity\scratch\haawa-saathi"
node server.js
```

Then open your browser at:
👉 **`http://localhost:3000`**

---

## 📁 Project Structure

```text
haawa-saathi/
├── backend/
│   ├── data/
│   │   └── aqi-data.js             # Grounded meteorological smog datasets
│   └── services/
│       ├── routine-generator.js    # Personalized schedule and risk engine
│       ├── iaq-hacks.js            # Curated IAQ and low-emission hacks
│       ├── vision-auditor.js       # Multimodal visual filter/room inspector
│       ├── impact-engine.js        # Dosage math & cigarette equivalence
│       └── ai-assistant.js         # Contextual bilingual AI engine
├── public/
│   ├── index.html                  # Responsive modern web UI
│   ├── styles.css                  # High-contrast clean air vs smog theme
│   └── app.js                      # Reactive frontend, SVG/Canvas charts & audio
├── server.js                       # Lightweight HTTP REST API server
├── package.json
└── README.md
```
