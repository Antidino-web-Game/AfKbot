module.exports = `
<!DOCTYPE html>
<html>
<head>
  <title>Bot Panel - Control Total</title>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <div class="header">
    <h1>
      <span class="status-indicator"></span>
      🤖 Bot Control Panel
    </h1>
    <div style="font-size: 14px; color: #999;">
      Connected to: <span style="color: #4da6ff;">Antidino12-Rm7d.aternos.me</span>
    </div>
  </div>
  
  <div class="main-container">
    
    <!-- COLONNE GAUCHE -->
    <div class="left-panel">
      
      <div class="panel">
        <h3>❤️ Statistiques</h3>
        <div class="health-bar">
          <div class="health-fill" id="health-bar">
            <span id="health-text">20 HP</span>
          </div>
        </div>
        <div class="health-bar">
          <div class="health-fill hunger-fill" id="hunger-bar">
            <span id="hunger-text">20 🍖</span>
          </div>
        </div>
        <div class="stat-row">
          <span class="stat-label">Position</span>
          <span class="stat-value" id="position">0, 0, 0</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Dimension</span>
          <span class="stat-value" id="dimension">overworld</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Biome</span>
          <span class="stat-value" id="biome">Unknown</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Time</span>
          <span class="stat-value" id="time">0:00</span>
        </div>
      </div>
      
      <div class="panel">
        <h3>🍗 Nourriture</h3>
        <div class="food-list" id="food-list">
          <div style="color: #666; text-align: center; padding: 20px;">
            Aucune nourriture
          </div>
        </div>
      </div>
      
      <div class="panel">
        <h3>👥 Entités proches</h3>
        <div class="entities-list" id="entities-list">
          <div style="color: #666; text-align: center; padding: 10px;">
            Aucune entité
          </div>
        </div>
      </div>
      
    </div>
    
    <!-- COLONNE CENTRALE -->
    <div class="center-panel">
      
      <div class="fps-view">
        <canvas id="fps-canvas"></canvas>
        <div class="crosshair"></div>
        <div class="fps-overlay">
          👁️ Vue à la première personne
        </div>
        <div class="bot-info">
          <div>Yaw: <span id="bot-yaw">0.0</span>°</div>
          <div>Pitch: <span id="bot-pitch">0.0</span>°</div>
          <div>Regard: <span id="bot-look">N</span></div>
        </div>
      </div>
      
      <div class="inventory-display">
        <h3 style="color: #4da6ff; margin-bottom: 10px; font-size: 14px;">🎒 Inventaire (Cliquez pour équiper/utiliser)</h3>
        <div class="inventory-grid" id="inventory-grid"></div>
      </div>
      
    </div>
    
    <!-- COLONNE DROITE -->
    <div class="right-panel">
      
      <div class="chat-panel">
        <h3>💬 Chat In-Game</h3>
        <div id="game-chat"></div>
        <input type="text" id="chat-input" placeholder="Message ou commande..." onkeypress="if(event.key==='Enter')sendChat()">
        <button class="primary" onclick="sendChat()">📤 Envoyer</button>
      </div>
      
      <div class="panel">
        <h3>⚡ Actions rapides</h3>
        <div class="action-grid">
          <button onclick="quickAction('sneak')" title="Se baisser">🚶 Sneak</button>
          <button onclick="quickAction('jump')" title="Sauter">⬆️ Jump</button>
          <button onclick="quickAction('sprint')" title="Sprint">🏃 Sprint</button>
          <button onclick="quickAction('attack')" title="Attaquer">⚔️ Attack</button>
          <button onclick="quickAction('place')" title="Placer">📦 Place</button>
          <button onclick="quickAction('dig')" title="Miner">⛏️ Dig</button>
        </div>
      </div>
      
      <div class="panel">
        <h3>🌐 Commandes Internet</h3>
        <div class="command-buttons">
          <button onclick="webCommand('google')" title="Chercher sur Google">🔍 Google</button>
          <button onclick="webCommand('youtube')" title="YouTube">📺 YouTube</button>
          <button onclick="webCommand('wiki')" title="Wikipedia">📖 Wiki</button>
          <button onclick="webCommand('reddit')" title="Reddit">🔴 Reddit</button>
          <button onclick="webCommand('github')" title="GitHub">💻 GitHub</button>
          <button onclick="webCommand('weather')" title="Météo">🌤️ Weather</button>
          <button onclick="webCommand('news')" title="Actualités">📰 News</button>
          <button onclick="webCommand('translate')" title="Traduction">🌍 Translate</button>
        </div>
      </div>
      
      <div class="panel">
        <h3>🛡️ Armure</h3>
        <div class="command-buttons">
          <button onclick="equipArmor('diamond')">💎 Diamond</button>
          <button onclick="equipArmor('iron')">⚙️ Iron</button>
          <button onclick="equipArmor('golden')">🏆 Gold</button>
          <button onclick="equipArmor('netherite')">🔥 Netherite</button>
        </div>
      </div>
      
      <div class="panel">
        <h3>⚙️ Contrôles</h3>
        <button class="success" onclick="sendCommand('/list')">👥 Liste joueurs</button>
        <button class="success" onclick="sendCommand('/spawn')">🏠 Spawn</button>
        <button class="danger" onclick="sendCommand('/kill')">💀 Kill</button>
      </div>
      
    </div>
    
  </div>

  <script src="/socket.io/socket.io.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script src="/client.js"></script>
</body>
</html>
`
