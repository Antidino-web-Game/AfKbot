const { Movements, goals } = require('mineflayer-pathfinder');
const { GoalNear } = goals;

/**
 * Module Anti-Kick pour Mineflayer
 * Utilise mineflayer-pathfinder pour se déplacer automatiquement
 * et éviter d'être kick pour inactivité (AFK).
 *
 * @param {import('mineflayer').Bot} bot - L'instance du bot mineflayer
 * @param {Object} [options] - Options de configuration
 * @param {number} [options.interval=240000] - Intervalle en ms entre chaque mouvement (défaut: 4 min)
 * @param {number} [options.radius=3] - Rayon de déplacement autour de la position initiale
 * @param {boolean} [options.sneak=false] - Si true, le bot sneake lors du mouvement
 * @param {boolean} [options.jump=false] - Si true, le bot saute aléatoirement
 * @param {boolean} [options.rotate=true] - Si true, le bot tourne la tête aléatoirement
 * @param {boolean} [options.debug=false] - Si true, affiche les logs de debug
 */
function setupAntikick(bot, options = {}) {
  const config = {
    interval: options.interval ?? 240000,   // 4 minutes par défaut
    radius:   options.radius   ?? 3,
    sneak:    options.sneak    ?? false,
    jump:     options.jump     ?? false,
    rotate:   options.rotate   ?? true,
    debug:    options.debug    ?? false,
  };

  let antikickTimer = null;
  let isMoving = false;

  const log = (...args) => {
    if (config.debug) console.log('[AntiKick]', ...args);
  };

  /**
   * Génère un offset aléatoire entre -radius et +radius
   */
  const randomOffset = () => (Math.random() * 2 - 1) * config.radius;

  /**
   * Rotation aléatoire de la tête du bot
   */
  const randomRotate = () => {
    const yaw   = Math.random() * Math.PI * 2 - Math.PI;
    const pitch = (Math.random() - 0.5) * Math.PI;
    bot.look(yaw, pitch, true);
    log(`Rotation vers yaw=${yaw.toFixed(2)}, pitch=${pitch.toFixed(2)}`);
  };

  /**
   * Effectue un micro-déplacement aléatoire via pathfinder
   */
  const doMovement = async () => {
    if (isMoving) return;
    isMoving = true;

    try {
      const pos = bot.entity.position;
      const targetX = pos.x + randomOffset();
      const targetZ = pos.z + randomOffset();

      log(`Déplacement vers (${targetX.toFixed(2)}, ${pos.y.toFixed(2)}, ${targetZ.toFixed(2)})`);

      // Configuration des mouvements pathfinder
      const movements = new Movements(bot);
      movements.allowSprinting = false;
      movements.canDig = false;
      bot.pathfinder.setMovements(movements);

      // Active le sneak si configuré
      if (config.sneak) bot.setControlState('sneak', true);

      // Déplacement vers la cible
      await bot.pathfinder.goto(new GoalNear(targetX, pos.y, targetZ, 1));

      // Désactive le sneak
      if (config.sneak) bot.setControlState('sneak', false);

      // Saut aléatoire si activé
      if (config.jump) {
        bot.setControlState('jump', true);
        setTimeout(() => bot.setControlState('jump', false), 300);
        log('Saut effectué');
      }

      // Rotation si activée
      if (config.rotate) {
        randomRotate();
      }

      log('Mouvement anti-kick effectué avec succès');
    } catch (err) {
      log(`Erreur lors du déplacement: ${err.message}`);
      // Stop pathfinder proprement en cas d'erreur
      bot.pathfinder.stop();
      if (config.sneak) bot.setControlState('sneak', false);
    } finally {
      isMoving = false;
    }
  };

  /**
   * Démarre le système anti-kick
   */
  const start = () => {
    if (antikickTimer) {
      log('Anti-kick déjà actif');
      return;
    }
    antikickTimer = setInterval(doMovement, config.interval);
    log(`Anti-kick démarré (intervalle: ${config.interval}ms)`);
  };

  /**
   * Arrête le système anti-kick
   */
  const stop = () => {
    if (antikickTimer) {
      clearInterval(antikickTimer);
      antikickTimer = null;
      bot.pathfinder.stop();
      log('Anti-kick arrêté');
    }
  };

  /**
   * Vérifie si l'anti-kick est actif
   */
  const isActive = () => antikickTimer !== null;

  // Démarrage automatique quand le bot spawn
  bot.once('spawn', () => {
    log('Bot spawné, démarrage de l\'anti-kick...');
    start();
  });

  // Nettoyage lors de la déconnexion
  bot.on('end', () => {
    stop();
  });

  // Gestion des erreurs du bot
  bot.on('error', (err) => {
    log(`Erreur bot détectée: ${err.message}`);
  });

  // Retourne les méthodes de contrôle
  return { start, stop, isActive };
}

module.exports = { setupAntikick };