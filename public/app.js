// public/app.js - Haawa Saathi WCAG Compliant Frontend Engine
'use strict';

const STATE = {
  city: 'delhi',
  lang: 'en',
  aqiData: null,
  voiceEnabled: false,
  lastAudioScript: null,
  routine: null,
  currentScenario: 'saturated_hepa',
  presetScenarios: {},
  currentUploadedBase64: null
};

// Utility: Debounce for efficiency
function debounce(fn, waitMs = 250) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), waitMs);
  };
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  setupAriaTabs();
  setupEventListeners();
  loadCityData('delhi');
  loadIaqHacks();
  loadVisionData();
  recalculateImpact();
});

// --- W3C WAI-ARIA Compliant Tab Navigation with Keyboard Support ---
function setupAriaTabs() {
  const tabs = Array.from(document.querySelectorAll('.nav-tab[role="tab"]'));
  const panels = Array.from(document.querySelectorAll('.tab-pane[role="tabpanel"]'));

  function activateTab(tabToActivate, setFocus = true) {
    tabs.forEach(tab => {
      const isSelected = tab === tabToActivate;
      tab.classList.toggle('active', isSelected);
      tab.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      tab.setAttribute('tabindex', isSelected ? '0' : '-1');
    });

    const targetPanelId = tabToActivate.getAttribute('aria-controls');
    panels.forEach(panel => {
      const isTarget = panel.id === targetPanelId;
      panel.classList.toggle('active', isTarget);
      if (isTarget && targetPanelId === 'panel-radar' && STATE.aqiData) {
        requestAnimationFrame(() => drawForecastChart(STATE.aqiData.hourlyForecast));
      }
    });

    if (setFocus) {
      tabToActivate.focus();
    }
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activateTab(tab, false));

    // Keyboard Arrow Navigation
    tab.addEventListener('keydown', (e) => {
      let newIndex = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        newIndex = (index + 1) % tabs.length;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        newIndex = (index - 1 + tabs.length) % tabs.length;
      } else if (e.key === 'Home') {
        newIndex = 0;
      } else if (e.key === 'End') {
        newIndex = tabs.length - 1;
      }

      if (newIndex !== null) {
        e.preventDefault();
        activateTab(tabs[newIndex], true);
      }
    });
  });
}

// --- Event Listeners ---
function setupEventListeners() {
  // City Select
  const citySelect = document.getElementById('citySelect');
  citySelect.addEventListener('change', (e) => {
    STATE.city = e.target.value;
    loadCityData(STATE.city);
  });

  // Language Select
  const langSelect = document.getElementById('langSelect');
  langSelect.addEventListener('change', (e) => {
    STATE.lang = e.target.value;
    updateLanguage();
  });

  // Audio Assistant Toggle
  const audioToggleBtn = document.getElementById('audioToggleBtn');
  audioToggleBtn.addEventListener('click', toggleAudio);

  // Profile Form Regeneration
  const regenBtn = document.getElementById('regenerateRoutineBtn');
  regenBtn.addEventListener('click', fetchPersonalizedRoutine);

  // Copy Routine for Family WhatsApp / Clipboard
  const exportBtn = document.getElementById('exportRoutineBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', copyRoutineForFamily);
  }

  // Read Routine Aloud
  const readRoutineBtn = document.getElementById('readRoutineBtn');
  readRoutineBtn.addEventListener('click', () => {
    if (!STATE.routine) return;
    const summaryText = `${STATE.routine.headline}. ${STATE.routine.riskSummary}. Best safe air window is at 12:30 PM.`;
    speakText(summaryText);
  });

  // DIY Calculator Sliders (Debounced for Efficiency)
  const fanSizeRange = document.getElementById('fanSizeRange');
  const filterTypeSelect = document.getElementById('filterTypeSelect');
  const hasShroudCheck = document.getElementById('hasShroudCheck');

  const debouncedCalc = debounce(updateDiyCalculator, 50);
  fanSizeRange.addEventListener('input', debouncedCalc);
  filterTypeSelect.addEventListener('change', debouncedCalc);
  hasShroudCheck.addEventListener('change', debouncedCalc);

  // Impact Toggles
  ['toggleN95', 'toggleAvoidPeak', 'togglePurifierRun'].forEach(id => {
    document.getElementById(id).addEventListener('change', recalculateImpact);
  });

  // Vision Audit Scenario Pills
  const scenarioPills = document.getElementById('scenarioPills');
  scenarioPills.addEventListener('click', (e) => {
    const btn = e.target.closest('.pill-btn');
    if (btn) {
      document.querySelectorAll('#scenarioPills .pill-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-checked', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-checked', 'true');
      STATE.currentScenario = btn.getAttribute('data-scenario');
      STATE.currentUploadedBase64 = null;
      renderScenarioPreview(STATE.currentScenario);
    }
  });

  // File Upload
  const uploadTrigger = document.getElementById('uploadTrigger');
  const fileUploadInput = document.getElementById('fileUploadInput');
  const uploadZone = document.getElementById('uploadZone');

  uploadTrigger.addEventListener('click', () => fileUploadInput.click());
  uploadZone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileUploadInput.click();
    }
  });

  fileUploadInput.addEventListener('change', handleImageUpload);

  // Drag and Drop
  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.style.borderColor = '#38bdf8';
  });
  uploadZone.addEventListener('dragleave', () => {
    uploadZone.style.borderColor = '';
  });
  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.style.borderColor = '';
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  });

  // Run Vision Audit Button
  document.getElementById('runVisionAuditBtn').addEventListener('click', executeVisionAudit);

  // Chat Form
  const chatForm = document.getElementById('chatForm');
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('chatInput');
    const query = input.value.trim();
    if (!query) return;
    input.value = '';
    handleUserChatMessage(query);
  });

  // Chat Quick Pills
  document.getElementById('quickPillsBar').addEventListener('click', (e) => {
    if (e.target.classList.contains('chat-pill')) {
      const prompt = e.target.getAttribute('data-prompt');
      handleUserChatMessage(prompt);
    }
  });

  // Replay Last Audio
  document.getElementById('ttsPlayLastBtn').addEventListener('click', () => {
    if (STATE.lastAudioScript) {
      const textToSpeak = STATE.lang === 'hi' ? STATE.lastAudioScript.hi : STATE.lastAudioScript.en;
      speakText(textToSpeak);
    }
  });
}

// --- City Data & Inversion Grounding ---
async function loadCityData(cityKey) {
  try {
    const res = await fetch(`/api/aqi?city=${encodeURIComponent(cityKey)}`);
    const json = await res.json();
    if (!json.success) return;

    STATE.aqiData = json.data;
    renderAqiDashboard(json.data);
    fetchPersonalizedRoutine();
    recalculateImpact();
  } catch (err) {
    console.error('[Haawa Saathi] Failed to load AQI data', err);
  }
}

function renderAqiDashboard(data) {
  const aqiNum = document.getElementById('aqiNumber');
  const aqiCategoryBadge = document.getElementById('aqiCategoryBadge');
  const aqiCircle = document.getElementById('aqiCircle');

  aqiNum.textContent = data.currentAqi;
  aqiCategoryBadge.textContent = data.category;
  aqiCircle.style.background = data.categoryColor || '#701a30';
  aqiCategoryBadge.style.background = data.categoryColor || '#701a30';
  aqiCircle.setAttribute('aria-label', `Current Air Quality Index ${data.currentAqi}, ${data.category}`);

  // Pollutants
  document.getElementById('pm25Val').textContent = `${data.pm25} µg/m³`;
  document.getElementById('pm10Val').textContent = `${data.pm10} µg/m³`;
  document.getElementById('no2Val').textContent = `${data.no2} ppb`;
  document.getElementById('windVal').textContent = `${data.windSpeed} km/h`;
  document.getElementById('humidityVal').textContent = `${data.humidity}%`;

  // Inversion Banner
  document.getElementById('inversionTag').textContent = data.inversionStatus.toUpperCase();
  document.getElementById('inversionTitle').textContent = `Boundary Inversion Height: ${data.inversionHeight} meters`;
  document.getElementById('inversionDesc').textContent = data.inversionExplanation;
  document.getElementById('safeWindowTime').textContent = data.bestVentilationWindow;

  // Sources
  const sourcesContainer = document.getElementById('sourcesList');
  sourcesContainer.innerHTML = '';
  data.primarySources.forEach(src => {
    const span = document.createElement('span');
    span.className = 'source-tag';
    span.setAttribute('role', 'listitem');
    span.textContent = src;
    sourcesContainer.appendChild(span);
  });

  // Chart (Offloaded to next animation frame)
  requestAnimationFrame(() => drawForecastChart(data.hourlyForecast));
}

// --- High-DPI Accessible Canvas Chart ---
function drawForecastChart(hourly) {
  const canvas = document.getElementById('forecastChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // High-DPI Sharpness Adjustment
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const width = rect.width;
  const height = rect.height;

  ctx.clearRect(0, 0, width, height);

  const padding = { top: 30, right: 30, bottom: 40, left: 55 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  // Grid Lines & Labels
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '600 11px Plus Jakarta Sans, sans-serif';

  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (graphHeight / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();

    const val = 500 - (i * 125);
    ctx.fillText(`${val} AQI`, 8, y + 4);
  }

  // Draw Optimal Safe Air Window Highlight (Midday: 12:30 - 15:30)
  const windowStartX = padding.left + (graphWidth / (hourly.length - 1)) * 4;
  const windowEndX = padding.left + (graphWidth / (hourly.length - 1)) * 5.5;
  ctx.fillStyle = 'rgba(16, 185, 129, 0.18)';
  ctx.fillRect(windowStartX, padding.top, (windowEndX - windowStartX), graphHeight);

  ctx.fillStyle = '#34d399';
  ctx.font = '700 11px Plus Jakarta Sans, sans-serif';
  ctx.fillText('Optimal Inversion Breakout Window (Safe Air)', windowStartX + 6, padding.top + 16);

  // Plot AQI Trend Line
  ctx.beginPath();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#f87171';

  const points = [];
  hourly.forEach((item, index) => {
    const x = padding.left + (graphWidth / (hourly.length - 1)) * index;
    const aqiRatio = (item.aqi - 0) / 500;
    const y = padding.top + graphHeight - (aqiRatio * graphHeight);
    points.push({ x, y, hour: item.hour, aqi: item.aqi });

    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Data Points & Accessible Time Axis
  ctx.font = '600 11px Plus Jakarta Sans, sans-serif';
  points.forEach(pt => {
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = '#f87171';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(pt.hour, pt.x - 14, height - 12);
  });
}

// --- Routine Planner ---
async function fetchPersonalizedRoutine() {
  const familyMembers = [];
  if (document.getElementById('hasKids').checked) familyMembers.push('kids');
  if (document.getElementById('hasElderly').checked) familyMembers.push('elderly');
  const hasAsthma = document.getElementById('hasAsthma').checked;
  const commuteMode = document.getElementById('commuteSelect').value;
  const homeType = document.getElementById('homeTypeSelect').value;

  try {
    const res = await fetch('/api/routine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        city: STATE.city,
        familyMembers,
        hasAsthma,
        commuteMode,
        homeType
      })
    });
    const json = await res.json();
    if (!json.success) return;

    STATE.routine = json.routine;
    renderRoutineTimeline(json.routine);
  } catch (err) {
    console.error('Failed to generate routine', err);
  }
}

function renderRoutineTimeline(routine) {
  document.getElementById('routineTitle').textContent = routine.headline;
  document.getElementById('routineSummary').textContent = routine.riskSummary;

  const container = document.getElementById('routineTimelineList');
  container.innerHTML = '';

  routine.timeline.forEach((item, idx) => {
    const card = document.createElement('article');
    card.className = `timeline-item tag-${item.tagColor}`;
    card.setAttribute('role', 'article');
    card.setAttribute('aria-label', `Schedule item ${idx + 1}: ${item.time}, ${item.activity}`);

    let badgeClass = 'badge-moderate';
    if (item.riskLevel.includes('CRITICAL')) badgeClass = 'badge-critical';
    else if (item.riskLevel.includes('HIGH')) badgeClass = 'badge-high';
    else if (item.riskLevel.includes('SAFE') || item.riskLevel.includes('OPTIMAL')) badgeClass = 'badge-safe';

    const recsHtml = item.recommendations.map(r => `<li>${escapeHtml(r)}</li>`).join('');

    card.innerHTML = `
      <div class="item-top">
        <span class="item-time">⏰ ${escapeHtml(item.time)}</span>
        <span class="item-badge ${badgeClass}">${escapeHtml(item.riskLevel.replace(/_/g, ' '))}</span>
      </div>
      <h3 class="item-activity">${escapeHtml(item.activity)} <span style="font-weight: normal; font-size: 13px; color: #cbd5e1;">(${escapeHtml(item.aqiRange)})</span></h3>
      <ul class="rec-list">${recsHtml}</ul>
      <div class="low-emission-tip">
        <strong>🌱 Low-Emission Hack:</strong> ${escapeHtml(item.lowEmissionTip)}
      </div>
    `;
    container.appendChild(card);
  });

  // Special Notices Box
  const noticesBox = document.getElementById('familyAdvisoryBox');
  if (routine.familyAdvisory.specialNotices.length > 0) {
    noticesBox.innerHTML = `<strong>⚠️ Specific Household Health Alerts:</strong><br>` +
      routine.familyAdvisory.specialNotices.map(n => `• ${escapeHtml(n)}`).join('<br>');
    noticesBox.style.display = 'block';
  } else {
    noticesBox.style.display = 'none';
  }
}

// Copy Routine to Clipboard for WhatsApp Family Group
function copyRoutineForFamily() {
  if (!STATE.routine) return;
  const text = `🌬️ *Haawa Saathi Smog Defense Routine (${STATE.city.toUpperCase()})*\n` +
    `• Safe Window: 12:30 PM - 3:30 PM (Midday Inversion Breakout)\n` +
    `• High Risk: Avoid outdoor exposure before 9:30 AM and after 6:30 PM\n` +
    `• Commute: Wear N95 with nose clip; set car AC to internal recirculation\n` +
    `• IAQ Hack: Damp mop floors; avoid dry brooms to prevent PM10 dust spikes!\n` +
    `Generated by Haawa Saathi Clean Air Assistant`;

  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('exportRoutineBtn');
    const orig = btn.textContent;
    btn.textContent = '✅ Copied to Clipboard!';
    setTimeout(() => { btn.textContent = orig; }, 2500);
  }).catch(() => {
    alert('Copied routine to clipboard!');
  });
}

// --- IAQ Hacks & DIY Purifier Hub ---
async function loadIaqHacks() {
  try {
    const res = await fetch('/api/iaq-hacks');
    const json = await res.json();
    if (!json.success) return;

    const grid = document.getElementById('iaqHacksGrid');
    grid.innerHTML = '';

    json.hacks.forEach(hack => {
      const card = document.createElement('article');
      card.className = 'hack-card';
      card.setAttribute('role', 'listitem');

      const stepsHtml = hack.steps.map(s => `<li>${escapeHtml(s)}</li>`).join('');

      card.innerHTML = `
        <div>
          <span class="hack-badge">${escapeHtml(hack.badge)}</span>
          <h3 class="hack-title">${escapeHtml(hack.title)}</h3>
          <p class="hack-summary">${escapeHtml(hack.summary)}</p>
          <div class="hack-science">
            <strong>🔬 The Science:</strong> ${escapeHtml(hack.scienceExplanation)}
          </div>
          <ol class="hack-steps-list">${stepsHtml}</ol>
        </div>
        <div class="low-emission-tip mt-2">
          <strong>Efficiency:</strong> ${escapeHtml(hack.costComparison.cadrOutput)} | <strong>Cost:</strong> ${escapeHtml(hack.costComparison.diyBuild)}
        </div>
      `;
      grid.appendChild(card);
    });
  } catch (err) {
    console.error('Failed to load IAQ hacks', err);
  }
}

// --- DIY Purifier Interactive Calculator ---
function updateDiyCalculator() {
  const fanStep = parseInt(document.getElementById('fanSizeRange').value, 10);
  const filterType = document.getElementById('filterTypeSelect').value;
  const hasShroud = document.getElementById('hasShroudCheck').checked;

  let baseCfm = 220;
  let fanCost = 1200;
  let fanLabel = '16-inch Table/Cabin Fan (220 CFM)';

  if (fanStep === 2) {
    baseCfm = 320;
    fanCost = 1500;
    fanLabel = '20-inch Box Fan (320 CFM)';
  } else if (fanStep === 3) {
    baseCfm = 440;
    fanCost = 2100;
    fanLabel = 'Industrial 24-inch Fan (440 CFM)';
  }

  const rangeInput = document.getElementById('fanSizeRange');
  rangeInput.setAttribute('aria-valuetext', fanLabel);
  document.getElementById('fanSizeLabel').textContent = fanLabel;

  let filterCost = filterType === 'merv13' ? 800 : 1200;
  let efficiency = filterType === 'merv13' ? 0.85 : 0.98;

  // Shroud bonus: eliminates blade vortex recirculation
  let shroudMultiplier = hasShroud ? 1.30 : 1.0;

  let calculatedCadrM3h = Math.round(baseCfm * 1.7 * efficiency * shroudMultiplier);
  let totalCost = fanCost + filterCost + 100; // 100 for duct tape

  document.getElementById('calcCadrVal').textContent = `${calculatedCadrM3h} m³/h`;
  document.getElementById('calcCostVal').textContent = `₹${totalCost.toLocaleString()} (~$${Math.round(totalCost / 85)})`;
}

// --- Multimodal Vision Room Auditor ---
async function loadVisionData() {
  try {
    const res = await fetch('/api/vision-audit');
    const json = await res.json();
    if (json.success) {
      STATE.presetScenarios = json.scenarios;
      renderScenarioPreview('saturated_hepa');
    }
  } catch (err) {
    console.error('Failed to load vision scenarios', err);
  }
}

function renderScenarioPreview(scenarioKey) {
  const scenario = STATE.presetScenarios[scenarioKey];
  if (!scenario) return;

  const img = document.getElementById('auditTargetImg');
  const caption = document.getElementById('imageCaption');

  img.src = scenario.imageUrl;
  caption.textContent = scenario.description;
  img.setAttribute('alt', `Preview photo for ${scenario.title}`);

  displayVisionReport(scenario.auditResult);
}

function handleImageUpload(e) {
  if (e.target.files && e.target.files[0]) {
    handleFileSelected(e.target.files[0]);
  }
}

function handleFileSelected(file) {
  if (!file.type.startsWith('image/')) {
    alert('Please select a valid image file (JPG or PNG).');
    return;
  }
  if (file.size > 4 * 1024 * 1024) {
    alert('Image file must be under 4MB.');
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    const base64 = event.target.result;
    const img = document.getElementById('auditTargetImg');
    const caption = document.getElementById('imageCaption');

    img.src = base64;
    caption.textContent = `Custom Upload: ${file.name}`;
    img.setAttribute('alt', `Uploaded user image: ${file.name}`);
    STATE.currentUploadedBase64 = base64;

    document.querySelectorAll('#scenarioPills .pill-btn').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-checked', 'false');
    });
    executeVisionAudit();
  };
  reader.readAsDataURL(file);
}

async function executeVisionAudit() {
  const statusBadge = document.getElementById('visionStatusBadge');
  statusBadge.className = 'status-badge amber';
  statusBadge.textContent = 'Inspecting with GenAI Vision...';

  try {
    const res = await fetch('/api/vision-audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenarioId: STATE.currentUploadedBase64 ? null : STATE.currentScenario,
        imageBase64: STATE.currentUploadedBase64 || null,
        customDescription: 'User inspection of air filter wear and room draft clearances'
      })
    });
    const json = await res.json();
    if (json.success && json.result) {
      displayVisionReport(json.result.auditResult);
    }
  } catch (err) {
    console.error('Vision audit failed', err);
    statusBadge.textContent = 'Error during inspection';
  }
}

function displayVisionReport(result) {
  const statusBadge = document.getElementById('visionStatusBadge');
  statusBadge.className = `status-badge ${result.statusColor || 'red'}`;
  statusBadge.textContent = (result.status || 'REPORT COMPLETE').replace(/_/g, ' ');

  const scoreVal = document.getElementById('visionScoreVal');
  scoreVal.textContent = result.score;
  scoreVal.style.color = result.score > 70 ? '#34d399' : (result.score > 40 ? '#fbbf24' : '#f87171');

  document.getElementById('visionCategoryTitle').textContent = result.category;
  document.getElementById('visionCadrImpact').textContent = result.cadrImpact || '';

  const findingsList = document.getElementById('visionFindingsList');
  findingsList.innerHTML = result.findings.map(f => `<li>${escapeHtml(f)}</li>`).join('');

  const recsList = document.getElementById('visionRecommendationsList');
  recsList.innerHTML = result.recommendations.map(r => `<li>${escapeHtml(r)}</li>`).join('');
}

// --- Direct Impact & Dosage Calculator ---
async function recalculateImpact() {
  const n95Used = document.getElementById('toggleN95').checked;
  const avoidedPeakHours = document.getElementById('toggleAvoidPeak').checked;
  const purifierRun = document.getElementById('togglePurifierRun').checked;
  const commuteMode = document.getElementById('commuteSelect') ? document.getElementById('commuteSelect').value : 'two_wheeler';

  const outdoorPM25 = STATE.aqiData ? STATE.aqiData.pm25 : 362.4;

  try {
    const res = await fetch('/api/impact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pm25Outdoor: outdoorPM25,
        indoorReductionPercent: purifierRun ? 75 : 10,
        n95Used,
        avoidedPeakHours,
        commuteMode,
        familyProfile: { kids: 1, elderly: 1, adults: 2, asthmatic: true }
      })
    });
    const json = await res.json();
    if (!json.success) return;

    const { rawMetrics, relatableExplanation, communityImpact } = json.impact;

    document.getElementById('impactMicrogramsSaved').textContent = `${rawMetrics.familyMicrogramsSaved.toLocaleString()} µg`;
    document.getElementById('impactCigarettesAvoided').textContent = `${rawMetrics.familyCigarettesAvoided} Cigarettes`;
    document.getElementById('impactCo2Saved').textContent = `${communityImpact.co2KgSavedPerWeek} kg`;
    document.getElementById('impactTailpipeSaved').textContent = `${communityImpact.tailpipeParticulateSavedGrams} grams`;

    document.getElementById('relatableHeadline').textContent = relatableExplanation.headline;
    document.getElementById('relatableCigarette').textContent = relatableExplanation.cigaretteEquivalence;
    document.getElementById('relatableAlveoli').textContent = relatableExplanation.alveoliProtection;
  } catch (err) {
    console.error('Impact calculation error', err);
  }
}

// --- Conversational Assistant ---
async function handleUserChatMessage(query) {
  const messagesContainer = document.getElementById('chatMessages');

  // Append user message safely
  const userMsg = document.createElement('div');
  userMsg.className = 'message-user';
  userMsg.innerHTML = `<div class="message-bubble">${escapeHtml(query)}</div>`;
  messagesContainer.appendChild(userMsg);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  // Bot loading state
  const botLoading = document.createElement('div');
  botLoading.className = 'message-bot';
  botLoading.innerHTML = `<div class="message-bubble"><em>Haawa Saathi is analyzing local smog data...</em></div>`;
  messagesContainer.appendChild(botLoading);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        city: STATE.city,
        profile: {
          hasKids: document.getElementById('hasKids').checked,
          hasElderly: document.getElementById('hasElderly').checked,
          hasAsthma: document.getElementById('hasAsthma').checked
        }
      })
    });
    const json = await res.json();
    botLoading.remove();

    if (json.success && json.result) {
      const result = json.result;
      STATE.lastAudioScript = result.audioScripts;

      const botMsg = document.createElement('div');
      botMsg.className = 'message-bot';
      botMsg.innerHTML = `<div class="message-bubble">${formatMarkdownToSafeHtml(result.response)}</div>`;
      messagesContainer.appendChild(botMsg);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;

      if (STATE.voiceEnabled) {
        const textToSpeak = STATE.lang === 'hi' ? result.audioScripts.hi : result.audioScripts.en;
        speakText(textToSpeak);
      }
    }
  } catch (err) {
    botLoading.innerHTML = `<div class="message-bubble" style="color: #fca5a5;">Connection error. Please try again.</div>`;
  }
}

// --- Audio & Web Speech API ---
function toggleAudio() {
  STATE.voiceEnabled = !STATE.voiceEnabled;
  const btn = document.getElementById('audioToggleBtn');
  const btnText = document.getElementById('voiceBtnText');

  btn.setAttribute('aria-pressed', STATE.voiceEnabled ? 'true' : 'false');

  if (STATE.voiceEnabled) {
    btn.classList.add('active');
    btnText.textContent = 'Voice On';
    speakText(STATE.lang === 'hi' ? 'हवा साथी वॉयस असिस्टेंट सक्रिय है।' : 'Haawa Saathi voice assistant is now active.');
  } else {
    btn.classList.remove('active');
    btnText.textContent = 'Voice Off';
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

function speakText(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = 1.0;

  const voices = window.speechSynthesis.getVoices();
  if (STATE.lang === 'hi') {
    const hiVoice = voices.find(v => v.lang.includes('hi') || v.lang.includes('IN'));
    if (hiVoice) utterance.voice = hiVoice;
  } else {
    const enVoice = voices.find(v => v.lang.includes('en-IN') || v.lang.includes('en-GB') || v.lang.includes('en-US'));
    if (enVoice) utterance.voice = enVoice;
  }

  window.speechSynthesis.speak(utterance);
}

// --- Security Sanitizer Helpers ---
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatMarkdownToSafeHtml(md) {
  if (typeof md !== 'string') return '';
  const escaped = escapeHtml(md);
  return escaped
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>')
    .replace(/• /g, '• ');
}

function updateLanguage() {
  const brandSub = document.getElementById('appTagline');
  document.documentElement.lang = STATE.lang;
  if (STATE.lang === 'hi') {
    brandSub.textContent = 'सर्दियों की स्मॉग, दिनचर्या और स्वच्छ हवा का स्मार्ट साथी';
  } else {
    brandSub.textContent = 'GenAI Smog Defense, Routine Planner & Clean Air Companion';
  }
}
