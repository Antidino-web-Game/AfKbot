/**
 * server.js — Panel AfKBot
 * Express + Socket.io → http://localhost:3000
 * Prismarine-viewer   → http://localhost:8080 (iframe dans le panel)
 *
 * npm install express socket.io
 * node server.js
 */

const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const path       = require('path');
const botModule  = require('./bot');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// ── Injecte l'émetteur Socket.io dans bot.js ───────────────────────
const chatHistory = [];
botModule.setEmitter((event, data) => {
  if (event === 'chat') {
    chatHistory.push(data);
    if (chatHistory.length > 200) chatHistory.shift();
  }
  io.emit(event, data);
});

// ── Routes API ────────────────────────────────────────────────────
app.post('/api/start',    (req, res) => { botModule.createBot(req.body);               res.json({ ok: true }); });
app.post('/api/stop',     (req, res) => { botModule.destroyBot();                      res.json({ ok: true }); });
app.post('/api/chat',     (req, res) => { res.json({ ok: botModule.sendChat(req.body.message) }); });
app.post('/api/antikick', (req, res) => { botModule.toggleAntikick(req.body.enabled);  res.json({ ok: true }); });
app.get('/api/status',    (req, res) => { res.json(botModule.getStatus()); });
app.get('/api/history',   (req, res) => { res.json({ history: chatHistory }); });

// ── Socket.io ─────────────────────────────────────────────────────
io.on('connection', (socket) => {
  // État actuel au nouveau client
  socket.emit('status', botModule.getStatus());
  chatHistory.forEach(msg => socket.emit('chat', msg));

  socket.on('start',    (cfg) => botModule.createBot(cfg));
  socket.on('stop',     ()    => botModule.destroyBot());
  socket.on('chat',     (msg) => botModule.sendChat(msg));
  socket.on('antikick', (val) => botModule.toggleAntikick(val));
});

// ── Démarrage ────────────────────────────────────────────────────
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`╔══════════════════════════════════════════╗`);
  console.log(`║  AfKBot Panel  →  http://localhost:${PORT}   ║`);
  console.log(`║  Viewer 3D     →  http://localhost:8080  ║`);
  console.log(`╚══════════════════════════════════════════╝`);
});
