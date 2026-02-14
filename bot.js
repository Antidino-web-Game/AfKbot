const mineflayer = require('mineflayer')
const { mineflayer: mineflayerViewer } = require('prismarine-viewer')
var AutoAuth = require('mineflayer-auto-auth')
const { pathfinder } = require('mineflayer-pathfinder');
const { setupAntikick } = require('./Modules/antikick');
var view = "off"

const bot = mineflayer.createBot({
  plugins: [AutoAuth],
  AutoAuth: 'aqwzsx',
  host: 'Antidino12-Rm7d.aternos.me', // server
  port: 39952,              // optional
  username: 'MyBot', 
  version: '1.21.4'        // or email for premium account
})
bot.loadPlugin(pathfinder);


bot.on('chat', (username, message) => {
  if (username === bot.username) return
  if (message === 'hi') bot.chat(`Hello ${username}!`)
})
const antikick = setupAntikick(bot, {
  interval: 10000,  // toutes les 3 minutes
  radius: 2,         // se déplace dans un rayon de 2 blocs
  sneak: false,
  jump: true,        // saute aussi
  rotate: true,      // tourne la tête
  debug: false        // affiche les logs
});
bot.on('spawn', () => {
  console.log('Spawned — I am ready!')
  if (view === 'off') {
    mineflayerViewer(bot, { port: 8080, firstPerson: false })
    view = 'on'
    console.log("view on")
  }
  antikick.start();
})