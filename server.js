// server.js - Haawa Saathi Backend Server
// Built with pure Node.js (Zero external npm dependencies required)

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const { CITIES_DATA } = require('./backend/data/aqi-data');
const { calculateImpact } = require('./backend/services/impact-engine');
const { generateRoutine } = require('./backend/services/routine-generator');
const { auditVisualTarget, PRESET_AUDIT_SCENARIOS } = require('./backend/services/vision-auditor');
const { IAQ_HACKS } = require('./backend/services/iaq-hacks');
const { handleAssistantChat } = require('./backend/services/ai-assistant');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// MIME types for static assets
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Helper to parse JSON body
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 5 * 1024 * 1024) { // 5MB limit
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

// Send JSON response
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data, null, 2));
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const { pathname, query } = parsedUrl;

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  // --- API Routes ---
  if (pathname === '/api/health') {
    sendJson(res, 200, { status: 'healthy', app: 'Haawa Saathi (हवा साथी)', timestamp: new Date().toISOString() });
    return;
  }

  // 1. Live Smog & Inversion Context API
  if (pathname === '/api/aqi') {
    const cityKey = (query.city || 'delhi').toLowerCase();
    const cityData = CITIES_DATA[cityKey] || CITIES_DATA['delhi'];
    sendJson(res, 200, {
      success: true,
      city: cityKey,
      data: cityData,
      availableCities: Object.keys(CITIES_DATA).map(k => ({
        id: k,
        name: CITIES_DATA[k].name,
        hindiName: CITIES_DATA[k].hindiName,
        aqi: CITIES_DATA[k].currentAqi
      }))
    });
    return;
  }

  // 2. Personalized Daily Routine API
  if (pathname === '/api/routine' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const routine = generateRoutine(body);
      sendJson(res, 200, { success: true, routine });
    } catch (e) {
      sendJson(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // 3. IAQ Hacks & DIY Hub API
  if (pathname === '/api/iaq-hacks') {
    sendJson(res, 200, { success: true, count: IAQ_HACKS.length, hacks: IAQ_HACKS });
    return;
  }

  // 4. Multimodal Vision Audit API
  if (pathname === '/api/vision-audit') {
    if (req.method === 'GET') {
      sendJson(res, 200, { success: true, scenarios: PRESET_AUDIT_SCENARIOS });
      return;
    }
    if (req.method === 'POST') {
      try {
        const body = await parseJsonBody(req);
        const result = auditVisualTarget(body);
        sendJson(res, 200, { success: true, result });
      } catch (e) {
        sendJson(res, 500, { success: false, error: e.message });
      }
      return;
    }
  }

  // 5. Direct Health Dosage & Impact API
  if (pathname === '/api/impact' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const impact = calculateImpact(body);
      sendJson(res, 200, { success: true, impact });
    } catch (e) {
      sendJson(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // 6. Conversational AI Assistant API
  if (pathname === '/api/chat' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const chatResult = handleAssistantChat(body.query, body.city, body.profile);
      sendJson(res, 200, { success: true, result: chatResult });
    } catch (e) {
      sendJson(res, 500, { success: false, error: e.message });
    }
    return;
  }

  // --- Static Asset Serving ---
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Fallback to index.html for SPA routing
        fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (err2, spaContent) => {
          if (err2) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(spaContent);
          }
        });
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Haawa Saathi] Server running on http://127.0.0.1:${PORT}`);
});
