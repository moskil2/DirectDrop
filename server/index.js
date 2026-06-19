'use strict';

const express   = require('express');
const { WebSocketServer } = require('ws');
const archiver  = require('archiver');
const http      = require('http');
const { PassThrough } = require('stream');
const os        = require('os');
const path      = require('path');
const fs        = require('fs');

const PORT = 8080;

// ── server setup ──────────────────────────────────────────────────────────────
const app    = express();
const server = http.createServer(app);
const wss    = new WebSocketServer({ server, path: '/ws' });

// ── state ─────────────────────────────────────────────────────────────────────
let phoneWs         = null;       // single phone connection
let registeredFiles = [];         // [{ name, size, type }]
const pending       = new Map();  // reqId → PassThrough
let nextReqId       = 1;
const knownClients  = new Set();  // unique downloader IPs
let serverStopped   = false;      // set when phone signals shutdown

// ── helpers ───────────────────────────────────────────────────────────────────
function getLocalIP() {
  for (const ifaces of Object.values(os.networkInterfaces())) {
    for (const iface of ifaces) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return '127.0.0.1';
}

function phoneReady() {
  return phoneWs && phoneWs.readyState === 1 /* OPEN */;
}

function phoneSend(obj) {
  if (phoneReady()) phoneWs.send(JSON.stringify(obj));
}

// ── Binary frame: [4B reqId uint32BE][1B flags: 0x01=last][...data] ──────────
function onBinaryFrame(buf) {
  if (buf.length < 5) return;
  const reqId  = buf.readUInt32BE(0);
  const isLast = (buf[4] & 0x01) !== 0;
  const chunk  = buf.slice(5);

  const stream = pending.get(reqId);
  if (!stream) return;
  if (chunk.length > 0) stream.write(chunk);
  if (isLast) { stream.end(); pending.delete(reqId); }
}

// ── CORS (needed for Vite dev server on a different port) ────────────────────
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// ── Serve built React PWA (production) ───────────────────────────────────────
const distPath = path.join(__dirname, '../app/dist');
if (fs.existsSync(distPath)) {
  app.use('/pwa', express.static(distPath));
}

// ── Serve PC download page ────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── REST API ──────────────────────────────────────────────────────────────────
app.get('/api/info', (req, res) => {
  res.json({
    ip:        getLocalIP(),
    port:      PORT,
    connected: phoneReady(),
    clients:   knownClients.size,
    files:     registeredFiles,
    stopped:   serverStopped,
  });
});

app.post('/api/shutdown-notice', (req, res) => {
  serverStopped = true;
  res.json({ ok: true });
});

// Single-file download
app.get('/api/download/:name', (req, res) => {
  const name = decodeURIComponent(req.params.name);
  const info = registeredFiles.find(f => f.name === name);

  if (!info)         return res.status(404).json({ error: 'Plik nie istnieje' });
  if (!phoneReady()) return res.status(503).json({ error: 'Telefon offline' });

  const reqId  = nextReqId++;
  const stream = new PassThrough();
  pending.set(reqId, stream);

  res.setHeader('Content-Disposition',
    `attachment; filename*=UTF-8''${encodeURIComponent(name)}`);
  res.setHeader('Content-Type',   'application/octet-stream');
  res.setHeader('Content-Length', info.size);
  res.setHeader('Cache-Control',  'no-store');
  stream.pipe(res);

  // tell phone to start streaming
  phoneSend({ type: 'request', reqId, filename: name });

  // track unique downloaders
  const clientIP = req.socket.remoteAddress;
  const isNew = !knownClients.has(clientIP);
  knownClients.add(clientIP);
  phoneSend({ type: 'clientStatus', clients: knownClients.size, isNew });

  req.on('close', () => {
    if (!res.writableEnded) {
      stream.destroy();
      pending.delete(reqId);
      phoneSend({ type: 'cancel', reqId });
    }
  });
});

// Download all as ZIP
app.get('/api/download-all', (req, res) => {
  if (!phoneReady())           return res.status(503).end('Telefon offline');
  if (!registeredFiles.length) return res.status(404).end('Brak plików');

  res.setHeader('Content-Disposition', 'attachment; filename="DirectDrop.zip"');
  res.setHeader('Content-Type',  'application/zip');
  res.setHeader('Cache-Control', 'no-store');

  const zip = archiver('zip', { zlib: { level: 0 } }); // no compression for speed
  zip.pipe(res);

  const clientIP = req.socket.remoteAddress;
  const isNew = !knownClients.has(clientIP);
  knownClients.add(clientIP);
  phoneSend({ type: 'clientStatus', clients: knownClients.size, isNew });

  let i = 0;
  const sendNext = () => {
    if (i >= registeredFiles.length) { zip.finalize(); return; }
    const file   = registeredFiles[i++];
    const reqId  = nextReqId++;
    const stream = new PassThrough();
    pending.set(reqId, stream);
    zip.append(stream, { name: file.name });
    phoneSend({ type: 'request', reqId, filename: file.name });
    stream.once('end', sendNext);
  };
  sendNext();

  res.on('close', () => {
    // abort remaining pending streams
    pending.forEach(s => s.destroy());
  });
});

// ── WebSocket (phone connection) ──────────────────────────────────────────────
wss.on('connection', (ws, req) => {
  if (phoneWs) {
    // only one phone at a time; close old connection
    phoneWs.terminate();
  }
  phoneWs = ws;
  serverStopped = false;
  console.log(`📱 Telefon połączony  ${req.socket.remoteAddress}`);

  ws.on('message', (data, isBinary) => {
    if (isBinary) {
      onBinaryFrame(Buffer.isBuffer(data) ? data : Buffer.from(data));
    } else {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'register') {
          registeredFiles = msg.files || [];
          knownClients.clear();
          console.log(`📁 Zarejestrowano ${registeredFiles.length} plików:`);
          registeredFiles.forEach(f =>
            console.log(`   • ${f.name}  (${(f.size / 1e6).toFixed(1)} MB)`));
        }
      } catch { /* ignore malformed JSON */ }
    }
  });

  ws.on('close', () => {
    console.log('📱 Telefon rozłączony');
    phoneWs = null;
    registeredFiles = [];
    knownClients.clear();
    pending.forEach(s => s.destroy());
    pending.clear();
  });

  ws.on('error', err => console.error('WS error:', err.message));
});

// ── start ─────────────────────────────────────────────────────────────────────
server.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIP();
  console.log(`\n✅  DirectDrop Server`);
  console.log(`   📱 Otwórz PWA na telefonie:  http://${ip}:5173`);
  console.log(`   💻 Strona pobierania na PC:   http://${ip}:${PORT}\n`);
});
