// server.js - Haawa Saathi Production Grade Server
// Implements enterprise-grade Security, HTTP Compression, Caching, and Error Handling
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const zlib = require('zlib');
const crypto = require('crypto');

const { CITIES_DATA } = require('./backend/data/aqi-data');
const { calculateImpact } = require('./backend/services/impact-engine');
const { generateRoutine } = require('./backend/services/routine-generator');
const { auditVisualTarget, PRESET_AUDIT_SCENARIOS } = require('./backend/services/vision-auditor');
const { IAQ_HACKS } = require('./backend/services/iaq-hacks');
const { handleAssistantChat } = require('./backend/services/ai-assistant');

const PORT = parseInt(process.env.PORT, 10) || 3000;
const PUBLIC_DIR = path.resolve(__dirname, 'public');

// --- MIME TYPES & CACHE CONFIG ---
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

// --- SECURITY: In-Memory Rate Limiter ---
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 200;
const ipRequests = new Map();

// Periodic cleanup of rate limit store
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of ipRequests.entries()) {
    if (now - data.startTime > RATE_LIMIT_WINDOW_MS) {
      ipRequests.delete(ip);
    }
  }
}, 30000);

function checkRateLimit(ip) {
  const now = Date.now();
  const clientData = ipRequests.get(ip);
  if (!clientData) {
    ipRequests.set(ip, { count: 1, startTime: now });
    return true;
  }
  if (now - clientData.startTime > RATE_LIMIT_WINDOW_MS) {
    ipRequests.set(ip, { count: 1, startTime: now });
    return true;
  }
  clientData.count++;
  return clientData.count <= MAX_REQUESTS_PER_WINDOW;
}

// --- SECURITY: Robust Security Headers ---
function setSecurityHeaders(res) {
  // Content Security Policy (strict yet compatible)
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com data:; " +
    "img-src 'self' data: https: blob:; " +
    "connect-src 'self' https:; " +
    "media-src 'self' data: blob:; " +
    "object-src 'none'; " +
    "base-uri 'self'; " +
    "frame-ancestors 'none';"
  );
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=(), payment=()');
}

// --- EFFICIENCY: Compression Helper (gzip / deflate) ---
function sendCompressedResponse(req, res, statusCode, contentType, bodyBuffer, extraHeaders = {}) {
  setSecurityHeaders(res);

  // Generate ETag for browser caching
  const etag = `"${crypto.createHash('md5').update(bodyBuffer).digest('hex')}"`;
  
  if (req.headers['if-none-match'] === etag) {
    res.writeHead(304, {
      ETag: etag,
      'Cache-Control': extraHeaders['Cache-Control'] || 'public, max-age=3600'
    });
    res.end();
    return;
  }

  const headers = {
    'Content-Type': contentType,
    ETag: etag,
    'Vary': 'Accept-Encoding',
    ...extraHeaders
  };

  const acceptEncoding = req.headers['accept-encoding'] || '';

  if (bodyBuffer.length > 512 && acceptEncoding.includes('gzip')) {
    zlib.gzip(bodyBuffer, (err, compressed) => {
      if (err) {
        res.writeHead(statusCode, headers);
        res.end(bodyBuffer);
        return;
      }
      headers['Content-Encoding'] = 'gzip';
      headers['Content-Length'] = compressed.length;
      res.writeHead(statusCode, headers);
      res.end(compressed);
    });
  } else if (bodyBuffer.length > 512 && acceptEncoding.includes('deflate')) {
    zlib.deflate(bodyBuffer, (err, compressed) => {
      if (err) {
        res.writeHead(statusCode, headers);
        res.end(bodyBuffer);
        return;
      }
      headers['Content-Encoding'] = 'deflate';
      headers['Content-Length'] = compressed.length;
      res.writeHead(statusCode, headers);
      res.end(compressed);
    });
  } else {
    headers['Content-Length'] = bodyBuffer.length;
    res.writeHead(statusCode, headers);
    res.end(bodyBuffer);
  }
}

// --- JSON Response Sender ---
function sendJson(req, res, statusCode, data, cacheControl = 'no-store') {
  const jsonString = JSON.stringify(data);
  const buffer = Buffer.from(jsonString, 'utf-8');
  sendCompressedResponse(req, res, statusCode, 'application/json; charset=utf-8', buffer, {
    'Cache-Control': cacheControl,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
}

// --- SECURITY: Strict JSON Body Parser with Payload Limit ---
function parseJsonBody(req, maxBytes = 2 * 1024 * 1024) { // 2MB max
  return new Promise((resolve, reject) => {
    let bytesReceived = 0;
    const chunks = [];

    req.on('data', chunk => {
      bytesReceived += chunk.length;
      if (bytesReceived > maxBytes) {
        reject(new Error('PAYLOAD_TOO_LARGE'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      try {
        const bodyStr = Buffer.concat(chunks).toString('utf-8');
        if (!bodyStr || !bodyStr.trim()) {
          resolve({});
          return;
        }
        // Protect against Prototype Pollution
        const parsed = JSON.parse(bodyStr, (key, value) => {
          if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
            return undefined;
          }
          return value;
        });
        resolve(parsed);
      } catch (err) {
        reject(new Error('INVALID_JSON'));
      }
    });

    req.on('error', reject);
  });
}

// --- SECURITY: Safe Static File Path Resolver (Blocks Path Traversal) ---
function resolveSafePath(reqPath) {
  // Normalize and decode URL
  let decodedPath = '';
  try {
    decodedPath = decodeURIComponent(reqPath);
  } catch (e) {
    return null;
  }

  // Strip null bytes and normalize slashes
  decodedPath = decodedPath.replace(/\0/g, '');
  if (decodedPath === '/' || decodedPath === '') {
    decodedPath = '/index.html';
  }

  const targetPath = path.resolve(PUBLIC_DIR, '.' + decodedPath);

  // Strict check: target must be inside PUBLIC_DIR
  if (!targetPath.startsWith(PUBLIC_DIR)) {
    return null; // Path Traversal detected!
  }

  return targetPath;
}

// --- HTTP SERVER ---
const server = http.createServer(async (req, res) => {
  const clientIp = req.socket.remoteAddress || '127.0.0.1';

  // Rate Limiting Check
  if (!checkRateLimit(clientIp)) {
    sendJson(req, res, 429, {
      success: false,
      error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests. Please slow down.' }
    });
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const { pathname, query } = parsedUrl;

  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    setSecurityHeaders(res);
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    });
    res.end();
    return;
  }

  try {
    // --- 1. HEALTH & METRICS API ---
    if (pathname === '/api/health') {
      sendJson(req, res, 200, {
        status: 'healthy',
        app: 'Haawa Saathi (हवा साथी)',
        version: '2.0.0',
        uptimeSeconds: Math.round(process.uptime()),
        memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        timestamp: new Date().toISOString()
      }, 'no-cache');
      return;
    }

    // --- 2. REAL-TIME AQI & INVERSION CONTEXT API ---
    if (pathname === '/api/aqi' && req.method === 'GET') {
      const cityKey = (query.city || 'delhi').toLowerCase().trim();
      const cityData = CITIES_DATA[cityKey] || CITIES_DATA['delhi'];
      sendJson(req, res, 200, {
        success: true,
        city: cityKey,
        data: cityData,
        availableCities: Object.keys(CITIES_DATA).map(k => ({
          id: k,
          name: CITIES_DATA[k].name,
          hindiName: CITIES_DATA[k].hindiName,
          aqi: CITIES_DATA[k].currentAqi,
          category: CITIES_DATA[k].category
        }))
      }, 'public, max-age=60'); // Cache for 60s
      return;
    }

    // --- 3. PERSONALIZED ROUTINE API ---
    if (pathname === '/api/routine' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const routine = generateRoutine(body);
      sendJson(req, res, 200, { success: true, routine });
      return;
    }

    // --- 4. IAQ HACKS & SUSTAINABLE ALTERNATIVES API ---
    if (pathname === '/api/iaq-hacks' && req.method === 'GET') {
      sendJson(req, res, 200, {
        success: true,
        count: IAQ_HACKS.length,
        hacks: IAQ_HACKS
      }, 'public, max-age=300'); // Cache for 5 mins
      return;
    }

    // --- 5. MULTIMODAL VISION AUDIT API ---
    if (pathname === '/api/vision-audit') {
      if (req.method === 'GET') {
        sendJson(req, res, 200, { success: true, scenarios: PRESET_AUDIT_SCENARIOS }, 'public, max-age=300');
        return;
      }
      if (req.method === 'POST') {
        const body = await parseJsonBody(req, 4 * 1024 * 1024); // 4MB for image base64
        const result = auditVisualTarget(body);
        sendJson(req, res, 200, { success: true, result });
        return;
      }
    }

    // --- 6. SCIENTIFIC PM2.5 DOSAGE & IMPACT API ---
    if (pathname === '/api/impact' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const impact = calculateImpact(body);
      sendJson(req, res, 200, { success: true, impact });
      return;
    }

    // --- 7. CONVERSATIONAL BILINGUAL AI ASSISTANT API ---
    if (pathname === '/api/chat' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      if (!body.query || typeof body.query !== 'string') {
        sendJson(req, res, 400, {
          success: false,
          error: { code: 'INVALID_QUERY', message: 'Query string is required' }
        });
        return;
      }
      const chatResult = handleAssistantChat(body.query.slice(0, 500), body.city, body.profile);
      sendJson(req, res, 200, { success: true, result: chatResult });
      return;
    }

    // --- 8. STATIC ASSET SERVING WITH PATH TRAVERSAL DEFENSE ---
    const safeFilePath = resolveSafePath(pathname);
    if (!safeFilePath) {
      sendJson(req, res, 403, {
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied: Invalid path traversal attempt.' }
      });
      return;
    }

    fs.stat(safeFilePath, (err, stats) => {
      if (err || !stats.isFile()) {
        // Fallback to index.html for SPA client routing
        const indexPath = path.join(PUBLIC_DIR, 'index.html');
        fs.readFile(indexPath, (err2, indexData) => {
          if (err2) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            return;
          }
          sendCompressedResponse(req, res, 200, 'text/html; charset=utf-8', indexData, {
            'Cache-Control': 'no-cache'
          });
        });
        return;
      }

      const ext = path.extname(safeFilePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      const cacheControl = (ext === '.html') ? 'no-cache' : 'public, max-age=86400, immutable';

      fs.readFile(safeFilePath, (errRead, fileData) => {
        if (errRead) {
          sendJson(req, res, 500, {
            success: false,
            error: { code: 'FILE_READ_ERROR', message: 'Failed to read asset' }
          });
          return;
        }
        sendCompressedResponse(req, res, 200, contentType, fileData, {
          'Cache-Control': cacheControl
        });
      });
    });

  } catch (error) {
    if (error.message === 'PAYLOAD_TOO_LARGE') {
      sendJson(req, res, 413, {
        success: false,
        error: { code: 'PAYLOAD_TOO_LARGE', message: 'Uploaded file or payload exceeds 2MB limit.' }
      });
      return;
    }
    if (error.message === 'INVALID_JSON') {
      sendJson(req, res, 400, {
        success: false,
        error: { code: 'MALFORMED_JSON', message: 'Request body must be valid JSON.' }
      });
      return;
    }
    console.error('[Haawa Saathi Error]', error);
    sendJson(req, res, 500, {
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected internal error occurred.' }
    });
  }
});

// --- GRACEFUL SHUTDOWN ---
const serverInstance = server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Haawa Saathi v2.0] Production server listening on http://127.0.0.1:${PORT}`);
});

function gracefulShutdown(signal) {
  console.log(`\nReceived ${signal}. Gracefully terminating Haawa Saathi server...`);
  serverInstance.close(() => {
    console.log('Server closed. Process exit.');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 5000);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

module.exports = server;
