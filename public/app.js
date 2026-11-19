// public/app.js - Haawa Saathi Frontend Application Logic

const STATE = {
  city: 'delhi',
  lang: 'en',
  aqiData: null,
  voiceEnabled: false,
  lastAudioScript: null,
  routine: null,
  currentScenario: 'saturated_hepa',
  presetScenarios: {}
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  setupEventListeners();
  loadCityData('delhi');
  loadIaqHacks();
  loadVisionData();
  recalculateImpact();
});

// --- Tab Navigation ---
function setupTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const targetId = tab.getAttribute('data-tab');
      const targetPane = document.getElementById(targetId);
      if (targetPane) {
        targetPane.classList.add('active');
        if (targetId === 'radarTab' && STATE.aqiData) {
          drawForecastChart(STATE.aqiData.hourlyForecast);
        }
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

  // Read Routine Aloud
  const readRoutineBtn = document.getElementById('readRoutineBtn');
  readRoutineBtn.addEventListener('click', () => {
    if (!STATE.routine) return;
    const summaryText = `${STATE.routine.headline}. ${STATE.routine.riskSummary}. Best safe air window is at 12:30 PM.`;
    speakText(summaryText);
  });

  // DIY Calculator Sliders
  const fanSizeRange = document.getElementById('fanSizeRange');
  const filterTypeSelect = document.getElementById('filterTypeSelect');
  const hasShroudCheck = document.getElementById('hasShroudCheck');

  const updateCalc = () => updateDiyCalculator();
  fanSizeRange.addEventListener('input', updateCalc);
  filterTypeSelect.addEventListener('change', updateCalc);
  hasShroudCheck.addEventListener('change', updateCalc);

  // Impact Toggles
  ['toggleN95', 'toggleAvoidPeak', 'togglePurifierRun'].forEach(id => {
    document.getElementById(id).addEventListener('change', recalculateImpact);
  });

  // Vision Audit Scenario Pills
  const scenarioPills = document.getElementById('scenarioPills');
  scenarioPills.addEventListener('click', (e) => {
    if (e.target.classList.contains('pill-btn')) {
      document.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      STATE.currentScenario = e.target.getAttribute('data-scenario');
      renderScenarioPreview(STATE.currentScenario);
    }
  });

  // File Upload
  const uploadTrigger = document.getElementById('uploadTrigger');
  const fileUploadInput = document.getElementById('fileUploadInput');
  uploadTrigger.addEventListener('click', () => fileUploadInput.click());
  fileUploadInput.addEventListener('change', handleImageUpload);

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
    const res = await fetch(`/api/aqi?city=${cityKey}`);
    const json = await res.json();
    if (!json.success) return;

    STATE.aqiData = json.data;
    renderAqiDashboard(json.data);
    fetchPersonalizedRoutine();
    recalculateImpact();
  } catch (err) {
    console.error('Failed to load AQI data', err);
  }
}

function renderAqiDashboard(data) {
  // AQI Circle & Category
  const aqiNum = document.getElementById('aqiNumber');
  const aqiCategoryBadge = document.getElementById('aqiCategoryBadge');
  const aqiCircle = document.getElementById('aqiCircle');

  aqiNum.textContent = data.currentAqi;
  aqiCategoryBadge.textContent = data.category;
  aqiCircle.style.background = data.categoryColor || '#7e0023';
  aqiCategoryBadge.style.background = data.categoryColor || '#7e0023';

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
    span.textContent = src;
    sourcesContainer.appendChild(span);
  });

  // Chart
  drawForecastChart(data.hourlyForecast);
}

// --- Canvas Hourly Forecast Chart ---
function drawForecastChart(hourly) {
  const canvas = document.getElementById('forecastChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);

  const padding = { top: 30, right: 30, bottom: 40, left: 50 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  // Draw Grid Lines
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.fillStyle = '#64748b';
  ctx.font = '10px Plus Jakarta Sans, sans-serif';

  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (graphHeight / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();

    const val = 500 - (i * 125);
    ctx.fillText(`${val} AQI`, 10, y + 3);
  }

  // Draw Optimal Window Highlight (Midday: 12:30 - 15:30)
  const windowStartX = padding.left + (graphWidth / (hourly.length - 1)) * 4;
  const windowEndX = padding.left + (graphWidth / (hourly.length - 1)) * 5.5;
  ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
  ctx.fillRect(windowStartX, padding.top, (windowEndX - windowStartX), graphHeight);

  ctx.fillStyle = '#10b981';
  ctx.fillText('Optimal Inversion Breakout Window (Safe Air)', windowStartX + 6, padding.top + 14);

  // Plot AQI Line
  ctx.beginPath();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#ef4444';

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

  // Draw Data Points & Labels
  points.forEach(pt => {
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ef4444';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Time Label
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(pt.hour, pt.x - 12, height - 15);
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

  routine.timeline.forEach(item => {
    const card = document.createElement('div');
    card.className = `timeline-item tag-${item.tagColor}`;

    let badgeClass = 'badge-moderate';
    if (item.riskLevel.includes('CRITICAL')) badgeClass = 'badge-critical';
    else if (item.riskLevel.includes('HIGH')) badgeClass = 'badge-high';
    else if (item.riskLevel.includes('SAFE') || item.riskLevel.includes('OPTIMAL')) badgeClass = 'badge-safe';

    const recsHtml = item.recommendations.map(r => `<li>${r}</li>`).join('');

    card.innerHTML = `
      <div class="item-top">
        <span class="item-time">⏰ ${item.time}</span>
        <span class="item-badge ${badgeClass}">${item.riskLevel.replace(/_/g, ' ')}</span>
      </div>
      <h3 class="item-activity">${item.activity} <span style="font-weight: normal; font-size: 12px; color: #94a3b8;">(${item.aqiRange})</span></h3>
      <ul class="rec-list">${recsHtml}</ul>
      <div class="low-emission-tip">
        <strong>🌱 Low-Emission Hack:</strong> ${item.lowEmissionTip}
      </div>
    `;
    container.appendChild(card);
  });

  // Special Notices
  const noticesBox = document.getElementById('familyAdvisoryBox');
  if (routine.familyAdvisory.specialNotices.length > 0) {
    noticesBox.innerHTML = `<strong>⚠️ Specific Household Alerts:</strong><br>` +
      routine.familyAdvisory.specialNotices.map(n => `• ${n}`).join('<br>');
    noticesBox.style.display = 'block';
  } else {
    noticesBox.style.display = 'none';
  }
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
      const card = document.createElement('div');
      card.className = 'hack-card';

      const stepsHtml = hack.steps.map(s => `<li>${s}</li>`).join('');

      card.innerHTML = `
        <div>
          <span class="hack-badge">${hack.badge}</span>
          <h3 class="hack-title">${hack.title}</h3>
          <p class="hack-summary">${hack.summary}</p>
          <div class="hack-science">
            <strong>🔬 The Science:</strong> ${hack.scienceExplanation}
          </div>
          <ol class="hack-steps-list">${stepsHtml}</ol>
        </div>
        <div class="low-emission-tip mt-2">
          <strong>Efficiency:</strong> ${hack.costComparison.cadrOutput} | <strong>Cost:</strong> ${hack.costComparison.diyBuild}
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

  // Display findings
  displayVisionReport(scenario.auditResult);
}

function handleImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const base64 = event.target.result;
    const img = document.getElementById('auditTargetImg');
    const caption = document.getElementById('imageCaption');

    img.src = base64;
    caption.textContent = `Custom User Photo: ${file.name}`;
    STATE.currentUploadedBase64 = base64;

    document.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
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
  scoreVal.style.color = result.score > 70 ? '#10b981' : (result.score > 40 ? '#f59e0b' : '#ef4444');

  document.getElementById('visionCategoryTitle').textContent = result.category;
  document.getElementById('visionCadrImpact').textContent = result.cadrImpact || '';

  const findingsList = document.getElementById('visionFindingsList');
  findingsList.innerHTML = result.findings.map(f => `<li>${f}</li>`).join('');

  const recsList = document.getElementById('visionRecommendationsList');
  recsList.innerHTML = result.recommendations.map(r => `<li>${r}</li>`).join('');
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

  // Append user bubble
  const userMsg = document.createElement('div');
  userMsg.className = 'message-user';
  userMsg.innerHTML = `<div class="message-bubble">${escapeHtml(query)}</div>`;
  messagesContainer.appendChild(userMsg);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  // Bot loading bubble
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
      botMsg.innerHTML = `<div class="message-bubble">${formatMarkdownToHtml(result.response)}</div>`;
      messagesContainer.appendChild(botMsg);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;

      // Automatically speak if voice is enabled
      if (STATE.voiceEnabled) {
        const textToSpeak = STATE.lang === 'hi' ? result.audioScripts.hi : result.audioScripts.en;
        speakText(textToSpeak);
      }
    }
  } catch (err) {
    botLoading.innerHTML = `<div class="message-bubble text-red-400">Connection error. Please try again.</div>`;
  }
}

// --- Audio & Web Speech API ---
function toggleAudio() {
  STATE.voiceEnabled = !STATE.voiceEnabled;
  const btn = document.getElementById('audioToggleBtn');
  const btnText = document.getElementById('voiceBtnText');

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

  // Attempt to select language voice
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

// --- Helpers ---
function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatMarkdownToHtml(md) {
  return md
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>')
    .replace(/• /g, '• ');
}

function updateLanguage() {
  const brandSub = document.querySelector('.brand-subtitle');
  if (STATE.lang === 'hi') {
    brandSub.textContent = 'सर्दियों की स्मॉग, दिनचर्या और स्वच्छ हवा का स्मार्ट साथी';
  } else {
    brandSub.textContent = 'GenAI Smog Defense, Routine Planner & Clean Air Companion';
  }
}
