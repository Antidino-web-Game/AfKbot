const mineflayer = require('mineflayer')
const { pathfinder, Movements } = require('mineflayer-pathfinder')
const inventoryViewer = require('mineflayer-web-inventory')
const startWebPanel = require('./web-panel')

function createBot() {

  const bot = mineflayer.createBot({
    host: 'playnoctissmp.falix.pro',
    port: 28665,
    username: 'lebg95',
    version: '1.21.4'
  })

  bot.loadPlugin(pathfinder)
  inventoryViewer(bot)

  bot.once('spawn', () => {
    console.log('✅ Bot connecté')
    console.log('📌 Version:', bot.version)

    const mcData = require('minecraft-data')(bot.version)
    bot.pathfinder.setMovements(new Movements(bot, mcData))

    require('./behaviors/human-behavior')(bot)
    require('./behaviors/auto-defense')(bot)
    require('./behaviors/console-control')(bot)
    
    startWebPanel(bot)
  })

  bot.on('error', err => {
    console.log('❌ Erreur:', err.message)
    if (err.code === 'ECONNRESET') {
      console.log('⚠️  Connexion réinitialisée. Tentative de reconnexion...')
    }
  })
  bot.on('kicked', r => console.log('⚠ Kick:', r))

  bot.on('end', () => {
    console.log('🔄 Reconnect dans 5s')
    setTimeout(createBot, 5000)
  })
}

createBot()
