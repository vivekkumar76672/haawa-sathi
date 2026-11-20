# Haawa Saathi (हवा साथी) 🌬️
### Production-Grade GenAI Winter Smog Defense, Routine Planner & Clean Air Companion

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel%20Deployed-000000?style=for-the-badge&logo=vercel)](https://haawa-sathi-i0lsy3bdn-haawa-sathi.vercel.app/)
[![Accessibility](https://img.shields.io/badge/Accessibility-WCAG%202.1%20AAA-38bdf8?style=for-the-badge&logo=w3c)](https://www.w3.org/WAI/WCAG21/quickref/)
[![Security](https://img.shields.io/badge/Security-A%2B%20Hardened-60a5fa?style=for-the-badge&logo=auth0)](https://github.com/vivekkumar76672/haawa-sathi)
[![Tests](https://img.shields.io/badge/Tests-100%25%20Passing-34d399?style=for-the-badge&logo=githubactions)](https://github.com/vivekkumar76672/haawa-sathi)
[![Runtime](https://img.shields.io/badge/Dependencies-Zero%20Node%20Builtins-34d399?style=for-the-badge&logo=node.js)](https://nodejs.org)

**Haawa Saathi (हवा साथी)** is a resilient, accessible, and scientifically grounded GenAI application engineered to help families and urban communities navigate severe winter smog episodes (such as the Indo-Gangetic Plains, Delhi-NCR, Lahore, and Beijing). Grounded in meteorological boundary layer physics and epidemiological inhalation models, it transforms abstract AQI numbers into actionable, low-emission daily routines, low-cost indoor air quality (IAQ) hacks, and transparent health metrics.

---

## 🌟 Core Architecture & Capabilities

```mermaid
flowchart TD
    User([User / Family / Community]) --> Web[Accessible Web Interface & Voice Assistant]
    Web --> Router[Hardened API Router & Security Gateway]
    
    subgraph Data & Grounding Engine
        AQI[Real-Time AQI & Inversion Forecasts]
        Phys[Boundary Layer Inversion Physics]
        HealthRules[WHO & Pediatric Pulmonary Guidelines]
    end
    
    subgraph GenAI Tooling Suite
        Routines[Dynamic Routine & Commute Synthesizer]
        Vision[Multimodal Filter & Room Draft Auditor]
        Impact[Berkeley Earth PM2.5 Inhalation Calculator]
        VoiceLoc[Web Speech API Bilingual Synthesizer]
    end
    
    Router --> Data & Grounding Engine
    Router --> GenAI Tooling Suite
    GenAI Tooling Suite --> Web
```

### 1. Atmospheric Boundary Layer Inversion Grounding
- Real-time tracking of winter boundary layer height (e.g., 180m morning ground trap).
- Pinpoints the **Midday Solar Breakout Window** (12:30 PM - 03:30 PM), allowing families to safely ventilate indoor $\text{CO}_2$ buildup without flooding rooms with peak morning particulate soot.

### 2. Personalized Low-Emission Daily Routine Synthesizer
- Adjusts schedules based on vulnerable family groups (pediatric asthma, cardiac elderly, pregnant women).
- Commute optimization: warns two-wheeler riders of direct exhaust plumes, flags internal AC recirculation for car commuters, and recommends Metro alternatives.
- Low-emission habits (anti-idling, induction cooking, and eliminating electric coil dust-scorching).

### 3. Indoor Air Quality (IAQ) & DIY Hacks Hub
- **Interactive Corsi-Rosenthal Purifier Calculator**: Real-time CADR calculation comparing DIY box-fan builds (~₹2,100 / $25) with commercial ₹15,000+ HEPA units.
- **The "Flush & Seal" Ventilation Timing**: Scientific timing to prevent morning $\text{CO}_2$ lethargy.
- **Damp Mopping vs Dry Sweeping**: Prevents re-aerosolization of toxic settled heavy metals.
- **Kitchen Particulate Shield**: Exhaust and splatter containment protocols.

### 4. Multimodal Vision Room & Filter Auditor
- Inspects air purifier filter saturation (clean white vs soot-cake black).
- Classifies window frame draft leakage and airflow obstructions.
- Provides 4 preset benchmark scenarios + support for custom user photo uploads.

### 5. Scientific Impact & Cigarette Equivalence Calculator
- Grounded in the **Berkeley Earth Epidemiological Model**:
  $$\text{1 Cigarette/day} \approx 22\ \mu\text{g/m}^3\ \text{PM}_{2.5}\ \text{over a 24-hr breathing volume}$$
- Accurately models respiratory ventilation rates (resting $0.5\ \text{m}^3/\text{h}$ vs commute $1.2\ \text{m}^3/\text{h}$).
- Quantifies household $\text{PM}_{2.5}$ micrograms avoided and community $CO_2$ reductions.

### 6. Bilingual Voice & Conversational Assistant
- Grounded assistant delivering actionable advice in **English** and **Hindi (हिंदी)**.
- Integrated Web Speech API audio narration.
- WhatsApp / Family clipboard sharing for one-click distribution.

---

## 🔒 Security Hardening

- **Canonical Path Traversal Block**: All static requests verified via `path.resolve(PUBLIC_DIR, '.' + path)` to ensure they never escape the `public` directory.
- **Security Headers**:
  - `Content-Security-Policy`: Strictly whitelist fonts, scripts, and media.
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(self), microphone=(self), geolocation=()`
- **Rate Limiting**: Sliding window in-memory rate limiter (200 requests/min per IP) to mitigate DoS attempts.
- **Prototype Pollution Defense**: Safe JSON body parser sanitizing `__proto__`, `constructor`, and `prototype` keys.

---

## ⚡ Performance & Efficiency

- **Zero External Dependencies**: Runs entirely on standard Node.js built-ins (`http`, `fs`, `path`, `zlib`, `crypto`).
- **HTTP Compression**: Gzip and Deflate streaming for all text, CSS, JS, and JSON payloads.
- **Client Caching**: MD5 ETags generated with automatic `304 Not Modified` responses.
- **High-DPI Retina Rendering**: Responsive Canvas chart scaled by `window.devicePixelRatio`.

---

## ♿ Accessibility (WCAG 2.1 AAA)

- **Keyboard Tab Pattern**: Full arrow navigation (`ArrowRight`, `ArrowLeft`, `Home`, `End`) across tabs.
- **Skip Link**: Instant jump to `#mainContent` for screen reader and keyboard power users.
- **High Contrast Palette**: Foreground-to-background contrast ratio $> 7:1$, exceeding WCAG AAA standards.
- **Visible Focus States**: Dedicated `:focus-visible` styling (`3px solid #38bdf8`) with offset.
- **Screen Reader Support**: ARIA live regions (`aria-live="polite"`), explicit form `for=""` label associations, and descriptive `alt` tags.

---

## 🧪 Automated Test Suite

Run the full automated test suite:

```bash
npm test
```

The test runner validates:
1. Grounded meteorological inversion data and routine generation logic.
2. Berkeley Earth inhalation formulas and extreme edge cases.
3. Path traversal attacks (`/../../package.json`, encoded traversals).
4. XSS sanitization and payload limits.
5. HTML WAI-ARIA roles, landmark tags, and skip links.
6. CSS focus-visible indicators and high-contrast color tokens.
7. Compression, ETags, and security headers.

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/vivekkumar76672/haawa-sathi.git
cd haawa-sathi

# Run test suite
npm test

# Start the application
npm start
```

Open your browser at:
👉 **`http://localhost:3000`**

---

## 📄 License
MIT License. Built for clean air, community health, and transparent environmental science.
