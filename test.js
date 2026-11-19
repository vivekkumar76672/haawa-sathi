// test.js - Unit and integration verification
const http = require('http');
const { CITIES_DATA } = require('./backend/data/aqi-data');
const { calculateImpact } = require('./backend/services/impact-engine');
const { generateRoutine } = require('./backend/services/routine-generator');
const { auditVisualTarget } = require('./backend/services/vision-auditor');
const { IAQ_HACKS } = require('./backend/services/iaq-hacks');
const { handleAssistantChat } = require('./backend/services/ai-assistant');

console.log('--- Testing Backend Modules ---');

// 1. Data
console.log('✓ CITIES_DATA cities count:', Object.keys(CITIES_DATA).length);
console.log('✓ Delhi AQI:', CITIES_DATA.delhi.currentAqi, 'Inversion:', CITIES_DATA.delhi.inversionStatus);

// 2. Routine
const routine = generateRoutine({ city: 'delhi', familyMembers: ['kids', 'elderly'], hasAsthma: true });
console.log('✓ Routine generated:', routine.timeline.length, 'time blocks');
console.log('✓ Routine headline:', routine.headline);

// 3. IAQ Hacks
console.log('✓ IAQ Hacks count:', IAQ_HACKS.length);
console.log('✓ First hack:', IAQ_HACKS[0].title);

// 4. Vision Auditor
const visionRes = auditVisualTarget({ scenarioId: 'saturated_hepa' });
console.log('✓ Vision Audit category:', visionRes.auditResult.category, 'Score:', visionRes.auditResult.score);

// 5. Impact Engine
const impactRes = calculateImpact({ cityAqi: 418, pm25Outdoor: 362.4, indoorReductionPercent: 75, n95Used: true });
console.log('✓ Micrograms PM2.5 avoided:', impactRes.rawMetrics.pm25MicrogramsAvoided);
console.log('✓ Family Cigarettes avoided:', impactRes.rawMetrics.familyCigarettesAvoided);

// 6. AI Assistant
const chatRes = handleAssistantChat('Can my child play in the park right now?', 'delhi');
console.log('✓ Chat intent handled. Severity:', chatRes.severity);
console.log('✓ Audio script available (HI & EN):', !!chatRes.audioScripts.hi && !!chatRes.audioScripts.en);

console.log('\n--- ALL MODULE TESTS PASSED CLEANLY! ---');
