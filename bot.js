/**
 * bot.js — AfKBot avec intégration panel web
 * Prismarine-viewer sur port 8080 (iframe dans le panel)
 * Socket.io pour communication temps réel avec le panel
 */

const mineflayer  = require('mineflayer');
const { mineflayer: mineflayerViewer } = require('prismarine-viewer');
const AutoAuth    = require('mineflayer-auto-auth');
const { pathfinder } = require('mineflayer-pathfinder');
const { setupAntikick } = require('./Modules/antikick');

let viewerStarted = false;

// ── Config par défaut (peut être écrasée par le panel) ─────────────
let config = {
  host:     'playnoctissmp.falix.pro',
  port:     28665,
  username: 'lebg95',
  version:  '1.21.4',
  password: 'aqwzsx',
};

let bot       = null;
let antikick  = null;

// ── Référence vers l'émetteur Socket.io (injecté par server.js) ────
let _emit = () => {};
const setEmitter = (fn) => { _emit = fn; };

const addChat = (type, text) => {
  const msg = { type, text, time: new Date().toLocaleTimeString('fr-FR') };
  _emit('chat', msg);
  return msg;
};

// ── Création du bot ────────────────────────────────────────────────
function createBot(cfg = {}) {
  if (bot) destroyBot();

  config = { ...config, ...cfg };
  _emit('status', { status: 'connecting', config });
  addChat('system', `🔄 Connexion à ${config.host}:${config.port}...`);

  bot = mineflayer.createBot({
    plugins:  [AutoAuth],
    AutoAuth: config.password,
    host:     config.host,
    port:     parseInt(config.port),
    username: config.username,
    version:  config.version,
  });

  bot.loadPlugin(pathfinder);

  // Anti-kick
  antikick = setupAntikick(bot, {
    interval: 100,
    radius:   2,
    sneak:    false,
    jump:     true,
    rotate:   true,
    debug:    false,
  });

  // ── Events ──────────────────────────────────────────────────────
  bot.once('spawn', () => {
    addChat('system', `✅ Connecté en tant que ${config.username} sur ${config.host}`);
    _emit('status', { status: 'online', config, antikick: true });

    // Prismarine-viewer (une seule fois par processus)
    if (!viewerStarted) {
      mineflayerViewer(bot, { port: 8080, firstPerson: false });
      viewerStarted = true;
      addChat('system', '🎥 Viewer 3D démarré sur le port 8080');
    }

    antikick.start();
    startPositionUpdater();
  });

  bot.on('chat', (username, message) => {
    if (username === bot.username) return;
    addChat('chat', `<${username}> ${message}`);
    if (message === 'hi') bot.chat(`Hello ${username}!`);
  });

  bot.on('message', (jsonMsg) => {
    const text = jsonMsg.toString();
    if (text) addChat('server', text);
  });

  bot.on('kicked', (reason) => {
    addChat('error', `❌ Kick : ${reason}`);
    cleanup();
  });

  bot.on('error', (err) => {
    addChat('error', `⚠️ Erreur : ${err.message}`);
  });

  bot.on('end', () => {
    addChat('system', '🔌 Déconnecté');
    cleanup();
  });
}

// ── Mise à jour position ───────────────────────────────────────────
let posTimer = null;
function startPositionUpdater() {
  if (posTimer) clearInterval(posTimer);
  posTimer = setInterval(() => {
    if (!bot || !bot.entity) return;
    try {
      const pos = bot.entity.position;
      const data = {
        x:      parseFloat(pos.x.toFixed(2)),
        y:      parseFloat(pos.y.toFixed(2)),
        z:      parseFloat(pos.z.toFixed(2)),
        yaw:    parseFloat((bot.entity.yaw   * 180 / Math.PI).toFixed(1)),
        pitch:  parseFloat((bot.entity.pitch * 180 / Math.PI).toFixed(1)),
        health: bot.health ?? 20,
        food:   bot.food   ?? 20,
        world:  bot.game?.dimension ?? 'overworld',
      };
      _emit('position', data);

      // Entités proches
      const entities = Object.values(bot.entities)
        .filter(e => e !== bot.entity)
        .map(e => ({
          name: e.name || e.username || e.type,
          type: e.type,
          dist: parseFloat(e.position.distanceTo(pos).toFixed(1)),
        }))
        .filter(e => e.dist < 30)
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 20);
      _emit('entities', entities);
    } catch(e) {}
  }, 500);
}

// ── Destroy / cleanup ─────────────────────────────────────────────
function destroyBot() {
  if (posTimer)    { clearInterval(posTimer); posTimer = null; }
  if (antikick)    { antikick.stop(); antikick = null; }
  if (bot)         { try { bot.quit('Arrêt manuel'); } catch(e) {} bot = null; }
  _emit('status', { status: 'offline', config, antikick: false });
}

function cleanup() {
  if (posTimer)   { clearInterval(posTimer); posTimer = null; }
  if (antikick)   { antikick.stop(); antikick = null; }
  bot = null;
  _emit('status', { status: 'offline', config, antikick: false });
}

// ── Contrôles exposés ─────────────────────────────────────────────
function sendChat(message) {
  if (!bot) return false;
  bot.chat(message);
  addChat('sent', `[Envoyé] ${message}`);
  return true;
}

function toggleAntikick(enabled) {
  if (!antikick) return;
  enabled ? antikick.start() : antikick.stop();
  addChat('system', `⚙️ Anti-kick ${enabled ? 'activé' : 'désactivé'}`);
}

function getStatus() {
  return {
    status:   bot ? 'online' : 'offline',
    config,
    antikick: antikick !== null,
  };
}

module.exports = { createBot, destroyBot, sendChat, toggleAntikick, setEmitter, getStatus };